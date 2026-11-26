/**
 * 인쇄 팩 — 프린터마다 필요한 "말(인쇄 언어)"이 달라서, 찾은 프린터에 맞는 팩을 한 번 설치한 뒤 인쇄한다.
 * 팩은 앱 안에 들어 있고(인터넷 없이 설치), 설치하면 그 팩의 기종 표를 기기에 풀어 두고 켠다.
 *  - standard : IPP Everywhere · AirPrint · Mopria (기본 포함, 설치 필요 없음)
 *  - laser    : PCL 5e · PDF 직접 (9100) — 사무실 레이저 · 복합기
 *  - epson    : ESC/P-R (9100) — 엡손 잉크젯, 컬러 가능 (src/lib/escpr.ts)
 *  - spl      : 삼성 SPL/QPDL (9100) — 삼성 · 제록스 GDI 레이저, 흑백 (src/lib/spl.ts)
 *  - inkjet   : HP 잉크젯 PCL3 (9100) — DeskJet · OfficeJet · Business Inkjet, 컬러 (src/lib/pcl3.ts)
 *               옛 엡손 Stylus(ESC/P2) 등 그 밖의 잉크젯은 아직 준비 중
 *  - canon    : 캐논 PIXMA 래스터 (BJNP 8611) — AirPrint 없는 2008~2012년 네트워크 PIXMA, 컬러 (src/lib/canon.ts)
 *               표에 없는 캐논 잉크젯은 아직 준비 중
 */
import type { MsgKey } from "./i18n/core.ts";
import { DRIVER_ROWS } from "./driver-pack.ts";
import { lookupDriver, type DriverFamily } from "./drivers.ts";
import { splProfile } from "./spl.ts";
import { pcl3Profile } from "./pcl3.ts";
import { canonProfile } from "./canon.ts";

export type PackId = "standard" | "laser" | "epson" | "spl" | "inkjet" | "canon";

export type PackDef = {
  id: PackId;
  name: MsgKey;
  sub: MsgKey;
  version: string;
  /** 지금 앱이 이 팩으로 실제 인쇄할 수 있는지 */
  ready: boolean;
  /** 설치 없이 들어 있는 팩 */
  builtin: boolean;
  /** 인쇄 경로: ipp = 631 IPP, raw = 9100 (PCL 5e · PDF 직접), escpr = 9100 (엡손 ESC/P-R) */
  route: "ipp" | "raw" | "escpr" | "spl" | "pcl3" | "bjnp" | null;
  families: DriverFamily[];
  /** 기종 표에서 고를 행 (families 안에서 한 번 더 거른다) */
  pick?: RegExp;
};

export const PACKS: Record<PackId, PackDef> = {
  standard: { id: "standard", name: "pk.standard", sub: "pk.standardSub", version: "2.0", ready: true, builtin: true, route: "ipp", families: [] },
  laser: { id: "laser", name: "pk.laser", sub: "pk.laserSub", version: "1.4", ready: true, builtin: false, route: "raw", families: ["hplip", "gutenprint", "splix"], pick: /pcl|laserjet|postscript|ps\b|hp |kyocera|ricoh|sindoh|xerox|lexmark|brother hl|brother mfc-l|brother dcp-l|samsung (m|c|sl|clx|ml)/i },
  epson: { id: "epson", name: "pk.epson", sub: "pk.epsonSub", version: "1.7", ready: true, builtin: false, route: "escpr", families: ["escpr"] },
  spl: { id: "spl", name: "pk.spl", sub: "pk.splSub", version: "2.0", ready: true, builtin: false, route: "spl", families: ["splix"] },
  inkjet: { id: "inkjet", name: "pk.inkjet", sub: "pk.inkjetSub", version: "5.3", ready: true, builtin: false, route: "pcl3", families: ["hplip", "gutenprint"], pick: /deskjet|officejet|photosmart|business inkjet|\bpsc\b/i },
  canon: { id: "canon", name: "pk.canon", sub: "pk.canonSub", version: "1.0", ready: true, builtin: false, route: "bjnp", families: ["gutenprint"], pick: /canon.*\b(mx|mp|mg|ip)\s?-?\d/i },
};

/** 검색이 알려 준 프린터 정보 */
export type PackInput = { model: string; cmd?: string; ipp?: boolean; raw9100?: boolean; canon?: boolean };

export type PackChoice = {
  /** 이 프린터에 맞는 팩 */
  need: PackDef;
  /** need 가 준비 중일 때 대신 보낼 팩 (없으면 null) */
  fallback: PackDef | null;
  /** 기종 표에서 찾은 이름 */
  matched: string;
};

const PCL_LANGS = /pcl|pjl|postscript|vnd\.hp-pcl|application\/pdf|(^|,)\s*pdf\s*(,|$)|(^|,)\s*ps\s*(,|$)/i;
const DRIVERLESS = /application\/pdf|image\/urf|image\/pwg-raster|(^|,)\s*urf\s*(,|$)|pwg/i;

/** 찾은 프린터에 어떤 팩이 필요한지 (PrinterShare처럼 모델명 → 기종 표 → 팩) */
export function packFor(input: PackInput): PackChoice {
  const langs = (input.cmd || "").toLowerCase();
  const hit = input.model ? lookupDriver(input.model) : null;
  const family = hit?.family;
  const pclKnown = PCL_LANGS.test(langs);
  const wrap = (need: PackDef): PackChoice => ({
    need,
    fallback: need.ready ? null : input.ipp ? PACKS.standard : input.raw9100 && pclKnown ? PACKS.laser : null,
    matched: hit?.name || "",
  });
  /* 잉크젯 이름(엡손 · 캐논 · HP 등) — IPP 가 PDF 를 받는다고 레이저로 오인하지 않게 레이저 판정보다 먼저 본다 */
  const inkjetName = /stylus|pixma|maxify|selphy|\bbjc?\b|inkjet|deskjet|officejet|envy|smart tank|ink tank|photosmart|artisan|ecotank|workforce|expression/i.test(input.model);
  const driverless = Boolean(input.ipp && DRIVERLESS.test(langs));
  /* 0) HP 잉크젯: 드라이버 없이 받는 신형(IPP)은 표준 팩, 9100 만 열린 기종은 잉크젯 팩(PCL3 컬러) */
  if (pcl3Profile(input.model)) {
    if (driverless) return wrap(PACKS.standard);
    if (input.raw9100) return wrap(PACKS.inkjet);
    if (input.ipp) return wrap(PACKS.standard);
  }
  /* 1) 삼성 SPL: 9100 이 열려 있고 0x11 압축 기종이면 SPL 팩, 0x0D · JBIG · 컬러 기종은 아직(대신 보낼 길을 권한다) */
  if (family === "splix" || /\bGDI\b|QPDL|\bSPL\b/i.test(langs)) {
    if (input.raw9100 && splProfile(input.model)) return wrap(PACKS.spl);
    return wrap({ ...PACKS.spl, ready: false, route: null });
  }
  /* 2) 엡손: 1284 CMD 에 ESCPR 이 있거나 기종 표 · 이름이 엡손이면 엡손 잉크 팩.
        옛 Stylus 처럼 ESC/P-R 를 모르는 엡손(기종 표가 gutenprint)은 아래 4) 로 */
  const epson = family === "escpr" || /escpr/i.test(langs) || (/epson/i.test(input.model) && family !== "gutenprint" && !/aculaser|\bal-|actionlaser/i.test(input.model));
  if (epson && input.raw9100) return wrap(PACKS.epson);
  if (epson) return wrap(input.ipp ? PACKS.standard : PACKS.epson);
  /* 3) 캐논 잉크젯(BJNP 로 찾았거나 PIXMA 등): 신형은 표준 팩, 아니면 캐논 팩(준비 중) */
  if (input.canon || canonProfile(input.model) || (/canon/i.test(input.model) && inkjetName)) {
    if (driverless) return wrap(PACKS.standard);
    return wrap(canonProfile(input.model) ? PACKS.canon : { ...PACKS.canon, ready: false, route: null });
  }
  /* 4) 그 밖의 옛 잉크젯(gutenprint 표): 신형 IPP 면 표준 팩, 아니면 잉크젯 팩(준비 중) */
  if (inkjetName) return wrap(driverless ? PACKS.standard : { ...PACKS.inkjet, ready: false, route: null });
  /* 5) 9100이 열려 있고 PCL · PDF 를 말하는 레이저 = 레이저 팩 */
  if (input.raw9100 && (pclKnown || family === "hplip")) return wrap(PACKS.laser);
  /* 6) 드라이버 없이 말하는 신형(IPP) */
  if (input.ipp) return wrap(PACKS.standard);
  /* 7) 모르는 9100 기기(gutenprint 표의 교세라 · 리코 · 제록스 레이저 등): 범용 PCL 로 */
  if (input.raw9100) return wrap(PACKS.laser);
  return wrap(PACKS.standard);
}

/**
 * 레이저 팩으로 보낼 때 쓰는 인쇄 언어(USB 장치 ID 형식: "PCL5e,PDF").
 * 검색은 "application/pdf, application/vnd.hp-pcl" 같은 IPP 형식으로 알려 주므로 바꿔 준다.
 * 레이저 팩은 PCL 5e 래스터를 보내므로 늘 PCL5e 를 넣고, PDF 를 말하면 PDF 직접도 켠다.
 */
export function laserCmd(cmd?: string) {
  const text = (cmd || "").toLowerCase();
  const pdf = !text || /application\/pdf|(^|,)\s*pdf\s*(,|$)/.test(text);
  return pdf ? "PCL5e,PDF" : "PCL5e";
}

/* ───────── 설치 상태 ───────── */
const KEY = "nuguna-packs";
const TABLE = (id: PackId) => `nuguna-pack-${id}`;

type Installed = Partial<Record<PackId, { version: string; at: number; models: number }>>;

function load(): Installed {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") as unknown;
    return raw && typeof raw === "object" ? (raw as Installed) : {};
  } catch {
    return {};
  }
}

export function packInstalled(id: PackId): boolean {
  const def = PACKS[id];
  if (def.builtin) return true;
  const row = load()[id];
  return Boolean(row && row.version === def.version);
}

/** 팩에 들어 있는 기종 행 */
function packRows(def: PackDef): string[] {
  if (!def.families.length) return [];
  return DRIVER_ROWS.filter((row) => {
    const tab = row.indexOf("\t");
    const family = row.slice(0, tab) as DriverFamily;
    return def.families.includes(family) && (!def.pick || def.pick.test(row.slice(tab + 1)));
  });
}

/** 팩 정보: 기종 수와 크기(KB) */
export function packInfo(id: PackId) {
  const rows = packRows(PACKS[id]);
  const bytes = rows.reduce((sum, row) => sum + row.length + 1, 0);
  return { models: rows.length, kb: Math.max(1, Math.round(bytes / 1024)) };
}

const frame = () => new Promise<void>((resolve) => (typeof requestAnimationFrame === "function" ? requestAnimationFrame(() => resolve()) : setTimeout(resolve, 16)));

/** 팩 설치: 기종 표를 기기에 풀어 두고 켠다. onProgress(0~100) */
export async function installPack(id: PackId, onProgress?: (percent: number) => void): Promise<{ models: number }> {
  const def = PACKS[id];
  if (!def.ready) throw new Error("pack not ready");
  if (def.builtin) {
    onProgress?.(100);
    return { models: 0 };
  }
  const rows = packRows(def);
  const out: string[] = [];
  const step = Math.max(40, Math.ceil(rows.length / 30));
  onProgress?.(0);
  for (let i = 0; i < rows.length; i += step) {
    out.push(...rows.slice(i, i + step).map((row) => row.slice(row.indexOf("\t") + 1)));
    onProgress?.(Math.min(95, Math.round(((i + step) / Math.max(1, rows.length)) * 95)));
    await frame();
  }
  localStorage.setItem(TABLE(id), JSON.stringify(out));
  const next = load();
  next[id] = { version: def.version, at: Date.now(), models: out.length };
  localStorage.setItem(KEY, JSON.stringify(next));
  onProgress?.(100);
  return { models: out.length };
}

/** 설치된 팩 목록 (설정 · 자가진단용) */
export function installedPacks(): { id: PackId; version: string; models: number }[] {
  const rows = load();
  return (Object.keys(rows) as PackId[]).filter((id) => PACKS[id] && packInstalled(id)).map((id) => ({ id, version: rows[id]!.version, models: rows[id]!.models }));
}

export function removePack(id: PackId) {
  const next = load();
  delete next[id];
  localStorage.setItem(KEY, JSON.stringify(next));
  localStorage.removeItem(TABLE(id));
}
