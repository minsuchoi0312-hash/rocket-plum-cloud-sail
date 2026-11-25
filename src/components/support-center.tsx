/**
 * 지원 센터(도움말 · 고객센터 · 진단 로그)와 최근 인쇄 기록 목록.
 * atlas-app.tsx에서 분리한 컴포넌트.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useModal } from "@/components/use-modal";
import { toast } from "@/lib/toast";
import { buildBackup, backupFileName, restoreBackup } from "@/lib/backup";
import { PRESETS_CHANGED } from "@/lib/presets";
import { downloadText } from "@/lib/helper-launcher";
import { Copy, Mail, Upload, X } from "@/components/icons";
import { clearDiag, diagText, maskSecrets } from "@/lib/diag";
import { copyText } from "@/lib/clipboard";
import { historyKindLabel, historyRouteLabel, historyTime, type PrintRecord } from "@/lib/print-history";
import { envLine, faqs, inquiryLabel, inquiryMailto, inquiryText, INQUIRY_TYPES, ipGuide, readEnv, SUPPORT_EMAIL, type EnvInfo, type InquiryType } from "@/lib/support";
import { m, tr, useI18n } from "@/lib/i18n";

export type SupportTab = "help" | "contact" | "diag" | "log";

export function HistoryList({ items }: { items: PrintRecord[] }) {
  if (!items.length) return <p className="mt-2 text-sm text-muted">{tr("sc.histEmpty")}</p>;
  return (
    <ul className="mt-2">
      {items.map((row) => (
        <li key={`${row.at}-${row.name}`} className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-b-0">
          <span className="min-w-0">
            <span className="block truncate font-medium text-fg">
              <span className="kind-badge mr-1.5">{historyKindLabel(row.kind)}</span>
              {row.name}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted">
              {tr("sc.histLine", { pages: row.pages, printer: row.printer || tr("sc.printer"), route: historyRouteLabel(row.route) })}
            </span>
          </span>
          <span className="shrink-0 text-xs tabular-nums text-faint">{historyTime(row.at)}</span>
        </li>
      ))}
    </ul>
  );
}

export function SupportCenter({
  tab,
  onTab,
  onClose,
  history,
  onClearHistory,
  route,
  printer,
  diag,
  onRestored,
}: {
  tab: SupportTab;
  onTab: (tab: SupportTab) => void;
  onClose: () => void;
  history: PrintRecord[];
  onClearHistory: () => void;
  route: string;
  printer: string;
  /** 6단계 자가진단 패널 */
  diag?: ReactNode;
  /** 백업을 불러온 뒤 화면 상태를 다시 읽게 한다 */
  onRestored?: () => void;
}) {
  const [env, setEnv] = useState<EnvInfo>({ browser: "", os: "", webUsb: false, inApp: false });
  const { lang, setLang, t } = useI18n();
  const [kind, setKind] = useState<InquiryType>("noConnect");
  const [model, setModel] = useState(printer);
  const [body, setBody] = useState("");
  const [withLog, setWithLog] = useState(true);
  const [logTick, setLogTick] = useState(0);
  const log = useMemo(() => diagText(), [logTick, tab]);

  useEffect(() => setEnv(readEnv()), [lang]);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModal(dialogRef, onClose);
  const inquiry = { type: kind, model, body, withLog, log, env, route: `${route}${printer ? ` · ${printer}` : ""}` };
  /* SUPPORT_EMAIL이 비어 있으면 null → 메일 버튼 대신 복사 안내 */
  const mailto = inquiryMailto(inquiry);
  const tabs: [SupportTab, string][] = [
    ["help", t("sc.tabHelp")],
    ["contact", t("sc.tabContact")],
    ["diag", t("sc.tabDiag")],
    ["log", t("sc.tabLog")],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} className="card support-sheet flex w-full max-w-lg flex-col p-4 text-sm outline-none" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={t("sc.aria")}>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-fg">{t("sc.title")}</p>
          <button type="button" onClick={onClose} className="icon-btn inline-flex size-9 items-center justify-center rounded-full" aria-label={t("sc.close")}>
            <X className="size-4" />
          </button>
        </div>
        <div className="seg mt-3" role="tablist" aria-label={t("sc.title")}>
          {tabs.map(([id, text]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => onTab(id)} className={`seg-btn ${tab === id ? "is-on" : ""}`}>
              {text}
            </button>
          ))}
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-0.5">
          {tab === "help" ? (
            <div className="space-y-2">
              {faqs().map((faq, index) => (
                <details key={faq.id} className="faq rounded-2xl px-3 py-2" open={index === 0}>
                  <summary className="font-medium text-fg">
                    {index + 1}) {faq.q}
                  </summary>
                  <ul className="mt-2 space-y-1.5 leading-relaxed text-muted">
                    {faq.a.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  {faq.download ? (
                    <a href={faq.download} download="raw-print-helper.mjs" className="btn-solid mt-2 inline-flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-semibold">
                      <Upload className="size-3.5 rotate-180" aria-hidden="true" />
                      {t("sc.helperDl")}
                    </a>
                  ) : null}
                  {faq.copy ? (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="code-pill min-w-0 flex-1 truncate rounded-xl px-3 py-2 text-xs">{faq.copy}</code>
                      <button type="button" onClick={() => void copyText(faq.copy || "").then((ok) => toast(m(ok ? "sc.cmdCopied" : "sc.copyFail")))} className="btn-solid inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-semibold">
                        <Copy className="size-3.5" aria-hidden="true" />
                        {t("sc.copy")}
                      </button>
                    </div>
                  ) : null}
                </details>
              ))}
              <details className="faq rounded-2xl px-3 py-2">
                <summary className="font-medium text-fg">{t("sc.ipQ")}</summary>
                <ul className="mt-2 space-y-1.5 leading-relaxed">
                  {ipGuide().map((row) => (
                    <li key={row.brand}>
                      <b className="font-semibold text-fg">{row.brand}</b> <span className="text-muted">{row.how}</span>
                    </li>
                  ))}
                </ul>
              </details>
              <button type="button" onClick={() => onTab("contact")} className="chip mt-1 h-11 w-full rounded-2xl text-sm font-medium">
                {t("sc.toContact")}
              </button>
            </div>
          ) : null}

          {tab === "contact" ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <div>
                <p className="text-xs font-medium text-muted">{t("sc.inqType")}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {INQUIRY_TYPES.map((value) => (
                    <button key={value} type="button" onClick={() => setKind(value)} className={`chip h-9 rounded-full px-3 text-sm ${kind === value ? "is-on" : ""}`}>
                      {inquiryLabel(value)}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-muted">{t("sc.modelLabel")}</span>
                <input value={model} onChange={(event) => setModel(event.target.value)} placeholder={t("sc.modelPh")} className="field mt-1 h-11 w-full rounded-xl px-3 text-sm outline-none" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted">{t("sc.bodyLabel")}</span>
                <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder={t("sc.bodyPh")} className="field mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none" />
              </label>
              <label className="flex items-start gap-2 text-sm text-fg">
                <input type="checkbox" checked={withLog} onChange={(event) => setWithLog(event.target.checked)} className="mt-1" />
                <span>
                  {t("sc.withLog")}
                  <span className="block text-xs text-muted">{t("sc.withLogHint")}</span>
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => void copyText(inquiryText(inquiry)).then((ok) => toast(m(ok ? "sc.inqCopied" : "sc.copyFail")))} className="btn-solid inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl px-2 py-1 text-center text-sm font-semibold">
                  <Copy className="size-4 shrink-0" aria-hidden="true" />
                  {t("sc.copyAll")}
                </button>
                {mailto ? (
                  <a href={mailto} className="chip inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold">
                    <Mail className="size-4" aria-hidden="true" />
                    {t("sc.mail")}
                  </a>
                ) : (
                  <p className="info-box flex items-center gap-1.5 rounded-2xl px-3 text-xs leading-snug text-muted">
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    {t("sc.mailHint")}
                  </p>
                )}
              </div>
              <div className="info-box rounded-2xl px-3 py-2.5 text-xs leading-relaxed text-muted">
                <p className="font-medium text-fg">{t("sc.envTitle")}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="env-badge">{env.browser || t("sc.envBrowser")}</span>
                  <span className="env-badge">{env.os || t("sc.envOs")}</span>
                  <span className={`env-badge ${env.webUsb ? "is-ok" : "is-no"}`}>{t(env.webUsb ? "env.usbYes" : "env.usbNo")}</span>
                  {env.inApp ? <span className="env-badge is-no">{t("env.inApp")}</span> : null}
                  <span className="env-badge">{route}</span>
                </div>
                <p className="mt-2">
                  {t("sc.noDocs")} {SUPPORT_EMAIL ? t("sc.replyAt", { mail: SUPPORT_EMAIL }) : t("sc.howSend")}
                </p>
                <p className="mt-1 text-faint">{envLine(env)}</p>
              </div>
            </form>
          ) : null}

          {tab === "diag" ? diag : null}

          {tab === "log" ? (
            <div className="space-y-3">
              <div className="backup-box rounded-2xl px-3 py-2.5">
                <p className="text-sm font-semibold text-fg">{t("sc.backupTitle")}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{t("sc.backupDesc")}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const data = buildBackup(window.localStorage);
                      downloadText(backupFileName(), `${JSON.stringify(data, null, 2)}\n`, "application/json");
                      toast(m("sc.backedUp", { p: data.printers.length, s: data.learnedSubnets.length, r: data.presets.length }));
                    }}
                    className="btn-solid min-h-10 rounded-xl px-2 py-1 text-sm font-semibold"
                  >
                    {t("sc.backupDl")}
                  </button>
                  <label className="chip flex min-h-10 cursor-pointer items-center justify-center rounded-xl px-2 py-1 text-center text-sm font-semibold">
                    {t("sc.backupLoad")}
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        void file
                          .text()
                          .then((text: string) => {
                            const r = restoreBackup(text, window.localStorage);
                            onRestored?.();
                            /* 복원한 언어·내 설정을 새로고침 없이 바로 반영 */
                            if (r.lang) setLang(r.lang);
                            window.dispatchEvent(new Event(PRESETS_CHANGED));
                            toast(m("sc.restored", { p: r.printers, s: r.subnets, r: r.presets }));
                          })
                          .catch((error: unknown) => toast(error instanceof Error ? error.message : m("sc.loadFail")));
                      }}
                    />
                  </label>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted">{t("sc.logHint")}</p>
                <pre className="log-box mt-1.5 max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-xl p-3 text-xs">{maskSecrets(log) || t("sc.logEmpty")}</pre>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => void copyText(maskSecrets(log)).then((ok) => toast(m(ok ? "sc.logCopied" : "sc.copyFail")))} className="chip h-10 rounded-xl text-sm">
                    {t("sc.logCopy")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearDiag();
                      setLogTick((value) => value + 1);
                      toast(m("sc.logCleared"));
                    }}
                    className="chip h-10 rounded-xl text-sm"
                  >
                    {t("sc.logClear")}
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-xs font-medium text-muted">{t("sc.histTitle")}</p>
                  {history.length ? (
                    <button type="button" onClick={onClearHistory} className="shrink-0 text-xs font-semibold text-accent">
                      {t("sc.histClear")}
                    </button>
                  ) : null}
                </div>
                <HistoryList items={history} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
