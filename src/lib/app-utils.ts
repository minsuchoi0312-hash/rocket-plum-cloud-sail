/**
 * 누구나프린트 앱 공용 타입·도우미 (atlas-app.tsx에서 분리).
 */
import { isAppText, msgText, tr, type Msg, type MsgKey } from "@/lib/i18n/core";
import { cleanText } from "@/lib/sanitize";
import { matchQuery, type MatchResult } from "@/lib/atlas";
import type { MarginMode } from "@/lib/compose-sheet";

export type Via = "saved" | "usb" | "wifi";
export type Step = "connect" | "confirm" | "print";
export type LinkTab = "wifi" | "usb" | "helper";
export type PageChip = "all" | "current" | "odd" | "even" | "custom";
export type ProbeState = { state: "checking" | "on" | "off"; ms?: number | null; via?: string };

export function marginLabel(mode: MarginMode) {
  return tr(mode === "normal" ? "mg.normal" : mode === "narrow" ? "mg.narrow" : "mg.none");
}

/**
 * 화면 미리보기용 blob 주소. canvasObjectUrl은 주소를 정리 목록에 바로 올려서
 * printSheet가 시작할 때 clearPrintRoot()로 먼저 폐기돼 버린다(이미지 깨짐).
 * 여기서는 등록하지 않고 넘기고, printSheet가 붙일 때 정리 목록에 올린다.
 */
export function blobUrl(canvas: HTMLCanvasElement, quality = 0.9) {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error(tr("err.makeImage")));
      else resolve(URL.createObjectURL(blob));
    }, "image/jpeg", quality);
  });
}


export type Found = {
  id: string;
  title: string;
  /** 번역 키(Msg)로 두면 언어를 바꿀 때 바로 다시 번역돼요 */
  subtitle: Msg;
  via: Via;
  query: string;
  cmd?: string;
  live?: boolean;
  usbKey?: string;
  host?: string;
  /** 검색이 확인한 포트 (앱 내장 도우미) — 모르면 undefined */
  ipp?: boolean;
  raw9100?: boolean;
  canon?: boolean;
};

export function viaLabel(via: Via) {
  return tr(via === "saved" ? "via.saved" : via === "usb" ? "via.usb" : "via.wifi");
}

/** discover.ts(원본 USB 엔진)가 만든 한국어 장치 이름·설명을 지금 언어로 바꿔 보여 줘요. */
export function deviceText(msg: Msg) {
  /* USB 장치 이름·복사기 응답에 섞인 제어 문자는 화면에 내지 않는다 */
  const text = cleanText(msgText(msg), 80);
  if (text === "USB로 연결됨") return tr("dv.usbLinked");
  const m = /^(.*) USB 복사기$/.exec(text);
  return m ? tr("dv.usbPrinter", { brand: m[1] }) : text;
}

/** discover.ts가 던지는 원본 오류 문구 → 사전 키 */
const ENGINE_ERRORS: [RegExp, MsgKey][] = [
  [/USB 창이 안 열려요/, "dv.noUsbWindow"],
  [/USB를 사용 중/, "dv.usbBusy"],
  [/15초 안에 받지 않았어요/, "dv.timeout"],
  [/데이터를 거절했어요/, "dv.rejected"],
  [/USB로 바로 넣지는 못해요/, "dv.cantSend"],
  [/보내기를 멈췄어요/, "dv.stopped"],
];

export function uidOf(title: string) {
  /* 한글뿐 아니라 일본어·중국어 등 모든 글자·숫자를 남겨, 비영문 이름끼리 같은 uid로 겹치지 않게 한다 */
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "");
}

export function chunkLoadError(error: unknown) {
  return error instanceof Error && /Failed to fetch|dynamically imported|Importing a module script failed|Loading chunk|error loading dynamically/i.test(error.message);
}

export function humanError(error: unknown, fallback: string) {
  if (chunkLoadError(error)) return tr("err.chunk");
  if (error instanceof DOMException) {
    if (error.name === "NotFoundError") return tr("err.pickCancel");
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return tr("err.noPicker");
    if (error.name === "NetworkError") return tr("err.netLost");
    if (error.name === "InvalidStateError") return tr("err.busyElsewhere");
  }
  if (error instanceof Error) {
    const engine = ENGINE_ERRORS.find(([re]) => re.test(error.message));
    if (engine) return tr(engine[1]);
    // 앱 사전에서 나온 문구(또는 한국어 원문)만 그대로 보여 주고, 브라우저 원문 오류는 안내 문구로 바꿔요.
    if (isAppText(error.message) || /[가-힣]/.test(error.message)) return error.message;
  }
  return fallback;
}

export function inAppBrowser() {
  return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent);
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(tr("err.openPhoto")));
    image.src = src;
  });
}

export function isSure(result: MatchResult | null, query: string) {
  if (!result || result.kind !== "match") return false;
  if (result.source === "catalog") return result.confidence >= 88;
  if (result.source === "driver-db") return result.confidence >= 90;
  if (result.source === "heuristic" && result.confidence >= 70) return /\d{2,}/.test(query);
  return false;
}

export function stageForQuery(query: string, cmd?: string): Step {
  const text = query.trim();
  const found = text ? matchQuery(text, { cmd }) : null;
  const matched = found && found.kind === "match" ? found : null;
  if (matched && isSure(found, text)) return "print";
  return "confirm";
}

/** 바이트를 파일로 내려받기 (PDF 저장 공용) */
export function downloadBytes(bytes: Uint8Array, filename: string, type = "application/pdf") {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const url = URL.createObjectURL(new Blob([copy], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
