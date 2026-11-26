/**
 * 모달 공통 키보드·스크롤 동작: 열릴 때 대화 상자로 포커스, Esc로 닫기, 배경 스크롤 잠금,
 * 닫힌 뒤에는 모달을 열었던 버튼으로 포커스를 돌려준다.
 */
import { useEffect, useRef, type RefObject } from "react";

/** 열린 모달 순서 — 모달 위에 모달(도움말 위 약관)이 뜨면 Esc는 맨 위 것만 닫는다 */
const stack: object[] = [];

export function useModal(dialogRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const me = {};
    stack.push(me);
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || stack[stack.length - 1] !== me) return;
      event.preventDefault();
      closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      stack.splice(stack.indexOf(me), 1);
      window.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      /* 폰의 뒤로 버튼도 '키보드'로 쳐서 파란 링이 남던 것 — 포커스만 돌려주고 링은 그리지 않는다 */
      if (opener?.isConnected) opener.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
    };
    // 한 번 열릴 때만 설정하고 닫힐 때 되돌린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
