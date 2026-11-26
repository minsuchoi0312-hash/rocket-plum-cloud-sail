/**
 * 인쇄 화면 부품: 확인된 기종 카드 · 용지/양면/부수 옵션 · 문서 탭과 하단 버튼 묶음.
 * atlas-app.tsx에서 분리한 컴포넌트.
 */
import { phoneApp } from "@/lib/phone-helper";
import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Bookmark, ChevronDown, FileText, Minus, Plus, Printer, RotateCw, Trash2, Upload, X } from "@/components/icons";
import type { MatchResult } from "@/lib/atlas";
import { MAIN_PAPERS, MORE_PAPERS, paperHint, paperLabel, type DuplexMode, type OfficePaper } from "@/lib/office-job";
import type { PrintRoute } from "@/lib/print-route";
import type { DocKind } from "@/components/paper-preview";
import { tr } from "@/lib/i18n";
import type { MsgKey } from "@/lib/i18n/types";

export function docLabel(kind: DocKind) {
  return tr(`doc.${kind}` as MsgKey);
}

export function isInkjet(match: Extract<MatchResult, { kind: "match" }>) {
  return match.pack.id === "raster-ink";
}

export function ReadyCard({
  match,
  saved,
  direct,
  route,
  viaHelper = false,
  onRemember,
  onForget,
}: {
  match: Extract<MatchResult, { kind: "match" }>;
  saved: boolean;
  direct: boolean;
  route: PrintRoute;
  /** PC 도우미(9100)로 보내는 중이면 USB 문구 대신 도우미 문구를 보여 준다 */
  viaHelper?: boolean;
  onRemember: () => void;
  onForget: () => void;
}) {
  const printer = match.printer;
  const inkjet = isInkjet(match);
  const phone = phoneApp();
  const line = tr(inkjet ? "rc.inkjet" : viaHelper ? (phone ? "ph.ready" : "rc.helper") : route === "usb-pdf" ? "rc.usbPdf" : route === "usb-pcl" ? "rc.usbPcl" : "rc.preview");
  return (
    <div>
      <p className="text-xs text-muted">{tr("rc.confirmed")}</p>
      <h2 className="mt-1 text-2xl font-semibold leading-tight">
        {printer.brand} {printer.model}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">{line}</p>
      {inkjet ? null : <p className="mt-2 text-sm text-muted">{tr(viaHelper ? (phone ? "ph.readyDirect" : "rc.helperDirect") : direct ? "rc.direct" : "rc.previewOnly")}</p>}
      <p className="mt-3 text-xs leading-relaxed text-faint">{tr("rc.memory")}</p>
      {saved ? (
        <button type="button" onClick={onForget} className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-2xl border border-line text-sm">
          <Trash2 className="size-3.5" aria-hidden="true" />
          {tr("rc.forget")}
        </button>
      ) : (
        <button type="button" onClick={onRemember} className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-2xl border border-line text-sm">
          <Bookmark className="size-3.5" aria-hidden="true" />
          {tr("rc.remember")}
        </button>
      )}
    </div>
  );
}

export function OfficeOptions({
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
  colorRaster = false,
  simplexOnly = false,
}: {
  /** 엡손 · SPL 팩: 양면은 아직 단면만 */
  simplexOnly?: boolean;
  /** 엡손 잉크 팩: 래스터지만 컬러로 보낼 수 있고, 양면은 아직 단면만 */
  colorRaster?: boolean;
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
  const monoUsb = route === "usb-pcl" && !colorRaster;
  const sides = [
    ["simplex", tr("opt.simplex")],
    ["long", tr("opt.long")],
    ["short", tr("opt.short")],
  ] as const;
  const [moreOpen, setMoreOpen] = useState(false);
  const morePicked = (MORE_PAPERS as readonly string[]).includes(paper);
  const colorOn = !(monoUsb || gray);
  const idle = !liveJob || locked;
  /* 토스 설정 화면처럼 줄마다 이름 + 분절 버튼, 장수는 − 값 + 캡슐 */
  return (
    <div className="opt-group mt-5">
      <div className="opt-row">
        <span className="opt-label">{tr("opt.paper")}</span>
        <div className="seg" role="radiogroup" aria-label={tr("opt.paper")}>
          {MAIN_PAPERS.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={paper === item}
              disabled={locked}
              onClick={() => {
                onPaper(item);
                setMoreOpen(false);
              }}
              className={`seg-btn ${paper === item ? "is-on" : ""}`}
            >
              {item}
            </button>
          ))}
          {/* 더보기 — 고른 용지가 여기 있으면 그 이름을 보여 준다 */}
          <button type="button" aria-expanded={moreOpen} disabled={locked} onClick={() => setMoreOpen((value) => !value)} className={`seg-btn ${morePicked ? "is-on" : ""}`}>
            <span className="truncate">{morePicked ? paperLabel(paper) : tr("opt.morePaper")}</span>
            <ChevronDown className={`size-3.5 shrink-0 transition-transform ${moreOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </div>
        {moreOpen ? (
          <div className="paper-more" role="radiogroup" aria-label={tr("opt.morePaper")}>
            {MORE_PAPERS.map((item) => (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={paper === item}
                disabled={locked}
                onClick={() => {
                  onPaper(item);
                  setMoreOpen(false);
                }}
                className={`paper-opt ${paper === item ? "is-on" : ""}`}
              >
                <span className="paper-opt-name">{paperLabel(item)}</span>
                <span className="paper-opt-size">{paperHint(item)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="opt-row">
        <span className="opt-label">{tr("opt.colorMode")}</span>
        <div className="seg" role="radiogroup" aria-label={tr("opt.colorMode")}>
          <button type="button" role="radio" aria-checked={colorOn} disabled={monoUsb || locked} onClick={() => onGray(false)} className={`seg-btn ${colorOn ? "is-on" : ""}`}>
            {tr("opt.color")}
          </button>
          <button type="button" role="radio" aria-checked={!colorOn} disabled={monoUsb || locked} onClick={() => onGray(true)} className={`seg-btn ${colorOn ? "" : "is-on"}`}>
            {tr("opt.gray")}
          </button>
        </div>
        {monoUsb ? <p className="opt-note">{tr(phoneApp() ? "ph.mono" : "opt.usbMono")}</p> : null}
      </div>
      <div className={`opt-row ${idle ? "is-idle" : ""}`}>
        <span className="opt-label">{tr("opt.sides")}</span>
        <div className="seg" role="radiogroup" aria-label={tr("opt.sides")}>
          {sides.map(([id, text]) => (
            <button key={id} type="button" role="radio" aria-checked={duplex === id && liveJob} disabled={idle || (simplexOnly && id !== "simplex")} onClick={() => onDuplex(id)} className={`seg-btn ${duplex === id && liveJob ? "is-on" : ""}`}>
              {text}
            </button>
          ))}
        </div>
      </div>
      <div className={`opt-row is-inline ${idle ? "is-idle" : ""}`}>
        <span className="opt-label">{tr("opt.copies")}</span>
        <span className="stepper" role="group" aria-label={tr("opt.copiesAria")}>
          <button type="button" disabled={idle || copies <= 1} onClick={() => onCopies(Math.max(1, copies - 1))} aria-label={tr("opt.less")}>
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="stepper-value">{liveJob ? copies : 1}</span>
          <button type="button" disabled={idle || copies >= copyMax} onClick={() => onCopies(Math.min(copyMax, copies + 1))} aria-label={tr("opt.more")}>
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </span>
      </div>
      {liveJob ? null : <p className="opt-note -mt-1">{tr("opt.connectFirst")}</p>}
    </div>
  );
}

export function PrintChooser({
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
  summary,
  preflight,
  onConnect,
  preview,
  extras,
  onKind,
  onMemo,
  onPhotos,
  onRemovePhoto,
  onMovePhoto,
  photoTurns = {},
  onRotatePhoto,
  busyBanner,
  doneBanner,
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
  summary?: string;
  preflight?: ReactNode;
  onConnect?: () => void;
  preview: ReactNode;
  extras?: ReactNode;
  onKind: (kind: DocKind) => void;
  onMemo: (value: string) => void;
  onPhotos: (files: File[]) => void;
  onRemovePhoto: (url: string) => void;
  onMovePhoto: (url: string, dir: -1 | 1) => void;
  photoTurns?: Record<string, number>;
  onRotatePhoto?: (url: string) => void;
  busyBanner?: ReactNode;
  doneBanner?: ReactNode;
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
  const tabs = (["pdf", "photo", "memo", "test"] as const).map((id) => [id, docLabel(id)] as const);
  return (
    <div className="mt-3">
      <div className="doc-tabs grid grid-cols-4 gap-1 rounded-2xl p-1" role="tablist" aria-label={tr("ch.tabsAria")}>
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
            className={`doc-tab min-h-10 min-w-0 break-words rounded-xl px-1 py-2 text-sm leading-tight disabled:opacity-40 ${docKind === id ? "is-on" : ""}`}
          >
            {text}
          </button>
        ))}
      </div>
      {docKind === "pdf" ? (
        <div className="mt-3 space-y-2">
          <label className="pick flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm">
            <Upload className="size-4" aria-hidden="true" />
            {tr("ch.pickPdf")} <span className="hidden text-xs text-muted sm:inline">{tr("ch.orDrop")}</span>
            <input type="file" accept="application/pdf,.pdf" disabled={sending} className="sr-only" onChange={(event) => onPdfFile(event.target.files?.[0])} />
          </label>
          {pdfName ? (
            /* 고른 파일 — 아이콘 + 이름(굵게) + 쪽수 */
            <div className="file-row" title={tr("ch.pdfInfo", { name: pdfName, n: pdfCount })}>
              <span className="doc-ico is-pdf" aria-hidden="true">
                <FileText className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-fg">{pdfName}</span>
                <span className="block text-sm text-muted tabular-nums">{tr("ch.pdfPages", { n: pdfCount })}</span>
              </span>
            </div>
          ) : null}
          {pdfNeedsKey ? (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("pdf-key");
                onPdfUnlock(typeof value === "string" ? value : "");
              }}
            >
              <input name="pdf-key" type="password" placeholder={tr("ch.pdfKey")} className="field h-10 min-w-0 flex-1 rounded-xl px-3 text-sm outline-none" />
              <button type="submit" className="h-10 rounded-xl bg-accent px-3 text-sm text-accent-fg">
                {tr("ch.open")}
              </button>
            </form>
          ) : null}
          {showPages ? (
            <>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={sending} onClick={() => onPageMode("all")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "all" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>
              {tr("ch.all")}
            </button>
            <button type="button" disabled={!pdfCount || sending} onClick={() => onPageMode("span")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "span" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>
              {tr("ch.span")}
            </button>
            <button type="button" disabled={!pdfCount || sending} onClick={() => onPageMode("list")} className={`h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "list" ? "bg-accent text-accent-fg" : "border border-line text-fg"}`}>
              {tr("ch.list")}
            </button>
          </div>
          {pageMode === "list" ? (
            <input value={pageList} onChange={(event) => onPageList(event.target.value)} placeholder="1, 3-5, 8" aria-label={tr("ch.rangeAria")} className="field h-10 w-full rounded-xl px-3 text-sm outline-none" />
          ) : null}
          {pageMode === "span" ? (
            <div className="flex items-center gap-2 text-sm text-fg">
              <input type="number" min={1} max={pdfCount || 1} disabled={sending} value={pageFrom} onChange={(event) => onPageFrom(Number(event.target.value))} className="field h-10 w-16 rounded-xl px-2 text-center disabled:opacity-40" aria-label={tr("ch.from")} />
              <span>~</span>
              <input type="number" min={1} max={pdfCount || 1} disabled={sending} value={pageTo} onChange={(event) => onPageTo(Number(event.target.value))} className="field h-10 w-16 rounded-xl px-2 text-center disabled:opacity-40" aria-label={tr("ch.to")} />
            </div>
          ) : null}
            </>
          ) : null}
        </div>
      ) : null}
      {docKind === "photo" ? (
        <div className="mt-3 space-y-2">
          <label className="pick flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm text-fg">
            <Upload className="size-4" aria-hidden="true" />
            {tr("ch.pickPhotos")} <span className="hidden text-xs text-muted sm:inline">{tr("ch.paste")}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.heic,.heif" multiple disabled={sending} className="sr-only" onChange={(event) => {
              const files = [...(event.target.files ?? [])];
              event.target.value = "";
              onPhotos(files);
            }} />
          </label>
          {album.length ? (
            <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={tr("ch.photosAria")}>
              {album.map((src, index) => (
                <li key={src} className="thumb-item relative shrink-0">
                  <button type="button" onClick={() => onFocusPhoto(src)} aria-pressed={src === photoUrl} aria-label={tr("ch.photoN", { n: index + 1 })} className={`relative block overflow-hidden rounded-lg border-2 ${src === photoUrl ? "border-accent" : "border-line"}`}>
                    <img src={src} alt="" className="h-[68px] w-[68px] object-cover" style={{ transform: `rotate(${photoTurns[src] || 0}deg)` }} />
                    <span className="thumb-num">{index + 1}</span>
                    {photoTurns[src] ? <span className="thumb-badge">{photoTurns[src]}°</span> : null}
                  </button>
                  {/* 실수로 넣은 사진은 × 한 번으로 빼기 */}
                  <button type="button" disabled={sending} onClick={() => onRemovePhoto(src)} className="thumb-x" aria-label={tr("ch.removeN", { n: index + 1 })} title={tr("ch.removeN", { n: index + 1 })}>
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {album.length && photoUrl && album.includes(photoUrl) ? (
            (() => {
              const at = album.indexOf(photoUrl);
              return (
                <div className="photo-actions grid grid-cols-4 gap-1.5" role="group" aria-label={tr("ch.photoGroup", { n: at + 1 })}>
                  <button type="button" disabled={sending || at === 0} onClick={() => onMovePhoto(photoUrl, -1)} className="chip photo-act rounded-xl">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {tr("ch.forward")}
                  </button>
                  <button type="button" disabled={sending || at === album.length - 1} onClick={() => onMovePhoto(photoUrl, 1)} className="chip photo-act rounded-xl">
                    <ArrowRight className="size-4" aria-hidden="true" />
                    {tr("ch.back")}
                  </button>
                  <button type="button" disabled={sending || !onRotatePhoto} onClick={() => onRotatePhoto?.(photoUrl)} className="chip photo-act rounded-xl">
                    <RotateCw className="size-4" aria-hidden="true" />
                    {tr("ch.rotate")}
                  </button>
                  <button type="button" disabled={sending} onClick={() => onRemovePhoto(photoUrl)} className="chip photo-act is-danger rounded-xl">
                    <Trash2 className="size-4" aria-hidden="true" />
                    {tr("ch.delete")}
                  </button>
                </div>
              );
            })()
          ) : null}
          <p className="text-xs text-muted">{album.length ? tr("ch.albumHint", { n: album.length }) : tr("ch.photoHint")}</p>
        </div>
      ) : null}
      {docKind === "memo" ? (
        <textarea
          value={memo}
          onChange={(event) => onMemo(event.target.value)}
          rows={4}
          disabled={sending}
          placeholder={tr("ch.memoPh")}
          className="field mt-3 w-full rounded-xl px-3 py-2 text-sm outline-none"
        />
      ) : null}
      {docKind === "test" ? <p className="mt-3 text-sm text-muted">{tr("ch.testHint")}</p> : null}
      {preview}
      {extras}
      {doneBanner}
      {preflight}
      {summary ? (
        <p className="summary-bar mt-4 rounded-2xl px-3 py-2.5 text-sm font-medium" aria-live="polite">
          {summary}
        </p>
      ) : null}
      {sending ? (
        busyBanner || (
          <div className="bottom-cta mt-3"><button type="button" onClick={onCancel} className="chip btn-cta w-full">
            {tr("ch.cancel", { p: progress })}
          </button></div>
        )
      ) : (
        <>
          {/* 보조 버튼은 위, 큰 인쇄 버튼은 토스 BottomCTA처럼 화면 아래에 붙어 따라온다 */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={onColorPrint} disabled={!ready || !onColorPrint} className="chip weak h-12 rounded-2xl text-[15px] font-semibold">
              {tr("ch.preview")}
            </button>
            <button type="button" onClick={onPdf} disabled={!ready} className="chip weak h-12 rounded-2xl text-[15px] font-semibold">
              {tr("ch.pdf")}
            </button>
          </div>
          <div className="bottom-cta">
            {canSend ? (
              <button type="button" onClick={onPrint} disabled={!ready} className="btn-send btn-solid btn-cta flex w-full items-center justify-center gap-2">
                <Printer className="size-5" aria-hidden="true" />
                {label}
              </button>
            ) : (
              <button type="button" onClick={onConnect} className="btn-solid btn-cta flex w-full items-center justify-center gap-2">
                <Printer className="size-5" aria-hidden="true" />
                {tr("ch.connect")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
