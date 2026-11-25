/**
 * 짧은 비차단 알림(토스트) 공용 채널. 어느 화면에서든 toast(m("키"))로 부르면 하단 토스트 한 곳에 2초간 뜬다.
 * 번역 키(Msg)로 넘기면 떠 있는 동안 언어를 바꿔도 다시 번역된다.
 */
import type { Msg } from "./i18n/core.ts";

type Listener = (msg: Msg) => void;
const listeners = new Set<Listener>();

export function toast(msg: Msg) {
  for (const listener of listeners) listener(msg);
}

export function onToast(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
