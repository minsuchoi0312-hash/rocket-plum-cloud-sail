import { tr } from "./i18n/core.ts";
import { ippMedia, type OfficePaper } from "./office-job.ts";
function concat(parts: Uint8Array[]) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function textAttr(tag: number, name: string, value: string) {
  const n = new TextEncoder().encode(name);
  const v = new TextEncoder().encode(value);
  const out = new Uint8Array(5 + n.length + v.length);
  const view = new DataView(out.buffer);
  out[0] = tag;
  view.setUint16(1, n.length);
  out.set(n, 3);
  view.setUint16(3 + n.length, v.length);
  out.set(v, 5 + n.length);
  return out;
}

function intAttr(name: string, value: number) {
  const n = new TextEncoder().encode(name);
  const out = new Uint8Array(1 + 2 + n.length + 2 + 4);
  const view = new DataView(out.buffer);
  out[0] = 0x21;
  view.setUint16(1, n.length);
  out.set(n, 3);
  view.setUint16(3 + n.length, 4);
  view.setInt32(5 + n.length, value);
  return out;
}

/** 기기마다 받는 IPP 판과 주소가 다르다: 최신(2.0 · /ipp/print) → 1.1 → 코니카 · 옛 기기(1.1 · /ipp) → 1.1 · / */
export const IPP_TRIES: ReadonlyArray<{ major: number; minor: number; path: string }> = [
  { major: 2, minor: 0, path: "/ipp/print" },
  { major: 1, minor: 1, path: "/ipp/print" },
  { major: 1, minor: 1, path: "/ipp" },
  { major: 1, minor: 1, path: "/" },
];

type IppOptions = { copies: number; duplex: "simplex" | "long" | "short"; paper: OfficePaper; gray: boolean };

export function printJobPacket(host: string, pdf: Uint8Array, options: IppOptions, attempt: { major: number; minor: number; path: string } = IPP_TRIES[0]) {
  const header = new Uint8Array(8);
  const view = new DataView(header.buffer);
  header[0] = attempt.major;
  header[1] = attempt.minor;
  view.setUint16(2, 0x0002);
  view.setUint32(4, 1);
  const old = attempt.major < 2;
  const media = ippMedia(options.paper, old);
  const sides = options.duplex === "long" ? "two-sided-long-edge" : options.duplex === "short" ? "two-sided-short-edge" : "one-sided";
  const attrs = concat([
    new Uint8Array([0x01]),
    textAttr(0x47, "attributes-charset", "utf-8"),
    textAttr(0x48, "attributes-natural-language", "ko"),
    textAttr(0x45, "printer-uri", `ipp://${host}:631${attempt.path}`),
    textAttr(0x42, "requesting-user-name", "nuguna"),
    textAttr(0x42, "job-name", "누구나프린트"),
    textAttr(0x49, "document-format", "application/pdf"),
    new Uint8Array([0x02]),
    intAttr("copies", Math.max(1, Math.min(99, options.copies))),
    textAttr(0x44, "sides", sides),
    textAttr(0x44, "media", media),
    /* print-color-mode는 IPP 2.0 속성. 1.1 기기에는 보내지 않는다(흑백은 PDF를 회색으로 만들어 보낸다) */
    ...(old ? [] : [textAttr(0x44, "print-color-mode", options.gray ? "monochrome" : "color")]),
    new Uint8Array([0x03]),
  ]);
  return concat([header, attrs, pdf]);
}

/** 응답 머리의 IPP 상태 코드 (0x0000~0x00FF 성공, 0x0503 판 안 맞음). 읽을 수 없으면 null */
export function ippStatus(reply: Uint8Array) {
  return reply.length >= 4 ? (reply[2] << 8) | reply[3] : null;
}

/** 다음 판 · 주소로 다시 해 볼 만한 거절인지 (HTTP 400 · 404 · 405 · 426, IPP 0x0400 잘못된 요청 · 0x0503 판 안 맞음) */
export function ippRetryable(httpStatus: number, status: number | null) {
  if ([400, 404, 405, 426].includes(httpStatus)) return true;
  return status === 0x0400 || status === 0x0503;
}

const corsHint = () => tr("ipp.cors");

/** 같은 망의 IPP(631)로 PDF를 넣는다. 양면은 sides 속성으로 요청한다. 실패해도 기기 인쇄 창은 열지 않는다. */
export async function sendIppPdf(host: string, pdf: Uint8Array, options: IppOptions) {
  let last = "";
  for (const attempt of IPP_TRIES) {
    let response: Response;
    try {
      response = await fetch(`http://${host}:631${attempt.path}`, {
        method: "POST",
        headers: { "Content-Type": "application/ipp" },
        body: printJobPacket(host, pdf, options, attempt),
        targetAddressSpace: "local",
      } as RequestInit);
    } catch {
      throw new Error(corsHint());
    }
    if (response.type === "opaque") return;
    if (response.status === 0) throw new Error(corsHint());
    /* 웹 설정 페이지(HTML)가 200으로 돌아오는 기기도 있어 IPP 응답일 때만 상태를 읽는다 */
    const isIpp = (response.headers.get("content-type") || "application/ipp").includes("application/ipp");
    const status = isIpp ? ippStatus(new Uint8Array(await response.arrayBuffer().catch(() => new ArrayBuffer(0)))) : null;
    if (response.ok && status !== null && status < 0x0100) return;
    last = status !== null && response.ok ? `0x${status.toString(16).padStart(4, "0")}` : String(response.status);
    if (!ippRetryable(response.status, status)) break;
  }
  throw new Error(tr("ipp.rejected", { host, code: last }));
}
