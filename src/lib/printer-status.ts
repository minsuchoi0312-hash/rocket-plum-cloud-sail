/**
 * 복사기 실제 상태(준비·용지·걸림·토너·지원 기능) — PC 도우미 GET /status 결과와 USB 장치 정보를 같은 모양으로.
 * capabilities의 null은 '확인 못 함'(false = 확인했는데 없음).
 */
import { tr, type MsgKey } from "./i18n/core.ts";
import { cleanText } from "./sanitize.ts";

export type PrinterState = "ready" | "busy" | "warning" | "error" | "unknown";

export type PrinterStatus = {
  ok: boolean;
  ip: string;
  state: PrinterState;
  summary: string;
  reasons: string[];
  toners: { name: string; level: number | null; color: string }[];
  capabilities: {
    pdfDirect: boolean | null;
    pcl5: boolean | null;
    duplex: boolean | null;
    color: boolean | null;
    raw9100: boolean;
    ipp631: boolean;
    webAdmin: boolean;
  };
  latencyMs: number;
  checkedAt: string;
  model?: string;
  display?: string;
  pjlCode?: string;
  /** usb: GET_DEVICE_ID 기반 */
  source?: "helper" | "usb";
  iface?: string;
};

/* IPP printer-state-reasons(RFC 8011 · PWG 5100.9) + PJL 에서 오는 사유 — 사전(reason.*)에 있는 것만 */
const REASONS = [
  "media-empty", "media-jam", "media-low", "media-needed", "toner-low", "toner-empty", "cover-open", "door-open",
  "input-tray-missing", "output-tray-missing", "output-area-full", "output-area-almost-full",
  "marker-supply-low", "marker-supply-empty", "marker-waste-almost-full", "marker-waste-full",
  "developer-low", "developer-empty", "opc-near-eol", "opc-life-over", "fuser-over-temp", "fuser-under-temp",
  "paused", "moving-to-paused", "stopping", "stopped-partly", "shutdown", "offline", "timed-out", "connecting-to-device",
  "warming-up", "power-save", "processing", "attention", "spool-area-full", "interpreter-resource-unavailable",
  "identify-printer-requested", "printer-error", "hardware-error", "other",
] as const;

/** 상태 사유를 지금 언어로. -report · -warning · -error 꼬리는 떼고 보고, 모르는 사유는 원래 값 그대로 */
export function reasonLabel(reason: string) {
  const base = reason.replace(/-(report|warning|error)$/, "");
  if ((REASONS as readonly string[]).includes(base)) return tr(`reason.${base}` as MsgKey);
  return (REASONS as readonly string[]).includes(reason) ? tr(`reason.${reason}` as MsgKey) : reason;
}

/* 복사기 화면(PJL DISPLAY)의 흔한 영어 문구 → 사유·화면 사전. 모르는 문구(모델 고유 문구)는 그대로 둔다 */
const DISPLAY: [RegExp, MsgKey][] = [
  [/^warming ?up/i, "reason.warming-up"],
  [/^(sleep|sleep mode|power ?sav(e|ing)|energy ?sav(e|er|ing)|low power)/i, "reason.power-save"],
  [/^(processing|printing|busy|processing job)/i, "reason.processing"],
  [/(load|add|out of|no) paper|paper (out|empty)|tray \d+ empty/i, "reason.media-empty"],
  [/paper ?jam|^jam/i, "reason.media-jam"],
  [/toner (is )?low|low toner/i, "reason.toner-low"],
  [/toner (empty|out)|replace toner/i, "reason.toner-empty"],
  [/(cover|door) (is )?open/i, "reason.cover-open"],
  [/^off ?line/i, "reason.offline"],
  [/^paused?/i, "reason.paused"],
  [/^initiali[sz]ing/i, "disp.init"],
  [/^cancel+ing/i, "disp.cancel"],
  [/^cooling/i, "disp.cool"],
  [/^(data received|receiving data)/i, "disp.data"],
];

/** 복사기 화면 문구를 지금 언어로 (모르면 원문) */
export function displayLabel(text: string) {
  const clean = text.trim();
  const hit = DISPLAY.find(([re]) => re.test(clean));
  return hit ? tr(hit[1]) : clean;
}

/** 요약 문구는 도우미가 보낸 한국어 대신 상태·사유로 다시 만들어 지금 언어를 따르게 해요. */
export function statusSummary(status: PrinterStatus): string {
  if (status.source === "usb") return tr(status.state === "error" ? "st.usbGone" : status.state === "ready" ? "st.usbOk" : "st.usbUnknown");
  /* '기타(other)'는 뜻이 없어 요약 배지에서는 빼고 아래 칩으로만 보여 준다 */
  const list = status.reasons.filter((r) => r.replace(/-(report|warning|error)$/, "") !== "other").map(reasonLabel).join(", ");
  if (status.state === "ready") return tr("st.ready");
  if (status.state === "busy") return tr(status.reasons.includes("warming-up") ? "st.busyWarm" : "st.busy");
  if (status.state === "warning") return list ? tr("st.warnList", { list }) : tr("st.warn");
  if (status.state === "error") return list ? tr("st.errList", { list }) : tr("st.err");
  return tr(status.capabilities.raw9100 || status.capabilities.ipp631 ? "st.unknownReply" : "st.unknown");
}

/** USB 인터페이스 표시 */
export function ifaceLabel(status: PrinterStatus) {
  return tr(status.state === "error" ? "st.ifaceOff" : "st.ifaceOn");
}

const TONER_COLOR: [RegExp, MsgKey][] = [
  [/^(black|bk|k|검정|블랙)$/i, "toner.k"],
  [/^(cyan|c|청|파랑|시안)$/i, "toner.c"],
  [/^(magenta|m|적|빨강|마젠타)$/i, "toner.m"],
  [/^(yellow|y|황|노랑|옐로)$/i, "toner.y"],
];

/** 복사기가 보낸 소모품 이름을 지금 언어로. 알 수 없는 이름(모델명 등)은 그대로 둬요. */
export function tonerLabel(name: string) {
  const clean = name.trim();
  if (/waste/i.test(clean) || /폐토너/.test(clean)) return tr("toner.waste");
  if (/^drum( unit)?$/i.test(clean)) return tr("toner.drum");
  const color = clean
    .replace(/\s*(toner|cartridge|토너)(\s*cartridge)?\s*$/i, "")
    .replace(/\s*\(?\b[KCMY]\b\)?$/, "")
    .trim();
  if (color === clean && !/^(black|cyan|magenta|yellow)$/i.test(clean)) return clean;
  const hit = TONER_COLOR.find(([re]) => re.test(color));
  return hit ? tr(hit[1]) : clean;
}

export function stateBadge(status: PrinterStatus | null): { tone: "ok" | "warn" | "bad" | "idle"; label: string } {
  if (!status) return { tone: "idle", label: tr("st.unknown") };
  const label = statusSummary(status);
  if (status.state === "ready" || status.state === "busy") return { tone: "ok", label };
  if (status.state === "warning") return { tone: "warn", label };
  if (status.state === "error") return { tone: "bad", label };
  return { tone: "idle", label };
}

/** PC 도우미로 읽기 전용 상태 조회 */
export async function fetchPrinterStatus(base: string, code: string, ip: string, signal?: AbortSignal, pjl = true): Promise<PrinterStatus> {
  const root = base.replace(/\/$/, "");
  const response = await fetch(`${root}/status?ip=${encodeURIComponent(ip)}${pjl ? "" : "&pjl=0"}`, { headers: code ? { "X-Helper-Code": code } : {}, signal });
  if (response.status === 401) throw new Error(tr("st.err401"));
  if (response.status === 404) throw new Error(tr("st.err404"));
  if (!response.ok) throw new Error(tr("st.errHttp", { code: response.status }));
  return { ...cleanStatus((await response.json()) as PrinterStatus), source: "helper" };
}

const STATES = new Set(["ready", "busy", "warning", "error", "unknown"]);
const pct = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : null);

/** 복사기가 보낸 글(모델명·화면 문구·토너 이름·사유)은 제어 문자·ESC를 걷어 내고 길이를 제한한다 */
export function cleanStatus(raw: PrinterStatus): PrinterStatus {
  const caps = (raw?.capabilities ?? {}) as Partial<PrinterStatus["capabilities"]>;
  const tri = (v: unknown) => (typeof v === "boolean" ? v : null);
  return {
    ...raw,
    ok: Boolean(raw?.ok),
    ip: cleanText(raw?.ip, 15),
    state: STATES.has(String(raw?.state)) ? raw.state : "unknown",
    summary: cleanText(raw?.summary, 80),
    reasons: (Array.isArray(raw?.reasons) ? raw.reasons : []).map((r) => cleanText(r, 40).replace(/[^a-z0-9-]/gi, "")).filter(Boolean).slice(0, 12),
    toners: (Array.isArray(raw?.toners) ? raw.toners : []).slice(0, 12).map((t) => ({ name: cleanText(t?.name, 40) || "?", level: pct(t?.level), color: /^#[0-9a-f]{6}$/i.test(String(t?.color)) ? String(t.color) : "" })),
    capabilities: { pdfDirect: tri(caps.pdfDirect), pcl5: tri(caps.pcl5), duplex: tri(caps.duplex), color: tri(caps.color), raw9100: Boolean(caps.raw9100), ipp631: Boolean(caps.ipp631), webAdmin: Boolean(caps.webAdmin) },
    latencyMs: typeof raw?.latencyMs === "number" ? Math.max(0, Math.round(raw.latencyMs)) : 0,
    checkedAt: cleanText(raw?.checkedAt, 40),
    model: cleanText(raw?.model, 80) || undefined,
    display: cleanText(raw?.display, 60) || undefined,
    pjlCode: cleanText(raw?.pjlCode, 10) || undefined,
  };
}

/** USB: GET_DEVICE_ID의 CMD(지원 언어)로 같은 카드 형식을 만든다 */
export function usbStatus(cmd: string, live: boolean, title: string): PrinterStatus {
  const langs = cmd.toUpperCase();
  const known = langs.length > 0;
  return {
    ok: true,
    ip: "",
    state: live ? (known ? "ready" : "unknown") : "error",
    summary: tr(live ? (known ? "st.usbOk" : "st.usbUnknown") : "st.usbGone"),
    reasons: live ? [] : ["offline"],
    toners: [],
    capabilities: {
      pdfDirect: known ? /\bPDF\b/.test(langs) : null,
      pcl5: known ? /PCL\s*5|PCL5E|PCL5C|\bPCL\b(?!\s*XL|6)/.test(langs) : null,
      duplex: null,
      color: null,
      raw9100: false,
      ipp631: false,
      webAdmin: false,
    },
    latencyMs: 0,
    checkedAt: new Date().toISOString(),
    model: title,
    source: "usb",
    iface: tr(live ? "st.ifaceOn" : "st.ifaceOff"),
  };
}
