/**
 * 화면 공통 부품 — 토스(TDS)·당근(SEED) design.md의 배치·형태 규칙을 따른다.
 * 색은 styles.css의 기존 토큰(--color-*)만 쓴다.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronDown, ChevronLeft, CircleAlert, Info } from "lucide-react";

/** 56px 상단바 — 좌측 정렬 제목, 우측 아이콘 버튼 슬롯 (TDS top-app-bar / SEED top-navigation) */
export function TopBar({
  title,
  onBack,
  backDisabled,
  actions,
  root = false,
}: {
  title: ReactNode;
  onBack?: () => void;
  backDisabled?: boolean;
  actions?: ReactNode;
  root?: boolean;
}) {
  return (
    <header className="topbar">
      {onBack ? (
        <button type="button" className="icon-btn" onClick={onBack} disabled={backDisabled} aria-label="뒤로">
          <ChevronLeft className="size-6" aria-hidden="true" />
        </button>
      ) : null}
      <h1 className={`min-w-0 flex-1 truncate ${root ? "t-h3 pl-3" : "t-title pl-1"}`}>{title}</h1>
      <div className="flex shrink-0 items-center">{actions}</div>
    </header>
  );
}

export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" className="icon-btn" aria-label={label} {...props}>
      {children}
    </button>
  );
}

/** 섹션 카드 + 리스트 헤더(타이틀 · 우측 액션) */
export function Section({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`section ${className}`}>
      {title || action ? (
        <div className="list-header">
          {title ? <h2 className="t-title">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** 44px 아바타 + 타이틀/서브 스택 + 우측 슬롯 (TDS list-row / SEED list item) */
export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
  disabled,
  active,
  dot,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  dot?: string;
}) {
  const body = (
    <>
      {icon ? (
        <span className="avatar">
          {icon}
          {dot ? <span className={`avatar-dot ${dot}`} /> : null}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className={`t-label block truncate ${active ? "text-accent" : "text-fg"}`}>{title}</span>
        {subtitle ? <span className="t-body-s mt-0.5 block truncate text-muted">{subtitle}</span> : null}
      </span>
      {right ? <span className="flex shrink-0 items-center gap-1">{right}</span> : null}
    </>
  );
  if (!onClick) return <div className="list-row">{body}</div>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="list-row is-pressable" aria-current={active ? "true" : undefined}>
      {body}
    </button>
  );
}

/** full pill 칩 — 선택 상태는 강조색 채움 */
export function Chip({ on = false, className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return (
    <button type="button" aria-pressed={on} className={`chip ${on ? "is-on" : ""} ${className}`} {...props}>
      {children}
    </button>
  );
}

/** 상호 배타 단일 선택 — 선택된 분절이 떠오른다 (TDS segmented-control) */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  disabled,
  label,
}: {
  items: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="seg" role="tablist" aria-label={label}>
      {items.map(([id, text]) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} disabled={disabled} onClick={() => onChange(id)}>
          {text}
        </button>
      ))}
    </div>
  );
}

/** 즉시 적용되는 설정은 체크박스 대신 스위치 (SEED switch 지침) */
export function SwitchRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="switch-row">
      <span className="min-w-0 flex-1">
        <span className="t-label block text-fg">{label}</span>
        {description ? <span className="t-body-s mt-0.5 block text-muted">{description}</span> : null}
      </span>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} className="switch" onClick={() => onChange(!checked)}>
        <span className="switch-knob" />
      </button>
    </label>
  );
}

/** −  값  + 가로 캡슐 (TDS numeric-spinner / SEED quantity-picker) */
export function Stepper({
  value,
  onMinus,
  onPlus,
  minusDisabled,
  plusDisabled,
  minusLabel,
  plusLabel,
}: {
  value: ReactNode;
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
  minusLabel: string;
  plusLabel: string;
}) {
  return (
    <div className="stepper">
      <button type="button" onClick={onMinus} disabled={minusDisabled} aria-label={minusLabel}>
        −
      </button>
      <span className="stepper-value">{value}</span>
      <button type="button" onClick={onPlus} disabled={plusDisabled} aria-label={plusLabel}>
        +
      </button>
    </div>
  );
}

/** 칩 묶음 + 캡션 라벨 */
export function OptionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="t-caption mb-2 text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** 인라인 안내 메시지 — 색만으로 알리지 않고 아이콘을 함께 둔다 (SEED callout) */
export function Callout({ tone = "warn", children }: { tone?: "warn" | "info"; children: ReactNode }) {
  const Icon = tone === "warn" ? CircleAlert : Info;
  return (
    <div className={`callout ${tone === "warn" ? "is-warn" : "is-info"}`} role={tone === "warn" ? "status" : undefined}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** 펼치기 목록 — 트리거 전체가 터치 영역 (SEED accordion) */
export function Accordion({
  title,
  children,
  open,
  onToggle,
  className = "",
}: {
  title: ReactNode;
  children: ReactNode;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string;
}) {
  return (
    <details className={`accordion ${className}`} open={open} onToggle={onToggle ? (event) => onToggle((event.target as HTMLDetailsElement).open) : undefined}>
      <summary>
        <span className="t-label text-fg">{title}</span>
        <ChevronDown className="accordion-chevron size-5 text-faint" aria-hidden="true" />
      </summary>
      <div className="accordion-body">{children}</div>
    </details>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}>
      <span style={{ width: `${clamped}%` }} />
    </div>
  );
}

/** 화면 최하단 고정 액션 + 위쪽 보호 그라디언트 (TDS bottom-cta) */
export function BottomCTA({ children }: { children: ReactNode }) {
  return (
    <div className="bottom-cta">
      <div className="mx-auto w-full max-w-lg">{children}</div>
    </div>
  );
}

/** 하단 시트 — 모바일에서 dialog의 1차 대체 */
export function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <span className="sheet-handle" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <p className="t-title text-fg">{title}</p>
          <button type="button" onClick={onClose} className="btn btn-s btn-ghost">
            닫기
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
