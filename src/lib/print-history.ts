/**
 * 최근 인쇄 기록 — 이 브라우저(localStorage)에만 남는다.
 * 파일명·종류·쪽수·프린터·시각만 저장하고, 문서 내용·메모 본문·PIN은 절대 저장하지 않는다.
 */
import { tr, type MsgKey } from "./i18n/core.ts";

export type HistoryKind = "pdf" | "photo" | "memo" | "test";

export type PrintRecord = {
  name: string;
  kind: HistoryKind;
  pages: number;
  printer: string;
  route: string;
  at: number;
};

const KEY = "nuguna-print-history";

/** SSR(서버 렌더) 단계에서는 저장소에 손대지 않는다 */
function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
const LIMIT = 10;

function clean(text: string, max: number) {
  // 기록에 남길 글에서 제어 문자를 걸러 내는 것이 목적이라 규칙을 끈다
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
}

export function loadHistory(): PrintRecord[] {
  try {
    const raw = store()?.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is PrintRecord => Boolean(row) && typeof row === "object" && typeof (row as PrintRecord).name === "string" && typeof (row as PrintRecord).at === "number")
      .slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function addHistory(record: PrintRecord): PrintRecord[] {
  /* 허용한 필드만 골라 담는다: 다른 값이 섞여 들어와도 저장되지 않는다. */
  const safe: PrintRecord = {
    name: clean(record.name, 80) || tr("hist.doc"),
    kind: record.kind,
    pages: Math.max(0, Math.min(9999, Math.round(record.pages) || 0)),
    printer: clean(record.printer, 60),
    route: clean(record.route, 30),
    at: record.at,
  };
  const next = [safe, ...loadHistory()].slice(0, LIMIT);
  try {
    store()?.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장소가 막혀 있어도 인쇄는 계속한다 */
  }
  return next;
}

export function clearHistory() {
  try {
    store()?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

const KIND_KEY: Record<HistoryKind, MsgKey> = { pdf: "hist.pdf", photo: "hist.photo", memo: "hist.memo", test: "hist.test" };

/** 인쇄 경로는 언어와 무관한 코드로 저장하고 보여 줄 때 번역한다. 예전 버전이 저장한 한국어 이름도 알아본다. */
const ROUTE_KEY: Record<string, MsgKey> = { ipp: "ap.routeIpp", "와이파이 IPP": "ap.routeIpp", helper9100: "ap.viaHelper9100", "PC 도우미 9100": "ap.viaHelper9100" };
const ROUTE_FIXED: Record<string, string> = { "usb-pdf": "USB PDF Direct", "usb-pcl": "USB PCL5e" };

export function historyRouteLabel(route: string) {
  const key = ROUTE_KEY[route];
  return key ? tr(key) : ROUTE_FIXED[route] ?? route;
}

export function historyKindLabel(kind: HistoryKind) {
  return tr(KIND_KEY[kind] ?? "hist.doc");
}

export function historyTime(at: number) {
  const date = new Date(at);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
