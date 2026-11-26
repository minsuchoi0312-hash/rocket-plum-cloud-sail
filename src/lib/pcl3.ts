/**
 * HP 잉크젯 PCL3 인코더 — DeskJet · OfficeJet · Business Inkjet 처럼 PCL3(래스터)를 받는 HP 잉크젯용. 컬러 가능.
 * 페이지 캔버스(RGB)를 K · C · M · Y 네 판(1비트)으로 나누고 오차 확산으로 점을 찍어 9100(Raw)로 보낸다.
 *
 * 형식(HP PCL3 공개 규격의 "Simple Color" 래스터):
 *   ESC E · 용지(ESC&l#A) · 세로 · 위 여백 0 · 용지 종류 · 부수(ESC&l#X)
 *   쪽마다: ESC*t300R · ESC*r-4U(KCMY, 3색 기종은 -3U · 흑백은 생략) · ESC*b2M(TIFF/PackBits)
 *           · ESC&a#H/#V(시작 위치, 1/720인치) · ESC*r#S/#T(폭 · 높이) · ESC*r1A
 *           · 줄마다 판 순서대로 ESC*b#V(마지막 판은 #W) + 압축 데이터 · ESC*rC · FF
 *   끝: ESC E
 */
import { monoFromLuma, packBits, paperMm } from "./office-job.ts";

export const PCL3_DPI = 300;

export type Pcl3Profile = { inks: "kcmy" | "cmy" };

/** HP 잉크젯이면 설정을, 아니면 null. 3색(검정 없는 한 카트리지) 초기 DeskJet 은 CMY */
export function pcl3Profile(model: string): Pcl3Profile | null {
  const text = model || "";
  if (!/\b(hp|hewlett)/i.test(text) && !/deskjet|officejet|photosmart|business inkjet|\bpsc\b/i.test(text)) return null;
  if (!/deskjet|officejet|photosmart|business inkjet|envy|smart tank|ink tank|tango|\bpsc\b|\b(2000|2500)c/i.test(text)) return null;
  if (/deskjet\s*(3[0-4]\d|4[0-4]\d|5[0-4]\dc?)\b/i.test(text)) return { inks: "cmy" };
  return { inks: "kcmy" };
}

/* 용지 코드(PCL) */
const PAPER_CODE: Record<string, number> = { Letter: 2, Legal: 3, A6: 24, A5: 25, A4: 26, A3: 27, B5: 45, B4: 46, Postcard: 71 };

/** 잉크젯 안전 여백(pt): 왼 · 오른 · 위 · 아래(아래가 넓다) */
const MARGIN = { left: 18, right: 18, top: 18, bottom: 36 };

export type Pcl3Geometry = { width: number; height: number; left: number; top: number; code: number };

/** 인쇄 영역(300dpi 점)과 시작 위치(1/720인치) */
export function pcl3Geometry(paper: string): Pcl3Geometry {
  const mm = paperMm(paper, "portrait");
  const ptW = (mm.width / 25.4) * 72;
  const ptH = (mm.height / 25.4) * 72;
  return {
    width: Math.floor(((ptW - MARGIN.left - MARGIN.right) * PCL3_DPI) / 72),
    height: Math.floor(((ptH - MARGIN.top - MARGIN.bottom) * PCL3_DPI) / 72),
    left: MARGIN.left * 10,
    top: MARGIN.top * 10,
    code: PAPER_CODE[paper] ?? 26,
  };
}

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

export function pcl3JobHeader(options: { paper: string; copies: number }): Uint8Array {
  const geo = pcl3Geometry(options.paper);
  const copies = Math.max(1, Math.min(99, options.copies));
  /* 리셋 · 용지 · 세로 · 천공 건너뛰기 끔 · 위 여백 0 · 보통 용지 · 부수 */
  return ascii(`\x1bE\x1b&l${geo.code}A\x1b&l0O\x1b&l0L\x1b&l0E\x1b&l0M\x1b&l${copies}X`);
}

export function pcl3JobFooter(): Uint8Array {
  return ascii("\x1bE");
}

/** 한 줄의 판 하나: 1비트 점(1 = 잉크) → PackBits */
function planeRow(bits: Uint8Array, offset: number, width: number) {
  const bytes = new Uint8Array(Math.ceil(width / 8));
  let ink = false;
  for (let x = 0; x < width; x++) {
    if (bits[offset + x]) {
      bytes[x >> 3] |= 0x80 >> (x & 7);
      ink = true;
    }
  }
  return ink ? packBits(bytes) : new Uint8Array(0);
}

/**
 * 페이지 캔버스 → 쪽 명령. color=false 면 검정 판 하나만 보낸다.
 * 띠(256줄)씩 그려서 판을 나누므로 메모리를 적게 쓴다.
 */
export function pcl3PageCommands(source: HTMLCanvasElement, options: { paper: string; color: boolean; profile: Pcl3Profile }): Uint8Array[] {
  const geo = pcl3Geometry(options.paper);
  /* 3색 기종은 검정 카트리지가 없으니 흑백도 세 색을 섞어 낸다 */
  const inks = options.profile.inks === "cmy" ? 3 : options.color ? 4 : 1;
  const setup = [
    `\x1b*t${PCL3_DPI}R`,
    inks === 4 ? "\x1b*r-4U" : inks === 3 ? "\x1b*r-3U" : "",
    "\x1b*b2M",
    `\x1b&a${geo.left}H\x1b&a${geo.top}V`,
    `\x1b*r${geo.width}S\x1b*r${geo.height}T`,
    "\x1b*r1A",
  ].join("");
  const out: Uint8Array[] = [ascii(setup)];
  const BAND = 256;
  const band = document.createElement("canvas");
  band.width = geo.width;
  band.height = BAND;
  const ctx = band.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas");
  const landscape = source.width > source.height;
  const width = geo.width;
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
    /* 판마다 "잉크 없음 = 255" 인 밝기 값으로 만들어 오차 확산 */
    const k = new Float32Array(count);
    const c = inks > 1 ? new Float32Array(count) : null;
    const mg = inks > 1 ? new Float32Array(count) : null;
    const yl = inks > 1 ? new Float32Array(count) : null;
    for (let i = 0; i < count; i++) {
      const a = rgba[i * 4 + 3] / 255;
      const r = (rgba[i * 4] * a + 255 * (1 - a)) / 255;
      const g = (rgba[i * 4 + 1] * a + 255 * (1 - a)) / 255;
      const b = (rgba[i * 4 + 2] * a + 255 * (1 - a)) / 255;
      if (inks === 1) {
        k[i] = (0.299 * r + 0.587 * g + 0.114 * b) * 255;
        continue;
      }
      let cc = 1 - r;
      let mm = 1 - g;
      let yy = 1 - b;
      if (inks === 4) {
        /* 회색 성분은 검정 잉크로 (UCR) */
        const kk = Math.min(cc, mm, yy);
        k[i] = (1 - kk) * 255;
        cc -= kk;
        mm -= kk;
        yy -= kk;
      }
      c![i] = (1 - cc) * 255;
      mg![i] = (1 - mm) * 255;
      yl![i] = (1 - yy) * 255;
    }
    const planes: Uint8Array[] = [];
    if (inks !== 3) planes.push(monoFromLuma(k, width, rows, "dither"));
    if (inks > 1) planes.push(monoFromLuma(c!, width, rows, "dither"), monoFromLuma(mg!, width, rows, "dither"), monoFromLuma(yl!, width, rows, "dither"));
    for (let y = 0; y < rows; y++) {
      planes.forEach((plane, index) => {
        const data = planeRow(plane, y * width, width);
        const last = index === planes.length - 1;
        out.push(concat([ascii(`\x1b*b${data.length}${last ? "W" : "V"}`), data]));
      });
    }
  }
  band.width = 0;
  band.height = 0;
  out.push(ascii("\x1b*rC\x0c"));
  return out;
}
