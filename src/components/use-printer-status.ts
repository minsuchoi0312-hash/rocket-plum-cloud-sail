/**
 * 선택된 복사기의 실제 상태를 가져오는 훅.
 * 와이파이: PC 도우미가 살아 있을 때 GET /status (프린터를 고르면 자동 1회 + 새로고침).
 * USB: GET_DEVICE_ID로 아는 정보만 같은 모양으로.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPrinterStatus, usbStatus, type PrinterStatus } from "@/lib/printer-status";
import { tr } from "@/lib/i18n";

/** pjl: 9100 으로 PJL 상태 질문을 보내도 되는지 — PJL 을 모르는 잉크젯(엡손 · HP PCL3 · 캐논)은 그 글을 쪽으로 찍을 수 있어 묻지 않는다 */
export function usePrinterStatus(opts: { host: string; helperUrl: string; helperCode: string; helperAlive: boolean; usb: { cmd: string; live: boolean; title: string } | null; pjl?: boolean }) {
  const [status, setStatus] = useState<PrinterStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const req = useRef(0);
  const { host, helperUrl, helperCode, helperAlive, usb } = opts;
  const pjl = opts.pjl !== false;
  const usbKey = usb ? `${usb.cmd}|${usb.live}|${usb.title}` : "";

  const refresh = useCallback(async () => {
    const id = ++req.current;
    if (usb) {
      setStatus(usbStatus(usb.cmd, usb.live, usb.title));
      setError("");
      return;
    }
    if (!host || !helperAlive || !helperUrl.trim()) {
      setStatus(null);
      setError("");
      return;
    }
    setLoading(true);
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), 6000);
    try {
      const next = await fetchPrinterStatus(helperUrl, helperCode, host, ac.signal, pjl);
      if (id === req.current) {
        setStatus(next);
        setError("");
      }
      return next;
    } catch (err) {
      if (id === req.current) setError(err instanceof DOMException && err.name === "AbortError" ? tr("st.timeout") : err instanceof Error ? err.message : tr("st.readFail"));
    } finally {
      window.clearTimeout(timer);
      if (id === req.current) setLoading(false);
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, helperUrl, helperCode, helperAlive, usbKey, pjl]);

  useEffect(() => {
    setStatus(null);
    void refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}
