/**
 * PC 도우미 원클릭 실행기 (.bat / .command) 내용 생성 — 순수 함수라 Node에서 테스트할 수 있다.
 * 실행기는 같은 폴더에 raw-print-helper.mjs가 없으면 이 앱 주소에서 받아 오고,
 * --app=<이 앱 주소>를 붙여 실행해 터미널에 폰 연결 QR이 뜨게 한다.
 * 안내 문구는 지금 화면 언어로 넣는다(배치 파일은 chcp 65001로 UTF-8).
 */
import { tr } from "./i18n/core.ts";

export const HELPER_SCRIPT = "raw-print-helper.mjs";

/** 내려받을 실행기 파일 이름 */
export function launcherFileName(os: "win" | "mac") {
  return `${tr("ln.file")}.${os === "win" ? "bat" : "command"}`;
}

function cleanOrigin(origin: string) {
  const url = new URL(origin);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(tr("ln.badProto"));
  /* 배치·셸 문자열에 그대로 들어가므로 따옴표·특수문자가 섞인 주소는 거절 */
  const value = url.origin;
  if (!/^https?:\/\/[A-Za-z0-9.\-:[\]]+$/.test(value)) throw new Error(tr("ln.badChars"));
  return value;
}

/** Windows: 더블클릭 → (필요하면 도우미 받기) → 실행. CRLF 줄바꿈. */
export function windowsLauncher(origin: string) {
  const app = cleanOrigin(origin);
  const lines = [
    "@echo off",
    "chcp 65001 >nul",
    `title ${tr("ln.title")}`,
    'cd /d "%~dp0"',
    "where node >nul 2>nul",
    "if errorlevel 1 (",
    `  echo ${tr("ln.needNodeWin")}`,
    `  start ${tr("ln.nodeUrl")}`,
    "  pause",
    "  exit /b 1",
    ")",
    `if not exist "${HELPER_SCRIPT}" (`,
    `  echo ${tr("ln.downloading")}`,
    `  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing -Uri '${app}/${HELPER_SCRIPT}' -OutFile '${HELPER_SCRIPT}'"`,
    ")",
    `node "${HELPER_SCRIPT}" --app=${app}`,
    "pause",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

/** macOS: 더블클릭 → 터미널에서 실행. 처음 한 번은 실행 권한이 필요할 수 있다(안내 문구 참고). */
export function macLauncher(origin: string) {
  const app = cleanOrigin(origin);
  return [
    "#!/bin/bash",
    `# ${tr("ln.macComment")}`,
    'cd "$(dirname "$0")" || exit 1',
    "if ! command -v node >/dev/null 2>&1; then",
    `  echo "${tr("ln.needNodeMac")}"`,
    `  open "${tr("ln.nodeUrl")}"`,
    `  read -r -p "${tr("ln.enterClose")}"`,
    "  exit 1",
    "fi",
    `if [ ! -f "${HELPER_SCRIPT}" ]; then`,
    `  echo "${tr("ln.downloading")}"`,
    `  curl -fsSL "${app}/${HELPER_SCRIPT}" -o "${HELPER_SCRIPT}" || { echo "${tr("ln.dlFail")}"; read -r; exit 1; }`,
    "fi",
    `node "${HELPER_SCRIPT}" --app="${app}"`,
    "",
  ].join("\n");
}

export function downloadText(filename: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
