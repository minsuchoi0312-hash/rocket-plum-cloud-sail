/**
 * 사진 인쇄 보조 (순수 Canvas, 외부 패키지 없음)
 * - "문서 선명하게": 적응형 배경 추정 → 화이트 클리핑 → 글자 대비 강화
 * - 사진 개별 회전
 * - 증명사진(3×4cm 8컷) / 여권사진(3.5×4.5cm 6컷) 실물 크기 배열 + 점선 재단선
 */
import { tr } from "./i18n/core.ts";
export type Pixels = { data: Uint8ClampedArray | Uint8Array; width: number; height: number };

/** 사진 필터 3단계: 원본 / 문서 선명하게 / 흐린 필기 진하게(연필·흐린 복사본) */
export type PhotoFilter = "none" | "doc" | "pencil";
export function photoFilterLabel(filter: PhotoFilter) {
  return tr(filter === "doc" ? "flt.doc" : filter === "pencil" ? "flt.pencil" : "flt.none");
}
/** 흐린 필기: 흰점을 조금 올리고 검정점을 크게 올려 옅은 회색 선까지 진하게 */
export const FILTER_OPTS: Record<Exclude<PhotoFilter, "none">, { white: number; black: number; gamma: number }> = {
  doc: { white: 0.86, black: 0.28, gamma: 1.35 },
  pencil: { white: 0.92, black: 0.62, gamma: 1.15 },
};

/**
 * 폰으로 찍은 노트·교재·영수증: 고르지 않은 회색 배경을 흰색으로, 글자는 진하게.
 * 블록마다 밝은 쪽(90%) 값을 배경으로 보고 이를 겹선형 보간해 픽셀별로 나눈 뒤(조명 평탄화),
 * 0.86 이상은 흰색으로 날리고, 0.28 이하는 검정으로, 그 사이는 곡선으로 대비를 올린다. data를 그 자리에서 바꾼다.
 */
export function enhanceDocumentPixels(img: Pixels, opts: { white?: number; black?: number; gamma?: number } = {}) {
  const { data, width, height } = img;
  const white = opts.white ?? 0.86;
  const black = opts.black ?? 0.28;
  const gamma = opts.gamma ?? 1.35;
  const block = Math.max(16, Math.round(Math.min(width, height) / 24));
  const bw = Math.ceil(width / block);
  const bh = Math.ceil(height / block);
  const bg = new Float32Array(bw * bh);
  const hist = new Uint32Array(64);
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      hist.fill(0);
      let count = 0;
      const x1 = Math.min(width, (bx + 1) * block);
      const y1 = Math.min(height, (by + 1) * block);
      for (let y = by * block; y < y1; y += 2) {
        for (let x = bx * block; x < x1; x += 2) {
          const i = (y * width + x) * 4;
          hist[(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) >> 2]++;
          count++;
        }
      }
      let need = Math.max(1, Math.floor(count * 0.1));
      let level = 63;
      for (; level > 0; level--) {
        need -= hist[level];
        if (need <= 0) break;
      }
      bg[by * bw + bx] = Math.max(48, level * 4 + 2);
    }
  }
  let toWhite = 0;
  for (let y = 0; y < height; y++) {
    const gy = Math.min(bh - 1, Math.max(0, (y + 0.5) / block - 0.5));
    const y0 = Math.floor(gy);
    const y1 = Math.min(bh - 1, y0 + 1);
    const ty = gy - y0;
    for (let x = 0; x < width; x++) {
      const gx = Math.min(bw - 1, Math.max(0, (x + 0.5) / block - 0.5));
      const x0 = Math.floor(gx);
      const x1 = Math.min(bw - 1, x0 + 1);
      const tx = gx - x0;
      const b = (bg[y0 * bw + x0] * (1 - tx) + bg[y0 * bw + x1] * tx) * (1 - ty) + (bg[y1 * bw + x0] * (1 - tx) + bg[y1 * bw + x1] * tx) * ty;
      const i = (y * width + x) * 4;
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const n = Math.min(1, lum / b);
      if (n >= white) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        toWhite++;
        continue;
      }
      /* 검정점~흰점 사이를 늘리고(대비) 곡선으로 글자를 더 진하게 */
      const t = Math.min(1, Math.max(0, (n - black) / (white - black)));
      const target = Math.pow(t, gamma) * 255;
      const k = lum > 0 ? target / lum : 0;
      data[i] = Math.min(255, data[i] * k);
      data[i + 1] = Math.min(255, data[i + 1] * k);
      data[i + 2] = Math.min(255, data[i + 2] * k);
    }
  }
  return { whiteRatio: toWhite / (width * height), block };
}

export function enhanceCanvas(canvas: HTMLCanvasElement, filter: Exclude<PhotoFilter, "none"> = "doc") {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || canvas.width < 2 || canvas.height < 2) return canvas;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  enhanceDocumentPixels(image, FILTER_OPTS[filter]);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(tr("err.openPhoto")));
    image.src = src;
  });
}

/** 회전(90° 단위)·문서 보정을 구운 새 JPEG blob 주소. 둘 다 없으면 원본 주소 그대로. */
export async function processPhotoUrl(src: string, opts: { turn: number; filter: PhotoFilter }) {
  const turn = ((opts.turn % 360) + 360) % 360;
  if (!turn && opts.filter === "none") return src;
  const image = await loadImage(src);
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  const swap = turn === 90 || turn === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? h : w;
  canvas.height = swap ? w : h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((turn * Math.PI) / 180);
  ctx.drawImage(image, -w / 2, -h / 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (opts.filter !== "none") enhanceCanvas(canvas, opts.filter);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error(tr("img.fixFail"));
  return URL.createObjectURL(blob);
}

/* ───────── 증명사진·여권사진 ───────── */
export type PhotoLayout = "normal" | "id" | "passport";

export const ID_SPECS = {
  id: { labelKey: "id.id", wMm: 30, hMm: 40, count: 8, cols: 4 },
  passport: { labelKey: "id.passport", wMm: 35, hMm: 45, count: 6, cols: 3 },
} as const;

/** 용지(mm) 위 칸 위치(mm). 가운데 정렬, 위 여백 12mm, 칸 간격 3mm. 순수 계산이라 테스트 가능. */
export function idSheetPlan(kind: "id" | "passport", sheetWmm: number, sheetHmm: number) {
  const spec = ID_SPECS[kind];
  const gap = 3;
  let cols: number = spec.cols;
  while (cols > 1 && cols * spec.wMm + (cols - 1) * gap > sheetWmm - 10) cols--;
  const rows = Math.ceil(spec.count / cols);
  const totalW = cols * spec.wMm + (cols - 1) * gap;
  const left = (sheetWmm - totalW) / 2;
  const top = 12;
  const cells: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < spec.count; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const y = top + r * (spec.hMm + gap);
    if (y + spec.hMm > sheetHmm - 5) break;
    cells.push({ x: left + c * (spec.wMm + gap), y, w: spec.wMm, h: spec.hMm });
  }
  return { cells, cols, rows };
}

/** pxPerMm: 캔버스 1mm가 몇 픽셀인지 (실물 크기를 지키는 핵심 값) */
export function composeIdSheet(image: CanvasImageSource, size: { width: number; height: number }, sheetW: number, sheetH: number, pxPerMm: number, kind: "id" | "passport", cutLines: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, sheetW, sheetH);
  const plan = idSheetPlan(kind, sheetW / pxPerMm, sheetH / pxPerMm);
  for (const cell of plan.cells) {
    const x = cell.x * pxPerMm;
    const y = cell.y * pxPerMm;
    const w = cell.w * pxPerMm;
    const h = cell.h * pxPerMm;
    const scale = Math.max(w / size.width, h / size.height);
    const dw = size.width * scale;
    const dh = size.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
    if (cutLines) {
      ctx.save();
      ctx.strokeStyle = "#8a8a8a";
      ctx.lineWidth = Math.max(1, 0.2 * pxPerMm);
      ctx.setLineDash([1.5 * pxPerMm, 1 * pxPerMm]);
      ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
      ctx.restore();
    }
  }
  ctx.fillStyle = "#555";
  ctx.font = `${Math.round(2.8 * pxPerMm)}px "Pretendard Variable", Pretendard, Roboto, "Segoe UI", "Noto Sans", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "Hiragino Sans", "Yu Gothic", sans-serif`;
  const spec = ID_SPECS[kind];
  ctx.fillText(tr("id.footer", { label: tr(spec.labelKey) }), 10 * pxPerMm, sheetH - 8 * pxPerMm);
  return canvas;
}
