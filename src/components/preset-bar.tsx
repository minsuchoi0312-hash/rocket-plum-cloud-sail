/**
 * 원터치 인쇄 프리셋: 기본 4개는 2×2 그리드, 내 설정(최대 3개, PIN 미저장)은 그 아래 줄.
 * 하이라이트는 부모가 정한 activeId로만 표시 — 프리셋 적용 뒤 옵션을 하나라도 바꾸면 부모가 해제한다.
 */
import { useEffect, useState } from "react";
import { Plus, X } from "@/components/icons";
import { BUILTIN_PRESETS, CUSTOM_LIMIT, PRESETS_CHANGED, deleteCustomPreset, describeSettings, loadCustomPresets, saveCustomPreset, type Preset, type PresetSettings } from "@/lib/presets";
import { useI18n } from "@/lib/i18n";

export function PresetBar({
  current,
  activeId,
  disabled,
  onApply,
  onSaved,
  onNotice,
}: {
  current: PresetSettings;
  activeId: string | null;
  disabled?: boolean;
  onApply: (preset: Preset) => void;
  onSaved?: (preset: Preset) => void;
  onNotice: (text: string) => void;
}) {
  const [custom, setCustom] = useState<Preset[]>([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const { t } = useI18n();
  useEffect(() => {
    const load = () => setCustom(loadCustomPresets());
    load();
    window.addEventListener(PRESETS_CHANGED, load);
    return () => window.removeEventListener(PRESETS_CHANGED, load);
  }, []);

  function save() {
    const result = saveCustomPreset(name, current);
    setCustom(result.list);
    setNaming(false);
    setName("");
    if (result.ok) onSaved?.(result.list[result.list.length - 1]);
    onNotice(result.ok ? t("pbar.saved") : result.error || t("pbar.saveFail"));
  }

  const card = (preset: Preset) => (
    <button key={preset.id} type="button" disabled={disabled} onClick={() => onApply(preset)} aria-pressed={activeId === preset.id} className={`chip preset-card min-w-0 rounded-2xl px-3 py-2.5 text-left ${activeId === preset.id ? "is-on" : ""}`}>
      <span className="block truncate text-sm font-semibold">{preset.label}</span>
      <span className="preset-hint mt-0.5 block text-xs leading-snug opacity-80">{describeSettings(preset.settings)}</span>
    </button>
  );

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <p className="opt-label">{activeId ? t("pbar.title") : t("pbar.manual")}</p>
        {!naming && custom.length < CUSTOM_LIMIT ? (
          <button type="button" disabled={disabled} onClick={() => setNaming(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-accent disabled:opacity-50">
            <Plus className="size-3.5" aria-hidden="true" />
            {t("pbar.saveCurrent")}
          </button>
        ) : null}
      </div>
      {naming ? (
        <form
          className="mt-1.5 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={12} placeholder={t("pre.mine", { n: custom.length + 1 })} aria-label={t("pbar.nameAria")} className="field h-9 min-w-0 flex-1 rounded-xl px-3 text-sm outline-none" />
          <button type="submit" className="btn-solid h-9 shrink-0 rounded-xl px-3 text-sm">
            {t("pbar.save")}
          </button>
          <button type="button" onClick={() => setNaming(false)} className="chip h-9 shrink-0 rounded-xl px-3 text-sm">
            {t("pbar.cancel")}
          </button>
        </form>
      ) : null}
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">{BUILTIN_PRESETS.map(card)}</div>
      {custom.length ? (
        <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {custom.map((preset) => (
            <div key={preset.id} className="flex min-w-0 gap-1">
              <div className="min-w-0 flex-1">{card(preset)}</div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setCustom(deleteCustomPreset(preset.id));
                  onNotice(t("pbar.deleted", { name: preset.label }));
                }}
                className="chip w-9 shrink-0 rounded-2xl"
                aria-label={t("pbar.deleteAria", { name: preset.label })}
              >
                <X className="mx-auto size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
