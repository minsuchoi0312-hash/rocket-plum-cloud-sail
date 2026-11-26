import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight as ChevronRightIcon, CircleHelp, House as HouseIcon, Monitor as MonitorIcon, Moon, Printer as PrinterIcon, Sun, Upload, Usb as UsbIcon, Wifi as WifiIcon } from "@/components/icons";
import { I18nProvider, m, msgText, tr, useI18n, type Msg } from "@/lib/i18n";
import { LangSwitcher } from "@/components/lang-switcher";
import { AppErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/toaster";
import { toast } from "@/lib/toast";
import { syncThemeColor } from "@/lib/theme-color";
import { cleanPin, cleanText, pjlToken } from "@/lib/sanitize";
import { matchQuery, type MatchResult } from "@/lib/atlas";
import { grantedUsb, identifyUsb, pickUsb, sendUsbBytes, watchUsbConnect, watchUsbDisconnect } from "@/lib/discover";
import { clearPrintRoot, printSheet, type PrintJob } from "@/lib/print-sheet";
import { downloadCanvasPdf, grayCanvas, renderSheetCanvas, sheetMemoChunks } from "@/lib/pdf-page";
import { bundleCommands, canvasPclCommands, drawOfficePage, needsBlankBack, officeMemoChunks, osRasterSize, paperPoints, pclAbortFooter, pclJobFooter, pclJobHeader, pclPageCommands, previewSize, printPixelSize, printableSize, wrapPdfJob, type DuplexMode, type OfficePaper } from "@/lib/office-job";
import { canPdfDirect, imagesToPdf, nupGroups, openPdf, pageSpan, parsePageRange, renderPdfPage, slicePdf, type OpenedPdf } from "@/lib/pdf-doc";
import { languageIsPcl5, resolvePrintRoute, type PrintRoute } from "@/lib/print-route";
import { isValidIPv4, learnSubnetFromIp, type ScanProgress } from "@/lib/lan-find";
import { sendIppPdf } from "@/lib/ipp-send";
import { diag } from "@/lib/diag";
import { helperProbe, helperSend } from "@/lib/helper-send";
import { composeSheet, insetCanvas, MARGIN_MM, nupCell, stampSheet, stampsOn, watermarkLabel, type MarginMode, type StampOptions, type WatermarkPreset } from "@/lib/compose-sheet";
import { usePrinterStore, type SavedPrinter } from "@/lib/printer-store";
import { drawTestSheet, paperMm, type TestSheetInfo } from "@/lib/test-sheet";
import { addHistory, clearHistory, loadHistory, type PrintRecord } from "@/lib/print-history";
import { composeIdSheet, processPhotoUrl, type PhotoFilter, type PhotoLayout } from "@/lib/image-enhance";
import { drawMemoStyled, memoChunksStyled, memoIsDefault, memoToday, type MemoSize, type MemoStyle } from "@/lib/memo-sheet";
import type { Preset, PresetSettings } from "@/lib/presets";
import { SupportCenter, type SupportTab } from "@/components/support-center";
import { PaperPreview, type DocKind } from "@/components/paper-preview";
import { PrinterQrModal, type QrTarget } from "@/components/printer-qr-modal";
import { PrinterPanel, type HelperStatus } from "@/components/printer-panel";
import { lanSearch, useFileDrop, useLinkParams, useOnline, useSavedHelper } from "@/components/app-effects";
import { PrinterStatusCard } from "@/components/printer-status-card";
import { usePrinterStatus } from "@/components/use-printer-status";
import { DiagPanel } from "@/components/diag-panel";
import { PreflightChips } from "@/components/preflight-chips";
import { preflight, type PreflightAction } from "@/lib/preflight";
import type { DiagFix } from "@/lib/self-diag";
import { PrintOptions } from "@/components/print-options";
import { PreviewZoomModal } from "@/components/preview-zoom-modal";
import { downloadText, launcherFileName, macLauncher, windowsLauncher } from "@/lib/helper-launcher";
import { DoneBanner, JobBanner, type JobPhase } from "@/components/job-banner";
import { blobUrl, chunkLoadError, downloadBytes, humanError, inAppBrowser, isSure, loadImage, marginLabel, stageForQuery, uidOf, viaLabel, type Found, type LinkTab, type PageChip, type ProbeState, type Step } from "@/lib/app-utils";
import { isInkjet, PrintChooser, ReadyCard } from "@/components/print-parts";
import { PackSheet } from "@/components/pack-sheet";
import { escprEndPage, escprJobFooter, escprJobHeader, escprPageCommands } from "@/lib/escpr";
import { splJobFooter, splJobHeader, splPageCommands, splProfile } from "@/lib/spl";
import { pcl3JobFooter, pcl3JobHeader, pcl3PageCommands, pcl3Profile } from "@/lib/pcl3";
import { laserCmd, packFor, packInstalled, PACKS, type PackChoice, type PackDef, type PackId } from "@/lib/print-packs";
import { isPhoneHelper } from "@/lib/phone-helper";
import type { WifiExtra } from "@/components/app-effects";

/** 여러 명령을 한 덩어리로 */
function concatBytes(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** 언어 상자를 감싸 앱 전체가 같은 언어를 쓰게 한다 */
export function AtlasApp() {
  return (
    <I18nProvider>
      <AppErrorBoundary>
        <AtlasMain />
      </AppErrorBoundary>
      <Toaster />
    </I18nProvider>
  );
}

function AtlasMain() {
  // 언어가 바뀌면 이 컴포넌트부터 다시 그려져 하위 화면 문구가 모두 바뀐다.
  const { lang } = useI18n();
  const saved = usePrinterStore((state) => state.saved);
  const remember = usePrinterStore((state) => state.remember);
  const forget = usePrinterStore((state) => state.forget);
  const rename = usePrinterStore((state) => state.rename);
  const [scanId, setScanId] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [hits, setHits] = useState<Found[]>([]);
  /* 인쇄 팩: 설치 창 · 프린터(IP)별로 고른 팩 */
  const [packAsk, setPackAsk] = useState<{ choice: PackChoice; model: string; trial: boolean; copies?: number } | null>(null);
  const [packPicked, setPackPicked] = useState<Record<string, PackId>>({});
  const [extra, setExtra] = useState<Found[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrideQuery, setOverrideQuery] = useState<string | null>(null);
  const [askName, setAskName] = useState("");
  const [notice, setNotice] = useState<Msg>("");
  const [copies, setCopies] = useState(1);
  const [paper, setPaper] = useState<OfficePaper>("A4");
  const [gray, setGray] = useState(false);
  const [duplex, setDuplex] = useState<DuplexMode>("simplex");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [inApp, setInApp] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [usbMissed, setUsbMissed] = useState(false);
  const [step, setStep] = useState<Step>("connect");
  const [docKind, setDocKind] = useState<DocKind>("pdf");
  const [memo, setMemo] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfKey, setPdfKey] = useState("");
  const [pdfNeedsKey, setPdfNeedsKey] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const [pdfCount, setPdfCount] = useState(0);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [pageMode, setPageMode] = useState<"all" | "span" | "list">("all");
  const [pageFrom, setPageFrom] = useState(1);
  const [pageTo, setPageTo] = useState(1);
  const [previewSheet, setPreviewSheet] = useState(1);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [photoFit, setPhotoFit] = useState<"contain" | "cover">("contain");
  const [photoTurn, setPhotoTurn] = useState(0);
  const [orient, setOrient] = useState<"auto" | "portrait" | "landscape">("auto");
  const [lanBusy, setLanBusy] = useState(false);
  const [lanNote, setLanNote] = useState<Msg>("");
  const [ipInput, setIpInput] = useState("");
  const [pageList, setPageList] = useState("");
  const [nup, setNup] = useState<1 | 2 | 4>(1);
  const [reverse, setReverse] = useState(false);
  const [secureOn, setSecureOn] = useState(false);
  const [pin, setPin] = useState("");
  const [jobUser, setJobUser] = useState("USER");
  const [helperUrl, setHelperUrl] = useState("http://127.0.0.1:47631");
  const [helperCode, setHelperCode] = useState("");
  const [useHelper, setUseHelper] = useState(false);
  const [subnetInput, setSubnetInput] = useState("");
  const [album, setAlbum] = useState<string[]>([]);
  const [showDiag, setShowDiag] = useState(false);
  const [linkOpen, setLinkOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [usbOk, setUsbOk] = useState(false);
  const [linkTab, setLinkTab] = useState<LinkTab>("wifi");
  const [scanProg, setScanProg] = useState<ScanProgress | null>(null);
  const [scanMode, setScanMode] = useState<"quick" | "full" | "helper" | null>(null);
  const [showIpGuide, setShowIpGuide] = useState(false);
  const [supportTab, setSupportTab] = useState<SupportTab>("help");
  const [margin, setMargin] = useState<MarginMode>("none");
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState<PrintRecord[]>([]);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [aliasDraft, setAliasDraft] = useState("");
  const [helperOk, setHelperOk] = useState(false);
  /* v3 */
  const [qrTarget, setQrTarget] = useState<QrTarget | null>(null);
  const [probes, setProbes] = useState<Record<string, ProbeState>>({});
  const [pageChip, setPageChip] = useState<PageChip>("all");
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>("none");
  const [photoTurns, setPhotoTurns] = useState<Record<string, number>>({});
  const [photoLayout, setPhotoLayout] = useState<PhotoLayout>("normal");
  const [cutLines, setCutLines] = useState(true);
  const [procTick, setProcTick] = useState(0);
  const [pageNumber, setPageNumber] = useState(false);
  const [wmChoice, setWmChoice] = useState<string>("none");
  const [wmCustom, setWmCustom] = useState("");
  const [memoSize, setMemoSize] = useState<MemoSize>("normal");
  const [memoHeader, setMemoHeader] = useState(false);
  const [memoTitle, setMemoTitle] = useState("");
  const [phase, setPhase] = useState<JobPhase | null>(null);
  const [helperStatus, setHelperStatus] = useState<HelperStatus | null>(null);
  const [ippFail, setIppFail] = useState(false);
  const [healRetry, setHealRetry] = useState(false);
  const [photoDims, setPhotoDims] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState<{ pages: string[]; index: number } | null>(null);
  const [presetMark, setPresetMark] = useState<{ id: string; sig: string | null } | null>(null);
  const [appOrigin, setAppOrigin] = useState("");
  const [doneText, setDoneText] = useState<string | null>(null);
  const procCache = useRef(new Map<string, string>());
  const zoomSeq = useRef(0);
  /* 인쇄 버튼 더블클릭: state 반영 전 두 번째 클릭까지 막는 잠금 */
  const printLock = useRef(false);
  const pinRef = useRef<HTMLInputElement | null>(null);
  /* 렌더 중(효과 의존성 배열 포함) 먼저 쓰이므로 상태 바로 아래에서 계산한다 */
  const orientKey: "portrait" | "landscape" = orient === "landscape" ? "landscape" : "portrait";
  const watermarkText = wmChoice === "none" ? "" : wmChoice === "custom" ? cleanText(wmCustom, 16) : watermarkLabel(wmChoice as WatermarkPreset);
  const stamps: StampOptions = { pageNumber, watermark: watermarkText };
  /* 쪽 번호·워터마크는 테스트 페이지에는 찍지 않는다 */
  const stampActive = docKind !== "test" && stampsOn(stamps);
  const memoStyle: MemoStyle = { size: memoSize, header: memoHeader, title: memoTitle || tr("ap.memo"), date: memoToday() };
  const memoCustom = !memoIsDefault(memoStyle);
  const scanAbortRef = useRef<AbortController | null>(null);
  const stopRef = useRef(false);
  const photoUrlRef = useRef<string | null>(null);
  const albumRef = useRef<string[]>([]);
  const pdfRef = useRef<{ bytes: Uint8Array; opened: OpenedPdf } | null>(null);
  const previewReq = useRef(0);

  useEffect(() => {
    const savedTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(savedTheme);
    setUsbOk(typeof navigator !== "undefined" && "usb" in navigator);
    const rememberedSubnet = localStorage.getItem("nuguna-subnet") || "";
    if (rememberedSubnet) setSubnetInput(rememberedSubnet);
    setHistory(loadHistory());
    setAppOrigin(window.location.origin);
    setInApp(inAppBrowser());
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    if ("serviceWorker" in navigator) {
      let hadController = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController) {
          hadController = true;
          return;
        }
        window.location.reload();
      });
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const stopDisconnect = watchUsbDisconnect((usbKey) => {
      const mark = (item: Found) => (item.usbKey === usbKey ? { ...item, live: false, subtitle: tr("ap.usbOut") } : item);
      setHits((prev) => prev.map(mark));
      setExtra((prev) => prev.map(mark));
      setNotice(m("ap.usbPulled"));
    });
    const stopConnect = watchUsbConnect((device) => {
      void identifyUsb(device)
        .then((linked) => {
          const item: Found = {
            id: `usb-live:${linked.usbKey}`,
            title: linked.title,
            subtitle: linked.subtitle,
            via: "usb",
            query: linked.query,
            cmd: linked.cmd,
            live: linked.live,
            usbKey: linked.usbKey,
          };
          const merge = (prev: Found[]) => [item, ...prev.filter((row) => row.usbKey !== linked.usbKey)];
          setHits(merge);
          setExtra(merge);
          setNotice(m(linked.live ? "ap.usbBack" : "ap.usbBackNoSend"));
        })
        .catch((error: unknown) => {
          setNotice(humanError(error, tr("ap.usbOpenFail")));
        });
    });
    return () => {
      stopDisconnect();
      stopConnect();
    };
  }, []);

  useLinkParams({ setHelperUrl, setHelperCode, setUseHelper, setLinkTab, setLinkOpen, setHelperOk, setLanNote, setSubnetInput, setNotice, addWifi, rememberHost });
  useSavedHelper({ helperOk, helperUrl, helperCode, setHelperUrl, setHelperCode, setHelperStatus, setHelperOk, setUseHelper });

  /* 사진 회전·문서 보정 결과를 미리 만들어 둔다 (안 쓰는 결과는 정리) */
  useEffect(() => {
    let stop = false;
    const live = new Set(album.map((src) => procKey(src)));
    for (const [key, url] of procCache.current) {
      if (!live.has(key)) {
        URL.revokeObjectURL(url);
        procCache.current.delete(key);
      }
    }
    void (async () => {
      for (const src of album) {
        if (stop) return;
        await processedSrc(src).catch(() => src);
      }
      if (!stop) setProcTick((value) => value + 1);
    })();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album, photoTurns, photoFilter]);

  useEffect(
    () => () => {
      for (const url of procCache.current.values()) URL.revokeObjectURL(url);
      procCache.current.clear();
    },
    [],
  );

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("atlas-theme", next);
  }

  /* 폰 브라우저 주소창 색을 앱 테마와 맞춘다(라이트 웜 페이퍼 / 다크 슬레이트) */
  useEffect(() => syncThemeColor(theme), [theme]);

  /* 안드로이드 뒤로가기(앱): 열린 창 닫기 → 이전 화면 → 홈에서는 두 번 눌러 종료.
     앱(MainActivity)이 window.__nugunaBack() 을 부르고, false 면 안드로이드 기본 동작(앱 닫기)을 한다. */
  const backRef = useRef<() => boolean>(() => false);
  const exitArmed = useRef(0);
  backRef.current = () => {
    if (document.querySelector('[role="dialog"][aria-modal="true"], [role="menu"]')) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      return true;
    }
    if (sending) {
      toast(m("ph.backBusy"));
      return true;
    }
    if (step !== "connect") {
      backToConnect();
      window.scrollTo({ top: 0 });
      return true;
    }
    if (Date.now() - exitArmed.current < 2000) return false;
    exitArmed.current = Date.now();
    toast(m("ph.exit"));
    return true;
  };
  useEffect(() => {
    const host = window as { __nugunaBack?: () => boolean };
    host.__nugunaBack = () => backRef.current();
    return () => {
      delete host.__nugunaBack;
    };
  }, []);

  useEffect(() => {
    let stop = false;
    setScanning(true);
    /* 다시 스캔해도 링크·QR·검색으로 잡은 와이파이 프린터는 남긴다 (USB 목록만 새로 고침) */
    setHits((prev) => prev.filter((row) => row.host));
    (async () => {
      try {
        await usePrinterStore.persist.rehydrate();
      } catch {
        /* 저장소가 막혀 있어도 인쇄는 계속한다 */
      }
      if (stop) return;
      const usbHits: Found[] = [];
      for (const [index, device] of (await grantedUsb()).entries()) {
        const linked = await identifyUsb(device);
        if (stop) return;
        usbHits.push({
          id: `usb:${linked.usbKey}:${index}`,
          title: linked.title,
          subtitle: linked.subtitle,
          via: "usb",
          query: linked.query,
          cmd: linked.cmd,
          live: linked.live,
          usbKey: linked.usbKey,
        });
      }
      if (stop) return;
      setHits((prev) => [...usbHits, ...prev.filter((row) => row.host && !usbHits.some((u) => u.id === row.id))]);
      setScanning(false);
    })();
    return () => {
      stop = true;
    };
  }, [scanId]);

  const list = useMemo(() => {
    const fromSaved: Found[] = saved.map((item) => ({
      id: `saved:${item.uid}`,
      title: item.title,
      subtitle: m("ap.savedVia", { via: item.via }),
      via: "saved" as const,
      query: item.query,
    }));
    const seen = new Set<string>();
    const seenQuery = new Set<string>();
    const merged: Found[] = [];
    for (const item of [...hits, ...extra, ...fromSaved]) {
      const queryKey = item.query.trim().toLowerCase();
      /* 와이파이 주소가 다르면 같은 모델 복합기 2대도 따로 보여 준다 */
      if (queryKey && !item.host && seenQuery.has(queryKey)) continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      if (queryKey) seenQuery.add(queryKey);
      merged.push(item);
    }
    return merged;
  }, [saved, hits, extra]);

  useEffect(() => {
    albumRef.current = album;
  }, [album]);

  useEffect(() => {
    return () => {
      for (const url of albumRef.current) URL.revokeObjectURL(url);
      photoUrlRef.current = null;
      clearPrintRoot();
    };
  }, []);

  const selected = list.find((item) => item.id === selectedId) || null;
  const query = (overrideQuery ?? selected?.query ?? "").trim();
  const result: MatchResult | null = query ? matchQuery(query, { cmd: selected?.cmd }) : null;
  const match = result && result.kind === "match" ? result : null;
  const sure = isSure(result, query);
  const remembered = (() => {
    if (!match) return undefined;
    const title = `${match.printer.brand} ${match.printer.model}`.trim();
    const selectedUid = selected?.id.startsWith("saved:") ? selected.id.slice(6) : "";
    const byUid = selectedUid ? saved.find((item) => item.uid === selectedUid) : undefined;
    if (byUid) return byUid;
    return saved.find((item) => item.title === title || item.query === title || (query.length > 0 && (item.query === query || item.title === query)));
  })();

  function addFound(item: Found) {
    const key = item.query.trim().toLowerCase();
    const already = list.find((row) => key && row.query.trim().toLowerCase() === key);
    setExtra((prev) => [item, ...prev.filter((row) => row.id !== item.id)]);
    setSelectedId(already?.live ? already.id : item.id);
    setOverrideQuery(null);
    setAskName("");
    setNotice("");
    setStep(stageForQuery(item.query, item.cmd));
  }

  async function connectUsb(all = false) {
    if (sending) {
      setNotice(m("ap.busySending"));
      return;
    }
    setNotice("");
    try {
      const device = await pickUsb(all);
      const linked = await identifyUsb(device);
      const ids = linked.usbKey.split(":");
      diag(`USB VID=${ids[0] || "?"} PID=${ids[1] || "?"} ${linked.title} CMD=${linked.cmd || tr("ap.none")}`);
      addFound({
        id: `usb-pick:${linked.usbKey}:${linked.query}`,
        title: linked.title,
        subtitle: linked.subtitle,
        via: "usb",
        query: linked.query,
        cmd: linked.cmd,
        live: linked.live,
        usbKey: linked.usbKey,
      });
      setUsbMissed(false);
      if (linked.title.trim().length >= 2) {
        remember({ uid: `usb-${uidOf(linked.title) || uidOf(linked.query)}`, title: linked.title, query: linked.query, via: "USB", link: "usb", savedAt: Date.now() });
      }
      setNotice(m(linked.live ? "ap.usbLinked" : "ap.usbFound"));
    } catch (error) {
      setUsbMissed(true);
      setNotice(humanError(error, tr("ap.usbOpenFail")));
    }
  }

  function applyName(name: string) {
    const text = name.trim();
    if (text.length < 2 || !selected) {
      setNotice(m("ap.needName"));
      return;
    }
    setExtra((prev) => prev.map((item) => (item.id === selected.id ? { ...item, title: text, query: text } : item)));
    setOverrideQuery(text);
    setAskName("");
    setStep(stageForQuery(text, selected.cmd));
    setNotice(m("ap.recheckName"));
  }

  function onRemember() {
    if (!match || !sure) return;
    const title = `${match.printer.brand} ${match.printer.model}`.trim();
    if (title.length < 2) return;
    const item: SavedPrinter = {
      uid: uidOf(title) || uidOf(query),
      title,
      query: title,
      via: selected?.via ? viaLabel(selected.via) : tr("ap.direct"),
      savedAt: Date.now(),
    };
    remember(item);
    setSelectedId(`saved:${item.uid}`);
    setNotice(m("ap.remembered"));
  }

  function openChooser() {
    setStep("print");
    setNotice("");
  }

  function startWith(kind: DocKind) {
    setDocKind(kind);
    setStep("print");
    setNotice("");
  }

  function backToConnect() {
    if (sending) return;
    clearPrintRoot();
    setStep("connect");
    setNotice("");
  }

  function addWifi(host: string, answered: boolean, opts: { title?: string; subtitle?: Msg; query?: string; select?: boolean } & WifiExtra = {}) {
    const item: Found = {
      id: `wifi:${host}`,
      title: opts.title || tr("fx.printerIp", { ip: host }),
      subtitle: opts.subtitle || m(answered ? "ap.ippReply" : "ap.typedIp"),
      via: "wifi",
      query: opts.query || host,
      host,
      live: true,
      cmd: opts.cmd,
      ipp: opts.ipp,
      raw9100: opts.raw9100,
      canon: opts.canon,
    };
    setHits((prev) => [item, ...prev.filter((row) => row.id !== item.id)]);
    if (opts.select !== false) setSelectedId(item.id);
    return item;
  }

  /** 와이파이·PC 도우미 주소를 '최근 프린터'에 남긴다 (별칭은 유지) */
  function rememberHost(host: string, title: string, viaHelper: boolean) {
    /* 폰 내장 도우미는 'PC 도우미'가 아니라 와이파이로 표시 */
    const phoneLink = viaHelper && isPhoneHelper(helperUrl);
    remember({ uid: `wifi-${host.replace(/\./g, "-")}`, title, query: host, host, via: tr(viaHelper && !phoneLink ? "fx.helper" : "via.wifi"), link: viaHelper ? "helper" : "wifi", savedAt: Date.now() });
  }

  const { stopScan, findOnWifi, findViaHelper, pickPreset } = lanSearch({ lanBusy, sending, useHelper, helperUrl, helperCode, subnetInput, scanAbortRef, setLanBusy, setScanMode, setScanProg, setLanNote, setSubnetInput, setHelperOk, setUseHelper, addWifi });

  function addTypedIp() {
    if (sending) {
      setNotice(m("ap.busySending"));
      return;
    }
    const host = ipInput.trim();
    if (!isValidIPv4(host)) {
      setLanNote(m("ap.ipFormat"));
      return;
    }
    addWifi(host, false);
    rememberHost(host, tr("fx.printerIp", { ip: host }), useHelper);
    setLanNote(m("ap.ipChosen", { host }));
  }

  /** 최근 프린터 원터치 재연결 */
  function reconnect(item: SavedPrinter) {
    if (sending) {
      setNotice(m("ap.busySending"));
      return;
    }
    setNotice("");
    setOverrideQuery(null);
    setAskName("");
    if (item.host) {
      const viaHelper = item.link === "helper";
      if (viaHelper) setUseHelper(true);
      setLinkTab(viaHelper ? "helper" : "wifi");
      addWifi(item.host, false, { title: item.title, subtitle: m("ap.recentAt", { host: item.host }), query: item.title === tr("fx.printerIp", { ip: item.host }) || item.title.startsWith("프린터 ") ? item.host : item.title });
      setStep("print");
      return;
    }
    const key = item.query.trim().toLowerCase();
    const live = list.find((row) => row.live && row.usbKey && row.query.trim().toLowerCase() === key);
    if (live) {
      setSelectedId(live.id);
      setStep("print");
      return;
    }
    if (item.link === "usb") {
      setLinkTab("usb");
      setSelectedId(`saved:${item.uid}`);
      setNotice(m("ap.plugUsb"));
      return;
    }
    setSelectedId(`saved:${item.uid}`);
    setStep("print");
  }

  function saveAlias(uid: string) {
    rename(uid, aliasDraft);
    setEditingUid(null);
    setAliasDraft("");
  }

  function leaveInApp() {
    const url = window.location.href;
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      void navigator.clipboard.writeText(url).then(() => setNotice(m("ap.urlCopied")));
      return;
    }
    const bare = url.replace(/^https?:\/\//, "");
    window.location.href = `intent://${bare}#Intent;scheme=${window.location.protocol.replace(":", "")};package=com.android.chrome;end`;
  }

  async function choosePhotos(files: File[]) {
    if (!files.length || sending) return;
    const room = 20 - album.length;
    if (room < 1) {
      setNotice(m("ap.max20"));
      return;
    }
    const urls: string[] = [];
    let heic = false;
    for (const file of files.slice(0, room)) {
      if (/\.heic$|\.heif$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif") {
        heic = true;
        continue;
      }
      if (file.size > 12 * 1024 * 1024) {
        setNotice(m("ap.tooBig"));
        continue;
      }
      try {
        urls.push(await shrinkPhoto(file));
      } catch {
        setNotice(m("err.openPhoto"));
      }
    }
    if (heic) setNotice(m("ap.heic"));
    if (!urls.length) return;
    clearPrintRoot();
    setAlbum((prev) => [...prev, ...urls].slice(0, 20));
    setPhotoUrl(urls[0]);
    photoUrlRef.current = urls[0];
    setDocKind("photo");
  }

  function removePhoto(url: string) {
    setAlbum((prev) => {
      const next = prev.filter((item) => item !== url);
      setPhotoUrl((current) => (current === url ? next[0] ?? null : current));
      return next;
    });
    if (photoUrlRef.current === url) photoUrlRef.current = null;
    setPhotoTurns((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
    URL.revokeObjectURL(url);
  }

  function movePhoto(url: string, dir: -1 | 1) {
    setAlbum((prev) => {
      const index = prev.indexOf(url);
      const nextIndex = index + dir;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const swap = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = swap;
      return next;
    });
  }

  async function shrinkPhoto(file: File) {
    const raw = URL.createObjectURL(file);
    try {
      const image = await loadImage(raw);
      const long = Math.max(image.width, image.height);
      if (image.width * image.height < 40_000_000 && long <= 2000) return raw;
      const scale = 2000 / long;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
      URL.revokeObjectURL(raw);
      if (!blob) throw new Error(tr("err.openPhoto"));
      return URL.createObjectURL(blob);
    } catch (error) {
      URL.revokeObjectURL(raw);
      throw error;
    }
  }

  useEffect(() => {
    if (!pdfBytes) {
      setPdfCount(0);
      setPdfPreview(null);
      const previous = pdfRef.current;
      pdfRef.current = null;
      void previous?.opened.destroy();
      return;
    }
    const requestId = ++previewReq.current;
    const slot = { current: null as { cancel: () => void } | null };
    let cancel = false;
    const bytes = pdfBytes;
    void (async () => {
      try {
        if (!pdfRef.current || pdfRef.current.bytes !== bytes) {
          const previous = pdfRef.current;
          pdfRef.current = null;
          await previous?.opened.destroy();
          const opened = await openPdf(bytes, pdfKey || undefined);
          if (cancel || requestId !== previewReq.current) {
            await opened.destroy();
            return;
          }
          pdfRef.current = { bytes, opened };
          setPdfCount(opened.doc.numPages);
          setPageTo((current) => (current <= 1 ? opened.doc.numPages : Math.min(opened.doc.numPages, current)));
        }
        const opened = pdfRef.current?.opened;
        if (!opened || cancel || requestId !== previewReq.current) return;
        /* 실제로 인쇄될 시트 목록(쪽 범위 → 모아찍기 → 역순) 그대로 미리본다 */
        const sheets = sheetsFor(opened.doc.numPages);
        if (!sheets.length) {
          setPdfPreview(null);
          return;
        }
        const sheetIndex = Math.min(sheets.length - 1, Math.max(0, previewSheet - 1));
        const group = sheets[sheetIndex];
        const size = oriented(previewSize(paper));
        const mode = orient === "auto" ? "auto" : "fit";
        const free = (items: (HTMLCanvasElement | null | undefined)[]) => {
          for (const item of items) {
            if (!item) continue;
            item.width = 0;
            item.height = 0;
          }
        };
        /* 모아찍기: 미리보기 쪽이 들어가는 묶음을 실제와 같은 2분할/4분할로 보여 준다 */
        let composed: HTMLCanvasElement | null = null;
        if (nup > 1) {
          const { width: cellW, height: cellH } = nupCell(nup, size.width, size.height);
          const cells: HTMLCanvasElement[] = [];
          for (const number of group) {
            const cell = await renderPdfPage(opened.doc, number, cellW, cellH, slot, mode);
            if (!cell || cancel || requestId !== previewReq.current) {
              free([cell, ...cells]);
              return;
            }
            cells.push(cell);
          }
          composed = composeSheet(cells, cells.map((cell) => ({ width: cell.width, height: cell.height })), size.width, size.height, nup, "contain");
          free(cells);
        } else {
          composed = await renderPdfPage(opened.doc, group[0], size.width, size.height, slot, mode);
        }
        if (!composed || cancel || requestId !== previewReq.current) {
          free([composed]);
          return;
        }
        const sheetW = paperMm(paper, orient === "landscape" ? "landscape" : "portrait").width;
        const canvas = insetCanvas(composed, MARGIN_MM[margin], sheetW);
        /* 쪽 번호: 실제 출력 시트 번호 / 전체 시트 수 (인쇄 경로와 같은 규칙) */
        if (stampsOn(stamps)) stampSheet(canvas, sheetIndex, sheets.length, stamps, canvas.width / sheetW);
        setPdfPreview(canvas.toDataURL("image/jpeg", 0.82));
        free(canvas === composed ? [canvas] : [canvas, composed]);
        setPdfNeedsKey(false);
      } catch (error) {
        if (cancel || requestId !== previewReq.current) return;
        const name = error instanceof Error ? error.name : "";
        if (name === "PasswordException" || (error instanceof Error && /password/i.test(error.message))) {
          setPdfNeedsKey(true);
          setPdfPreview(null);
          setNotice(m(pdfKey ? "ap.pdfBadKey" : "ap.pdfNeedKey"));
          return;
        }
        if (chunkLoadError(error)) {
          setNotice(m("err.chunk"));
          return;
        }
        setNotice(m("ap.pdfOpenFail"));
      }
    })();
    return () => {
      cancel = true;
      slot.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfBytes, previewSheet, paper, pdfKey, orient, nup, reverse, margin, pageNumber, watermarkText, pageMode, pageList, pageFrom, pageTo]);

  useEffect(
    () => () => {
      const previous = pdfRef.current;
      pdfRef.current = null;
      void previous?.opened.destroy();
      clearPrintRoot();
    },
    [],
  );

  function choosePdf(file: File | undefined) {
    if (!file || sending) return;
    clearPrintRoot();
    void file.arrayBuffer().then((buffer) => {
      setPdfBytes(new Uint8Array(buffer));
      setPdfName(file.name);
      setPageMode("all");
      setPageChip("all");
      setPageFrom(1);
      setPageTo(1);
      setPreviewSheet(1);
      setPdfKey("");
      setPdfNeedsKey(false);
      setDocKind("pdf");
      setNotice("");
    });
  }

  const catalogPcl5 = Boolean(match && sure && !isInkjet(match) && languageIsPcl5((match.printer.languages || []).join(" ")));
  /* 앱(APK): 찾은 프린터에 맞는 인쇄 팩 — 표준(IPP) 팩이면 631로, 레이저 팩이면 내장 도우미 9100으로 */
  const phoneHelper = useHelper && isPhoneHelper(helperUrl);
  const packChoice: PackChoice | null = phoneHelper && selected?.host && !selected.usbKey
    ? packFor({
        model: match ? `${match.printer.brand} ${match.printer.model}` : selected.title,
        cmd: selected.cmd,
        ipp: selected.ipp,
        /* 직접 넣은 IP처럼 아무것도 모르면 예전처럼 9100(PCL 5e · PDF)으로 */
        raw9100: selected.raw9100 ?? selected.ipp === undefined,
        canon: selected.canon,
      })
    : null;
  const pickedPackId = selected?.host ? packPicked[`${selected.host}|${selected.title}`] : undefined;
  const activePack: PackDef | null = packChoice ? (pickedPackId ? PACKS[pickedPackId] : packChoice.need.ready ? packChoice.need : packChoice.fallback) : null;
  const helperLive = Boolean(useHelper && selected?.host && helperUrl.trim() && !(phoneHelper && activePack?.route === "ipp"));
  /* 엡손 잉크 팩: 래스터 경로를 그대로 쓰되 PCL 대신 ESC/P-R 로 만든다 */
  const escprJob = Boolean(phoneHelper && helperLive && activePack?.route === "escpr");
  /* 삼성 SPL 팩: 같은 래스터 경로, 쪽 인코더만 QPDL */
  const splModel = match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || "";
  const splJob = Boolean(phoneHelper && helperLive && activePack?.route === "spl" && splProfile(splModel));
  /** 레이저 팩(PCL) 이 아닌 래스터 팩: 머리 · 꼬리를 따로 만들고 양면은 단면만 */
  /* HP 잉크젯 팩: PCL3 컬러 래스터 */
  const pcl3Job = Boolean(phoneHelper && helperLive && activePack?.route === "pcl3" && pcl3Profile(splModel));
  /** 컬러로 보낼 수 있는 래스터 팩(엡손 · HP 잉크젯) */
  const colorJob = escprJob || pcl3Job;
  const ownRaster = escprJob || splJob || pcl3Job;
  const marginMm = MARGIN_MM[margin];
  /* 여백을 넣으면 원본 PDF를 그대로 넘길 수 없으니(PDF Direct 불가) 래스터로 보낸다 */
  /* 복사기 실제 상태 (도우미 /status 또는 USB 장치 정보) */
  const helperAlive = helperStatus?.state === "on" || helperOk;
  const usbInfo = selected?.usbKey ? { cmd: selected.cmd || "", live: Boolean(selected.live), title: selected.title } : null;
  const printer = usePrinterStatus({ host: selected?.host || "", helperUrl, helperCode, helperAlive, usb: usbInfo });
  /* 자가 복구: 복사기가 PDF 직통을 지원하지 않는다고 확인되면 PCL5e 래스터로 안전하게 분기 */
  const pdfDirectBlocked = printer.status?.source === "helper" && printer.status.capabilities.pdfDirect === false;
  const online = useOnline();
  const rasterForced = pdfDirectBlocked || Boolean(pdfKey) || nup !== 1 || reverse || pageMode !== "all" || secureOn || orient === "landscape" || marginMm > 0 || stampActive;
  const route: PrintRoute = resolvePrintRoute({
    liveUsb: Boolean(selected?.live && selected.usbKey) || helperLive,
    cmd: ownRaster ? "PCL5e" : phoneHelper && helperLive && activePack?.route === "raw" ? laserCmd(selected?.cmd) : selected?.cmd || (helperLive ? "PCL5e,PDF" : ""),
    catalogPcl5,
    catalogSure: Boolean(match && sure),
    pdfBytes: Boolean(pdfBytes),
    docKind,
    pageMode: pageMode === "list" ? "list" : pageMode,
    gray,
    pdfDirect: Boolean(pdfBytes && canPdfDirect(pdfBytes) && !rasterForced),
  });

  function oriented(size: { width: number; height: number }) {
    return orient === "landscape" ? { width: size.height, height: size.width } : size;
  }

  function pageBox() {
    const points = paperPoints(paper);
    return orient === "landscape" ? { width: points.height, height: points.width } : points;
  }

  /** PDF 쪽 캔버스에 여백(보통 10mm / 좁게 5mm)을 넣는다. 없음이면 같은 캔버스를 그대로 돌려준다. */
  function withMargin(canvas: HTMLCanvasElement) {
    if (!marginMm) return canvas;
    const out = insetCanvas(canvas, marginMm, paperMm(paper, orient === "landscape" ? "landscape" : "portrait").width);
    if (out !== canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    return out;
  }

  /* ── 쪽 번호·워터마크 / 메모 서식 / 사진 보정 공용 도우미 ── */
  function pxPerMmOf(canvas: HTMLCanvasElement) {
    return canvas.width / paperMm(paper, orientKey).width;
  }

  function stamp(canvas: HTMLCanvasElement, index: number, total: number) {
    if (stampActive) stampSheet(canvas, index, total, stamps, pxPerMmOf(canvas));
    return canvas;
  }

  /** 시스템 래스터(IPP·PDF 저장·화면 미리보기)용 메모 쪽 캔버스. 기본 서식이면 기존 렌더러 그대로. */
  async function systemMemoCanvases(text: string, frame: { width: number; height: number }, grayOn: boolean) {
    const pxPerMm = frame.width / paperMm(paper, orientKey).width;
    let pagesOut: HTMLCanvasElement[];
    if (!memoCustom) {
      const chunks = sheetMemoChunks(text, paper, frame);
      pagesOut = [];
      for (const chunk of chunks) pagesOut.push(await renderSheetCanvas({ kind: "memo", title: "", note: chunk, paper, gray: grayOn, frame }));
    } else {
      pagesOut = memoChunksStyled(text, frame.width, frame.height, memoStyle, pxPerMm).map((chunk) => {
        const canvas = document.createElement("canvas");
        canvas.width = frame.width;
        canvas.height = frame.height;
        return drawMemoStyled(canvas, chunk, memoStyle, pxPerMm);
      });
    }
    pagesOut.forEach((canvas, index) => stamp(canvas, index, pagesOut.length));
    return pagesOut;
  }

  /** 회전·문서 보정을 반영한 사진 주소 (캐시) */
  function procKey(src: string) {
    return `${src}|${photoTurns[src] || 0}|${photoFilter}`;
  }

  async function processedSrc(src: string) {
    const turn = photoTurns[src] || 0;
    if (!turn && photoFilter === "none") return src;
    const key = procKey(src);
    const hit = procCache.current.get(key);
    if (hit) return hit;
    const url = await processPhotoUrl(src, { turn, filter: photoFilter });
    /* 같은 사진을 동시에 두 번 보정했으면 먼저 끝난 결과를 쓰고 새 주소는 바로 해제(누수 방지) */
    const raced = procCache.current.get(key);
    if (raced) {
      URL.revokeObjectURL(url);
      return raced;
    }
    procCache.current.set(key, url);
    return url;
  }

  async function printSources() {
    const base = album.length ? album : photoUrl ? [photoUrl] : [];
    return Promise.all(base.map((src) => processedSrc(src).catch(() => src)));
  }

  async function focusedSource() {
    const src = photoUrl || album[0];
    return src ? processedSrc(src).catch(() => src) : null;
  }

  function linkText() {
    if (helperLive && selected?.host && !phoneHelper) return tr("ap.linkHelper", { host: selected.host });
    if (selected?.host) return tr("ap.linkWifi", { host: selected.host });
    if (selected?.live && selected.usbKey) return `USB ${selected.title}`;
    return tr("ap.linkNone");
  }

  function testInfo(forceGray = false): TestSheetInfo {
    return {
      printer: match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || "",
      link: linkText(),
      paper,
      orient: orient === "landscape" ? "landscape" : "portrait",
      gray: forceGray || gray || (route === "usb-pcl" && !colorJob),
      at: Date.now(),
    };
  }

  function docName() {
    if (docKind === "pdf") return pdfName || tr("ap.docPdf");
    if (docKind === "photo") return tr("ap.photosN", { n: album.length || (photoUrl ? 1 : 0) });
    if (docKind === "memo") return tr("ap.memo");
    return tr("ap.testPage");
  }

  function recordHistory(routeName: string, pageTotal: number) {
    setHistory(
      addHistory({
        name: docName(),
        kind: docKind,
        pages: pageTotal,
        printer: selected ? (saved.find((row) => row.host && row.host === selected.host)?.alias || selected.title) : "",
        route: routeName,
        at: Date.now(),
      }),
    );
  }

  async function canvasJpeg(canvas: HTMLCanvasElement) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    const width = canvas.width;
    const height = canvas.height;
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) throw new Error(tr("err.makeImage"));
    return { jpeg: new Uint8Array(await blob.arrayBuffer()), width, height };
  }

  async function photoSheetJpegs() {
    const sources = await printSources();
    if (!sources.length) throw new Error(tr("ap.pickPhoto"));
    const px = oriented(printPixelSize(paper));
    const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
    if (photoLayout !== "normal") {
      /* 증명사진·여권사진: 고른 사진 1장을 실물 크기로 반복 배열 */
      const src = (await focusedSource()) || sources[0];
      const image = await loadImage(src);
      const sheet = composeIdSheet(image, { width: image.naturalWidth || image.width, height: image.naturalHeight || image.height }, px.width, px.height, px.width / paperMm(paper, orientKey).width, photoLayout, cutLines);
      stamp(sheet, 0, 1);
      if (gray) grayCanvas(sheet);
      sheets.push(await canvasJpeg(sheet));
      return sheets;
    }
    const groups = nupGroups(sources.map((_, index) => index + 1), nup, reverse);
    for (const [index, group] of groups.entries()) {
      const images = await Promise.all(group.map((number) => loadImage(sources[number - 1])));
      if (nup === 1 && group.length === 1) {
        const canvas = await renderSheetCanvas({ kind: "photo", title: "", note: "", paper, image: images[0], fit: photoFit, turn: photoTurn, gray, frame: px });
        stamp(canvas, index, groups.length);
        if (gray) grayCanvas(canvas);
        sheets.push(await canvasJpeg(canvas));
      } else {
        const sheet = composeSheet(images, images.map((image) => ({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height })), px.width, px.height, nup, photoFit);
        stamp(sheet, index, groups.length);
        if (gray) grayCanvas(sheet);
        sheets.push(await canvasJpeg(sheet));
      }
    }
    return sheets;
  }

  async function buildSystem(forceColor = false): Promise<PrintJob> {
    const useGray = forceColor ? false : gray;
    const title = match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || tr("ap.print");
    const note = docKind === "memo" ? memo.trim() : tr("ap.browserCopy");
    if (docKind === "pdf" && pdfBytes) {
      const opened = await openPdf(pdfBytes, pdfKey || undefined);
      try {
        const urls: string[] = [];
        await forEachPdfSheet(opened.doc, async (canvas) => {
          urls.push(await blobUrl(canvas, 0.86));
        });
        return { kind: "pdf", pages: urls, paper, gray: useGray };
      } finally {
        await opened.destroy();
      }
    }
    if (docKind === "photo" && (photoUrl || album.length)) {
      const sheets = await photoSheetJpegs();
      const pages = sheets.map((sheet) => {
        const copy = new Uint8Array(sheet.jpeg.byteLength);
        copy.set(sheet.jpeg);
        return URL.createObjectURL(new Blob([copy], { type: "image/jpeg" }));
      });
      return { kind: "pdf", pages, paper, gray: false };
    }
    if (docKind === "memo") {
      /* 서식·쪽 번호·워터마크가 실제와 같게 직접 그린 쪽을 띄운다 */
      const canvases = await systemMemoCanvases(memo.trim(), oriented(printPixelSize(paper)), useGray);
      const urls: string[] = [];
      for (const canvas of canvases) {
        urls.push(await blobUrl(canvas, 0.92));
        canvas.width = 0;
        canvas.height = 0;
      }
      return { kind: "pdf", pages: urls, paper, gray: useGray };
    }
    if (docKind === "test") {
      /* 점검용 테스트 시트를 실제 인쇄본과 같은 그림으로 띄운다 */
      const canvas = await renderSheetCanvas({ kind: "test", title, note, paper, gray: useGray, frame: oriented(printPixelSize(paper)), test: { ...testInfo(), gray: useGray } });
      const url = await blobUrl(canvas, 0.92);
      canvas.width = 0;
      canvas.height = 0;
      return { kind: "pdf", pages: [url], paper, gray: useGray };
    }
    return { kind: "test", title, note, paper, gray: useGray };
  }

  /** 실제 출력 시트: 고른 쪽 → 모아찍기 묶음 → 역순. 미리보기·USB·IPP·PDF 저장이 모두 이 순서를 쓴다. */
  function sheetsFor(total: number) {
    const picked = currentPages(total).pages;
    return picked.length ? nupGroups(picked, docKind === "pdf" ? nup : 1, reverse) : [];
  }

  /** 시스템 래스터(화면 미리보기·IPP·PDF 저장)용: 시트를 한 장씩 그려 fn에 넘긴다 (여백·쪽 번호·워터마크 포함) */
  async function forEachPdfSheet(doc: OpenedPdf["doc"], fn: (canvas: HTMLCanvasElement, index: number, total: number) => Promise<void>, onPrep?: (done: number, total: number) => void) {
    const sheets = sheetsFor(doc.numPages);
    const size = oriented(osRasterSize(paper, sheets.length));
    const mode = orient === "auto" ? "auto" : "fit";
    for (const [index, group] of sheets.entries()) {
      onPrep?.(index, sheets.length);
      let composed: HTMLCanvasElement;
      if (nup > 1) {
        const cell = nupCell(nup, size.width, size.height);
        const cells: HTMLCanvasElement[] = [];
        for (const number of group) {
          const rendered = await renderPdfPage(doc, number, cell.width, cell.height, undefined, mode);
          if (!rendered) throw new Error(tr("ap.pdfOpenFail"));
          cells.push(rendered);
        }
        composed = composeSheet(cells, cells.map((c) => ({ width: c.width, height: c.height })), size.width, size.height, nup, "contain");
        for (const c of cells) {
          c.width = 0;
          c.height = 0;
        }
      } else {
        const rendered = await renderPdfPage(doc, group[0], size.width, size.height, undefined, mode);
        if (!rendered) throw new Error(tr("ap.pdfOpenFail"));
        composed = rendered;
      }
      const canvas = stamp(withMargin(composed), index, sheets.length);
      await fn(canvas, index, sheets.length);
      canvas.width = 0;
      canvas.height = 0;
    }
    return sheets.length;
  }

  function currentPages(total: number): { pages: number[]; error?: string } {
    if (pageMode === "list") {
      const parsed = parsePageRange(pageList, total);
      return "error" in parsed ? { pages: [], error: parsed.error } : { pages: parsed.pages };
    }
    return { pages: pageSpan(total, pageMode === "span" ? "span" : "all", pageFrom, pageTo) };
  }

  function secureOpts() {
    if (!secureOn) return undefined;
    const safePin = cleanPin(pin);
    if (!safePin) return null;
    /* PJL 헤더에 들어가는 값은 중앙 정화 함수로 한 번 더 거른다 */
    return { pin: safePin, user: pjlToken(jobUser) };
  }

  /** 앱: 이 프린터에 맞는 팩이 아직 없으면 설치 창부터 띄운다 */
  function packGate(trial: boolean, copiesOverride?: number) {
    if (!packChoice || !selected?.host) return false;
    const picked = packPicked[`${selected.host}|${selected.title}`];
    if (picked && packInstalled(picked)) return false;
    if (packChoice.need.ready && packInstalled(packChoice.need.id)) return false;
    setPackAsk({ choice: packChoice, model: selected.title, trial, copies: copiesOverride });
    return true;
  }

  function onPackReady(pack: PackDef) {
    const ask = packAsk;
    const host = selected?.host ? `${selected.host}|${selected.title}` : "";
    if (host) setPackPicked((prev) => ({ ...prev, [host]: pack.id }));
    if (!pack.builtin) diag(tr("pk.log", { pack: tr(pack.name), n: 0 }));
    setPackAsk(null);
    if (ask) window.setTimeout(() => void onPrint(ask.trial, ask.copies, true), 0);
  }

  async function onPrint(trial = false, copiesOverride?: number, packChecked = false) {
    if (sending || printLock.current) return;
    if (!packChecked && packGate(trial, copiesOverride)) return;
    printLock.current = true;
    try {
      await runPrint(trial, copiesOverride);
    } finally {
      printLock.current = false;
    }
  }

  async function runPrint(trial: boolean, copiesOverride?: number) {
    const jobCopies = copiesOverride ?? copies;
    setDoneText(null);
    const pages = trial ? [1] : docKind === "pdf" ? currentPages(pdfCount).pages : [1];
    if (!trial && docKind === "pdf") {
      const picked = currentPages(pdfCount);
      if (picked.error) {
        setNotice(picked.error);
        return;
      }
      if (!pdfBytes || picked.pages.length < 1) {
        setNotice(m("ap.pickPdf"));
        return;
      }
    }
    if (docKind === "memo" && memo.trim().length < 1) {
      setNotice(m("ap.typeMemo"));
      return;
    }
    if (docKind === "photo" && !photoUrl && album.length < 1) {
      setNotice(m("ap.pickPhoto"));
      return;
    }
    const title = match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || tr("ap.print");
    const secure = secureOpts();
    if (secure === null) {
      setNotice(m("ap.pin4"));
      return;
    }
    const note = docKind === "memo" ? memo.trim() : tr("ap.browserCopy");
    const viaHelper = helperLive;
    const jobPageCount = trial ? 1 : pageCount;
    const prep = (done: number, total: number) => setPhase({ stage: "prep", done, total, percent: total ? (done / total) * 100 : 0 });
    const sendStage = (total: number) => setPhase({ stage: "send", done: total, total, percent: 0 });
    if (selected?.host && !viaHelper && !trial) {
      setSending(true);
      setProgress(0);
      prep(0, Math.max(1, jobPageCount));
      setNotice(m("ap.sendingTo", { host: selected.host }));
      try {
        let bytes = pdfBytes;
        if (docKind === "pdf") {
          if (!bytes) throw new Error(tr("ap.pickPdf"));
          /* 원본 PDF를 그대로 못 보내는 경우(가로·여백·쪽 번호·워터마크·모아찍기·역순)는 실제 시트 순서대로 래스터 */
          if (orient === "landscape" || marginMm > 0 || stampActive || nup > 1 || reverse) {
            const opened = await openPdf(bytes, pdfKey || undefined);
            try {
              const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
              await forEachPdfSheet(
                opened.doc,
                async (canvas) => {
                  if (gray) grayCanvas(canvas);
                  sheets.push(await canvasJpeg(canvas));
                },
                prep,
              );
              bytes = new Uint8Array(await imagesToPdf(sheets, pageBox()));
            } finally {
              await opened.destroy();
            }
          } else if (pageMode !== "all") bytes = await slicePdf(bytes, pages);
        } else if (docKind === "memo") {
          const canvases = await systemMemoCanvases(note, oriented(printPixelSize(paper)), gray);
          const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
          for (const canvas of canvases) {
            prep(sheets.length, canvases.length);
            if (gray) grayCanvas(canvas);
            sheets.push(await canvasJpeg(canvas));
          }
          bytes = new Uint8Array(await imagesToPdf(sheets, pageBox()));
        } else if (docKind === "photo") {
          bytes = new Uint8Array(await imagesToPdf(await photoSheetJpegs(), pageBox()));
        } else {
          const frame = oriented(printPixelSize(paper));
          const canvas = await renderSheetCanvas({ kind: "test", title: selected.title, note, paper, gray, frame, test: testInfo() });
          if (gray) grayCanvas(canvas);
          const sheet = await canvasJpeg(canvas);
          bytes = new Uint8Array(await imagesToPdf([sheet], pageBox()));
        }
        sendStage(Math.max(1, jobPageCount));
        setProgress(45);
        await sendIppPdf(selected.host, bytes, { copies: jobCopies, duplex, paper, gray });
        setProgress(100);
        diag(tr("ap.logIpp", { host: selected.host, kind: docKind }));
        rememberHost(selected.host, selected.title, false);
        learnSubnetFromIp(selected.host);
        recordHistory("ipp", jobPageCount);
        setIppFail(false);
        const doneMsg = `${tr("ap.ippDone", { host: selected.host })}${jobCopies > 1 ? ` ${tr("ap.copiesN", { n: jobCopies })}` : ""}`;
        setNotice(doneMsg);
        setDoneText(doneMsg);
      } catch (error) {
        const message = humanError(error, tr("ap.ippFail"));
        diag(`IPP ${selected.host} ${message}`);
        setNotice(message);
        setIppFail(true);
      } finally {
        setSending(false);
        setPhase(null);
      }
      return;
    }
    const effective = trial && selected?.usbKey ? "usb-pcl" : route;
    if (effective === "preview-only" || (!selected?.usbKey && !viaHelper)) {
      setNotice(m("ap.noRoute"));
      return;
    }
    const usbKey = selected?.usbKey || "";
    /* PC 도우미(9100): 복사기는 9100 연결 하나를 작업 하나로 본다 → 작업 전체를 모았다가 한 연결로 보낸다 */
    const helperJob: Uint8Array[] = [];
    const write = async (bytes: Uint8Array, onProgress?: (percent: number) => void, shouldStop?: () => boolean, atomic = false) => {
      if (viaHelper && selected?.host) {
        helperJob.push(bytes);
        onProgress?.(100);
        return;
      }
      await sendUsbBytes(usbKey, bytes, onProgress, shouldStop, atomic);
    };
    const flushHelper = async () => {
      if (!viaHelper || !selected?.host || !helperJob.length) return;
      const total = helperJob.reduce((sum, part) => sum + part.length, 0);
      const job = new Uint8Array(total);
      let offset = 0;
      for (const part of helperJob) {
        job.set(part, offset);
        offset += part.length;
      }
      helperJob.length = 0;
      setPhase({ stage: "send", done: 1, total: 1, percent: 0 });
      setProgress(90);
      await helperSend(helperUrl, helperCode, selected.host, job);
      diag(tr("ap.logHelperSend", { n: total }));
    };
    stopRef.current = false;
    setSending(true);
    setProgress(0);
    prep(0, Math.max(1, jobPageCount));
    let started = false;
    const stop = () => stopRef.current;
    const fatalUsb = (error: unknown) => error instanceof Error && /15초|USB 연결을 닫|거절/.test(error.message);
    const escprPages: Uint8Array[][] = [];
    const escprOpts = { paper, color: !gray, name: "NUGUNA" };
    /* 페이지 캔버스 → 쪽 명령 (레이저 팩 PCL / 엡손 팩 ESC/P-R) */
    const splOpts = { paper, profile: splProfile(splModel)!, copies: jobCopies };
    const encodeSheet = (canvas: HTMLCanvasElement, mode: "dither" | "threshold") =>
      escprJob
        ? escprPageCommands(canvas, escprOpts)
        : splJob
          ? splPageCommands(canvas, { ...splOpts, mode })
          : pcl3Job
            ? pcl3PageCommands(canvas, { paper, color: !gray, profile: pcl3Profile(splModel)! })
            : canvasPclCommands(canvas, mode);
    const sendPackets = async (commands: Uint8Array[], progress: (percent: number) => void) => {
      if (ownRaster) {
        escprPages.push(commands);
        progress(100);
        return;
      }
      const packets = bundleCommands(commands);
      for (const [index, packet] of packets.entries()) {
        if (stopRef.current) throw new Error(tr("ap.stopped"));
        await write(packet, () => progress(Math.round(((index + 1) / packets.length) * 100)), () => false, true);
      }
    };
    try {
      if (effective === "usb-pdf" && pdfBytes && !trial) {
        const bytes = wrapPdfJob(pdfBytes, { copies: jobCopies, duplex, paper, pages: Math.max(1, pdfCount), secure });
        sendStage(Math.max(1, pdfCount));
        setProgress(8);
        await write(bytes, (percent) => setProgress(8 + Math.round(percent * 0.92)), stop);
        await flushHelper();
      } else {
        const size = oriented(printableSize(paper));
        /* PCL 300dpi: 1mm = 300/25.4 px (증명사진 실물 크기·쪽 번호 크기의 기준) */
        const pclPxPerMm = 300 / 25.4;
        const memoChunks = !trial && docKind === "memo" ? (memoCustom ? memoChunksStyled(note, size.width, size.height, memoStyle, pclPxPerMm) : officeMemoChunks(note, size.width, size.height)) : null;
        const sources = !trial && docKind === "photo" ? await printSources() : [];
        const idSheet = docKind === "photo" && photoLayout !== "normal" && sources.length > 0;
        const photoGroups = idSheet ? [[1]] : nupGroups(sources.map((_, index) => index + 1), nup, reverse);
        const pdfGroups = nupGroups(pages, nup, reverse);
        const jobPages = trial ? 1 : docKind === "pdf" ? Math.max(1, pdfGroups.length) : memoChunks?.length || photoGroups.length || 1;
        if (!ownRaster) await write(pclJobHeader({ copies: jobCopies, duplex, paper, pages: jobPages, secure, orient: orient === "landscape" ? "landscape" : "portrait" }), () => setProgress(2), stop, true);
        started = true;
        if (stopRef.current) throw new Error(tr("ap.stopped"));
        if (!trial && docKind === "pdf" && pdfBytes) {
          const opened = await openPdf(pdfBytes, pdfKey || undefined);
          try {
            const { width: cellW, height: cellH } = nupCell(nup, size.width, size.height);
            for (const [index, group] of pdfGroups.entries()) {
              if (stopRef.current) throw new Error(tr("ap.stopped"));
              prep(index, pdfGroups.length);
              const rendered: HTMLCanvasElement[] = [];
              for (const number of group) {
                const canvas = await renderPdfPage(opened.doc, number, cellW, cellH, undefined, orient === "auto" ? "auto" : "fit");
                if (!canvas || stopRef.current) {
                  canvas?.width && (canvas.width = 0);
                  throw new Error(tr("ap.stopped"));
                }
                rendered.push(canvas);
              }
              const composed = nup === 1 && rendered[0] ? rendered[0] : composeSheet(rendered, rendered.map((canvas) => ({ width: canvas.width, height: canvas.height })), size.width, size.height, nup, "contain");
              /* 여백: 묶음 한 장 전체를 안쪽으로 줄인다 (없음이면 composed 그대로) */
              const sheet = insetCanvas(composed, marginMm, paperMm(paper, orient === "landscape" ? "landscape" : "portrait").width);
              if (stampActive) stampSheet(sheet, index, pdfGroups.length, stamps, pclPxPerMm);
              const commands = encodeSheet(sheet, "dither");
              sendStage(pdfGroups.length);
              for (const canvas of rendered) {
                canvas.width = 0;
                canvas.height = 0;
              }
              if (composed !== rendered[0]) {
                composed.width = 0;
                composed.height = 0;
              }
              if (sheet !== composed) {
                sheet.width = 0;
                sheet.height = 0;
              }
              await sendPackets(commands, () => setProgress(Math.round(4 + ((index + 1) / pdfGroups.length) * 90)));
            }
            if (!ownRaster && needsBlankBack(pdfGroups.length, duplex)) {
              await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
            }
          } finally {
            await opened.destroy();
          }
        } else if (memoChunks) {
          const groups = nup === 1 && !reverse ? memoChunks.map((chunk) => [chunk]) : nupGroups(memoChunks.map((_, index) => index + 1), nup, reverse).map((group) => group.map((number) => memoChunks[number - 1]));
          for (const [index, group] of groups.entries()) {
            if (stopRef.current) throw new Error(tr("ap.stopped"));
            prep(index, groups.length);
            const cells = group.map((chunk) => {
              const canvas = document.createElement("canvas");
              if (memoCustom) {
                /* 서식 메모: 한 장 크기로 그린 뒤 모아찍기 칸에 축소 (화면 미리보기와 같은 모양) */
                canvas.width = size.width;
                canvas.height = size.height;
                return drawMemoStyled(canvas, chunk, memoStyle, pclPxPerMm);
              }
              const cell = nupCell(nup, size.width, size.height);
              canvas.width = cell.width;
              canvas.height = cell.height;
              drawOfficePage(canvas, { kind: "memo", title, note: chunk, gray: true });
              return canvas;
            });
            const sheet = nup === 1 ? cells[0] : composeSheet(cells, cells.map((canvas) => ({ width: canvas.width, height: canvas.height })), size.width, size.height, nup, "contain");
            if (stampActive) stampSheet(sheet, index, groups.length, stamps, pclPxPerMm);
            /* 연한 워터마크는 문턱값으로 보내면 사라지므로 디더링 */
            const commands = encodeSheet(sheet, stamps.watermark.trim() ? "dither" : "threshold");
            sendStage(groups.length);
            for (const canvas of cells) {
              canvas.width = 0;
              canvas.height = 0;
            }
            await sendPackets(commands, () => setProgress(Math.round(8 + ((index + 1) / groups.length) * 84)));
          }
          if (!ownRaster && needsBlankBack(groups.length, duplex)) {
            await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
          }
        } else if (docKind === "photo" && sources.length) {
          for (const [index, group] of photoGroups.entries()) {
            if (stopRef.current) throw new Error(tr("ap.stopped"));
            prep(index, photoGroups.length);
            if (idSheet) {
              const src = (await focusedSource()) || sources[0];
              const image = await loadImage(src);
              const sheet = composeIdSheet(image, { width: image.naturalWidth || image.width, height: image.naturalHeight || image.height }, size.width, size.height, pclPxPerMm, photoLayout, cutLines);
              stampSheet(sheet, 0, 1, stamps, pclPxPerMm);
              const commands = encodeSheet(sheet, "dither");
              sheet.width = 0;
              sheet.height = 0;
              sendStage(1);
              await sendPackets(commands, () => setProgress(92));
              continue;
            }
            const images = await Promise.all(group.map((number) => loadImage(sources[number - 1])));
            const sheet = composeSheet(images, images.map((image) => ({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height })), size.width, size.height, nup === 1 && group.length === 1 ? 1 : nup, photoFit);
            if (stampActive && !photoTurn) stampSheet(sheet, index, photoGroups.length, stamps, pclPxPerMm);
            sendStage(photoGroups.length);
            if (photoTurn) {
              const turned = document.createElement("canvas");
              turned.width = size.width;
              turned.height = size.height;
              const ctx = turned.getContext("2d");
              ctx?.translate(size.width / 2, size.height / 2);
              ctx?.rotate((photoTurn * Math.PI) / 180);
              ctx?.drawImage(sheet, -size.width / 2, -size.height / 2);
              sheet.width = 0;
              if (stampActive) stampSheet(turned, index, photoGroups.length, stamps, pclPxPerMm);
              const commands = encodeSheet(turned, "dither");
              turned.width = 0;
              turned.height = 0;
              await sendPackets(commands, () => setProgress(Math.round(8 + ((index + 1) / photoGroups.length) * 84)));
            } else {
              const commands = encodeSheet(sheet, "dither");
              sheet.width = 0;
              sheet.height = 0;
              await sendPackets(commands, () => setProgress(Math.round(8 + ((index + 1) / photoGroups.length) * 84)));
            }
          }
          if (!ownRaster && needsBlankBack(photoGroups.length, duplex)) {
            await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
          }
        } else {
          const canvas = document.createElement("canvas");
          canvas.width = size.width;
          canvas.height = size.height;
          /* 점검용 테스트 시트: 농도 막대가 살도록 디더링으로 보낸다 */
          drawTestSheet(canvas, testInfo(!colorJob));
          if (stopRef.current) throw new Error(tr("ap.stopped"));
          const commands = encodeSheet(canvas, "dither");
          canvas.width = 0;
          canvas.height = 0;
          sendStage(1);
          await sendPackets(commands, (percent) => setProgress(8 + Math.round(percent * 0.84)));
          if (!ownRaster && needsBlankBack(1, duplex)) {
            await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
          }
        }
        if (stopRef.current) throw new Error(tr("ap.stopped"));
        if (pcl3Job) {
          /* HP 잉크젯: 리셋 · 용지 · 부수 → 쪽들 → 리셋 */
          const parts: Uint8Array[] = [pcl3JobHeader({ paper, copies: jobCopies })];
          for (const pageCommands of escprPages) parts.push(...pageCommands);
          parts.push(pcl3JobFooter());
          await write(concatBytes(parts), () => setProgress(100), () => false, true);
        } else if (splJob) {
          /* 삼성 SPL: PJL 머리 → 쪽들(쪽 머리에 부수가 들어 있어 되풀이하지 않음) → 꼬리 */
          const parts: Uint8Array[] = [splJobHeader({ name: "nuguna" })];
          for (const pageCommands of escprPages) parts.push(...pageCommands);
          parts.push(splJobFooter());
          await write(concatBytes(parts), () => setProgress(100), () => false, true);
        } else if (escprJob) {
          /* 엡손: 머리말 → (부수만큼) 쪽들 → 꼬리말. 쪽 끝(endp)은 다음 쪽이 있는지 알고 붙인다 */
          const sheets: Uint8Array[][] = [];
          for (let copy = 0; copy < Math.max(1, jobCopies); copy++) sheets.push(...escprPages);
          const parts: Uint8Array[] = [escprJobHeader(escprOpts)];
          sheets.forEach((pageCommands, index) => {
            parts.push(...pageCommands, escprEndPage(index < sheets.length - 1));
          });
          parts.push(escprJobFooter());
          await write(concatBytes(parts), () => setProgress(100), () => false, true);
        } else await write(pclJobFooter(), () => setProgress(100), () => false, true);
        /* 도우미: 머리말~꼬리말까지 모은 작업을 이제 한 번에 (멈춤·오류면 아무것도 보내지 않는다) */
        await flushHelper();
        setProgress(100);
        started = false;
      }
      if (stopRef.current) {
        setNotice(m("ap.stopped"));
        return;
      }
      diag(tr("ap.logSent", { via: viaHelper ? "Helper 9100" : "USB", route: effective, kind: docKind }));
      if (viaHelper && selected?.host) {
        rememberHost(selected.host, selected.title, true);
        learnSubnetFromIp(selected.host);
      }
      recordHistory(viaHelper ? "helper9100" : effective === "usb-pdf" ? "usb-pdf" : "usb-pcl", jobPageCount);
      const doneMsg = `${tr(secure ? (viaHelper ? "ap.secureHelper" : "ap.secureUsb") : viaHelper ? (phoneHelper ? "ph.sent" : "ap.sentHelper") : "ap.sentUsb")}${jobCopies > 1 ? ` ${tr("ap.copiesN", { n: jobCopies })}` : ""}`;
      setNotice(doneMsg);
      if (!trial) setDoneText(doneMsg);
    } catch (error) {
      helperJob.length = 0;
      if (started && !fatalUsb(error) && !viaHelper) {
        try {
          await write(pclAbortFooter(), undefined, () => false, true);
        } catch {
          /* 이미 끊긴 복사기 */
        }
      }
      if (fatalUsb(error) && selected?.usbKey) {
        const mark = (item: Found) => (item.usbKey === selected.usbKey ? { ...item, live: false, subtitle: tr("ap.usbClosed") } : item);
        setHits((prev) => prev.map(mark));
        setExtra((prev) => prev.map(mark));
      }
      if (stopRef.current) {
        setNotice(m("ap.stopped"));
        return;
      }
      if (!started) {
        const message = humanError(error, tr("ap.sendFail"));
        diag(tr("ap.logFail", { v: message }));
        setNotice(m("ap.failHint", { msg: message }));
        return;
      }
      setNotice(humanError(error, tr("ap.cutOff")));
    } finally {
      setSending(false);
      setPhase(null);
    }
  }

  /** 완료 배너: 다른 파일 바로 고르기 */
  function pickAnother() {
    setDoneText(null);
    if (docKind === "memo") {
      setMemo("");
      setNotice(m("ap.newMemo"));
      return;
    }
    if (docKind === "test") {
      setDocKind("pdf");
    }
    const kind = docKind === "photo" ? "photo" : "pdf";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = kind === "photo" ? "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp" : "application/pdf,.pdf";
    input.multiple = kind === "photo";
    input.addEventListener("change", () => {
      const files = [...(input.files ?? [])];
      if (!files.length) return;
      if (kind === "photo") {
        for (const url of album) URL.revokeObjectURL(url);
        setAlbum([]);
        setPhotoUrl(null);
        void choosePhotos(files);
      } else choosePdf(files[0]);
    });
    input.click();
  }

  async function onColorPrint() {
    if (sending) return;
    await printSheet(await buildSystem(true));
    setNotice(dialogNotice(tr("ap.previewShown")));
  }

  function dialogNotice(base: string) {
    const count = docKind === "pdf" ? currentPages(pdfCount).pages.length : 0;
    const safari = typeof navigator !== "undefined" && /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|Edg|Android/i.test(navigator.userAgent);
    const notes = [base];
    if (count > 30) notes.push(tr("ap.over30"));
    if (safari && paper !== "A4") notes.push(tr("ap.checkPaper"));
    return notes.join(" ");
  }

  const chosenPages = currentPages(pdfCount).pages;
  const readyDoc = docKind === "test" || (docKind === "photo" ? Boolean(photoUrl || album.length) : docKind === "memo" ? memo.trim().length > 0 : Boolean(pdfBytes && chosenPages.length && !pdfNeedsKey));

  /* 예상 출력 요약 바 */
  const memoPages = useMemo(() => {
    if (typeof document === "undefined" || !memo.trim()) return 1;
    try {
      const base = printPixelSize(paper);
      const frame = orient === "landscape" ? { width: base.height, height: base.width } : base;
      if (memoCustom) return Math.max(1, memoChunksStyled(memo.trim(), frame.width, frame.height, memoStyle, frame.width / paperMm(paper, orient === "landscape" ? "landscape" : "portrait").width).length);
      return Math.max(1, sheetMemoChunks(memo.trim(), paper, frame).length);
    } catch {
      return 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memo, paper, orient, memoSize, memoHeader, memoTitle]);
  const idLayout = docKind === "photo" && photoLayout !== "normal";
  const pageCount = docKind === "pdf" ? chosenPages.length : docKind === "photo" ? (idLayout ? (photoUrl || album.length ? 1 : 0) : album.length || (photoUrl ? 1 : 0)) : docKind === "memo" ? memoPages : 1;
  const effNup = docKind === "test" || idLayout ? 1 : nup;
  const jobControls = route !== "preview-only" || Boolean(selected?.host);
  const monoOut = gray || route === "usb-pcl";
  const sheetFaces = Math.ceil(pageCount / effNup);
  const sheetCopies = jobControls ? copies : 1;
  const twoSided = jobControls && duplex !== "simplex";
  const paperSheets = (twoSided ? Math.ceil(sheetFaces / 2) : sheetFaces) * sheetCopies;
  const summaryParts = [
    paper,
    orient === "landscape" ? tr("ap.land") : "",
    tr(monoOut ? "ap.gray" : "ap.color"),
    tr(twoSided ? (duplex === "long" ? "ap.dupLong" : "ap.dupShort") : "ap.simplex"),
    effNup > 1 ? tr("ap.nup", { n: effNup }) : "",
    docKind === "pdf" && marginMm ? tr("ap.margin", { v: marginLabel(margin) }) : "",
    tr("ap.copies", { n: sheetCopies }),
  ].filter(Boolean);
  const summaryText = readyDoc && pageCount > 0 ? tr("ap.summary", { parts: summaryParts.join(" · "), n: paperSheets }) : tr("ap.summaryEmpty");

  /* 드래그 앤 드롭 · Ctrl+V: 최신 핸들러를 ref로 넘긴다 */
  const dropRef = useRef<(files: File[], pasted: boolean) => void>(() => undefined);
  dropRef.current = (files: File[], pasted: boolean) => {
    if (sending) return;
    const textFile = files.find((file) => /\.(txt|md|markdown)$/i.test(file.name) || file.type === "text/plain" || file.type === "text/markdown");
    if (textFile && !pasted) {
      void onTextFile(textFile);
      return;
    }
    const pdf = files.find((file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name));
    const images = files.filter((file) => file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name));
    if (pdf && !pasted) {
      choosePdf(pdf);
      setDocKind("pdf");
      setStep("print");
      setNotice(m("ap.opened", { name: pdf.name }));
      return;
    }
    if (images.length) {
      void choosePhotos(images);
      setDocKind("photo");
      setStep("print");
      setNotice(pasted ? m("ap.pasted") : m("ap.addedPhotos", { n: images.length }));
      return;
    }
    if (pdf) {
      choosePdf(pdf);
      setDocKind("pdf");
      setStep("print");
      return;
    }
    if (!pasted) setNotice(m("ap.onlyPdfImg"));
  };

  useFileDrop(dropRef, setDragOver);

  /* 사진: 회전·보정이 반영된 주소로 미리보기 (procTick이 바뀌면 다시 계산) */
  void procTick;
  const shownAlbum = album.map((src) => procCache.current.get(procKey(src)) || src);
  const shownPhoto = photoUrl ? shownAlbum[album.indexOf(photoUrl)] ?? photoUrl : null;

  /* 프리셋 */
  const presetCurrent: PresetSettings = { gray, duplex, nup, margin, secure: secureOn };
  /* 프리셋 하이라이트 판정용: 프리셋이 안 건드리는 옵션까지 포함한 '지금 설정' 서명 */
  const optionSig = JSON.stringify([gray, duplex, nup, margin, secureOn, pageMode, pageList, pageFrom, pageTo, reverse, pageNumber, watermarkText, orient, paper, photoLayout, photoFilter]);
  const activePresetId = presetMark && presetMark.sig === optionSig ? presetMark.id : null;
  useEffect(() => {
    /* 적용 직후 한 번: 바뀐 상태로 서명을 찍어 둔다 */
    if (presetMark && presetMark.sig === null) setPresetMark({ id: presetMark.id, sig: optionSig });
  }, [presetMark, optionSig]);
  function applyPreset(preset: Preset) {
    setPresetMark({ id: preset.id, sig: null });
    const p = preset.settings;
    setGray(p.gray);
    setDuplex(p.duplex);
    setNup(p.nup);
    setMargin(p.margin);
    setSecureOn(p.secure);
    setNotice(m("ap.presetApplied", { name: preset.label, hint: preset.hint }));
    if (p.secure) {
      setAdvancedOpen(true);
      window.setTimeout(() => pinRef.current?.focus(), 80);
    }
  }

  /* 쪽 범위 원터치 칩 */
  function pickPages(chip: PageChip) {
    setPageChip(chip);
    setPreviewSheet(1);
    if (chip === "all") {
      setPageMode("all");
      return;
    }
    const total = Math.max(1, pdfCount);
    const all = Array.from({ length: total }, (_, index) => index + 1);
    setPageMode("list");
    if (chip === "current") {
      const sheet = sheetsFor(total)[Math.max(0, previewSheet - 1)];
      setPageList(String(sheet?.[0] ?? 1));
    }
    else if (chip === "odd") setPageList(all.filter((n) => n % 2 === 1).join(","));
    else if (chip === "even") setPageList(all.filter((n) => n % 2 === 0).join(",") || "2");
    else if (pageChip !== "custom") setPageList("");
  }

  /** 직접 입력: 쪽 번호 토글 (입력칸 문자열과 양방향 동기화, 1-3,5 형태로 압축) */
  function togglePage(n: number) {
    const total = Math.max(1, pdfCount);
    const parsed = parsePageRange(pageList, total);
    const set = new Set("pages" in parsed ? parsed.pages : []);
    if (set.has(n)) set.delete(n);
    else set.add(n);
    const sorted = [...set].sort((a, b) => a - b);
    const parts: string[] = [];
    for (let i = 0; i < sorted.length; ) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
      parts.push(j > i + 1 ? `${sorted[i]}-${sorted[j]}` : j === i + 1 ? `${sorted[i]},${sorted[j]}` : String(sorted[i]));
      i = j + 1;
    }
    setPageMode("list");
    setPageList(parts.join(","));
  }

  const printSheets = docKind === "pdf" && pdfCount ? sheetsFor(pdfCount) : [];
  const currentPage = printSheets[Math.min(printSheets.length - 1, previewSheet - 1)]?.[0] ?? 1;
  const onTogglePage = togglePage;
  const onPresetSaved = (preset: Preset) => setPresetMark({ id: preset.id, sig: null });
  const onPhotoFilter = setPhotoFilter;

  /** 증명·여권사진으로 바꾸면 문서 필터를 원본으로 (얼굴이 하얗게 날아가는 사고 방지) */
  function onPhotoLayout(value: PhotoLayout) {
    setPhotoLayout(value);
    if (value !== "normal" && photoFilter !== "none") {
      setPhotoFilter("none");
      setNotice(m("ap.idOriginal"));
    }
  }

  /** .txt · .md → 메모 탭 본문 */
  async function onTextFile(file: File) {
    if (file.size > 1024 * 1024) {
      setNotice(m("ap.text1mb"));
      return;
    }
    const text = (await file.text()).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    setMemo(text);
    setDocKind("memo");
    setStep("print");
    setNotice(m("ap.textLoaded", { name: file.name, n: text.length.toLocaleString() }));
  }

  function onLauncher(os: "win" | "mac") {
    if (!appOrigin) return;
    if (os === "win") downloadText(launcherFileName("win"), windowsLauncher(appOrigin), "application/bat");
    else downloadText(launcherFileName("mac"), macLauncher(appOrigin), "application/x-sh");
    setLanNote(m(os === "win" ? "ap.batHint" : "ap.cmdHint"));
  }

  /** 미리보기 확대: 실제 인쇄 해상도로 모든 시트를 만들어 크게 본다 */
  async function openZoom() {
    if (!readyDoc) return;
    /* 확대 버튼 연타·만드는 중 닫기: 마지막 요청만 화면에 올리고 나머지 주소는 바로 해제 */
    const seq = ++zoomSeq.current;
    try {
      const job = await buildSystem(false);
      if (seq !== zoomSeq.current) {
        if (job.kind === "pdf") for (const url of job.pages) URL.revokeObjectURL(url);
        return;
      }
      if (job.kind === "pdf" && job.pages.length) setZoom({ pages: job.pages, index: docKind === "pdf" ? Math.max(0, previewSheet - 1) : 0 });
    } catch (error) {
      setNotice(humanError(error, tr("ap.zoomFail")));
    }
  }

  function closeZoom() {
    zoomSeq.current += 1;
    for (const url of zoom?.pages ?? []) URL.revokeObjectURL(url);
    setZoom(null);
  }

  /* 사전 점검용: 고른 사진의 실제 픽셀 크기(회전 반영) */
  useEffect(() => {
    if (!photoUrl) {
      setPhotoDims(null);
      return;
    }
    let stop = false;
    const turn = photoTurns[photoUrl] || 0;
    void loadImage(photoUrl)
      .then((img) => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!stop) setPhotoDims(turn === 90 || turn === 270 ? { w: h, h: w } : { w, h });
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [photoUrl, photoTurns]);

  /* 자가 복구: IPP가 막히면 살아 있는 PC 도우미(9100)로 바꿔 곧바로 다시 보낸다 */
  useEffect(() => {
    if (!healRetry || !helperLive || sending) return;
    setHealRetry(false);
    void onPrint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healRetry, helperLive, sending]);

  function onPreflight(kind: PreflightAction) {
    if (kind === "refresh-status") {
      void printer.refresh();
      return;
    }
    setNup(2);
    if (kind === "save-paper" && jobControls) setDuplex("long");
    setNotice(m(kind !== "nup2" && jobControls ? "ap.toSaver" : "ap.toNup2"));
  }

  function onDiagFix(action: DiagFix) {
    if (action === "reload") return window.location.reload();
    if (action === "open-chrome") return leaveInApp();
    if (action === "refresh-status") return void printer.refresh();
    setShowDiag(false);
    if (action === "pcl-trial") return void onPrint(true);
    setStep("connect");
    setLinkOpen(true);
    setLinkTab(action === "wifi-tab" ? "wifi" : "helper");
    if (action === "launcher") setLanNote(m("ap.getLauncher"));
  }

  function evenReverse() {
    pickPages("even");
    setReverse(true);
    setNotice(m("ap.evenRev"));
  }

  /* 최근 프린터 온라인 확인 */
  async function checkPrinter(item: SavedPrinter) {
    if (!item.host) return;
    const host = item.host;
    setProbes((prev) => ({ ...prev, [item.uid]: { state: "checking" } }));
    try {
      if (useHelper && helperUrl.trim()) {
        const hit = await helperProbe(helperUrl, helperCode, host);
        setProbes((prev) => ({ ...prev, [item.uid]: { state: hit.open ? "on" : "off", ms: hit.ms, via: "9100" } }));
        if (hit.open) learnSubnetFromIp(host);
        return;
      }
      /* 도우미 없이: 브라우저로 631 응답 시간만 잰다 */
      const started = performance.now();
      const ac = new AbortController();
      const timer = window.setTimeout(() => ac.abort(), 1500);
      let open = false;
      try {
        await fetch(`http://${host}:631/ipp/print`, { mode: "no-cors", cache: "no-store", signal: ac.signal, targetAddressSpace: "local" } as RequestInit);
        open = true;
      } catch {
        open = false;
      } finally {
        window.clearTimeout(timer);
      }
      setProbes((prev) => ({ ...prev, [item.uid]: { state: open ? "on" : "off", ms: open ? Math.round(performance.now() - started) : null, via: "631" } }));
    } catch (error) {
      setProbes((prev) => ({ ...prev, [item.uid]: { state: "off", ms: null } }));
      setNotice(humanError(error, tr("ap.checkFail")));
    }
  }

  const helperShare = useHelper && helperUrl.trim() && helperCode ? { url: helperUrl.trim(), code: helperCode } : null;

  const routeLabel = helperLive && route !== "preview-only" ? tr(phoneHelper ? "ph.route" : "ap.rHelper") : route === "usb-pdf" ? "USB PDF Direct" : route === "usb-pcl" ? tr("ap.rUsbPcl") : selected?.host ? tr("ap.routeIpp") : tr("ap.rSave");
  const recentPrinters = saved.slice(0, 6);
  const foundList = list.filter((item) => !item.id.startsWith("saved:"));

  async function onPdf() {
    if (!readyDoc || sending) return;
    try {
      if (docKind === "pdf" && pdfBytes) {
        if (!gray && !marginMm && !stampActive && nup === 1 && !reverse) {
          const bytes = pageMode === "all" ? pdfBytes : await slicePdf(pdfBytes, chosenPages);
          downloadBytes(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), pdfName || tr("ap.docPdf"));
          return;
        }
        const opened = await openPdf(pdfBytes, pdfKey || undefined);
        try {
          const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
          await forEachPdfSheet(opened.doc, async (canvas) => {
            if (gray) grayCanvas(canvas);
            const width = canvas.width;
            const height = canvas.height;
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
            if (!blob) throw new Error(tr("ap.pdfFail"));
            sheets.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), width, height });
          });
          const bytes = await imagesToPdf(sheets, pageBox());
          downloadBytes(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), pdfName || tr("ap.docPdf"));
        } finally {
          await opened.destroy();
        }
        return;
      }
      if (docKind === "memo") {
        const canvases = await systemMemoCanvases(memo.trim(), oriented(printPixelSize(paper)), gray);
        const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
        for (const canvas of canvases) {
          if (gray) grayCanvas(canvas);
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
          const width = canvas.width;
          const height = canvas.height;
          canvas.width = 0;
          canvas.height = 0;
          if (!blob) throw new Error(tr("ap.pdfFail"));
          sheets.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), width, height });
        }
        const bytes = await imagesToPdf(sheets, pageBox());
        downloadBytes(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), tr("ap.memoPdf"));
        return;
      }
      if (docKind === "photo") {
        const sheets = await photoSheetJpegs();
        const bytes = await imagesToPdf(sheets, pageBox());
        downloadBytes(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), tr("ap.photoPdf"));
        return;
      }
      const frame = oriented(printPixelSize(paper));
      const canvas = await renderSheetCanvas({
        kind: "test",
        title: match ? `${match.printer.brand} ${match.printer.model}` : tr("ap.print"),
        note: tr("ap.browserCopy"),
        paper,
        gray,
        frame,
        test: testInfo(),
      });
      if (gray) grayCanvas(canvas);
      const page = pageBox();
      await downloadCanvasPdf(canvas, tr("ap.testPdf"), page);
    } catch (error) {
      setNotice(humanError(error, tr("ap.pdfFail")));
    }
  }

  const statusDot = selected?.live && selected.usbKey ? "dot-usb" : helperLive && !phoneHelper ? "dot-helper" : selected?.host ? "dot-wifi" : "dot-idle";
  const statusText = tr(selected?.live && selected.usbKey ? "ap.stUsb" : phoneHelper && selected?.host ? "ph.st" : helperLive ? "ap.stHelper" : selected?.host ? "ap.stWifi" : "ap.stPreview");
  const selectedName = selected ? (saved.find((row) => (row.host && row.host === selected.host) || `saved:${row.uid}` === selected.id)?.alias || selected.title) : "";

  return (
    <main data-lang={lang} className="shell mx-auto flex w-full max-w-lg flex-col gap-3 px-4 py-5 sm:py-8">
      {dragOver ? (
        <div className="drop-veil" aria-live="polite">
          <div className="drop-card">
            <Upload className="size-6" aria-hidden="true" />
            <p className="mt-2 text-base font-semibold">{tr("ap.dropTitle")}</p>
            <p className="mt-1 text-sm">{tr("ap.dropSub")}</p>
          </div>
        </div>
      ) : null}
      {inApp ? (
        <div className="card px-4 py-3 text-sm leading-relaxed">
          <p>{tr("ap.inApp")}</p>
          <button type="button" onClick={leaveInApp} className="btn-solid mt-3 h-11 w-full rounded-2xl text-sm font-medium">
            {tr(isIos ? "ap.copyUrl" : "ap.openChrome")}
          </button>
        </div>
      ) : null}
      {/* 상단바 — 큰 제목 + 테두리 없는 아이콘 버튼, 스크롤하면 반투명 유리 */}
      <header className="app-header">
        {/* 제목을 누르면 홈(프린터 · 인쇄하기)으로 — 홈이 아니면 집 아이콘으로 알려 준다 */}
        <h1 className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              if (step === "connect") window.scrollTo({ top: 0, behavior: "smooth" });
              else backToConnect();
            }}
            disabled={sending}
            className="home-link"
            aria-label={step === "connect" ? tr("app.title") : `${tr("app.title")} · ${tr("ap.home")}`}
            title={tr("ap.home")}
          >
            {step === "connect" ? null : <HouseIcon className="home-link-icon" aria-hidden="true" />}
            <span className="truncate">{tr("app.title")}</span>
          </button>
        </h1>
        <div className="-mr-2 flex shrink-0 items-center">
          <LangSwitcher />
          <button
            type="button"
            onClick={() => {
              setSupportTab("help");
              setShowDiag(true);
            }}
            className="icon-btn inline-flex size-10 items-center justify-center rounded-full"
            aria-label={tr("ap.helpAria")}
            title={tr("ap.helpAria")}
          >
            <CircleHelp className="size-6" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="icon-btn inline-flex size-10 items-center justify-center rounded-full"
            aria-label={tr(theme === "dark" ? "ap.light" : "ap.dark")}
            title={tr(theme === "dark" ? "ap.light" : "ap.dark")}
          >
            {theme === "dark" ? <Sun className="size-6" /> : <Moon className="size-6" />}
          </button>
        </div>
      </header>
      {/* 앱으로 낼 거라 소개 문구는 없앰 — 오프라인일 때만 안내 */}
      {online === false ? (
        <div className="app-sub">
          <p className="offline-badge inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" role="status">
            {tr("ap.offline")}
          </p>
        </div>
      ) : null}
      {zoom ? <PreviewZoomModal pages={zoom.pages} start={zoom.index} onClose={closeZoom} /> : null}
      {qrTarget ? <PrinterQrModal target={qrTarget} onClose={() => setQrTarget(null)} /> : null}
      {packAsk ? <PackSheet choice={packAsk.choice} model={packAsk.model} onReady={onPackReady} onClose={() => setPackAsk(null)} /> : null}
      {showDiag ? (
        <SupportCenter
          tab={supportTab}
          onTab={setSupportTab}
          onClose={() => setShowDiag(false)}
          history={history}
          onClearHistory={() => {
            clearHistory();
            setHistory([]);
          }}
          route={routeLabel}
          printer={selectedName}
          onRestored={() => void usePrinterStore.persist.rehydrate()}
          diag={
            <DiagPanel
              ctx={{
                helperUrl,
                helperCode,
                helperConfigured: Boolean(helperUrl.trim()) && (useHelper || helperOk || Boolean(helperStatus)),
                host: selected?.host || "",
                usb: usbInfo,
                canTrial: Boolean(selected?.usbKey || helperLive),
                printerName: selectedName,
                routeLabel,
                getStatus: printer.refresh,
                onFix: onDiagFix,
              }}
            />
          }
        />
      ) : null}
      {step === "print" ? (
        <button type="button" onClick={backToConnect} disabled={sending} className="help-row disabled:opacity-40">
          <span className="link-avatar" aria-hidden="true">
            {statusDot.includes("usb") ? <UsbIcon className="size-6" /> : statusDot.includes("wifi") ? <WifiIcon className="size-6" /> : statusDot.includes("helper") ? <MonitorIcon className="size-6" /> : <PrinterIcon className="size-6" />}
            <span className={`link-avatar-dot ${statusDot}`} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] text-muted">{tr("ap.printer")}</span>
            <span className="mt-0.5 block truncate text-[16px] font-semibold text-fg">{selectedName || tr("ap.stPreview")}</span>
          </span>
          <span className="shrink-0 rounded-full px-1 text-sm font-semibold text-accent">{tr("ap.change")}</span>
        </button>
      ) : null}
      {step === "print" && (printer.status || printer.loading) ? <PrinterStatusCard status={printer.status} loading={printer.loading} error={printer.error} onRefresh={() => void printer.refresh()} compact /> : null}
      {step === "connect" ? (
        <PrinterPanel {...{ addTypedIp, album, aliasDraft, setAliasDraft, appOrigin, checkPrinter, connectUsb, editingUid, setEditingUid, findOnWifi, findViaHelper, forget, foundList, helperCode, setHelperCode, helperOk, setHelperOk, helperShare, helperUrl, setHelperUrl, history, ipInput, setIpInput, lanBusy, lanNote, setLanNote, linkOpen, setLinkOpen, linkTab, setLinkTab, memo, notice, onPrint, openChooser, pdfName, photoUrl, pickPreset, probes, recentPrinters, reconnect, rememberHost, route, saveAlias, scanMode, scanProg, scanning, selected, selectedId, selectedName, sending, setAskName, setOverrideQuery, setQrTarget, setSelectedId, setShowDiag, setShowIpGuide, showIpGuide, setStep, setSubnetInput, subnetInput, setSupportTab, setUseHelper, useHelper, startWith, statusDot, statusText, stopScan, usbMissed, usbOk, helperStatus, onLauncher }} statusCard={selected?.host || selected?.usbKey ? <PrinterStatusCard status={printer.status} loading={printer.loading} error={printer.error} onRefresh={() => void printer.refresh()} helperNeeded={!helperAlive && !selected?.usbKey} /> : null} />
      ) : (
        <section className="panel rounded-3xl p-4 sm:p-5">
          {step === "confirm" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                applyName(askName);
              }}
            >
              <h2 className="text-2xl font-semibold">{selected?.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {tr(result?.kind === "list" ? "ap.nameMany" : "ap.nameHelp")}
              </p>
              <input value={askName} onChange={(event) => setAskName(event.target.value)} placeholder={tr("ap.namePh")} className="field mt-4 h-12 w-full rounded-xl px-3 text-sm outline-none" />
              <div className="mt-3 flex flex-col gap-2">
                <button type="submit" className="btn-solid h-12 rounded-2xl text-sm font-medium">
                  {tr("ap.useName")}
                </button>
                <button type="button" onClick={openChooser} className="chip h-12 rounded-2xl text-sm">
                  {tr("ap.skipName")}
                </button>
              </div>
            </form>
          ) : (
            <>
              {notice ? <p className="mb-3 text-sm text-warn">{msgText(notice)}</p> : null}
              {ippFail && selected?.host && helperAlive && !helperLive && !sending ? (
                <div className="heal-box mb-3 rounded-2xl px-3 py-2.5 text-sm" role="alert">
                  <p className="font-medium text-fg">{tr("ap.ippBlocked")}</p>
                  <button type="button" onClick={() => { setUseHelper(true); setIppFail(false); setHealRetry(true); }} className="btn-solid mt-2 h-10 w-full rounded-xl text-sm font-semibold">
                    {tr("ap.retryHelper")}
                  </button>
                </div>
              ) : null}
              {match && sure && selected ? (
                <ReadyCard
                  match={match}
                  saved={Boolean(remembered)}
                  direct={route !== "preview-only"}
                  route={route}
                  viaHelper={helperLive && route !== "preview-only"}
                  onRemember={onRemember}
                  onForget={() => {
                    if (remembered) forget(remembered.uid);
                  }}
                />
              ) : (
                <h2 className="text-2xl font-semibold">{tr("ap.whatToPrint")}</h2>
              )}
              <p className="route-badge mb-4 mt-2.5">{routeLabel}</p>
              {(effNup !== 1 || (reverse && docKind !== "test") || secureOn || pageMode !== "all" || orient !== "auto" || (docKind === "pdf" && marginMm > 0) || stampActive) ? (
                <p className="mb-3 text-xs text-muted">
                  {tr("ap.adv")}{" "}
                  {[effNup !== 1 ? tr("ap.advNup", { n: effNup }) : "", reverse && docKind !== "test" ? tr("ap.advReverse") : "", secureOn ? tr("ap.advPin") : "", pageMode === "list" ? tr("ap.advList") : "", pageMode === "span" ? tr("ap.advSpan") : "", orient === "landscape" ? tr("ap.land") : "", orient === "portrait" ? tr("ap.port") : "", docKind === "pdf" && marginMm ? tr("ap.margin", { v: marginLabel(margin) }) : "", stampActive && pageNumber ? tr("ap.advNum") : "", stampActive && watermarkText ? tr("ap.advWm", { v: watermarkText }) : ""].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <PrintChooser
                docKind={docKind}
                memo={memo}
                photoUrl={photoUrl}
                album={album}
                pdfName={pdfName}
                pdfCount={pdfCount}
                pageMode={pageMode}
                pageList={pageList}
                onPageList={setPageList}
                pageFrom={pageFrom}
                pageTo={pageTo}
                sending={sending}
                progress={progress}
                ready={readyDoc}
                showPages={false}
                label={phoneHelper && helperLive && selected?.host && route !== "preview-only" ? tr("ap.btnHost", { host: selected.host }) : route === "usb-pdf" ? tr("ap.btnUsbPdf") : route === "usb-pcl" ? tr(helperLive ? "ap.btnHelper" : "ap.btnUsbPcl") : selected?.host ? tr("ap.btnHost", { host: selected.host }) : tr("ap.btnConnect")}
                canSend={Boolean((selected?.live && selected.usbKey) || helperLive || selected?.host)}
                summary={summaryText}
                preflight={
                  <PreflightChips
                    chips={preflight({ docKind, photo: photoDims, paper, landscape: orient === "landscape", nup: effNup, fit: photoFit, idLayout, paperSheets: readyDoc ? paperSheets : 0, duplexOn: twoSided, canDuplex: jobControls && printer.status?.capabilities.duplex !== false, status: printer.status, pdfDirectBlocked: pdfDirectBlocked && route !== "preview-only" })}
                    onAction={onPreflight}
                  />
                }
                onConnect={backToConnect}
                preview={
                  <PaperPreview
                    paper={paper}
                    gray={monoOut}
                    docKind={docKind}
                    title={match ? `${match.printer.brand} ${match.printer.model}` : tr("ap.print")}
                    memo={memo}
                    memoStyle={memoStyle}
                    memoPages={memoPages}
                    photoUrl={shownPhoto}
                    album={shownAlbum}
                    nup={effNup}
                    reverse={reverse}
                    pdfPreview={pdfPreview}
                    pdfCount={pdfCount}
                    sheets={printSheets}
                    sheetIndex={Math.min(Math.max(0, printSheets.length - 1), previewSheet - 1)}
                    onZoom={() => void openZoom()}
                    photoFit={photoFit}
                    photoTurn={photoTurn}
                    orient={orient}
                    testSheet={docKind === "test" ? { printer: match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || "", link: linkText(), paper, orient: orient === "landscape" ? "landscape" : "portrait", gray: monoOut } : null}
                    photoLayout={photoLayout}
                    cutLines={cutLines}
                    stamps={docKind === "test" ? { pageNumber: false, watermark: "" } : stamps}
                    showTools={false}
                    onFit={setPhotoFit}
                    onTurn={() => setPhotoTurn((value) => (value + 90) % 360)}
                    onSheet={(index) => setPreviewSheet(index + 1)}
                  />
                }
                extras={<PrintOptions {...{ docKind, sending, route, colorRaster: colorJob, simplexOnly: ownRaster, jobControls, presetCurrent, activePresetId, applyPreset, onPresetSaved, setNotice, paper, setPaper, gray, setGray, duplex, setDuplex, copies, setCopies, pdfCount, chosenPages, currentPage, pageChip, pickPages, pageList, setPageList, onTogglePage, reverse, setReverse, evenReverse, photoFilter, onPhotoFilter, photoLayout, onPhotoLayout, idLayout, cutLines, setCutLines, memoSize, setMemoSize, memoHeader, setMemoHeader, memoTitle, setMemoTitle, onTextFile, advancedOpen, setAdvancedOpen, margin, setMargin, marginMm, pageNumber, setPageNumber, wmChoice, setWmChoice, wmCustom, setWmCustom, stampActive, nup, setNup, orient, setOrient, photoFit, setPhotoFit, photoTurn, setPhotoTurn, secureOn, setSecureOn, pin, setPin, pinRef, jobUser, setJobUser, }} />}
                onKind={setDocKind}
                onMemo={setMemo}
                onPhotos={choosePhotos}
                onRemovePhoto={removePhoto}
                onMovePhoto={movePhoto}
                photoTurns={photoTurns}
                onRotatePhoto={(url) => setPhotoTurns((prev) => ({ ...prev, [url]: ((prev[url] || 0) + 90) % 360 }))}
                busyBanner={phase ? <JobBanner phase={{ ...phase, percent: phase.stage === "send" ? progress : phase.percent }} onCancel={() => (stopRef.current = true)} /> : null}
                doneBanner={doneText && !sending ? <DoneBanner text={doneText} onAgain={() => void onPrint(false, 1)} onAnother={pickAnother} onClose={() => setDoneText(null)} /> : null}
                onFocusPhoto={setPhotoUrl}
                onPdfFile={choosePdf}
                pdfNeedsKey={pdfNeedsKey}
                onPdfUnlock={setPdfKey}
                onPageMode={setPageMode}
                onPageFrom={setPageFrom}
                onPageTo={setPageTo}
                onPrint={() => void onPrint()}
                onColorPrint={() => void onColorPrint()}
                onPdf={() => void onPdf()}
                onCancel={() => {
                  stopRef.current = true;
                }}
              />
            </>
          )}
        </section>
      )}
      <button
        type="button"
        onClick={() => {
          setSupportTab("help");
          setShowDiag(true);
        }}
        className="help-row"
      >
        <span className="doc-ico is-help" aria-hidden="true">
          <CircleHelp weight="fill" className="size-[22px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold text-fg">{tr("ap.helpCard")}</span>
          <span className="mt-0.5 block truncate text-[13px] text-muted">{tr("ap.helpTopics")}</span>
        </span>
        <ChevronRightIcon className="doc-chev" aria-hidden="true" />
      </button>
      {saved.length > 0 ? (
        <button type="button" onClick={() => setScanId((value) => value + 1)} className="self-center text-xs text-faint">
          {tr("ap.reconnectPrev")}
        </button>
      ) : null}
    </main>
  );
}
