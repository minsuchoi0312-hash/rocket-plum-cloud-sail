/** 화면 하단 토스트: 2초 뒤 사라지고, 새 알림이 오면 바로 바꿔 보여 준다(스크린 리더에도 읽힘) */
import { useEffect, useState } from "react";
import { msgText, useI18n, type Msg } from "@/lib/i18n";
import { onToast } from "@/lib/toast";

export const TOAST_MS = 2000;

export function Toaster() {
  useI18n();
  const [item, setItem] = useState<{ msg: Msg; id: number } | null>(null);
  useEffect(() => {
    let timer = 0;
    const off = onToast((msg) => {
      window.clearTimeout(timer);
      setItem({ msg, id: Date.now() });
      timer = window.setTimeout(() => setItem(null), TOAST_MS);
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <div className="toast-dock pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex justify-center px-4" role="status" aria-live="polite">
      {item ? (
        <p key={item.id} className="toast toast-pop max-w-sm rounded-2xl px-4 py-2.5 text-center text-sm font-medium shadow-lg">
          {msgText(item.msg)}
        </p>
      ) : null}
    </div>
  );
}
