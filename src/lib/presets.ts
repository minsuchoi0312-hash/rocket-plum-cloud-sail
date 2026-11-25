/**
 * 원터치 인쇄 프리셋 + 내 설정(최대 3개, localStorage).
 * 보안 PIN 번호는 어떤 경우에도 저장하지 않는다 — 허용한 키만 골라 담는다.
 */
import { tr, type MsgKey } from "./i18n/core.ts";

export type PresetSettings = {
  gray: boolean;
  duplex: "simplex" | "long" | "short";
  nup: 1 | 2 | 4;
  margin: "normal" | "narrow" | "none";
  secure: boolean;
};

export type Preset = { id: string; label: string; hint: string; settings: PresetSettings; builtin: boolean };

/** 이름·설명은 화면에 그릴 때 지금 언어로 읽도록 getter로 둬요. */
function builtin(id: string, key: MsgKey, settings: PresetSettings): Preset {
  return {
    id,
    builtin: true,
    settings,
    get label() {
      return tr(key);
    },
    get hint() {
      return describeSettings(settings);
    },
  };
}

export const BUILTIN_PRESETS: Preset[] = [
  builtin("save", "pre.save", { gray: true, duplex: "long", nup: 2, margin: "narrow", secure: false }),
  builtin("submit", "pre.submit", { gray: false, duplex: "simplex", nup: 1, margin: "normal", secure: false }),
  builtin("doc", "pre.doc", { gray: true, duplex: "simplex", nup: 1, margin: "none", secure: false }),
  builtin("secure", "pre.secure", { gray: true, duplex: "simplex", nup: 1, margin: "none", secure: true }),
];

export const CUSTOM_LIMIT = 3;
/** 백업 복원 등으로 내 설정이 바뀌었을 때 화면에 알리는 이벤트 이름 */
export const PRESETS_CHANGED = "nuguna-presets-changed";
const KEY = "nuguna-print-presets";

type Store = Pick<Storage, "getItem" | "setItem">;

function defaultStore(): Store | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 허용한 값만 남긴다. pin·user·문서 같은 다른 키는 들어와도 버려진다. */
export function sanitizeSettings(raw: unknown): PresetSettings {
  const x = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    gray: x.gray === true,
    duplex: x.duplex === "long" || x.duplex === "short" ? x.duplex : "simplex",
    nup: x.nup === 2 || x.nup === 4 ? x.nup : 1,
    margin: x.margin === "normal" || x.margin === "narrow" ? x.margin : "none",
    secure: x.secure === true,
  };
}

export function loadCustomPresets(store: Store | null = defaultStore()): Preset[] {
  try {
    const parsed = JSON.parse(store?.getItem(KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, CUSTOM_LIMIT).map((row, index) => {
      const item = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
      const label = typeof item.label === "string" && item.label.trim() ? item.label.trim().slice(0, 12) : tr("pre.mine", { n: index + 1 });
      const settings = sanitizeSettings(item.settings);
      return { id: typeof item.id === "string" ? item.id : `custom-${index}`, label, hint: describeSettings(settings), settings, builtin: false };
    });
  } catch {
    return [];
  }
}

function write(list: Preset[], store: Store | null) {
  try {
    store?.setItem(KEY, JSON.stringify(list.map((row) => ({ id: row.id, label: row.label, settings: sanitizeSettings(row.settings) }))));
  } catch {
    /* 저장소가 막혀도 인쇄는 계속 */
  }
}

export function saveCustomPreset(label: string, settings: unknown, store: Store | null = defaultStore()): { ok: boolean; list: Preset[]; error?: string } {
  const list = loadCustomPresets(store);
  if (list.length >= CUSTOM_LIMIT) return { ok: false, list, error: tr("pre.full", { n: CUSTOM_LIMIT }) };
  const clean = sanitizeSettings(settings);
  const name = label.trim().slice(0, 12) || tr("pre.mine", { n: list.length + 1 });
  const next = [...list, { id: `custom-${Date.now().toString(36)}`, label: name, hint: describeSettings(clean), settings: clean, builtin: false }];
  write(next, store);
  return { ok: true, list: next };
}

export function deleteCustomPreset(id: string, store: Store | null = defaultStore()) {
  const next = loadCustomPresets(store).filter((row) => row.id !== id);
  write(next, store);
  return next;
}

export function describeSettings(s: PresetSettings) {
  return [
    tr(s.gray ? "pre.gray" : "pre.color"),
    tr(s.duplex === "simplex" ? "pre.simplex" : s.duplex === "long" ? "pre.long" : "pre.short"),
    s.nup === 1 ? tr("pre.nup1") : tr("pre.nupN", { n: s.nup }),
    tr(s.margin === "none" ? "pre.mNone" : s.margin === "narrow" ? "pre.mNarrow" : "pre.mNormal"),
    s.secure ? tr("pre.secureTag") : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
