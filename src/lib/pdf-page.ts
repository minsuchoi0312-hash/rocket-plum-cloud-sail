import { tr } from "@/lib/i18n/core";
import { paginateLines, printPixelSize, wrapMeasuredLines } from "@/lib/office-job";
import { drawTestSheet, type TestSheetInfo } from "@/lib/test-sheet";

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

export function grayCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || canvas.width < 1 || canvas.height < 1) return canvas;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let index = 0; index < data.length; index += 4) {
    const lum = data[index] * 0.3 + data[index + 1] * 0.59 + data[index + 2] * 0.11;
    const value = lum < 0 ? 0 : lum > 255 ? 255 : lum;
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function jpegToPdf(jpeg: Uint8Array, imgW: number, imgH: number, pageW: number, pageH: number) {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets = [0, 0, 0, 0, 0, 0];
  let length = 0;
  const pushText = (text: string) => {
    const data = enc.encode(text);
    chunks.push(data);
    length += data.length;
  };
  const push = (data: Uint8Array) => {
    chunks.push(data);
    length += data.length;
  };
  pushText("%PDF-1.4\n");
  offsets[1] = length;
  pushText("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  offsets[2] = length;
  pushText("2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n");
  offsets[3] = length;
  pushText(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>\nendobj\n`,
  );
  const content = `q ${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm /Im0 Do Q\n`;
  offsets[4] = length;
  pushText(`4 0 obj\n<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`);
  offsets[5] = length;
  pushText(
    `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
  );
  push(jpeg);
  pushText("\nendstream\nendobj\n");
  const xrefAt = length;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let index = 1; index <= 5; index += 1) xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pushText(`${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`);
  return concat(chunks);
}

export async function downloadCanvasPdf(canvas: HTMLCanvasElement, filename: string, page: { width: number; height: number }) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error(tr("pdf.makeFail"));
  const jpeg = new Uint8Array(await blob.arrayBuffer());
  const bytes = jpegToPdf(jpeg, canvas.width, canvas.height, page.width, page.height);
  const file = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function drawFitted(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
  fit: "contain" | "cover",
  turn: number,
) {
  const turns = ((turn % 360) + 360) % 360;
  const swap = turns === 90 || turns === 270;
  const sourceWidth = Math.max(1, "width" in image ? Number(image.width) : width);
  const sourceHeight = Math.max(1, "height" in image ? Number(image.height) : height);
  const boxW = swap ? sourceHeight : sourceWidth;
  const boxH = swap ? sourceWidth : sourceHeight;
  const scale = fit === "cover" ? Math.max(width / boxW, height / boxH) : Math.min(width / boxW, height / boxH);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((turns * Math.PI) / 180);
  ctx.drawImage(image, (-sourceWidth * scale) / 2, (-sourceHeight * scale) / 2, sourceWidth * scale, sourceHeight * scale);
  ctx.restore();
}

export async function renderSheetCanvas(options: {
  kind: "test" | "memo" | "photo";
  title: string;
  note: string;
  paper: string;
  image?: CanvasImageSource | null;
  fit?: "contain" | "cover";
  turn?: number;
  gray?: boolean;
  frame?: { width: number; height: number };
  /** kind가 test일 때 점검용 테스트 시트로 그린다 */
  test?: TestSheetInfo;
}) {
  const fallback = printPixelSize(options.paper);
  const width = options.frame?.width || fallback.width;
  const height = options.frame?.height || fallback.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  if (options.kind === "test" && options.test) return drawTestSheet(canvas, options.test);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#1a2744";
  if (options.gray) ctx.filter = "grayscale(1)";
  if (options.kind === "photo" && options.image) {
    drawFitted(ctx, options.image, width, height, options.fit || "contain", options.turn || 0);
    return canvas;
  }
  const text = options.kind === "memo" ? options.note : `${options.title}\n${options.note}`;
  ctx.font = '48px "Pretendard Variable", Pretendard, Roboto, "Segoe UI", "Noto Sans", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "Hiragino Sans", "Yu Gothic", sans-serif';
  let y = 120;
  const maxWidth = width - 160;
  /* 쪽 나눔(sheetMemoChunks)과 같은 줄바꿈 · 같은 줄 수(빈 줄 포함)로 그린다 */
  for (const paragraph of text.split("\n")) {
    for (const row of wrapMeasuredLines(paragraph, (value) => ctx.measureText(value).width, maxWidth)) {
      if (row) ctx.fillText(row, 80, y);
      y += 68;
    }
    if (options.kind !== "memo") y += 16;
  }
  return canvas;
}

export function sheetMemoChunks(text: string, paper: string, frame?: { width: number; height: number }) {
  const width = frame?.width || printPixelSize(paper).width;
  const height = frame?.height || printPixelSize(paper).height;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [text];
  ctx.font = '48px "Pretendard Variable", Pretendard, Roboto, "Segoe UI", "Noto Sans", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "Hiragino Sans", "Yu Gothic", sans-serif';
  const lines = wrapMeasuredLines(text, (value) => ctx.measureText(value).width, Math.max(80, width - 160));
  return paginateLines(lines, Math.max(1, Math.floor((height - 120) / 68)));
}
