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

const REASONS = ["media-empty", "media-jam", "toner-low", "toner-empty", "cover-open", "input-tray-missing", "output-area-full", "paused", "offline", "warming-up", "attention", "printer-error", "hardware-error"] as const;

/** 상태 사유를 지금 언어로. 모르는 사유는 원래 값 그대로 */
export function reasonLabel(reason: string) {
  return (REASONS as readonly string[]).includes(reason) ? tr(`reason.${reason}` as MsgKey) : reason;
}

/** 요약 문구는 도우미가 보낸 한국어 대신 상태·사유로 다시 만들어 지금 언어를 따르게 해요. */
export function statusSummary(status: PrinterStatus): string {
  if (status.source === "usb") return tr(status.state === "error" ? "st.usbGone" : status.state === "ready" ? "st.usbOk" : "st.usbUnknown");
  const list = status.reasons.map(reasonLabel).join(", ");
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
