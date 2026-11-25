/**
 * 연결 방식 아이콘 — 사용자가 준 참고 이미지를 24px 격자로 다시 그린 것.
 * Phosphor 아이콘과 같은 자리에 쓰도록 `weight`·`size` 같은 Phosphor 속성은 받기만 하고 무시한다.
 * 색은 currentColor를 따른다.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { weight?: string; size?: number | string; mirrored?: boolean };

function strip({ weight: _weight, size, mirrored: _mirrored, ...rest }: IconProps) {
  return size === undefined ? rest : { width: size, height: size, ...rest };
}

/** 와이파이 — 굵고 끝이 둥근 호 두 개 + 큰 점 */
export function WifiIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...strip(props)}>
      <path d="M2.6 10.6a13 13 0 0 1 18.8 0" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M6.6 14.3a7.6 7.6 0 0 1 10.8 0" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="12" cy="18.7" r="2.55" fill="currentColor" />
    </svg>
  );
}

/** USB — 위로 향한 화살표 줄기, 왼쪽 원·오른쪽 사각 가지, 아래 큰 원 */
export function UsbIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...strip(props)}>
      <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v13" />
        <path d="M7.3 10.2v2.6l4.7 3" />
        <path d="M16.9 9.6v1.5L12 14.2" />
      </g>
      <path d="M12 1.4l2.7 4H9.3z" fill="currentColor" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="7.3" cy="9" r="1.85" fill="currentColor" />
      <rect x="15.2" y="6.2" width="3.4" height="3.4" rx="0.7" fill="currentColor" />
      <circle cx="12" cy="19.6" r="2.7" fill="currentColor" />
    </svg>
  );
}
