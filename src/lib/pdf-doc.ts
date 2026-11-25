import { tr } from "./i18n/core.ts";
type PdfViewport = { width: number; height: number };
type PdfPage = {
  rotate?: number;
  getViewport: (options: { scale: number; rotation?: number }) => PdfViewport;
  render: (options: { canvas: HTMLCanvasElement; viewport: PdfViewport; annotationMode?: number }) => { promise: Promise<void>; cancel: () => void };
  cleanup: () => void;
};
type PdfDoc = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
  cleanup?: () => Promise<void> | void;
  destroy?: () => Promise<void> | void;
};
type PdfTask = {
  promise: Promise<PdfDoc>;
  destroy: () => Promise<void> | void;
};

export type OpenedPdf = {
  doc: PdfDoc;
  destroy: () => Promise<void>;
};

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then(async (mod) => {
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      mod.GlobalWorkerOptions.workerSrc = worker.default;
      return mod;
    });
  }
  return pdfjsPromise;
}

export async function openPdf(data: Uint8Array, password?: string): Promise<OpenedPdf> {
  const pdfjs = await loadPdfjs();
  const copy = data.slice();
  const task = pdfjs.getDocument({
    data: copy,
    password: password || undefined,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  }) as unknown as PdfTask;
  const doc = await task.promise;
  return {
    doc,
    destroy: async () => {
      try {
        if (typeof doc.destroy === "function") await doc.destroy();
        else await doc.cleanup?.();
      } catch {
        /* already closed */
      }
      try {
        await task.destroy();
      } catch {
        /* worker already gone */
      }
    },
  };
}

export function rasterTurn(displayedWidth: number, displayedHeight: number) {
  return displayedWidth > displayedHeight ? 90 : 0;
}

export function pageDrawPlan(pageWidth: number, pageHeight: number, canvasWidth: number, canvasHeight: number, mode: "auto" | "fit" = "auto") {
  const rotation = mode === "fit" ? 0 : rasterTurn(pageWidth, pageHeight);
  const landscape = rotation === 90;
  const srcW = landscape ? pageHeight : pageWidth;
  const srcH = landscape ? pageWidth : pageHeight;
  const scale = Math.min(canvasWidth / srcW, canvasHeight / srcH);
  const drawWidth = srcW * scale;
  const drawHeight = srcH * scale;
  return {
    landscape,
    rotation,
    scale,
    drawWidth,
    drawHeight,
    offsetX: (canvasWidth - drawWidth) / 2,
    offsetY: (canvasHeight - drawHeight) / 2,
  };
}

export async function renderPdfPage(
  doc: PdfDoc,
  pageNumber: number,
  width: number,
  height: number,
  slot?: { current: { cancel: () => void } | null },
  mode: "auto" | "fit" = "auto",
) {
  const page = await doc.getPage(pageNumber);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    page.cleanup();
    return canvas;
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const base = page.getViewport({ scale: 1 });
  const plan = pageDrawPlan(base.width, base.height, width, height, mode);
  const viewport = page.getViewport({ scale: plan.scale });
  const shot = document.createElement("canvas");
  shot.width = Math.max(1, Math.ceil(viewport.width));
  shot.height = Math.max(1, Math.ceil(viewport.height));
  let dropped = false;
  try {
    const pdfjs = await loadPdfjs();
    const task = page.render({ canvas: shot, viewport, annotationMode: pdfjs.AnnotationMode.ENABLE_FORMS });
    if (slot) {
      slot.current = {
        cancel: () => {
          dropped = true;
          task.cancel();
        },
      };
    }
    await task.promise;
    if (dropped) return null;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    if (plan.landscape) ctx.rotate(Math.PI / 2);
    const destW = plan.landscape ? plan.drawHeight : plan.drawWidth;
    const destH = plan.landscape ? plan.drawWidth : plan.drawHeight;
    ctx.drawImage(shot, -destW / 2, -destH / 2, destW, destH);
    ctx.restore();
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (dropped || name === "RenderingCancelledException") return null;
    throw error;
  } finally {
    page.cleanup();
    shot.width = 0;
    shot.height = 0;
  }
  return canvas;
}

export function pdfLooksEncrypted(data: Uint8Array) {
  const needle = [47, 69, 110, 99, 114, 121, 112, 116];
  const find = (start: number, end: number) => {
    for (let index = start; index <= end - needle.length; index += 1) {
      let same = true;
      for (let offset = 0; offset < needle.length; offset += 1) {
        if (data[index + offset] !== needle[offset]) {
          same = false;
          break;
        }
      }
      if (same) return true;
    }
    return false;
  };
  const head = Math.min(data.length, 65536);
  if (find(0, head)) return true;
  const tail = Math.max(0, data.length - 262144);
  return tail > 0 && find(tail, data.length);
}

export function canPdfDirect(data: Uint8Array) {
  return data.byteLength > 0 && data.byteLength <= 25 * 1024 * 1024 && !pdfLooksEncrypted(data);
}

export function pageSpan(total: number, mode: "all" | "span", from: number, to: number) {
  if (total < 1) return [];
  if (mode === "all") return Array.from({ length: total }, (_, index) => index + 1);
  const start = Math.min(total, Math.max(1, Math.floor(from) || 1));
  const end = Math.min(total, Math.max(start, Math.floor(to) || start));
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export async function slicePdf(data: Uint8Array, pages: number[]) {
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.load(data, { ignoreEncryption: true });
  const next = await PDFDocument.create();
  const copied = await next.copyPages(
    source,
    pages.map((page) => page - 1),
  );
  for (const page of copied) next.addPage(page);
  return next.save();
}

export async function imagesToPdf(
  pages: { jpeg: Uint8Array; width: number; height: number }[],
  page: { width: number; height: number },
) {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  for (const sheet of pages) {
    const image = await pdf.embedJpg(sheet.jpeg);
    const added = pdf.addPage([page.width, page.height]);
    added.drawImage(image, { x: 0, y: 0, width: page.width, height: page.height });
  }
  return pdf.save();
}

export function parsePageRange(input: string, total: number): { pages: number[] } | { error: string } {
  const compact = input.replace(/\s+/g, "");
  if (!compact) return { error: tr("pr.empty") };
  if (!total) return { error: tr("pr.noPdf") };
  if (compact.startsWith(",") || compact.endsWith(",") || compact.includes(",,")) return { error: tr("pr.comma") };
  const pages: number[] = [];
  const seen = new Set<number>();
  for (const part of compact.split(",")) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end < 1) return { error: tr("pr.negative") };
      if (start > end) return { error: tr("pr.order") };
      if (end > total) return { error: tr("pr.over", { total }) };
      for (let page = start; page <= end; page += 1) {
        if (seen.has(page)) continue;
        seen.add(page);
        pages.push(page);
      }
      continue;
    }
    if (!/^\d+$/.test(part)) return { error: tr("pr.format") };
    const page = Number(part);
    if (page < 1) return { error: tr("pr.negative") };
    if (page > total) return { error: tr("pr.over", { total }) };
    if (!seen.has(page)) {
      seen.add(page);
      pages.push(page);
    }
  }
  return pages.length ? { pages } : { error: tr("pr.none") };
}

export function nupGroups(pages: number[], per: number, reverse = false) {
  const size = per === 4 ? 4 : per === 2 ? 2 : 1;
  const groups: number[][] = [];
  for (let index = 0; index < pages.length; index += size) groups.push(pages.slice(index, index + size));
  return reverse ? groups.reverse() : groups;
}
