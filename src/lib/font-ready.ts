/**
 * 캔버스에 글자를 그리기 전에 Pretendard 글꼴 조각을 미리 받아 둔다.
 *
 * Pretendard는 글자 범위별로 쪼갠 글꼴(dynamic subset)이라, 화면에 한 번도 나오지 않은 글자는 아직 받지 않은 상태다.
 * 그 상태로 캔버스에 그리면 그 글자만 시스템 글꼴로 섞여 찍히고(글꼴 깨짐), 줄 나눔 폭도 실제와 달라진다.
 * document.fonts.load(…, text)는 text에 든 글자가 속한 조각만 골라 받는다.
 */
import { dictText } from "./i18n/core.ts";

const loaded = new Set<string>();

/** 인쇄 이미지에 그려지는 앱 문구(테스트 쪽 · 증명사진 바닥글 · 워터마크 기본값 · 메모 기본 제목 · QR 카드) + 숫자 · 영문 */
export function sheetGlyphs(...extra: string[]) {
  return `${dictText(["ts.", "id.", "wm.", "memo.", "qr.", "pv."])}0123456789/·-:()ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz${extra.join("")}`;
}
const FACE = '"Pretendard Variable"';

/** 아직 안 받은 글자만 골라 낸다 (공백 · 제어 문자 · 이미 받은 글자 제외) */
export function pendingGlyphs(text: string, have: ReadonlySet<string> = loaded) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const ch of text) {
    if (!ch.trim() || seen.has(ch) || have.has(ch)) continue;
    seen.add(ch);
    out.push(ch);
  }
  return out.join("");
}

/** text의 글자가 모두 들어간 글꼴 조각을 받는다. 최대 timeoutMs까지만 기다리고, 실패해도 인쇄는 막지 않는다 */
export async function fontsReady(text: string, timeoutMs = 4000) {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  const glyphs = pendingGlyphs(text);
  if (!glyphs) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const load = Promise.all([document.fonts.load(`400 16px ${FACE}`, glyphs), document.fonts.load(`700 16px ${FACE}`, glyphs)]).then(() => true);
    const late = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });
    if (await Promise.race([load, late])) for (const ch of glyphs) loaded.add(ch);
  } catch {
    /* 글꼴을 못 받아도 시스템 글꼴로 그린다 */
  } finally {
    if (timer) clearTimeout(timer);
  }
}
