/**
 * 인쇄 전 문서 사전 점검 (비차단 알림 칩) — 순수 함수.
 * 저해상도 사진 · 30장 이상 대용량 · 복사기 오류(용지 없음/걸림/덮개) · PDF Direct 미지원 안내.
 */
import { currentLang, tr } from "./i18n/core.ts";
import { paperMm } from "./office-job.ts";
import { reasonLabel } from "./printer-status.ts";

export type PreflightAction = "nup2" | "save-paper" | "refresh-status";
export type PreflightChip = { id: "lowres" | "bigjob" | "printer" | "pcl-fallback"; tone: "info" | "warn" | "bad"; text: string; action?: { label: string; kind: PreflightAction } };

export const LOW_DPI = 120;
export const BIG_JOB = 30;

/** 한글 받침에 맞는 조사 (이/가) */
export function josa(word: string, withFinal: string, withoutFinal: string) {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return `${word}${withFinal}(${withoutFinal})`;
  return `${word}${code % 28 ? withFinal : withoutFinal}`;
}

/**
 * 사진이 종이에 찍힐 때의 실제 DPI.
 * contain(맞추기)은 칸 안에 다 들어가게, cover(채우기)는 칸을 꽉 채우게 커진다. 증명사진은 30×40mm 칸.
 */
export function photoDpi(img: { w: number; h: number }, opts: { paper: string; landscape: boolean; nup: 1 | 2 | 4; fit: "contain" | "cover"; id?: boolean }) {
  const { width: pw, height: ph } = paperMm(opts.paper);
  let cw = opts.landscape ? ph : pw;
  let ch = opts.landscape ? pw : ph;
  if (opts.id) {
    cw = 30;
    ch = 40;
  } else if (opts.nup === 4) {
    cw /= 2;
    ch /= 2;
  } else if (opts.nup === 2) {
    if (cw > ch) cw /= 2;
    else ch /= 2;
  }
  const fit = opts.id ? "cover" : opts.fit;
  const scale = fit === "cover" ? Math.max(cw / img.w, ch / img.h) : Math.min(cw / img.w, ch / img.h); /* mm per px */
  return Math.round(25.4 / scale);
}

export type PreflightInput = {
  docKind: "pdf" | "photo" | "memo" | "test";
  photo: { w: number; h: number } | null;
  paper: string;
  landscape: boolean;
  nup: 1 | 2 | 4;
  fit: "contain" | "cover";
  idLayout: boolean;
  paperSheets: number;
  duplexOn: boolean;
  canDuplex: boolean;
  status: { state: string; reasons: string[] } | null;
  pdfDirectBlocked: boolean;
};

const BLOCKING = ["media-empty", "media-jam", "cover-open"];

export function preflight(input: PreflightInput): PreflightChip[] {
  const chips: PreflightChip[] = [];
  const blocking = (input.status?.reasons || []).filter((r) => BLOCKING.includes(r));
  if (blocking.length) {
    const label = blocking.map(reasonLabel).join(currentLang() === "ko" ? "·" : ", ");
    chips.push({ id: "printer", tone: "bad", text: tr("pf.printer", { label: currentLang() === "ko" ? josa(label, "이", "가") : label }), action: { label: tr("pf.recheck"), kind: "refresh-status" } });
  }
  if (input.docKind === "photo" && input.photo && input.photo.w > 0 && input.photo.h > 0) {
    const dpi = photoDpi(input.photo, { paper: input.paper, landscape: input.landscape, nup: input.nup, fit: input.fit, id: input.idLayout });
    if (dpi < LOW_DPI) {
      chips.push({
        id: "lowres",
        tone: "warn",
        text: tr(input.idLayout ? "pf.lowres" : "pf.lowresNup", { dpi }),
        action: !input.idLayout && input.nup === 1 ? { label: tr("pf.toNup2"), kind: "nup2" } : undefined,
      });
    }
  }
  if (input.paperSheets >= BIG_JOB && input.docKind !== "test") {
    const already = input.nup >= 2 && (input.duplexOn || !input.canDuplex);
    if (!already) {
      chips.push({ id: "bigjob", tone: "info", text: tr(input.canDuplex ? "pf.bigDuplex" : "pf.big", { n: input.paperSheets }), action: { label: tr(input.canDuplex ? "pf.applyDuplex" : "pf.apply2"), kind: "save-paper" } });
    }
  }
  if (input.pdfDirectBlocked && input.docKind === "pdf") {
    chips.push({ id: "pcl-fallback", tone: "info", text: tr("pf.pcl") });
  }
  return chips;
}
