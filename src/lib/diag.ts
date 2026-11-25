const lines: string[] = [];

export function maskSecrets(text: string) {
  return text
    .replace(/HOLDKEY=\S+/gi, "HOLDKEY=****")
    .replace(/PIN\s*[=:]\s*\S+/gi, "PIN=****")
    .replace(/(비밀번호|password|パスワード|密码)\s*[:=]?\s*\S+/gi, "$1 ****")
    .replace(/(X-Helper-Code|연결 코드|도우미 코드|接続コード|连接码|connection code)\s*[:=]?\s*\S+/gi, "$1 ****");
}

export function diag(line: string) {
  const stamp = new Date().toISOString().slice(11, 19);
  lines.push(`${stamp} ${maskSecrets(line)}`);
  if (lines.length > 50) lines.shift();
}

export function diagText() {
  return lines.join("\n");
}

export function clearDiag() {
  lines.length = 0;
}
