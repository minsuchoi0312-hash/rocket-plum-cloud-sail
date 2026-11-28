/**
 * 1. 연결된 프린터 패널(와이파이 IP · USB 선 · PC 도우미) + 최근 프린터 + 2. 무엇을 보낼까요 + 최근 인쇄.
 * atlas-app.tsx에서 분리. 상태는 부모가 갖고 여기서는 그리기만 한다.
 */
import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Copy, FileText, History, Image as ImageIcon, Monitor, Printer, QrCode, ScanQr, Search, Sheet, Stethoscope, StickyNote, Upload, Usb, Wifi, X } from "@/components/icons";
import { helperPing } from "@/lib/helper-send";
import { SUBNET_PRESETS, type ScanProgress } from "@/lib/lan-find";
import { type SavedPrinter } from "@/lib/printer-store";
import type { PrintRecord } from "@/lib/print-history";
import type { PrintRoute } from "@/lib/print-route";
import { HELPER_COMMAND, HELPER_FILE, ipGuide } from "@/lib/support";
import { launcherFileName } from "@/lib/helper-launcher";
import { m, msgText, useI18n, type Msg } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import type { MsgKey } from "@/lib/i18n/types";
import { copyText } from "@/lib/clipboard";
import { deviceText, stageForQuery, viaLabel, type Found, type LinkTab, type ProbeState, type Step } from "@/lib/app-utils";
import type { DocKind } from "@/components/paper-preview";
import { docLabel } from "@/components/print-parts";
import type { QrTarget } from "@/components/printer-qr-modal";
import { HistoryList, type SupportTab } from "@/components/support-center";
import { isPhoneHelper } from "@/lib/phone-helper";
import { MyPrinters } from "@/components/my-printers";

type Set<T> = Dispatch<SetStateAction<T>>;

export type HelperStatus = { state: "checking" | "on" | "off"; ms?: number | null };

/** 도우미 상태 표시: 초록 점(연결됨 · ms) / 회색 점(꺼짐) */
function HelperPill({ status }: { status: HelperStatus }) {
  const { t } = useI18n();
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs" aria-live="polite">
      <span className={`probe-dot ${status.state === "on" ? "is-on" : status.state === "checking" ? "is-wait" : ""}`} aria-hidden="true" />
      <span className={status.state === "on" ? "font-medium text-ok" : "text-muted"}>
        {status.state === "on" ? t("pp.helperOn", { ms: status.ms ?? "?" }) : status.state === "checking" ? t("pp.helperChecking") : t("pp.helperOff")}
      </span>
    </p>
  );
}

const LINK_TABS: [LinkTab, MsgKey, ReactNode][] = [
  ["wifi", "pp.tabWifi", <Wifi key="w" className="size-4" aria-hidden="true" />],
  ["usb", "pp.tabUsb", <Usb key="u" className="size-4" aria-hidden="true" />],
  ["helper", "pp.tabHelper", <Monitor key="m" className="size-4" aria-hidden="true" />],
];

export type PrinterPanelProps = {
  addTypedIp: () => void;
  album: string[];
  aliasDraft: string;
  setAliasDraft: Set<string>;
  appOrigin: string;
  checkPrinter: (item: SavedPrinter) => Promise<void>;
  connectUsb: (all?: boolean) => Promise<void>;
  editingUid: string | null;
  setEditingUid: Set<string | null>;
  findOnWifi: (mode?: "quick" | "full", subnetOverride?: string) => Promise<void>;
  findViaHelper: () => Promise<void>;
  forget: (uid: string) => void;
  registerPrinter: (name: string, host: string) => string | null;
  disconnect: () => void;
  foundList: Found[];
  helperCode: string;
  setHelperCode: Set<string>;
  helperOk: boolean;
  setHelperOk: Set<boolean>;
  helperShare: { url: string; code: string } | null;
  helperUrl: string;
  setHelperUrl: Set<string>;
  history: PrintRecord[];
  ipInput: string;
  setIpInput: Set<string>;
  lanBusy: boolean;
  lanNote: Msg;
  setLanNote: Set<Msg>;
  linkOpen: boolean;
  setLinkOpen: Set<boolean>;
  linkTab: LinkTab;
  setLinkTab: Set<LinkTab>;
  memo: string;
  notice: Msg;
  onPrint: (trial?: boolean, copiesOverride?: number) => Promise<void>;
  openChooser: () => void;
  pdfName: string;
  photoUrl: string | null;
  pickPreset: (subnet: string) => void;
  probes: Record<string, ProbeState>;
  recentPrinters: SavedPrinter[];
  reconnect: (item: SavedPrinter) => void;
  rememberHost: (host: string, title: string, viaHelper: boolean) => void;
  route: PrintRoute;
  saveAlias: (uid: string) => void;
  scanMode: "quick" | "full" | "helper" | null;
  scanProg: ScanProgress | null;
  scanning: boolean;
  selected: Found | null;
  selectedId: string | null;
  selectedName: string;
  sending: boolean;
  setAskName: Set<string>;
  setOverrideQuery: Set<string | null>;
  setQrTarget: Set<QrTarget | null>;
  /** QR 찍어 연결 (찍을 수 없는 환경이면 null → 줄을 숨긴다) */
  onScanQr: (() => void) | null;
  setSelectedId: Set<string | null>;
  setShowDiag: Set<boolean>;
  setShowIpGuide: Set<boolean>;
  showIpGuide: boolean;
  setStep: Set<Step>;
  setSubnetInput: Set<string>;
  subnetInput: string;
  setSupportTab: Set<SupportTab>;
  setUseHelper: Set<boolean>;
  useHelper: boolean;
  startWith: (kind: DocKind) => void;
  statusDot: string;
  statusText: string;
  stopScan: () => void;
  usbMissed: boolean;
  usbOk: boolean;
  helperStatus: HelperStatus | null;
  /** 연결 카드 아래에 보일 복사기 상태 카드 */
  statusCard?: ReactNode;
  onLauncher: (os: "win" | "mac") => void;
};

export function PrinterPanel(props: PrinterPanelProps) {
  const { statusCard, addTypedIp, album, aliasDraft, setAliasDraft, appOrigin, checkPrinter, connectUsb, editingUid, setEditingUid, findOnWifi, findViaHelper, forget, registerPrinter, disconnect, foundList, helperCode, setHelperCode, helperOk, setHelperOk, helperShare, helperUrl, setHelperUrl, history, ipInput, setIpInput, lanBusy, lanNote, setLanNote, linkOpen, setLinkOpen, linkTab, setLinkTab, memo, notice, onPrint, openChooser, pdfName, photoUrl, pickPreset, probes, recentPrinters, reconnect, rememberHost, route, saveAlias, scanMode, scanProg, scanning, selected, selectedId, selectedName, sending, setAskName, setOverrideQuery, setQrTarget, onScanQr, setSelectedId, setShowDiag, setShowIpGuide, showIpGuide, setStep, setSubnetInput, subnetInput, setSupportTab, setUseHelper, useHelper, startWith, statusDot, statusText, stopScan, usbMissed, usbOk, helperStatus, onLauncher } = props;
  const { t } = useI18n();
  /* 앱(APK): 폰이 직접 찾고 보내니 PC 도우미 탭 · 상태는 감춘다 */
  const phone = useHelper && isPhoneHelper(helperUrl);
  const linkTabs = phone ? LINK_TABS.filter(([id]) => id !== "helper") : LINK_TABS;
  /* 첫 화면 밀도: '찾은 프린터'는 직접 검색했거나 2대 이상일 때만 펼친다(링크로 1대 연결 시 위 상태와 중복) */
  const [searched, setSearched] = useState(false);
  const showFound = foundList.length > 0 && (searched || foundList.length >= 2 || !selected);
  /* 최근 프린터 중 지금 연결된 것 */
  const isCurrent = (item: SavedPrinter) => Boolean(selected && ((item.host && selected.host === item.host) || (!item.host && selected.usbKey && selected.title === item.title)));
  return (
    <section className="step-in flex flex-col gap-3">
      <div className="card p-5">
        {/* 머리글 — 제목 + 아이콘만 있는 버튼 (자가진단 · 접기/펼치기) */}
        <div className="card-head">
          <h2 className="card-title">{t("pp.step1")}</h2>
          <div className="-mr-2 flex items-center">
            <button
              type="button"
              onClick={() => {
                setSupportTab("diag");
                setShowDiag(true);
              }}
              className="ghost-btn"
              aria-label={t("pp.selfCheck")}
              title={t("pp.selfCheck")}
            >
              {/* 자가진단 = 청진기 (아래 '프린터 찾기' 돋보기와 헷갈리지 않게) */}
              <Stethoscope className="size-[22px]" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setLinkOpen((value) => !value)}
              className="ghost-btn"
              aria-expanded={linkOpen}
              aria-label={linkOpen ? t("pp.collapse") : t("pp.change")}
              title={linkOpen ? t("pp.collapse") : t("pp.change")}
            >
              {linkOpen ? <ChevronUp className="size-[22px]" aria-hidden="true" /> : <ChevronDown className="size-[22px]" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {/* 지금 연결 상태 — 연결 방식 아이콘 칩 + 상태 점 */}
        <div className="mt-3 flex items-center gap-3.5">
          <span className="link-avatar" aria-hidden="true">
            {statusDot.includes("usb") ? <Usb className="size-6" /> : statusDot.includes("wifi") ? <Wifi className="size-6" /> : statusDot.includes("helper") ? <Monitor className="size-6" /> : <Printer className="size-6" />}
            <span className={`link-avatar-dot ${statusDot}`} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-fg">{statusText}</p>
            <p className="mt-0.5 truncate text-sm text-muted">{selectedName || t("pp.noPrinter")}</p>
            {helperStatus && !phone ? <HelperPill status={helperStatus} /> : null}
          </div>
          {selected?.host ? (
            <button
              type="button"
              onClick={() => setQrTarget({ name: selectedName || selected.title, ip: selected.host || "", helper: helperShare })}
              className="ghost-btn -mr-2"
              aria-label={t("pp.qrShare")}
              title={t("pp.qrShare")}
            >
              <QrCode className="size-[22px]" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {linkOpen ? (
          <div className="reveal mt-3 space-y-3">
            <div className="seg" role="tablist" aria-label={t("pp.linkAria")}>
              {linkTabs.map(([id, key, icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={linkTab === id}
                  onClick={() => {
                    setLinkTab(id);
                    if (id === "helper") setUseHelper(true);
                  }}
                  className={`seg-btn ${linkTab === id ? "is-on" : ""}`}
                >
                  {icon}
                  <span>{t(key)}</span>
                </button>
              ))}
            </div>

            {linkTab === "wifi" ? (
              <div className="space-y-2.5">
                {/* 토스식: 주요 행동은 큰 버튼 하나, 나머지(전체 검색 · 다른 네트워크 · IP 입력)는 아래 목록에 접어 둔다 */}
                <button type="button" disabled={lanBusy || sending} onClick={() => {
                  setSearched(true);
                  void findOnWifi("quick");
                }} className="btn-solid btn-cta flex w-full items-center justify-center gap-2 disabled:opacity-50">
                  <Search className="size-5" aria-hidden="true" />
                  {phone ? (lanBusy ? t("ph.finding") : t("ph.find")) : lanBusy && scanMode === "quick" ? t("pp.findingQuick") : lanBusy && scanMode === "helper" ? t("pp.helperFinding") : useHelper && helperUrl.trim() ? t("pp.findHelper") : t("pp.findQuick")}
                </button>
                {lanBusy && scanProg && scanProg.total > 0 ? (
                  <div className="scan-box" aria-live="polite">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-baseline gap-2 tabular-nums text-fg">
                        <b className="text-[18px] font-bold text-accent">{Math.round((scanProg.done / scanProg.total) * 100)}%</b>
                        <span className="truncate text-muted">{t("pp.scanProg", { done: scanProg.done, total: scanProg.total, found: scanProg.found })}</span>
                      </span>
                      <button type="button" onClick={stopScan} className="inline-flex items-center gap-1 font-semibold text-accent">
                        <X className="size-3.5" aria-hidden="true" />
                        {t("pp.stop")}
                      </button>
                    </div>
                    <div className="scan-track" role="progressbar" aria-valuemin={0} aria-valuemax={scanProg.total} aria-valuenow={scanProg.done}>
                      <span style={{ width: `${Math.round((scanProg.done / scanProg.total) * 100)}%` }} />
                    </div>
                  </div>
                ) : null}
                {lanBusy && scanMode === "helper" && !(scanProg && scanProg.total > 0) ? (
                  <div className="scan-box flex items-center justify-between text-xs">
                    <span className="text-fg">{t(phone ? "ph.scan" : "pp.helperScan")}</span>
                    <button type="button" onClick={stopScan} className="font-semibold text-accent">
                      {t("pp.stop")}
                    </button>
                  </div>
                ) : null}
                <div className="opt-list">
                {onScanQr ? (
                  <button type="button" disabled={sending} onClick={onScanQr} className="opt-item">
                    <span className="opt-item-ico" aria-hidden="true">
                      <ScanQr className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="opt-item-title">{t("qrs.title")}</span>
                      <span className="opt-item-sub">{t("qrs.sub")}</span>
                    </span>
                    <ChevronRight className="doc-chev" aria-hidden="true" />
                  </button>
                ) : null}
                <button type="button" disabled={lanBusy || sending} onClick={() => {
                  setSearched(true);
                  void findOnWifi("full");
                }} className="opt-item">
                  <span className="min-w-0 flex-1">
                    <span className="opt-item-title">{t("pp.full")}</span>
                    <span className="opt-item-sub">{t("pp.fullTitle")}</span>
                  </span>
                  <span className="opt-item-meta">1~254</span>
                  <ChevronRight className="doc-chev" aria-hidden="true" />
                </button>
                <details className="opt-fold">
                  <summary className="opt-item">
                    <span className="min-w-0 flex-1">
                      <span className="opt-item-title">{t("pp.otherNets")}</span>
                      {subnetInput ? <span className="opt-item-sub tabular-nums">{subnetInput}</span> : null}
                    </span>
                  </summary>
                  <div className="opt-fold-body">
                  <div className="flex flex-wrap gap-1.5">
                    {SUBNET_PRESETS.map((preset) => (
                      <button key={preset.subnet} type="button" disabled={lanBusy || sending} onClick={() => pickPreset(preset.subnet)} className={`chip preset rounded-full px-2.5 py-1 text-left disabled:opacity-50 ${subnetInput === preset.subnet ? "is-on" : ""}`}>
                        <span className="block text-xs font-semibold tabular-nums">{preset.subnet}</span>
                        <span className="block text-[12px] opacity-80">{t(preset.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                  <label className="mt-3 block text-xs font-medium text-muted" htmlFor="subnet-field">
                    {t("pp.subnetManual")}
                  </label>
                  <input id="subnet-field" value={subnetInput} onChange={(event) => setSubnetInput(event.target.value)} inputMode="decimal" placeholder="192.168.50" aria-label={t("pp.subnetAria")} className="field mt-1 h-11 w-full rounded-xl px-3 text-sm outline-none" />
                  </div>
                </details>
                <details className="opt-fold" open={Boolean(ipInput) || showIpGuide}>
                  <summary className="opt-item">
                    <span className="min-w-0 flex-1">
                      <span className="opt-item-title">{t("pp.ipLabel")}</span>
                    </span>
                  </summary>
                  <div className="opt-fold-body">
                <form
                  className="space-y-1"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addTypedIp();
                  }}
                >
                  <div className="flex flex-wrap items-center justify-end gap-x-2">
                    <button type="button" onClick={() => setShowIpGuide((value) => !value)} aria-expanded={showIpGuide} className="text-sm font-semibold text-accent">
                      {showIpGuide ? t("pp.ipGuideClose") : t("pp.ipGuide")}
                    </button>
                  </div>
                  <div className="ip-join">
                    <input
                      id="printer-ip"
                      value={ipInput}
                      onChange={(event) => setIpInput(event.target.value)}
                      inputMode="decimal"
                      placeholder="192.168.0.10"
                      aria-label={t("pp.ipLabel")}
                      className="field h-12 min-w-0 flex-1 px-3 text-sm outline-none"
                    />
                    <button type="submit">{t("pp.useIp")}</button>
                  </div>
                </form>
                {showIpGuide ? (
                  <ul className="ip-guide space-y-1.5 rounded-2xl px-3 py-2.5 text-xs leading-relaxed">
                    {ipGuide().map((row) => (
                      <li key={row.brand}>
                        <b className="font-semibold text-fg">{row.brand}</b> <span className="text-muted">{row.how}</span>
                      </li>
                    ))}
                    <li className="text-faint">{t("pp.ipGuideNote")}</li>
                  </ul>
                ) : null}
                  </div>
                </details>
                </div>
                {/* 검색은 사용자가 누를 때만 한다(자동 · 백그라운드 전체 검색 없음) */}
                <p className="px-1 text-xs text-faint">{t("pp.scanOwn")}</p>
                {lanNote ? <p className="text-sm text-muted">{msgText(lanNote)}</p> : null}
              </div>
            ) : null}

            {linkTab === "usb" ? (
              <div className="space-y-2">
                <button type="button" disabled={!usbOk} onClick={() => {
                  setSearched(true);
                  void connectUsb(false);
                }} className="btn-solid flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium disabled:opacity-50">
                  <Usb className="size-4" aria-hidden="true" />
                  {t("pp.usbConnect")}
                </button>
                {usbOk ? null : <p className="text-xs text-muted">{t("pp.usbOnlyChrome")}</p>}
                {usbMissed ? (
                  <button type="button" onClick={() => {
                    setSearched(true);
                    void connectUsb(true);
                  }} className="text-xs text-muted underline-offset-2 hover:underline">
                    {t("pp.usbOther")}
                  </button>
                ) : null}
                <p className="text-sm leading-relaxed text-muted" aria-live="polite">
                  {scanning ? t("pp.usbScanning") : selected?.live && selected.usbKey ? t("pp.usbLive") : t("pp.usbIdle")}
                </p>
              </div>
            ) : null}

            {linkTab === "helper" ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-fg">
                  <input type="checkbox" checked={useHelper} onChange={(event) => setUseHelper(event.target.checked)} />
                  {t("pp.useHelper")}
                </label>
                <div className="flex gap-2">
                  <input value={helperUrl} onChange={(event) => setHelperUrl(event.target.value)} aria-label={t("pp.helperUrlAria")} placeholder="http://127.0.0.1:47631" className="field h-11 min-w-0 flex-1 rounded-xl px-3 text-sm outline-none" />
                  <input value={helperCode} onChange={(event) => setHelperCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder={t("pp.codePh")} aria-label={t("pp.codeAria")} className="field h-11 w-20 rounded-xl px-3 text-sm outline-none" />
                  <button
                    type="button"
                    className="chip h-11 rounded-xl px-3 text-sm"
                    onClick={() =>
                      void helperPing(helperUrl)
                        .then((info) => {
                          setHelperOk(true);
                          setUseHelper(true);
                          setLanNote(m(info.discover ? "pp.helperReplyFind" : "pp.helperReplyOld"));
                        })
                        .catch((error: unknown) => {
                          setHelperOk(false);
                          setLanNote(error instanceof Error ? error.message : t("pp.noHelper"));
                        })
                    }
                  >
                    {t("pp.check")}
                  </button>
                </div>
                <button type="button" disabled={lanBusy || sending || !helperUrl.trim()} onClick={() => {
                  setSearched(true);
                  void findViaHelper();
                }} className="btn-solid flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium disabled:opacity-50">
                  <Search className="size-4" aria-hidden="true" />
                  {lanBusy && scanMode === "helper" ? t("pp.helperFinding") : t("pp.findViaHelper")}
                </button>
                {lanBusy && scanMode === "helper" ? (
                  <button type="button" onClick={stopScan} className="text-xs font-semibold text-accent">
                    {t("pp.stopSearch")}
                  </button>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <a href={HELPER_FILE} download="raw-print-helper.mjs" className="btn-solid inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold">
                    <Upload className="size-3 rotate-180" aria-hidden="true" />
                    {t("pp.helperDl")}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const command = appOrigin ? `${HELPER_COMMAND} --app=${appOrigin}` : HELPER_COMMAND;
                      void copyText(command).then((ok) => toast(m(ok ? "pp.cmdCopied" : "pp.copyFail", { cmd: command })));
                    }}
                    className="chip inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1"
                    title={t("pp.cmdTitle")}
                  >
                    <Copy className="size-3 shrink-0" aria-hidden="true" />
                    <code className="truncate">{HELPER_COMMAND}{appOrigin ? " --app=…" : ""}</code>
                  </button>
                </div>
                <div className="launch-box rounded-2xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-fg">{t("pp.launcherTitle")}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" disabled={!appOrigin} onClick={() => onLauncher("win")} className="btn-solid min-h-10 rounded-xl px-2 py-1 text-xs font-semibold disabled:opacity-50">
                      {t("pp.launcherWin")}
                    </button>
                    <button type="button" disabled={!appOrigin} onClick={() => onLauncher("mac")} className="chip min-h-10 rounded-xl px-2 py-1 text-xs font-semibold disabled:opacity-50">
                      {t("pp.launcherMac")}
                    </button>
                  </div>
                  <p className="mt-1.5 break-words text-xs leading-relaxed text-muted">
                    {t("pp.launcherNote")} <code>chmod +x {launcherFileName("mac")}</code>
                  </p>
                </div>
                {!helperStatus && helperOk ? <span className="text-xs text-ok">{t("pp.helperAlive")}</span> : null}
                <p className="break-words text-xs leading-relaxed text-muted">{t("pp.helperHow")}</p>
                {lanNote ? <p className="text-sm text-muted">{msgText(lanNote)}</p> : null}
              </div>
            ) : null}

            {notice ? <p className="text-sm text-warn">{msgText(notice)}</p> : null}
            {showFound ? (
              <div>
                <p className="text-sm font-medium text-muted">
                  {t("pp.found")} <span className="text-faint">{foundList.length}</span>
                </p>
                <ul className="mt-1">
                  {foundList.map((item) => {
                    const on = item.id === selectedId;
                    const connect = () => {
                      if (sending) return;
                      setSelectedId(item.id);
                      setOverrideQuery(null);
                      setAskName("");
                      if (item.host) {
                        rememberHost(item.host, item.title, useHelper);
                        toast(m("pp.connected", { name: deviceText(item.title) }));
                      } else setStep(stageForQuery(item.query, item.cmd));
                    };
                    return (
                      <li key={item.id} className="reveal flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                        <button type="button" disabled={sending && !on} onClick={on ? undefined : connect} className="min-w-0 flex-1 text-left">
                          <span className={`block truncate text-[16px] font-semibold ${on ? "text-accent" : "text-fg"}`}>{deviceText(item.title)}</span>
                          <span className="mt-0.5 block truncate text-sm text-muted">
                            {on ? <span className="font-semibold text-ok">{t("pp.live")} · </span> : null}
                            {deviceText(item.subtitle) || viaLabel(item.via)}
                          </span>
                        </button>
                        {on ? (
                          <button type="button" disabled={sending} onClick={disconnect} className="chip h-10 shrink-0 rounded-full px-4 text-[15px] font-semibold disabled:opacity-50">
                            {t("pp.disconnect")}
                          </button>
                        ) : (
                          <button type="button" disabled={sending} onClick={connect} className="btn-solid h-10 shrink-0 rounded-full px-4 text-[15px] font-semibold disabled:opacity-50">
                            {t("pp.connect")}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {selected?.usbKey && route === "preview-only" ? (
              <button type="button" className="chip h-11 w-full rounded-2xl text-sm" onClick={() => void onPrint(true)}>
                {t("pp.trialPcl")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {statusCard}

      <MyPrinters
        items={recentPrinters}
        isCurrent={isCurrent}
        phone={phone}
        probes={probes}
        checkPrinter={checkPrinter}
        reconnect={reconnect}
        forget={forget}
        registerPrinter={registerPrinter}
        disconnect={disconnect}
        editingUid={editingUid}
        setEditingUid={setEditingUid}
        aliasDraft={aliasDraft}
        setAliasDraft={setAliasDraft}
        saveAlias={saveAlias}
        openQr={setQrTarget}
        helperShare={helperShare}
      />

      <div className="card p-5">
        <div className="card-head">
          <h2 className="card-title">{t("pp.step2")}</h2>
        </div>
        {pdfName || photoUrl || album.length || memo.trim() ? (
          <button type="button" onClick={openChooser} className="btn-solid mt-3 h-12 w-full rounded-2xl text-[15px]">
            {t("pp.continue", { v: pdfName || (album.length ? t("pp.photos", { n: album.length }) : photoUrl ? t("pp.photo") : t("pp.memo")) })}
          </button>
        ) : null}
        {/* 문서 종류 — 2×2 사각 타일(색 아이콘 + 이름 + 한 줄 설명) */}
        <ul className="doc-grid mt-3">
          {(
            [
              ["pdf", FileText, "pp.hintPdf"],
              ["photo", ImageIcon, "pp.hintPhoto"],
              ["memo", StickyNote, "pp.hintMemo"],
              ["test", Sheet, "pp.hintTest"],
            ] as const
          ).map(([kind, Icon, hint]) => (
            <li key={kind}>
              <button type="button" onClick={() => startWith(kind)} className="doc-tile">
                <span className={`doc-ico is-${kind}`} aria-hidden="true">
                  <Icon weight="fill" className="size-[22px]" />
                </span>
                <span className="min-w-0">
                  <span className="doc-tile-name">{docLabel(kind)}</span>
                  <span className="doc-tile-hint">{t(hint)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 hidden text-xs text-faint sm:block">{t("pp.dropHint")}</p>
      </div>

      {history.length > 0 ? (
        <details className="card px-4 py-3">
          <summary className="flex items-center gap-2 text-sm font-medium text-fg">
            <History className="size-4 text-muted" aria-hidden="true" />
            {t("pp.recentPrints", { n: history.length })}
          </summary>
          <HistoryList items={history.slice(0, 5)} />
          <button
            type="button"
            onClick={() => {
              setSupportTab("log");
              setShowDiag(true);
            }}
            className="mt-2 text-xs font-semibold text-accent"
          >
            {t("pp.allHistory")}
          </button>
        </details>
      ) : null}
    </section>
  );
}
