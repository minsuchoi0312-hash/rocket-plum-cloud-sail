/**
 * 캐논 PIXMA 래스터 인코더 — AirPrint 가 없는 2008~2012년 네트워크 PIXMA(MX860 계열 등)용.
 * 각 기종의 "300x300dpi" 보통 용지 모드(CMYK 각 1비트)를 Gutenprint 가 보내는 명령 순서 · 값 그대로 만든다.
 * 전송은 9100 이 아니라 캐논 BJNP(8611) — 폰 내장 도우미가 맡는다.
 *
 * 작업: [XML StartJob · ModeShift] → 쪽마다
 *   (첫 쪽) BJL 제어 명령 · ESC [K → ESC (b · (q · (d · (t · (c · (p · (P · [(T] · (l · [(r] · (I · (J · (L
 *   → 8줄 묶음마다 색별 ESC (F (줄 = PackBits + 0x80) → FF · ESC (b 0
 *   → ESC @ · [XML EndJob]
 */
import { monoFromLuma, packBits, paperMm } from "./office-job.ts";

export const CANON_DPI = 300;
const LINES_PER_BLOCK = 8;
/** 기종 공통 여백(pt): 왼 · 오른 · 위 · 아래 */
const BORDER = { left: 10, right: 10, top: 9, bottom: 15 };

export type CanonProfile = {
  name: string;
  /** 작업 앞뒤 XML (ivec) */
  xml: boolean;
  /** ESC (P 길이 4 또는 6 */
  pLen: 4 | 6;
  /** ESC (r 인자(0 이면 보내지 않음) */
  r: number;
  /** ESC (T (카트리지 선택) 를 보내는 기종 */
  cartridge: boolean;
  /** BJL 제어 명령 */
  control: string[];
  /** 급지 코드(ESC (l 첫 바이트 아래 4비트) */
  slot: number;
  /** 300dpi 모드 잉크 표 크기와 C · M · Y · K 자리 */
  inkSlots: number;
  inkAt: { C: number; M: number; Y: number; K: number };
};

const SILENT = ["SetSilent=OFF"];
const SILENT_EDGE = ["SetSilent=OFF", "PEdgeDetection=ON"];
const CMYK13 = { inkSlots: 13, inkAt: { C: 0, M: 1, Y: 2, K: 3 } };
const CMYK16 = { inkSlots: 16, inkAt: { C: 0, M: 1, Y: 2, K: 3 } };
const KCMY30 = { inkSlots: 30, inkAt: { K: 0, C: 1, M: 3, Y: 5 } };

/** 기종 표 (Gutenprint canon-printers.h · canon-modes.h 에서 옮긴 값) */
const PROFILES: { match: RegExp; profile: CanonProfile }[] = [
  { match: /\bmx\s?-?86\d/i, profile: { name: "PIXMA MX860", xml: false, pLen: 4, r: 0x64, cartridge: false, control: SILENT_EDGE, slot: 0xe, ...CMYK13 } },
  { match: /\bmx\s?-?87\d/i, profile: { name: "PIXMA MX870", xml: true, pLen: 6, r: 0x64, cartridge: false, control: SILENT, slot: 0xe, ...CMYK13 } },
  { match: /\bmx\s?-?88\d/i, profile: { name: "PIXMA MX880", xml: true, pLen: 6, r: 0, cartridge: false, control: SILENT, slot: 0xe, ...CMYK13 } },
  { match: /\bmp\s?-?56\d/i, profile: { name: "PIXMA MP560", xml: true, pLen: 6, r: 0x64, cartridge: false, control: SILENT, slot: 0xe, ...CMYK13 } },
  { match: /\bmp\s?-?62\d/i, profile: { name: "PIXMA MP620", xml: false, pLen: 4, r: 0x64, cartridge: false, control: SILENT, slot: 0xe, ...CMYK13 } },
  { match: /\bmp\s?-?64\d/i, profile: { name: "PIXMA MP640", xml: true, pLen: 6, r: 0x64, cartridge: false, control: SILENT_EDGE, slot: 0xe, ...CMYK13 } },
  { match: /\bmp\s?-?98\d/i, profile: { name: "PIXMA MP980", xml: false, pLen: 4, r: 0x64, cartridge: false, control: SILENT_EDGE, slot: 0xe, ...CMYK16 } },
  { match: /\bmp\s?-?99\d/i, profile: { name: "PIXMA MP990", xml: true, pLen: 6, r: 0x64, cartridge: false, control: SILENT_EDGE, slot: 0xe, ...KCMY30 } },
  { match: /\bmx\s?-?34\d/i, profile: { name: "PIXMA MX340", xml: true, pLen: 6, r: 0, cartridge: true, control: SILENT, slot: 0x4, ...CMYK13 } },
  { match: /\bmx\s?-?42\d/i, profile: { name: "PIXMA MX420", xml: true, pLen: 6, r: 0, cartridge: true, control: SILENT, slot: 0x4, ...CMYK13 } },
  { match: /\bmg\s?-?51\d\d/i, profile: { name: "PIXMA MG5100", xml: true, pLen: 6, r: 0, cartridge: false, control: SILENT, slot: 0xe, ...CMYK13 } },
  { match: /\bmg\s?-?52\d\d/i, profile: { name: "PIXMA MG5200", xml: true, pLen: 6, r: 0, cartridge: false, control: SILENT, slot: 0xe, ...CMYK13 } },
  { match: /\bmg\s?-?61\d\d/i, profile: { name: "PIXMA MG6100", xml: true, pLen: 6, r: 0x64, cartridge: false, control: SILENT, slot: 0xe, ...KCMY30 } },
  { match: /\bmg\s?-?81\d\d/i, profile: { name: "PIXMA MG8100", xml: true, pLen: 6, r: 0x64, cartridge: false, control: SILENT, slot: 0xe, ...KCMY30 } },
  { match: /\bip\s?-?47\d\d/i, profile: { name: "PIXMA iP4700", xml: true, pLen: 6, r: 0x64, cartridge: false, control: SILENT_EDGE, slot: 0xe, ...CMYK13 } },
];

/** 모델명(BJNP 1284 ID · mDNS 이름 등) → 설정. 표에 없는 캐논은 null */
export function canonProfile(model: string): CanonProfile | null {
  if (!/canon|pixma|\bmx\s?\d|\bmp\s?\d|\bmg\s?\d|\bip\s?\d/i.test(model || "")) return null;
  return PROFILES.find((row) => row.match.test(model))?.profile ?? null;
}

/* ───────── 용지 ───────── */
/** ESC (P · (p 용지 코드와 펌웨어가 요구하는 정확한 크기(1/600인치) */
const PAPER: Record<string, { code: number; w600: number; h600: number }> = {
  A4: { code: 0x03, w600: 4961, h600: 7016 },
  A5: { code: 0x01, w600: 3497, h600: 4961 },
  B5: { code: 0x08, w600: 4300, h600: 6071 },
  Letter: { code: 0x0d, w600: 5100, h600: 6600 },
  Legal: { code: 0x0f, w600: 5100, h600: 8400 },
  Postcard: { code: 0x14, w600: 2363, h600: 3497 },
};

export type CanonGeometry = {
  code: number;
  /** 여백 안쪽 크기(pt) */
  pageW: number;
  pageH: number;
  /** 300dpi 래스터 폭(점) · 높이(줄) · 줄 바이트 */
  width: number;
  height: number;
  lineBytes: number;
  w600: number;
  h600: number;
};

/** A3 · B4 등 이 기종들이 못 받는 용지는 A4 로 */
export function canonGeometry(paper: string): CanonGeometry {
  const key = PAPER[paper] ? paper : "A4";
  const mm = paperMm(key, "portrait");
  const ptW = Math.round((mm.width / 25.4) * 72);
  const ptH = Math.round((mm.height / 25.4) * 72);
  const pageW = ptW - BORDER.left - BORDER.right;
  const pageH = ptH - BORDER.top - BORDER.bottom;
  const width = Math.floor((pageW * CANON_DPI) / 72);
  const height = Math.floor((pageH * CANON_DPI) / 72);
  return { code: PAPER[key].code, pageW, pageH, width, height, lineBytes: Math.ceil(width / 8), w600: PAPER[key].w600, h600: PAPER[key].h600 };
}

/* ───────── 바이트 도구 ───────── */
const ascii = (text: string) => Uint8Array.from(text, (ch) => ch.charCodeAt(0) & 0xff);
function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
const le16 = (n: number) => [n & 0xff, (n >> 8) & 0xff];
const be16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const be32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

/** ESC ( c · 길이(LE16) · 인자 */
function esc(cmd: string, args: number[]) {
  return Uint8Array.from([0x1b, 0x28, cmd.charCodeAt(0), ...le16(args.length), ...args]);
}

const PRE_XML =
  '<?xml version="1.0" encoding="utf-8" ?><cmd xmlns:ivec="http://www.canon.com/ns/cmd/2008/07/common/"><ivec:contents><ivec:operation>StartJob</ivec:operation><ivec:param_set servicetype="print"><ivec:jobID>00000001</ivec:jobID><ivec:bidi>0</ivec:bidi></ivec:param_set></ivec:contents></cmd>' +
  '<?xml version="1.0" encoding="utf-8" ?><cmd xmlns:ivec="http://www.canon.com/ns/cmd/2008/07/common/" xmlns:vcn="http://www.canon.com/ns/cmd/2008/07/canon/"><ivec:contents><ivec:operation>VendorCmd</ivec:operation><ivec:param_set servicetype="print"><vcn:ijoperation>ModeShift</vcn:ijoperation><vcn:ijmode>1</vcn:ijmode><ivec:jobID>00000001</ivec:jobID></ivec:param_set></ivec:contents></cmd>';
const POST_XML =
  '<?xml version="1.0" encoding="utf-8" ?><cmd xmlns:ivec="http://www.canon.com/ns/cmd/2008/07/common/"><ivec:contents><ivec:operation>EndJob</ivec:operation><ivec:param_set servicetype="print"><ivec:jobID>00000001</ivec:jobID></ivec:param_set></ivec:contents></cmd>';

export function canonJobHeader(profile: CanonProfile): Uint8Array {
  return profile.xml ? ascii(PRE_XML) : new Uint8Array(0);
}

export function canonJobFooter(profile: CanonProfile): Uint8Array {
  return concat([ascii("\x1b@"), profile.xml ? ascii(POST_XML) : new Uint8Array(0)]);
}

/** 쪽 시작 명령들 (first = 작업의 첫 쪽) */
export function canonPageSetup(profile: CanonProfile, geo: CanonGeometry, first: boolean): Uint8Array {
  const parts: Uint8Array[] = [];
  if (first) {
    for (const cmd of profile.control) {
      parts.push(Uint8Array.from([0x1b, 0x5b, 0x4b, ...le16(2), 0x00, 0x1f]), ascii(`BJLSTART\nControlMode=Common\n${cmd}\nBJLEND\n`));
    }
    parts.push(Uint8Array.from([0x1b, 0x5b, 0x4b, ...le16(2), 0x00, 0x0f]));
  }
  /* (b 압축 켬 · (q 쪽 ID · (d 300x300 */
  parts.push(esc("b", [0x01]), esc("q", [0x01]), esc("d", [...be16(CANON_DPI), ...be16(CANON_DPI)]));
  /* (t 확장: 0x80 · 0x00 · 0x01 + 잉크 자리마다 [비트 1, 0, 단계 2] */
  const t = new Array(profile.inkSlots * 3 + 3).fill(0);
  t[0] = 0x80;
  t[1] = 0x00;
  t[2] = 0x01;
  for (const at of Object.values(profile.inkAt)) {
    t[3 + at * 3] = 0x01;
    t[3 + at * 3 + 2] = 0x02;
  }
  parts.push(esc("t", t));
  /* (c 모델 3 · 보통 용지 · 품질 1 (흑백도 CMYK 잉크 세트로 보낸다) */
  parts.push(esc("c", [0x30, 0x00, 0x01]));
  /* (p 46바이트: 인쇄 영역 · 단위 600 · 여백 · 영역 크기 · 용지 크기 */
  const unit = 600;
  const printableW = Math.floor(((geo.pageW + 1) * 5) / 6);
  const printableL = Math.floor(((geo.pageH + 1) * 5) / 6);
  parts.push(
    esc("p", [
      ...be16(printableL),
      ...be16(0),
      ...be16(printableW),
      ...be16(0),
      ...be32(0),
      ...be16(unit),
      ...be32(Math.floor((BORDER.left * unit) / 72)),
      ...be32(Math.floor((BORDER.top * unit) / 72)),
      ...be32(Math.floor((geo.pageW * unit) / 72)),
      ...be32(Math.floor((geo.pageH * unit) / 72)),
      ...be32(0),
      ...be32(0),
      ...be32(geo.w600),
      ...be32(geo.h600),
    ]),
  );
  /* (P 용지 크기 · 보통 용지 · 세로 */
  parts.push(esc("P", profile.pLen === 6 ? [0x00, geo.code, 0x00, 0x00, 0x01, 0x00] : [0x00, geo.code, 0x00, 0x00]));
  if (profile.cartridge) parts.push(esc("T", [0x03, 0x04, 0x04]));
  /* (l 급지 · 보통 용지 · 간격 */
  parts.push(esc("l", [(3 << 4) | (profile.slot & 0x0f), 0x00, 0x00]));
  if (profile.r) parts.push(esc("r", [profile.r]));
  /* 여러 줄 래스터: 켬 · 묶음당 8줄 · 색 순서 CMYK */
  parts.push(esc("I", [0x01]), esc("J", [LINES_PER_BLOCK]), Uint8Array.from([0x1b, 0x28, 0x4c, ...le16(4), ...ascii("CMYK")]));
  return concat(parts);
}

/** 한 줄(1비트, 1 = 잉크) → PackBits + 0x80. 빈 줄은 0x80 만 */
export function canonLine(bits: Uint8Array): Uint8Array {
  let blank = true;
  for (const b of bits) {
    if (b) {
      blank = false;
      break;
    }
  }
  if (blank) return Uint8Array.of(0x80);
  const packed = packBits(bits);
  const out = new Uint8Array(packed.length + 1);
  out.set(packed);
  out[packed.length] = 0x80;
  return out;
}

/** 8줄 묶음 하나(색 하나) → ESC (F */
export function canonBlock(lines: Uint8Array[]): Uint8Array {
  const body = concat(lines);
  return concat([Uint8Array.from([0x1b, 0x28, 0x46, ...le16(body.length)]), body]);
}

/**
 * 페이지 캔버스 → 쪽 명령. color=false 면 C · M · Y 판을 비워 검정만 쓴다.
 * 이 기종들은 높이가 8의 배수면 마지막 묶음을 보내지 않는다(Gutenprint 와 같음 — 아래 여백 줄이라 비어 있다).
 */
export function canonPageCommands(source: HTMLCanvasElement, options: { paper: string; color: boolean; profile: CanonProfile; first: boolean }): Uint8Array[] {
  const geo = canonGeometry(options.paper);
  const out: Uint8Array[] = [canonPageSetup(options.profile, geo, options.first)];
  const BAND = 256;
  const band = document.createElement("canvas");
  band.width = geo.width;
  band.height = BAND;
  const ctx = band.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas");
  const landscape = source.width > source.height;
  const width = geo.width;
  /* 색별 묶음 버퍼: C · M · Y · K */
  const pending: Uint8Array[][] = [[], [], [], []];
  const flush = () => {
    for (const lines of pending) out.push(canonBlock(lines));
    for (const lines of pending) lines.length = 0;
  };
  for (let top = 0; top < geo.height; top += BAND) {
    const rows = Math.min(BAND, geo.height - top);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, BAND);
    ctx.translate(0, -top);
    if (landscape) {
      ctx.translate(geo.width, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(source, 0, 0, geo.height, geo.width);
    } else ctx.drawImage(source, 0, 0, geo.width, geo.height);
    const rgba = ctx.getImageData(0, 0, width, rows).data;
    const count = width * rows;
    const c = new Float32Array(count).fill(255);
    const m = new Float32Array(count).fill(255);
    const y = new Float32Array(count).fill(255);
    const k = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = rgba[i * 4 + 3] / 255;
      const r = (rgba[i * 4] * a + 255 * (1 - a)) / 255;
      const g = (rgba[i * 4 + 1] * a + 255 * (1 - a)) / 255;
      const b = (rgba[i * 4 + 2] * a + 255 * (1 - a)) / 255;
      if (!options.color) {
        k[i] = (0.299 * r + 0.587 * g + 0.114 * b) * 255;
        continue;
      }
      let cc = 1 - r;
      let mm = 1 - g;
      let yy = 1 - b;
      const kk = Math.min(cc, mm, yy);
      cc -= kk;
      mm -= kk;
      yy -= kk;
      k[i] = (1 - kk) * 255;
      c[i] = (1 - cc) * 255;
      m[i] = (1 - mm) * 255;
      y[i] = (1 - yy) * 255;
    }
    const planes = [c, m, y, k].map((plane) => monoFromLuma(plane, width, rows, "dither"));
    for (let row = 0; row < rows; row++) {
      const line = top + row;
      planes.forEach((plane, index) => {
        const bits = new Uint8Array(geo.lineBytes);
        const base = row * width;
        for (let x = 0; x < width; x++) if (plane[base + x]) bits[x >> 3] |= 0x80 >> (x & 7);
        pending[index].push(canonLine(bits));
      });
      if ((line + 1) % LINES_PER_BLOCK === 0 && line + 1 < geo.height) flush();
    }
  }
  /* 마지막 묶음: 덜 찼으면 빈 줄로 채워 보낸다 */
  const missing = geo.height % LINES_PER_BLOCK ? LINES_PER_BLOCK - (geo.height % LINES_PER_BLOCK) : 0;
  if (missing) {
    for (const lines of pending) for (let i = 0; i < missing; i++) lines.push(Uint8Array.of(0x80));
    flush();
  }
  band.width = 0;
  band.height = 0;
  /* 쪽 끝: FF · 압축 끔 */
  out.push(concat([Uint8Array.of(0x0c), esc("b", [0x00])]));
  return out;
}
