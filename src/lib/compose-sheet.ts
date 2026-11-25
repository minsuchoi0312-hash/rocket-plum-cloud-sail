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

export function composeSheet(images: CanvasImageSource[], sizes: { width: number; height: number }[], width: number, height: number, nup: number, fit: "contain" | "cover") {
  const sheet = document.createElement("canvas");
  sheet.width = width;
  sheet.height = height;
  const ctx = sheet.getContext("2d");
  if (!ctx) return sheet;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  const cols = nup === 4 ? 2 : 1;
  const rows = nup === 1 ? 1 : 2;
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
