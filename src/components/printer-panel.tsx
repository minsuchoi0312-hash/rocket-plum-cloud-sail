/**
 * 1. 연결된 프린터 패널(와이파이 IP · USB 선 · PC 도우미) + 최근 프린터 + 2. 무엇을 보낼까요 + 최근 인쇄.
 * atlas-app.tsx에서 분리. 상태는 부모가 갖고 여기서는 그리기만 한다.
 */
import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Copy, FileText, History, Image as ImageIcon, Monitor, Pencil, Printer, QrCode, Search, Sheet, StickyNote, Trash2, Upload, Usb, Wifi, X } from "@/components/icons";
import { helperPing } from "@/lib/helper-send";
import { SUBNET_PRESETS, type ScanProgress } from "@/lib/lan-find";
import { printerLabel, type SavedPrinter } from "@/lib/printer-store";
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
  const { statusCard, addTypedIp, album, aliasDraft, setAliasDraft, appOrigin, checkPrinter, connectUsb, editingUid, setEditingUid, findOnWifi, findViaHelper, forget, foundList, helperCode, setHelperCode, helperOk, setHelperOk, helperShare, helperUrl, setHelperUrl, history, ipInput, setIpInput, lanBusy, lanNote, setLanNote, linkOpen, setLinkOpen, linkTab, setLinkTab, memo, notice, onPrint, openChooser, pdfName, photoUrl, pickPreset, probes, recentPrinters, reconnect, rememberHost, route, saveAlias, scanMode, scanProg, scanning, selected, selectedId, selectedName, sending, setAskName, setOverrideQuery, setQrTarget, setSelectedId, setShowDiag, setShowIpGuide, showIpGuide, setStep, setSubnetInput, subnetInput, setSupportTab, setUseHelper, useHelper, startWith, statusDot, statusText, stopScan, usbMissed, usbOk, helperStatus, onLauncher } = props;
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
    <section className="flex flex-col gap-3">
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
              <Search className="size-[22px]" aria-hidden="true" />
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
          <div className="mt-3 space-y-3">
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
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <button type="button" disabled={lanBusy || sending} onClick={() => {
                    setSearched(true);
                    void findOnWifi("quick");
                  }} className="btn-solid flex h-[52px] items-center justify-center gap-2 rounded-2xl text-[16px] disabled:opacity-50">
                    <Search className="size-5" aria-hidden="true" />
                    {phone ? (lanBusy ? t("ph.finding") : t("ph.find")) : lanBusy && scanMode === "quick" ? t("pp.findingQuick") : lanBusy && scanMode === "helper" ? t("pp.helperFinding") : useHelper && helperUrl.trim() ? t("pp.findHelper") : t("pp.findQuick")}
                  </button>
                  <button type="button" disabled={lanBusy || sending} onClick={() => {
                    setSearched(true);
                    void findOnWifi("full");
                  }} className="chip h-[52px] rounded-2xl px-3.5 text-sm disabled:opacity-50" title={t("pp.fullTitle")}>
                    {t("pp.full")}
                    <span className="block text-[11px] font-normal text-muted">1~254</span>
                  </button>
                </div>
                {lanBusy && scanProg && scanProg.total > 0 ? (
                  <div className="scan-box" aria-live="polite">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="tabular-nums text-fg">
                        {t("pp.scanProg", { done: scanProg.done, total: scanProg.total, found: scanProg.found })}
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
                {lanBusy && scanMode === "helper" ? (
                  <div className="scan-box flex items-center justify-between text-xs">
                    <span className="text-fg">{t(phone ? "ph.scan" : "pp.helperScan")}</span>
                    <button type="button" onClick={stopScan} className="font-semibold text-accent">
                      {t("pp.stop")}
                    </button>
                  </div>
                ) : null}
                <details className="rounded-2xl border border-line px-3 py-2">
                  <summary className="text-sm font-medium text-fg">{t("pp.otherNets")}{subnetInput ? ` · ${subnetInput}` : ""}</summary>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {SUBNET_PRESETS.map((preset) => (
                      <button key={preset.subnet} type="button" disabled={lanBusy || sending} onClick={() => pickPreset(preset.subnet)} className={`chip preset rounded-full px-2.5 py-1 text-left disabled:opacity-50 ${subnetInput === preset.subnet ? "is-on" : ""}`}>
                        <span className="block text-xs font-semibold tabular-nums">{preset.subnet}</span>
                        <span className="block text-[10px] opacity-80">{t(preset.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                  <label className="mt-3 block text-xs font-medium text-muted" htmlFor="subnet-field">
                    {t("pp.subnetManual")}
                  </label>
                  <input id="subnet-field" value={subnetInput} onChange={(event) => setSubnetInput(event.target.value)} inputMode="decimal" placeholder="192.168.50" aria-label={t("pp.subnetAria")} className="field mt-1 h-11 w-full rounded-xl px-3 text-sm outline-none" />
                </details>
                <form
                  className="space-y-1"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addTypedIp();
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-2">
                    <label className="block text-xs font-medium text-muted" htmlFor="printer-ip">
                      {t("pp.ipLabel")}
                    </label>
                    <button type="button" onClick={() => setShowIpGuide((value) => !value)} aria-expanded={showIpGuide} className="text-xs font-semibold text-accent">
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
                  <p className="mt-1.5 break-words text-[11px] leading-relaxed text-muted">
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
                <p className="text-xs font-medium text-muted">{t("pp.found")}</p>
                <ul className="mt-1">
                  {foundList.map((item) => {
                    const on = item.id === selectedId;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          disabled={sending && !on}
                          onClick={() => {
                            if (sending) return;
                            setSelectedId(item.id);
                            setOverrideQuery(null);
                            setAskName("");
                            if (item.host) rememberHost(item.host, item.title, useHelper);
                            setStep(item.host ? "print" : stageForQuery(item.query, item.cmd));
                          }}
                          className={`flex w-full items-center gap-3 border-b border-line py-2.5 text-left ${on ? "text-accent" : ""}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{deviceText(item.title)}</span>
                            <span className="mt-0.5 block truncate text-xs text-muted">{deviceText(item.subtitle)}</span>
                          </span>
                          <span className={`text-xs ${item.live ? "text-ok" : "text-faint"}`}>{item.live ? t("pp.live") : viaLabel(item.via)}</span>
                        </button>
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

      {recentPrinters.length > 0 ? (
        <div className="card p-5">
          <h2 className="card-title">{t("pp.recent")}</h2>
          <ul className="mt-2">
            {recentPrinters.map((item) => (
              <li key={item.uid} className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-line py-2 last:border-b-0">
                {editingUid === item.uid ? (
                  <form
                    className="flex min-w-0 flex-1 gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveAlias(item.uid);
                    }}
                  >
                    <input autoFocus value={aliasDraft} onChange={(event) => setAliasDraft(event.target.value)} maxLength={30} placeholder={t("pp.aliasPh")} aria-label={t("pp.aliasAria")} className="field h-10 min-w-0 flex-1 rounded-xl px-3 text-sm outline-none" />
                    <button type="submit" className="btn-solid h-10 shrink-0 rounded-xl px-3 text-sm">
                      {t("pp.save")}
                    </button>
                    <button type="button" onClick={() => setEditingUid(null)} className="chip h-10 shrink-0 rounded-xl px-3 text-sm">
                      {t("pp.cancel")}
                    </button>
                  </form>
                ) : (
                  <>
                    <button type="button" onClick={() => reconnect(item)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-medium text-fg">{printerLabel(item)}</span>
                      <span className="block truncate text-xs text-muted">
                        {item.alias ? `${item.title} · ` : ""}
                        {item.link === "helper" && !phone ? t("pp.tabHelper") : item.link === "wifi" || item.link === "helper" ? t("pp.linkWifi") : item.link === "usb" ? "USB" : item.via}
                        {item.host && !item.title.includes(item.host) ? ` · ${item.host}` : ""}
                      </span>
                    </button>
                    {isCurrent(item) ? (
                      <span className="current-badge shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold">{t("pp.current")}</span>
                    ) : (
                      <button type="button" onClick={() => reconnect(item)} className="btn-solid h-9 shrink-0 rounded-full px-3 text-xs font-semibold">
                        {t("pp.connect")}
                      </button>
                    )}
                    <div className="flex w-full flex-wrap items-center gap-1.5 pl-0.5">
                      {item.host && !isCurrent(item) ? (
                        <>
                          {/* 상태 문구는 버튼에 밀려 잘리지 않게 단독 줄로 */}
                          <span className="flex w-full min-w-0 items-center gap-1.5">
                          <span className={`probe-dot ${probes[item.uid]?.state === "on" ? "is-on" : probes[item.uid]?.state === "checking" ? "is-wait" : ""}`} aria-hidden="true" />
                          <span className="min-w-0 flex-1 break-words text-[11px] leading-snug text-muted" aria-live="polite">
                            {probes[item.uid]?.state === "checking"
                              ? t("pp.probeChecking")
                              : probes[item.uid]?.state === "on"
                                ? t("pp.probeOn", { ms: probes[item.uid]?.ms ?? "?", via: probes[item.uid]?.via ?? "" })
                                : probes[item.uid]?.state === "off"
                                  ? t("pp.probeOff", { via: probes[item.uid]?.via || "-" })
                                  : useHelper && helperUrl.trim()
                                    ? t("pp.probeHelper")
                                    : t("pp.probeIdle")}
                          </span>
                          </span>
                          <span className="flex-1" aria-hidden="true" />
                          <button type="button" onClick={() => void checkPrinter(item)} disabled={probes[item.uid]?.state === "checking"} className="chip h-7 shrink-0 rounded-full px-2.5 text-[11px] font-semibold">
                            {t("pp.probeBtn")}
                          </button>
                          <button type="button" onClick={() => setQrTarget({ name: printerLabel(item), ip: item.host || "", helper: helperShare })} className="icon-btn inline-flex size-7 shrink-0 items-center justify-center rounded-full" aria-label={t("pp.qrAria", { name: printerLabel(item) })}>
                            <QrCode className="size-3.5" />
                          </button>
                        </>
                      ) : item.host ? (
                        <span className="flex-1 text-[11px] text-muted">{t("pp.currentHint")}</span>
                      ) : (
                        <span className="flex-1 text-[11px] text-muted">{t("pp.usbRemembered")}</span>
                      )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUid(item.uid);
                        setAliasDraft(item.alias || "");
                      }}
                      className="icon-btn inline-flex size-7 shrink-0 items-center justify-center rounded-full"
                      aria-label={t("pp.aliasEdit", { name: printerLabel(item) })}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => forget(item.uid)} className="icon-btn inline-flex size-7 shrink-0 items-center justify-center rounded-full" aria-label={t("pp.delete", { name: printerLabel(item) })}>
                      <Trash2 className="size-3.5" />
                    </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="card p-5">
        <div className="card-head">
          <h2 className="card-title">{t("pp.step2")}</h2>
        </div>
        {pdfName || photoUrl || album.length || memo.trim() ? (
          <button type="button" onClick={openChooser} className="btn-solid mt-3 h-12 w-full rounded-2xl text-[15px]">
            {t("pp.continue", { v: pdfName || (album.length ? t("pp.photos", { n: album.length }) : photoUrl ? t("pp.photo") : t("pp.memo")) })}
          </button>
        ) : null}
        {/* 문서 종류 — 애플 설정 앱처럼 색 아이콘 + 한 줄 행 + 오른쪽 화살표 */}
        <ul className="-mx-2 mt-2">
          {(
            [
              ["pdf", FileText, "pp.hintPdf"],
              ["photo", ImageIcon, "pp.hintPhoto"],
              ["memo", StickyNote, "pp.hintMemo"],
              ["test", Sheet, "pp.hintTest"],
            ] as const
          ).map(([kind, Icon, hint]) => (
            <li key={kind}>
              <button type="button" onClick={() => startWith(kind)} className="doc-row">
                <span className={`doc-ico is-${kind}`} aria-hidden="true">
                  <Icon weight="fill" className="size-[22px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold text-fg">{docLabel(kind)}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-muted">{t(hint)}</span>
                </span>
                <ChevronRight className="doc-chev" aria-hidden="true" />
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
