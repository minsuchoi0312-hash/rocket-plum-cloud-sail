/**
 * 6단계 종합 자가진단 — 판정 규칙(순수 함수)과 리포트 텍스트.
 * 실제 측정(fetch·도우미 호출)은 diag-panel.tsx가 하고 결과를 여기 판정 함수에 넣는다 → Node에서 단위 테스트 가능.
 * 문구는 i18n 사전에서 지금 언어로 가져온다.
 */
import { tr, type MsgKey } from "./i18n/core.ts";

export type DiagLevel = "pass" | "warn" | "fail" | "skip";
export type DiagFix = "launcher" | "open-chrome" | "reload" | "pcl-trial" | "helper-tab" | "refresh-status" | "wifi-tab";
export type DiagStep = { id: number; title: string; level: DiagLevel; detail: string; metric?: string; fix?: { label: string; action: DiagFix } };

const TITLE_KEYS: MsgKey[] = ["diag.t1", "diag.t2", "diag.t3", "diag.t4", "diag.t5", "diag.t6"];

/** 단계 제목(지금 언어) */
export function diagTitles() {
  return TITLE_KEYS.map((key) => tr(key));
}

/** 앱(APK) 안에서 도는지: 폰 내장 도우미 · 앱에 들어 있는 화면 */
const inApp = () => typeof window !== "undefined" && Boolean((window as { __nugunaPhone?: boolean }).__nugunaPhone);
/* 앱에서는 3단계가 PC가 아니라 폰 안의 도우미 */
const title = (id: number) => tr(id === 3 && inApp() ? "diag.t3app" : TITLE_KEYS[id - 1]);
const fix = (key: MsgKey, action: DiagFix) => ({ label: tr(key), action });

/* 1) 브라우저·기기 */
export function judgeEnv(e: { browser: string; os: string; inApp: boolean; webUsb: boolean; serviceWorker: boolean; online: boolean }): DiagStep {
  const notes = [
    `${e.browser} · ${e.os}`,
    tr("diag.envWebUsb", { v: tr(e.webUsb ? "diag.yes" : "diag.no") }),
    tr("diag.envCache", { v: tr(e.serviceWorker ? "diag.on" : "diag.off") }),
    tr(e.online ? "diag.online" : "diag.offline"),
  ].join(" · ");
  if (e.inApp) return { id: 1, title: title(1), level: "fail", detail: tr("diag.envInApp", { notes }), fix: fix("diag.fixChrome", "open-chrome") };
  /* 앱: 화면 파일이 앱 안에 들어 있어 오프라인 캐시(서비스 워커)가 필요 없고, USB 대신 와이파이로 인쇄한다 → 경고하지 않는다 */
  if (inApp()) return { id: 1, title: title(1), level: "pass", detail: `${e.browser} · ${e.os} · ${tr("diag.envApp")} · ${tr(e.online ? "diag.online" : "diag.offline")}` };
  if (!e.serviceWorker) return { id: 1, title: title(1), level: "warn", detail: tr("diag.envNoSw", { notes }), fix: fix("diag.fixReload", "reload") };
  if (!e.webUsb) return { id: 1, title: title(1), level: "warn", detail: tr("diag.envNoUsb", { notes }) };
  return { id: 1, title: title(1), level: "pass", detail: notes };
}

/* 2) 한글 CMap */
export function judgeCmap(r: { ok: boolean; bytes: number; ms: number; fromCache?: boolean }): DiagStep {
  const metric = `${r.ms}ms${r.bytes ? ` · ${(r.bytes / 1024).toFixed(1)}KB` : ""}`;
  if (!r.ok || r.bytes < 1000) return { id: 2, title: title(2), level: "fail", detail: tr("diag.cmapFail"), metric, fix: fix("diag.fixReload", "reload") };
  return { id: 2, title: title(2), level: "pass", detail: tr("diag.cmapOk"), metric };
}

/* 3) PC 도우미 */
export function judgeHelper(r: { configured: boolean; ok: boolean; status?: number; ms?: number | null; subnets?: string[]; codeSet: boolean; needed: boolean }): DiagStep {
  if (!r.configured) {
    return r.needed
      ? { id: 3, title: title(3), level: "warn", detail: tr("diag.helperNeed"), fix: fix("diag.fixLauncher", "launcher") }
      : { id: 3, title: title(3), level: "skip", detail: tr("diag.helperSkip") };
  }
  if (r.status === 401) return { id: 3, title: title(3), level: "fail", detail: tr("diag.helper401"), fix: fix("diag.fixHelperTab", "helper-tab") };
  if (!r.ok) return { id: 3, title: title(3), level: "fail", detail: tr("diag.helperDown"), fix: fix("diag.fixLauncher", "launcher") };
  const metric = `${r.ms ?? "?"}ms`;
  const nets = r.subnets?.length ? tr("diag.nets", { nets: r.subnets.map((s) => `${s}.x`).join(", ") }) : tr("diag.netsNone");
  if (!r.codeSet) return { id: 3, title: title(3), level: "warn", detail: tr("diag.helperNoCode", { nets }), metric, fix: fix("diag.fixHelperTab", "helper-tab") };
  if ((r.ms ?? 0) > 800) return { id: 3, title: title(3), level: "warn", detail: tr("diag.helperSlow", { nets }), metric };
  return { id: 3, title: title(3), level: "pass", detail: tr("diag.helperOk", { nets }), metric };
}

/* 4) 네트워크 도달성 */
export type PortProbe = { port: number; open: boolean | null; ms: number | null };
export function judgeReach(r: { ip: string; usb: boolean; ports: PortProbe[] }): DiagStep {
  if (r.usb) return { id: 4, title: title(4), level: "skip", detail: tr("diag.reachUsb") };
  if (!r.ip) return { id: 4, title: title(4), level: "warn", detail: tr("diag.reachNoIp"), fix: fix("diag.fixWifiTab", "wifi-tab") };
  const fmt = (p: PortProbe) => `${p.port} ${p.open === null ? tr("diag.portUnknown") : p.open ? `${tr("diag.portOpen")}${p.ms != null ? ` ${p.ms}ms` : ""}` : tr("diag.portClosed")}`;
  const metric = r.ports.map(fmt).join(" · ");
  const openAny = r.ports.some((p) => p.open === true);
  const raw = r.ports.find((p) => p.port === 9100)?.open;
  if (!openAny) return { id: 4, title: title(4), level: "fail", detail: tr("diag.reachNone", { ip: r.ip }), metric, fix: fix("diag.fixSearch", "wifi-tab") };
  if (raw === false) return { id: 4, title: title(4), level: "warn", detail: tr("diag.reachNo9100", { ip: r.ip }), metric };
  return { id: 4, title: title(4), level: "pass", detail: tr("diag.reachOk", { ip: r.ip }), metric };
}

/* 5) 출력 경로 */
export function judgeRoute(r: { usb: boolean; cmd: string; helper: boolean; caps: { pdfDirect: boolean | null; pcl5: boolean | null; raw9100: boolean; ipp631: boolean } | null; canTrial: boolean }): DiagStep {
  const c = r.caps;
  if (r.usb) {
    const pdf = /\bPDF\b/i.test(r.cmd);
    const pcl = /PCL/i.test(r.cmd);
    if (pdf) return { id: 5, title: title(5), level: "pass", detail: tr("diag.routeUsbPdf") };
    if (pcl) return { id: 5, title: title(5), level: "pass", detail: tr("diag.routeUsbPcl") };
    return { id: 5, title: title(5), level: "warn", detail: tr("diag.routeUsbUnknown"), fix: r.canTrial ? fix("diag.fixTrial", "pcl-trial") : undefined };
  }
  if (c && r.helper && c.raw9100) {
    if (c.pdfDirect) return { id: 5, title: title(5), level: "pass", detail: tr("diag.routeHelperPdf") };
    if (c.pcl5 || c.pdfDirect === false) return { id: 5, title: title(5), level: "pass", detail: tr(c.pdfDirect === false ? "diag.routeHelperPclNoPdf" : "diag.routeHelperPcl") };
    return { id: 5, title: title(5), level: "warn", detail: tr("diag.routeHelperUnknown"), fix: r.canTrial ? fix("diag.fixTrial", "pcl-trial") : undefined };
  }
  if (c?.ipp631) return { id: 5, title: title(5), level: "warn", detail: tr("diag.routeIpp"), fix: fix("diag.fixLauncher", "launcher") };
  return { id: 5, title: title(5), level: "warn", detail: tr("diag.routeNone"), fix: r.canTrial ? fix("diag.fixTrial", "pcl-trial") : fix("diag.fixHelperTab", "helper-tab") };
}

/* 6) 하드웨어 */
export function judgeHardware(s: { state: string; summary: string; reasons: string[] } | null, usb: boolean): DiagStep {
  if (!s) return { id: 6, title: title(6), level: usb ? "skip" : "warn", detail: tr(usb ? "diag.hwUsb" : "diag.hwNone"), fix: usb ? undefined : fix("diag.fixStatus", "refresh-status") };
  if (s.state === "error") return { id: 6, title: title(6), level: "fail", detail: tr("diag.hwError", { summary: s.summary }), fix: fix("diag.fixStatus", "refresh-status") };
  if (s.state === "warning") return { id: 6, title: title(6), level: "warn", detail: tr("diag.hwWarn", { summary: s.summary }) };
  if (s.state === "ready" || s.state === "busy") return { id: 6, title: title(6), level: "pass", detail: s.summary };
  return { id: 6, title: title(6), level: "warn", detail: s.summary || tr("diag.hwUnknown"), fix: fix("diag.fixStatus", "refresh-status") };
}

export function overall(steps: DiagStep[]): DiagLevel {
  if (steps.some((s) => s.level === "fail")) return "fail";
  if (steps.some((s) => s.level === "warn")) return "warn";
  return "pass";
}

/** PIN·비밀번호·HOLDKEY·도우미 코드·6자리 숫자 코드를 모두 가린다 */
export function maskReport(text: string) {
  return text
    .replace(/HOLDKEY=\S+/gi, "HOLDKEY=****")
    .replace(/PIN\s*[=:]\s*\S+/gi, "PIN=****")
    .replace(/(비밀번호|password|パスワード|密码)\s*[:=]?\s*\S+/gi, "$1 ****")
    .replace(/(X-Helper-Code|연결 코드|도우미 코드|接続コード|连接码|code)\s*[:=]?\s*\d{4,8}/gi, "$1 ****")
    .replace(/([?&]code=)[^&\s]+/gi, "$1****");
}

const MARK: Record<DiagLevel, MsgKey> = { pass: "diag.mPass", warn: "diag.mWarn", fail: "diag.mFail", skip: "diag.mSkip" };

/** 단계 판정 이름(지금 언어) */
export function levelLabel(level: DiagLevel) {
  return tr(MARK[level]);
}

export function diagReport(steps: DiagStep[], meta: { at: number; printer: string; route: string; env: string }) {
  const d = new Date(meta.at);
  const pad = (n: number) => String(n).padStart(2, "0");
  const lines = [
    tr("diag.rTitle"),
    tr("diag.rTime", { v: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}` }),
    tr("diag.rPrinter", { printer: meta.printer || tr("diag.rNoPrinter"), route: meta.route }),
    tr("diag.rEnv", { v: meta.env }),
    tr("diag.rTotal", { v: levelLabel(overall(steps)) }),
    "",
    ...steps.map((s) => `${s.id}) [${levelLabel(s.level)}] ${s.title}${s.metric ? ` (${s.metric})` : ""}\n   ${s.detail}`),
  ];
  return maskReport(lines.join("\n"));
}
