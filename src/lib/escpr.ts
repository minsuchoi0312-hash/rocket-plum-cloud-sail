/**
 * 엡손 잉크젯 ESC/P-R 인코더 — 페이지 캔버스(RGB)를 엡손이 공개한 ESC/P-R 명령으로 바꾼다.
 * 네트워크 엡손 프린터의 9100(Raw) 포트로 그대로 보내면 된다.
 *
 * 명령 형식(엡손 공개 규격):
 *   ESC <분류 1바이트> <매개변수 길이 4바이트 LE> <명령 이름 4글자> <매개변수(숫자는 BE)>
 *   작업 시작: 패킷 모드 해제 → ESC @ → 원격 모드(JS·JH·PP) → ESC/P-R 진입 → setq · seti · setj
 *   쪽: sttp → 줄마다 dsnd(x, y, 압축, 크기, RGB) → endp(다음 쪽 있음 1 / 없음 0)
 *   끝: endj → ESC @ → 원격 모드(JE) 종료
 * 해상도는 모든 ESC/P-R 기종이 받는 360dpi, 여백은 규격의 기본 3mm(42점).
 */
import { paperMm } from "./office-job.ts";

export const ESCPR_DPI = 360;
/** 규격 기본 여백(3mm @360dpi) */
const BORDER = 42;

export type EscprOptions = {
  paper: string;
  color: boolean;
  quality?: "draft" | "normal" | "high";
  /** 작업 이름(원격 JH, 영문 8자까지) */
  name?: string;
};

export type EscprGeometry = { paperW: number; paperH: number; areaW: number; areaH: number };

/** 용지(세로 기준) 크기와 인쇄 영역을 360dpi 점으로 */
export function escprGeometry(paper: string): EscprGeometry {
  const mm = paperMm(paper, "portrait");
  const paperW = Math.round((mm.width / 25.4) * ESCPR_DPI);
  const paperH = Math.round((mm.height / 25.4) * ESCPR_DPI);
  return { paperW, paperH, areaW: paperW - BORDER * 2, areaH: paperH - BORDER * 2 };
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

const be16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const be32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const le32 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];

/** ESC/P-R 명령 하나: ESC 분류 · 길이(LE) · 이름 · 매개변수 */
function command(kind: string, name: string, params: ArrayLike<number> = []) {
  const out = new Uint8Array(10 + params.length);
  out[0] = 0x1b;
  out[1] = kind.charCodeAt(0);
  out.set(le32(params.length), 2);
  out.set(ascii(name), 6);
  out.set(Array.from(params), 10);
  return out;
}

/** 원격 모드 명령 하나: 이름 2글자 · 길이 2바이트(LE) · 매개변수 */
function remote(name: string, params: number[]) {
  return Uint8Array.from([...ascii(name), params.length & 0xff, (params.length >> 8) & 0xff, ...params]);
}

const EXIT_PACKET_MODE = Uint8Array.from([0x00, 0x00, 0x00, 0x1b, 0x01, ...ascii("@EJL 1284.4\n@EJL     \n")]);
const INIT = Uint8Array.from([0x1b, 0x40]);
const ENTER_REMOTE = Uint8Array.from([0x1b, 0x28, 0x52, 0x08, 0x00, 0x00, ...ascii("REMOTE1")]);
const EXIT_REMOTE = Uint8Array.from([0x1b, 0x00, 0x00, 0x00]);
const ENTER_ESCPR = Uint8Array.from([0x1b, 0x28, 0x52, 0x06, 0x00, 0x00, ...ascii("ESCPR")]);

/** 작업 머리말 */
export function escprJobHeader(options: EscprOptions): Uint8Array {
  const geo = escprGeometry(options.paper);
  const name = (options.name || "NUGUNA").replace(/[^\x20-\x7e]/g, "").slice(0, 8).padEnd(8, " ");
  const quality = options.quality === "draft" ? 0 : options.quality === "high" ? 2 : 1;
  return concat([
    EXIT_PACKET_MODE,
    INIT,
    ENTER_REMOTE,
    remote("JS", [0x00, 0x00, 0x00, 0x00]),
    remote("JH", [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...ascii(name)]),
    /* 급지: 자동 선택 */
    remote("PP", [0x00, 0x01, 0xff]),
    EXIT_REMOTE,
    ENTER_ESCPR,
    /* setq: 용지 종류(보통 용지 0) · 품질 · 색(0 컬러 / 1 흑백) · 밝기 · 대비 · 채도 · 색 평면(0 RGB) · 팔레트 크기 0 */
    command("q", "setq", [0x00, quality, options.color ? 0 : 1, 0, 0, 0, 0, ...be16(0)]),
    /* seti: 이미지 처리 기본값 (마지막 바이트 = 양면 제본 위치, 단면 0) */
    command("q", "seti", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    /* setj: 용지 폭 · 길이 · 위 · 왼쪽 여백 · 인쇄 폭 · 높이 · 해상도(0 = 360dpi) · 방향(0 양방향) */
    command("j", "setj", [...be32(geo.paperW), ...be32(geo.paperH), ...be16(BORDER), ...be16(BORDER), ...be32(geo.areaW), ...be32(geo.areaH), 0x00, 0x00]),
  ]);
}

/** 작업 꼬리말 */
export function escprJobFooter(): Uint8Array {
  return concat([command("j", "endj"), INIT, ENTER_REMOTE, remote("JE", [0x00]), EXIT_REMOTE]);
}

/**
 * ESC/P-R 줄 압축: 3바이트 RGB 점 단위 PackBits.
 *  같은 점 n개(2~129) → (257 − n), 점 / 다른 점 n개(1~128) → (n − 1), 점들
 * 압축이 원본보다 커지면 null(무압축으로 보낸다).
 */
export function escprRle(row: Uint8Array, pixels: number): Uint8Array | null {
  const limit = pixels * 3;
  const out = new Uint8Array(limit + 4);
  let o = 0;
  let i = 0;
  const same = (a: number, b: number) => row[a * 3] === row[b * 3] && row[a * 3 + 1] === row[b * 3 + 1] && row[a * 3 + 2] === row[b * 3 + 2];
  while (i < pixels) {
    if (i + 1 < pixels && same(i, i + 1)) {
      let run = 2;
      while (i + run < pixels && run < 129 && same(i + run - 1, i + run)) run++;
      if (o + 4 > limit) return null;
      out[o++] = 257 - run;
      out[o++] = row[i * 3];
      out[o++] = row[i * 3 + 1];
      out[o++] = row[i * 3 + 2];
      i += run;
    } else {
      let lit = 1;
      while (i + lit + 1 < pixels && lit < 128 && !same(i + lit, i + lit + 1)) lit++;
      if (o + 1 + lit * 3 > limit) return null;
      out[o++] = lit - 1;
      out.set(row.subarray(i * 3, (i + lit) * 3), o);
      o += lit * 3;
      i += lit;
    }
  }
  return out.slice(0, o);
}

/** 한 줄 보내기(dsnd): x · y · 압축(1 RLE / 0 없음) · 크기 · 데이터 */
function sendLine(y: number, row: Uint8Array, pixels: number) {
  const packed = escprRle(row, pixels);
  const data = packed ?? row.subarray(0, pixels * 3);
  return command("d", "dsnd", [...be16(0), ...be16(y), packed ? 1 : 0, ...be16(data.length), ...data]);
}

/**
 * 페이지 캔버스 → 쪽 명령(sttp · dsnd…). 쪽 끝(endp)은 다음 쪽이 있는지 알 때 escprEndPage 로 따로 보낸다.
 * 캔버스는 인쇄 영역에 맞춰 늘이거나 줄이고(가로 캔버스는 세로 용지로 돌림), 흰 줄은 건너뛴다(프린터는 흰 바탕에서 시작).
 */
export function escprPageCommands(source: HTMLCanvasElement, options: EscprOptions): Uint8Array[] {
  const geo = escprGeometry(options.paper);
  const page = document.createElement("canvas");
  page.width = geo.areaW;
  page.height = geo.areaH;
  const ctx = page.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, page.width, page.height);
  const landscape = source.width > source.height;
  ctx.imageSmoothingQuality = "high";
  if (landscape) {
    ctx.translate(page.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(source, 0, 0, page.height, page.width);
  } else {
    ctx.drawImage(source, 0, 0, page.width, page.height);
  }
  const out: Uint8Array[] = [command("p", "sttp")];
  const width = page.width;
  const row = new Uint8Array(width * 3);
  const BAND = 128;
  for (let top = 0; top < page.height; top += BAND) {
    const rows = Math.min(BAND, page.height - top);
    const rgba = ctx.getImageData(0, top, width, rows).data;
    for (let r = 0; r < rows; r++) {
      let blank = true;
      const base = r * width * 4;
      for (let x = 0; x < width; x++) {
        const s = base + x * 4;
        /* 투명 = 흰색 */
        const a = rgba[s + 3] / 255;
        const red = Math.round(rgba[s] * a + 255 * (1 - a));
        const green = Math.round(rgba[s + 1] * a + 255 * (1 - a));
        const blue = Math.round(rgba[s + 2] * a + 255 * (1 - a));
        row[x * 3] = red;
        row[x * 3 + 1] = green;
        row[x * 3 + 2] = blue;
        if (blank && (red < 250 || green < 250 || blue < 250)) blank = false;
      }
      if (!blank) out.push(sendLine(top + r, row, width));
    }
  }
  page.width = 0;
  page.height = 0;
  return out;
}

/** 쪽 끝: 다음 쪽이 있으면 1, 마지막 쪽이면 0 */
export function escprEndPage(next: boolean): Uint8Array {
  return command("p", "endp", [next ? 1 : 0]);
}
