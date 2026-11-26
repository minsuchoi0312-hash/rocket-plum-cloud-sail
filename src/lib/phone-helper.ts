/**
 * 안드로이드 앱(APK) 안의 내장 도우미 — PC 도우미와 같은 주소 · 같은 응답을 폰이 직접 한다.
 * 앱 진입점(android-main.tsx)이 window.__nugunaPhone 을 켜고 주소 · 코드를 저장해 둔다. 웹에서는 늘 꺼져 있다.
 */
export const PHONE_HELPER_URL = "http://127.0.0.1:47631";

export function phoneApp(): boolean {
  return typeof window !== "undefined" && Boolean((window as { __nugunaPhone?: boolean }).__nugunaPhone);
}

/** 지금 쓰는 도우미가 폰 내장 도우미인지 */
export function isPhoneHelper(url: string): boolean {
  return phoneApp() && url.trim().replace(/\/$/, "") === PHONE_HELPER_URL;
}
