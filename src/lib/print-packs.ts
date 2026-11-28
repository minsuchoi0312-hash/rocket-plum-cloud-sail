/**
 * 인쇄 팩 — 프린터마다 필요한 "말(인쇄 언어)"이 달라서, 찾은 프린터에 맞는 팩을 한 번 설치한 뒤 인쇄한다.
 * 팩은 앱 안에 들어 있고(인터넷 없이 설치), 설치하면 그 팩의 기종 표를 기기에 풀어 두고 켠다.
 *  - standard : IPP Everywhere · AirPrint · Mopria (기본 포함, 설치 필요 없음)
 *               3.0 — 받는 형식을 물어 PDF · PWG 래스터 · URF · JPEG 로 (PDF 를 안 받는 가정용 잉크젯도)
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

/** vendor: 제조사 전용 방식(호스트 기반 · 승화형 · 도트 · 대형) — 앱이 직접 그릴 수 없어 IPP · 안드로이드 인쇄로 보낸다 */
export type PackId = "standard" | "laser" | "epson" | "spl" | "inkjet" | "canon" | "vendor";

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
  /* 3.0: 프린터에게 받는 형식을 물어 PDF · PWG 래스터 · URF(AirPrint) · JPEG 중 골라 보낸다 (ipp-raster.ts) */
  standard: { id: "standard", name: "pk.standard", sub: "pk.standardSub", version: "3.0", ready: true, builtin: true, route: "ipp", families: [] },
  /* 1.5: PostScript 를 말하는 복합기는 컬러로(PS · JPEG), 흑백은 PCL 5e */
  laser: { id: "laser", name: "pk.laser", sub: "pk.laserSub", version: "1.5", ready: true, builtin: false, route: "raw", families: ["hplip", "gutenprint", "splix"], pick: /pcl|laserjet|postscript|ps\b|hp |kyocera|ricoh|sindoh|xerox|lexmark|brother hl|brother mfc-l|brother dcp-l|samsung (m|c|sl|clx|ml)/i },
  epson: { id: "epson", name: "pk.epson", sub: "pk.epsonSub", version: "1.7", ready: true, builtin: false, route: "escpr", families: ["escpr"] },
  spl: { id: "spl", name: "pk.spl", sub: "pk.splSub", version: "2.0", ready: true, builtin: false, route: "spl", families: ["splix"] },
  inkjet: { id: "inkjet", name: "pk.inkjet", sub: "pk.inkjetSub", version: "5.3", ready: true, builtin: false, route: "pcl3", families: ["hplip", "gutenprint"], pick: /deskjet|officejet|photosmart|business inkjet|\bpsc\b/i },
  canon: { id: "canon", name: "pk.canon", sub: "pk.canonSub", version: "1.0", ready: true, builtin: false, route: "bjnp", families: ["gutenprint"], pick: /canon.*\b(mx|mp|mg|ip)\s?-?\d/i },
  vendor: { id: "vendor", name: "pk.vendor", sub: "pk.vendorSub", version: "-", ready: false, builtin: true, route: null, families: [] },
};

/**
 * 앱이 직접 그릴 수 없는 기기 부류 — PCL 을 보내면 쓰레기가 찍히거나 아무것도 안 나온다.
 *  host: 제조사 드라이버가 PC 에서 다 그려 보내는 레이저(HP ZjStream · XQX, 브라더 GDI) — foo2zjs · foo2xqx 지원 목록 기준
 *  dyesub: 승화형 사진 프린터(셀피 · 올림푸스 · 소니 · DNP · 미쓰비시 · 신코 · 코닥 · 시티즌 · HiTi)
 *  impact: 도트(충격식) 프린터(엡손 LQ · LX · FX · DFX · PLQ, 오키 Microline)
 *  wide: 대형 플로터(디자인젯 · 스타일러스 프로 · 슈어컬러)
 */
export function deviceClass(model: string): "host" | "dyesub" | "impact" | "wide" | null {
  const n = (model || "").toLowerCase();
  if (/designjet|stylus pro|surecolor|imageprograf|plotter/.test(n)) return "wide";
  if (/selphy|canon cp-?\d{3,4}\b|olympus p-|sony (up|dpp)|\bdnp\b|mitsubishi cp|shinko|kodak (305|605|1400|6800|6850|8500|8800|8810)\b|citizen c[xy]|hiti|fujifilm ask/.test(n)) return "dyesub";
  if (/epson (lq|lx|fx|dfx|plq|sq|dlq)-?\d|okidata ml|oki ml\d|microline|\bstar (nx|lc|sp)-?\d/.test(n)) return "impact";
  if (/laserjet (pro )?(1000|1005|1018|1020|p100[5-8]|p1505|m1005|m1120|m1319|p110[2-9]w?|cp1025(nw)?)\b|color laserjet (1600|2600n?|cp1215)\b/.test(n)) return "host";
  if (/brother (hl-?(1110|1112|1210w?|1212w?|2030|2035|2130|2135w?)|dcp-?(1510|1512|1610w?|1612w?|7055w?|7057)|mfc-?(1810|1910w?))\b/.test(n)) return "host";
  return null;
}

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
/** PDF 를 빼고 '레이저 언어'를 분명히 말할 때 — IPP 로 PDF 만 받는 잉크젯 · 호스트 기반 기기를 레이저로 오인하지 않게 */
const PCL_STRICT = /pcl|pjl|postscript|vnd\.hp-pcl|(^|,)\s*ps\s*(,|$)/i;
/** 호스트 기반(전용 드라이버) 언어 — PCL 을 보내면 쓰레기가 찍힌다: 캐논 UFR II · CAPT · LIPS, 각종 GDI, 브라더 · 미놀타 ZjStream, HP LIDIL */
const HOST_BASED = /\b(ufr|ufr2|ufrii|capt|lips|gdi|zjs|zjstream|lidil|ldl|brother\s*raster)\b/i;
const DRIVERLESS = /application\/pdf|image\/urf|image\/pwg-raster|(^|,)\s*urf\s*(,|$)|pwg/i;

/** 찾은 프린터에 어떤 팩이 필요한지 (PrinterShare처럼 모델명 → 기종 표 → 팩) */
export function packFor(input: PackInput): PackChoice {
  return choosePack(input, input.model ? lookupDriver(input.model) : null);
}

/** 결정 규칙 본체 — 기종 표 집계(packModels)도 같은 규칙을 쓴다 */
function choosePack(input: PackInput, hit: { name: string; family: DriverFamily } | null): PackChoice {
  const langs = (input.cmd || "").toLowerCase();
  const family = hit?.family;
  const pclKnown = PCL_LANGS.test(langs);
  const wrap = (need: PackDef): PackChoice => ({
    need,
    fallback: need.ready ? null : input.ipp ? PACKS.standard : input.raw9100 && pclKnown ? PACKS.laser : null,
    matched: hit?.name || "",
  });
  /* 잉크젯 이름(엡손 · 캐논 · HP 등) — IPP 가 PDF 를 받는다고 레이저로 오인하지 않게 레이저 판정보다 먼저 본다 */
  /* + 브라더 잉크젯(MFC-J · DCP-J · HL-J), 캐논 신형 잉크젯(TS · TR · G · GX · E · iX · iB · MB) */
  const inkjetName =
    /stylus|pixma|maxify|selphy|\bbjc?\b|inkjet|deskjet|officejet|envy|smart tank|ink tank|photosmart|artisan|ecotank|workforce|expression|\b(mfc|dcp|hl)-?j\d/i.test(input.model) ||
    /canon.*\b(ts|tr|gx|g|e|ix|ib|mb)\s?-?\d{3,4}/i.test(input.model);
  const pclStrict = PCL_STRICT.test(langs);
  const driverless = Boolean(input.ipp && DRIVERLESS.test(langs));
  /* 제조사 전용 방식 기기 — IPP 가 되면 표준 팩, 아니면 '전용 방식'(안드로이드 인쇄 · 제조사 서비스로).
     프린터가 레이저 언어(PCL · PostScript)를 분명히 말하면 그 말을 믿는다 */
  if (deviceClass(input.model) && !pclStrict) return wrap(input.ipp ? PACKS.standard : PACKS.vendor);
  /* 0) HP 잉크젯: 드라이버 없이 받는 신형(IPP)은 표준 팩, 9100 만 열린 기종은 잉크젯 팩(PCL3 컬러).
        LIDIL(LDL) 만 말하는 호스트 기반 DeskJet 은 PCL3 를 못 읽는다 → 아래 호스트 기반 처리로 */
  if (pcl3Profile(input.model) && !/\b(ldl|lidil)\b/i.test(langs)) {
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
  /* 3½) 호스트 기반 기기(UFR II · CAPT · LIPS · ZjStream · LIDIL 등, 레이저 언어를 따로 말하지 않을 때):
         PCL 을 보내면 쓰레기가 찍힌다 → IPP 가 되면 표준 팩, 안 되면 아직 */
  if (HOST_BASED.test(langs) && !pclStrict) return wrap(input.ipp ? PACKS.standard : PACKS.vendor);
  /* 4) 그 밖의 옛 잉크젯(gutenprint 표): 신형 IPP 면 표준 팩, 아니면 잉크젯 팩(준비 중) */
  if (inkjetName) return wrap(driverless ? PACKS.standard : { ...PACKS.inkjet, ready: false, route: null });
  /* 5) 9100이 열려 있고 PCL · PostScript 를 말하는 레이저 = 레이저 팩.
        PDF 만 말하면: IPP 가 되면 표준 팩(래스터까지 알아서), 9100 뿐이면 레이저 팩(PDF Direct) */
  if (input.raw9100 && (pclStrict || family === "hplip" || (pclKnown && !input.ipp))) return wrap(PACKS.laser);
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

/* ───────── 팩 = 앱에 들어 있는 인쇄 엔진 ─────────
   예전에는 '설치'(기종 표를 기기에 복사 + 진행 막대)를 거쳤지만, 실제 인쇄 코드는 늘 앱 안에 들어 있어 설치가 하는 일이 없었다.
   → 설치 단계를 없앴다. 준비된 팩은 바로 쓰고, 준비 중인 팩만 대신 보낼 길을 묻는다. */

let modelCounts: Partial<Record<PackId, number>> | null = null;

/**
 * 이 팩이 실제로 인쇄하는 기종 수 — 기종 표의 모든 행을 packFor 와 같은 규칙에 넣어(9100 만 열린 옛 기기라고 보고)
 * 그 팩이 '준비됨'으로 골라지는 것만 센다. 표에 있어도 이 앱이 못 뽑는 기종은 세지 않는다.
 */
export function packModels(id: PackId): number {
  if (!modelCounts) {
    const counts: Partial<Record<PackId, number>> = {};
    for (const row of DRIVER_ROWS) {
      const tab = row.indexOf("\t");
      const family = row.slice(0, tab) as DriverFamily;
      const name = row.slice(tab + 1).split("\t")[0];
      const choice = choosePack({ model: name, raw9100: true }, { name, family });
      if (choice.need.ready) counts[choice.need.id] = (counts[choice.need.id] || 0) + 1;
    }
    modelCounts = counts;
  }
  return modelCounts[id] || 0;
}

/** 예전 '설치'가 남긴 기기 저장값 지우기 (한 번) */
export function clearOldPackData() {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem("nuguna-packs");
    for (const id of Object.keys(PACKS)) localStorage.removeItem(`nuguna-pack-${id}`);
  } catch {
    /* 저장소를 못 쓰면 그대로 */
  }
}
