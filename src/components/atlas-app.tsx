import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bookmark, Globe, Moon, Printer, Sun, Trash2, Usb, Wifi } from "lucide-react";
import { matchQuery, type MatchResult } from "@/lib/atlas";
import { grantedUsb, identifyUsb, pickUsb, sendUsbBytes, watchUsbConnect, watchUsbDisconnect } from "@/lib/discover";
import { canvasObjectUrl, clearPrintRoot, printSheet, type PrintJob } from "@/lib/print-sheet";
import { downloadCanvasPdf, grayCanvas, renderSheetCanvas, sheetMemoChunks } from "@/lib/pdf-page";
import { bundleCommands, canvasPclCommands, drawOfficePage, needsBlankBack, officeMemoChunks, osRasterSize, paperPoints, pclAbortFooter, pclJobFooter, pclJobHeader, pclPageCommands, previewSize, printableSize, wrapPdfJob, type DuplexMode, type OfficePaper } from "@/lib/office-job";
import { canPdfDirect, imagesToPdf, openPdf, pageSpan, renderPdfPage, slicePdf, type OpenedPdf } from "@/lib/pdf-doc";
import { languageIsPcl5, resolvePrintRoute, type PrintRoute } from "@/lib/print-route";
import { usePrinterStore, type SavedPrinter } from "@/lib/printer-store";

type Via = "saved" | "usb" | "bluetooth";
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
};

const VIA_LABEL: Record<Via, string> = {
  saved: "저장",
  usb: "USB",
  bluetooth: "블루투스",
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

function Mark() {
  return (
    <span className="grid size-14 shrink-0 grid-cols-2 overflow-hidden rounded-2xl" aria-hidden="true">
      <span className="flex items-center justify-end bg-paper pr-0.5 text-ink">
        <Printer className="size-6" />
      </span>
      <span className="flex items-center justify-start bg-accent pl-0.5 text-paper">
        <Globe className="size-6" />
      </span>
    </span>
  );
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
  const [phonePrint, setPhonePrint] = useState(false);
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
  const [pageMode, setPageMode] = useState<"all" | "span">("all");
  const [pageFrom, setPageFrom] = useState(1);
  const [pageTo, setPageTo] = useState(1);
  const [previewPage, setPreviewPage] = useState(1);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [photoFit, setPhotoFit] = useState<"contain" | "cover">("contain");
  const [photoTurn, setPhotoTurn] = useState(0);
  const stopRef = useRef(false);
  const photoUrlRef = useRef<string | null>(null);
  const photoGen = useRef(0);
  const pdfRef = useRef<{ bytes: Uint8Array; opened: OpenedPdf } | null>(null);
  const previewReq = useRef(0);

  useEffect(() => {
    const savedTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(savedTheme);
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setPhonePrint(ios);
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
    return () => {
      photoGen.current += 1;
      const url = photoUrlRef.current;
      photoUrlRef.current = null;
      if (url) URL.revokeObjectURL(url);
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
      setNotice(linked.live ? "USB로 연결했어요." : "USB로 기기는 잡았어요. 인쇄할 내용을 고르면 인쇄 창이 열려요.");
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

  function backToConnect() {
    if (sending) return;
    clearPrintRoot();
    setPdfBytes(null);
    setPdfPreview(null);
    setPdfName("");
    setPdfCount(0);
    setPdfKey("");
    setPdfNeedsKey(false);
    setStep("connect");
    setSelectedId(null);
    setOverrideQuery(null);
    setAskName("");
    setNotice("");
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

  function choosePhoto(file: File | undefined) {
    if (!file || sending) return;
    if (/\.heic$|\.heif$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif") {
      setNotice("HEIC 사진은 지원하지 않아요. JPG/PNG로 바꿔서 골라 주세요.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setNotice("사진이 너무 커요. JPG나 PNG로, 긴 변 2000px 정도로 줄여 주세요.");
      return;
    }
    clearPrintRoot();
    const token = ++photoGen.current;
    const raw = URL.createObjectURL(file);
    const keep = (next: string) => {
      if (token !== photoGen.current) {
        URL.revokeObjectURL(next);
        return;
      }
      const previous = photoUrlRef.current;
      photoUrlRef.current = next;
      if (previous && previous !== next) URL.revokeObjectURL(previous);
      setPhotoUrl(next);
      setDocKind("photo");
    };
    void loadImage(raw)
      .then(async (image) => {
        const long = Math.max(image.width, image.height);
        let next = raw;
        if (image.width * image.height >= 40_000_000 || long > 2000) {
          const scale = 2000 / long;
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
          if (blob) {
            URL.revokeObjectURL(raw);
            next = URL.createObjectURL(blob);
          }
        }
        keep(next);
      })
      .catch(() => keep(raw));
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
        const size = previewSize(paper);
        const canvas = await renderPdfPage(opened.doc, page, size.width, size.height, slot);
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
  }, [pdfBytes, previewPage, paper, pdfKey]);

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
  const route: PrintRoute = resolvePrintRoute({
    liveUsb: Boolean(selected?.live && selected.usbKey),
    cmd: selected?.cmd || "",
    catalogPcl5,
    catalogSure: Boolean(match && sure),
    pdfBytes: Boolean(pdfBytes),
    docKind,
    pageMode,
    gray,
    pdfDirect: Boolean(pdfBytes && canPdfDirect(pdfBytes)),
  });

  async function buildSystem(forceColor = false): Promise<PrintJob> {
    const useGray = forceColor ? false : gray;
    const title = match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || "인쇄";
    const note = docKind === "memo" ? memo.trim() : "인쇄 창에서 이 복사기를 고르세요.";
    if (docKind === "pdf" && pdfBytes) {
      const opened = await openPdf(pdfBytes, pdfKey || undefined);
      try {
        const numbers = pageSpan(opened.doc.numPages, pageMode, pageFrom, pageTo);
        const size = osRasterSize(paper, numbers.length);
        const urls: string[] = [];
        for (const number of numbers) {
          const canvas = await renderPdfPage(opened.doc, number, size.width, size.height);
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
    if (docKind === "photo" && photoUrl) return { kind: "photo", src: photoUrl, fit: photoFit, turn: photoTurn, paper, gray: useGray };
    if (docKind === "memo") return { kind: "memo", text: memo.trim(), paper, gray: useGray };
    return { kind: "test", title, note, paper, gray: useGray };
  }

  async function onPrint() {
    if (sending) return;
    const pages = pageSpan(pdfCount, pageMode, pageFrom, pageTo);
    if (docKind === "pdf" && (!pdfBytes || pages.length < 1)) {
      setNotice("PDF를 골라 주세요.");
      return;
    }
    if (docKind === "memo" && memo.trim().length < 1) {
      setNotice("메모를 적어 주세요.");
      return;
    }
    if (docKind === "photo" && !photoUrl) {
      setNotice("사진을 골라 주세요.");
      return;
    }
    const title = match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || "인쇄";
    const note = docKind === "memo" ? memo.trim() : "인쇄 창에서 이 복사기를 고르세요.";
    if (route === "os-print" || !selected?.usbKey) {
      await printSheet(await buildSystem());
      setNotice(dialogNotice("인쇄 창을 열었어요. 거기서 이 복사기를 고르면 돼요."));
      return;
    }
    const usbKey = selected.usbKey;
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
        await sendUsbBytes(usbKey, packet, () => progress(Math.round(((index + 1) / packets.length) * 100)), () => false, true);
      }
    };
    try {
      if (route === "usb-pdf" && pdfBytes) {
        const bytes = wrapPdfJob(pdfBytes, { copies, duplex, paper, pages: Math.max(1, pdfCount) });
        setProgress(8);
        await sendUsbBytes(usbKey, bytes, (percent) => setProgress(8 + Math.round(percent * 0.92)), stop);
      } else {
        const size = printableSize(paper);
        const memoChunks = docKind === "memo" ? officeMemoChunks(note, size.width, size.height) : null;
        const jobPages = docKind === "pdf" ? Math.max(1, pages.length) : memoChunks?.length || 1;
        await sendUsbBytes(usbKey, pclJobHeader({ copies, duplex, paper, pages: jobPages }), () => setProgress(2), stop, true);
        started = true;
        if (stopRef.current) throw new Error("보내기를 멈췄어요.");
        if (docKind === "pdf" && pdfBytes) {
          const opened = await openPdf(pdfBytes, pdfKey || undefined);
          try {
            const listPages = pageSpan(opened.doc.numPages, pageMode, pageFrom, pageTo);
            for (const [index, number] of listPages.entries()) {
              if (stopRef.current) throw new Error("보내기를 멈췄어요.");
              const canvas = await renderPdfPage(opened.doc, number, size.width, size.height);
              if (!canvas || stopRef.current) {
                if (canvas) {
                  canvas.width = 0;
                  canvas.height = 0;
                }
                throw new Error("보내기를 멈췄어요.");
              }
              const commands = canvasPclCommands(canvas, "dither");
              canvas.width = 0;
              canvas.height = 0;
              const percent = Math.round(4 + ((index + 1) / listPages.length) * 90);
              await sendPackets(commands, () => setProgress(percent));
            }
            if (needsBlankBack(listPages.length, duplex)) {
              await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
            }
          } finally {
            await opened.destroy();
          }
        } else if (memoChunks) {
          for (const [index, chunk] of memoChunks.entries()) {
            if (stopRef.current) throw new Error("보내기를 멈췄어요.");
            const canvas = document.createElement("canvas");
            canvas.width = size.width;
            canvas.height = size.height;
            drawOfficePage(canvas, { kind: "memo", title, note: chunk, gray: true });
            const commands = canvasPclCommands(canvas, "threshold");
            canvas.width = 0;
            canvas.height = 0;
            await sendPackets(commands, () => setProgress(Math.round(8 + ((index + 1) / memoChunks.length) * 84)));
          }
          if (needsBlankBack(memoChunks.length, duplex)) {
            await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
          }
        } else {
          const canvas = document.createElement("canvas");
          canvas.width = size.width;
          canvas.height = size.height;
          const image = docKind === "photo" && photoUrl ? await loadImage(photoUrl) : null;
          drawOfficePage(canvas, { kind: docKind, title, note, image, fit: photoFit, turn: photoTurn, gray: true });
          if (stopRef.current) throw new Error("보내기를 멈췄어요.");
          const commands = canvasPclCommands(canvas, docKind === "photo" ? "dither" : "threshold");
          canvas.width = 0;
          canvas.height = 0;
          await sendPackets(commands, (percent) => setProgress(8 + Math.round(percent * 0.84)));
          if (needsBlankBack(1, duplex)) {
            await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
          }
        }
        if (stopRef.current) throw new Error("보내기를 멈췄어요.");
        await sendUsbBytes(usbKey, pclJobFooter(), () => setProgress(100), () => false, true);
        started = false;
      }
      if (stopRef.current) {
        setNotice("보내기를 멈췄어요.");
        return;
      }
      setNotice("USB로 보냈어요.");
    } catch (error) {
      if (started && !fatalUsb(error)) {
        try {
          await sendUsbBytes(usbKey, pclAbortFooter(), undefined, () => false, true);
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
        setNotice(dialogNotice(humanError(error, "바로 넣지는 못해서 인쇄 창을 열었어요.")));
        await printSheet(await buildSystem());
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
    setNotice(dialogNotice("인쇄 창을 열었어요. 거기서 컬러로 고르면 돼요."));
  }

  function dialogNotice(base: string) {
    const count = docKind === "pdf" ? pageSpan(pdfCount, pageMode, pageFrom, pageTo).length : 0;
    const safari = typeof navigator !== "undefined" && /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|Edg|Android/i.test(navigator.userAgent);
    const notes = [base];
    if (count > 30) notes.push("30쪽이 넘어 인쇄 창 해상도를 낮췄어요. 더 선명하게 찍으려면 30쪽씩 나눠 주세요.");
    if (safari && (paper === "A3" || paper === "B5")) notes.push("사파리 인쇄 창에서 용지 크기를 한 번 더 확인해 주세요.");
    return notes.join(" ");
  }

  const skippedConfirm = step === "print" && !(match && sure);
  const stepNo = step === "print" ? 3 : step === "confirm" ? 2 : 1;
  const chosenPages = pageSpan(pdfCount, pageMode, pageFrom, pageTo);
  const readyDoc = docKind === "test" || (docKind === "photo" ? Boolean(photoUrl) : docKind === "memo" ? memo.trim().length > 0 : Boolean(pdfBytes && chosenPages.length && !pdfNeedsKey));
  const viaName = selected?.live && selected.usbKey ? "USB" : "와이파이 (인쇄 창)";

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
          const size = osRasterSize(paper, chosenPages.length);
          const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
          for (const number of chosenPages) {
            const canvas = await renderPdfPage(opened.doc, number, size.width, size.height);
            if (!canvas) throw new Error("PDF로 만들지 못했어요.");
            grayCanvas(canvas);
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
            canvas.width = 0;
            canvas.height = 0;
            if (!blob) throw new Error("PDF로 만들지 못했어요.");
            sheets.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), width: size.width, height: size.height });
          }
          const bytes = await imagesToPdf(sheets, paperPoints(paper));
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
        const chunks = sheetMemoChunks(memo.trim(), paper);
        const sheets: { jpeg: Uint8Array; width: number; height: number }[] = [];
        for (const chunk of chunks) {
          const canvas = await renderSheetCanvas({
            kind: "memo",
            title: "",
            note: chunk,
            paper,
            gray,
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
        const bytes = await imagesToPdf(sheets, paperPoints(paper));
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
      const image = docKind === "photo" && photoUrl ? await loadImage(photoUrl) : null;
      const canvas = await renderSheetCanvas({
        kind: docKind === "photo" ? "photo" : "test",
        title: match ? `${match.printer.brand} ${match.printer.model}` : "인쇄",
        note: "인쇄 창에서 이 복사기를 고르세요.",
        paper,
        image,
        fit: photoFit,
        turn: photoTurn,
        gray,
      });
      if (gray) grayCanvas(canvas);
      const page = paper === "A3" ? { width: 841.89, height: 1190.55 } : paper === "B5" ? { width: 515.91, height: 728.5 } : { width: 595.28, height: 841.89 };
      await downloadCanvasPdf(canvas, "인쇄", page);
    } catch (error) {
      setNotice(humanError(error, "PDF로 만들지 못했어요."));
    }
  }

  return (
    <main className="shell mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6 sm:py-10">
      {inApp ? (
        <p className="rounded-2xl border border-warn bg-subtle px-4 py-3 text-sm leading-relaxed">
          이 앱 안에서는 복사기를 열 수 없어요. 메뉴에서 Chrome이나 Safari로 열어 주세요.
        </p>
      ) : null}
      <header className="flex items-center gap-3">
        <Mark />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold leading-none">인쇄</h1>
          <p className="mt-1 text-sm leading-snug text-muted">
            사무용 복사기·복합기를 USB로 바로 연결하거나,
            <br />
            사내 와이파이 인쇄 창으로 인쇄합니다.
          </p>
        </div>
        <button type="button" onClick={toggleTheme} className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-subtle" aria-label={theme === "dark" ? "밝게" : "어둡게"}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </header>
      <ol className="grid grid-cols-3 gap-2 text-center text-xs">
        {["연결", "확인", "인쇄"].map((label, index) => {
          const skipped = skippedConfirm && index === 1;
          const on = stepNo === index + 1;
          return (
            <li key={label} className={`rounded-full px-2 py-2 ${on ? "bg-accent text-accent-fg" : "bg-subtle text-muted"}`}>
              {skipped ? "2. 건너뜀" : `${index + 1}. ${label}`}
            </li>
          );
        })}
      </ol>
      {skippedConfirm ? <p className="-mt-2 text-center text-xs text-muted">복사기 확인은 넘어갔어요. 인쇄할 내용만 고르면 됩니다.</p> : null}
      {step === "print" ? (
        <p className="rounded-2xl bg-subtle px-4 py-3 text-sm text-fg">
          연결 방식: {viaName}
          <button type="button" onClick={backToConnect} disabled={sending} className="ml-2 font-medium disabled:opacity-40">
            · 바꾸기
          </button>
        </p>
      ) : null}
      {step === "connect" ? (
        <section className="panel rounded-3xl p-4 sm:p-5">
          {saved[0] ? (
            <button type="button" onClick={useRecent} className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-3 py-3 text-left">
              <span>
                <span className="block text-sm font-medium">최근 복사기 바로 쓰기</span>
                <span className="mt-0.5 block text-xs text-ink/60">{saved[0].title}</span>
              </span>
              <Printer className="size-4 shrink-0" aria-hidden="true" />
            </button>
          ) : null}
          {phonePrint ? <WifiLane primary onOpen={openChooser} /> : null}
          <button type="button" onClick={() => void connectUsb(false)} className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-medium ${phonePrint ? "mt-3 border border-ink/15" : "bg-accent text-accent-fg"}`}>
            <Usb className="size-5" aria-hidden="true" />
            선으로 연결
          </button>
          {usbMissed ? (
            <button type="button" onClick={() => void connectUsb(true)} className="mt-2 text-xs text-ink/60 underline-offset-2 hover:underline">
              USB 목록에 없으면 다른 기기도 보기
            </button>
          ) : null}
          {phonePrint ? null : <WifiLane onOpen={openChooser} />}
          <p className="mt-4 text-sm text-ink/70" aria-live="polite">
            {scanning ? "전에 연결했던 복사기가 있나 보고 있어요." : selected?.live ? "연결되어 있어요." : "위에서 하나만 누르면 돼요."}
          </p>
          {notice ? <p className="mt-2 text-sm text-warn">{notice}</p> : null}
          {list.length > 0 ? (
            <ul className="mt-4 space-y-2">
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
                        setStep(stageForQuery(item.query, item.cmd));
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left ${on ? "border-accent bg-white" : "border-ink/10 bg-white/70"}`}
                    >
                      <Printer className="size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.title}</span>
                        <span className="mt-0.5 block text-xs text-ink/60">{item.subtitle}</span>
                      </span>
                      <span className={`text-xs ${item.live ? "text-ok" : "text-ink/50"}`}>{item.live ? "연결됨" : VIA_LABEL[item.via]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
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
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {result?.kind === "list" ? "이름이 여러 기종에 걸려요. 앞면에 적힌 글자를 조금 더 적어 주세요." : "앞면에 적힌 이름을 알면, 바로 보낼지 인쇄 창으로 열지를 골라요."}
              </p>
              <input value={askName} onChange={(event) => setAskName(event.target.value)} placeholder="예: 신도리코 D450, 캐논 iR-ADV C3530, 후지필름 Apeos" className="mt-4 h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none" />
              <div className="mt-3 flex flex-col gap-2">
                <button type="submit" className="h-12 rounded-2xl bg-accent text-sm font-medium text-accent-fg">
                  이 이름으로 볼게요
                </button>
                <button type="button" onClick={openChooser} className="h-12 rounded-2xl border border-ink/15 text-sm">
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
                  direct={route !== "os-print"}
                  route={route}
                  onRemember={onRemember}
                  onForget={() => {
                    if (remembered) forget(remembered.uid);
                  }}
                />
              ) : (
                <h2 className="text-2xl font-semibold">무엇을 인쇄할까요?</h2>
              )}
              <OfficeOptions paper={paper} gray={gray} duplex={duplex} copies={copies} route={route} locked={sending} onPaper={setPaper} onGray={setGray} onDuplex={setDuplex} onCopies={setCopies} />
              <PrintChooser
                docKind={docKind}
                memo={memo}
                photoUrl={photoUrl}
                pdfName={pdfName}
                pdfCount={pdfCount}
                pageMode={pageMode}
                pageFrom={pageFrom}
                pageTo={pageTo}
                sending={sending}
                progress={progress}
                ready={readyDoc}
                label={route === "os-print" ? "이 기기의 인쇄 창으로 열기" : "USB로 바로 인쇄"}
                preview={<PaperPreview paper={paper} gray={gray || route === "usb-pcl"} docKind={docKind} title={match ? `${match.printer.brand} ${match.printer.model}` : "인쇄"} memo={memo} photoUrl={photoUrl} pdfPreview={pdfPreview} pdfCount={pdfCount} previewPage={previewPage} photoFit={photoFit} photoTurn={photoTurn} onFit={setPhotoFit} onTurn={() => setPhotoTurn((value) => (value + 90) % 360)} onPreview={setPreviewPage} />}
                onKind={setDocKind}
                onMemo={setMemo}
                onPhoto={choosePhoto}
                onPdfFile={choosePdf}
                pdfNeedsKey={pdfNeedsKey}
                onPdfUnlock={setPdfKey}
                onPageMode={setPageMode}
                onPageFrom={setPageFrom}
                onPageTo={setPageTo}
                onPrint={() => void onPrint()}
                onColorPrint={route === "usb-pcl" ? () => void onColorPrint() : undefined}
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
          <li>컴퓨터는 Chrome으로 여세요. 선을 꽂고 선으로 연결을 누르면 복사기 목록이 나옵니다.</li>
          <li>아이폰은 선을 여기서 못 잡습니다. 인쇄할 내용 고르기를 누른 뒤, 인쇄 창에서 복사기를 고르세요.</li>
          <li>같은 와이파이에 복사기가 안 보이면, 폰이나 컴퓨터 설정에서 한 번 추가하세요.</li>
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

function WifiLane({ primary, onOpen }: { primary?: boolean; onOpen: () => void }) {
  return (
    <div className={`wifi-card rounded-2xl p-3 ${primary ? "" : "mt-5"}`}>
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Wifi className="size-4" aria-hidden="true" />
        와이파이
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">같은 와이파이에 있는 복사기는 따로 연결하지 않고, 인쇄 창에서 바로 고릅니다.</p>
      <button type="button" onClick={onOpen} className={`mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium ${primary ? "bg-accent text-accent-fg" : "bg-navy text-paper"}`}>
        <Printer className="size-4" aria-hidden="true" />
        인쇄할 내용 고르기
      </button>
    </div>
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
    ? "잉크젯은 웹에서 바로 보낼 수 없어 이 기기의 인쇄 창을 엽니다. 목록에 없으면 폰이나 PC 설정에서 복사기를 먼저 추가해야 합니다."
    : route === "usb-pdf"
      ? "전체 쪽을 컬러로 보낼 때 USB로 PDF를 바로 넣어요."
      : route === "usb-pcl"
        ? "USB로는 흑백으로 바로 넣어요. 컬러는 인쇄 창을 쓰면 됩니다."
        : "이 기기의 인쇄 창으로 열어서 인쇄해요.";
  return (
    <div>
      <p className="text-xs text-ink/60">확인됨</p>
      <h2 className="mt-1 text-2xl font-semibold leading-tight">
        {printer.brand} {printer.model}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">{line}</p>
      {inkjet ? null : <p className="mt-2 text-sm text-ink/70">{direct ? "USB로 바로 인쇄합니다." : "이 기기의 인쇄 창으로 엽니다."}</p>}
      <p className="mt-3 text-xs leading-relaxed text-ink/55">파일을 받지 않고, 이 브라우저에 복사기 종류만 기억합니다.</p>
      {saved ? (
        <button type="button" onClick={onForget} className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-2xl border border-ink/15 text-sm">
          <Trash2 className="size-3.5" aria-hidden="true" />
          기억 지우기
        </button>
      ) : (
        <button type="button" onClick={onRemember} className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-2xl border border-ink/15 text-sm">
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
  onPaper: (value: OfficePaper) => void;
  onGray: (value: boolean) => void;
  onDuplex: (value: DuplexMode) => void;
  onCopies: (value: number) => void;
}) {
  const usbJob = route !== "os-print";
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
          <button key={item} type="button" disabled={locked} onClick={() => onPaper(item)} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${paper === item ? "bg-navy text-paper" : "border border-ink/15"}`}>
            {item}
          </button>
        ))}
        <button type="button" disabled={monoUsb || locked} onClick={() => onGray(!gray)} className={`h-10 rounded-full px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${monoUsb || gray ? "bg-navy text-paper" : "border border-ink/15"}`}>
          {monoUsb || gray ? "흑백" : "컬러"}
        </button>
      </div>
      {monoUsb ? <p className="text-xs leading-relaxed text-ink/70">USB 기본 인쇄는 흑백만 지원해요. 컬러는 인쇄 창을 이용해 주세요.</p> : null}
      <div className={`flex flex-wrap items-center gap-2 ${usbJob && !locked ? "" : "opacity-40"}`}>
        {sides.map(([id, text]) => (
          <button key={id} type="button" disabled={!usbJob || locked} onClick={() => onDuplex(id)} className={`h-10 rounded-full px-3 text-sm disabled:cursor-not-allowed ${duplex === id && usbJob ? "bg-navy text-paper" : "border border-ink/15"}`}>
            {text}
          </button>
        ))}
        <button type="button" disabled={!usbJob || locked} className="size-10 rounded-full border border-ink/15 disabled:cursor-not-allowed" onClick={() => onCopies(Math.max(1, copies - 1))} aria-label="장수 줄이기">
          −
        </button>
        <span className="w-8 text-center text-sm tabular-nums">{usbJob ? copies : 1}</span>
        <button type="button" disabled={!usbJob || locked} className="size-10 rounded-full border border-ink/15 disabled:cursor-not-allowed" onClick={() => onCopies(Math.min(9, copies + 1))} aria-label="장수 늘리기">
          +
        </button>
      </div>
      {usbJob ? null : <p className="text-xs text-ink/55">장수와 양면은 인쇄 창에서 고릅니다.</p>}
    </div>
  );
}

function PrintChooser({
  docKind,
  memo,
  photoUrl,
  pdfName,
  pdfCount,
  pageMode,
  pageFrom,
  pageTo,
  sending,
  progress,
  ready,
  label,
  preview,
  onKind,
  onMemo,
  onPhoto,
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
  pdfName: string;
  pdfCount: number;
  pageMode: "all" | "span";
  pageFrom: number;
  pageTo: number;
  sending: boolean;
  progress: number;
  ready: boolean;
  label: string;
  preview: ReactNode;
  onKind: (kind: DocKind) => void;
  onMemo: (value: string) => void;
  onPhoto: (file: File | undefined) => void;
  onPdfFile: (file: File | undefined) => void;
  pdfNeedsKey: boolean;
  onPdfUnlock: (password: string) => void;
  onPageMode: (mode: "all" | "span") => void;
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
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-ink/5 p-1" role="tablist">
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
            className={`min-h-10 rounded-xl px-1 py-2 text-xs disabled:opacity-40 ${docKind === id ? "bg-white font-medium" : "text-ink/60"}`}
          >
            {text}
          </button>
        ))}
      </div>
      {docKind === "pdf" ? (
        <div className="mt-3 space-y-2">
          <label className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-ink/15 text-sm">
            PDF 고르기
            <input type="file" accept="application/pdf,.pdf" disabled={sending} className="sr-only" onChange={(event) => onPdfFile(event.target.files?.[0])} />
          </label>
          {pdfName ? <p className="text-sm text-ink/70">{pdfName} · 총 {pdfCount}쪽</p> : null}
          {pdfNeedsKey ? (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("pdf-key");
                onPdfUnlock(typeof value === "string" ? value : "");
              }}
            >
              <input name="pdf-key" type="password" placeholder="열기 비밀번호" className="h-10 min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none" />
              <button type="submit" className="h-10 rounded-xl bg-navy px-3 text-sm text-paper">
                열기
              </button>
            </form>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={sending} onClick={() => onPageMode("all")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "all" ? "bg-navy text-paper" : "border border-ink/15"}`}>
              전체
            </button>
            <button type="button" disabled={!pdfCount || sending} onClick={() => onPageMode("span")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "span" ? "bg-navy text-paper" : "border border-ink/15"}`}>
              시작~끝
            </button>
          </div>
          {pageMode === "span" ? (
            <div className="flex items-center gap-2 text-sm">
              <input type="number" min={1} max={pdfCount || 1} disabled={sending} value={pageFrom} onChange={(event) => onPageFrom(Number(event.target.value))} className="h-10 w-16 rounded-xl border border-ink/15 bg-white px-2 text-center disabled:opacity-40" aria-label="시작 페이지" />
              <span>~</span>
              <input type="number" min={1} max={pdfCount || 1} disabled={sending} value={pageTo} onChange={(event) => onPageTo(Number(event.target.value))} className="h-10 w-16 rounded-xl border border-ink/15 bg-white px-2 text-center disabled:opacity-40" aria-label="끝 페이지" />
            </div>
          ) : null}
        </div>
      ) : null}
      {docKind === "photo" ? (
        <div className="mt-3">
          <label className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-ink/15 text-sm">
            사진 고르기
            <input type="file" accept="image/*" disabled={sending} className="sr-only" onChange={(event) => onPhoto(event.target.files?.[0])} />
          </label>
        </div>
      ) : null}
      {docKind === "memo" ? (
        <textarea
          value={memo}
          onChange={(event) => onMemo(event.target.value)}
          rows={4}
          disabled={sending}
          placeholder="적을 내용을 적어 주세요"
          className="mt-3 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none"
        />
      ) : null}
      {docKind === "test" ? <p className="mt-3 text-sm text-ink/70">연결이 되는지 확인하는 시험 페이지입니다.</p> : null}
      {preview}
      {sending ? (
        <button type="button" onClick={onCancel} className="mt-3 h-12 w-full rounded-2xl border border-ink/15 text-sm">
          취소 · {progress}%
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={onPrint}
            disabled={!ready}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-base font-medium text-accent-fg disabled:opacity-40"
          >
            <Printer className="size-5" aria-hidden="true" />
            {label}
          </button>
          {onColorPrint ? (
            <button type="button" onClick={onColorPrint} disabled={!ready} className="h-12 w-full rounded-2xl border border-ink/15 text-sm disabled:opacity-40">
              컬러로 인쇄 창 열기
            </button>
          ) : null}
          <button type="button" onClick={onPdf} disabled={!ready} className="h-12 w-full rounded-2xl border border-ink/15 text-sm disabled:opacity-40">
            PDF로 저장
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
  onFit: (fit: "contain" | "cover") => void;
  onTurn: () => void;
  onPreview: (page: number) => void;
}) {
  const pageRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (docKind !== "photo" || !photoUrl) return;
    let stop = false;
    const size = previewSize(paper);
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
  }, [docKind, photoUrl, paper, photoFit, photoTurn, gray, title]);

  const emptyPhoto = docKind === "photo" && !photoUrl;
  const emptyMemo = docKind === "memo" && memo.trim().length < 1;
  const emptyPdf = docKind === "pdf" && !pdfPreview;
  const paperClass = paper === "A3" ? "a3" : paper === "B5" ? "b5" : "";

  return (
    <div className={`preview-stage ${gray ? "gray" : ""}`}>
      <p className="text-center text-xs text-ink/70">{paper} 미리보기{docKind === "pdf" && pdfCount ? ` · ${previewPage} / ${pdfCount}쪽` : ""}</p>
      {docKind === "photo" && photoUrl ? (
        <canvas ref={pageRef} className={`sheet-a4 ${paperClass}`} style={{ height: "auto" }} />
      ) : docKind === "pdf" && pdfPreview ? (
        <img src={pdfPreview} alt="" className={`sheet-a4 ${paperClass}`} />
      ) : (
        <div className={`sheet-a4 relative ${paperClass}`}>
          {emptyPhoto ? (
            <p className="absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed text-ink/60">사진을 고르면 여기에 미리보기가 나타납니다</p>
          ) : emptyMemo ? (
            <p className="absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed text-ink/60">메모를 적으면 여기에 미리보기가 나타납니다</p>
          ) : emptyPdf ? (
            <p className="absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed text-ink/60">PDF를 고르면 여기에 미리보기가 나타납니다</p>
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
      {docKind === "pdf" && pdfCount > 0 ? (
        <div className="flex items-center justify-center gap-2">
          <button type="button" disabled={previewPage <= 1} onClick={() => onPreview(previewPage - 1)} className="h-10 rounded-full border border-ink/15 bg-white px-3 text-sm disabled:opacity-40">
            {"< 이전"}
          </button>
          <span className="min-w-16 text-center text-sm tabular-nums">
            {previewPage} / {pdfCount}
          </span>
          <button type="button" disabled={previewPage >= pdfCount} onClick={() => onPreview(Math.min(pdfCount, previewPage + 1))} className="h-10 rounded-full border border-ink/15 bg-white px-3 text-sm disabled:opacity-40">
            {"다음 >"}
          </button>
        </div>
      ) : null}
      {docKind === "photo" ? (
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" disabled={emptyPhoto} onClick={() => onFit("contain")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${photoFit === "contain" && !emptyPhoto ? "bg-navy text-paper" : "border border-ink/15 bg-white"}`}>
            안 잘리게 맞추기
          </button>
          <button type="button" disabled={emptyPhoto} onClick={() => onFit("cover")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${photoFit === "cover" && !emptyPhoto ? "bg-navy text-paper" : "border border-ink/15 bg-white"}`}>
            꽉 채우기
          </button>
          <button type="button" disabled={emptyPhoto} onClick={onTurn} className="h-10 rounded-full border border-ink/15 bg-white px-3 text-sm disabled:opacity-40">
            90도 회전
          </button>
        </div>
      ) : null}
    </div>
  );
}