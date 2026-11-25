import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bookmark, CircleHelp, FileText, Image as ImageIcon, Moon, Printer, Sheet, StickyNote, Sun, Trash2, Usb } from "lucide-react";
import { matchQuery, type MatchResult } from "@/lib/atlas";
import { grantedUsb, identifyUsb, pickUsb, sendUsbBytes, watchUsbConnect, watchUsbDisconnect } from "@/lib/discover";
import { canvasObjectUrl, clearPrintRoot, printSheet, type PrintJob } from "@/lib/print-sheet";
import { downloadCanvasPdf, grayCanvas, renderSheetCanvas, sheetMemoChunks } from "@/lib/pdf-page";
import { bundleCommands, canvasPclCommands, drawOfficePage, needsBlankBack, officeMemoChunks, osRasterSize, paperPoints, pclAbortFooter, pclJobFooter, pclJobHeader, pclPageCommands, previewSize, printPixelSize, printableSize, wrapPdfJob, type DuplexMode, type OfficePaper } from "@/lib/office-job";
import { canPdfDirect, imagesToPdf, nupGroups, openPdf, pageSpan, parsePageRange, renderPdfPage, slicePdf, type OpenedPdf } from "@/lib/pdf-doc";
import { languageIsPcl5, resolvePrintRoute, type PrintRoute } from "@/lib/print-route";
import { discoverLanPrinters, isValidIPv4 } from "@/lib/lan-find";
import { sendIppPdf } from "@/lib/ipp-send";
import { diag, diagText } from "@/lib/diag";
import { helperPing, helperSend } from "@/lib/helper-send";
import { composeSheet } from "@/lib/compose-sheet";
import { usePrinterStore, type SavedPrinter } from "@/lib/printer-store";

type Via = "saved" | "usb" | "wifi";
type DocKind = "pdf" | "photo" | "memo" | "test";
type Step = "connect" | "confirm" | "print";

type Found = {
  id: string;
  title: string;
  subtitle: string;
  via: Via;
  query: string;
  cmd?: string;
  live?: boolean;
  usbKey?: string;
  host?: string;
};

const VIA_LABEL: Record<Via, string> = {
  saved: "저장",
  usb: "USB",
  wifi: "와이파이",
};

function uidOf(title: string) {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9가-힣-]/g, "");
}

function chunkLoadError(error: unknown) {
  return error instanceof Error && /Failed to fetch|dynamically imported|Importing a module script failed|Loading chunk|error loading dynamically/i.test(error.message);
}

function humanError(error: unknown, fallback: string) {
  if (chunkLoadError(error)) return "네트워크에 다시 연결하거나 새로고침해 주세요.";
  if (error instanceof DOMException) {
    if (error.name === "NotFoundError") return "기기 고르기를 취소했어요.";
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return "여기서는 기기 창이 안 열려요. Chrome으로 열어 주세요.";
    if (error.name === "NetworkError") return "복사기와 연결이 끊겼어요. 다시 연결해 주세요.";
    if (error.name === "InvalidStateError") return "복사기가 다른 곳에서 쓰이는 중이에요. 다시 눌러 주세요.";
  }
  if (error instanceof Error && /[가-힣]/.test(error.message)) return error.message;
  return fallback;
}

function inAppBrowser() {
  return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("사진을 열지 못했어요."));
    image.src = src;
  });
}

function isSure(result: MatchResult | null, query: string) {
  if (!result || result.kind !== "match") return false;
  if (result.source === "catalog") return result.confidence >= 88;
  if (result.source === "driver-db") return result.confidence >= 90;
  if (result.source === "heuristic" && result.confidence >= 70) return /\d{2,}/.test(query);
  return false;
}

function stageForQuery(query: string, cmd?: string): Step {
  const text = query.trim();
  const found = text ? matchQuery(text, { cmd }) : null;
  const matched = found && found.kind === "match" ? found : null;
  if (matched && isSure(found, text)) return "print";
  return "confirm";
}

function isInkjet(match: Extract<MatchResult, { kind: "match" }>) {
  return match.pack.id === "raster-ink";
}

export function AtlasApp() {
  const saved = usePrinterStore((state) => state.saved);
  const remember = usePrinterStore((state) => state.remember);
  const forget = usePrinterStore((state) => state.forget);
  const [scanId, setScanId] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [hits, setHits] = useState<Found[]>([]);
  const [extra, setExtra] = useState<Found[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrideQuery, setOverrideQuery] = useState<string | null>(null);
  const [askName, setAskName] = useState("");
  const [notice, setNotice] = useState("");
  const [copies, setCopies] = useState(1);
  const [paper, setPaper] = useState<OfficePaper>("A4");
  const [gray, setGray] = useState(false);
  const [duplex, setDuplex] = useState<DuplexMode>("simplex");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [inApp, setInApp] = useState(false);
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
  const [previewPage, setPreviewPage] = useState(1);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [photoFit, setPhotoFit] = useState<"contain" | "cover">("contain");
  const [photoTurn, setPhotoTurn] = useState(0);
  const [orient, setOrient] = useState<"auto" | "portrait" | "landscape">("auto");
  const [lanBusy, setLanBusy] = useState(false);
  const [lanNote, setLanNote] = useState("");
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
    setInApp(inAppBrowser());
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
      const mark = (item: Found) => (item.usbKey === usbKey ? { ...item, live: false, subtitle: "USB가 빠졌어요" } : item);
      setHits((prev) => prev.map(mark));
      setExtra((prev) => prev.map(mark));
      setNotice("USB 케이블이 빠졌어요. 다시 연결해 주세요.");
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
          setNotice(linked.live ? "USB 복사기를 다시 연결했어요." : "USB는 다시 꽂혔지만 바로 보내지는 못해요.");
        })
        .catch((error: unknown) => {
          setNotice(error instanceof Error ? error.message : "USB 복사기를 열지 못했어요.");
        });
    });
    return () => {
      stopDisconnect();
      stopConnect();
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("atlas-theme", next);
  }

  useEffect(() => {
    let stop = false;
    setScanning(true);
    setHits([]);
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
      setHits(usbHits);
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
      subtitle: `저장됨 · ${item.via}`,
      via: "saved" as const,
      query: item.query,
    }));
    const seen = new Set<string>();
    const seenQuery = new Set<string>();
    const merged: Found[] = [];
    for (const item of [...hits, ...extra, ...fromSaved]) {
      const queryKey = item.query.trim().toLowerCase();
      if (queryKey && seenQuery.has(queryKey)) continue;
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
    setNotice("");
    try {
      const device = await pickUsb(all);
      const linked = await identifyUsb(device);
      const ids = linked.usbKey.split(":");
      diag(`USB VID=${ids[0] || "?"} PID=${ids[1] || "?"} ${linked.title} CMD=${linked.cmd || "(없음)"}`);
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
      setNotice(linked.live ? "USB로 연결했어요." : "USB로 기기는 잡았어요. 이 화면에서 인쇄할 내용을 고르세요.");
    } catch (error) {
      setUsbMissed(true);
      setNotice(humanError(error, "USB 복사기를 열지 못했어요."));
    }
  }

  function applyName(name: string) {
    const text = name.trim();
    if (text.length < 2 || !selected) {
      setNotice("앞면에 적힌 이름을 적어 주세요.");
      return;
    }
    setExtra((prev) => prev.map((item) => (item.id === selected.id ? { ...item, title: text, query: text } : item)));
    setOverrideQuery(text);
    setAskName("");
    setStep(stageForQuery(text, selected.cmd));
    setNotice("그 이름으로 다시 봤어요.");
  }

  function onRemember() {
    if (!match || !sure) return;
    const title = `${match.printer.brand} ${match.printer.model}`.trim();
    if (title.length < 2) return;
    const item: SavedPrinter = {
      uid: uidOf(title) || uidOf(query),
      title,
      query: title,
      via: selected?.via ? VIA_LABEL[selected.via] : "직접",
      savedAt: Date.now(),
    };
    remember(item);
    setSelectedId(`saved:${item.uid}`);
    setNotice("다음에도 이 복사기가 나와요.");
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

  function addWifi(host: string, answered: boolean) {
    const item: Found = {
      id: `wifi:${host}`,
      title: `프린터 ${host}`,
      subtitle: answered ? "631 응답 확인 · 직접 인쇄 시 CORS 허용 필요" : "직접 넣은 주소",
      via: "wifi",
      query: host,
      host,
      live: true,
    };
    setHits((prev) => [item, ...prev.filter((row) => row.id !== item.id)]);
    setSelectedId(item.id);
  }

  async function findOnWifi() {
    if (lanBusy || sending) return;
    setLanBusy(true);
    setLanNote("브라우저가 같은 망 접근을 물어보면 허용하세요. 삼성 앱은 열지 않아요.");
    try {
      const found = await discoverLanPrinters(setLanNote, [subnetInput, localStorage.getItem("nuguna-subnet") || ""]);
      if (found.length === 0) {
        setLanNote("응답한 주소가 없어요. 대역(예: 192.168.50)이나 복사기 IP를 직접 넣으세요.");
        return;
      }
      const subnet = found[0].host.split(".").slice(0, 3).join(".");
      localStorage.setItem("nuguna-subnet", subnet);
      setSubnetInput(subnet);
      for (const hit of found) addWifi(hit.host, true);
      setLanNote(`${found.length}대를 찾았어요. 그 주소로 이 화면에서 보냅니다.`);
    } catch {
      setLanNote("같은 망을 보지 못했어요. IP를 직접 넣으세요.");
    } finally {
      setLanBusy(false);
    }
  }

  function addTypedIp() {
    const host = ipInput.trim();
    if (!isValidIPv4(host)) {
      setLanNote("IP는 192.168.0.10 처럼 넣어 주세요.");
      return;
    }
    addWifi(host, false);
    setLanNote(`${host} 를 이 화면의 프린터로 골랐어요.`);
  }

  function leaveInApp() {
    const url = window.location.href;
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      void navigator.clipboard.writeText(url).then(() => setNotice("주소를 복사했어요. Safari 주소창에 붙여 넣으세요."));
      return;
    }
    const bare = url.replace(/^https?:\/\//, "");
    window.location.href = `intent://${bare}#Intent;scheme=${window.location.protocol.replace(":", "")};package=com.android.chrome;end`;
  }

  function useRecent() {
    const recent = saved[0];
    if (!recent) return;
    const key = recent.query.trim().toLowerCase();
    const matches = list.filter((item) => item.query.trim().toLowerCase() === key);
    const live = matches.find((item) => item.live && item.via === "usb");
    const picked = live || matches[0];
    setSelectedId(picked ? picked.id : `saved:${recent.uid}`);
    setOverrideQuery(null);
    setAskName("");
    setStep("print");
  }

  async function choosePhotos(files: File[]) {
    if (!files.length || sending) return;
    const room = 20 - album.length;
    if (room < 1) {
      setNotice("사진은 20장까지예요.");
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
        setNotice("사진이 너무 커요. JPG나 PNG로, 긴 변 2000px 정도로 줄여 주세요.");
        continue;
      }
      try {
        urls.push(await shrinkPhoto(file));
      } catch {
        setNotice("사진을 열지 못했어요.");
      }
    }
    if (heic) setNotice("HEIC는 브라우저에서 못 읽어요. JPG/PNG로 저장하거나 공유 메뉴에서 변환해 올려 주세요.");
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
      if (!blob) throw new Error("사진을 열지 못했어요.");
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
        const page = Math.min(opened.doc.numPages, Math.max(1, previewPage));
        const size = oriented(previewSize(paper));
        const canvas = await renderPdfPage(opened.doc, page, size.width, size.height, slot, orient === "auto" ? "auto" : "fit");
        if (!canvas || cancel || requestId !== previewReq.current) {
          if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
          }
          return;
        }
        setPdfPreview(canvas.toDataURL("image/jpeg", 0.82));
        canvas.width = 0;
        canvas.height = 0;
        setPdfNeedsKey(false);
      } catch (error) {
        if (cancel || requestId !== previewReq.current) return;
        const name = error instanceof Error ? error.name : "";
        if (name === "PasswordException" || (error instanceof Error && /password/i.test(error.message))) {
          setPdfNeedsKey(true);
          setPdfPreview(null);
          setNotice(pdfKey ? "비밀번호가 맞지 않아요." : "이 PDF는 열기 비밀번호가 필요해요.");
          return;
        }
        if (chunkLoadError(error)) {
          setNotice("네트워크에 다시 연결하거나 새로고침해 주세요.");
          return;
        }
        setNotice("PDF를 열지 못했어요.");
      }
    })();
    return () => {
      cancel = true;
      slot.current?.cancel();
    };
  }, [pdfBytes, previewPage, paper, pdfKey, orient]);

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
      setPageFrom(1);
      setPageTo(1);
      setPreviewPage(1);
      setPdfKey("");
      setPdfNeedsKey(false);
      setDocKind("pdf");
      setNotice("");
    });
  }

  const catalogPcl5 = Boolean(match && sure && !isInkjet(match) && languageIsPcl5((match.printer.languages || []).join(" ")));
  const helperLive = Boolean(useHelper && selected?.host && helperUrl.trim());
  const rasterForced = Boolean(pdfKey) || nup !== 1 || reverse || pageMode !== "all" || secureOn || orient === "landscape";
  const route: PrintRoute = resolvePrintRoute({
    liveUsb: Boolean(selected?.live && selected.usbKey) || helperLive,
    cmd: selected?.cmd || (helperLive ? "PCL5e,PDF" : ""),
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

  async function canvasJpeg(canvas: HTMLCanvasElement) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    const width = canvas.width;
    const height = canvas.height;
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) throw new Error("인쇄 이미지를 만들지 못했어요.");
    return { jpeg: new Uint8Array(await blob.arrayBuffer()), width, height };
  }

  async function photoSheetJpegs() {
    const sources = album.length ? album : photoUrl ? [photoUrl] : [];
    if (!sources.length) throw new Error("사진을 골라 주세요.");
    const groups = nupGroups(sources.map((_, index) => index + 1), nup, reverse);
    const px = oriented(printPixelSize(paper));
    const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
    for (const group of groups) {
      const images = await Promise.all(group.map((number) => loadImage(sources[number - 1])));
      if (nup === 1 && group.length === 1) {
        const canvas = await renderSheetCanvas({ kind: "photo", title: "", note: "", paper, image: images[0], fit: photoFit, turn: photoTurn, gray, frame: px });
        if (gray) grayCanvas(canvas);
        sheets.push(await canvasJpeg(canvas));
      } else {
        const sheet = composeSheet(images, images.map((image) => ({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height })), px.width, px.height, nup, photoFit);
        if (gray) grayCanvas(sheet);
        sheets.push(await canvasJpeg(sheet));
      }
    }
    return sheets;
  }

  async function buildSystem(forceColor = false): Promise<PrintJob> {
    const useGray = forceColor ? false : gray;
    const title = match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || "인쇄";
    const note = docKind === "memo" ? memo.trim() : "이 브라우저에서 만든 인쇄본입니다.";
    if (docKind === "pdf" && pdfBytes) {
      const opened = await openPdf(pdfBytes, pdfKey || undefined);
      try {
        const picked = currentPages(opened.doc.numPages);
        const numbers = picked.pages;
        const size = oriented(osRasterSize(paper, numbers.length));
        const urls: string[] = [];
        for (const number of numbers) {
          const canvas = await renderPdfPage(opened.doc, number, size.width, size.height, undefined, orient === "auto" ? "auto" : "fit");
          if (!canvas) throw new Error("PDF를 열지 못했어요.");
          urls.push(await canvasObjectUrl(canvas, 0.86));
          canvas.width = 0;
          canvas.height = 0;
        }
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
    if (docKind === "memo") return { kind: "memo", text: memo.trim(), paper, gray: useGray };
    return { kind: "test", title, note, paper, gray: useGray };
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
    if (!/^\d{4}$/.test(pin)) return null;
    return { pin, user: jobUser.replace(/[^A-Za-z0-9]/g, "").slice(0, 16) || "USER" };
  }

  async function onPrint(trial = false) {
    if (sending) return;
    const pages = trial ? [1] : docKind === "pdf" ? currentPages(pdfCount).pages : [1];
    if (!trial && docKind === "pdf") {
      const picked = currentPages(pdfCount);
      if (picked.error) {
        setNotice(picked.error);
        return;
      }
      if (!pdfBytes || picked.pages.length < 1) {
        setNotice("PDF를 골라 주세요.");
        return;
      }
    }
    if (docKind === "memo" && memo.trim().length < 1) {
      setNotice("메모를 적어 주세요.");
      return;
    }
    if (docKind === "photo" && !photoUrl && album.length < 1) {
      setNotice("사진을 골라 주세요.");
      return;
    }
    const title = match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || "인쇄";
    const secure = secureOpts();
    if (secure === null) {
      setNotice("보안 인쇄 PIN은 숫자 4자리로 넣어 주세요.");
      return;
    }
    const note = docKind === "memo" ? memo.trim() : "이 브라우저에서 만든 인쇄본입니다.";
    const viaHelper = helperLive;
    if (selected?.host && !viaHelper && !trial) {
      setSending(true);
      setNotice(`${selected.host} 로 넣는 중…`);
      try {
        let bytes = pdfBytes;
        if (docKind === "pdf") {
          if (!bytes) throw new Error("PDF를 골라 주세요.");
          if (orient === "landscape") {
            const opened = await openPdf(bytes, pdfKey || undefined);
            try {
              const picked = pages;
              const size = oriented(osRasterSize(paper, picked.length));
              const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
              for (const number of picked) {
                const canvas = await renderPdfPage(opened.doc, number, size.width, size.height, undefined, "fit");
                if (!canvas) throw new Error("PDF를 열지 못했어요.");
                if (gray) grayCanvas(canvas);
                sheets.push(await canvasJpeg(canvas));
              }
              bytes = new Uint8Array(await imagesToPdf(sheets, pageBox()));
            } finally {
              await opened.destroy();
            }
          } else if (pageMode !== "all") bytes = await slicePdf(bytes, pages);
        } else if (docKind === "memo") {
          const frame = oriented(printPixelSize(paper));
          const chunks = sheetMemoChunks(note, paper, frame);
          const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
          for (const chunk of chunks) {
            const canvas = await renderSheetCanvas({ kind: "memo", title: selected.title, note: chunk, paper, gray, frame });
            if (gray) grayCanvas(canvas);
            sheets.push(await canvasJpeg(canvas));
          }
          bytes = new Uint8Array(await imagesToPdf(sheets, pageBox()));
        } else if (docKind === "photo") {
          bytes = new Uint8Array(await imagesToPdf(await photoSheetJpegs(), pageBox()));
        } else {
          const frame = oriented(printPixelSize(paper));
          const canvas = await renderSheetCanvas({ kind: "test", title: selected.title, note, paper, gray, frame });
          if (gray) grayCanvas(canvas);
          const sheet = await canvasJpeg(canvas);
          bytes = new Uint8Array(await imagesToPdf([sheet], pageBox()));
        }
        await sendIppPdf(selected.host, bytes, { copies, duplex, paper, gray });
        setNotice(`${selected.host} 로 보냈어요. 삼성 기본 앱은 열지 않았어요.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "그 주소로 넣지 못했어요.";
        diag(`IPP ${selected.host} ${message}`);
        setNotice(message);
      } finally {
        setSending(false);
      }
      return;
    }
    const effective = trial && selected?.usbKey ? "usb-pcl" : route;
    if (effective === "preview-only" || (!selected?.usbKey && !viaHelper)) {
      setNotice("보낼 연결이 없어요. 화면 미리보기나 PDF 저장을 눌러 주세요.");
      return;
    }
    const usbKey = selected?.usbKey || "";
    const write = async (bytes: Uint8Array, onProgress?: (percent: number) => void, shouldStop?: () => boolean, atomic = false) => {
      if (viaHelper && selected?.host) {
        await helperSend(helperUrl, helperCode, selected.host, bytes);
        onProgress?.(100);
        return;
      }
      await sendUsbBytes(usbKey, bytes, onProgress, shouldStop, atomic);
    };
    stopRef.current = false;
    setSending(true);
    setProgress(0);
    let started = false;
    const stop = () => stopRef.current;
    const fatalUsb = (error: unknown) => error instanceof Error && /15초|USB 연결을 닫|거절/.test(error.message);
    const sendPackets = async (commands: Uint8Array[], progress: (percent: number) => void) => {
      const packets = bundleCommands(commands);
      for (const [index, packet] of packets.entries()) {
        if (stopRef.current) throw new Error("보내기를 멈췄어요.");
        await write(packet, () => progress(Math.round(((index + 1) / packets.length) * 100)), () => false, true);
      }
    };
    try {
      if (effective === "usb-pdf" && pdfBytes && !trial) {
        const bytes = wrapPdfJob(pdfBytes, { copies, duplex, paper, pages: Math.max(1, pdfCount), secure });
        setProgress(8);
        await write(bytes, (percent) => setProgress(8 + Math.round(percent * 0.92)), stop);
      } else {
        const size = oriented(printableSize(paper));
        const memoChunks = !trial && docKind === "memo" ? officeMemoChunks(note, size.width, size.height) : null;
        const sources = album.length ? album : photoUrl ? [photoUrl] : [];
        const photoGroups = nupGroups(sources.map((_, index) => index + 1), nup, reverse);
        const pdfGroups = nupGroups(pages, nup, reverse);
        const jobPages = trial ? 1 : docKind === "pdf" ? Math.max(1, pdfGroups.length) : memoChunks?.length || photoGroups.length || 1;
        await write(pclJobHeader({ copies, duplex, paper, pages: jobPages, secure, orient: orient === "landscape" ? "landscape" : "portrait" }), () => setProgress(2), stop, true);
        started = true;
        if (stopRef.current) throw new Error("보내기를 멈췄어요.");
        if (!trial && docKind === "pdf" && pdfBytes) {
          const opened = await openPdf(pdfBytes, pdfKey || undefined);
          try {
            const cellW = nup === 4 ? Math.floor(size.width / 2) : size.width;
            const cellH = nup === 1 ? size.height : Math.floor(size.height / (nup === 4 ? 2 : 2));
            for (const [index, group] of pdfGroups.entries()) {
              if (stopRef.current) throw new Error("보내기를 멈췄어요.");
              const rendered: HTMLCanvasElement[] = [];
              for (const number of group) {
                const canvas = await renderPdfPage(opened.doc, number, cellW, cellH, undefined, orient === "auto" ? "auto" : "fit");
                if (!canvas || stopRef.current) {
                  canvas?.width && (canvas.width = 0);
                  throw new Error("보내기를 멈췄어요.");
                }
                rendered.push(canvas);
              }
              const sheet = nup === 1 && rendered[0] ? rendered[0] : composeSheet(rendered, rendered.map((canvas) => ({ width: canvas.width, height: canvas.height })), size.width, size.height, nup, "contain");
              const commands = canvasPclCommands(sheet, "dither");
              for (const canvas of rendered) {
                canvas.width = 0;
                canvas.height = 0;
              }
              if (sheet !== rendered[0]) {
                sheet.width = 0;
                sheet.height = 0;
              }
              await sendPackets(commands, () => setProgress(Math.round(4 + ((index + 1) / pdfGroups.length) * 90)));
            }
            if (needsBlankBack(pdfGroups.length, duplex)) {
              await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
            }
          } finally {
            await opened.destroy();
          }
        } else if (memoChunks) {
          const groups = nup === 1 && !reverse ? memoChunks.map((chunk) => [chunk]) : nupGroups(memoChunks.map((_, index) => index + 1), nup, reverse).map((group) => group.map((number) => memoChunks[number - 1]));
          for (const [index, group] of groups.entries()) {
            if (stopRef.current) throw new Error("보내기를 멈췄어요.");
            const cells = group.map((chunk) => {
              const canvas = document.createElement("canvas");
              canvas.width = nup === 4 ? Math.floor(size.width / 2) : size.width;
              canvas.height = nup === 1 ? size.height : Math.floor(size.height / 2);
              drawOfficePage(canvas, { kind: "memo", title, note: chunk, gray: true });
              return canvas;
            });
            const sheet = nup === 1 ? cells[0] : composeSheet(cells, cells.map((canvas) => ({ width: canvas.width, height: canvas.height })), size.width, size.height, nup, "contain");
            const commands = canvasPclCommands(sheet, "threshold");
            for (const canvas of cells) {
              canvas.width = 0;
              canvas.height = 0;
            }
            await sendPackets(commands, () => setProgress(Math.round(8 + ((index + 1) / groups.length) * 84)));
          }
          if (needsBlankBack(groups.length, duplex)) {
            await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
          }
        } else if (docKind === "photo" && sources.length) {
          for (const [index, group] of photoGroups.entries()) {
            if (stopRef.current) throw new Error("보내기를 멈췄어요.");
            const images = await Promise.all(group.map((number) => loadImage(sources[number - 1])));
            const sheet = composeSheet(images, images.map((image) => ({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height })), size.width, size.height, nup === 1 && group.length === 1 ? 1 : nup, photoFit);
            if (photoTurn) {
              const turned = document.createElement("canvas");
              turned.width = size.width;
              turned.height = size.height;
              const ctx = turned.getContext("2d");
              ctx?.translate(size.width / 2, size.height / 2);
              ctx?.rotate((photoTurn * Math.PI) / 180);
              ctx?.drawImage(sheet, -size.width / 2, -size.height / 2);
              sheet.width = 0;
              const commands = canvasPclCommands(turned, "dither");
              turned.width = 0;
              turned.height = 0;
              await sendPackets(commands, () => setProgress(Math.round(8 + ((index + 1) / photoGroups.length) * 84)));
            } else {
              const commands = canvasPclCommands(sheet, "dither");
              sheet.width = 0;
              sheet.height = 0;
              await sendPackets(commands, () => setProgress(Math.round(8 + ((index + 1) / photoGroups.length) * 84)));
            }
          }
          if (needsBlankBack(photoGroups.length, duplex)) {
            await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
          }
        } else {
          const canvas = document.createElement("canvas");
          canvas.width = size.width;
          canvas.height = size.height;
          drawOfficePage(canvas, { kind: "test", title, note, gray: true });
          if (stopRef.current) throw new Error("보내기를 멈췄어요.");
          const commands = canvasPclCommands(canvas, "threshold");
          canvas.width = 0;
          canvas.height = 0;
          await sendPackets(commands, (percent) => setProgress(8 + Math.round(percent * 0.84)));
          if (needsBlankBack(1, duplex)) {
            await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
          }
        }
        if (stopRef.current) throw new Error("보내기를 멈췄어요.");
        await write(pclJobFooter(), () => setProgress(100), () => false, true);
        started = false;
      }
      if (stopRef.current) {
        setNotice("보내기를 멈췄어요.");
        return;
      }
      setNotice(secure ? `${viaHelper ? "도우미로" : "USB로"} 보냈어요. 복사기 화면에서 PIN을 입력해야 출력돼요.` : viaHelper ? "PC 도우미로 보냈어요." : "USB로 보냈어요.");
    } catch (error) {
      if (started && !fatalUsb(error)) {
        try {
          await write(pclAbortFooter(), undefined, () => false, true);
        } catch {
          /* 이미 끊긴 복사기 */
        }
      }
      if (fatalUsb(error) && selected?.usbKey) {
        const mark = (item: Found) => (item.usbKey === selected.usbKey ? { ...item, live: false, subtitle: "USB 연결을 닫았어요" } : item);
        setHits((prev) => prev.map(mark));
        setExtra((prev) => prev.map(mark));
      }
      if (stopRef.current) {
        setNotice("보내기를 멈췄어요.");
        return;
      }
      if (!started) {
        const message = humanError(error, "바로 넣지 못했어요.");
        diag(`보내기 실패 ${message}`);
        setNotice(`${message} 화면 미리보기나 PDF 저장을 눌러 주세요.`);
        return;
      }
      setNotice(humanError(error, "보내는 중에 끊겼어요. 복사기에서 작업을 지운 뒤 다시 눌러 주세요."));
    } finally {
      setSending(false);
    }
  }

  async function onColorPrint() {
    if (sending) return;
    await printSheet(await buildSystem(true));
    setNotice(dialogNotice("이 화면에 미리보기를 띄웠어요. 프린터로는 보내지 않았어요."));
  }

  function dialogNotice(base: string) {
    const count = docKind === "pdf" ? currentPages(pdfCount).pages.length : 0;
    const safari = typeof navigator !== "undefined" && /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|Edg|Android/i.test(navigator.userAgent);
    const notes = [base];
    if (count > 30) notes.push("30쪽이 넘어 이 화면의 해상도를 낮췄어요. 더 선명하게 보려면 30쪽씩 나눠 주세요.");
    if (safari && (paper === "A3" || paper === "B5")) notes.push("이 화면의 용지 크기를 한 번 더 확인해 주세요.");
    return notes.join(" ");
  }

  const chosenPages = currentPages(pdfCount).pages;
  const readyDoc = docKind === "test" || (docKind === "photo" ? Boolean(photoUrl || album.length) : docKind === "memo" ? memo.trim().length > 0 : Boolean(pdfBytes && chosenPages.length && !pdfNeedsKey));

  async function onPdf() {
    if (!readyDoc || sending) return;
    try {
      if (docKind === "pdf" && pdfBytes) {
        if (!gray) {
          const bytes = pageMode === "all" ? pdfBytes : await slicePdf(pdfBytes, chosenPages);
          const copy = new Uint8Array(bytes.byteLength);
          copy.set(bytes);
          const file = new Blob([copy], { type: "application/pdf" });
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = pdfName || "문서.pdf";
          link.click();
          URL.revokeObjectURL(url);
          return;
        }
        const opened = await openPdf(pdfBytes, pdfKey || undefined);
        try {
          const size = oriented(osRasterSize(paper, chosenPages.length));
          const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
          for (const number of chosenPages) {
            const canvas = await renderPdfPage(opened.doc, number, size.width, size.height, undefined, orient === "auto" ? "auto" : "fit");
            if (!canvas) throw new Error("PDF로 만들지 못했어요.");
            grayCanvas(canvas);
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
            canvas.width = 0;
            canvas.height = 0;
            if (!blob) throw new Error("PDF로 만들지 못했어요.");
            sheets.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), width: size.width, height: size.height });
          }
          const bytes = await imagesToPdf(sheets, pageBox());
          const copy = new Uint8Array(bytes.byteLength);
          copy.set(bytes);
          const url = URL.createObjectURL(new Blob([copy], { type: "application/pdf" }));
          const link = document.createElement("a");
          link.href = url;
          link.download = pdfName || "문서.pdf";
          link.click();
          URL.revokeObjectURL(url);
        } finally {
          await opened.destroy();
        }
        return;
      }
      if (docKind === "memo") {
        const frame = oriented(printPixelSize(paper));
        const chunks = sheetMemoChunks(memo.trim(), paper, frame);
        const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
        for (const chunk of chunks) {
          const canvas = await renderSheetCanvas({
            kind: "memo",
            title: "",
            note: chunk,
            paper,
            gray,
            frame,
          });
          if (gray) grayCanvas(canvas);
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
          const width = canvas.width;
          const height = canvas.height;
          canvas.width = 0;
          canvas.height = 0;
          if (!blob) throw new Error("PDF로 만들지 못했어요.");
          sheets.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), width, height });
        }
        const bytes = await imagesToPdf(sheets, pageBox());
        const copy = new Uint8Array(bytes.byteLength);
        copy.set(bytes);
        const url = URL.createObjectURL(new Blob([copy], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "메모.pdf";
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      if (docKind === "photo") {
        const sheets = await photoSheetJpegs();
        const bytes = await imagesToPdf(sheets, pageBox());
        const copy = new Uint8Array(bytes.byteLength);
        copy.set(bytes);
        const url = URL.createObjectURL(new Blob([copy], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "사진.pdf";
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      const frame = oriented(printPixelSize(paper));
      const canvas = await renderSheetCanvas({
        kind: "test",
        title: match ? `${match.printer.brand} ${match.printer.model}` : "인쇄",
        note: "이 브라우저에서 만든 인쇄본입니다.",
        paper,
        gray,
        frame,
      });
      if (gray) grayCanvas(canvas);
      const page = pageBox();
      await downloadCanvasPdf(canvas, "인쇄", page);
    } catch (error) {
      setNotice(humanError(error, "PDF로 만들지 못했어요."));
    }
  }

  return (
    <main className="shell mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6 sm:py-10">
      {inApp ? (
        <div className="card px-4 py-3 text-sm leading-relaxed">
          <p>인앱 브라우저에서는 USB와 일부 인쇄가 막혀 있어요.</p>
          <button type="button" onClick={leaveInApp} className="mt-3 h-11 w-full rounded-2xl bg-accent text-sm font-medium text-accent-fg">
            {/iPad|iPhone|iPod/.test(navigator.userAgent) ? "주소 복사하기" : "Chrome으로 바로 열기"}
          </button>
        </div>
      ) : null}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium tracking-tight">누구나프린트</h1>
          <p className="mt-1 text-sm text-muted">이 화면에서 인쇄합니다.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setShowDiag(true)} className="inline-flex size-11 items-center justify-center rounded-full border border-line" aria-label="진단 로그">
            <CircleHelp className="size-4" />
          </button>
          <button type="button" onClick={toggleTheme} className="inline-flex size-11 items-center justify-center rounded-full border border-line" aria-label={theme === "dark" ? "밝게" : "어둡게"}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>
      {showDiag ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setShowDiag(false)}>
          <div className="card w-full max-w-lg p-4 text-sm" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="진단 로그">
            <div className="flex items-center justify-between">
              <p className="font-medium text-fg">진단 로그</p>
              <button type="button" onClick={() => setShowDiag(false)} className="text-sm font-medium text-accent">닫기</button>
            </div>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted">{diagText() || "아직 기록이 없어요."}</pre>
            <button type="button" onClick={() => void navigator.clipboard.writeText(diagText())} className="mt-3 h-10 rounded-xl border border-line px-3 text-sm text-fg">복사</button>
          </div>
        </div>
      ) : null}
      {step === "print" ? (
        <button type="button" onClick={backToConnect} disabled={sending} className="card flex w-full items-center justify-between px-4 py-3 text-left disabled:opacity-40">
          <span className="min-w-0">
            <span className="block text-xs font-medium text-muted">프린터</span>
            <span className="mt-1 block truncate text-base font-medium text-fg">{selected?.title || "화면 미리보기 전용"}</span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-accent">프린터 바꾸기</span>
        </button>
      ) : null}
      {step === "connect" ? (
        <section className="flex flex-col gap-4">
          <div className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted">1. 연결된 프린터</p>
                <p className="mt-1 flex items-center gap-2 text-base font-medium text-fg">
                  <span className={`inline-block size-2.5 rounded-full ${selected?.live && selected.usbKey ? "dot-usb" : selected?.host || helperLive ? "dot-wifi" : "dot-idle"}`} />
                  {selected?.live && selected.usbKey ? "USB 연결" : helperLive ? "PC 도우미 연결" : selected?.host ? "와이파이 연결" : "화면 미리보기 전용"}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted">{selected?.title || "아직 복사기를 고르지 않았어요"}</p>
              </div>
              <button type="button" onClick={() => setLinkOpen((value) => !value)} className="rounded-full border border-line px-3 py-2 text-sm font-semibold text-accent">
                {linkOpen ? "접기" : "연결 변경"}
              </button>
            </div>
            {linkOpen ? (
              <div className="mt-4 space-y-3">
            {saved[0] ? (
              <button type="button" onClick={useRecent} className="flex w-full items-center justify-between gap-3 border-b border-line py-3 text-left">
                <span>
                  <span className="block text-sm font-medium">최근 복사기</span>
                  <span className="mt-0.5 block text-xs text-muted">{saved[0].title}</span>
                </span>
              </button>
            ) : null}
            <button type="button" disabled={lanBusy || sending} onClick={() => void findOnWifi()} className="flex h-12 w-full items-center justify-center rounded-2xl bg-accent text-sm font-medium text-accent-fg disabled:opacity-40">
              {lanBusy ? "IP 찾는 중…" : "같은 와이파이에서 IP 찾기"}
            </button>
            <details className="rounded-2xl border border-line px-3 py-2">
              <summary className="text-sm font-medium text-fg">다른 대역 검색</summary>
              <label className="mt-3 block text-xs font-medium text-muted" htmlFor="subnet-field">자동 검색 대역 (선택)</label>
              <input id="subnet-field" value={subnetInput} onChange={(event) => setSubnetInput(event.target.value)} placeholder="192.168.50" aria-label="자동 검색 대역" className="field mt-1 h-11 w-full rounded-xl px-3 text-sm outline-none" />
            </details>
            <form
              className="space-y-1"
              onSubmit={(event) => {
                event.preventDefault();
                addTypedIp();
              }}
            >
              <label className="block text-xs font-medium text-muted" htmlFor="printer-ip">복사기 IP 직접 입력</label>
              <div className="ip-join">
              <input
                id="printer-ip"
                value={ipInput}
                onChange={(event) => setIpInput(event.target.value)}
                inputMode="decimal"
                placeholder="192.168.0.10"
                aria-label="복사기 IP 직접 입력"
                className="field h-12 min-w-0 flex-1 px-3 text-sm outline-none"
              />
              <button type="submit">이 IP로</button>
              </div>
            </form>
            {lanNote ? <p className="text-sm text-muted">{lanNote}</p> : null}
            <button type="button" disabled={!usbOk} onClick={() => void connectUsb(false)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line text-sm disabled:opacity-40">
              <Usb className="size-4" aria-hidden="true" />
              USB 선으로 연결
            </button>
            {usbOk ? null : <p className="text-xs text-muted">Chrome(안드로이드/PC)에서만 USB 선 연결을 지원해요.</p>}
            {usbMissed ? (
              <button type="button" onClick={() => void connectUsb(true)} className="mt-2 text-xs text-muted underline-offset-2 hover:underline">
                USB 목록에 없으면 다른 기기도 보기
              </button>
            ) : null}
            <p className="text-sm leading-relaxed text-muted" aria-live="polite">
              {scanning ? "전에 연결했던 복사기가 있나 보고 있어요." : selected?.live ? "연결되어 있어요. 삼성 기본 앱으로는 넘기지 않아요." : "선을 꽂으면 이 화면에서 바로 넣습니다. 삼성 기본 앱으로는 넘기지 않아요."}
            </p>
            {notice ? <p className="mt-2 text-sm text-warn">{notice}</p> : null}
            {list.length > 0 ? (
              <ul className="mt-2">
                {list.map((item) => {
                  const on = item.id === selectedId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(item.id);
                          setOverrideQuery(null);
                          setAskName("");
                          setStep(item.host ? "print" : stageForQuery(item.query, item.cmd));
                        }}
                        className={`flex w-full items-center gap-3 border-b border-line py-3 text-left ${on ? "text-accent" : ""}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.title}</span>
                          <span className="mt-0.5 block text-xs text-muted">{item.subtitle}</span>
                        </span>
                        <span className={`text-xs ${item.live ? "text-ok" : "text-faint"}`}>{item.live ? "연결됨" : VIA_LABEL[item.via]}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={useHelper} onChange={(event) => setUseHelper(event.target.checked)} />
              PC 도우미(9100)로 보내기
            </label>
            {useHelper ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={helperUrl} onChange={(event) => setHelperUrl(event.target.value)} aria-label="도우미 주소" placeholder="http://127.0.0.1:47631" className="field h-11 min-w-0 flex-1 rounded-xl px-3 text-sm outline-none" />
                  <input value={helperCode} onChange={(event) => setHelperCode(event.target.value)} placeholder="코드" aria-label="도우미 코드" className="field h-11 w-24 rounded-xl px-3 text-sm outline-none" />
                  <button type="button" className="h-11 rounded-xl border border-line px-3 text-sm text-fg" onClick={() => void helperPing(helperUrl).then(() => setLanNote("도우미가 응답했어요.")).catch((error: unknown) => setLanNote(error instanceof Error ? error.message : "도우미가 없어요."))}>확인</button>
                </div>
                <a href="/raw-print-helper.mjs" download className="text-xs font-medium text-accent">PC 도우미 스크립트 받기</a>
                <p className="text-xs leading-relaxed text-muted">같은 컴퓨터에서는 http://127.0.0.1:47631 입니다. 폰에서는 그 PC의 사설 IP(예: http://192.168.0.20:47631)를 넣으세요. 터미널의 6자리 코드가 있어야 9100으로 PCL·PDF·보안 PIN이 나갑니다.</p>
              </div>
            ) : null}
            {selected?.usbKey && route === "preview-only" ? (
              <button type="button" className="h-11 w-full rounded-2xl border border-line text-sm" onClick={() => void onPrint(true)}>
                언어를 못 읽었어요. PCL5e 흑백 시험 1쪽 보내기
              </button>
            ) : null}
              </div>
            ) : null}
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium text-muted">2. 무엇을 보낼까요</p>
            {pdfName || photoUrl || album.length || memo.trim() ? (
              <button type="button" onClick={openChooser} className="mt-3 h-12 w-full rounded-2xl bg-accent text-sm font-medium text-accent-fg">
                이어서 인쇄 · {pdfName || (album.length ? `사진 ${album.length}장` : photoUrl ? "사진" : "메모")}
              </button>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => startWith("pdf")} className="tile flex min-h-24 flex-col items-start justify-center px-3 py-3 text-left">
                <FileText className="size-5 text-accent" />
                <span className="mt-2 font-medium text-fg">PDF</span>
                <span className="text-xs text-muted">미리보기 · 쪽 범위 · 모아찍기</span>
              </button>
              <button type="button" onClick={() => startWith("photo")} className="tile flex min-h-24 flex-col items-start justify-center px-3 py-3 text-left">
                <ImageIcon className="size-5 text-accent" />
                <span className="mt-2 font-medium text-fg">사진</span>
                <span className="text-xs text-muted">여러 장 · 맞춤/채우기</span>
              </button>
              <button type="button" onClick={() => startWith("memo")} className="tile flex min-h-24 flex-col items-start justify-center px-3 py-3 text-left">
                <StickyNote className="size-5 text-accent" />
                <span className="mt-2 font-medium text-fg">메모</span>
                <span className="text-xs text-muted">글 입력 · 자동 쪽 나눔</span>
              </button>
              <button type="button" onClick={() => startWith("test")} className="tile flex min-h-24 flex-col items-start justify-center px-3 py-3 text-left">
                <Sheet className="size-5 text-accent" />
                <span className="mt-2 font-medium text-fg">테스트 페이지</span>
                <span className="text-xs text-muted">연결 확인 1장</span>
              </button>
            </div>
          </div>
        </section>
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
                {result?.kind === "list" ? "이름이 여러 기종에 걸려요. 앞면에 적힌 글자를 조금 더 적어 주세요." : "앞면에 적힌 이름을 알면, 이 화면에서 바로 보낼지 미리보기만 볼지를 골라요."}
              </p>
              <input value={askName} onChange={(event) => setAskName(event.target.value)} placeholder="예: 신도리코 D450, 캐논 iR-ADV C3530, 후지필름 Apeos" className="field mt-4 h-12 w-full rounded-xl px-3 text-sm outline-none" />
              <div className="mt-3 flex flex-col gap-2">
                <button type="submit" className="h-12 rounded-2xl bg-accent text-sm font-medium text-accent-fg">
                  이 이름으로 볼게요
                </button>
                <button type="button" onClick={openChooser} className="h-12 rounded-2xl border border-line text-sm">
                  이름은 모르겠고, 인쇄할 내용 고르기
                </button>
              </div>
            </form>
          ) : (
            <>
              {notice ? <p className="mb-3 text-sm text-warn">{notice}</p> : null}
              {match && sure && selected ? (
                <ReadyCard
                  match={match}
                  saved={Boolean(remembered)}
                  direct={route !== "preview-only"}
                  route={route}
                  onRemember={onRemember}
                  onForget={() => {
                    if (remembered) forget(remembered.uid);
                  }}
                />
              ) : (
                <h2 className="text-2xl font-semibold">무엇을 인쇄할까요?</h2>
              )}
              <p className="mb-3 inline-flex rounded-full border border-line bg-subtle px-3 py-1 text-xs font-medium text-fg">
                {helperLive && route !== "preview-only" ? "PC 도우미 9100" : route === "usb-pdf" ? "USB PDF Direct" : route === "usb-pcl" ? "USB PCL5e 흑백" : selected?.host ? "와이파이 IPP" : "화면 저장 전용"}
              </p>
              {nup !== 1 || reverse || secureOn || pageMode !== "all" || orient !== "auto" ? (
                <p className="mb-3 text-xs text-muted">
                  고급 {[nup !== 1 ? `모아찍기 ${nup}` : "", reverse ? "역순" : "", secureOn ? "보안 PIN" : "", pageMode === "list" ? "쪽 선택" : "", pageMode === "span" ? "쪽 범위" : "", orient === "landscape" ? "가로" : "", orient === "portrait" ? "세로" : ""].filter(Boolean).join(" · ")}
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
                label={route === "usb-pdf" ? "USB PDF로 인쇄" : route === "usb-pcl" ? (helperLive ? "도우미 9100으로 인쇄" : "USB PCL로 인쇄") : selected?.host ? `${selected.host}로 인쇄` : "연결 후 인쇄"}
                canSend={Boolean((selected?.live && selected.usbKey) || helperLive || selected?.host)}
                onConnect={backToConnect}
                preview={<PaperPreview paper={paper} gray={gray || route === "usb-pcl"} docKind={docKind} title={match ? `${match.printer.brand} ${match.printer.model}` : "인쇄"} memo={memo} photoUrl={photoUrl} pdfPreview={pdfPreview} pdfCount={pdfCount} previewPage={previewPage} photoFit={photoFit} photoTurn={photoTurn} orient={orient} showTools={false} onFit={setPhotoFit} onTurn={() => setPhotoTurn((value) => (value + 90) % 360)} onPreview={setPreviewPage} />}
                extras={
                  <>
                    <OfficeOptions paper={paper} gray={gray} duplex={duplex} copies={copies} route={route} locked={sending} controls={route !== "preview-only" || Boolean(selected?.host)} copyMax={99} onPaper={setPaper} onGray={setGray} onDuplex={setDuplex} onCopies={setCopies} />
                    <details className="mt-3 rounded-2xl border border-line px-3 py-2" open={advancedOpen} onToggle={(event) => setAdvancedOpen((event.target as HTMLDetailsElement).open)}>
                      <summary className="text-sm font-medium text-fg">고급 옵션</summary>
                      <div className="mt-3 space-y-3 text-sm">
                        {docKind === "pdf" ? (
                          <div className="space-y-2">
                            <p className="text-xs text-muted">복합 쪽 범위</p>
                            <div className="flex flex-wrap gap-2">
                              <button type="button" disabled={sending} onClick={() => setPageMode("all")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "all" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>전체</button>
                              <button type="button" disabled={!pdfCount || sending} onClick={() => setPageMode("span")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "span" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>시작~끝</button>
                              <button type="button" disabled={!pdfCount || sending} onClick={() => setPageMode("list")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "list" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>골라서</button>
                            </div>
                            {pageMode === "list" ? <input value={pageList} onChange={(event) => setPageList(event.target.value)} placeholder="1, 3-5, 8" aria-label="쪽 범위" className="field h-10 w-full rounded-xl px-3 text-sm outline-none" /> : null}
                            {pageMode === "span" ? (
                              <div className="flex items-center gap-2 text-sm text-fg">
                                <input type="number" min={1} max={pdfCount || 1} disabled={sending} value={pageFrom} onChange={(event) => setPageFrom(Number(event.target.value))} className="field h-10 w-16 rounded-xl px-2 text-center disabled:opacity-40" aria-label="시작 페이지" />
                                <span>~</span>
                                <input type="number" min={1} max={pdfCount || 1} disabled={sending} value={pageTo} onChange={(event) => setPageTo(Number(event.target.value))} className="field h-10 w-16 rounded-xl px-2 text-center disabled:opacity-40" aria-label="끝 페이지" />
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          {([1, 2, 4] as const).map((value) => (
                            <button key={value} type="button" onClick={() => setNup(value)} className={`h-10 rounded-full px-3 ${nup === value ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>
                              {value === 1 ? "모아찍기 없음" : `${value}쪽`}
                            </button>
                          ))}
                          <button type="button" onClick={() => setReverse((value) => !value)} className={`h-10 rounded-full px-3 ${reverse ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>
                            역순
                          </button>
                        </div>
                        {docKind === "pdf" || docKind === "photo" || docKind === "memo" ? (
                          <div className="space-y-2">
                            <p className="text-xs text-muted">방향</p>
                            <div className="flex flex-wrap gap-2">
                              {([
                                ["auto", "자동"],
                                ["portrait", "세로"],
                                ["landscape", "가로"],
                              ] as const).map(([id, text]) => (
                                <button key={id} type="button" onClick={() => setOrient(id)} className={`h-10 rounded-full px-3 ${orient === id ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>
                                  {text}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {docKind === "photo" ? (
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setPhotoFit("contain")} className={`h-10 rounded-full px-3 ${photoFit === "contain" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>맞추기</button>
                            <button type="button" onClick={() => setPhotoFit("cover")} className={`h-10 rounded-full px-3 ${photoFit === "cover" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>채우기</button>
                            <button type="button" onClick={() => setPhotoTurn((value) => (value + 90) % 360)} className="h-10 rounded-full border border-line px-3 text-fg">90도 회전{photoTurn ? ` ${photoTurn}°` : ""}</button>
                          </div>
                        ) : null}
                        <label className="flex items-center gap-2 text-fg">
                          <input type="checkbox" checked={secureOn} onChange={(event) => setSecureOn(event.target.checked)} />
                          보안 인쇄
                        </label>
                        {secureOn ? (
                          <div className="flex gap-2">
                            <input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="PIN 4자리" aria-label="보안 PIN" className="field h-10 w-28 rounded-xl px-3 outline-none" />
                            <input value={jobUser} onChange={(event) => setJobUser(event.target.value)} placeholder="사용자 영숫자" aria-label="사용자 이름" className="field h-10 min-w-0 flex-1 rounded-xl px-3 outline-none" />
                          </div>
                        ) : null}
                      </div>
                    </details>
                  </>
                }
                onKind={setDocKind}
                onMemo={setMemo}
                onPhotos={choosePhotos}
                onRemovePhoto={removePhoto}
                onMovePhoto={movePhoto}
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
      <details className="help-card rounded-3xl px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">연결이 안 될 때</summary>
        <ul className="mt-3 space-y-2 leading-relaxed">
          <li>컴퓨터는 Chrome으로 여세요. 선을 꽂고 USB로 연결하면 목록이 나옵니다. 아이폰은 선을 잡을 수 없어요.</li>
          <li>삼성 기본 인쇄 앱으로는 넘기지 않아요.</li>
          <li>와이파이 직접 인쇄가 CORS로 막히면 같은 와이파이 PC에서 node raw-print-helper.mjs 를 켜고 PC 도우미(9100)를 체크하세요. 아이폰·삼성 인터넷도 가능해요.</li>
          <li>같은 와이파이 주소가 안 보이면 복사기 화면의 IP를 직접 넣으세요.</li>
        </ul>
      </details>
      {saved.length > 0 ? (
        <button type="button" onClick={() => setScanId((value) => value + 1)} className="self-center text-xs text-faint">
          전에 연결한 복사기 다시 보기
        </button>
      ) : null}
    </main>
  );
}

function ReadyCard({
  match,
  saved,
  direct,
  route,
  onRemember,
  onForget,
}: {
  match: Extract<MatchResult, { kind: "match" }>;
  saved: boolean;
  direct: boolean;
  route: PrintRoute;
  onRemember: () => void;
  onForget: () => void;
}) {
  const printer = match.printer;
  const inkjet = isInkjet(match);
  const line = inkjet
    ? "잉크젯은 이 브라우저에서 프린터로 바로 넣지 못해요. 아래에서 미리보기만 볼 수 있어요."
    : route === "usb-pdf"
      ? "전체 쪽을 컬러로 보낼 때 USB로 PDF를 바로 넣어요."
      : route === "usb-pcl"
        ? "USB로는 이 브라우저가 흑백으로 바로 넣어요."
        : "삼성 기본 앱으로 넘기지 않고, 이 화면에 미리보기를 띄워요.";
  return (
    <div>
      <p className="text-xs text-muted">확인됨</p>
      <h2 className="mt-1 text-2xl font-semibold leading-tight">
        {printer.brand} {printer.model}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">{line}</p>
      {inkjet ? null : <p className="mt-2 text-sm text-muted">{direct ? "USB로 이 브라우저에서 바로 넣습니다." : "이 화면에 미리보기를 띄웁니다."}</p>}
      <p className="mt-3 text-xs leading-relaxed text-faint">파일을 받지 않고, 이 브라우저에 복사기 종류만 기억합니다.</p>
      {saved ? (
        <button type="button" onClick={onForget} className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-2xl border border-line text-sm">
          <Trash2 className="size-3.5" aria-hidden="true" />
          기억 지우기
        </button>
      ) : (
        <button type="button" onClick={onRemember} className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-2xl border border-line text-sm">
          <Bookmark className="size-3.5" aria-hidden="true" />
          이 복사기 기억하기
        </button>
      )}
    </div>
  );
}

function OfficeOptions({
  paper,
  gray,
  duplex,
  copies,
  route,
  locked,
  controls,
  copyMax,
  onPaper,
  onGray,
  onDuplex,
  onCopies,
}: {
  paper: OfficePaper;
  gray: boolean;
  duplex: DuplexMode;
  copies: number;
  route: PrintRoute;
  locked?: boolean;
  controls: boolean;
  copyMax: number;
  onPaper: (value: OfficePaper) => void;
  onGray: (value: boolean) => void;
  onDuplex: (value: DuplexMode) => void;
  onCopies: (value: number) => void;
}) {
  const liveJob = controls;
  const monoUsb = route === "usb-pcl";
  const sides = [
    ["simplex", "단면"],
    ["long", "긴 쪽 넘김"],
    ["short", "짧은 쪽 넘김"],
  ] as const;
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["A4", "A3", "B5"] as const).map((item) => (
          <button key={item} type="button" disabled={locked} onClick={() => onPaper(item)} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${paper === item ? "bg-accent text-accent-fg" : "border border-line"}`}>
            {item}
          </button>
        ))}
        <button type="button" disabled={monoUsb || locked} onClick={() => onGray(!gray)} className={`h-10 rounded-full px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${monoUsb || gray ? "bg-accent text-accent-fg" : "border border-line"}`}>
          {monoUsb || gray ? "흑백" : "컬러"}
        </button>
      </div>
      <div className={`flex flex-wrap items-center gap-2 ${liveJob && !locked ? "" : "opacity-40"}`}>
        {sides.map(([id, text]) => (
          <button key={id} type="button" disabled={!liveJob || locked} onClick={() => onDuplex(id)} className={`h-10 rounded-full px-3 text-sm disabled:cursor-not-allowed ${duplex === id && liveJob ? "bg-accent text-accent-fg" : "border border-line"}`}>
            {text}
          </button>
        ))}
        <button type="button" disabled={!liveJob || locked} className="size-10 rounded-full border border-line disabled:cursor-not-allowed" onClick={() => onCopies(Math.max(1, copies - 1))} aria-label="장수 줄이기">
          −
        </button>
        <span className="w-8 text-center text-sm tabular-nums">{liveJob ? copies : 1}</span>
        <button type="button" disabled={!liveJob || locked || copies >= copyMax} className="size-10 rounded-full border border-line disabled:cursor-not-allowed" onClick={() => onCopies(Math.min(copyMax, copies + 1))} aria-label="장수 늘리기">
          +
        </button>
      </div>
      {monoUsb ? <p className="text-xs leading-relaxed text-muted">USB 직접 인쇄는 흑백만 지원해요.</p> : null}
      {liveJob ? null : <p className="text-xs text-muted">연결 전에는 장수와 양면을 복사기로 보내지 않아요. 화면 미리보기와 PDF 저장은 따로 있어요.</p>}
    </div>
  );
}

function PrintChooser({
  docKind,
  memo,
  photoUrl,
  album,
  pdfName,
  pdfCount,
  pageMode,
  pageList,
  onPageList,
  pageFrom,
  pageTo,
  sending,
  progress,
  ready,
  showPages = true,
  label,
  canSend = true,
  onConnect,
  preview,
  extras,
  onKind,
  onMemo,
  onPhotos,
  onRemovePhoto,
  onMovePhoto,
  onFocusPhoto,
  onPdfFile,
  pdfNeedsKey,
  onPdfUnlock,
  onPageMode,
  onPageFrom,
  onPageTo,
  onPrint,
  onColorPrint,
  onPdf,
  onCancel,
}: {
  docKind: DocKind;
  memo: string;
  photoUrl: string | null;
  album: string[];
  pdfName: string;
  pdfCount: number;
  pageMode: "all" | "span" | "list";
  pageList: string;
  onPageList: (value: string) => void;
  pageFrom: number;
  pageTo: number;
  sending: boolean;
  progress: number;
  ready: boolean;
  showPages?: boolean;
  label: string;
  canSend?: boolean;
  onConnect?: () => void;
  preview: ReactNode;
  extras?: ReactNode;
  onKind: (kind: DocKind) => void;
  onMemo: (value: string) => void;
  onPhotos: (files: File[]) => void;
  onRemovePhoto: (url: string) => void;
  onMovePhoto: (url: string, dir: -1 | 1) => void;
  onFocusPhoto: (url: string) => void;
  onPdfFile: (file: File | undefined) => void;
  pdfNeedsKey: boolean;
  onPdfUnlock: (password: string) => void;
  onPageMode: (mode: "all" | "span" | "list") => void;
  onPageFrom: (value: number) => void;
  onPageTo: (value: number) => void;
  onPrint: () => void;
  onColorPrint?: () => void;
  onPdf: () => void;
  onCancel: () => void;
}) {
  const tabs = [
    ["pdf", "PDF 문서"],
    ["photo", "사진 인쇄"],
    ["memo", "간단 메모"],
    ["test", "테스트"],
  ] as const;
  return (
    <div className="mt-4">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-subtle p-1" role="tablist">
        {tabs.map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={docKind === id}
            onClick={() => {
              if (!sending) onKind(id);
            }}
            disabled={sending}
            className={`min-h-10 rounded-xl px-1 py-2 text-xs disabled:opacity-40 ${docKind === id ? "bg-accent font-medium text-accent-fg" : "text-muted"}`}
          >
            {text}
          </button>
        ))}
      </div>
      {docKind === "pdf" ? (
        <div className="mt-3 space-y-2">
          <label className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-line text-sm">
            PDF 고르기
            <input type="file" accept="application/pdf,.pdf" disabled={sending} className="sr-only" onChange={(event) => onPdfFile(event.target.files?.[0])} />
          </label>
          {pdfName ? <p className="text-sm text-muted">{pdfName} · 총 {pdfCount}쪽</p> : null}
          {pdfNeedsKey ? (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("pdf-key");
                onPdfUnlock(typeof value === "string" ? value : "");
              }}
            >
              <input name="pdf-key" type="password" placeholder="열기 비밀번호" className="field h-10 min-w-0 flex-1 rounded-xl px-3 text-sm outline-none" />
              <button type="submit" className="h-10 rounded-xl bg-accent px-3 text-sm text-accent-fg">
                열기
              </button>
            </form>
          ) : null}
          {showPages ? (
            <>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={sending} onClick={() => onPageMode("all")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "all" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>
              전체
            </button>
            <button type="button" disabled={!pdfCount || sending} onClick={() => onPageMode("span")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "span" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>
              시작~끝
            </button>
            <button type="button" disabled={!pdfCount || sending} onClick={() => onPageMode("list")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "list" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>
              골라서
            </button>
          </div>
          {pageMode === "list" ? (
            <input value={pageList} onChange={(event) => onPageList(event.target.value)} placeholder="1, 3-5, 8" aria-label="쪽 범위" className="field h-10 w-full rounded-xl px-3 text-sm outline-none" />
          ) : null}
          {pageMode === "span" ? (
            <div className="flex items-center gap-2 text-sm text-fg">
              <input type="number" min={1} max={pdfCount || 1} disabled={sending} value={pageFrom} onChange={(event) => onPageFrom(Number(event.target.value))} className="field h-10 w-16 rounded-xl px-2 text-center disabled:opacity-40" aria-label="시작 페이지" />
              <span>~</span>
              <input type="number" min={1} max={pdfCount || 1} disabled={sending} value={pageTo} onChange={(event) => onPageTo(Number(event.target.value))} className="field h-10 w-16 rounded-xl px-2 text-center disabled:opacity-40" aria-label="끝 페이지" />
            </div>
          ) : null}
            </>
          ) : null}
        </div>
      ) : null}
      {docKind === "photo" ? (
        <div className="mt-3 space-y-2">
          <label className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-line text-sm text-fg">
            사진 여러 장 고르기
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.heic,.heif" multiple disabled={sending} className="sr-only" onChange={(event) => {
              const files = [...(event.target.files ?? [])];
              event.target.value = "";
              onPhotos(files);
            }} />
          </label>
          {album.length ? (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {album.map((src, index) => (
                <li key={src} className="w-16 shrink-0">
                  <button type="button" onClick={() => onFocusPhoto(src)} className={`block overflow-hidden rounded-lg border-2 ${src === photoUrl ? "border-accent" : "border-line"}`}>
                    <img src={src} alt="" className="h-16 w-16 object-cover" />
                  </button>
                  <div className="mt-1 flex items-center justify-between text-xs text-fg">
                    <button type="button" disabled={index === 0} onClick={() => onMovePhoto(src, -1)} aria-label="앞으로">←</button>
                    <button type="button" onClick={() => onRemovePhoto(src)} aria-label="이 사진 삭제"><Trash2 className="size-3.5" /></button>
                    <button type="button" disabled={index === album.length - 1} onClick={() => onMovePhoto(src, 1)} aria-label="뒤로">→</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-xs text-muted">{album.length ? `${album.length}/20장. 순서를 바꿀 수 있어요.` : "JPG·PNG를 한 번에 여러 장 고를 수 있어요. HEIC는 변환이 필요해요."}</p>
        </div>
      ) : null}
      {docKind === "memo" ? (
        <textarea
          value={memo}
          onChange={(event) => onMemo(event.target.value)}
          rows={4}
          disabled={sending}
          placeholder="적을 내용을 적어 주세요"
          className="field mt-3 w-full rounded-xl px-3 py-2 text-sm outline-none"
        />
      ) : null}
      {docKind === "test" ? <p className="mt-3 text-sm text-muted">연결이 되는지 확인하는 시험 페이지입니다.</p> : null}
      {preview}
      {extras}
      {sending ? (
        <button type="button" onClick={onCancel} className="mt-3 h-12 w-full rounded-2xl border border-line text-sm">
          취소 · {progress}%
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {canSend ? (
            <button
              type="button"
              onClick={onPrint}
              disabled={!ready}
              className="btn-send flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-base font-medium text-accent-fg"
            >
              <Printer className="size-5" aria-hidden="true" />
              {label}
            </button>
          ) : (
            <button type="button" onClick={onConnect} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-line text-base font-medium text-fg">
              <Printer className="size-5" aria-hidden="true" />
              프린터 연결하기
            </button>
          )}
          <button type="button" onClick={onColorPrint} disabled={!ready || !onColorPrint} className="h-12 w-full rounded-2xl border border-line text-sm disabled:opacity-40">
            화면 미리보기
          </button>
          <button type="button" onClick={onPdf} disabled={!ready} className="h-12 w-full rounded-2xl border border-line text-sm disabled:opacity-40">
            PDF 저장
          </button>
        </div>
      )}
    </div>
  );
}

function PaperPreview({
  paper,
  gray,
  docKind,
  title,
  memo,
  photoUrl,
  pdfPreview,
  pdfCount,
  previewPage,
  photoFit,
  photoTurn,
  orient = "auto",
  showTools = true,
  onFit,
  onTurn,
  onPreview,
}: {
  paper: OfficePaper;
  gray: boolean;
  docKind: DocKind;
  title: string;
  memo: string;
  photoUrl: string | null;
  pdfPreview: string | null;
  pdfCount: number;
  previewPage: number;
  photoFit: "contain" | "cover";
  photoTurn: number;
  orient?: "auto" | "portrait" | "landscape";
  showTools?: boolean;
  onFit: (fit: "contain" | "cover") => void;
  onTurn: () => void;
  onPreview: (page: number) => void;
}) {
  const pageRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (docKind !== "photo" || !photoUrl) return;
    let stop = false;
    const base = previewSize(paper);
    const size = orient === "landscape" ? { width: base.height, height: base.width } : base;
    void loadImage(photoUrl)
      .then((image) => {
        const canvas = pageRef.current;
        if (stop || !canvas) return;
        canvas.width = size.width;
        canvas.height = size.height;
        drawOfficePage(canvas, { kind: "photo", title, note: "", image, fit: photoFit, turn: photoTurn, gray });
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [docKind, photoUrl, paper, photoFit, photoTurn, gray, title, orient]);

  const emptyPhoto = docKind === "photo" && !photoUrl;
  const emptyMemo = docKind === "memo" && memo.trim().length < 1;
  const emptyPdf = docKind === "pdf" && !pdfPreview;
  const paperClass = `${paper === "A3" ? "a3" : paper === "B5" ? "b5" : ""}${orient === "landscape" ? " is-land" : ""}`;

  return (
    <div className={`preview-stage ${gray ? "gray" : ""}`}>
      <p className="preview-caption text-center text-xs">{paper} 미리보기{docKind === "pdf" && pdfCount ? ` · ${previewPage} / ${pdfCount}쪽` : ""}</p>
      {docKind === "photo" && photoUrl ? (
        <canvas ref={pageRef} className={`sheet-a4 ${paperClass}`} style={{ height: "auto" }} />
      ) : docKind === "pdf" && pdfPreview ? (
        <img src={pdfPreview} alt="" className={`sheet-a4 ${paperClass}`} />
      ) : (
        <div className={`sheet-a4 relative ${paperClass}`}>
          {emptyPhoto ? (
            <p className="on-paper absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed">사진을 고르면 여기에 미리보기가 나타납니다</p>
          ) : emptyMemo ? (
            <p className="on-paper absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed">메모를 적으면 여기에 미리보기가 나타납니다</p>
          ) : emptyPdf ? (
            <p className="on-paper absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed">PDF를 고르면 여기에 미리보기가 나타납니다</p>
          ) : docKind === "memo" ? (
            <p className="absolute inset-0 overflow-hidden whitespace-pre-wrap p-3 text-left text-[11px] leading-snug">{memo}</p>
          ) : (
            <div className="absolute inset-0 p-3 text-left">
              <p className="text-[10px] tracking-wide">인쇄 확인</p>
              <p className="mt-1 text-sm">{title}</p>
            </div>
          )}
        </div>
      )}
      {docKind === "pdf" && pdfCount > 1 ? (
        <div className="preview-pager">
          <button type="button" disabled={previewPage <= 1} onClick={() => onPreview(previewPage - 1)} className="paper-btn disabled:opacity-40">
            {"< 이전"}
          </button>
          <span className="preview-caption min-w-16 text-center text-sm tabular-nums">
            {previewPage} / {pdfCount}
          </span>
          <button type="button" disabled={previewPage >= pdfCount} onClick={() => onPreview(Math.min(pdfCount, previewPage + 1))} className="paper-btn disabled:opacity-40">
            {"다음 >"}
          </button>
        </div>
      ) : null}
      {docKind === "photo" && showTools ? (
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" disabled={emptyPhoto} onClick={() => onFit("contain")} className={`paper-btn disabled:opacity-40 ${photoFit === "contain" && !emptyPhoto ? "is-on" : ""}`}>
            안 잘리게 맞추기
          </button>
          <button type="button" disabled={emptyPhoto} onClick={() => onFit("cover")} className={`paper-btn disabled:opacity-40 ${photoFit === "cover" && !emptyPhoto ? "is-on" : ""}`}>
            꽉 채우기
          </button>
          <button type="button" disabled={emptyPhoto} onClick={onTurn} className="paper-btn disabled:opacity-40">
            90도 회전
          </button>
        </div>
      ) : null}
    </div>
  );
}