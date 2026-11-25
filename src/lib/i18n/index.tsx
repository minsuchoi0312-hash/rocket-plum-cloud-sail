import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { currentLang, detectLang, htmlLang, saveLang, setCurrentLang, tr, type Lang, type MsgKey, type Vars } from "./core.ts";

export { LANGS, LANG_STORAGE_KEY, currentLang, m, msgText, tr, trIn, type Lang, type Msg, type MsgKey } from "./core.ts";

/** ready: 화면이 뜬 뒤 저장값·브라우저 언어 감지를 마쳤는지(첫 안내 문구를 맞는 언어로 만들 때 기다리는 용도) */
type I18n = { lang: Lang; ready: boolean; setLang: (lang: Lang) => void; t: (key: MsgKey, vars?: Vars) => string };

const I18nContext = createContext<I18n>({ lang: "ko", ready: false, setLang: () => {}, t: tr });

/** 첫 화면(SSR·하이드레이션)은 항상 한국어로 그리고, 화면이 뜬 뒤 저장값·브라우저 언어로 바꿔요. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");
  const [ready, setReady] = useState(false);
  // 자식이 그려지기 전에 모듈 언어를 맞춰 둬야 라이브러리 문구도 같은 언어가 돼요.
  if (currentLang() !== lang) setCurrentLang(lang);

  useEffect(() => {
    const found = detectLang();
    if (found !== "ko") {
      setCurrentLang(found);
      setLangState(found);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = htmlLang(lang);
    document.title = tr("app.title");
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setCurrentLang(next);
    saveLang(next);
    setLangState(next);
  }, []);

  // lang이 바뀌면 t도 새 함수가 되어 memo된 자식도 다시 그려져요.
  const value = useMemo<I18n>(() => ({ lang, ready, setLang, t: (key, vars) => tr(key, vars) }), [lang, ready, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
