/**
 * 프린터 연결 링크 — 만들기(QR · 링크 복사 · 공유)와 읽기(주소창 ?ip= · 앱 링크 · QR 스캔)를 한곳에서.
 * 순수 함수라 Node에서 테스트한다(connect-link.test.ts).
 *
 * 읽는 모양: https://아무주소/?ip=…&name=…  ·  …/connect.html#ip=…&name=…  ·  nugunaprint://connect?ip=…
 * 값은 모두 sanitize 로 다시 거른다 — 도우미는 이 기기 · 사설망만, IP는 엄격한 IPv4.
 */
import { cleanIPv4, cleanText, localHelperOrigin } from "./sanitize.ts";

export type ConnectInfo = { ip: string; name: string; helper: string; code: string };
export type ConnectTarget = { ip: string; name?: string; helper?: { url: string; code: string } | null };

const MAX_LINK = 2000;

/** 글이 프린터 연결 링크면 그 내용을, 아니면 null (IP도 도우미도 없으면 연결 링크가 아니다) */
export function parseConnectLink(text: unknown): ConnectInfo | null {
  if (typeof text !== "string") return null;
  const raw = text.trim();
  if (!raw || raw.length > MAX_LINK) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!["http:", "https:", "nugunaprint:"].includes(url.protocol)) return null;
  /* 쿼리 먼저, 같은 이름이 # 뒤에도 있으면 # 쪽을 쓴다(공개 연결 페이지는 # 만 쓴다) */
  const params = new URLSearchParams(url.search);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  for (const [key, value] of hash) params.set(key, value);
  const ip = cleanIPv4(params.get("ip"));
  const helper = localHelperOrigin(params.get("helper"));
  const code = helper ? (params.get("code") || "").replace(/\D/g, "").slice(0, 6) : "";
  const name = cleanText(params.get("name"), 40);
  if (!ip && !helper) return null;
  return { ip, name, helper, code };
}

/**
 * 연결 링크 만들기.
 * - page 를 주면(앱): 공개 연결 페이지 + #ip=…&name=… — 프린터 정보가 서버로 가지 않는다. 도우미는 넣지 않는다(폰 안 도우미는 남이 쓸 수 없다).
 * - 아니면(웹): 지금 웹 주소 + ?ip=…&name=… (+ 고른 경우 도우미 주소 · 코드)
 */
export function buildConnectLink(target: ConnectTarget, opts: { origin?: string; page?: string; withHelper?: boolean }) {
  const params = new URLSearchParams();
  params.set("ip", target.ip);
  if (target.name) params.set("name", target.name);
  if (opts.page) return `${opts.page}#${params.toString()}`;
  if (opts.withHelper && target.helper) {
    params.set("helper", target.helper.url);
    params.set("code", target.helper.code);
  }
  return `${(opts.origin || "").replace(/\/$/, "")}/?${params.toString()}`;
}
