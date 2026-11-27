import { tr } from "@/lib/i18n/core";
import { grayCanvas, renderSheetCanvas, sheetMemoChunks } from "@/lib/pdf-page";

export type PrintJob =
  | { kind: "test"; title: string; note: string; paper: string; gray: boolean }
  | { kind: "memo"; text: string; paper: string; gray: boolean }
  | { kind: "photo"; src: string; fit: "contain" | "cover"; turn: number; paper: string; gray: boolean }
  | { kind: "pdf"; pages: string[]; paper: string; gray: boolean };

const heldUrls = new Set<string>();
/** 미리보기(is-copying)를 열기 전 화면 스크롤 위치 — 닫으면 그 자리로 돌아간다 */
let scrollBeforeCopy: number | null = null;

function track(url: string) {
  if (url.startsWith("blob:")) heldUrls.add(url);
  return url;
}

export function clearPrintRoot() {
  const root = document.getElementById("print-root");
  if (root) {
    root.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (src.startsWith("blob:")) heldUrls.add(src);
    });
    root.replaceChildren();
  }
  document.getElementById("copy-bar")?.remove();
  for (const url of heldUrls) URL.revokeObjectURL(url);
  heldUrls.clear();
  const wasCopying = document.body.classList.contains("is-copying");
  document.body.classList.remove("is-printing", "is-copying", "print-gray");
  delete document.body.dataset.printPaper;
  if (wasCopying && scrollBeforeCopy !== null) window.scrollTo({ top: scrollBeforeCopy, behavior: "instant" });
  scrollBeforeCopy = null;
}

export function canvasObjectUrl(canvas: HTMLCanvasElement, quality = 0.92) {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error(tr("err.makeImage")));
      else resolve(track(URL.createObjectURL(blob)));
    }, "image/jpeg", quality);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(tr("err.openPhoto")));
    image.src = src;
  });
}

async function bake(src: string, gray: boolean) {
  if (!gray) return src;
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(image, 0, 0);
  grayCanvas(canvas);
  const next = await canvasObjectUrl(canvas, 0.92);
  if (src.startsWith("blob:")) URL.revokeObjectURL(src);
  heldUrls.delete(src);
  return next;
}

function finishPrint(root: HTMLElement) {
  /* 아래로 내려 본 상태에서 열어도 미리보기는 첫 쪽(맨 위)부터 보이게 */
  if (!document.body.classList.contains("is-copying")) scrollBeforeCopy = window.scrollY;
  document.body.classList.add("is-copying");
  window.scrollTo({ top: 0, behavior: "instant" });
  if (!document.getElementById("copy-bar")) {
    const bar = document.createElement("div");
    bar.id = "copy-bar";
    const text = document.createElement("p");
    text.textContent = tr("ps.previewNote");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = tr("ps.close");
    button.addEventListener("click", () => clearPrintRoot());
    bar.append(text, button);
    document.body.append(bar);
  }
  root.hidden = false;
}

async function appendCanvas(root: HTMLElement, canvas: HTMLCanvasElement, paper: string, last: boolean) {
  const sheet = document.createElement("section");
  sheet.className = `print-page is-sheet paper-${paper.toLowerCase()}${last ? " is-last" : ""}`;
  const shot = document.createElement("img");
  shot.className = "print-photo";
  shot.alt = "";
  shot.src = await canvasObjectUrl(canvas);
  canvas.width = 0;
  canvas.height = 0;
  sheet.append(shot);
  root.append(sheet);
  if (typeof shot.decode === "function") await shot.decode().catch(() => undefined);
}

export async function printSheet(job: PrintJob) {
  clearPrintRoot();
  let root = document.getElementById("print-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "print-root";
    document.body.appendChild(root);
  }
  document.body.dataset.printPaper = job.paper;
  document.body.classList.toggle("print-gray", job.gray);
  if (job.kind === "pdf") {
    const shots: HTMLImageElement[] = [];
    for (const [index, src] of job.pages.entries()) {
      const sheet = document.createElement("section");
      const last = index === job.pages.length - 1;
      sheet.className = `print-page is-sheet paper-${job.paper.toLowerCase()}${last ? " is-last" : ""}`;
      const shot = document.createElement("img");
      shot.className = "print-photo";
      shot.alt = "";
      shot.src = track(await bake(src, job.gray));
      sheet.append(shot);
      root.append(sheet);
      shots.push(shot);
    }
    await Promise.all(shots.map((shot) => (typeof shot.decode === "function" ? shot.decode().catch(() => undefined) : Promise.resolve())));
    finishPrint(root);
    return;
  }
  if (job.kind === "photo") {
    const image = await loadImage(job.src);
    const canvas = await renderSheetCanvas({
      kind: "photo",
      title: "",
      note: "",
      paper: job.paper,
      image,
      fit: job.fit,
      turn: job.turn,
      gray: job.gray,
    });
    if (job.gray) grayCanvas(canvas);
    await appendCanvas(root, canvas, job.paper, true);
    finishPrint(root);
    return;
  }
  if (job.kind === "memo") {
    const chunks = sheetMemoChunks(job.text, job.paper);
    for (const [index, chunk] of chunks.entries()) {
      const canvas = await renderSheetCanvas({
        kind: "memo",
        title: "",
        note: chunk,
        paper: job.paper,
        gray: job.gray,
      });
      if (job.gray) grayCanvas(canvas);
      await appendCanvas(root, canvas, job.paper, index === chunks.length - 1);
    }
    finishPrint(root);
    return;
  }
  const page = document.createElement("section");
  page.className = `print-page paper-${job.paper.toLowerCase()}`;
  const kicker = document.createElement("p");
  kicker.className = "print-kicker";
  kicker.textContent = tr("ps.kicker");
  const heading = document.createElement("h1");
  heading.textContent = job.title;
  const body = document.createElement("p");
  body.textContent = job.note;
  const bars = document.createElement("div");
  bars.className = "print-bars";
  for (const tone of ["ink", "c", "m", "y"]) {
    const bar = document.createElement("span");
    bar.dataset.tone = tone;
    bars.append(bar);
  }
  page.append(kicker, heading, body, bars);
  root.append(page);
  finishPrint(root);
}
