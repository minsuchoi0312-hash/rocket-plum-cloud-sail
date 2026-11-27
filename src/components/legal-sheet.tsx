/**
 * 약관 · 개인정보처리방침 · 오픈소스 라이선스 보기, 그리고 앱 첫 실행 때의 이용약관 동의.
 * - 동의는 이용약관(필수) 하나만 받는다. 개인정보는 모으지 않으므로 '수집 동의'는 받지 않고 방침만 보여 준다.
 * - 동의 기록(시행일 · 시각)은 기기 안에만 남긴다. 약관 시행일(LEGAL_VERSION)이 바뀌면 다시 묻는다.
 */
import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, ShieldCheck, X } from "@/components/icons";
import { useModal } from "@/components/use-modal";
import { useI18n } from "@/lib/i18n";
import { PRIVACY_POLICY_URL } from "@/lib/contact";
import { legalAgreed, legalDoc, saveLegalAgree, type LegalKind } from "@/lib/legal";

export type LegalTab = LegalKind | "oss";

type OssBlock = { title: string; body: string };

/** licenses.txt(scripts/make-licenses.mjs가 만든 파일)를 패키지별 묶음으로 나눈다 */
function splitLicenses(text: string): OssBlock[] {
  return text
    .split(/^={10,}$/m)
    .slice(1)
    .map((chunk) => {
      const [head, ...rest] = chunk.split(/^-{10,}$/m);
      const lines = head.trim().split("\n");
      return { title: lines[0] || "", body: [lines.slice(1).join("\n").trim(), rest.join("").trim()].filter(Boolean).join("\n\n") };
    })
    .filter((row) => row.title);
}

function OssList() {
  const { t } = useI18n();
  const [blocks, setBlocks] = useState<OssBlock[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/licenses.txt", { cache: "no-cache" })
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((text) => alive && setBlocks(splitLicenses(text)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);
  if (failed) return <p className="text-sm text-bad">{t("lg.ossFail")}</p>;
  if (!blocks) return <p className="text-sm text-muted">{t("lg.loading")}</p>;
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">{t("lg.ossSub")}</p>
      {blocks.map((row) => (
        <details key={row.title} className="faq rounded-2xl px-3 py-2">
          <summary className="font-medium text-fg">{row.title}</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted">{row.body}</pre>
        </details>
      ))}
    </div>
  );
}

function LegalBody({ kind }: { kind: LegalKind }) {
  const { lang, t } = useI18n();
  const doc = legalDoc(kind, lang);
  const note = t("lg.enNote");
  return (
    <article className="space-y-4 text-sm leading-relaxed">
      <p className="text-muted">{doc.intro}</p>
      {note ? <p className="text-xs text-faint">{note}</p> : null}
      {doc.sections.map((sec) => (
        <section key={sec.h}>
          <h3 className="font-semibold text-fg">{sec.h}</h3>
          {sec.p.map((line) => (
            <p key={line} className="mt-1 text-muted">
              {line}
            </p>
          ))}
        </section>
      ))}
      {kind === "privacy" && PRIVACY_POLICY_URL ? (
        <p className="text-xs text-faint">
          {t("lg.webCopy")}{" "}
          <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className="break-all text-accent underline">
            {PRIVACY_POLICY_URL}
          </a>
        </p>
      ) : null}
    </article>
  );
}

/** 약관 · 처리방침 · 오픈소스를 탭으로 보는 시트 */
export function LegalSheet({ tab, onTab, onClose }: { tab: LegalTab; onTab: (tab: LegalTab) => void; onClose: () => void }) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useModal(dialogRef, onClose);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [tab]);
  const tabs: [LegalTab, string][] = [
    ["terms", t("lg.terms")],
    ["privacy", t("lg.privacy")],
    ["oss", t("lg.oss")],
  ];
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-3 sm:items-center" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} className="card support-sheet flex w-full max-w-lg flex-col p-4 outline-none" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={t("lg.title")}>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-fg">{t("lg.title")}</p>
          <button type="button" onClick={onClose} className="icon-btn inline-flex size-9 items-center justify-center rounded-full" aria-label={t("lg.close")}>
            <X className="size-4" />
          </button>
        </div>
        <div className="seg mt-3" role="tablist" aria-label={t("lg.title")}>
          {tabs.map(([id, text]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => onTab(id)} className={`seg-btn ${tab === id ? "is-on" : ""}`}>
              {text}
            </button>
          ))}
        </div>
        <div ref={bodyRef} className="mt-3 min-h-0 flex-1 overflow-y-auto pr-0.5">
          {tab === "oss" ? <OssList /> : <LegalBody kind={tab} />}
        </div>
      </div>
    </div>
  );
}

/** 도움말 시트 아래에 두는 작은 링크 줄: 이용약관 · 개인정보처리방침 · 오픈소스 */
export function LegalLinks({ onOpen }: { onOpen: (tab: LegalTab) => void }) {
  const { t } = useI18n();
  const links: [LegalTab, string][] = [
    ["terms", t("lg.terms")],
    ["privacy", t("lg.privacy")],
    ["oss", t("lg.oss")],
  ];
  return (
    <nav className="flex flex-wrap items-center justify-center gap-x-1 pt-2 text-xs text-muted" aria-label={t("lg.title")}>
      {links.map(([id, text], index) => (
        <span key={id} className="inline-flex items-center gap-1">
          {index ? <span aria-hidden="true">·</span> : null}
          <button type="button" onClick={() => onOpen(id)} className={`px-1 py-1.5 ${id === "privacy" ? "font-semibold text-fg" : ""}`}>
            {text}
          </button>
        </span>
      ))}
    </nav>
  );
}

/**
 * 앱 첫 실행 때 이용약관 동의를 받는 시트. 동의 전에는 닫을 수 없다.
 * 안드로이드 앱에서만 띄운다(웹은 도움말 아래 링크로 같은 문서를 볼 수 있다).
 */
export function ConsentGate() {
  const { t } = useI18n();
  const [need, setNeed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [view, setView] = useState<LegalTab | null>(null);
  useEffect(() => {
    const phone = Boolean((window as { __nugunaPhone?: boolean }).__nugunaPhone);
    if (phone && !legalAgreed()) setNeed(true);
  }, []);
  if (!need) return null;
  return (
    <>
      <div className="fixed inset-0 z-[55] flex items-end justify-center bg-black/55 p-3 sm:items-center">
        <div className="card pack-sheet flex w-full max-w-lg flex-col p-5 outline-none" role="dialog" aria-modal="true" aria-label={t("lg.gateTitle")} data-consent-gate="">
          <span className="pack-icon" aria-hidden="true">
            <ShieldCheck className="size-7" />
          </span>
          <h2 className="mt-3 text-[22px] font-bold leading-tight text-fg">{t("lg.gateTitle")}</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{t("lg.gateSub")}</p>

          <div className="mt-4 divide-y divide-line rounded-2xl bg-[var(--fill)]">
            <div className="flex items-center gap-3 px-3 py-3">
              <button type="button" role="checkbox" aria-checked={checked} onClick={() => setChecked((value) => !value)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className={`tds-check ${checked ? "is-on" : ""}`} aria-hidden="true">
                  {checked ? <Check className="size-3.5" /> : null}
                </span>
                <span className="min-w-0 text-[15px] font-medium text-fg">
                  <span className="mr-1 text-accent">[{t("lg.req")}]</span>
                  {t("lg.agree")}
                </span>
              </button>
              <button type="button" onClick={() => setView("terms")} className="inline-flex shrink-0 items-center text-sm text-muted" aria-label={`${t("lg.terms")} ${t("lg.view")}`}>
                {t("lg.view")}
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
            <button type="button" onClick={() => setView("privacy")} className="flex w-full items-center gap-3 px-3 py-3 text-left">
              <span className="min-w-0 flex-1 pl-9 text-[15px] text-fg">{t("lg.privacy")}</span>
              <span className="inline-flex shrink-0 items-center text-sm text-muted">
                {t("lg.view")}
                <ChevronRight className="size-4" aria-hidden="true" />
              </span>
            </button>
          </div>

          <button
            type="button"
            disabled={!checked}
            onClick={() => {
              saveLegalAgree();
              setNeed(false);
            }}
            className="btn-solid mt-5 h-[52px] w-full rounded-2xl text-[16px] font-semibold disabled:opacity-40"
          >
            {t("lg.start")}
          </button>
        </div>
      </div>
      {view ? <LegalSheet tab={view} onTab={setView} onClose={() => setView(null)} /> : null}
    </>
  );
}
