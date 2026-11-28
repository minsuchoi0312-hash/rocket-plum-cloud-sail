/**
 * "이 프린터의 전용 팩은 아직 준비 중이에요" — 대신 보낼 수 있는 길을 고르게 한다.
 *  · 대신 보낼 팩(표준 IPP · 레이저)이 있으면 그 팩으로 인쇄
 *  · 앱이면 안드로이드 인쇄(폰의 Mopria · 제조사 인쇄 서비스)로
 * 팩은 모두 앱 안에 들어 있어 따로 설치하지 않는다(예전의 '설치' 진행 막대는 하는 일이 없어 없앴다).
 */
import { useRef } from "react";
import { Package, X } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { packModels, type PackChoice, type PackDef } from "@/lib/print-packs";
import { useModal } from "@/components/use-modal";

type Props = {
  choice: PackChoice;
  model: string;
  /** 대신 보낼 팩을 골랐을 때 (그 팩으로 인쇄를 이어 간다) */
  onReady: (pack: PackDef) => void;
  /** 안드로이드 인쇄로 보내기 (앱에서만) */
  onSystemPrint?: () => void;
  onClose: () => void;
};

export function PackSheet({ choice, model, onReady, onSystemPrint, onClose }: Props) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  useModal(dialogRef, onClose);
  const need = choice.need;
  const target = choice.fallback;
  const name = t(need.name);
  const models = target ? packModels(target.id) : 0;
  /* 제조사 전용 방식(호스트 기반 · 승화형 · 도트 · 대형): '준비 중'이 아니라 앱이 직접 못 그리는 기기 */
  const vendor = need.id === "vendor";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} className="card pack-sheet flex w-full max-w-lg flex-col p-5 outline-none" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={t(vendor ? "pk.vendorTitle" : "pk.soon")}>
        <div className="flex items-start justify-between gap-3">
          <span className="pack-icon" aria-hidden="true">
            <Package className="size-7" />
          </span>
          <button type="button" onClick={onClose} className="icon-btn -mr-1 -mt-1 inline-flex size-9 items-center justify-center rounded-full" aria-label={t("pk.close")}>
            <X className="size-4" />
          </button>
        </div>

        <h2 className="mt-3 text-[22px] font-bold leading-tight text-fg">{t(vendor ? "pk.vendorTitle" : "pk.soon")}</h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{vendor ? t("pk.vendorText", { model: model || choice.matched }) : t("pk.soonSub", { model: model || choice.matched, pack: name })}</p>

        {target ? (
          <div className="pack-row mt-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-semibold text-fg">{t(target.name)}</p>
              <p className="mt-0.5 truncate text-[13px] text-muted">
                {t(target.sub)}
                {models ? ` · ${t("pk.models", { n: models })}` : ""}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-2">
          {target ? (
            <button type="button" onClick={() => onReady(target)} className="btn-solid h-[52px] w-full rounded-2xl text-[16px] font-semibold">
              {t("pk.useFallback", { pack: t(target.name) })}
            </button>
          ) : null}
          {onSystemPrint ? (
            <button type="button" onClick={onSystemPrint} className={`${target ? "chip" : "btn-solid"} h-12 w-full rounded-2xl text-[15px] font-semibold`}>
              {t("ch.system")}
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="chip h-12 w-full rounded-2xl text-[15px]">
            {target || onSystemPrint ? t("pk.later") : t("pk.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
