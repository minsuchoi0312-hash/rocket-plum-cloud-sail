export type OfficePaper = "A4" | "A3" | "B5";
export type DuplexMode = "simplex" | "long" | "short";

export const OFFICE_PAPERS: OfficePaper[] = ["A4", "A3", "B5"];

const PAPER = {
  A4: { mm: [210, 297], pcl: 26, pjl: "A4", pt: [595.28, 841.89] },
  A3: { mm: [297, 420], pcl: 27, pjl: "A3", pt: [841.89, 1190.55] },
  B5: { mm: [182, 257], pcl: 45, pjl: "JISB5", pt: [515.91, 728.5] },
} as const;

const encoder = new TextEncoder();

export function paperPoints(paper: string) {
  const spec = PAPER[(paper === "A3" || paper === "B5" ? paper : "A4") as OfficePaper];
  return { width: spec.pt[0], height: spec.pt[1] };
}

export function rasterSize(paper: OfficePaper) {
  const [mmW, mmH] = PAPER[paper].mm;
  const raw = Math.round((mmW / 25.4) * 300);
  return { width: Math.ceil(raw / 8) * 8, height: Math.round((mmH / 25.4) * 300) };
}

export function printableSize(paper: OfficePaper) {
  if (paper === "A3") return { width: 3368, height: 4817 };
  if (paper === "B5") return { width: 2008, height: 2891 };
  return { width: 2336, height: 3364 };
}

export function previewSize(paper: string) {
  const key = (paper === "A3" || paper === "B5" ? paper : "A4") as OfficePaper;
  const full = rasterSize(key);
  const width = 620;
  return { width, height: Math.max(1, Math.round((full.height / full.width) * width)) };
}

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

function pjl(options: { copies: number; duplex: DuplexMode; paper: OfficePaper; language: "PDF" | "PCL"; pages: number; secure?: { pin: string; user: string } }) {
  const count = Math.min(99, Math.max(1, options.copies));
  const lines = ["\x1b%-12345X@PJL JOB", options.pages > 1 ? `@PJL SET QTY=${count}` : `@PJL SET COPIES=${count}`];
  if (options.paper !== "B5") lines.push(`@PJL SET PAPER=${PAPER[options.paper].pjl}`);
  if (options.duplex === "simplex") lines.push("@PJL SET DUPLEX=OFF");
  else {
    lines.push("@PJL SET DUPLEX=ON");
    lines.push(`@PJL SET BINDING=${options.duplex === "long" ? "LONGEDGE" : "SHORTEDGE"}`);
  }
  if (options.secure?.pin) {
    const user = options.secure.user.replace(/[^A-Za-z0-9]/g, "").slice(0, 16) || "USER";
    lines.push("@PJL SET HOLD=ON", "@PJL SET HOLDTYPE=PRIVATE", `@PJL SET HOLDKEY=${options.secure.pin}`, `@PJL SET USERNAME=${user}`);
  }
  lines.push(`@PJL ENTER LANGUAGE=${options.language}`);
  return `${lines.join("\r\n")}\r\n`;
}

export function wrapPdfJob(pdf: Uint8Array, options: { copies: number; duplex: DuplexMode; paper: OfficePaper; pages: number; secure?: { pin: string; user: string } }) {
  return concat([
    encoder.encode(pjl({ ...options, language: "PDF" })),
    pdf,
    encoder.encode("\r\n\x1b%-12345X@PJL EOJ\r\n\x1b%-12345X"),
  ]);
}

export function printPixelSize(paper: string) {
  if (paper === "A3") return { width: 1754, height: 2480 };
  if (paper === "B5") return { width: 1075, height: 1518 };
  return { width: 1240, height: 1754 };
}

export function osRasterSize(paper: string, pageCount: number) {
  const base = printPixelSize(paper);
  if (pageCount <= 30) return base;
  const scale = pageCount > 60 ? 0.5 : 0.72;
  return {
    width: Math.max(620, Math.round(base.width * scale)),
    height: Math.max(877, Math.round(base.height * scale)),
  };
}

export function wrapMeasuredLines(text: string, measure: (value: string) => number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    if (!paragraph) {
      lines.push("");
      continue;
    }
    for (const ch of paragraph) {
      const next = line + ch;
      if (line && measure(next) > maxWidth) {
        lines.push(line);
        line = ch.trim() ? ch : "";
      } else line = next;
    }
    lines.push(line);
  }
  return lines.length ? lines : [""];
}

export function paginateLines(lines: string[], linesPerPage: number) {
  const size = Math.max(1, Math.floor(linesPerPage) || 1);
  const pages: string[] = [];
  for (let index = 0; index < Math.max(1, lines.length); index += size) pages.push(lines.slice(index, index + size).join("\n"));
  return pages.length ? pages : [""];
}

export function officeMemoChunks(text: string, width: number, height: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const font = Math.max(18, Math.round(width / 28));
  if (!ctx) return [text];
  ctx.font = `${font}px "IBM Plex Sans KR", sans-serif`;
  const lines = wrapMeasuredLines(text, (value) => ctx.measureText(value).width, Math.max(40, width - font * 2));
  const perPage = Math.max(1, Math.floor((height - font * 2) / (font * 1.4)));
  return paginateLines(lines, perPage);
}

export function pclJobHeader(options: { copies: number; duplex: DuplexMode; paper: OfficePaper; pages: number; secure?: { pin: string; user: string }; orient?: "portrait" | "landscape" }) {
  const spec = PAPER[options.paper];
  const side = options.duplex === "long" ? 1 : options.duplex === "short" ? 2 : 0;
  const face = options.orient === "landscape" ? 1 : 0;
  // ESC * r 0 F는 래스터 방향이다. 장수는 PJL QTY/COPIES 한 곳만 쓴다.
  return encoder.encode(
    `${pjl({ ...options, language: "PCL" })}\x1bE\x1b&l${spec.pcl}A\x1b&l${face}O\x1b&l${side}S\x1b&u300D\x1b&l0E\x1b&l0L\x1b&a0L\x1b*t300R\x1b*r0F`,
  );
}

export function pclJobFooter() {
  return encoder.encode("\x1bE\x1b%-12345X@PJL EOJ\r\n\x1b%-12345X");
}

export function pclAbortFooter() {
  return encoder.encode("\x1b*rC\x1bE\x1b%-12345X@PJL EOJ\r\n\x1b%-12345X");
}

export function needsBlankBack(pageCount: number, duplex: DuplexMode) {
  return duplex !== "simplex" && pageCount % 2 === 1;
}

export function packBits(row: Uint8Array) {
  const out: number[] = [];
  let index = 0;
  while (index < row.length) {
    let run = 1;
    while (index + run < row.length && row[index + run] === row[index] && run < 128) run += 1;
    if (run >= 2) {
      out.push((1 - run) & 0xff, row[index]);
      index += run;
      continue;
    }
    const start = index;
    index += 1;
    while (index < row.length && index - start < 128) {
      if (index + 1 < row.length && row[index] === row[index + 1]) break;
      index += 1;
    }
    const length = index - start;
    out.push(length - 1);
    for (let cursor = 0; cursor < length; cursor += 1) out.push(row[start + cursor]);
  }
  return Uint8Array.from(out);
}

export function monoFromLuma(luma: Float32Array, width: number, height: number, mode: "threshold" | "dither") {
  const count = width * height;
  const mono = new Uint8Array(count);
  if (mode === "threshold") {
    for (let index = 0; index < count; index += 1) mono[index] = luma[index] < 175 ? 1 : 0;
    return mono;
  }
  const gray = new Float32Array(luma);
  for (let index = 0; index < count; index += 1) {
    if (gray[index] >= 240) gray[index] = 255;
    else if (gray[index] <= 40) gray[index] = 0;
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const old = gray[index];
      const next = old < 128 ? 0 : 255;
      const error = old - next;
      gray[index] = next;
      if (x + 1 < width) gray[index + 1] += (error * 7) / 16;
      if (y + 1 < height) {
        if (x > 0) gray[index + width - 1] += (error * 3) / 16;
        gray[index + width] += (error * 5) / 16;
        if (x + 1 < width) gray[index + width + 1] += error / 16;
      }
    }
  }
  for (let index = 0; index < count; index += 1) mono[index] = gray[index] < 128 ? 1 : 0;
  return mono;
}

export function pclPageCommands(mono: Uint8Array, width: number, height: number) {
  const dots = mono.slice();
  let marked = false;
  for (let index = 0; index < dots.length; index += 1) {
    if (dots[index]) {
      marked = true;
      break;
    }
  }
  if (!marked && width > 0 && height > 0) dots[dots.length - 1] = 1;
  const bytesPerRow = Math.ceil(width / 8);
  const commands: Uint8Array[] = [
    encoder.encode(`\x1b*p0x72Y\x1b*r${width}S\x1b*r${height}T\x1b*r1A\x1b*b2M`),
  ];
  let skip = 0;
  const flushSkip = () => {
    if (skip < 1) return;
    commands.push(encoder.encode(`\x1b*b${skip}Y`));
    skip = 0;
  };
  for (let y = 0; y < height; y += 1) {
    const packed = new Uint8Array(bytesPerRow);
    let ink = false;
    for (let x = 0; x < width; x += 1) {
      if (!dots[y * width + x]) continue;
      packed[x >> 3] |= 0x80 >> (x & 7);
      ink = true;
    }
    if (!ink) {
      skip += 1;
      continue;
    }
    flushSkip();
    let end = packed.length;
    while (end > 0 && packed[end - 1] === 0) end -= 1;
    const compressed = packBits(packed.subarray(0, end));
    const prefix = encoder.encode(`\x1b*b${compressed.length}W`);
    const line = new Uint8Array(prefix.length + compressed.length);
    line.set(prefix, 0);
    line.set(compressed, prefix.length);
    commands.push(line);
  }
  flushSkip();
  commands.push(encoder.encode("\x1b*rC\x0c"));
  return commands;
}

export function bundleCommands(commands: Uint8Array[], limit = 4096) {
  const packets: Uint8Array[] = [];
  let bucket: Uint8Array[] = [];
  let size = 0;
  const flush = () => {
    if (!bucket.length) return;
    packets.push(concat(bucket));
    bucket = [];
    size = 0;
  };
  for (const command of commands) {
    if (size > 0 && size + command.length > limit) flush();
    bucket.push(command);
    size += command.length;
    if (size >= limit) flush();
  }
  flush();
  return packets;
}

export function encodePclPageFromMono(mono: Uint8Array, width: number, height: number) {
  return concat(pclPageCommands(mono, width, height));
}

function commandsFromCanvas(canvas: HTMLCanvasElement, mode: "threshold" | "dither") {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || canvas.width < 8 || canvas.height < 8) return [encoder.encode("\x1b*p0x72Y\x1b*r0S\x1b*r0T\x1b*r1A\x1b*b2M\x1b*rC\x0c")];
  const width = canvas.width & ~7;
  const height = canvas.height;
  const image = ctx.getImageData(0, 0, width, height);
  const luma = new Float32Array(width * height);
  for (let index = 0; index < luma.length; index += 1) {
    const offset = index * 4;
    luma[index] = image.data[offset] * 0.3 + image.data[offset + 1] * 0.59 + image.data[offset + 2] * 0.11;
  }
  return pclPageCommands(monoFromLuma(luma, width, height, mode), width, height);
}

export function canvasPclCommands(canvas: HTMLCanvasElement, mode: "threshold" | "dither") {
  return commandsFromCanvas(canvas, mode);
}

export function encodePclPage(canvas: HTMLCanvasElement, mode: "threshold" | "dither") {
  return concat(commandsFromCanvas(canvas, mode));
}

export function drawOfficePage(
  canvas: HTMLCanvasElement,
  options: {
    kind: "photo" | "memo" | "test" | "pdf";
    title: string;
    note: string;
    image?: CanvasImageSource | null;
    fit?: "contain" | "cover";
    turn?: number;
    gray?: boolean;
  },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.filter = "none";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1a2744";
  if (options.gray) ctx.filter = "grayscale(1)";
  if (options.image) {
    drawFittedLocal(ctx, options.image, canvas.width, canvas.height, options.fit || "contain", options.turn || 0);
    ctx.filter = "none";
    return canvas;
  }
  const text = options.kind === "memo" ? options.note : options.kind === "test" ? `${options.title}\n${options.note}` : options.note;
  const font = Math.max(18, Math.round(canvas.width / 28));
  ctx.font = `${font}px "IBM Plex Sans KR", sans-serif`;
  let line = "";
  let y = font * 2;
  const maxWidth = canvas.width - font * 2;
  for (const paragraph of text.split("\n")) {
    for (const ch of paragraph) {
      const next = line + ch;
      if (line && ctx.measureText(next).width > maxWidth) {
        ctx.fillText(line, font, y);
        y += font * 1.4;
        line = ch.trim() ? ch : "";
      } else line = next;
    }
    if (line) {
      ctx.fillText(line, font, y);
      y += font * 1.4;
      line = "";
    }
  }
  ctx.filter = "none";
  return canvas;
}

function drawFittedLocal(
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
