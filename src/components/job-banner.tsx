/**
 * 인쇄 진행 단계 배너(페이지 준비 → 복사기로 전송 + 즉시 중단)와 완료 배너(1부 더 · 다른 파일).
 */
import { CircleCheck, FilePlus2, Repeat, X } from "@/components/icons";
import { tr } from "@/lib/i18n";

export type JobPhase = { stage: "prep" | "send"; done: number; total: number; percent: number };

export function JobBanner({ phase, onCancel }: { phase: JobPhase; onCancel: () => void }) {
  const percent = Math.max(0, Math.min(100, Math.round(phase.percent)));
  const label = phase.stage === "prep" ? tr("jb.prep", { n: Math.min(phase.done + 1, phase.total), total: phase.total }) : tr("jb.send", { p: percent });
  return (
    <div className="job-card mt-3 rounded-2xl p-3" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-fg">{label}</p>
        <button type="button" onClick={onCancel} className="chip inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold">
          <X className="size-3.5" aria-hidden="true" />
          {tr("jb.stop")}
        </button>
      </div>
      <div className="scan-track mt-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted">
        <span className={phase.stage === "prep" ? "font-semibold text-fg" : ""}>{tr("jb.s1")}</span>
        <span className={phase.stage === "send" ? "font-semibold text-fg" : ""}>{tr("jb.s2")}</span>
        <span>{tr("jb.s3")}</span>
      </div>
    </div>
  );
}

export function DoneBanner({ text, onAgain, onAnother, onClose }: { text: string; onAgain: () => void; onAnother: () => void; onClose: () => void }) {
  return (
    <div className="done-card mt-3 rounded-2xl p-3" role="status">
      <div className="flex items-start gap-2">
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm font-medium text-fg">{text}</p>
        <button type="button" onClick={onClose} className="text-muted" aria-label={tr("jb.closeAria")}>
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={onAgain} className="btn-solid inline-flex h-10 items-center justify-center gap-1 rounded-xl text-sm font-semibold">
          <Repeat className="size-4" aria-hidden="true" />
          {tr("jb.again")}
        </button>
        <button type="button" onClick={onAnother} className="chip inline-flex h-10 items-center justify-center gap-1 rounded-xl text-sm font-semibold">
          <FilePlus2 className="size-4" aria-hidden="true" />
          {tr("jb.another")}
        </button>
      </div>
    </div>
  );
}
