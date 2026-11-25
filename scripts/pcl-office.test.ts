import assert from "node:assert/strict";
import test from "node:test";
import { bundleCommands, encodePclPageFromMono, monoFromLuma, needsBlankBack, packBits, paginateLines, pclAbortFooter, pclJobFooter, pclJobHeader, pclPageCommands, printableSize, wrapMeasuredLines } from "../src/lib/office-job.ts";
import { canPdfDirect, pageDrawPlan, pdfLooksEncrypted, rasterTurn } from "../src/lib/pdf-doc.ts";
import { commandHasPcl5, resolvePrintRoute } from "../src/lib/print-route.ts";
import { pickPrinterProtocol } from "../src/lib/discover.ts";
import { Atlas } from "../src/lib/atlas-engine.js";

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

test("PCL5 header, B5 paper token, and job close", () => {
  const header = text(pclJobHeader({ copies: 2, duplex: "long", paper: "A4", pages: 3 }));
  assert.match(header, /\x1b%-12345X@PJL JOB/);
  assert.match(header, /@PJL SET QTY=2/);
  assert.doesNotMatch(header, /@PJL SET COPIES/);
  assert.doesNotMatch(header, /\x1b&l2X/);
  assert.match(header, /@PJL SET DUPLEX=ON/);
  assert.match(header, /@PJL SET BINDING=LONGEDGE/);
  assert.match(header, /\x1b&l26A/);
  assert.match(header, /\x1b&l1S/);
  assert.match(header, /\x1b&u300D/);
  assert.match(header, /\x1b&l0E/);
  assert.match(header, /\x1b&l0L/);
  assert.doesNotMatch(header, /\x1b\*b0M/);
  const one = text(pclJobHeader({ copies: 2, duplex: "simplex", paper: "A4", pages: 1 }));
  assert.match(one, /@PJL SET COPIES=2/);
  assert.doesNotMatch(one, /@PJL SET QTY/);
  const shortB5 = text(pclJobHeader({ copies: 1, duplex: "short", paper: "B5", pages: 1 }));
  assert.match(shortB5, /\x1b&l45A/);
  assert.match(shortB5, /\x1b&l2S/);
  assert.match(shortB5, /@PJL SET BINDING=SHORTEDGE/);
  assert.doesNotMatch(shortB5, /JISB5/);
  const footer = pclJobFooter();
  assert.equal(footer[0], 0x1b);
  assert.equal(footer[1], 0x45);
  assert.match(text(footer), /@PJL EOJ/);
  assert.ok(text(footer).endsWith("\x1b%-12345X"));
});

test("printable frame fits the page and landscape PDF turns", () => {
  assert.deepEqual(printableSize("A4"), { width: 2336, height: 3364 });
  assert.deepEqual(printableSize("A3"), { width: 3368, height: 4817 });
  assert.deepEqual(printableSize("B5"), { width: 2008, height: 2891 });
  const frame = printableSize("A4");
  const turned = pageDrawPlan(842, 595, frame.width, frame.height);
  assert.equal(turned.landscape, true);
  assert.equal(turned.rotation, 90);
  assert.ok(turned.drawWidth <= frame.width + 0.01);
  assert.ok(turned.drawHeight <= frame.height + 0.01);
  assert.ok(turned.drawHeight > frame.height * 0.9);
  const portrait = pageDrawPlan(595, 842, frame.width, frame.height);
  assert.equal(portrait.rotation, 0);
  assert.ok(portrait.drawWidth <= frame.width + 0.01);
  assert.ok(portrait.drawHeight <= frame.height + 0.01);
  const width = frame.width;
  const mono = new Uint8Array(width * 8);
  mono[0] = 1;
  const page = encodePclPageFromMono(mono, width, 8);
  const raw = text(page);
  const dataAt = raw.indexOf("\x1b*b2M");
  assert.ok(dataAt >= 0);
  assert.ok(page.includes(0x80), "left edge pixel must survive");
  assert.match(raw, /\x1b\*p0x72Y\x1b\*r2336S\x1b\*r8T\x1b\*r1A\x1b\*b2M/);
  assert.equal(raw.includes("\x1b*r0A"), false);
  assert.equal(raw.includes("\x1b*p0X"), false);
  assert.equal(page[page.length - 1], 0x0c);
  const job = new Uint8Array(page.length * 2);
  job.set(page, 0);
  job.set(page, page.length);
  const closed = text(job) + text(pclJobFooter());
  assert.equal(closed.split("\x1b*b2M").length - 1, 2);
  assert.match(closed, /\x1bE\x1b%-12345X@PJL EOJ/);
  const blank = text(encodePclPageFromMono(new Uint8Array(64), 8, 8));
  assert.match(blank, /\x1b\*b\d+W/);
  assert.equal(needsBlankBack(3, "long"), true);
  assert.equal(needsBlankBack(2, "short"), false);
  assert.equal(needsBlankBack(3, "simplex"), false);
  const commands = pclPageCommands(mono, width, 8);
  const packets = bundleCommands(commands, 80);
  assert.deepEqual(Buffer.from(packets.reduce((all, part) => concatBytes(all, part), new Uint8Array())), Buffer.from(concatBytes(...commands)));
  for (const packet of packets) assert.equal(commandTailsClosed(packet), true);
  assert.match(text(pclAbortFooter()), /\x1b\*rC\x1bE/);
  assert.equal(canPdfDirect(new Uint8Array([37, 80, 68, 70])), true);
  assert.equal(pdfLooksEncrypted(new TextEncoder().encode("%PDF-1.4\n/Encrypt 1 0 R")), true);
  assert.equal(canPdfDirect(new Uint8Array(25 * 1024 * 1024 + 1)), false);
});

function concatBytes(...parts: Uint8Array[]) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function commandTailsClosed(packet: Uint8Array) {
  let index = 0;
  while (index < packet.length) {
    if (packet[index] === 0x0c) {
      index += 1;
      continue;
    }
    if (packet[index] !== 0x1b) return false;
    index += 1;
    if (packet[index] === 0x45) {
      index += 1;
      continue;
    }
    let word = "";
    while (index < packet.length) {
      const value = packet[index];
      index += 1;
      if (value >= 65 && value <= 90) {
        word += String.fromCharCode(value);
        break;
      }
      if ((value >= 48 && value <= 57) || (value >= 97 && value <= 122)) word += String.fromCharCode(value);
    }
    if (word.endsWith("W")) {
      const count = Number(word.replace(/[^\d]/g, ""));
      if (!Number.isFinite(count) || index + count > packet.length) return false;
      index += count;
    }
  }
  return index === packet.length;
}

test("memo threshold stays sharp and photos keep gray", () => {
  const sharp = monoFromLuma(Float32Array.from([174, 175]), 2, 1, "threshold");
  assert.deepEqual(Array.from(sharp), [1, 0]);
  const clipped = monoFromLuma(Float32Array.from([20, 250, 20, 250, 20, 250, 20, 250]), 8, 1, "dither");
  assert.equal(clipped[0], 1);
  assert.equal(clipped[1], 0);
  const gray = monoFromLuma(new Float32Array(64).fill(128), 8, 8, "dither");
  assert.ok(gray.includes(0) && gray.includes(1));
});

test("UFR, PostScript, PCL6 and PDF-only gray stay on the print dialog", () => {
  const base = { liveUsb: true, catalogPcl5: true, catalogSure: true, pdfBytes: true, pdfDirect: true, docKind: "pdf" as const, pageMode: "all" as const, gray: false };
  assert.equal(resolvePrintRoute({ ...base, cmd: "UFR II" }), "preview-only");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PostScript" }), "preview-only");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PCL 6, PostScript" }), "preview-only");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PCL3GUI" }), "preview-only");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PDF" }), "usb-pdf");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PDF", gray: true }), "preview-only");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PDF", pageMode: "span" }), "preview-only");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PCL5e,PDF", pageMode: "span" }), "usb-pcl");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PCL5e,PDF", gray: true }), "usb-pcl");
  assert.equal(resolvePrintRoute({ ...base, cmd: "", docKind: "photo" }), "preview-only");
  assert.equal(resolvePrintRoute({ ...base, cmd: "", catalogPcl5: false, docKind: "photo" }), "preview-only");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PDF", pdfDirect: false }), "preview-only");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PCL5e,PDF", pdfDirect: false }), "usb-pcl");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PCL,PCLXL" }), "preview-only");
  assert.equal(resolvePrintRoute({ ...base, cmd: "PCL,SPL" }), "preview-only");
  assert.equal(commandHasPcl5("PJL,PCL,PDF"), false);
  assert.equal(commandHasPcl5("PCL5e"), true);
  assert.equal(commandHasPcl5("PCLXL"), false);
  const sindoh = Atlas.match("신도리코 D450", "");
  assert.equal(sindoh.kind, "match");
  assert.match(sindoh.printer.model, /D450/);
  const apeos = Atlas.match("후지필름 Apeos C2570", "");
  assert.equal(apeos.kind, "match");
  assert.equal(apeos.printer.languages.includes("PCL5e"), false);
});

test("PackBits boundaries, blank page, cursor, and protocol gates", () => {
  const same = packBits(new Uint8Array(128).fill(7));
  assert.equal(same[0], 129);
  assert.equal(same[1], 7);
  assert.equal(same.length, 2);
  const longer = packBits(new Uint8Array(129).fill(7));
  assert.equal(longer[0], 129);
  assert.equal(longer[2], 0);
  assert.equal(longer[3], 7);
  const mixed = packBits(Uint8Array.from({ length: 128 }, (_, index) => (index % 40) + 1));
  assert.equal(mixed[0], 127);
  assert.equal(mixed.length, 129);
  const mixedLong = packBits(Uint8Array.from({ length: 129 }, (_, index) => (index % 40) + 1));
  assert.equal(mixedLong[0], 127);
  assert.equal(mixedLong[129], 0);
  const pair = packBits(Uint8Array.of(4, 4));
  assert.equal(pair[0], 255);
  assert.equal(pair[1], 4);
  const tail = packBits(Uint8Array.of(1, 2, 2));
  assert.deepEqual(Array.from(tail), [0, 1, 255, 2]);
  for (const packed of [same, longer, mixed, mixedLong, pair, tail]) assert.equal(packed.includes(0x80), false);
  const blank = encodePclPageFromMono(new Uint8Array(64), 8, 8);
  assert.match(text(blank), /\x1b\*p0x72Y/);
  assert.match(text(blank), /\x1b\*r8S\x1b\*r8T\x1b\*r1A\x1b\*b2M/);
  assert.match(text(blank), /\x1b\*b\d+W/);
  assert.equal(needsBlankBack(3, "long"), true);
  assert.equal(text(pclJobHeader({ copies: 2, duplex: "long", paper: "A4", pages: 3 })).includes("\x1b&l2X"), false);
  assert.equal(rasterTurn(842, 595), 90);
  assert.equal(rasterTurn(595, 842), 0);
  assert.notEqual(rasterTurn(842, 595), 180);
  assert.equal(pageDrawPlan(842, 595, 200, 280).rotation, 90);
  assert.equal(pickPrinterProtocol([
    { interfaceClass: 7, interfaceProtocol: 4, hasOut: true },
    { interfaceClass: 255, interfaceProtocol: 2, hasOut: true },
    { interfaceClass: 7, interfaceProtocol: 3, hasOut: true },
    { interfaceClass: 7, interfaceProtocol: 1, hasOut: true },
    { interfaceClass: 7, interfaceProtocol: 2, hasOut: true },
  ]), 2);
  assert.equal(pickPrinterProtocol([{ interfaceClass: 7, interfaceProtocol: 4, hasOut: true }]), null);
  const lines = wrapMeasuredLines("a".repeat(50), (value) => value.length * 10, 100);
  assert.equal(lines.length, 5);
  assert.equal(paginateLines(lines, 2).length, 3);
  assert.equal(paginateLines(["하나", "둘", "셋"], 2).length, 2);
});
