/**
 * 헤더 화면 꾸미기: 팔레트 아이콘 → 팝오버.
 * · 밝기: 시스템(폰 · PC 설정 따라감) · 밝게 · 어둡게
 * · 색 테마: 밝을 때 · 어두울 때 따로 고른다
 * 언어 선택과 같은 방식 — 바깥 누르기 · Esc 로 닫고, 고르면 바로 바뀐다.
 */
import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Palette, Sun } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { PALETTES, readPalette, savePalette, type PaletteId, type Scheme, type ThemeMode } from "@/lib/palette";

type Props = {
  mode: ThemeMode;
  /** 지금 실제로 보이는 밝기 */
  scheme: Scheme;
  onMode: (mode: ThemeMode) => void;
  /** 색 테마를 바꾼 뒤 — 부모가 화면에 다시 적용 */
  onPalette: () => void;
};

export function ThemePicker({ mode, scheme, onMode, onPalette }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Record<Scheme, PaletteId>>({ light: "blue", dark: "blue" });
  const boxRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) setPicked({ light: readPalette("light"), dark: readPalette("dark") });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(target: Scheme, id: PaletteId) {
    savePalette(target, id);
    setPicked((prev) => ({ ...prev, [target]: id }));
    onPalette();
  }

  const modes = [
    ["system", Monitor, "pal.system"],
    ["light", Sun, "pal.light"],
    ["dark", Moon, "pal.dark"],
  ] as const;

  return (
    <div ref={boxRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("pal.aria")}
        title={t("pal.aria")}
        className="icon-btn inline-flex size-10 items-center justify-center rounded-full"
      >
        <Palette className="size-6" aria-hidden="true" />
      </button>
      {open ? (
        <div role="group" aria-label={t("pal.menu")} className="palette-pop absolute right-0 top-11 z-50 w-[292px] rounded-2xl p-3">
          <p className="palette-head">{t("pal.mode")}</p>
          <div className="palette-mode" role="radiogroup" aria-label={t("pal.mode")}>
            {modes.map(([id, Icon, label]) => (
              <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => onMode(id)}>
                <Icon className="size-[18px]" aria-hidden="true" />
                {t(label)}
              </button>
            ))}
          </div>
          {(["light", "dark"] as const).map((target) => {
            const current = PALETTES.find((row) => row.id === picked[target]) ?? PALETTES[0];
            return (
              <div key={target} className={`palette-row ${scheme === target ? "is-now" : ""}`}>
                <p className="palette-head">
                  <span>{t(target === "light" ? "pal.forLight" : "pal.forDark")}</span>
                  <span className="palette-name">{t(current.label)}</span>
                </p>
                <div className="palette-swatches" role="radiogroup" aria-label={t(target === "light" ? "pal.forLight" : "pal.forDark")}>
                  {PALETTES.map((row) => {
                    const [accent, bg] = row[target];
                    const on = row.id === picked[target];
                    return (
                      <button
                        key={row.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={t(row.label)}
                        title={t(row.label)}
                        onClick={() => pick(target, row.id)}
                        className="palette-chip"
                        style={{ background: bg, color: accent }}
                      >
                        <span className="palette-dot" style={{ background: accent }} aria-hidden="true" />
                        {on ? <Check className="palette-check size-4" aria-hidden="true" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
