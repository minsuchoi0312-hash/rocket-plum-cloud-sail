/**
 * 설정 백업 / 복원 — 최근 프린터(별칭·IP), 학습된 검색 대역, 내 프리셋.
 * 보안 원칙: 보안 인쇄 PIN과 PC 도우미 6자리 코드는 어떤 경우에도 넣지 않는다(허용한 필드만 골라 담음).
 * v6: 화면 언어(nuguna-lang)도 함께 옮긴다.
 */
import { isLang, LANG_STORAGE_KEY, tr, type Lang } from "./i18n/core.ts";
import { cleanIPv4, cleanText, hasScriptUrl } from "./sanitize.ts";

export const BACKUP_KIND = "nuguna-print-backup";
export const BACKUP_VERSION = 1;

const KEYS = { printers: "print-atlas-v2", learned: "nuguna-subnet-learned", subnet: "nuguna-subnet", presets: "nuguna-print-presets", lang: LANG_STORAGE_KEY } as const;

type Store = Pick<Storage, "getItem" | "setItem"> & { removeItem?: (key: string) => void };

export type BackupPrinter = { uid: string; title: string; query: string; via: string; savedAt: number; alias?: string; host?: string; link?: "wifi" | "usb" | "helper" };
export type BackupPreset = { id: string; label: string; settings: { gray: boolean; duplex: "simplex" | "long" | "short"; nup: 1 | 2 | 4; margin: "normal" | "narrow" | "none"; secure: boolean } };
export type Backup = { kind: typeof BACKUP_KIND; version: number; exportedAt: string; printers: BackupPrinter[]; learnedSubnets: string[]; subnet: string; presets: BackupPreset[]; lang?: Lang };

const SUBNET = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){2}$/;

function read(store: Store, key: string): unknown {
  try {
    return JSON.parse(store.getItem(key) || "null");
  } catch {
    return null;
  }
}

const text = (v: unknown, max: number) => cleanText(v, max);

export function cleanPrinter(raw: unknown): BackupPrinter | null {
  if (!raw || typeof raw !== "object") return null;
  const x = raw as Record<string, unknown>;
  const uid = text(x.uid, 80);
  const title = text(x.title, 80);
  if (!uid || !title) return null;
  const out: BackupPrinter = { uid, title, query: text(x.query, 80) || title, via: text(x.via, 20), savedAt: typeof x.savedAt === "number" ? x.savedAt : Date.now() };
  const alias = text(x.alias, 30);
  if (alias) out.alias = alias;
  const host = cleanIPv4(x.host);
  if (host) out.host = host;
  if (x.link === "wifi" || x.link === "usb" || x.link === "helper") out.link = x.link;
  return out;
}

export function cleanPreset(raw: unknown, index: number): BackupPreset | null {
  if (!raw || typeof raw !== "object") return null;
  const x = raw as Record<string, unknown>;
  const s = (x.settings && typeof x.settings === "object" ? x.settings : {}) as Record<string, unknown>;
  return {
    id: text(x.id, 40) || `custom-${index}`,
    label: text(x.label, 12) || tr("pre.mine", { n: index + 1 }),
    settings: {
      gray: s.gray === true,
      duplex: s.duplex === "long" || s.duplex === "short" ? s.duplex : "simplex",
      nup: s.nup === 2 || s.nup === 4 ? s.nup : 1,
      margin: s.margin === "normal" || s.margin === "narrow" ? s.margin : "none",
      secure: s.secure === true,
    },
  };
}

export function buildBackup(store: Store, now = Date.now()): Backup {
  const persisted = read(store, KEYS.printers) as { state?: { saved?: unknown[] } } | null;
  const learned = read(store, KEYS.learned);
  const presets = read(store, KEYS.presets);
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: new Date(now).toISOString(),
    printers: (persisted?.state?.saved || []).map(cleanPrinter).filter((p): p is BackupPrinter => Boolean(p)).slice(0, 24),
    learnedSubnets: (Array.isArray(learned) ? learned : []).filter((s): s is string => typeof s === "string" && SUBNET.test(s)).slice(0, 4),
    subnet: (() => {
      const v = store.getItem(KEYS.subnet) || "";
      return SUBNET.test(v) ? v : "";
    })(),
    presets: (Array.isArray(presets) ? presets : []).map(cleanPreset).filter((p): p is BackupPreset => Boolean(p)).slice(0, 3),
    ...(() => {
      const v = store.getItem(KEYS.lang);
      return isLang(v) ? { lang: v } : {};
    })(),
  };
}

export function backupFileName(now = Date.now()) {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `nuguna-print-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
}

/** 백업 파일 최대 크기(정상 파일은 수 KB). 넘으면 손상·악성으로 본다 */
const MAX_JSON = 256 * 1024;
const ROOT_KEYS = new Set(["kind", "version", "exportedAt", "printers", "learnedSubnets", "subnet", "presets", "lang"]);
const PRINTER_KEYS = new Set(["uid", "title", "query", "via", "savedAt", "alias", "host", "link"]);
const PRESET_KEYS = new Set(["id", "label", "settings"]);
const SETTING_KEYS = new Set(["gray", "duplex", "nup", "margin", "secure"]);

function fail(): never {
  throw new Error(tr("bk.invalid"));
}

const isObj = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const onlyKeys = (o: Record<string, unknown>, allowed: Set<string>) => Object.keys(o).every((k) => allowed.has(k));
const str = (v: unknown, max: number, required = false) => (v === undefined && !required) || (typeof v === "string" && v.length <= max && (!required || v.trim().length > 0) && !hasScriptUrl(v));

/**
 * 엄격 검증: 구조·키 이름·길이·값 범위·IPv4·스크립트 URL을 모두 본다. 하나라도 어긋나면 아무것도 쓰지 않고 오류.
 * 통과하면 정리된 백업을 돌려준다.
 */
export function validateBackup(json: string): Backup {
  if (typeof json !== "string" || json.length > MAX_JSON) fail();
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error(tr("bk.notJson"));
  }
  if (!isObj(data) || data.kind !== BACKUP_KIND) throw new Error(tr("bk.notOurs"));
  if (!onlyKeys(data, ROOT_KEYS) || data.version !== BACKUP_VERSION) fail();
  if (!str(data.exportedAt, 40) || (typeof data.exportedAt === "string" && Number.isNaN(Date.parse(data.exportedAt)))) fail();
  const printersIn = data.printers ?? [];
  const subnetsIn = data.learnedSubnets ?? [];
  const presetsIn = data.presets ?? [];
  if (!Array.isArray(printersIn) || printersIn.length > 24 || !Array.isArray(subnetsIn) || subnetsIn.length > 4 || !Array.isArray(presetsIn) || presetsIn.length > 3) fail();
  for (const p of printersIn) {
    if (!isObj(p) || !onlyKeys(p, PRINTER_KEYS)) fail();
    if (!str(p.uid, 80, true) || !str(p.title, 80, true) || !str(p.query, 80) || !str(p.via, 20) || !str(p.alias, 30)) fail();
    if (p.savedAt !== undefined && (typeof p.savedAt !== "number" || !Number.isFinite(p.savedAt) || p.savedAt < 0)) fail();
    if (p.host !== undefined && !cleanIPv4(p.host)) fail();
    if (p.link !== undefined && p.link !== "wifi" && p.link !== "usb" && p.link !== "helper") fail();
  }
  if (!subnetsIn.every((v) => typeof v === "string" && SUBNET.test(v))) fail();
  if (data.subnet !== undefined && data.subnet !== "" && !(typeof data.subnet === "string" && SUBNET.test(data.subnet))) fail();
  for (const p of presetsIn) {
    if (!isObj(p) || !onlyKeys(p, PRESET_KEYS) || !str(p.id, 40, true) || !str(p.label, 12) || !isObj(p.settings) || !onlyKeys(p.settings, SETTING_KEYS)) fail();
    const st = p.settings;
    if (typeof st.gray !== "boolean" || typeof st.secure !== "boolean" || !["simplex", "long", "short"].includes(String(st.duplex)) || ![1, 2, 4].includes(Number(st.nup)) || typeof st.nup !== "number" || !["normal", "narrow", "none"].includes(String(st.margin))) fail();
  }
  if (data.lang !== undefined && !isLang(data.lang)) fail();
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: String(data.exportedAt ?? ""),
    printers: printersIn.map(cleanPrinter).filter((p): p is BackupPrinter => Boolean(p)),
    learnedSubnets: subnetsIn as string[],
    subnet: typeof data.subnet === "string" ? data.subnet : "",
    presets: presetsIn.map(cleanPreset).filter((p): p is BackupPreset => Boolean(p)),
    ...(isLang(data.lang) ? { lang: data.lang } : {}),
  };
}

/**
 * 백업 JSON을 엄격히 검사한 뒤 합친다(같은 프린터는 백업 값으로 갱신). 돌려주는 값: 복원된 개수.
 * 검사를 통과하지 못하면 저장소를 한 글자도 바꾸지 않는다. 쓰는 도중 실패하면 원래 값으로 되돌린다.
 */
export function restoreBackup(json: string, store: Store) {
  const b = validateBackup(json);
  const printers = b.printers;
  const persisted = (read(store, KEYS.printers) as { state?: { saved?: unknown[] }; version?: number } | null) || {};
  const current = (Array.isArray(persisted.state?.saved) ? persisted.state.saved : []).map(cleanPrinter).filter((p): p is BackupPrinter => Boolean(p));
  const merged = [...printers, ...current.filter((c) => !printers.some((p) => p.uid === c.uid))].slice(0, 24);
  const learnedOld = read(store, KEYS.learned);
  const learned = [...new Set([...b.learnedSubnets, ...(Array.isArray(learnedOld) ? learnedOld.filter((s): s is string => typeof s === "string" && SUBNET.test(s)) : [])])].slice(0, 4);
  const oldPresets = read(store, KEYS.presets);
  const mergedPresets = [...b.presets, ...(Array.isArray(oldPresets) ? oldPresets.map(cleanPreset).filter((p): p is BackupPreset => Boolean(p)) : []).filter((o) => !b.presets.some((p) => p.id === o.id))].slice(0, 3);
  const writes: [string, string][] = [
    [KEYS.printers, JSON.stringify({ ...persisted, state: { ...(persisted.state || {}), saved: merged }, version: persisted.version ?? 0 })],
    [KEYS.learned, JSON.stringify(learned)],
    [KEYS.presets, JSON.stringify(mergedPresets)],
  ];
  if (b.subnet) writes.push([KEYS.subnet, b.subnet]);
  if (b.lang) writes.push([KEYS.lang, b.lang]);
  const before = writes.map(([key]) => [key, store.getItem(key)] as const);
  try {
    for (const [key, value] of writes) store.setItem(key, value);
  } catch {
    for (const [key, value] of before) {
      try {
        if (value === null) store.removeItem?.(key);
        else store.setItem(key, value);
      } catch {
        /* 되돌리기도 실패하면 더 할 수 있는 게 없다 */
      }
    }
    throw new Error(tr("bk.writeFail"));
  }
  return { printers: printers.length, subnets: b.learnedSubnets.length, presets: b.presets.length, ...(b.lang ? { lang: b.lang } : {}) };
}
