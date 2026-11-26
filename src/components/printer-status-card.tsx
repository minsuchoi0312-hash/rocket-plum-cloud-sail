/**
 * 실시간 복사기 상태 카드: 상태 배지 · 마지막 확인 시각 · 새로고침 · 토너 잔량 막대 · 지원 기능 칩 · 웹 설정 열기.
 * USB면 GET_DEVICE_ID의 지원 언어와 인터페이스 상태를 같은 모양으로 보여 준다.
 */
import { CircleCheck, Printer, RefreshCw, TriangleAlert } from "@/components/icons";
import { displayLabel, ifaceLabel, reasonLabel, stateBadge, tonerLabel, type PrinterStatus } from "@/lib/printer-status";
import { useI18n } from "@/lib/i18n";

function timeLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function barColor(color: string, name: string) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  const n = name.toLowerCase();
  if (/cyan|청|파랑/.test(n)) return "#00a3d9";
  if (/magenta|적|빨/.test(n)) return "#d6338a";
  if (/yellow|황|노/.test(n)) return "#e3b900";
  return "#2b2f36";
}

/** 검정 계열 막대: 다크 모드에서 배경에 묻히지 않게 따로 표시해요(styles.css .is-dark-ink) */
function isDarkInk(color: string) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (!m) return false;
  const [r, g, b] = m.slice(1).map((v) => parseInt(v, 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 70;
}

export function PrinterStatusCard({ status, loading, error, onRefresh, compact = false, helperNeeded = false }: { status: PrinterStatus | null; loading: boolean; error?: string; onRefresh?: () => void; compact?: boolean; helperNeeded?: boolean }) {
  const { t } = useI18n();
  const badge = stateBadge(status);
  const caps = status?.capabilities;
  const chips: [string, boolean | null | undefined][] = caps
    ? [
        [t("cap.raw9100"), caps.raw9100 || null],
        [t("cap.pdf"), caps.pdfDirect],
        ["PCL5e", caps.pcl5],
        [t("cap.duplex"), caps.duplex],
        [caps.color === false ? t("cap.mono") : t("cap.color"), caps.color === false ? true : caps.color],
        ["IPP 631", caps.ipp631 || null],
      ]
    : [];
  /* 토스식: 한 줄 요약(상태 아이콘 + 상태 + 확인 시각 + 새로고침) → 알림 배지 → 토너 → '지원 기능'은 접어 둔다 */
  const tone = loading && !status ? "idle" : badge.tone;
  const StateIcon = tone === "ok" ? CircleCheck : tone === "idle" ? Printer : TriangleAlert;
  const shownChips = chips.filter(([, v]) => v !== null && v !== undefined);
  const webAdmin = caps?.webAdmin && status?.ip ? `http://${status.ip}` : "";
  const subParts = [status?.source === "usb" ? t("card.usbTitle") : t("card.title")];
  if (status?.checkedAt) subParts.push(t("card.checkedAt", { time: timeLabel(status.checkedAt) }));
  return (
    <div className={`status-card rounded-2xl ${compact ? "p-3" : "p-3.5"}`} aria-live="polite">
      <div className="flex items-center gap-3">
        <span className={`st-ico is-${tone}`} aria-hidden="true">
          <StateIcon className="size-[22px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`st-title is-${tone}`}>{loading && !status ? t("card.checking") : badge.label}</p>
          <p className="st-sub">{subParts.join(" · ")}</p>
        </div>
        {onRefresh ? (
          <button type="button" onClick={onRefresh} disabled={loading} className="st-refresh" aria-label={t("card.refreshAria")} title={t("card.refresh")}>
            <RefreshCw className={`size-5 ${loading ? "spin" : ""}`} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {status?.display && status.display.toUpperCase() !== "READY" ? <p className="st-note">{t("card.display", { v: displayLabel(status.display) })}</p> : null}
      {status?.source === "usb" ? <p className="st-note">{t("card.iface", { v: ifaceLabel(status) })}</p> : null}
      {error ? <p className="st-note text-warn">{error}</p> : null}
      {!status && !loading && helperNeeded ? <p className="st-note">{t("card.helperHint")}</p> : null}
      {status?.reasons.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {status.reasons.map((r) => (
            <span key={r} className={`reason-chip ${["media-empty", "media-jam", "cover-open", "toner-empty", "printer-error", "hardware-error"].includes(r) ? "is-bad" : ""}`}>
              {reasonLabel(r)}
            </span>
          ))}
        </div>
      ) : null}
      {status?.toners.length && !compact ? (
        <ul className="mt-3 space-y-1.5" aria-label={t("card.tonerAria")}>
          {status.toners.map((toner) => {
            const name = tonerLabel(toner.name);
            const fill = barColor(toner.color, toner.name);
            return (
              <li key={toner.name} className="toner-row text-xs">
                <span className="truncate text-fg" title={toner.name}>
                  {name}
                </span>
                <span className="toner-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={toner.level ?? undefined} aria-label={t("card.tonerLevel", { name })}>
                  <span className={isDarkInk(fill) ? "is-dark-ink" : undefined} style={{ width: `${toner.level ?? 0}%`, background: fill }} />
                </span>
                <span className={`text-right tabular-nums ${toner.level !== null && toner.level <= 20 ? "font-semibold text-warn" : "text-muted"}`}>{toner.level === null ? "?" : `${toner.level}%`}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {shownChips.length || webAdmin ? (
        <details className="st-more">
          <summary>
            {t("card.caps")}
            {status?.latencyMs ? <span className="st-more-meta">{status.latencyMs}ms</span> : null}
          </summary>
          {shownChips.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {shownChips.map(([label, v]) => (
                <span key={label} className={`cap-chip ${v ? "is-yes" : "is-no"}`}>
                  {v ? "✓" : "✕"} {label}
                </span>
              ))}
            </div>
          ) : null}
          {webAdmin ? (
            <a href={webAdmin} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-block text-sm font-semibold text-accent">
              {t("card.webAdmin")}
            </a>
          ) : null}
        </details>
      ) : null}
    </div>
  );
}
