/**
 * 메모 서식: 글자 크기(작게/보통/크게) + 제목·날짜 머리글.
 * '보통 + 머리글 없음'은 기존 렌더러를 그대로 쓰고(출력 동일), 그 밖의 경우만 이 렌더러를 쓴다.
 */
import { tr } from "@/lib/i18n/core";
import { paginateLines, wrapMeasuredLines } from "@/lib/office-job";

export type MemoSize = "small" | "normal" | "large";
export type MemoStyle = { size: MemoSize; header: boolean; title: string; date: string };

export function memoSizeLabel(size: MemoSize) {
  return tr(size === "small" ? "memo.small" : size === "large" ? "memo.large" : "memo.normal");
}
const SIZE_PT: Record<MemoSize, number> = { small: 10, normal: 13, large: 18 };
const PT_MM = 25.4 / 72;

export function memoIsDefault(style: MemoStyle) {
  return style.size === "normal" && !style.header;
}

export function memoToday(at = Date.now()) {
  const d = new Date(at);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function metrics(width: number, height: number, style: MemoStyle, pxPerMm: number) {
  const font = Math.max(8, SIZE_PT[style.size] * PT_MM * pxPerMm);
  const line = font * 1.5;
  const margin = 15 * pxPerMm;
  const headerH = style.header ? 16 * pxPerMm : 0;
  const top = margin + headerH + font;
  const usableW = Math.max(40, width - margin * 2);
  const perPage = Math.max(1, Math.floor((height - top - margin + line - font) / line));
  return { font, line, margin, headerH, top, usableW, perPage };
}

function fontCss(px: number, weight = 400) {
  return `${weight} ${Math.round(px)}px "Pretendard Variable", Pretendard, Roboto, "Segoe UI", "Noto Sans", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "Hiragino Sans", "Yu Gothic", sans-serif`;
}

export function memoChunksStyled(text: string, width: number, height: number, style: MemoStyle, pxPerMm: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [text];
  const m = metrics(width, height, style, pxPerMm);
  ctx.font = fontCss(m.font);
  const lines = wrapMeasuredLines(text, (value) => ctx.measureText(value).width, m.usableW);
  return paginateLines(lines, m.perPage);
}

export function drawMemoStyled(canvas: HTMLCanvasElement, chunk: string, style: MemoStyle, pxPerMm: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const W = canvas.width;
  const H = canvas.height;
  const m = metrics(W, H, style, pxPerMm);
  ctx.save();
  ctx.filter = "none";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "alphabetic";
  if (style.header) {
    const titleSize = 15 * PT_MM * pxPerMm;
    const dateSize = 9.5 * PT_MM * pxPerMm;
    const baseY = m.margin + titleSize;
    ctx.font = fontCss(dateSize);
    const date = style.date.trim();
    const dateW = date ? ctx.measureText(date).width : 0;
    ctx.fillText(date, W - m.margin - dateW, baseY);
    ctx.font = fontCss(titleSize, 600);
    ctx.fillText(style.title.trim() || tr("memo.default"), m.margin, baseY, Math.max(40, m.usableW - dateW - 6 * pxPerMm));
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = Math.max(1, 0.35 * pxPerMm);
    ctx.beginPath();
    ctx.moveTo(m.margin, baseY + 4 * pxPerMm);
    ctx.lineTo(W - m.margin, baseY + 4 * pxPerMm);
    ctx.stroke();
  }
  ctx.font = fontCss(m.font);
  let y = m.top;
  for (const row of chunk.split("\n")) {
    if (row) ctx.fillText(row, m.margin, y, m.usableW);
    y += m.line;
  }
  ctx.restore();
  return canvas;
}
