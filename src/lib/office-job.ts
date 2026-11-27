import { tr } from "./i18n/core.ts";

export type OfficePaper = "A4" | "A3" | "B5" | "A5" | "B4" | "Letter" | "Legal" | "A6" | "Postcard";
export type DuplexMode = "simplex" | "long" | "short";

/** 자주 쓰는 용지 (분절 버튼에 바로 보임) */
export const MAIN_PAPERS = ["A4", "A3", "B5"] as const satisfies readonly OfficePaper[];
/** 더보기에 들어가는 용지 */
export const MORE_PAPERS = ["A5", "B4", "Letter", "Legal", "A6", "Postcard"] as const satisfies readonly OfficePaper[];
export const OFFICE_PAPERS: OfficePaper[] = [...MAIN_PAPERS, ...MORE_PAPERS];

/**
 * 용지 표 — 크기 계산 · 복사기 명령은 모두 여기서 나온다.
 * pcl: PCL5 ESC&l#A 용지 번호 · pjl: @PJL SET PAPER 이름(JIS 계열은 기종마다 이름이 달라 생략) · ipp: IPP media 이름(PWG) · ippOld: IPP 1.x 옛 이름(코니카 등 1.1 기기)
 */
const PAPER: Record<OfficePaper, { mm: readonly [number, number]; pcl: number; pjl: string | null; ipp: string; ippOld: string; hint: string }> = {
  A4: { mm: [210, 297], pcl: 26, pjl: "A4", ipp: "iso_a4_210x297mm", ippOld: "iso-a4", hint: "210×297mm" },
  A3: { mm: [297, 420], pcl: 27, pjl: "A3", ipp: "iso_a3_297x420mm", ippOld: "iso-a3", hint: "297×420mm" },
  B5: { mm: [182, 257], pcl: 45, pjl: null, ipp: "jis_b5_182x257mm", ippOld: "jis-b5", hint: "182×257mm" },
  A5: { mm: [148, 210], pcl: 25, pjl: "A5", ipp: "iso_a5_148x210mm", ippOld: "iso-a5", hint: "148×210mm" },
  B4: { mm: [257, 364], pcl: 46, pjl: null, ipp: "jis_b4_257x364mm", ippOld: "jis-b4", hint: "257×364mm" },
  Letter: { mm: [215.9, 279.4], pcl: 2, pjl: "LETTER", ipp: "na_letter_8.5x11in", ippOld: "na-letter", hint: "8.5×11in" },
  Legal: { mm: [215.9, 355.6], pcl: 3, pjl: "LEGAL", ipp: "na_legal_8.5x14in", ippOld: "na-legal", hint: "8.5×14in" },
  A6: { mm: [105, 148], pcl: 24, pjl: "A6", ipp: "iso_a6_105x148mm", ippOld: "iso-a6", hint: "105×148mm" },
  Postcard: { mm: [100, 148], pcl: 71, pjl: null, ipp: "jpn_hagaki_100x148mm", ippOld: "jpn-hagaki", hint: "100×148mm" },
};

const encoder = new TextEncoder();

function spec(paper: string) {
  return PAPER[paper as OfficePaper] ?? PAPER.A4;
}

/** mm 를 지정 해상도(dpi)의 픽셀로 */
function px(mm: number, dpi: number) {
  return Math.round((mm / 25.4) * dpi);
}

export function paperMm(paper: string, orient: "portrait" | "landscape" = "portrait") {
  const [width, height] = spec(paper).mm;
  return orient === "landscape" ? { width: height, height: width } : { width, height };
}

/** 화면에 보일 용지 이름 — 엽서만 언어별로, 나머지는 규격 이름 그대로 */
export function paperLabel(paper: string) {
  return paper === "Postcard" ? tr("opt.postcard") : paper;
}

export function paperHint(paper: string) {
  return spec(paper).hint;
}

export function ippMedia(paper: string, old = false) {
  return old ? spec(paper).ippOld : spec(paper).ipp;
}

export function paperPoints(paper: string) {
  const [mmW, mmH] = spec(paper).mm;
  return { width: Math.round((mmW / 25.4) * 72 * 100) / 100, height: Math.round((mmH / 25.4) * 72 * 100) / 100 };
}

export function rasterSize(paper: OfficePaper) {
  const [mmW, mmH] = spec(paper).mm;
  return { width: Math.ceil(px(mmW, 300) / 8) * 8, height: px(mmH, 300) };
}

/** 300dpi 래스터에서 가장자리 6mm(72px씩)를 뺀 인쇄 가능 영역 */
export function printableSize(paper: OfficePaper) {
  const full = rasterSize(paper);
  return { width: full.width - 144, height: full.height - 144 };
}

export function previewSize(paper: string) {
  const full = rasterSize((PAPER[paper as OfficePaper] ? paper : "A4") as OfficePaper);
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
  /* 1부는 COPIES=1 (코니카 28BW-4 실기에서 양면이 확인된 머리와 같게). 여러 쪽 여러 부만 QTY(한 부씩 묶어 찍기) */
  const lines = ['\x1b%-12345X@PJL JOB NAME="NUGUNA PRINT"', options.pages > 1 && count > 1 ? `@PJL SET QTY=${count}` : `@PJL SET COPIES=${count}`];
  const pjlPaper = spec(options.paper).pjl;
  if (pjlPaper) lines.push(`@PJL SET PAPER=${pjlPaper}`);
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

/** 화면 · PDF용 150dpi 크기 */
export function printPixelSize(paper: string) {
  const [mmW, mmH] = spec(paper).mm;
  return { width: px(mmW, 150), height: px(mmH, 150) };
}

export function osRasterSize(paper: string, pageCount: number) {
  const base = printPixelSize(paper);
  if (pageCount <= 30) return base;
  const scale = pageCount > 60 ? 0.5 : 0.72;
  // 최소 크기는 원래 용지보다 커지지 않게 (엽서 · A6 같은 작은 용지의 비율 유지)
  return {
    width: Math.min(base.width, Math.max(620, Math.round(base.width * scale))),
    height: Math.min(base.height, Math.max(877, Math.round(base.height * scale))),
  };
}

type Segmenter = { segment: (text: string) => Iterable<{ segment: string }> };
function segmenter(granularity: "word" | "grapheme"): Segmenter | null {
  const Ctor = (Intl as unknown as { Segmenter?: new (locale: string, options: { granularity: string }) => Segmenter }).Segmenter;
  return Ctor ? new Ctor("und", { granularity }) : null;
}

/** 단어(띄어쓰기 · 태국어 · 중국어 사전 단위) 조각. Segmenter가 없으면 공백 기준 */
export function wordPieces(paragraph: string) {
  const seg = segmenter("word");
  return seg ? Array.from(seg.segment(paragraph), (s) => s.segment) : paragraph.split(/(\s+)/).filter(Boolean);
}

/** 글자(자모 · 성조 · 결합 부호를 떼지 않는 단위) 조각 */
export function graphemes(text: string) {
  const seg = segmenter("grapheme");
  return seg ? Array.from(seg.segment(text), (s) => s.segment) : Array.from(text);
}

/**
 * 폭에 맞춰 줄을 나눈다. 단어째 다음 줄로 넘기고(영어 "Pa / ck"처럼 쪼개지 않게),
 * 한 단어가 한 줄보다 길 때만 글자 단위로 자른다. 줄 첫머리 공백은 버린다.
 */
export function wrapMeasuredLines(text: string, measure: (value: string) => number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    if (!paragraph) {
      lines.push("");
      continue;
    }
    for (const piece of wordPieces(paragraph)) {
      const next = line + piece;
      if (!line || measure(next) <= maxWidth) {
        line = next;
        if (measure(line) <= maxWidth) continue;
      } else {
        lines.push(line.trimEnd());
        line = piece.trim() ? piece : "";
        if (!line || measure(line) <= maxWidth) continue;
      }
      /* 한 줄보다 긴 단어: 글자 단위로 자른다 */
      const long = line;
      line = "";
      for (const ch of graphemes(long)) {
        const cut = line + ch;
        if (line && measure(cut) > maxWidth) {
          lines.push(line);
          line = ch.trim() ? ch : "";
        } else line = cut;
      }
    }
    lines.push(line.trimEnd());
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
  ctx.font = `${font}px "Pretendard Variable", Pretendard, Roboto, "Segoe UI", "Noto Sans", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "Hiragino Sans", "Yu Gothic", sans-serif`;
  const lines = wrapMeasuredLines(text, (value) => ctx.measureText(value).width, Math.max(40, width - font * 2));
  const perPage = Math.max(1, Math.floor((height - font * 2) / (font * 1.4)));
  return paginateLines(lines, perPage);
}

export function pclJobHeader(options: { copies: number; duplex: DuplexMode; paper: OfficePaper; pages: number; secure?: { pin: string; user: string }; orient?: "portrait" | "landscape" }) {
  const pclPaper = spec(options.paper).pcl;
  const side = options.duplex === "long" ? 1 : options.duplex === "short" ? 2 : 0;
  const face = options.orient === "landscape" ? 1 : 0;
  // ESC * r 0 F는 래스터 방향이다. 장수는 PJL QTY/COPIES 한 곳만 쓴다.
  return encoder.encode(
    `${pjl({ ...options, language: "PCL" })}\x1bE\x1b&l${pclPaper}A\x1b&l${face}O\x1b&l${side}S\x1b&u300D\x1b&l0E\x1b&l0L\x1b&a0L\x1b*t300R\x1b*r0F`,
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
  ctx.font = `${font}px "Pretendard Variable", Pretendard, Roboto, "Segoe UI", "Noto Sans", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "Hiragino Sans", "Yu Gothic", sans-serif`;
  let y = font * 2;
  const maxWidth = canvas.width - font * 2;
  /* 쪽 나눔(officeMemoChunks)과 같은 줄바꿈 · 같은 줄 수(빈 줄 포함)로 그린다 */
  for (const row of wrapMeasuredLines(text, (value) => ctx.measureText(value).width, maxWidth)) {
    if (row) ctx.fillText(row, font, y);
    y += font * 1.4;
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
