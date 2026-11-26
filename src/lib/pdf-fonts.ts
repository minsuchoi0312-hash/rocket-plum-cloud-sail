/**
 * PDF 안의 글꼴이 모두 들어 있는지(embedded) 검사한다.
 *
 * 왜: 'PDF Direct'는 PDF 원본을 복사기에 그대로 보내 복사기가 직접 그린다. 이때 PDF에 글꼴이 들어 있지 않으면
 * 복사기가 자기 글꼴로 대신 그리는데, 대부분의 복사기에는 한글 글꼴이 없어 한글이 엉뚱한 영문 기호로 찍힌다
 * (예: '2026년 9월' → '2026D 9 '). 그런 PDF는 폰에서 그림(래스터)으로 바꿔 보내야 한다.
 *
 * 규칙: 글꼴 설명(FontDescriptor)에 FontFile · FontFile2 · FontFile3 중 하나도 없으면 '안 들어 있음'.
 * 설명이 아예 없는 Type1 표준 14 글꼴(Helvetica 등, 영문 전용)은 모든 복사기에 있으므로 괜찮다.
 * Type0(CID) 글꼴은 하위 글꼴의 설명까지 본다. 읽다가 실패하면 안전하게 false.
 */
import type { PDFDict, PDFDocument, PDFName, PDFObject } from "pdf-lib";

const STANDARD_14 = new Set([
  "Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic",
  "Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique",
  "Courier", "Courier-Bold", "Courier-Oblique", "Courier-BoldOblique",
  "Symbol", "ZapfDingbats",
]);

/**
 * embedded: 모든 글꼴이 들어 있음 / missing: 빠진 글꼴 이름
 * cjk: 한글 · 한자 · 일본어용 복합 글꼴(Type0 · CID)이 있음 — 들어 있어도 복사기 PDF 해석기가 잘못 그리는 일이 있어
 *      PDF Direct를 쓰지 않는다(프린터쉐어처럼 폰에서 그림으로 보낸다)
 */
export type FontCheck = { embedded: boolean; missing: string[]; cjk: boolean };

/** PDF Direct(원본 직통)로 보내도 되는 문서인지: 글꼴이 모두 들어 있고 CJK 복합 글꼴이 없을 때만 */
export function directSafe(check: FontCheck | null | undefined) {
  return Boolean(check && check.embedded && !check.cjk);
}

/** pdf-lib으로 이미 연 문서를 검사한다 (테스트 · 재사용용) */
export function checkFontsEmbedded(doc: PDFDocument, lib: { PDFDict: typeof PDFDict; PDFName: typeof PDFName }): FontCheck {
  const { PDFDict: Dict, PDFName: Name } = lib;
  const ctx = doc.context;
  const missing: string[] = [];
  let cjk = false;
  const asDict = (value: PDFObject | undefined): PDFDict | undefined => {
    const resolved = value === undefined ? undefined : ctx.lookup(value);
    return resolved instanceof Dict ? resolved : undefined;
  };
  const nameOf = (dict: PDFDict, key: string) => {
    const value = dict.get(Name.of(key));
    return value ? String(value).replace(/^\//, "") : "";
  };
  const hasFile = (descriptor: PDFDict) => ["FontFile", "FontFile2", "FontFile3"].some((key) => descriptor.has(Name.of(key)));

  /* 글꼴 하나(또는 Type0의 하위 글꼴)를 검사 */
  const checkFont = (font: PDFDict) => {
    const subtype = nameOf(font, "Subtype");
    const base = nameOf(font, "BaseFont").replace(/^[A-Z]{6}\+/, "");
    if (subtype === "Type3") return; // 글자 모양을 PDF 안에 그림으로 갖고 있다
    if (subtype === "Type0") {
      cjk = true;
      const kids = ctx.lookup(font.get(Name.of("DescendantFonts")));
      const list = kids && "asArray" in kids ? (kids as unknown as { asArray(): PDFObject[] }).asArray() : [];
      if (!list.length) missing.push(base || "Type0");
      for (const kid of list) {
        const child = asDict(kid);
        if (child) checkFont(child);
        else missing.push(base || "Type0");
      }
      return;
    }
    const descriptor = asDict(font.get(Name.of("FontDescriptor")));
    if (descriptor ? hasFile(descriptor) : subtype === "Type1" && STANDARD_14.has(base)) return;
    missing.push(base || subtype || "font");
  };

  for (const [, object] of ctx.enumerateIndirectObjects()) {
    if (!(object instanceof Dict)) continue;
    const type = nameOf(object, "Type");
    const subtype = nameOf(object, "Subtype");
    /* Type0의 하위(CIDFontType0/2)는 Type0을 볼 때 함께 본다 */
    if (type === "Font" && (subtype === "CIDFontType0" || subtype === "CIDFontType2")) cjk = true;
    if (type !== "Font" || subtype === "CIDFontType0" || subtype === "CIDFontType2") continue;
    checkFont(object);
  }
  return { embedded: missing.length === 0, missing: [...new Set(missing)], cjk };
}

/** PDF 바이트를 열어 검사한다. 열지 못하면(손상 · 암호 등) 안전하게 '안 들어 있음'으로 본다. */
export async function pdfFontsEmbedded(data: Uint8Array): Promise<FontCheck> {
  try {
    const lib = await import("pdf-lib");
    const doc = await lib.PDFDocument.load(data, { ignoreEncryption: true, updateMetadata: false });
    return checkFontsEmbedded(doc, lib);
  } catch {
    return { embedded: false, missing: ["(unreadable)"], cjk: false };
  }
}
