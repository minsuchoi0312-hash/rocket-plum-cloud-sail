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
  /** 앱(APK): 안드로이드 내장 PDF 엔진으로 그리는 문서 */
  native?: NativeRef;
};

/* ───── 안드로이드 내장 PDF 엔진(pdfium) ─────
 * 앱에서는 폰 내장 도우미(/pdf/*)가 android.graphics.pdf.PdfRenderer 로 쪽을 그려 PNG로 준다.
 * 크롬 · 안드로이드 · 프린터쉐어와 같은 엔진이라, 글꼴이 안 들어간 한글 PDF 같은 문서도 원본과 똑같이 나온다.
 * 암호 PDF · 엔진이 못 여는 PDF · 웹 버전은 지금처럼 pdf.js로 그린다. */
type NativeHelper = { url: string; code: string };
type NativeRef = { helper: NativeHelper; id: string };

function nativeHelper(): NativeHelper | null {
  if (typeof window === "undefined" || !(window as { __nugunaPhone?: boolean }).__nugunaPhone) return null;
  try {
    const saved = JSON.parse(localStorage.getItem("nuguna-helper") || "null") as { url?: string; code?: string } | null;
    if (saved?.url && saved.code && /^http:\/\/127\.0\.0\.1:47631\/?$/.test(saved.url)) return { url: saved.url.replace(/\/$/, ""), code: saved.code };
  } catch {
    /* 저장소를 못 읽으면 pdf.js로 */
  }
  return null;
}

async function openNative(data: Uint8Array, helper: NativeHelper): Promise<OpenedPdf | null> {
  const res = await fetch(`${helper.url}/pdf/open`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf", "X-Helper-Code": helper.code },
    body: data as unknown as BodyInit,
  });
  if (!res.ok) return null;
  const info = (await res.json()) as { id?: string; pages?: { w: number; h: number }[] };
  if (!info.id || !info.pages?.length) return null;
  const id = info.id;
  const sizes = info.pages;
  const doc: PdfDoc = {
    numPages: sizes.length,
    native: { helper, id },
    getPage: async (pageNumber: number) => {
      const size = sizes[pageNumber - 1] || sizes[0];
      return {
        getViewport: ({ scale }: { scale: number }) => ({ width: size.w * scale, height: size.h * scale }),
        render: () => {
          throw new Error("native page");
        },
        cleanup: () => undefined,
      };
    },
  };
  return {
    doc,
    destroy: async () => {
      try {
        await fetch(`${helper.url}/pdf/close?id=${encodeURIComponent(id)}`, { method: "POST", headers: { "X-Helper-Code": helper.code } });
      } catch {
        /* 앱이 닫히면 도우미가 알아서 정리 */
      }
    },
  };
}

/** 내장 엔진으로 쪽 하나를 width × height 그림으로 받아 온다 */
async function nativeShot(ref: NativeRef, pageNumber: number, width: number, height: number, signal?: AbortSignal) {
  const query = `id=${encodeURIComponent(ref.id)}&i=${pageNumber - 1}&w=${Math.max(1, Math.round(width))}&h=${Math.max(1, Math.round(height))}`;
  const res = await fetch(`${ref.helper.url}/pdf/page?${query}`, { headers: { "X-Helper-Code": ref.helper.code }, signal });
  if (!res.ok) throw new Error(tr("pdf.makeFail"));
  return createImageBitmap(await res.blob());
}
type PdfTask = {
  promise: Promise<PdfDoc>;
  destroy: () => Promise<void> | void;
};

export type OpenedPdf = {
  doc: PdfDoc;
  destroy: () => Promise<void>;
};

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

/*
 * pdf.js 레거시 빌드(옛 브라우저용 폴리필 포함)를 쓴다.
 * 기본 빌드는 Math.sumPrecise · Map.getOrInsert 같은 아주 새 기능을 확인 없이 써서,
 * 그 기능이 없는 안드로이드 WebView/크롬(예: 145)에서는 PDF에 든 글꼴을 하나도 못 읽고 폰 글꼴로 대신 그린다
 * → 힌디어 · 아랍어 · 미얀마어 · 그리스어 강세가 깨지고 명조체가 고딕으로 나왔다.
 */
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (import("pdfjs-dist/legacy/build/pdf.mjs") as unknown as Promise<typeof import("pdfjs-dist")>).then(async (mod) => {
      const worker = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url");
      mod.GlobalWorkerOptions.workerSrc = worker.default;
      return mod;
    });
  }
  return pdfjsPromise;
}

export async function openPdf(data: Uint8Array, password?: string): Promise<OpenedPdf> {
  /*
   * pdf.js가 먼저: 글꼴이 안 들어간 한글 PDF 시험 4종을 모두 제대로 그렸다.
   * 안드로이드 내장 엔진(pdfium)은 그중 하나(글리프 번호만 있는 바탕체)에서 한글을 비워 버려서 보조로만 쓴다:
   * pdf.js가 파일 자체를 못 열 때(손상 · 지원 안 하는 구조) 앱에서만 내장 엔진으로 다시 연다. 암호 문제는 그대로 알린다.
   */
  const pdfjs = await loadPdfjs();
  const copy = data.slice();
  const task = pdfjs.getDocument({
    data: copy,
    password: password || undefined,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  }) as unknown as PdfTask;
  let doc: PdfDoc;
  try {
    doc = await task.promise;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const helper = name !== "PasswordException" && !password && !pdfLooksEncrypted(data) ? nativeHelper() : null;
    if (helper) {
      try {
        await task.destroy();
      } catch {
        /* worker already gone */
      }
      const native = await openNative(data, helper).catch(() => null);
      if (native) return native;
    }
    throw error;
  }
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
  const destW = plan.landscape ? plan.drawHeight : plan.drawWidth;
  const destH = plan.landscape ? plan.drawWidth : plan.drawHeight;
  const place = (source: CanvasImageSource) => {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    if (plan.landscape) ctx.rotate(Math.PI / 2);
    ctx.drawImage(source, -destW / 2, -destH / 2, destW, destH);
    ctx.restore();
  };
  /* 앱: 내장 엔진(pdfium)이 그린 그림을 같은 자리에 놓는다 */
  if (doc.native) {
    const abort = new AbortController();
    if (slot) slot.current = { cancel: () => abort.abort() };
    try {
      const shot = await nativeShot(doc.native, pageNumber, viewport.width, viewport.height, abort.signal);
      place(shot);
      shot.close();
      return canvas;
    } catch (error) {
      if (abort.signal.aborted) return null;
      throw error;
    }
  }
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
    place(shot);
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
