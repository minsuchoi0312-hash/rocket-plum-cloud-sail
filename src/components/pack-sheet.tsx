/**
 * "이 프린터는 ○○ 팩이 필요해요" — 찾은 프린터에 맞는 인쇄 팩을 설치하고 이어서 인쇄한다.
 * 준비 중인 팩이면 대신 보낼 수 있는 팩(표준 · 레이저)을 권한다.
 */
import { useRef, useState } from "react";
import { CircleCheck, Package, X } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { installPack, packInfo, type PackChoice, type PackDef } from "@/lib/print-packs";
import { useModal } from "@/components/use-modal";

type Props = {
  choice: PackChoice;
  model: string;
  /** 설치가 끝났거나 대신 보낼 팩을 골랐을 때 (그 팩으로 인쇄를 이어 간다) */
  onReady: (pack: PackDef) => void;
  onClose: () => void;
};

export function PackSheet({ choice, model, onReady, onClose }: Props) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useModal(dialogRef, () => {
    if (percent === null || done) onClose();
  });
  const need = choice.need;
  const target = need.ready ? need : choice.fallback;
  const info = target ? packInfo(target.id) : { models: 0, kb: 0 };
  const name = t(need.name);
  const busy = percent !== null && !done;

  async function install(pack: PackDef) {
    setError("");
    setPercent(0);
    try {
      await installPack(pack.id, setPercent);
      setDone(true);
      window.setTimeout(() => onReady(pack), 650);
    } catch {
      setPercent(null);
      setError(t("pk.fail"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center" onClick={() => (busy ? null : onClose())}>
      <div ref={dialogRef} tabIndex={-1} className="card pack-sheet flex w-full max-w-lg flex-col p-5 outline-none" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={t("pk.need", { pack: name })}>
        <div className="flex items-start justify-between gap-3">
          <span className="pack-icon" aria-hidden="true">
            {done ? <CircleCheck className="size-7" /> : <Package className="size-7" />}
          </span>
          <button type="button" onClick={onClose} disabled={busy} className="icon-btn -mr-1 -mt-1 inline-flex size-9 items-center justify-center rounded-full disabled:opacity-40" aria-label={t("pk.close")}>
            <X className="size-4" />
          </button>
        </div>

        <h2 className="mt-3 text-[22px] font-bold leading-tight text-fg">{done ? t("pk.done") : need.ready ? t("pk.need", { pack: name }) : t("pk.soon")}</h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{need.ready ? t("pk.needSub", { model: model || choice.matched }) : t("pk.soonSub", { model: model || choice.matched, pack: name })}</p>

        {target ? (
          <div className="pack-row mt-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-semibold text-fg">{t(target.name)}</p>
              <p className="mt-0.5 truncate text-[13px] text-muted">
                {t(target.sub)} · v{target.version}
                {target.builtin ? "" : ` · ${t("pk.models", { n: info.models })} · ${info.kb}KB`}
              </p>
            </div>
            {done ? <CircleCheck className="size-6 shrink-0 text-accent" aria-hidden="true" /> : null}
          </div>
        ) : null}

        {percent !== null ? (
          <div className="mt-4" aria-live="polite">
            <div className="scan-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
              <span style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1.5 text-[13px] tabular-nums text-muted">{done ? t("pk.done") : t("pk.installing", { p: percent })}</p>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}

        <div className="mt-5 grid gap-2">
          {target && !done ? (
            <button type="button" disabled={busy} onClick={() => (target.builtin ? onReady(target) : void install(target))} className="btn-solid h-[52px] w-full rounded-2xl text-[16px] font-semibold disabled:opacity-60">
              {busy ? t("pk.installing", { p: percent ?? 0 }) : need.ready ? t("pk.install") : t("pk.useFallback", { pack: t(target.name) })}
            </button>
          ) : null}
          {!done ? (
            <button type="button" disabled={busy} onClick={onClose} className="chip h-12 w-full rounded-2xl text-[15px] disabled:opacity-50">
              {target ? t("pk.later") : t("pk.close")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
