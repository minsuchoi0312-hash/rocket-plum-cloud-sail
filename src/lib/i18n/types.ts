import type { ko } from "./ko.ts";

/** 사전 키: 한국어 사전(ko.ts)이 기준이라 다른 언어에서 키가 빠지면 타입 오류가 나요. */
export type MsgKey = keyof typeof ko;
export type Lang = "ko" | "en" | "ja" | "zh";
export type Vars = Record<string, string | number>;
