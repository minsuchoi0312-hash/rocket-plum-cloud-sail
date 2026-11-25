import { DRIVER_COUNT, DRIVER_ROWS } from "./driver-pack.ts";

export type DriverFamily = "escpr" | "hplip" | "splix" | "gutenprint";

export type DriverHit = {
  name: string;
  family: DriverFamily;
  exact: boolean;
};

type Row = { key: string; name: string; family: DriverFamily; codes: string[] };

const FOLD: [RegExp, string][] = [
  [/엡손/g, "epson"],
  [/캐논/g, "canon"],
  [/브라더/g, "brother"],
  [/삼성/g, "samsung"],
  [/제록스|후지제록스/g, "xerox"],
  [/교세라/g, "kyocera"],
  [/리코/g, "ricoh"],
  [/신도리코|신도/g, "sindoh"],
  [/팬텀/g, "pantum"],
  [/렉스마크/g, "lexmark"],
  [/오키/g, "oki"],
  [/델/g, "dell"],
  [/레이저젯/g, "laserjet"],
  [/에코탱크/g, "ecotank"],
  [/픽스마/g, "pixma"],
];

const BRANDS = ["epson", "canon", "brother", "samsung", "xerox", "hp", "kyocera", "ricoh", "oki", "lexmark", "dell", "apollo", "kodak", "panasonic", "sindoh", "pantum"];

function fold(value: string) {
  let text = value.toLowerCase();
  for (const [pattern, to] of FOLD) text = text.replace(pattern, to);
  return text;
}

export function driverKey(value: string) {
  return fold(value)
    .replace(/프린터|시리즈|series|printer/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function codesOf(key: string) {
  const found = new Set<string>();
  const brands = /^(epson|canon|brother|samsung|xerox|kyocera|ricoh|lexmark|pantum|sindoh|dell|oki|hp|apollo)$/;
  for (const match of key.matchAll(/([a-z]{0,8})(\d{2,5})([a-z]{0,3})/g)) {
    const letters = match[1] || "";
    const digits = match[2];
    const tail = match[3] || "";
    if (!letters && /^(19|20)\d{2}$/.test(digits)) continue;
    const full = `${letters}${digits}${tail}`;
    if (full.length >= 4) found.add(full);
    if (letters.length > 1 && brands.test(letters.slice(0, -1))) {
      const short = `${letters.slice(-1)}${digits}${tail}`;
      if (short.length >= 5) found.add(short);
    }
  }
  return [...found];
}

function stemOf(key: string) {
  const tagged = key.match(/(et|xp|wf|sx|hl|ml|mfc|dcp|mg|mx|ts|tr|clp|scx|clx|fs|bp|ql|lbp|ip|gx|tm|zd)\d/);
  if (tagged) return tagged[1];
  if (/(^|epson)l\d{3,4}/.test(key)) return "l";
  if (/(^|canon)g\d{3,4}/.test(key)) return "g";
  return "";
}

function agrees(queryKey: string, rowKey: string) {
  const stem = stemOf(queryKey);
  if (!stem) return true;
  if (stem === "l") return /(^|epson)l\d{3,4}/.test(rowKey);
  if (stem === "g") return /(^|canon|pixma)g\d{3,4}/.test(rowKey);
  return rowKey.includes(stem);
}

const ROWS: Row[] = [];
const BY_KEY = new Map<string, Row>();
const BY_CODE = new Map<string, Row[]>();

for (const line of DRIVER_ROWS) {
  const [family, name, extra] = line.split("\t");
  const names = [name, ...(extra ? extra.split("|") : [])];
  for (const label of names) {
    const key = driverKey(label);
    if (key.length < 5 || BY_KEY.has(key)) continue;
    const row: Row = { key, name, family: family as DriverFamily, codes: codesOf(key) };
    ROWS.push(row);
    BY_KEY.set(key, row);
    for (const code of row.codes) {
      const list = BY_CODE.get(code);
      if (list) list.push(row);
      else BY_CODE.set(code, [row]);
    }
  }
}

function brandIn(key: string) {
  return BRANDS.find((brand) => key.includes(brand)) || "";
}

function pickClosest(queryKey: string, rows: Row[]) {
  const brand = brandIn(queryKey);
  const branded = brand ? rows.filter((row) => row.key.includes(brand)) : rows;
  const pool = branded.length ? branded : rows;
  return pool.slice().sort((a, b) => Math.abs(a.key.length - queryKey.length) - Math.abs(b.key.length - queryKey.length))[0];
}

export function lookupDriver(input: string): DriverHit | null {
  const mdl = /(?:MDL|MODEL):([^;]+)/i.exec(input);
  const mfg = /(?:MFG|MANUFACTURER):([^;]+)/i.exec(input);
  const focused = mdl ? `${mfg ? mfg[1] : ""} ${mdl[1]}`.trim() : input;
  const key = driverKey(focused);
  if (!/\d/.test(key) || key.length < 4) return null;
  const exact = BY_KEY.get(key);
  if (exact) return { name: exact.name, family: exact.family, exact: true };

  let best: Row | null = null;
  for (const row of ROWS) {
    if (row.key.length < 5) continue;
    const contained = (key.includes(row.key) || (row.key.includes(key) && key.length >= 6)) && agrees(key, row.key);
    if (!contained) continue;
    if (!best || Math.abs(row.key.length - key.length) < Math.abs(best.key.length - key.length)) best = row;
  }
  if (best) return { name: best.name, family: best.family, exact: best.key === key };

  const codes = codesOf(key).sort((a, b) => b.length - a.length);
  for (const code of codes) {
    if (code.length < 5) continue;
    const rows = (BY_CODE.get(code) || []).filter((row) => row.codes.includes(code) && agrees(key, row.key));
    if (!rows.length) continue;
    const chosen = pickClosest(key, rows);
    return { name: chosen.name, family: chosen.family, exact: false };
  }
  return null;
}

export const driverCount = DRIVER_COUNT;

const FAMILY_LABEL: Record<DriverFamily, string> = {
  escpr: "ESC/P-R",
  hplip: "HPLIP",
  splix: "SpliX",
  gutenprint: "Gutenprint",
};

export function familyLabel(family: DriverFamily) {
  return FAMILY_LABEL[family];
}
