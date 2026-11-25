/**
 * 모달 공통 키보드·스크롤 동작: 열릴 때 대화 상자로 포커스, Esc로 닫기, 배경 스크롤 잠금,
 * 닫힌 뒤에는 모달을 열었던 버튼으로 포커스를 돌려준다.
 */
import { useEffect, useRef, type RefObject } from "react";

export function useModal(dialogRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    // 한 번 열릴 때만 설정하고 닫힐 때 되돌린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
