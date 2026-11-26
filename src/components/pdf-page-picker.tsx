/**
 * PDF 쪽 고르기 — 실제 쪽 썸네일을 옆으로 넘기며 터치해서 인쇄할 쪽을 켜고 끈다.
 * 썸네일은 화면에 보일 때만 한 장씩 그린다(긴 PDF도 메모리를 아끼게). 고른 결과는 부모의 pageList 문자열과 같다.
 */
import { useEffect, useRef, useState } from "react";
import { Check } from "@/components/icons";
import { openPdf, renderPdfPage, type OpenedPdf } from "@/lib/pdf-doc";
import { tr } from "@/lib/i18n";

/* 썸네일 한 장 크기(A4 비율). 화면에서는 CSS로 줄여 보여 준다 */
const THUMB_W = 180;
const THUMB_H = 254;
const MAX_PAGES = 500;

export function PdfPagePicker({
  pdfBytes,
  pdfKey,
  total,
  chosen,
  disabled,
  onToggle,
  onSetList,
}: {
  pdfBytes: Uint8Array | null;
  pdfKey: string;
  total: number;
  chosen: number[];
  disabled: boolean;
  onToggle: (n: number) => void;
  onSetList: (list: string) => void;
}) {
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const docRef = useRef<OpenedPdf | null>(null);
  const queueRef = useRef<number[]>([]);
  const busyRef = useRef(false);
  const aliveRef = useRef(0);
  const doneRef = useRef<Set<number>>(new Set());
  const gridRef = useRef<HTMLDivElement | null>(null);
  const count = Math.min(total, MAX_PAGES);

  /* PDF 가 바뀌면 문서를 다시 열고 썸네일을 비운다 */
  useEffect(() => {
    const run = ++aliveRef.current;
    setThumbs({});
    doneRef.current = new Set();
    queueRef.current = [];
    if (!pdfBytes) return;
    let opened: OpenedPdf | null = null;
    void openPdf(pdfBytes, pdfKey || undefined)
      .then((doc) => {
        if (run !== aliveRef.current) return void doc.destroy();
        opened = doc;
        docRef.current = doc;
        pump();
      })
      .catch(() => {
        /* 비밀번호 등으로 못 열면 번호만 보인다 */
      });
    return () => {
      aliveRef.current++;
      docRef.current = null;
      void opened?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfBytes, pdfKey]);

  /** 대기열에서 한 장씩 그린다 */
  function pump() {
    if (busyRef.current) return;
    const doc = docRef.current;
    /* 문서가 아직 안 열렸으면 대기열을 그대로 두고 기다린다 (열리면 다시 부른다) */
    if (!doc) return;
    const next = queueRef.current.shift();
    if (next === undefined) return;
    busyRef.current = true;
    const run = aliveRef.current;
    void renderPdfPage(doc.doc, next, THUMB_W, THUMB_H, undefined, "fit")
      .then((canvas) => {
        if (!canvas || run !== aliveRef.current) return;
        const url = canvas.toDataURL("image/jpeg", 0.72);
        canvas.width = 0;
        canvas.height = 0;
        setThumbs((prev) => ({ ...prev, [next]: url }));
      })
      .catch(() => {
        doneRef.current.delete(next);
      })
      .finally(() => {
        busyRef.current = false;
        if (run === aliveRef.current) pump();
      });
  }

  /* 옆으로 넘겨 보이게 된 쪽만 대기열에 넣는다 */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof IntersectionObserver === "undefined") return;
    const seen = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const n = Number((entry.target as HTMLElement).dataset.page);
          if (!n || doneRef.current.has(n)) continue;
          doneRef.current.add(n);
          queueRef.current.push(n);
        }
        pump();
      },
      /* 옆으로 넘기는 줄이 기준 — 오른쪽으로 두세 장 앞까지 미리 그린다 */
      { root: grid, rootMargin: "0px 360px" },
    );
    grid.querySelectorAll("[data-page]").forEach((el) => seen.observe(el));
    return () => seen.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, pdfBytes, pdfKey]);

  const picked = new Set(chosen);
  const allOn = count > 0 && chosen.length >= count;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{chosen.length ? tr("po.chosen", { n: chosen.length }) : tr("po.tapPages")}</p>
        <div className="flex shrink-0 gap-1.5">
          <button type="button" disabled={disabled || allOn} onClick={() => onSetList(`1-${count}`)} className="chip h-9 rounded-full px-3 text-sm font-semibold disabled:opacity-40">
            {tr("po.selectAll")}
          </button>
          <button type="button" disabled={disabled || !chosen.length} onClick={() => onSetList("")} className="chip h-9 rounded-full px-3 text-sm font-semibold disabled:opacity-40">
            {tr("po.clearAll")}
          </button>
        </div>
      </div>
      <div ref={gridRef} className="pdf-pick" role="group" aria-label={tr("po.gridAria")}>
        {Array.from({ length: count }, (_, index) => index + 1).map((n) => {
          const on = picked.has(n);
          return (
            <button key={n} type="button" data-page={n} disabled={disabled} aria-pressed={on} aria-label={tr("po.pageN", { n })} onClick={() => onToggle(n)} className={`pdf-pick-cell ${on ? "is-on" : ""}`}>
              {thumbs[n] ? <img src={thumbs[n]} alt="" draggable={false} /> : <span className="pdf-pick-wait" aria-hidden="true" />}
              <span className="pdf-pick-num">{n}</span>
              <span className="pdf-pick-check" aria-hidden="true">
                {on ? <Check className="size-3.5" /> : null}
              </span>
            </button>
          );
        })}
      </div>
      {total > MAX_PAGES ? <p className="text-xs text-muted">{tr("po.overMax", { n: MAX_PAGES })}</p> : null}
    </div>
  );
}
