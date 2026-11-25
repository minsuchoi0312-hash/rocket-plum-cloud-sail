/**
 * 헤더 언어 선택: 지구본 + 현재 언어 약자(KO/EN/日/中). 누르면 4개 언어 팝오버.
 * 바깥을 누르거나 Esc를 누르면 닫히고, 선택 즉시 새로고침 없이 바뀐다.
 */
import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "@/components/icons";
import { LANGS, useI18n } from "@/lib/i18n";

export function LangSwitcher() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = LANGS.find((row) => row.id === lang) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    /* 키보드: Esc 닫고 버튼으로 포커스 복귀, ↑↓·Home·End로 항목 이동 */
    const items = () => [...(boxRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio]") ?? [])];
    items().find((el) => el.getAttribute("aria-checked") === "true")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        btnRef.current?.focus();
        return;
      }
      const list = items();
      const at = list.indexOf(document.activeElement as HTMLButtonElement);
      const go = event.key === "ArrowDown" ? at + 1 : event.key === "ArrowUp" ? at - 1 : event.key === "Home" ? 0 : event.key === "End" ? list.length - 1 : null;
      if (go === null || !list.length) return;
      event.preventDefault();
      list[(go + list.length) % list.length]?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={boxRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("lang.aria", { v: current.label })}
        title={t("lang.aria", { v: current.label })}
        className="icon-btn lang-btn inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-2 text-[13px] font-bold"
      >
        <Globe className="size-[22px]" aria-hidden="true" />
        <span>{current.short}</span>
      </button>
      {open ? (
        <ul role="menu" aria-label={t("lang.menu")} className="lang-pop absolute right-0 top-11 z-50 w-44 rounded-2xl p-1.5">
          {LANGS.map((row) => (
            <li key={row.id} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={row.id === lang}
                lang={row.html}
                onClick={() => {
                  setLang(row.id);
                  setOpen(false);
                  btnRef.current?.focus();
                }}
                className={`lang-item flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm ${row.id === lang ? "is-on" : ""}`}
              >
                <span>{row.label}</span>
                {row.id === lang ? <Check className="size-4" aria-hidden="true" /> : <span className="text-[11px] opacity-60">{row.short}</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
