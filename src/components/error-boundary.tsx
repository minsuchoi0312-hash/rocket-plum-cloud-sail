/**
 * 전역 안전망: 예기치 못한 오류(손상된 PDF·저장소 데이터 등)로 화면이 하얗게 멈추지 않게 한다.
 * 문구는 i18n 사전을 쓰고, 사용자가 스스로 '다시 시도'하거나 '저장된 설정 초기화 후 다시 열기'를 할 수 있다.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { diag, maskSecrets } from "@/lib/diag";
import { useI18n } from "@/lib/i18n";

/** 이 앱이 브라우저에 남기는 저장소 키(초기화 대상). 도우미 연결 코드·언어 선택도 함께 지운다. */
export const APP_STORAGE_KEYS = ["print-atlas-v2", "nuguna-print-presets", "nuguna-print-history", "nuguna-subnet", "nuguna-subnet-learned", "nuguna-helper", "nuguna-lang", "atlas-theme", "atlas-palette", "atlas-palette-light", "atlas-palette-dark"];

export function resetAppStorage(store: Pick<Storage, "removeItem"> = window.localStorage) {
  for (const key of APP_STORAGE_KEYS) {
    try {
      store.removeItem(key);
    } catch {
      /* 저장소가 막혀 있어도 다음 키 계속 */
    }
  }
}

type Props = { children: ReactNode };
type State = { error: Error | null; attempt: number };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    diag(`UI error: ${maskSecrets(String(error?.message ?? error))} ${String(info?.componentStack ?? "").split("\n").slice(0, 3).join(" ").trim()}`);
  }

  render() {
    if (!this.state.error) return <div key={this.state.attempt} style={{ display: "contents" }}>{this.props.children}</div>;
    return (
      <CrashScreen
        message={maskSecrets(String(this.state.error.message || this.state.error))}
        onRetry={() => this.setState((s) => ({ error: null, attempt: s.attempt + 1 }))}
        onReset={() => {
          resetAppStorage();
          window.location.reload();
        }}
      />
    );
  }
}

function CrashScreen({ message, onRetry, onReset }: { message: string; onRetry: () => void; onReset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="shell mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center gap-3 px-4 py-8" role="alert">
      <div className="card p-5">
        <p className="text-lg font-semibold text-fg">{t("eb.title")}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("eb.body")}</p>
        <div className="mt-4 grid gap-2">
          <button type="button" onClick={onRetry} className="btn-solid h-12 rounded-2xl text-sm font-semibold">
            {t("eb.retry")}
          </button>
          <button type="button" onClick={onReset} className="chip min-h-12 rounded-2xl px-3 py-2 text-sm font-semibold">
            {t("eb.reset")}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-faint">{t("eb.resetNote")}</p>
        <details className="mt-3 text-xs text-faint">
          <summary>{t("eb.detail")}</summary>
          <pre className="mt-1 whitespace-pre-wrap break-all">{message}</pre>
        </details>
      </div>
    </main>
  );
}
