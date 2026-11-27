/**
 * 운영자 연락처: 앱 문의 버튼 · 이용약관 · 개인정보처리방침 · 공개 처리방침 페이지(public/privacy.html)가 함께 쓴다.
 * 다른 모듈을 가져오지 않는다 (scripts/make-legal-pages.mjs가 Node로 바로 읽는다).
 */
export const SUPPORT_EMAIL = "peopleper135@naver.com";

/** 공개 개인정보처리방침 주소(Google Play 등록용) — 저장소 nuguna-print-legal 의 GitHub Pages. 비우면 앱에서 링크를 숨긴다 */
export const PRIVACY_POLICY_URL = "https://minsuchoi0312-hash.github.io/nuguna-print-legal/privacy.html";

/** 앱에서 만든 프린터 연결 링크 · QR 이 여는 공개 페이지(nuguna-print-legal/connect.html).
 *  프린터 정보는 # 뒤에 담아 GitHub 서버로는 가지 않고, 페이지가 앱(nugunaprint://connect)을 연다 */
export const CONNECT_PAGE_URL = "https://minsuchoi0312-hash.github.io/nuguna-print-legal/connect.html";
