/**
 * 삼성 SPL(QPDL) 인코더 — 삼성 · 제록스 GDI 레이저(ML · SCX · M 시리즈)용.
 * 페이지 캔버스를 흑백 1비트로 바꿔 128줄 띠(band)로 자르고, 0x11 압축으로 보낸다. 9100(Raw) 포트로 그대로 전송.
 *
 * 형식(공개 드라이버 SpliX로 알려진 QPDL 구조):
 *   PJL 머리말("@PJL ENTER LANGUAGE = QPDL") → 쪽마다 [쪽 머리 17바이트 · 띠 패킷들 · 쪽 꼬리 3바이트] → "\t" + UEL
 *   띠 패킷: 0x0C · 띠 번호 · 폭(BE16) · 높이(BE16) · 압축 0x11 · 크기(BE32) · 서명 EF CD AB 09 · 압축 데이터 · 체크섬(BE32)
 *   0x11 압축: 머리 4바이트(LE32, 처음 그대로 둘 바이트 수) + 거리 표 64개(LE16) + [그대로 n바이트 | 거리 표 참조 복사] 토큰
 *   띠 데이터는 세로 우선(열마다 128줄), 비트를 뒤집어(1 = 흰색) 넣는다.
 * 지원: 0x11 압축 흑백 기종(대부분의 ML · SCX · M 시리즈), 0x0D/0x0E 압축 초기 복합기(SCX-4100 · 4200 · 4216 · 4300 · 4500 · 4521, SF-565),
 *       0x11 컬러 CLP-500 · 510 · 550 · 제록스 Phaser 6100(C · M · Y · K 4면), 양면 장치가 있는 기종의 자동 양면.
 * 아직: JBIG(0x13 · 0x15) 기종 — CLP-200/300/310/315/600, CLX-216x/2170/3160, ML-1860 · 1670 · 1865, Phaser 6110.
 * 규격은 공개 드라이버 SpliX(OpenPrinting)를 참고해 직접 썼다(코드를 옮기지 않음).
 */
import { monoFromLuma, paperMm } from "./office-job.ts";
import { band0x0d, colorBandRecord } from "./spl-extra.ts";

/* ───────── 기종별 설정 ───────── */
export type SplProfile = {
  /** QPDL 버전(쪽 머리에 들어감) */
  qpdl: 1 | 2 | 3;
  /** 쪽 머리의 기종 값 3개 */
  doc: [number, number, number];
  /** 하드웨어 여백(pt) */
  margin: number;
  /** 띠 폭: 줄 폭 그대로 / 4960점 고정 / 용지별 표 */
  band: "line" | "fixed" | "special";
  /** 해상도(dpi) */
  dpi: 300 | 600;
  /** 띠 압축: 0x11(기본) · 0x0D(초기 SCX, 안 되면 띠마다 0x0E) */
  comp?: 0x11 | 0x0d;
  /** 컬러 기종(C · M · Y · K 면을 띠마다 보냄) */
  color?: boolean;
  /** 양면 장치가 있는 기종 */
  duplex?: boolean;
};

type Rule = { match: RegExp; profile: SplProfile | null };

const V1: Omit<SplProfile, "band" | "dpi"> = { qpdl: 1, doc: [0, 0, 0], margin: 10.75 };
const V2: Omit<SplProfile, "band" | "dpi"> = { qpdl: 2, doc: [0, 0, 1], margin: 10.75 };
const V3: Omit<SplProfile, "band" | "dpi"> = { qpdl: 3, doc: [0, 0, 1], margin: 10.75 };
const V3B: Omit<SplProfile, "band" | "dpi"> = { qpdl: 3, doc: [0, 0, 1], margin: 12.5 };

/** 위에서부터 처음 맞는 규칙. profile null = 이 팩으로는 아직 못 보내는 기종 */
const RULES: Rule[] = [
  /* 0x0D 압축 초기 복합기 (QPDL 1, 문서 값 0 · 2 · 1, 띠 폭 = 용지 폭) */
  { match: /scx-?4(100|200|216|300|500|521)|sf-?565/i, profile: { qpdl: 1, doc: [0, 2, 1], margin: 10.75, band: "line", dpi: 600, comp: 0x0d } },
  /* 컬러 0x11 (QPDL 1) — CLP-500 · 510 · 550 · Phaser 6100, 양면 장치 있음 */
  { match: /clp-?(500|510|550)\b|phaser\s?6100/i, profile: { qpdl: 1, doc: [0, 0, 1], margin: 10.75, band: "line", dpi: 600, color: true, duplex: true } },
  /* 아직: JBIG(0x13 · 0x15) 기종 */
  { match: /ml-?(1860|1670|1865)(?!w)/i, profile: null },
  { match: /\bcl[px]-?\d|phaser\s?6110/i, profile: null },
  /* QPDL 1 */
  { match: /ml-?(1510|1520|1610|1710|1740)\b/i, profile: { ...V1, band: "fixed", dpi: 300 } },
  { match: /ml-?(2150|2550)\b/i, profile: { ...V1, band: "line", dpi: 300, duplex: true } },
  { match: /ml-?(1750|2571)\b/i, profile: { ...V1, band: "line", dpi: 300 } },
  { match: /ml-?(2250|2251)\b/i, profile: { ...V1, band: "fixed", dpi: 600 } },
  { match: /ml-?(3471|3560)/i, profile: { ...V1, band: "line", dpi: 600, duplex: true } },
  /* QPDL 2 */
  { match: /ml-?(1630|1640|2240|2510)\b/i, profile: { ...V2, band: "fixed", dpi: 600 } },
  { match: /ml-?(2010|2015)\b/i, profile: { ...V2, band: "line", dpi: 600 } },
  /* QPDL 3 — 신형(띠 폭 표) */
  /* M262x · M267x · M283x 는 양면 장치 있음 */
  { match: /\bm\s?-?(262\d|267\d|283\d)/i, profile: { ...V3B, band: "special", dpi: 600, duplex: true } },
  { match: /\bm\s?-?(20[2-7]\d|26[2-9]\d|28[2-8]\d)|ml-?1865w/i, profile: { ...V3B, band: "special", dpi: 600 } },
  { match: /ml-?(1915|2165)/i, profile: { ...V3B, band: "line", dpi: 600 } },
  /* 양면 장치 있는 QPDL 3 기종 */
  { match: /ml-?(3051|3310)|scx-?(5330|5530)/i, profile: { ...V3, band: "line", dpi: 600, duplex: true } },
  /* QPDL 3 — 나머지 ML · SCX (ML-1660 · 2160 · 2525 · 2580 · 3050 · 3310 · SCX-3200/3400/4600/4623/5330/5530 …) */
  { match: /ml-?\d{4}|scx-?\d{4}/i, profile: { ...V3, band: "line", dpi: 600 } },
];

/** 모델명 → SPL 설정. 모르는 삼성 · 제록스 레이저는 가장 흔한 QPDL 3 으로. 지원하지 않는 계열은 null */
export function splProfile(model: string): SplProfile | null {
  const text = model || "";
  for (const rule of RULES) if (rule.match.test(text)) return rule.profile;
  return { ...V3, band: "line", dpi: 600 };
}

/* ───────── 용지 ───────── */
const PAPER_TYPE: Record<string, number> = { Letter: 0, Legal: 1, A4: 2, A3: 5, B4: 10, B5: 11, Postcard: 14, A5: 16, A6: 17 };
/** 신형(M2020 계열) 띠 폭(바이트, 600dpi) */
const SPECIAL_WIDTH: Record<number, number> = { 0: 640, 1: 640, 2: 608, 5: 864, 10: 736, 11: 544, 14: 288, 16: 416, 17: 288 };

export type SplGeometry = {
  /** 쪽 머리에 넣는 300dpi 기준 폭 · 높이 */
  width300: number;
  height300: number;
  paperType: number;
  dpi: number;
  /** 보낼 띠 폭(바이트)과 높이(줄) */
  bandBytes: number;
  bandHeight: number;
  /** 위 여백을 뺀, 띠로 보낼 줄 수 */
  rows: number;
  /** 그림을 놓을 영역(점) — 왼쪽 · 위 여백 다음부터 */
  areaW: number;
  areaH: number;
};

export function splGeometry(paper: string, profile: SplProfile): SplGeometry {
  const mm = paperMm(paper, "portrait");
  const ptW = Math.round((mm.width / 25.4) * 72);
  const ptH = Math.round((mm.height / 25.4) * 72);
  const dpi = profile.dpi;
  const pageW = Math.floor((ptW * dpi) / 72);
  const pageH = Math.floor((ptH * dpi) / 72);
  const marginX = (Math.ceil((profile.margin * dpi) / 72) + 7) & ~7;
  const marginY = Math.ceil((profile.margin * dpi) / 72);
  const lineBytes = Math.ceil(pageW / 8);
  const paperType = PAPER_TYPE[paper] ?? 2;
  let bandBytes = lineBytes;
  if (profile.band === "fixed") bandBytes = Math.floor((dpi * 4960) / 600 / 8);
  if (profile.band === "special") bandBytes = (SPECIAL_WIDTH[paperType] ?? lineBytes) * (dpi / 600);
  return {
    width300: Math.ceil((300 * ptW) / 72),
    height300: Math.ceil((300 * ptH) / 72),
    paperType,
    dpi,
    bandBytes,
    bandHeight: dpi === 300 ? 64 : 128,
    rows: pageH - marginY,
    areaW: Math.min(pageW - marginX * 2, bandBytes * 8),
    areaH: pageH - marginY * 2,
  };
}

/* ───────── 0x11 압축 ───────── */
const TABLE = 64;
const MAX_LITERAL = 128;
const MAX_MATCH = 0x202;
const SAMPLE = 0x800;

/** 자주 되풀이되는 거리 64개를 고른다(띠 데이터를 띄엄띄엄 훑어 같은 바이트가 나온 거리) */
function pickDistances(data: Uint8Array): number[] {
  const count = new Uint32Array(SAMPLE);
  for (let i = SAMPLE; i < data.length; i += SAMPLE) {
    const b = data[i];
    for (let j = 1; j < SAMPLE; j++) if (data[i - j] === b) count[j - 1]++;
  }
  const order = Array.from({ length: SAMPLE }, (_, i) => i).sort((a, b) => count[b] - count[a] || a - b);
  const table = order.slice(0, TABLE).map((i) => i + 1);
  /* 거리 1(같은 바이트 되풀이)은 늘 넣는다 */
  if (!table.includes(1)) table[TABLE - 1] = 1;
  return table;
}

/**
 * 0x11 압축. 되풀이가 거의 없는 띠(빽빽한 사진 디더링)는 원본보다 조금 커질 수 있다 —
 * 예전에는 그때 null 을 돌려 그 띠가 통째로 빠졌다(인쇄물에 흰 줄). 이제 날 데이터 묶음으로 그대로 싣는다.
 * 최악의 크기: 머리 4 + 거리 표 128 + 원본 + 128바이트마다 표시 1바이트.
 */
export function splCompress(data: Uint8Array): Uint8Array | null {
  const size = data.length;
  if (!size) return null;
  const table = pickDistances(data);
  const cap = 4 + TABLE * 2 + size + Math.ceil(size / MAX_LITERAL) + 8;
  const out = new Uint8Array(cap);
  let w = 4;
  let head = 0;
  for (const d of table) {
    out[w++] = d & 0xff;
    out[w++] = (d >> 8) & 0xff;
    head = Math.max(head, d);
  }
  head = Math.min(head, MAX_LITERAL, size);
  out.set(data.subarray(0, head), w);
  w += head;
  out[0] = head & 0xff;
  out[1] = (head >> 8) & 0xff;
  out[2] = (head >> 16) & 0xff;
  out[3] = (head >>> 24) & 0xff;
  let r = head;
  let literal = 0;
  let literalAt = 0;
  while (r < size) {
    const room = Math.min(MAX_MATCH, size - r);
    let best = 0;
    let bestIndex = 0;
    if (room >= 3) {
      for (let i = 0; i < TABLE; i++) {
        const d = table[i];
        if (d > r) continue;
        let n = 0;
        while (n < room && data[r + n] === data[r - d + n]) n++;
        if (n > best) {
          best = n;
          bestIndex = i;
          if (n === room) break;
        }
      }
    }
    if (best >= 3) {
      if (w + 2 >= cap) return null;
      const n = best - 3;
      out[w++] = 0x80 | (n & 0x7f);
      out[w++] = ((n >> 1) & 0xc0) | (bestIndex & 0x3f);
      r += best;
      literal = 0;
      continue;
    }
    if (literal === 0) {
      if (w + 2 >= cap) return null;
      literalAt = w++;
    }
    out[literalAt] = literal;
    out[w++] = data[r++];
    literal++;
    if (literal === MAX_LITERAL) literal = 0;
    if (w >= cap) return null;
  }
  return out.slice(0, w);
}

/* ───────── 바이트 도구 ───────── */
function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
const be16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const be32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const SIGNATURE = [0xef, 0xcd, 0xab, 0x09];

/** 띠 하나(세로 우선 · 비트 뒤집힌 데이터) → 패킷. 압축이 안 되면 null */
export function splBandPacket(bandNumber: number, bandBytes: number, bandHeight: number, data: Uint8Array): Uint8Array | null {
  const packed = splCompress(data);
  if (!packed) return null;
  let sum = SIGNATURE.reduce((a, b) => a + b, 0);
  for (const b of packed) sum += b;
  const head = [0x0c, bandNumber & 0xff, ...be16(bandBytes * 8), ...be16(bandHeight), 0x11, ...be32(packed.length + 8), ...SIGNATURE];
  return concat([Uint8Array.from(head), packed, Uint8Array.from(be32(sum >>> 0))]);
}

/* ───────── 작업 · 쪽 ───────── */
export function splJobHeader(options: { name?: string; date?: Date; duplex?: "simplex" | "long" | "short"; color?: boolean | null } = {}): Uint8Array {
  const at = options.date ?? new Date();
  const ymd = `${at.getFullYear()}${String(at.getMonth() + 1).padStart(2, "0")}${String(at.getDate()).padStart(2, "0")}`;
  const name = (options.name || "nuguna").replace(/[^\x20-\x7e]/g, "").replace(/"/g, "").slice(0, 40) || "nuguna";
  const lines = [
    `@PJL DEFAULT SERVICEDATE=${ymd}`,
    `@PJL SET USERNAME="nuguna"`,
    `@PJL SET JOBNAME="${name}"`,
    "@PJL SET JAMRECOVERY=OFF",
    /* 컬러 기종만: 컬러 · 흑백 */
    ...(options.color === true ? ["@PJL SET COLORMODE=COLOR"] : options.color === false ? ["@PJL SET COLORMODE=MONO"] : []),
    ...(options.duplex === "long" ? ["@PJL SET DUPLEX=ON", "@PJL SET BINDING=LONGEDGE"] : options.duplex === "short" ? ["@PJL SET DUPLEX=ON", "@PJL SET BINDING=SHORTEDGE"] : ["@PJL SET DUPLEX=OFF"]),
    "@PJL SET PAPERTYPE=OFF",
    "@PJL SET ALTITUDE=LOW",
    "@PJL SET DENSITY=3",
    "@PJL SET RET=NORMAL",
    "@PJL ENTER LANGUAGE = QPDL",
  ];
  return Uint8Array.from(`\x1b%-12345X${lines.join("\n")}\n`, (ch) => ch.charCodeAt(0));
}

export function splJobFooter(): Uint8Array {
  return Uint8Array.from("\x09\x1b%-12345X", (ch) => ch.charCodeAt(0));
}

/**
 * 쪽 머리(17바이트): 해상도 · 부수 · 용지 · 300dpi 크기 · 급지(자동) · 0x0B 긴 쪽(단면도 1) · 0x0C 앞면 표시 · QPDL 버전.
 * 양면: 0x0B = 긴 쪽 1 / 짧은 쪽 0, 0x0C = 쪽 번호(1부터)가 홀수면 1(앞면) · 짝수면 0(뒷면)
 */
export function splPageHeader(geo: SplGeometry, profile: SplProfile, copies: number, side?: { duplex: "long" | "short"; page: number }): Uint8Array {
  return Uint8Array.from([
    0x00,
    geo.dpi / 100,
    ...be16(copies),
    geo.paperType,
    ...be16(geo.width300),
    ...be16(geo.height300),
    1,
    profile.doc[0],
    side?.duplex === "short" ? 0 : 1,
    side ? side.page % 2 : 0,
    profile.doc[1],
    profile.qpdl,
    profile.doc[2],
    geo.dpi / 100,
  ]);
}

export function splPageFooter(copies: number): Uint8Array {
  return Uint8Array.from([0x01, ...be16(copies)]);
}

/**
 * 페이지 캔버스 → 쪽 명령(머리 · 띠 · 꼬리).
 * 띠 높이만큼씩 그려서 흑백으로 바꾸므로 600dpi A4 도 메모리를 적게 쓴다. 빈 띠는 건너뛴다.
 */
export function splPageCommands(
  source: HTMLCanvasElement,
  options: { paper: string; profile: SplProfile; copies: number; mode: "dither" | "threshold"; color?: boolean; side?: { duplex: "long" | "short"; page: number } },
): Uint8Array[] {
  const { profile } = options;
  const geo = splGeometry(options.paper, profile);
  const copies = Math.max(1, Math.min(999, options.copies));
  const width = geo.bandBytes * 8;
  const band = document.createElement("canvas");
  band.width = width;
  band.height = geo.bandHeight;
  const ctx = band.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas");
  const landscape = source.width > source.height;
  const out: Uint8Array[] = [splPageHeader(geo, profile, copies, options.side)];
  /* 컬러 기종: C · M · Y · K 네 면(흑백을 고르면 K 한 면만), 0x0D 기종: 줄 우선 */
  const colorPlanes = profile.color && options.color;
  if (profile.color || profile.comp === 0x0d) {
    const bands = Math.ceil(geo.rows / geo.bandHeight);
    for (let index = 0; index < bands; index++) {
      const top = index * geo.bandHeight;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, geo.bandHeight);
      if (top < geo.areaH) {
        ctx.translate(0, -top);
        if (landscape) {
          ctx.translate(geo.areaW, 0);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(source, 0, 0, geo.areaH, geo.areaW);
        } else ctx.drawImage(source, 0, 0, geo.areaW, geo.areaH);
      }
      const rgba = ctx.getImageData(0, 0, width, geo.bandHeight).data;
      const live = Math.min(geo.bandHeight, geo.rows - top);
      const record = profile.comp === 0x0d ? band0x0dRecord(index, rgba, width, geo, live, options.mode) : colorRecord(index, rgba, width, geo, live, options.mode, Boolean(colorPlanes));
      if (record) out.push(record);
    }
    band.width = 0;
    band.height = 0;
    out.push(splPageFooter(copies));
    return out;
  }
  const data = new Uint8Array(geo.bandBytes * geo.bandHeight);
  const bands = Math.ceil(geo.rows / geo.bandHeight);
  for (let index = 0; index < bands; index++) {
    const top = index * geo.bandHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, geo.bandHeight);
    if (top < geo.areaH) {
      ctx.translate(0, -top);
      if (landscape) {
        ctx.translate(geo.areaW, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(source, 0, 0, geo.areaH, geo.areaW);
      } else ctx.drawImage(source, 0, 0, geo.areaW, geo.areaH);
    }
    const rgba = ctx.getImageData(0, 0, width, geo.bandHeight).data;
    const luma = new Float32Array(width * geo.bandHeight);
    for (let i = 0; i < luma.length; i++) {
      const a = rgba[i * 4 + 3] / 255;
      luma[i] = (0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]) * a + 255 * (1 - a);
    }
    /* 마지막 띠의 종이 밖 줄은 흰색 */
    const live = Math.min(geo.bandHeight, geo.rows - top);
    const mono = monoFromLuma(luma, width, geo.bandHeight, options.mode);
    data.fill(0);
    let ink = false;
    for (let y = 0; y < live; y++) {
      for (let x = 0; x < geo.bandBytes; x++) {
        let byte = 0;
        const base = y * width + x * 8;
        for (let bit = 0; bit < 8; bit++) if (mono[base + bit]) byte |= 0x80 >> bit;
        if (byte) {
          ink = true;
          data[x * geo.bandHeight + y] = byte;
        }
      }
    }
    if (!ink) continue;
    for (let i = 0; i < data.length; i++) data[i] = ~data[i] & 0xff;
    const packet = splBandPacket(index, geo.bandBytes, geo.bandHeight, data);
    if (packet) out.push(packet);
  }
  band.width = 0;
  band.height = 0;
  out.push(splPageFooter(copies));
  return out;
}

/** RGBA → 휘도(255 = 흰색), 투명은 흰 종이 */
function lumaOf(rgba: Uint8ClampedArray, count: number) {
  const luma = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = rgba[i * 4 + 3] / 255;
    luma[i] = (0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]) * a + 255 * (1 - a);
  }
  return luma;
}

/** 0x0D 기종 띠: 줄 우선 1비트(1 = 검정), 빈 띠는 null */
function band0x0dRecord(index: number, rgba: Uint8ClampedArray, width: number, geo: SplGeometry, live: number, mode: "dither" | "threshold") {
  const mono = monoFromLuma(lumaOf(rgba, width * geo.bandHeight), width, geo.bandHeight, mode);
  const rows = new Uint8Array(geo.bandBytes * geo.bandHeight);
  let ink = false;
  for (let y = 0; y < live; y++)
    for (let x = 0; x < width; x++)
      if (mono[y * width + x]) {
        rows[y * geo.bandBytes + (x >> 3)] |= 0x80 >> (x & 7);
        ink = true;
      }
  if (!ink) return null;
  return band0x0d(index, geo.bandBytes, geo.bandHeight, rows, geo.dpi === 300 ? 300 : 600);
}

/** 컬러 기종 띠(0x11): 면마다 세로 우선 · 뒤집어(1 = 흰색) 압축. 흑백이면 K 한 면 */
function colorRecord(index: number, rgba: Uint8ClampedArray, width: number, geo: SplGeometry, live: number, mode: "dither" | "threshold", color: boolean) {
  const count = width * geo.bandHeight;
  /* 면별 '흰 정도'(255 = 잉크 없음): 간단한 회색 성분 분리 — K = min(C, M, Y) */
  const planes: [number, Float32Array][] = color ? [[1, new Float32Array(count)], [2, new Float32Array(count)], [3, new Float32Array(count)], [4, new Float32Array(count)]] : [[4, lumaOf(rgba, count)]];
  if (color) {
    for (let i = 0; i < count; i++) {
      const a = rgba[i * 4 + 3] / 255;
      const r = (rgba[i * 4] * a + 255 * (1 - a)) / 255;
      const g = (rgba[i * 4 + 1] * a + 255 * (1 - a)) / 255;
      const b = (rgba[i * 4 + 2] * a + 255 * (1 - a)) / 255;
      const c = 1 - r;
      const m = 1 - g;
      const y = 1 - b;
      const k = Math.min(c, m, y);
      const div = k < 1 ? 1 - k : 1;
      planes[0][1][i] = 255 * (1 - (c - k) / div);
      planes[1][1][i] = 255 * (1 - (m - k) / div);
      planes[2][1][i] = 255 * (1 - (y - k) / div);
      planes[3][1][i] = 255 * (1 - k);
    }
  }
  const packed: [number, Uint8Array][] = [];
  const data = new Uint8Array(geo.bandBytes * geo.bandHeight);
  for (const [number, light] of planes) {
    const mono = monoFromLuma(light, width, geo.bandHeight, mode);
    data.fill(0);
    let ink = false;
    for (let y = 0; y < live; y++)
      for (let x = 0; x < geo.bandBytes; x++) {
        let byte = 0;
        const base = y * width + x * 8;
        for (let bit = 0; bit < 8; bit++) if (mono[base + bit]) byte |= 0x80 >> bit;
        if (byte) {
          ink = true;
          data[x * geo.bandHeight + y] = byte;
        }
      }
    if (!ink) continue;
    for (let i = 0; i < data.length; i++) data[i] = ~data[i] & 0xff;
    const body = splCompress(data);
    if (body) packed.push([number, body]);
  }
  return colorBandRecord(index, width, geo.bandHeight, packed);
}
