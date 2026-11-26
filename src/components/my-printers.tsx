/**
 * 내 프린터 — 직접 등록(이름 + IP) · 연결 · 이름 바꾸기 · 삭제(한 번 더 확인).
 * printer-panel.tsx에서 분리. 저장은 printer-store(zustand persist)가 맡는다.
 */
import { useState } from "react";
import { Monitor, Pencil, Plus, Printer, QrCode, RefreshCw, Trash2, Usb, Wifi, X } from "@/components/icons";
import { printerLabel, type SavedPrinter } from "@/lib/printer-store";
import { useI18n } from "@/lib/i18n";
import type { ProbeState } from "@/lib/app-utils";
import type { QrTarget } from "@/components/printer-qr-modal";

export type MyPrintersProps = {
  items: SavedPrinter[];
  isCurrent: (item: SavedPrinter) => boolean;
  phone: boolean;
  probes: Record<string, ProbeState>;
  checkPrinter: (item: SavedPrinter) => Promise<void>;
  reconnect: (item: SavedPrinter) => void;
  forget: (uid: string) => void;
  /** 이름 + IP로 등록. 성공하면 null, 실패하면 오류 문구 */
  registerPrinter: (name: string, host: string) => string | null;
  disconnect: () => void;
  editingUid: string | null;
  setEditingUid: (uid: string | null) => void;
  aliasDraft: string;
  setAliasDraft: (value: string) => void;
  saveAlias: (uid: string) => void;
  openQr: (target: QrTarget) => void;
  helperShare: QrTarget["helper"];
};

export function MyPrinters(props: MyPrintersProps) {
  const { items, isCurrent, phone, probes, checkPrinter, reconnect, forget, registerPrinter, disconnect, editingUid, setEditingUid, aliasDraft, setAliasDraft, saveAlias, openQr, helperShare } = props;
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [addError, setAddError] = useState("");
  const [askDelete, setAskDelete] = useState<string | null>(null);

  function closeAdd() {
    setAdding(false);
    setName("");
    setHost("");
    setAddError("");
  }

  function linkText(item: SavedPrinter) {
    const kind = item.link === "helper" && !phone ? t("pp.tabHelper") : item.link === "wifi" || item.link === "helper" ? t("pp.linkWifi") : item.link === "usb" ? "USB" : item.via;
    return item.host && !printerLabel(item).includes(item.host) ? `${kind} · ${item.host}` : kind;
  }

  return (
    <div className="card p-5">
      <div className="card-head">
        <h2 className="card-title">
          {t("pp.recent")}
          {items.length ? <span className="ml-1.5 text-muted">{items.length}</span> : null}
        </h2>
        <button
          type="button"
          onClick={() => (adding ? closeAdd() : setAdding(true))}
          className="ghost-btn -mr-2"
          aria-expanded={adding}
          aria-label={adding ? t("pp.cancel") : t("pp.add")}
          title={adding ? t("pp.cancel") : t("pp.add")}
        >
          {adding ? <X className="size-[22px]" aria-hidden="true" /> : <Plus className="size-[22px]" aria-hidden="true" />}
        </button>
      </div>

      {adding ? (
        <form
          className="add-box mt-3 space-y-2.5 rounded-2xl p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const error = registerPrinter(name, host);
            if (error) {
              setAddError(error);
              return;
            }
            closeAdd();
          }}
        >
          <label className="block">
            <span className="text-sm font-medium text-muted">{t("pp.addName")}</span>
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={30} placeholder={t("pp.aliasPh")} className="field mt-1 h-12 w-full rounded-xl px-3.5 text-[16px] outline-none" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-muted">{t("pp.addIp")}</span>
            <input
              value={host}
              onChange={(event) => {
                setHost(event.target.value);
                setAddError("");
              }}
              inputMode="decimal"
              placeholder="192.168.0.10"
              className="field mt-1 h-12 w-full rounded-xl px-3.5 text-[16px] tabular-nums outline-none"
            />
          </label>
          {addError ? (
            <p className="text-sm text-bad" role="alert">
              {addError}
            </p>
          ) : null}
          <button type="submit" disabled={!host.trim()} className="btn-solid h-12 w-full rounded-2xl text-[16px] font-semibold disabled:opacity-50">
            {t("pp.addSave")}
          </button>
        </form>
      ) : null}

      {items.length === 0 && !adding ? (
        <button type="button" onClick={() => setAdding(true)} className="empty-add mt-3 flex w-full flex-col items-center gap-2 rounded-2xl px-4 py-6 text-center">
          <Printer className="size-8 text-faint" aria-hidden="true" />
          <span className="text-[15px] text-muted">{t("pp.empty")}</span>
          <span className="inline-flex items-center gap-1 text-[15px] font-semibold text-accent">
            <Plus className="size-4" aria-hidden="true" />
            {t("pp.add")}
          </span>
        </button>
      ) : null}

      <ul className="mt-2">
        {items.map((item) => {
          const current = isCurrent(item);
          const probe = probes[item.uid];
          const LinkIcon = item.link === "usb" ? Usb : item.link === "helper" && !phone ? Monitor : Wifi;
          return (
            <li key={item.uid} className="mp-row">
              {editingUid === item.uid ? (
                <form
                  className="flex gap-2 py-1"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveAlias(item.uid);
                  }}
                >
                  <input autoFocus value={aliasDraft} onChange={(event) => setAliasDraft(event.target.value)} maxLength={30} placeholder={t("pp.aliasPh")} aria-label={t("pp.aliasAria")} className="field h-11 min-w-0 flex-1 rounded-xl px-3 text-[16px] outline-none" />
                  <button type="submit" className="btn-solid h-11 shrink-0 rounded-xl px-4 text-[15px]">
                    {t("pp.save")}
                  </button>
                  <button type="button" onClick={() => setEditingUid(null)} className="chip h-11 shrink-0 rounded-xl px-3 text-[15px]">
                    {t("pp.cancel")}
                  </button>
                </form>
              ) : askDelete === item.uid ? (
                <div className="del-ask flex flex-wrap items-center gap-2 rounded-2xl p-3" role="alertdialog" aria-label={t("pp.delAsk", { name: printerLabel(item) })}>
                  <p className="min-w-0 flex-1 text-[15px] font-medium text-fg">{t("pp.delAsk", { name: printerLabel(item) })}</p>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => {
                      forget(item.uid);
                      setAskDelete(null);
                    }}
                    className="del-btn h-10 rounded-xl px-4 text-[15px] font-semibold"
                  >
                    {t("pp.del")}
                  </button>
                  <button type="button" onClick={() => setAskDelete(null)} className="chip h-10 rounded-xl px-3 text-[15px]">
                    {t("pp.cancel")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="mp-ico" aria-hidden="true">
                      <LinkIcon className="size-5" />
                    </span>
                    <button type="button" onClick={() => reconnect(item)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[16px] font-semibold text-fg">{printerLabel(item)}</span>
                      <span className="mt-0.5 block truncate text-sm text-muted">
                        {current ? <span className="font-semibold text-ok">{t("pp.live")} · </span> : null}
                        {linkText(item)}
                      </span>
                    </button>
                    {current ? (
                      <button type="button" onClick={disconnect} className="chip h-10 shrink-0 rounded-full px-4 text-[15px] font-semibold">
                        {t("pp.disconnect")}
                      </button>
                    ) : (
                      <button type="button" onClick={() => reconnect(item)} className="btn-solid h-10 shrink-0 rounded-full px-4 text-[15px] font-semibold">
                        {t("pp.connect")}
                      </button>
                    )}
                  </div>
                  {probe ? (
                    <p className="mt-2 flex items-start gap-1.5 pl-[52px] text-sm leading-snug text-muted" aria-live="polite">
                      <span className={`probe-dot mt-1.5 ${probe.state === "on" ? "is-on" : probe.state === "checking" ? "is-wait" : ""}`} aria-hidden="true" />
                      <span>{probe.state === "checking" ? t("pp.probeChecking") : probe.state === "on" ? t("pp.probeOn", { ms: probe.ms ?? "?", via: probe.via ?? "" }) : t("pp.probeOff", { via: probe.via || "-" })}</span>
                    </p>
                  ) : null}
                  <div className="mp-acts">
                    {item.host && !current ? (
                      <>
                        <button type="button" onClick={() => void checkPrinter(item)} disabled={probe?.state === "checking"} className="mp-act" aria-label={t("pp.probeBtn")} title={t("pp.probeBtn")}>
                          <RefreshCw className="size-[18px]" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => openQr({ name: printerLabel(item), ip: item.host || "", helper: helperShare })} className="mp-act" aria-label={t("pp.qrAria", { name: printerLabel(item) })} title={t("pp.qrShare")}>
                          <QrCode className="size-[18px]" aria-hidden="true" />
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUid(item.uid);
                        setAliasDraft(item.alias || "");
                      }}
                      className="mp-act"
                      aria-label={t("pp.aliasEdit", { name: printerLabel(item) })}
                      title={t("pp.aliasEdit", { name: printerLabel(item) })}
                    >
                      <Pencil className="size-[18px]" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setAskDelete(item.uid)} className="mp-act" aria-label={t("pp.delete", { name: printerLabel(item) })} title={t("pp.delete", { name: printerLabel(item) })}>
                      <Trash2 className="size-[18px]" aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
