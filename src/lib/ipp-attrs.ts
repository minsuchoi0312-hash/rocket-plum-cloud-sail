/**
 * 프린터에게 "무엇을 받을 수 있나요?" 묻기 — IPP Get-Printer-Attributes.
 * AirPrint · Mopria · IPP Everywhere 프린터는 받는 형식(PDF · PWG 래스터 · URF · JPEG), 해상도, 양면 방식을 알려 준다.
 * 이 값으로 표준 팩이 보낼 형식을 고른다(ipp-raster.ts planIpp).
 */
import { IPP_TRIES, ippStatus } from "./ipp-send.ts";

export type IppAttrs = Record<string, string[]>;

/** 물어볼 속성 — 꼭 필요한 것만(응답이 작고 옛 기기도 답한다) */
export const PRINTER_ATTRS = [
  "document-format-supported",
  "pwg-raster-document-resolution-supported",
  "pwg-raster-document-type-supported",
  "pwg-raster-document-sheet-back",
  "urf-supported",
  "sides-supported",
  "print-color-mode-supported",
  "printer-make-and-model",
  /* 보안 인쇄(PWG 5100.11): 최대 길이(정수) — 없으면 PIN 을 못 받는 프린터 */
  "job-password-supported",
] as const;

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

function attr(tag: number, name: string, value: string) {
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

/** Get-Printer-Attributes 요청 묶음 */
export function getAttributesPacket(host: string, attempt: { major: number; minor: number; path: string }, names: readonly string[] = PRINTER_ATTRS) {
  const header = new Uint8Array(8);
  const view = new DataView(header.buffer);
  header[0] = attempt.major;
  header[1] = attempt.minor;
  view.setUint16(2, 0x000b);
  view.setUint32(4, 1);
  const parts = [
    header,
    new Uint8Array([0x01]),
    attr(0x47, "attributes-charset", "utf-8"),
    attr(0x48, "attributes-natural-language", "en"),
    attr(0x45, "printer-uri", `ipp://${host}:631${attempt.path}`),
    attr(0x42, "requesting-user-name", "nuguna"),
  ];
  names.forEach((name, index) => parts.push(attr(0x44, index === 0 ? "requested-attributes" : "", name)));
  parts.push(new Uint8Array([0x03]));
  return concat(parts);
}

/**
 * 응답에서 프린터 속성 묶음(0x04)만 꺼낸다. 값은 모두 글자로:
 * 정수 → "12", 해상도 → "300x300dpi", 범위 → "1-99", 참거짓 → "true". 묶음(collection) 속 값은 건너뛴다.
 */
export function parseIppAttributes(reply: Uint8Array): IppAttrs {
  const out: IppAttrs = {};
  const view = new DataView(reply.buffer, reply.byteOffset, reply.byteLength);
  let pos = 8;
  let group = 0;
  let current = "";
  let depth = 0;
  const text = (start: number, length: number) => new TextDecoder().decode(reply.subarray(start, start + length));
  while (pos < reply.length) {
    const tag = reply[pos++];
    if (tag === 0x03) break;
    if (tag <= 0x0f) {
      group = tag;
      current = "";
      continue;
    }
    if (pos + 2 > reply.length) break;
    const nameLength = view.getUint16(pos);
    pos += 2;
    if (pos + nameLength + 2 > reply.length) break;
    const name = text(pos, nameLength);
    pos += nameLength;
    const valueLength = view.getUint16(pos);
    pos += 2;
    if (pos + valueLength > reply.length) break;
    const start = pos;
    pos += valueLength;
    /* 묶음(collection): 0x34 시작 ~ 0x37 끝 — 안의 값(0x4A 이름 · 값)은 쓰지 않는다 */
    if (tag === 0x34) {
      if (depth === 0 && name) current = name;
      depth++;
      continue;
    }
    if (tag === 0x37) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 0) continue;
    if (name) current = name;
    if (group !== 0x04 || !current) continue;
    /* 값 없음 · 모름(0x10 ~ 0x1F)은 건너뛴다 */
    if (tag >= 0x10 && tag <= 0x1f) continue;
    let value: string;
    if ((tag === 0x21 || tag === 0x23) && valueLength === 4) value = String(view.getInt32(start));
    else if (tag === 0x22 && valueLength === 1) value = reply[start] ? "true" : "false";
    else if (tag === 0x32 && valueLength === 9) value = `${view.getInt32(start)}x${view.getInt32(start + 4)}${reply[start + 8] === 4 ? "dpcm" : "dpi"}`;
    else if (tag === 0x33 && valueLength === 8) value = `${view.getInt32(start)}-${view.getInt32(start + 4)}`;
    else if ((tag === 0x35 || tag === 0x36) && valueLength >= 4) {
      /* 언어 붙은 글: [언어 길이][언어][글 길이][글] */
      const langLength = view.getUint16(start);
      const textLength = start + 2 + langLength + 2 <= pos ? view.getUint16(start + 2 + langLength) : 0;
      value = text(start + 4 + langLength, textLength);
    } else value = text(start, valueLength);
    (out[current] ||= []).push(value);
  }
  return out;
}

/**
 * 프린터에게 받는 형식 등을 묻는다. 판 · 주소를 바꿔 가며(2.0 /ipp/print → 1.1 …) 처음 답한 것을 쓴다.
 * 못 물으면 null — 그때는 예전처럼 PDF 로 보낸다.
 */
export async function getPrinterAttributes(host: string, timeoutMs = 5000): Promise<IppAttrs | null> {
  for (const attempt of IPP_TRIES) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const response = await fetch(`http://${host}:631${attempt.path}`, {
        method: "POST",
        headers: { "Content-Type": "application/ipp" },
        body: getAttributesPacket(host, attempt),
        signal: ac.signal,
        targetAddressSpace: "local",
      } as RequestInit);
      if (!response.ok || response.type === "opaque") continue;
      const reply = new Uint8Array(await response.arrayBuffer());
      const status = ippStatus(reply);
      if (status === null || status >= 0x0100) continue;
      const attrs = parseIppAttributes(reply);
      if (attrs["document-format-supported"]?.length) return attrs;
    } catch {
      /* 다음 판 · 주소 */
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
