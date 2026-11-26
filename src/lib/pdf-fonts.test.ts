// PDF 글꼴 포함 검사: 글꼴이 안 들어간 한글 PDF는 PDF Direct로 보내면 복사기에서 한글이 깨진다
// 실행: node --experimental-strip-types --test src/lib/pdf-fonts.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { pdfFontsEmbedded } from "./pdf-fonts.ts";

/** 객체 목록으로 최소 PDF를 만든다 (1: Catalog, 2: Pages, 3: Page, 4: Contents, 5~: 글꼴들) */
function rawPdf(objects: string[]) {
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

const head = (fonts: string) => [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << ${fonts} >> >> /Contents 4 0 R >>`,
  "<< /Length 0 >>\nstream\n\nendstream",
];
const descriptor = (name: string, file = "") => `<< /Type /FontDescriptor /FontName /${name} /Flags 4 /FontBBox [0 -120 1000 880] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 700 /StemV 80 ${file} >>`;
const type0 = (name: string, enc: string, sub: string, descRef: string) =>
  `<< /Type /Font /Subtype /Type0 /BaseFont /${name} /Encoding /${enc} /DescendantFonts [<< /Type /Font /Subtype /${sub} /BaseFont /${name} /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> /FontDescriptor ${descRef} >>] >>`;

test("한글 CID 글꼴이 안 들어 있으면 false (HYGoThic · UniKS-UCS2-H)", async () => {
  const pdf = rawPdf([...head("/F1 5 0 R"), type0("HYGoThic-Medium", "UniKS-UCS2-H", "CIDFontType0", "6 0 R"), descriptor("HYGoThic-Medium")]);
  const r = await pdfFontsEmbedded(pdf);
  assert.equal(r.embedded, false);
  assert.deepEqual(r.missing, ["HYGoThic-Medium"]);
});

test("굴림 TrueType CID 글꼴이 안 들어 있으면 false", async () => {
  const pdf = rawPdf([...head("/F1 5 0 R"), type0("Gulim", "Identity-H", "CIDFontType2", "6 0 R"), descriptor("Gulim")]);
  assert.equal((await pdfFontsEmbedded(pdf)).embedded, false);
});

test("한글 CID 글꼴이 들어 있으면(FontFile2) true", async () => {
  const pdf = rawPdf([
    ...head("/F1 5 0 R"),
    type0("ABCDEF+Gulim", "Identity-H", "CIDFontType2", "6 0 R"),
    descriptor("ABCDEF+Gulim", "/FontFile2 7 0 R"),
    "<< /Length 0 >>\nstream\n\nendstream",
  ]);
  assert.equal((await pdfFontsEmbedded(pdf)).embedded, true);
});

test("들어 있는 글꼴과 안 들어 있는 글꼴이 섞이면 false", async () => {
  const pdf = rawPdf([
    ...head("/F1 5 0 R /F2 8 0 R"),
    type0("ABCDEF+Gulim", "Identity-H", "CIDFontType2", "6 0 R"),
    descriptor("ABCDEF+Gulim", "/FontFile2 7 0 R"),
    "<< /Length 0 >>\nstream\n\nendstream",
    "<< /Type /Font /Subtype /TrueType /BaseFont /Batang /FontDescriptor 9 0 R >>",
    descriptor("Batang"),
  ]);
  const r = await pdfFontsEmbedded(pdf);
  assert.equal(r.embedded, false);
  assert.deepEqual(r.missing, ["Batang"]);
});

test("영문 표준 14 글꼴(Helvetica)만 쓰면 true", async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage().drawText("Hello 2026", { font, x: 50, y: 700 });
  assert.equal((await pdfFontsEmbedded(await doc.save())).embedded, true);
});

test("글꼴이 없는 PDF(사진만)는 true", async () => {
  const doc = await PDFDocument.create();
  doc.addPage();
  assert.equal((await pdfFontsEmbedded(await doc.save())).embedded, true);
});

test("읽을 수 없는 PDF는 안전하게 false", async () => {
  assert.equal((await pdfFontsEmbedded(new TextEncoder().encode("not a pdf"))).embedded, false);
});
