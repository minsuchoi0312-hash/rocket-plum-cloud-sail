/**
 * 중앙 입력 정화 — URL 쿼리, 복사기 응답(IPP·PJL·mDNS·웹 제목), 사용자 입력(별칭·워터마크·보안 인쇄 사용자명·PIN)을
 * 화면·PJL 헤더·저장소에 넣기 전에 한곳에서 다듬는다. 순수 함수라 Node에서 단위 테스트할 수 있다.
 */

/* C0 제어 문자(줄바꿈·탭·ESC 포함)·DEL·C1 제어 문자, 그리고 폭 없는 글자·방향 제어 문자 */
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g;

/** 화면에 보일 한 줄 글: 제어 문자는 공백으로, 공백 뭉치는 하나로, 앞뒤 공백 제거, 최대 길이 */
export function cleanText(value: unknown, max = 80): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(CONTROL, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** PJL 헤더 값(USERNAME 등): 영문·숫자만. 따옴표·줄바꿈·ESC·공백이 들어가면 헤더가 깨지므로 모두 버린다 */
export function pjlToken(value: unknown, max = 16, fallback = "USER"): string {
  return (typeof value === "string" ? value : "").replace(/[^A-Za-z0-9]/g, "").slice(0, max) || fallback;
}

/** 보안 인쇄 PIN: 숫자 정확히 4자리만. 아니면 null */
export function cleanPin(value: unknown): string | null {
  const text = typeof value === "string" ? value : "";
  return /^\d{4}$/.test(text) ? text : null;
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

/** 복사기 주소로 쓸 IPv4: 엄격한 점 4개 숫자, 0.0.0.0·x.x.x.0·x.x.x.255 제외 */
export function cleanIPv4(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!IPV4.test(text)) return "";
  const last = Number(text.split(".")[3]);
  if (text === "0.0.0.0" || last === 0 || last === 255) return "";
  return text;
}

/** PC 도우미 주소: http/https만, 계정 정보·경로·쿼리 없이 origin만. 그 외(javascript:, data:, file: 등)는 "" */
export function safeHttpOrigin(value: unknown): string {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text || text.length > 200 || CONTROL.test(text)) {
    CONTROL.lastIndex = 0;
    return "";
  }
  CONTROL.lastIndex = 0;
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (url.username || url.password) return "";
    return url.origin;
  } catch {
    return "";
  }
}

/**
 * 링크(?helper=)로 받은 도우미 주소는 이 기기(127.0.0.1 · localhost) · 사설망 IPv4 · .local 만 허용.
 * 남이 보낸 링크 하나로 인쇄 문서가 인터넷 서버로 새 나가지 않게 한다. 아니면 "".
 */
export function localHelperOrigin(value: unknown): string {
  const origin = safeHttpOrigin(value);
  if (!origin) return "";
  const host = new URL(origin).hostname.toLowerCase();
  if (host === "localhost" || host === "[::1]" || host.endsWith(".local")) return origin;
  if (!IPV4.test(host)) return "";
  const [a, b] = host.split(".").map(Number);
  const local = a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
  return local ? origin : "";
}

/** 문자열 안에 스크립트 URL 흔적이 있는지(백업 파일 검사용) */
export function hasScriptUrl(value: string) {
  return /(^|[\s"'(=])(javascript|vbscript|data)\s*:/i.test(value);
}
