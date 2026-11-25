/**
 * 미리보기 확대 모달: 실제 인쇄 해상도로 만든 시트를 전체 화면에서 확대·이동하며 검수한다
 * (수험표 바코드·작은 글씨·쪽 번호·워터마크·증명사진 재단선).
 */
import { useEffect, useRef, useState } from "react";
import { useModal } from "@/components/use-modal";
import { X, ZoomIn, ZoomOut } from "@/components/icons";
import { tr } from "@/lib/i18n";

const LEVELS = [1, 1.5, 2, 3] as const;

export function PreviewZoomModal({ pages, start = 0, onClose }: { pages: string[]; start?: number; onClose: () => void }) {
  const [index, setIndex] = useState(Math.min(Math.max(0, start), pages.length - 1));
  const [level, setLevel] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModal(dialogRef, onClose);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setIndex((value) => Math.min(pages.length - 1, value + 1));
      if (event.key === "ArrowLeft") setIndex((value) => Math.max(0, value - 1));
      if (event.key === "+" || event.key === "=") setLevel((value) => Math.min(LEVELS.length - 1, value + 1));
      if (event.key === "-") setLevel((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pages.length]);
  const scale = LEVELS[level];
  return (
    <div ref={dialogRef} tabIndex={-1} className="zoom-veil fixed inset-0 z-[70] flex flex-col outline-none" role="dialog" aria-modal="true" aria-label={tr("zm.aria")}>
      <div className="zoom-bar flex items-center gap-2 px-3 py-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {tr("zm.title", { i: index + 1, n: pages.length, pct: Math.round(scale * 100) })}
        </p>
        <button type="button" onClick={() => setLevel((value) => Math.max(0, value - 1))} disabled={level === 0} className="zoom-icon" aria-label={tr("zm.out")}>
          <ZoomOut className="size-4" />
        </button>
        <button type="button" onClick={() => setLevel((value) => Math.min(LEVELS.length - 1, value + 1))} disabled={level === LEVELS.length - 1} className="zoom-icon" aria-label={tr("zm.in")}>
          <ZoomIn className="size-4" />
        </button>
        <button type="button" onClick={onClose} className="zoom-icon" aria-label={tr("zm.close")}>
          <X className="size-4" />
        </button>
      </div>
      <div className="zoom-scroll min-h-0 flex-1 overflow-auto p-3" onDoubleClick={() => setLevel((value) => (value + 1) % LEVELS.length)}>
        <img src={pages[index]} alt={tr("zm.alt", { n: index + 1 })} className="zoom-sheet mx-auto block" style={{ width: `${Math.round(scale * 100)}%`, maxWidth: "none" }} />
      </div>
      {pages.length > 1 ? (
        <div className="zoom-bar flex items-center justify-center gap-3 px-3 py-2">
          <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} className="zoom-nav">
            {tr("zm.prev")}
          </button>
          <span className="text-sm tabular-nums">
            {index + 1} / {pages.length}
          </span>
          <button type="button" onClick={() => setIndex((value) => Math.min(pages.length - 1, value + 1))} disabled={index === pages.length - 1} className="zoom-nav">
            {tr("zm.next")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
