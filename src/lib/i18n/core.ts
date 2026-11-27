import { en } from "./en.ts";
import { ja } from "./ja.ts";
import { ko } from "./ko.ts";
import type { Lang, MsgKey, Vars } from "./types.ts";
import { zh } from "./zh.ts";

export type { Lang, MsgKey, Vars } from "./types.ts";

export const LANG_STORAGE_KEY = "nuguna-lang";

/** 언어 선택 버튼에 쓰는 이름. 각 언어는 자기 글자로 적어요. */
export const LANGS: ReadonlyArray<{ id: Lang; short: string; label: string; html: string }> = [
  { id: "ko", short: "KO", label: "한국어", html: "ko" },
  { id: "en", short: "EN", label: "English", html: "en" },
  { id: "ja", short: "日", label: "日本語", html: "ja" },
  { id: "zh", short: "中", label: "中文(简体)", html: "zh-CN" },
];

const DICTS: Record<Lang, Record<MsgKey, string>> = { ko, en, ja, zh };

/** 리액트 밖(라이브러리 함수)에서도 같은 언어를 쓰도록 현재 언어를 모듈에 둬요. SSR은 항상 ko. */
let current: Lang = "ko";

export function currentLang(): Lang {
  return current;
}

export function setCurrentLang(lang: Lang) {
  current = lang;
}

export function isLang(value: unknown): value is Lang {
  return value === "ko" || value === "en" || value === "ja" || value === "zh";
}

/** "ko-KR", "en-US", "ja", "zh-Hant-TW" 같은 값을 4개 언어 중 하나로 */
export function normalizeLang(value: string | null | undefined): Lang | null {
  const head = String(value ?? "").trim().toLowerCase().split(/[-_]/)[0];
  return isLang(head) ? head : null;
}

export function format(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

export function trIn(lang: Lang, key: MsgKey, vars?: Vars) {
  return format(DICTS[lang][key] ?? ko[key] ?? key, vars);
}

/** 지금 언어 사전에서 prefixes로 시작하는 키의 문구를 모두 이어 붙여요(인쇄 이미지 글꼴 미리 받기용). */
export function dictText(prefixes: readonly string[]) {
  const dict = DICTS[current];
  return Object.keys(dict)
    .filter((key) => prefixes.some((prefix) => key.startsWith(prefix)))
    .map((key) => dict[key as MsgKey])
    .join("");
}

/** 앱이 직접 만든 문구인지 알아보려고 최근 번역 결과를 조금 기억해 둬요(오류 문구 판별용). */
const recent = new Set<string>();

/** 지금 언어로 번역 */
export function tr(key: MsgKey, vars?: Vars) {
  const text = trIn(current, key, vars);
  recent.add(text);
  if (recent.size > 400) recent.delete(recent.values().next().value as string);
  return text;
}

/** 이 문구가 앱 사전에서 나온 것인지(브라우저 원문 오류가 아닌지) */
export function isAppText(text: string) {
  return recent.has(text);
}

/**
 * 화면 상태에 담아 두는 안내 문구. 번역 키로 담아 두면 언어를 바꾸는 즉시 다시 번역돼요.
 * (사용자 입력·브라우저 오류처럼 번역할 수 없는 글은 문자열 그대로)
 */
export type Msg = string | { k: MsgKey; v?: Vars };

export function m(k: MsgKey, v?: Vars): Msg {
  return { k, v };
}

export function msgText(msg: Msg | null | undefined): string {
  if (!msg) return "";
  return typeof msg === "string" ? msg : tr(msg.k, msg.v);
}

/** 저장된 선택 → 브라우저 언어 → 한국어 */
export function detectLang(): Lang {
  try {
    const saved = normalizeLang(localStorage.getItem(LANG_STORAGE_KEY));
    if (saved) return saved;
  } catch {
    // 저장소를 못 쓰는 환경
  }
  try {
    const list = [...(navigator.languages ?? []), navigator.language];
    for (const item of list) {
      const hit = normalizeLang(item);
      if (hit) return hit;
    }
  } catch {
    // navigator 없음
  }
  return "ko";
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // 저장소를 못 써도 이번 화면에는 적용돼요
  }
}

export function htmlLang(lang: Lang) {
  return LANGS.find((row) => row.id === lang)?.html ?? lang;
}
