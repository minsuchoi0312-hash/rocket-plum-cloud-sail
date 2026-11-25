/**
 * 인쇄 옵션 패널: 빠른 설정 · 용지/양면/부수 · 쪽 범위(+쪽 번호 그리드) · 사진 필터/배치 · 메모 서식 · 고급 옵션.
 * atlas-app.tsx에서 분리. 상태는 모두 부모가 갖고, 여기서는 그리기만 한다.
 */
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { FileText } from "@/components/icons";
import { MARGIN_MM, WATERMARK_PRESETS, watermarkLabel, type MarginMode } from "@/lib/compose-sheet";
import { ID_SPECS, photoFilterLabel, type PhotoFilter, type PhotoLayout } from "@/lib/image-enhance";
import { memoSizeLabel, type MemoSize } from "@/lib/memo-sheet";
import type { DuplexMode, OfficePaper } from "@/lib/office-job";
import type { PrintRoute } from "@/lib/print-route";
import type { Preset, PresetSettings } from "@/lib/presets";
import { marginLabel, type PageChip } from "@/lib/app-utils";
import { tr } from "@/lib/i18n";
import type { DocKind } from "@/components/paper-preview";
import { OfficeOptions } from "@/components/print-parts";
import { PresetBar } from "@/components/preset-bar";

type Set<T> = Dispatch<SetStateAction<T>>;

export type PrintOptionsProps = {
  docKind: DocKind;
  sending: boolean;
  route: PrintRoute;
  jobControls: boolean;
  presetCurrent: PresetSettings;
  activePresetId: string | null;
  applyPreset: (preset: Preset) => void;
  onPresetSaved: (preset: Preset) => void;
  setNotice: (text: string) => void;
  paper: OfficePaper;
  setPaper: Set<OfficePaper>;
  gray: boolean;
  setGray: Set<boolean>;
  duplex: DuplexMode;
  setDuplex: Set<DuplexMode>;
  copies: number;
  setCopies: Set<number>;
  pdfCount: number;
  chosenPages: number[];
  currentPage: number;
  pageChip: PageChip;
  pickPages: (chip: PageChip) => void;
  pageList: string;
  setPageList: Set<string>;
  onTogglePage: (n: number) => void;
  reverse: boolean;
  setReverse: Set<boolean>;
  evenReverse: () => void;
  photoFilter: PhotoFilter;
  onPhotoFilter: (value: PhotoFilter) => void;
  photoLayout: PhotoLayout;
  onPhotoLayout: (value: PhotoLayout) => void;
  idLayout: boolean;
  cutLines: boolean;
  setCutLines: Set<boolean>;
  memoSize: MemoSize;
  setMemoSize: Set<MemoSize>;
  memoHeader: boolean;
  setMemoHeader: Set<boolean>;
  memoTitle: string;
  setMemoTitle: Set<string>;
  onTextFile: (file: File) => void;
  advancedOpen: boolean;
  setAdvancedOpen: Set<boolean>;
  margin: MarginMode;
  setMargin: Set<MarginMode>;
  marginMm: number;
  pageNumber: boolean;
  setPageNumber: Set<boolean>;
  wmChoice: string;
  setWmChoice: Set<string>;
  wmCustom: string;
  setWmCustom: Set<string>;
  stampActive: boolean;
  nup: 1 | 2 | 4;
  setNup: Set<1 | 2 | 4>;
  orient: "auto" | "portrait" | "landscape";
  setOrient: Set<"auto" | "portrait" | "landscape">;
  photoFit: "contain" | "cover";
  setPhotoFit: Set<"contain" | "cover">;
  photoTurn: number;
  setPhotoTurn: Set<number>;
  secureOn: boolean;
  setSecureOn: Set<boolean>;
  pin: string;
  setPin: Set<string>;
  pinRef: MutableRefObject<HTMLInputElement | null>;
  jobUser: string;
  setJobUser: Set<string>;
};

export function PrintOptions(props: PrintOptionsProps) {
  const {
    docKind, sending, route, jobControls, presetCurrent, activePresetId, applyPreset, onPresetSaved, setNotice,
    paper, setPaper, gray, setGray, duplex, setDuplex, copies, setCopies,
    pdfCount, chosenPages, currentPage, pageChip, pickPages, pageList, setPageList, onTogglePage, reverse, setReverse, evenReverse,
    photoFilter, onPhotoFilter, photoLayout, onPhotoLayout, idLayout, cutLines, setCutLines,
    memoSize, setMemoSize, memoHeader, setMemoHeader, memoTitle, setMemoTitle, onTextFile,
    advancedOpen, setAdvancedOpen, margin, setMargin, marginMm, pageNumber, setPageNumber, wmChoice, setWmChoice, wmCustom, setWmCustom, stampActive,
    nup, setNup, orient, setOrient, photoFit, setPhotoFit, photoTurn, setPhotoTurn, secureOn, setSecureOn, pin, setPin, pinRef, jobUser, setJobUser,
  } = props;
  return (
    <>
    {docKind !== "test" ? <PresetBar current={presetCurrent} activeId={activePresetId} disabled={sending} onApply={applyPreset} onSaved={onPresetSaved} onNotice={setNotice} /> : null}
    <OfficeOptions paper={paper} gray={gray} duplex={duplex} copies={copies} route={route} locked={sending} controls={jobControls} copyMax={99} onPaper={setPaper} onGray={setGray} onDuplex={setDuplex} onCopies={setCopies} />
    {docKind === "pdf" ? (
      <div className="mt-3 space-y-2">
        <p className="opt-label">{pdfCount ? tr("po.rangeOf", { total: pdfCount, n: chosenPages.length }) : tr("po.range")}</p>
        <div className="chip-row flex gap-1.5 overflow-x-auto pb-1">
          {(
            [
              ["all", tr("po.all")],
              ["current", pdfCount ? tr("po.currentN", { n: currentPage }) : tr("po.current")],
              ["odd", tr("po.odd")],
              ["even", tr("po.even")],
              ["custom", tr("po.custom")],
            ] as const
          ).map(([id, text]) => (
            <button key={id} type="button" disabled={sending || (!pdfCount && id !== "all")} onClick={() => pickPages(id)} className={`chip h-9 shrink-0 whitespace-nowrap rounded-full px-3 text-sm ${pageChip === id ? "is-on" : ""}`}>
              {text}
            </button>
          ))}
        </div>
        {pageChip === "custom" ? (
          <div className="space-y-2">
            <input value={pageList} onChange={(event) => setPageList(event.target.value)} placeholder="1, 3-5, 8" aria-label={tr("po.customAria")} className="field h-10 w-full rounded-xl px-3 text-sm outline-none" />
            {pdfCount > 0 && pdfCount <= 30 ? (
              <div className="page-grid" role="group" aria-label={tr("po.gridAria")}>
                {Array.from({ length: pdfCount }, (_, index) => index + 1).map((n) => {
                  const on = chosenPages.includes(n);
                  return (
                    <button key={n} type="button" disabled={sending} aria-pressed={on} onClick={() => onTogglePage(n)} className={`chip page-cell rounded-xl text-sm font-semibold tabular-nums ${on ? "is-on" : ""}`}>
                      {n}
                    </button>
                  );
                })}
              </div>
            ) : pdfCount > 30 ? (
              <p className="text-xs text-muted">{tr("po.over30")}</p>
            ) : null}
            <p className="text-xs text-muted">{chosenPages.length ? tr("po.chosen", { n: chosenPages.length }) : tr("po.choose")}</p>
          </div>
        ) : null}
        {pageChip === "odd" || pageChip === "even" ? (
          <div className="info-box rounded-2xl px-3 py-2 text-xs leading-relaxed text-muted">
            <p>
              <b className="font-semibold text-fg">{tr("po.manualDuplex")}</b> · {tr("po.manualHow")}
            </p>
            {pageChip === "odd" || !reverse ? (
              <button type="button" onClick={evenReverse} className="chip mt-1.5 h-8 rounded-full px-3 text-xs font-semibold">
                {tr("po.toEvenRev")}
              </button>
            ) : (
              <p className="mt-1 font-medium text-ok">{tr("po.evenReady")}</p>
            )}
          </div>
        ) : null}
      </div>
    ) : null}
    {docKind === "photo" ? (
      <div className="mt-3 space-y-2">
        <p className="opt-label">{tr("po.filter")}</p>
        <div className="flex flex-wrap gap-1.5">
          {(["none", "doc", "pencil"] as const).map((value) => (
            <button key={value} type="button" disabled={sending} onClick={() => onPhotoFilter(value)} aria-pressed={photoFilter === value} className={`chip h-9 rounded-full px-3 text-sm ${photoFilter === value ? "is-on" : ""}`}>
              {photoFilterLabel(value)}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">{tr(photoFilter === "doc" ? "po.fDoc" : photoFilter === "pencil" ? "po.fPencil" : "po.fNone")}</p>
        {idLayout && photoFilter !== "none" ? (
          <p className="warn-box rounded-2xl px-3 py-2 text-xs font-medium" role="alert">
            {tr("po.idWarn")}
          </p>
        ) : null}
        <p className="opt-label">{tr("po.layout")}</p>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["normal", tr("po.layoutNormal")],
              ["id", tr(ID_SPECS.id.labelKey)],
              ["passport", tr(ID_SPECS.passport.labelKey)],
            ] as const
          ).map(([id, text]) => (
            <button key={id} type="button" disabled={sending} onClick={() => onPhotoLayout(id)} className={`chip h-9 rounded-full px-3 text-sm ${photoLayout === id ? "is-on" : ""}`}>
              {text}
            </button>
          ))}
        </div>
        {photoLayout !== "normal" ? (
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm text-fg">
              <input type="checkbox" checked={cutLines} onChange={(event) => setCutLines(event.target.checked)} />
              {tr("po.cutLines")}
            </label>
            <p className="text-xs text-muted">{tr("po.idHint")}</p>
          </div>
        ) : null}
      </div>
    ) : null}
    {docKind === "memo" ? (
      <div className="mt-3 space-y-2">
        <label className="pick flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-medium">
          <FileText className="size-4" aria-hidden="true" />
          {tr("po.loadText")}
          <input
            type="file"
            accept=".txt,.md,.markdown,text/plain,text/markdown"
            disabled={sending}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onTextFile(file);
            }}
          />
        </label>
        <p className="opt-label">{tr("po.fontSize")}</p>
        <div className="flex gap-1.5">
          {(["small", "normal", "large"] as const).map((value) => (
            <button key={value} type="button" disabled={sending} onClick={() => setMemoSize(value)} className={`chip h-9 rounded-full px-3 text-sm ${memoSize === value ? "is-on" : ""}`}>
              {memoSizeLabel(value)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input type="checkbox" checked={memoHeader} disabled={sending} onChange={(event) => setMemoHeader(event.target.checked)} />
          {tr("po.header")}
        </label>
        {memoHeader ? <input value={memoTitle} onChange={(event) => setMemoTitle(event.target.value)} maxLength={40} placeholder={tr("po.titlePh")} aria-label={tr("po.titleAria")} className="field h-10 w-full rounded-xl px-3 text-sm outline-none" /> : null}
      </div>
    ) : null}
    <details className="mt-3 rounded-2xl border border-line px-3 py-2" open={advancedOpen} onToggle={(event) => setAdvancedOpen((event.target as HTMLDetailsElement).open)}>
      <summary className="text-sm font-medium text-fg">{tr("po.advanced")}</summary>
      <div className="mt-3 space-y-3 text-sm">
        {docKind === "pdf" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted">{tr("po.margin")}</p>
            <div className="flex flex-wrap gap-2">
              {(["normal", "narrow", "none"] as const).map((value) => (
                <button key={value} type="button" disabled={sending} onClick={() => setMargin(value)} className={`chip h-10 rounded-full px-3 ${margin === value ? "is-on" : ""}`}>
                  {marginLabel(value)}
                  <span className="ml-1 text-[11px] opacity-75">{MARGIN_MM[value] ? `${MARGIN_MM[value]}mm` : tr("po.original")}</span>
                </button>
              ))}
            </div>
            {marginMm > 0 ? <p className="text-xs text-muted">{tr("po.marginNote")}</p> : null}
          </div>
        ) : null}
        {docKind !== "test" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted">{tr("po.stamps")}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={sending} onClick={() => setPageNumber(false)} className={`chip h-9 rounded-full px-3 ${!pageNumber ? "is-on" : ""}`}>
                {tr("po.noNum")}
              </button>
              <button type="button" disabled={sending} onClick={() => setPageNumber(true)} className={`chip h-9 rounded-full px-3 ${pageNumber ? "is-on" : ""}`}>
                {tr("po.num")}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["none", ...WATERMARK_PRESETS, "custom"] as const).map((value) => (
                <button key={value} type="button" disabled={sending} onClick={() => setWmChoice(value)} className={`chip h-9 rounded-full px-3 ${wmChoice === value ? "is-on" : ""}`}>
                  {value === "none" ? tr("po.noWm") : value === "custom" ? tr("po.custom") : watermarkLabel(value)}
                </button>
              ))}
            </div>
            {wmChoice === "custom" ? <input value={wmCustom} onChange={(event) => setWmCustom(event.target.value)} maxLength={16} placeholder={tr("po.wmPh")} aria-label={tr("po.wmAria")} className="field h-10 w-full rounded-xl px-3 text-sm outline-none" /> : null}
            {stampActive && docKind === "pdf" ? <p className="text-xs text-muted">{tr("po.stampNote")}</p> : null}
          </div>
        ) : null}
        {docKind !== "test" && !idLayout ? (
          <div className="flex flex-wrap gap-2">
            {([1, 2, 4] as const).map((value) => (
              <button key={value} type="button" disabled={sending} onClick={() => setNup(value)} className={`chip h-10 rounded-full px-3 ${nup === value ? "is-on" : ""}`}>
                {value === 1 ? tr("po.noNup") : tr("po.nup", { n: value })}
              </button>
            ))}
            <button type="button" disabled={sending} onClick={() => setReverse((value) => !value)} className={`chip h-10 rounded-full px-3 ${reverse ? "is-on" : ""}`}>
              {tr("po.reverse")}
            </button>
          </div>
        ) : null}
        {docKind === "pdf" || docKind === "photo" || docKind === "memo" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted">{tr("po.orient")}</p>
            <div className="flex flex-wrap gap-2">
              {([
                ["auto", tr("po.auto")],
                ["portrait", tr("po.portrait")],
                ["landscape", tr("po.landscape")],
              ] as const).map(([id, text]) => (
                <button key={id} type="button" disabled={sending} onClick={() => setOrient(id)} className={`chip h-10 rounded-full px-3 ${orient === id ? "is-on" : ""}`}>
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {docKind === "photo" ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPhotoFit("contain")} className={`chip h-10 rounded-full px-3 ${photoFit === "contain" ? "is-on" : ""}`}>
              {tr("po.fit")}
            </button>
            <button type="button" onClick={() => setPhotoFit("cover")} className={`chip h-10 rounded-full px-3 ${photoFit === "cover" ? "is-on" : ""}`}>
              {tr("po.fill")}
            </button>
            <button type="button" onClick={() => setPhotoTurn((value) => (value + 90) % 360)} className="chip h-10 rounded-full px-3">
              {tr("po.rotate")}
              {photoTurn ? ` · ${photoTurn}°` : ""}
            </button>
          </div>
        ) : null}
        <label className="flex items-center gap-2 text-fg">
          <input type="checkbox" checked={secureOn} onChange={(event) => setSecureOn(event.target.checked)} />
          {tr("po.secure")}
        </label>
        {secureOn ? (
          <div className="flex gap-2">
            <input ref={pinRef} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" type="password" autoComplete="off" placeholder={tr("po.pinPh")} aria-label={tr("po.pinAria")} className="field h-10 w-28 rounded-xl px-3 outline-none" />
            <input value={jobUser} onChange={(event) => setJobUser(event.target.value)} placeholder={tr("po.userPh")} aria-label={tr("po.userAria")} className="field h-10 min-w-0 flex-1 rounded-xl px-3 outline-none" />
          </div>
        ) : null}
      </div>
    </details>
  </>
  );
}
