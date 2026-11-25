/**
 * 6단계 원클릭 종합 자가진단 패널.
 * 측정은 여기서 하고 판정은 src/lib/self-diag.ts(순수 함수)가 한다. 각 단계는 순서대로 실시간 표시.
 */
import { useEffect, useState } from "react";
import { Copy, Stethoscope } from "@/components/icons";
import { diagReport, diagTitles, judgeCmap, judgeEnv, judgeHardware, judgeHelper, judgeReach, judgeRoute, levelLabel, overall, type DiagFix, type DiagStep, type PortProbe } from "@/lib/self-diag";
import { m, useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { envLine, readEnv } from "@/lib/support";
import { copyText } from "@/lib/clipboard";
import { statusSummary, type PrinterStatus } from "@/lib/printer-status";

export type DiagContext = {
  helperUrl: string;
  helperCode: string;
  helperConfigured: boolean;
  host: string;
  usb: { cmd: string; live: boolean } | null;
  canTrial: boolean;
  printerName: string;
  routeLabel: string;
  getStatus: () => Promise<PrinterStatus | null | undefined>;
  onFix: (action: DiagFix) => void;
};


async function timed<T>(fn: () => Promise<T>) {
  const started = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - started) };
}

/** 브라우저 혼자서 HTTP 포트 응답만 본다(no-cors: 응답 내용은 못 읽지만 닿았는지는 안다) */
async function browserPort(host: string, port: number): Promise<PortProbe> {
  const ac = new AbortController();
  const timer = window.setTimeout(() => ac.abort(), 1500);
  const started = performance.now();
  try {
    await fetch(`http://${host}:${port}/`, { mode: "no-cors", cache: "no-store", signal: ac.signal, targetAddressSpace: "local" } as RequestInit);
    return { port, open: true, ms: Math.round(performance.now() - started) };
  } catch {
    return { port, open: false, ms: null };
  } finally {
    window.clearTimeout(timer);
  }
}

export function DiagPanel({ ctx }: { ctx: DiagContext }) {
  const [steps, setSteps] = useState<DiagStep[]>([]);
  const [running, setRunning] = useState(false);
  const [at, setAt] = useState(0);
  const { lang, t } = useI18n();
  // 언어를 바꾸면 이전 언어로 만든 결과는 지우고 다시 점검하게 해요.
  useEffect(() => setSteps([]), [lang]);

  async function run() {
    setRunning(true);
    setSteps([]);
    const out: DiagStep[] = [];
    const push = (step: DiagStep) => {
      out.push(step);
      setSteps([...out]);
    };
    const env = readEnv();
    /* 1) 브라우저·기기 */
    push(judgeEnv({ ...env, serviceWorker: Boolean(navigator.serviceWorker?.controller), online: navigator.onLine }));
    /* 2) 한글 CMap */
    try {
      const { value, ms } = await timed(async () => {
        const res = await fetch("/pdfjs/cmaps/Adobe-Korea1-UCS2.bcmap", { cache: "no-cache" });
        return res.ok ? (await res.arrayBuffer()).byteLength : 0;
      });
      push(judgeCmap({ ok: value > 0, bytes: value, ms }));
    } catch {
      push(judgeCmap({ ok: false, bytes: 0, ms: 0 }));
    }
    /* 3) PC 도우미 */
    let helperOk = false;
    if (ctx.helperConfigured && ctx.helperUrl.trim()) {
      const ac = new AbortController();
      const timer = window.setTimeout(() => ac.abort(), 1500);
      try {
        const { value: res, ms } = await timed(() => fetch(`${ctx.helperUrl.replace(/\/$/, "")}/info`, { headers: ctx.helperCode ? { "X-Helper-Code": ctx.helperCode } : {}, signal: ac.signal }));
        const body = res.ok ? ((await res.json()) as { subnets?: string[] }) : {};
        helperOk = res.ok;
        push(judgeHelper({ configured: true, ok: res.ok, status: res.status, ms, subnets: body.subnets, codeSet: Boolean(ctx.helperCode), needed: !ctx.usb }));
      } catch {
        push(judgeHelper({ configured: true, ok: false, codeSet: Boolean(ctx.helperCode), needed: !ctx.usb }));
      } finally {
        window.clearTimeout(timer);
      }
    } else push(judgeHelper({ configured: false, ok: false, codeSet: false, needed: !ctx.usb }));
    /* 4) 네트워크 도달성 + 6) 하드웨어용 상태 */
    let status: PrinterStatus | null = null;
    if (!ctx.usb && ctx.host && helperOk) status = (await ctx.getStatus().catch(() => null)) ?? null;
    let ports: PortProbe[] = [];
    if (!ctx.usb && ctx.host) {
      if (status) {
        const ms = status.latencyMs;
        ports = [
          { port: 9100, open: status.capabilities.raw9100, ms: status.capabilities.raw9100 ? ms : null },
          { port: 631, open: status.capabilities.ipp631, ms: status.capabilities.ipp631 ? ms : null },
          { port: 80, open: status.capabilities.webAdmin, ms: status.capabilities.webAdmin ? ms : null },
        ];
      } else {
        const [ipp, web] = await Promise.all([browserPort(ctx.host, 631), browserPort(ctx.host, 80)]);
        ports = [{ port: 9100, open: null, ms: null }, ipp, web];
      }
    }
    push(judgeReach({ ip: ctx.host, usb: Boolean(ctx.usb), ports }));
    /* 5) 출력 경로 */
    const caps = status ? status.capabilities : ports.length ? { pdfDirect: null, pcl5: null, raw9100: false, ipp631: Boolean(ports.find((p) => p.port === 631)?.open) } : null;
    push(judgeRoute({ usb: Boolean(ctx.usb), cmd: ctx.usb?.cmd || "", helper: helperOk, caps, canTrial: ctx.canTrial }));
    /* 6) 하드웨어 */
    push(judgeHardware(status ? { ...status, summary: statusSummary(status) } : null, Boolean(ctx.usb)));
    setAt(Date.now());
    setRunning(false);
  }

  const total = overall(steps);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-xs leading-relaxed text-muted">{t("diag.intro")}</p>
        <button type="button" onClick={() => void run()} disabled={running} className="btn-solid inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold">
          <Stethoscope className="size-4" aria-hidden="true" />
          {running ? t("diag.running") : steps.length ? t("diag.again") : t("diag.start")}
        </button>
      </div>
      {steps.length && !running ? (
        <p className={`diag-total is-${total} rounded-xl px-3 py-2 text-sm font-semibold`}>
          {t(total === "pass" ? "diag.totalPass" : total === "warn" ? "diag.totalWarn" : "diag.totalFail")}
        </p>
      ) : null}
      <ol className="space-y-1.5" aria-live="polite">
        {diagTitles().map((title, index) => {
          const step = steps[index];
          const pending = !step && running && index === steps.length;
          return (
            <li key={index} className="diag-row rounded-2xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={`diag-badge is-${step?.level ?? (pending ? "run" : "idle")}`}>{step ? levelLabel(step.level) : pending ? t("diag.pending") : t("diag.idle")}</span>
                <span className="min-w-0 flex-1 text-sm font-medium text-fg">
                  {index + 1}) {title}
                </span>
              </div>
              {step?.metric ? <p className="diag-metric mt-0.5 text-[11px] tabular-nums text-muted">{t("diag.metric", { v: step.metric })}</p> : null}
              {step ? <p className="mt-1 text-xs leading-relaxed text-muted">{step.detail}</p> : null}
              {step?.fix ? (
                <button type="button" onClick={() => ctx.onFix(step.fix!.action)} className="chip mt-1.5 h-8 rounded-full px-3 text-xs font-semibold">
                  {step.fix.label}
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
      {steps.length === 6 ? (
        <button
          type="button"
          onClick={() =>
            void copyText(diagReport(steps, { at, printer: ctx.printerName, route: ctx.routeLabel, env: envLine(readEnv()) })).then((ok) => {
              toast(m(ok ? "diag.copied" : "diag.copyFail"));
            })
          }
          className="chip inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold"
        >
          <Copy className="size-4" aria-hidden="true" />
          {t("diag.copy")}
        </button>
      ) : null}
    </div>
  );
}
