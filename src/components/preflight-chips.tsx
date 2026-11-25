/** 인쇄 전 사전 점검 알림 칩 (비차단, 필요할 때만) */
import type { PreflightAction, PreflightChip } from "@/lib/preflight";
import { tr } from "@/lib/i18n";

export function PreflightChips({ chips, onAction }: { chips: PreflightChip[]; onAction: (kind: PreflightAction) => void }) {
  if (!chips.length) return null;
  return (
    <ul className="mt-3 space-y-1.5" aria-label={tr("pf.aria")}>
      {chips.map((chip) => (
        <li key={chip.id} className={`preflight-chip is-${chip.tone} flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 text-xs`} role={chip.tone === "bad" ? "alert" : undefined}>
          <span className="min-w-[12rem] flex-1 leading-snug">{chip.text}</span>
          {chip.action ? (
            <button type="button" onClick={() => onAction(chip.action!.kind)} className="chip h-8 shrink-0 rounded-full px-2.5 text-xs font-semibold">
              {chip.action.label}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
