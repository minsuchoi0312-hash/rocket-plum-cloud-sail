/**
 * 안드로이드 인쇄로 보내기 (앱 전용).
 * 만든 PDF 를 안드로이드 인쇄 창(PrintManager)에 넘긴다 → 폰에 깔린 인쇄 서비스가 인쇄한다:
 * 기본 인쇄 서비스 · Mopria, 제조사 플러그인(캐논 · 브라더 · 삼성 · HP · 엡손 · 리코 · 교세라 · 제록스 · 신도리코 …), 누구나프린트 자체 서비스.
 * 이 앱이 직접 말할 수 없는 프린터(전용 드라이버)도 제조사 서비스가 있으면 인쇄된다.
 * 네이티브 쪽은 android-native.ts 가 window.__nugunaSystemPrint 로 붙인다(NugunaNativePrintPlugin.systemPrint).
 */
type Host = { __nugunaSystemPrint?: (pdf: Uint8Array, name: string) => Promise<{ opened?: boolean }> };

const host = () => (typeof window === "undefined" ? ({} as Host) : (window as unknown as Host));

export function canSystemPrint() {
  return Boolean(host().__nugunaSystemPrint);
}

/** 안드로이드 인쇄 창을 연다. 열리면 끝 — 실제 인쇄 여부는 사용자가 그 창에서 정한다 */
export async function systemPrint(pdf: Uint8Array, name: string) {
  const fn = host().__nugunaSystemPrint;
  if (!fn) throw new Error("system print unavailable");
  const result = await fn(pdf, name.replace(/\.pdf$/i, ""));
  if (result && result.opened === false) throw new Error("system print not opened");
}
