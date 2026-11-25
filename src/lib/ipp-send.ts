import { tr } from "@/lib/i18n/core";
import { ippMedia, type OfficePaper } from "@/lib/office-job";
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

function printJobPacket(host: string, pdf: Uint8Array, options: { copies: number; duplex: "simplex" | "long" | "short"; paper: OfficePaper; gray: boolean }) {
  const header = new Uint8Array(8);
  const view = new DataView(header.buffer);
  header[0] = 2;
  view.setUint16(2, 0x0002);
  view.setUint32(4, 1);
  const media = ippMedia(options.paper);
  const sides = options.duplex === "long" ? "two-sided-long-edge" : options.duplex === "short" ? "two-sided-short-edge" : "one-sided";
  const attrs = concat([
    new Uint8Array([0x01]),
    textAttr(0x47, "attributes-charset", "utf-8"),
    textAttr(0x48, "attributes-natural-language", "ko"),
    textAttr(0x45, "printer-uri", `ipp://${host}:631/ipp/print`),
    textAttr(0x42, "requesting-user-name", "nuguna"),
    textAttr(0x42, "job-name", "누구나프린트"),
    textAttr(0x49, "document-format", "application/pdf"),
    new Uint8Array([0x02]),
    intAttr("copies", Math.max(1, Math.min(99, options.copies))),
    textAttr(0x44, "sides", sides),
    textAttr(0x44, "media", media),
    textAttr(0x44, "print-color-mode", options.gray ? "monochrome" : "color"),
    new Uint8Array([0x03]),
  ]);
  return concat([header, attrs, pdf]);
}

const corsHint = () => tr("ipp.cors");

/** 같은 망의 IPP(631)로 PDF를 넣는다. 실패해도 기기 인쇄 창은 열지 않는다. */
export async function sendIppPdf(host: string, pdf: Uint8Array, options: { copies: number; duplex: "simplex" | "long" | "short"; paper: OfficePaper; gray: boolean }) {
  const body = printJobPacket(host, pdf, options);
  let response: Response;
  try {
    response = await fetch(`http://${host}:631/ipp/print`, {
      method: "POST",
      headers: { "Content-Type": "application/ipp" },
      body: body,
      targetAddressSpace: "local",
    } as RequestInit);
  } catch {
    throw new Error(corsHint());
  }
  if (!response.ok && response.type !== "opaque") {
    throw new Error(response.status === 0 ? corsHint() : tr("ipp.rejected", { host, code: response.status }));
  }
}
