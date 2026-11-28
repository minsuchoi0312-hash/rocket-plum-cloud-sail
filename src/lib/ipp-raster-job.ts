/**
 * 표준 팩 3.0 — 그려 둔 쪽(JPEG)을 프린터 해상도 래스터(PWG · URF) 작업으로 만든다. 브라우저(캔버스) 전용.
 * 폰 도우미가 IPP 요청을 48MB 까지 받으므로 40MB 를 넘으면 작업을 나눈다(양면이면 앞뒤 쌍이 갈라지지 않게 짝수 쪽에서).
 */
import { encodeRasterPage, rasterFileHeader, type IppPlan, type RasterOptions, type RasterPage } from "./ipp-raster.ts";

export type JpegSheet = { jpeg: Uint8Array; width: number; height: number };

const JOB_LIMIT = 40 * 1024 * 1024;

/** JPEG 한 장 → 용지(세로) 크기 RGBA. 가로로 긴 쪽은 왼쪽으로 눕혀(반시계 90°) 세로 용지에 얹는다 */
async function sheetPixels(sheet: JpegSheet, target: { width: number; height: number }): Promise<RasterPage> {
  const bitmap = await createImageBitmap(new Blob([sheet.jpeg as BlobPart], { type: "image/jpeg" }));
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.imageSmoothingQuality = "high";
  if (bitmap.width > bitmap.height && target.width < target.height) {
    ctx.translate(0, target.height);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(bitmap, 0, 0, target.height, target.width);
  } else ctx.drawImage(bitmap, 0, 0, target.width, target.height);
  bitmap.close();
  const rgba = ctx.getImageData(0, 0, target.width, target.height).data;
  canvas.width = 0;
  canvas.height = 0;
  return { width: target.width, height: target.height, rgba };
}

/**
 * JPEG 쪽들 → 래스터 작업 목록(보통 하나). onPage(만든 쪽 수, 전체)
 * points: 세로 용지 크기(포인트), mediaName: PWG 용지 이름
 */
export async function rasterJobs(
  sheets: JpegSheet[],
  plan: IppPlan,
  media: { points: { width: number; height: number }; mediaName: string; duplex: "simplex" | "long" | "short" },
  onPage?: (done: number, total: number) => void,
): Promise<Uint8Array[]> {
  if (plan.format !== "image/pwg-raster" && plan.format !== "image/urf") throw new Error("not a raster plan");
  const opt: RasterOptions = {
    format: plan.format,
    dpi: plan.dpi,
    space: plan.space,
    points: media.points,
    mediaName: media.mediaName,
    duplex: media.duplex,
    sheetBack: plan.sheetBack,
    totalPages: sheets.length,
  };
  const target = { width: Math.round((media.points.width / 72) * plan.dpi), height: Math.round((media.points.height / 72) * plan.dpi) };
  const jobs: Uint8Array[] = [];
  let parts: Uint8Array[] = [];
  let size = 0;
  const flush = () => {
    if (!parts.length) return;
    const head = rasterFileHeader(opt.format, parts.length);
    const out = new Uint8Array(head.length + size);
    out.set(head, 0);
    let at = head.length;
    for (const part of parts) {
      out.set(part, at);
      at += part.length;
    }
    jobs.push(out);
    parts = [];
    size = 0;
  };
  for (const [index, sheet] of sheets.entries()) {
    const page = await sheetPixels(sheet, target);
    /* 작업 안에서의 쪽 번호로 앞 · 뒷면을 정한다 (나눈 작업도 앞면부터 시작) */
    const encoded = encodeRasterPage(page, opt, parts.length);
    /* 나누는 곳은 앞면 자리(짝수)에서만 — 그 쪽은 새 작업에서도 앞면이라 다시 만들 필요가 없다 */
    const pairStart = media.duplex === "simplex" || parts.length % 2 === 0;
    if (parts.length && pairStart && size + encoded.length > JOB_LIMIT) flush();
    parts.push(encoded);
    size += encoded.length;
    onPage?.(index + 1, sheets.length);
  }
  flush();
  return jobs;
}
