/**
 * 용지 미리보기 (WYSIWYG). atlas-app.tsx에서 분리.
 * 흑백·가로·모아찍기·여백(PDF는 부모가 그린 이미지)·증명사진 배치·문서 보정·쪽 번호·워터마크·메모 서식을 그대로 보여 준다.
 */
import { useEffect, useRef } from "react";
import { Maximize2 } from "@/components/icons";
import { composeSheet, stampSheet, stampsOn, type StampOptions } from "@/lib/compose-sheet";
import { drawOfficePage, paperLabel, previewSize, printPixelSize, type OfficePaper } from "@/lib/office-job";
import { nupGroups } from "@/lib/pdf-doc";
import { renderSheetCanvas, sheetMemoChunks } from "@/lib/pdf-page";
import { drawTestSheet, paperMm, type TestSheetInfo } from "@/lib/test-sheet";
import { composeIdSheet, type PhotoLayout } from "@/lib/image-enhance";
import { drawMemoStyled, memoChunksStyled, memoIsDefault, type MemoStyle } from "@/lib/memo-sheet";
import { tr, useI18n } from "@/lib/i18n";
import { fontsReady, sheetGlyphs } from "@/lib/font-ready";

export type DocKind = "pdf" | "photo" | "memo" | "test";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(tr("err.openPhoto")));
    image.src = src;
  });
}

export function PaperPreview({
  paper,
  gray,
  docKind,
  title,
  memo,
  memoStyle,
  memoPages = 1,
  photoUrl,
  album = [],
  nup = 1,
  reverse = false,
  pdfPreview,
  pdfCount,
  sheets = [],
  sheetIndex = 0,
  photoFit,
  photoTurn,
  orient = "auto",
  testSheet = null,
  photoLayout = "normal",
  cutLines = true,
  stamps = { pageNumber: false, watermark: "" },
  showTools = true,
  onFit,
  onTurn,
  onSheet,
  onZoom,
}: {
  paper: OfficePaper;
  gray: boolean;
  docKind: DocKind;
  title: string;
  memo: string;
  memoStyle: MemoStyle;
  memoPages?: number;
  photoUrl: string | null;
  album?: string[];
  nup?: 1 | 2 | 4;
  reverse?: boolean;
  pdfPreview: string | null;
  pdfCount: number;
  /** 실제 인쇄 시트 목록(각 시트에 들어가는 원본 쪽 번호, 인쇄 순서 그대로) */
  sheets?: number[][];
  sheetIndex?: number;
  photoFit: "contain" | "cover";
  photoTurn: number;
  orient?: "auto" | "portrait" | "landscape";
  testSheet?: Omit<TestSheetInfo, "at"> | null;
  photoLayout?: PhotoLayout;
  cutLines?: boolean;
  stamps?: StampOptions;
  showTools?: boolean;
  onFit: (fit: "contain" | "cover") => void;
  onTurn: () => void;
  onSheet: (index: number) => void;
  onZoom?: () => void;
}) {
  const { lang } = useI18n();
  const pageRef = useRef<HTMLCanvasElement>(null);
  const testRef = useRef<HTMLCanvasElement>(null);
  const memoRef = useRef<HTMLCanvasElement>(null);
  const albumKey = album.join("|");
  const stampKey = `${stamps.pageNumber}|${stamps.watermark}`;
  const idMode = docKind === "photo" && photoLayout !== "normal";
  const photoGroups = docKind === "photo" && !idMode && album.length ? nupGroups(album.map((_, index) => index + 1), nup, reverse) : [];
  const photoAt = photoUrl ? album.indexOf(photoUrl) + 1 : 0;
  const photoGroupIndex = Math.max(0, photoGroups.findIndex((row) => row.includes(photoAt)));
  const photoGroupKey = nup > 1 && photoGroups.length ? (photoGroups[photoGroupIndex] || []).join(",") : "";
  const orientKey = orient === "landscape" ? "landscape" : "portrait";

  useEffect(() => {
    if (docKind !== "photo" || !photoUrl) return;
    let stop = false;
    const base = previewSize(paper);
    const size = orient === "landscape" ? { width: base.height, height: base.width } : base;
    const pxPerMm = size.width / paperMm(paper, orientKey).width;
    const sources = idMode ? [photoUrl] : photoGroupKey ? photoGroupKey.split(",").map((number) => album[Number(number) - 1]).filter(Boolean) : [photoUrl];
    void Promise.all([...sources.map((src) => loadImage(src)), fontsReady(sheetGlyphs(stamps.watermark)).then(() => null)])
      .then((loaded) => {
        const images = loaded.filter((image): image is HTMLImageElement => image !== null);
        const canvas = pageRef.current;
        if (stop || !canvas) return;
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext("2d");
        if (idMode) {
          const sheet = composeIdSheet(images[0], { width: images[0].naturalWidth || images[0].width, height: images[0].naturalHeight || images[0].height }, size.width, size.height, pxPerMm, photoLayout, cutLines);
          ctx?.drawImage(sheet, 0, 0);
          sheet.width = 0;
        } else if (photoGroupKey) {
          /* 모아찍기 미리보기: 실제 인쇄와 같은 분할로 합친다 */
          const sheet = composeSheet(images, images.map((image) => ({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height })), size.width, size.height, nup, photoFit);
          ctx?.drawImage(sheet, 0, 0);
          sheet.width = 0;
        } else {
          drawOfficePage(canvas, { kind: "photo", title, note: "", image: images[0], fit: photoFit, turn: photoTurn, gray });
        }
        stampSheet(canvas, idMode ? 0 : photoGroupIndex, idMode ? 1 : Math.max(1, photoGroups.length), stamps, pxPerMm);
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKind, photoUrl, paper, photoFit, photoTurn, gray, title, orient, nup, photoGroupKey, albumKey, photoLayout, cutLines, stampKey, lang]);

  const testKey = testSheet ? `${testSheet.printer}|${testSheet.link}|${testSheet.paper}|${testSheet.orient}|${testSheet.gray}` : "";
  useEffect(() => {
    if (docKind !== "test" || !testSheet) return;
    const canvas = testRef.current;
    if (!canvas) return;
    const base = previewSize(paper);
    const size = orient === "landscape" ? { width: base.height, height: base.width } : base;
    let stop = false;
    void fontsReady(sheetGlyphs(testSheet.printer, testSheet.link, testSheet.paper)).then(() => {
      if (stop || !testRef.current) return;
      canvas.width = size.width;
      canvas.height = size.height;
      drawTestSheet(canvas, { ...testSheet, at: Date.now() });
    });
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKind, testKey, paper, orient, lang]);

  /* 메모: 실제 인쇄 해상도로 첫 장을 그려 축소해 보여 준다 (서식·쪽 나눔·쪽 번호가 실제와 같게) */
  const memoCanvas = docKind === "memo" && memo.trim().length > 0 && nup === 1;
  const styleKey = `${memoStyle.size}|${memoStyle.header}|${memoStyle.title}|${memoStyle.date}`;
  useEffect(() => {
    if (!memoCanvas) return;
    let stop = false;
    const base = printPixelSize(paper);
    const frame = orient === "landscape" ? { width: base.height, height: base.width } : base;
    const pxPerMm = frame.width / paperMm(paper, orientKey).width;
    void (async () => {
      const canvas = memoRef.current;
      if (!canvas) return;
      await fontsReady(sheetGlyphs(memo, JSON.stringify(memoStyle), stamps.watermark));
      if (stop) return;
      let total = 1;
      let page: HTMLCanvasElement;
      if (memoIsDefault(memoStyle)) {
        const chunks = sheetMemoChunks(memo.trim(), paper, frame);
        total = chunks.length;
        page = await renderSheetCanvas({ kind: "memo", title: "", note: chunks[0] || "", paper, gray, frame });
      } else {
        const chunks = memoChunksStyled(memo.trim(), frame.width, frame.height, memoStyle, pxPerMm);
        total = chunks.length;
        page = document.createElement("canvas");
        page.width = frame.width;
        page.height = frame.height;
        drawMemoStyled(page, chunks[0] || "", memoStyle, pxPerMm);
      }
      stampSheet(page, 0, total, stamps, pxPerMm);
      if (stop || !memoRef.current) return;
      canvas.width = frame.width;
      canvas.height = frame.height;
      canvas.getContext("2d")?.drawImage(page, 0, 0);
      page.width = 0;
    })();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoCanvas, memo, paper, orient, gray, styleKey, stampKey, lang]);

  const emptyPhoto = docKind === "photo" && !photoUrl;
  const emptyMemo = docKind === "memo" && memo.trim().length < 1;
  const emptyPdf = docKind === "pdf" && !pdfPreview;
  const paperClass = orient === "landscape" ? "is-land" : "";
  /* 용지 비율은 용지 표(mm)에서 — 가로 방향이면 뒤집는다 */
  const mm = paperMm(paper);
  const sheetRatio = orient === "landscape" ? `${mm.height} / ${mm.width}` : `${mm.width} / ${mm.height}`;
  const nupCaption = nup > 1 && !idMode ? ` · ${tr("pv.nup", { n: nup })}` : "";
  /* PDF: 실제 인쇄 시트 단위(쪽 범위·모아찍기·역순 반영)로 넘긴다 */
  const sheetGroup = sheets[sheetIndex] || [];
  const pdfCaption = docKind !== "pdf" || !pdfCount ? "" : sheets.length ? ` · ${tr("pv.sheet", { i: sheetIndex + 1, n: sheets.length, pages: sheetGroup.join("·") })}` : ` · ${tr("pv.noPages")}`;
  const memoCells = nup > 1 ? Array.from({ length: nup }, (_, index) => index) : [];
  const stampCaption = stampsOn(stamps) ? [stamps.pageNumber ? tr("pv.pageNum") : "", stamps.watermark.trim() ? tr("pv.wm", { v: stamps.watermark.trim() }) : ""].filter(Boolean).join(" · ") : "";

  return (
    <div className={`preview-stage relative ${gray ? "gray" : ""}`}>
      {onZoom ? (
        <button type="button" onClick={onZoom} className="zoom-btn" aria-label={tr("pv.zoomAria")}>
          <Maximize2 className="size-3.5" aria-hidden="true" />
          {tr("pv.zoom")}
        </button>
      ) : null}
      <p className="preview-caption pl-3 pr-20 text-center text-xs">
        {tr(orient === "landscape" ? "pv.captionLand" : "pv.caption", { paper: paperLabel(paper) })}
        {gray ? ` · ${tr("pv.gray")}` : ""}
        {idMode ? ` · ${tr(photoLayout === "id" ? "pv.id" : "pv.passport")}` : ""}
        {nupCaption}
        {pdfCaption}
        {stampCaption ? ` · ${stampCaption}` : ""}
      </p>
      {docKind === "photo" && photoUrl ? (
        <canvas ref={pageRef} onClick={onZoom} className={`sheet-a4 zoomable ${paperClass}`} style={{ height: "auto", aspectRatio: sheetRatio }} aria-label={tr("pv.photoAria")} />
      ) : docKind === "pdf" && pdfPreview ? (
        <img src={pdfPreview} alt="" onClick={onZoom} className={`sheet-a4 zoomable ${paperClass}`} style={{ aspectRatio: sheetRatio }} />
      ) : docKind === "test" && testSheet ? (
        <canvas ref={testRef} onClick={onZoom} className={`sheet-a4 zoomable ${paperClass}`} style={{ height: "auto", aspectRatio: sheetRatio }} aria-label={tr("pv.testAria")} />
      ) : memoCanvas ? (
        <canvas ref={memoRef} onClick={onZoom} className={`sheet-a4 zoomable ${paperClass}`} style={{ height: "auto", aspectRatio: sheetRatio }} aria-label={tr("pv.memoAria")} />
      ) : (
        <div className={`sheet-a4 relative ${paperClass}`} style={{ aspectRatio: sheetRatio }}>
          {emptyPhoto ? (
            <p className="on-paper absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed">{tr("pv.emptyPhoto")}</p>
          ) : emptyMemo ? (
            <p className="on-paper absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed">{tr("pv.emptyMemo")}</p>
          ) : emptyPdf ? (
            <p className="on-paper absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed">{tr("pv.emptyPdf")}</p>
          ) : docKind === "memo" && memoCells.length ? (
            <div className={`nup-grid nup-${nup}${orient === "landscape" ? " is-land" : ""} absolute inset-0`}>
              {memoCells.map((cell) => (
                <div key={cell} className="nup-cell">
                  {cell < memoPages ? (
                    <p className="overflow-hidden whitespace-pre-wrap p-1.5 text-left text-[7px] leading-snug">{cell === 0 ? memo : tr("pv.nextPage")}</p>
                  ) : (
                    <p className="grid h-full place-items-center text-[9px] text-faint">{tr("pv.blank")}</p>
                  )}
                </div>
              ))}
              {stamps.watermark.trim() ? <span className="wm-overlay">{stamps.watermark.trim()}</span> : null}
            </div>
          ) : (
            <div className="absolute inset-0 p-3 text-left">
              <p className="text-[12px] tracking-wide">{tr("pv.testPage")}</p>
              <p className="mt-1 text-sm">{title}</p>
            </div>
          )}
        </div>
      )}
      {docKind === "pdf" && sheets.length > 1 ? (
        <div className="preview-pager">
          <button type="button" disabled={sheetIndex <= 0} onClick={() => onSheet(sheetIndex - 1)} className="paper-btn disabled:opacity-40">
            {tr("pv.prev")}
          </button>
          <span className="preview-caption min-w-24 text-center text-sm tabular-nums" aria-live="polite">
            {tr("pv.sheetShort", { i: sheetIndex + 1, n: sheets.length, pages: sheetGroup.join("·") })}
          </span>
          <button type="button" disabled={sheetIndex >= sheets.length - 1} onClick={() => onSheet(sheetIndex + 1)} className="paper-btn disabled:opacity-40">
            {tr("pv.next")}
          </button>
        </div>
      ) : null}
      {docKind === "photo" && showTools ? (
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" disabled={emptyPhoto} onClick={() => onFit("contain")} className={`paper-btn disabled:opacity-40 ${photoFit === "contain" && !emptyPhoto ? "is-on" : ""}`}>
            {tr("pv.fit")}
          </button>
          <button type="button" disabled={emptyPhoto} onClick={() => onFit("cover")} className={`paper-btn disabled:opacity-40 ${photoFit === "cover" && !emptyPhoto ? "is-on" : ""}`}>
            {tr("pv.fill")}
          </button>
          <button type="button" disabled={emptyPhoto} onClick={onTurn} className="paper-btn disabled:opacity-40">
            {tr("pv.rotate")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
