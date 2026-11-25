import { tr } from "@/lib/i18n/core";
function drawFit(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sw: number,
  sh: number,
  x: number,
  y: number,
  w: number,
  h: number,
  fit: "contain" | "cover",
) {
  const scale = fit === "cover" ? Math.max(w / sw, h / sh) : Math.min(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

/**
 * 모아찍기 칸 배치. 4쪽은 2×2.
 * 2쪽은 세로 용지면 위·아래(1열×2행), 가로 용지면 좌·우(2열×1행).
 */
export function nupLayout(nup: number, width: number, height: number) {
  if (nup === 4) return { cols: 2, rows: 2 };
  if (nup === 2) return width > height ? { cols: 2, rows: 1 } : { cols: 1, rows: 2 };
  return { cols: 1, rows: 1 };
}

/** 모아찍기 한 칸의 픽셀 크기 */
export function nupCell(nup: number, width: number, height: number) {
  const { cols, rows } = nupLayout(nup, width, height);
  return { width: Math.floor(width / cols), height: Math.floor(height / rows) };
}

export function composeSheet(images: CanvasImageSource[], sizes: { width: number; height: number }[], width: number, height: number, nup: number, fit: "contain" | "cover") {
  const sheet = document.createElement("canvas");
  sheet.width = width;
  sheet.height = height;
  const ctx = sheet.getContext("2d");
  if (!ctx) return sheet;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  const { cols, rows } = nupLayout(nup, width, height);
  const cellW = width / cols;
  const cellH = height / rows;
  images.forEach((image, index) => {
    const size = sizes[index];
    if (!size) return;
    const col = index % cols;
    const row = Math.floor(index / cols);
    drawFit(ctx, image, size.width, size.height, col * cellW, row * cellH, cellW, cellH, fit);
  });
  return sheet;
}

export type MarginMode = "normal" | "narrow" | "none";

/** 여백 단계별 mm (없음 = 지금까지와 같은 꽉 찬 배치) */
export const MARGIN_MM: Record<MarginMode, number> = { normal: 10, narrow: 5, none: 0 };

/**
 * 같은 크기의 새 캔버스 안쪽에 여백을 두고 원본을 비율 그대로 줄여 앉힌다.
 * 표·수험표처럼 가장자리가 프린터 비인쇄 영역에 잘리는 문서를 위한 것.
 * marginMm가 0이면 원본을 그대로 돌려준다(새 캔버스를 만들지 않는다).
 */
export function insetCanvas(source: HTMLCanvasElement, marginMm: number, sheetWidthMm: number) {
  if (marginMm <= 0 || source.width < 2 || source.height < 2) return source;
  const pxPerMm = source.width / Math.max(1, sheetWidthMm);
  const pad = Math.round(marginMm * pxPerMm);
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d");
  if (!ctx) return source;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  const boxW = Math.max(1, out.width - pad * 2);
  const boxH = Math.max(1, out.height - pad * 2);
  const scale = Math.min(boxW / source.width, boxH / source.height);
  const dw = source.width * scale;
  const dh = source.height * scale;
  ctx.drawImage(source, (out.width - dw) / 2, (out.height - dh) / 2, dw, dh);
  return out;
}

/* ───────── 쪽 번호 · 워터마크 ───────── */
export type StampOptions = { pageNumber: boolean; watermark: string };

export const WATERMARK_PRESETS = ["copy", "secret", "review"] as const;
export type WatermarkPreset = (typeof WATERMARK_PRESETS)[number];

/** 워터마크 프리셋 글자(지금 언어). 종이에도 이 글자가 찍혀요. */
export function watermarkLabel(id: WatermarkPreset) {
  return tr(id === "copy" ? "wm.copy" : id === "secret" ? "wm.secret" : "wm.review");
}

export function stampsOn(opts: StampOptions) {
  return opts.pageNumber || opts.watermark.trim().length > 0;
}

/**
 * 출력 한 장(면)에 쪽 번호(하단 중앙 "i / N")와 연한 대각선 워터마크를 그 자리에서 찍는다.
 * pxPerMm로 글자 크기를 정해 해상도(미리보기·150dpi·300dpi)와 상관없이 같은 크기로 나온다.
 */
export function stampSheet(canvas: HTMLCanvasElement, index: number, total: number, opts: StampOptions, pxPerMm: number) {
  if (!stampsOn(opts)) return canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const W = canvas.width;
  const H = canvas.height;
  const text = opts.watermark.trim().slice(0, 16);
  if (text) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.atan2(H, W));
    const diag = Math.hypot(W, H);
    let size = Math.min(diag / Math.max(2, text.length * 1.15), 60 * pxPerMm);
    ctx.font = `700 ${Math.round(size)}px "Pretendard Variable", sans-serif`;
    const width = ctx.measureText(text).width;
    if (width > diag * 0.7) {
      size *= (diag * 0.7) / width;
      ctx.font = `700 ${Math.round(size)}px "Pretendard Variable", sans-serif`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(60, 60, 60, 0.16)";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  if (opts.pageNumber) {
    ctx.save();
    /* 4.2mm(약 12pt) 굵게 · 진한 검정: 미리보기·실제 출력 모두 또렷하게 */
    ctx.font = `600 ${Math.max(11, Math.round(4.2 * pxPerMm))}px "Pretendard Variable", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const label = `${index + 1} / ${total}`;
    const y = H - 6.5 * pxPerMm;
    const w = ctx.measureText(label).width + 5 * pxPerMm;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(W / 2 - w / 2, y - 5 * pxPerMm, w, 6.8 * pxPerMm);
    ctx.fillStyle = "#000000";
    ctx.fillText(label, W / 2, y);
    ctx.restore();
  }
  return canvas;
}
