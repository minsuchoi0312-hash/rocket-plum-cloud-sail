/**
 * 표준 팩 3.0 — 드라이버 없는(driverless) 프린터 모두에게 보내기.
 *  · AirPrint(애플)          : image/urf  (URF · "UNIRAST" 래스터)
 *  · IPP Everywhere · Mopria : image/pwg-raster (PWG 5102.4 래스터)
 *  · 공통                    : image/jpeg (쪽마다 한 작업), application/pdf (받으면 그대로)
 * 많은 가정용 잉크젯(HP · 캐논 · 엡손 · 브라더)은 PDF 를 받지 않고 래스터 · JPEG 만 받는다 → 프린터에게 묻고(ipp-attrs.ts) 고른다.
 *
 * 압축(PWG · URF 같음): 줄마다 [같은 줄 반복 수 - 1] 한 바이트, 이어서 점 묶음
 *   0x00~0x7F n : 다음 점 하나를 n+1 번
 *   0x81~0xFF n : 다음 (257-n) 개 점을 그대로
 * (0x80 은 URF 에서 '줄 나머지 흰색'이지만 PWG 에는 없어서 쓰지 않는다)
 * 규격은 공개 문서(PWG 5102.4 · CUPS 래스터 헤더)를 보고 직접 썼다.
 */
import type { IppAttrs } from "./ipp-attrs.ts";

export type IppFormat = "application/pdf" | "image/pwg-raster" | "image/urf" | "image/jpeg";
export type SheetBack = "normal" | "flipped" | "rotated" | "manual-tumble";
export type RasterSpace = "srgb" | "sgray";

export type IppPlan = {
  /** 보낼 형식 — null 이면 이 앱이 아는 형식을 프린터가 하나도 받지 않음 */
  format: IppFormat | null;
  dpi: number;
  space: RasterSpace;
  /** 양면일 때 뒷면을 어떻게 돌려 보내야 하는지 */
  sheetBack: SheetBack;
  /** 프린터가 양면을 한다고 했는지(모르면 true — 예전처럼 요청은 보낸다) */
  duplexOk: boolean;
  /** 프린터에게 묻지 못해 PDF 로 짐작했는지 */
  guessed: boolean;
};

const lower = (values: string[] | undefined) => (values || []).map((value) => value.toLowerCase().trim());

/** "300x300dpi" · "600x600dpi" → 가로 해상도 목록 (dpcm 는 dpi 로) */
function dpiList(values: string[]) {
  const out: number[] = [];
  for (const value of values) {
    const hit = /^(\d+)x(\d+)(dpi|dpcm)$/i.exec(value.trim());
    if (!hit) continue;
    const x = Number(hit[1]);
    out.push(hit[3].toLowerCase() === "dpcm" ? Math.round(x * 2.54) : x);
  }
  return out;
}

/** 300dpi 가 있으면 300, 아니면 300 이상 중 가장 낮은 것, 그것도 없으면 가장 높은 것 */
function pickDpi(list: number[]) {
  if (!list.length) return 300;
  if (list.includes(300)) return 300;
  const above = list.filter((dpi) => dpi >= 300).sort((a, b) => a - b);
  return above[0] ?? Math.max(...list);
}

/** urf-supported 의 RS 값: "RS300" · "RS300-600" → [300, 600] */
function urfDpi(values: string[]) {
  const rs = values.find((value) => /^rs\d/i.test(value));
  return rs ? rs.slice(2).split("-").map(Number).filter((n) => n > 0) : [];
}

const URF_BACK: Record<string, SheetBack> = { dm1: "normal", dm2: "flipped", dm3: "rotated", dm4: "manual-tumble" };

/**
 * 받는 형식에 맞춰 보낼 방법을 고른다.
 *  1) PDF 를 받으면 PDF (지금까지 쓰던 길 — 이미 되던 프린터는 그대로)
 *  2) 사진이고 JPEG 를 받으면(양면 아님) JPEG — 래스터보다 훨씬 작다
 *  3) PWG 래스터 → 4) URF → 5) JPEG
 * 프린터에게 묻지 못했으면(attrs null) 예전처럼 PDF.
 */
export function planIpp(attrs: IppAttrs | null, want: { gray: boolean; photo: boolean; duplex: boolean }): IppPlan {
  const base: IppPlan = { format: "application/pdf", dpi: 300, space: want.gray ? "sgray" : "srgb", sheetBack: "normal", duplexOk: true, guessed: true };
  if (!attrs) return base;
  const formats = lower(attrs["document-format-supported"]);
  const sides = lower(attrs["sides-supported"]);
  const duplexOk = !sides.length || sides.some((side) => side.startsWith("two-sided"));
  const plan = { ...base, guessed: false, duplexOk };
  const jpeg = formats.includes("image/jpeg");
  if (formats.includes("application/pdf")) return plan;
  if (want.photo && jpeg && !want.duplex) return { ...plan, format: "image/jpeg" };
  if (formats.includes("image/pwg-raster")) {
    const types = lower(attrs["pwg-raster-document-type-supported"]);
    const hasRgb = !types.length || types.includes("srgb_8");
    const hasGray = types.includes("sgray_8");
    if (hasRgb || hasGray) {
      const space: RasterSpace = want.gray ? (hasGray ? "sgray" : "srgb") : hasRgb ? "srgb" : "sgray";
      const back = lower(attrs["pwg-raster-document-sheet-back"])[0] as SheetBack | undefined;
      return { ...plan, format: "image/pwg-raster", dpi: pickDpi(dpiList(attrs["pwg-raster-document-resolution-supported"] || [])), space, sheetBack: back && back in BACK_TRANSFORM ? back : "normal" };
    }
  }
  if (formats.includes("image/urf")) {
    const urf = lower(attrs["urf-supported"]);
    const hasRgb = !urf.length || urf.some((value) => value === "srgb24");
    const hasGray = urf.some((value) => value === "w8" || value === "sgray8");
    const space: RasterSpace = want.gray ? (hasGray ? "sgray" : "srgb") : hasRgb ? "srgb" : "sgray";
    const dm = urf.find((value) => /^dm\d$/.test(value));
    return { ...plan, format: "image/urf", dpi: pickDpi(urfDpi(urf)), space, sheetBack: (dm && URF_BACK[dm]) || "normal" };
  }
  if (jpeg) return { ...plan, format: "image/jpeg" };
  /* 형식을 밝히지 않고 '알아서 판단(octet-stream)'만 받는 옛 기기 — PDF 로 해 본다 */
  if (formats.includes("application/octet-stream")) return plan;
  return { ...plan, format: null };
}

/* ───────── 래스터 만들기 ───────── */

/** 뒷면 뒤집기: [가로 뒤집기, 세로 뒤집기] — PWG 5100.14 표 (긴 쪽 · 짧은 쪽 양면) */
const BACK_TRANSFORM: Record<SheetBack, { long: [boolean, boolean]; short: [boolean, boolean] }> = {
  normal: { long: [false, false], short: [false, false] },
  flipped: { long: [false, true], short: [true, false] },
  rotated: { long: [true, true], short: [false, false] },
  "manual-tumble": { long: [false, false], short: [true, true] },
};

export type RasterPage = { width: number; height: number; rgba: Uint8ClampedArray | Uint8Array };

export type RasterOptions = {
  format: "image/pwg-raster" | "image/urf";
  dpi: number;
  space: RasterSpace;
  /** 용지 크기(포인트) — PWG 머리의 PageSize */
  points: { width: number; height: number };
  /** PWG 용지 이름 (예: iso_a4_210x297mm) */
  mediaName: string;
  duplex: "simplex" | "long" | "short";
  sheetBack: SheetBack;
  /** 문서 전체 쪽 수 (PWG TotalPageCount) */
  totalPages: number;
};

/** 늘어나는 바이트 버퍼 */
export class Bytes {
  buf: Uint8Array;
  len = 0;
  constructor(size = 1 << 16) {
    this.buf = new Uint8Array(size);
  }
  ensure(extra: number) {
    if (this.len + extra <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.len + extra) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
  }
  byte(value: number) {
    this.ensure(1);
    this.buf[this.len++] = value;
  }
  bytes(src: Uint8Array, start = 0, end = src.length) {
    this.ensure(end - start);
    this.buf.set(src.subarray(start, end), this.len);
    this.len += end - start;
  }
  done() {
    return this.buf.slice(0, this.len);
  }
}

/** 한 줄(점 bpp 바이트) 압축 — 반복 점은 묶고, 나머지는 그대로 */
export function packLine(line: Uint8Array, bpp: number, out: Bytes) {
  const count = line.length / bpp;
  const same = (a: number, b: number) => {
    for (let k = 0; k < bpp; k++) if (line[a * bpp + k] !== line[b * bpp + k]) return false;
    return true;
  };
  let i = 0;
  while (i < count) {
    let run = 1;
    while (i + run < count && run < 128 && same(i, i + run)) run++;
    if (run >= 2) {
      out.byte(run - 1);
      out.bytes(line, i * bpp, i * bpp + bpp);
      i += run;
      continue;
    }
    const start = i;
    let literal = 0;
    while (i < count && literal < 128) {
      if (i + 1 < count && same(i, i + 1)) break;
      i++;
      literal++;
    }
    if (literal <= 1) {
      out.byte(0);
      out.bytes(line, start * bpp, start * bpp + bpp);
    } else {
      out.byte(257 - literal);
      out.bytes(line, start * bpp, (start + literal) * bpp);
    }
  }
}

/** RGBA 한 줄 → sRGB(3) 또는 sGray(1) 바이트, 필요하면 좌우 뒤집기 */
function lineOf(page: RasterPage, y: number, bpp: number, mirror: boolean, into: Uint8Array) {
  const { width, rgba } = page;
  const row = y * width * 4;
  for (let x = 0; x < width; x++) {
    const sx = mirror ? width - 1 - x : x;
    const p = row + sx * 4;
    /* 투명(알파 0)은 흰 종이 */
    const a = rgba[p + 3] / 255;
    const r = Math.round(rgba[p] * a + 255 * (1 - a));
    const g = Math.round(rgba[p + 1] * a + 255 * (1 - a));
    const b = Math.round(rgba[p + 2] * a + 255 * (1 - a));
    if (bpp === 1) into[x] = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    else {
      into[x * 3] = r;
      into[x * 3 + 1] = g;
      into[x * 3 + 2] = b;
    }
  }
}

/** 쪽 하나 압축 본문 — 같은 줄이 이어지면 반복 수로 묶는다 */
function encodeBody(page: RasterPage, bpp: number, flipX: boolean, flipY: boolean, out: Bytes) {
  const width = page.width * bpp;
  let prev = new Uint8Array(width);
  let cur = new Uint8Array(width);
  let repeat = 0;
  let have = false;
  const flush = () => {
    out.byte(repeat - 1);
    packLine(prev, bpp, out);
  };
  for (let n = 0; n < page.height; n++) {
    const y = flipY ? page.height - 1 - n : n;
    lineOf(page, y, bpp, flipX, cur);
    if (have && repeat < 256 && equal(prev, cur)) {
      repeat++;
      continue;
    }
    if (have) flush();
    [prev, cur] = [cur, prev];
    repeat = 1;
    have = true;
  }
  if (have) flush();
}

function equal(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function putString(view: DataView, at: number, text: string, max = 64) {
  const bytes = new TextEncoder().encode(text).subarray(0, max - 1);
  for (let i = 0; i < bytes.length; i++) view.setUint8(at + i, bytes[i]);
}

/** PWG 래스터 쪽 머리 (1796 바이트, CUPS page header v2 배치 · 큰 끝) */
export function pwgHeader(page: RasterPage, opt: RasterOptions, index: number, transform: [boolean, boolean]) {
  const head = new Uint8Array(1796);
  const view = new DataView(head.buffer);
  const bpp = opt.space === "sgray" ? 1 : 3;
  putString(view, 0, "PwgRaster");
  const duplex = opt.duplex !== "simplex";
  view.setUint32(272, duplex ? 1 : 0);
  view.setUint32(276, opt.dpi);
  view.setUint32(280, opt.dpi);
  view.setUint32(340, 1);
  view.setUint32(352, Math.round(opt.points.width));
  view.setUint32(356, Math.round(opt.points.height));
  view.setUint32(368, opt.duplex === "short" ? 1 : 0);
  view.setUint32(372, page.width);
  view.setUint32(376, page.height);
  view.setUint32(384, 8);
  view.setUint32(388, bpp * 8);
  view.setUint32(392, page.width * bpp);
  view.setUint32(396, 0);
  view.setUint32(400, opt.space === "sgray" ? 18 : 19);
  view.setUint32(420, bpp);
  /* cupsInteger: 0 TotalPageCount · 1 CrossFeedTransform · 2 FeedTransform · 3~6 ImageBox · 7 AlternatePrimary */
  view.setUint32(452, opt.totalPages);
  view.setInt32(456, transform[0] ? -1 : 1);
  view.setInt32(460, transform[1] ? -1 : 1);
  view.setUint32(464, 0);
  view.setUint32(468, 0);
  view.setUint32(472, page.width);
  view.setUint32(476, page.height);
  view.setUint32(480, 0xffffff);
  putString(view, 1732, opt.mediaName);
  void index;
  return head;
}

/** URF(애플 래스터) 쪽 머리 (32 바이트) */
export function urfHeader(page: RasterPage, opt: RasterOptions) {
  const head = new Uint8Array(32);
  const view = new DataView(head.buffer);
  const gray = opt.space === "sgray";
  head[0] = gray ? 8 : 24;
  head[1] = gray ? 0 : 1;
  head[2] = opt.duplex === "simplex" ? 1 : opt.duplex === "short" ? 2 : 3;
  head[3] = 4;
  view.setUint32(12, page.width);
  view.setUint32(16, page.height);
  view.setUint32(20, opt.dpi);
  return head;
}

/** 래스터 파일 머리 */
export function rasterFileHeader(format: RasterOptions["format"], pageCount: number) {
  if (format === "image/pwg-raster") return new TextEncoder().encode("RaS2");
  const head = new Uint8Array(12);
  head.set(new TextEncoder().encode("UNIRAST"), 0);
  new DataView(head.buffer).setUint32(8, pageCount);
  return head;
}

/** 쪽 하나(머리 + 압축 본문). index 는 문서 안 쪽 번호(0부터) — 양면 뒷면(홀수)은 프린터가 원하는 대로 돌린다 */
export function encodeRasterPage(page: RasterPage, opt: RasterOptions, index: number) {
  const back = opt.duplex !== "simplex" && index % 2 === 1;
  const transform: [boolean, boolean] = back ? BACK_TRANSFORM[opt.sheetBack][opt.duplex === "short" ? "short" : "long"] : [false, false];
  const out = new Bytes(Math.max(1 << 16, page.width * 64));
  out.bytes(opt.format === "image/pwg-raster" ? pwgHeader(page, opt, index, transform) : urfHeader(page, opt));
  encodeBody(page, opt.space === "sgray" ? 1 : 3, transform[0], transform[1], out);
  return out.done();
}

/** 쪽들을 한 파일로 (테스트 · 작은 문서용 — 앱은 쪽마다 만들어 크기를 보며 나눈다) */
export function encodeRaster(pages: RasterPage[], opt: RasterOptions) {
  const parts = [rasterFileHeader(opt.format, pages.length), ...pages.map((page, index) => encodeRasterPage(page, opt, index))];
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/** 압축 풀기 (테스트용) — 줄 목록을 돌려준다 */
export function unpackBody(body: Uint8Array, width: number, height: number, bpp: number) {
  const lines: Uint8Array[] = [];
  let pos = 0;
  while (lines.length < height && pos < body.length) {
    const repeat = body[pos++] + 1;
    const line = new Uint8Array(width * bpp);
    let x = 0;
    while (x < width) {
      const n = body[pos++];
      if (n < 0x80) {
        const pixel = body.subarray(pos, pos + bpp);
        pos += bpp;
        for (let k = 0; k <= n; k++) line.set(pixel, (x + k) * bpp);
        x += n + 1;
      } else {
        const count = 257 - n;
        line.set(body.subarray(pos, pos + count * bpp), x * bpp);
        pos += count * bpp;
        x += count;
      }
    }
    for (let r = 0; r < repeat; r++) lines.push(line);
  }
  return lines;
}
