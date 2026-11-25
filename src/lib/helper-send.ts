export async function helperSend(base: string, code: string, host: string, bytes: Uint8Array) {
  const root = base.replace(/\/$/, "");
  let response: Response;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  try {
    response = await fetch(`${root}/print?host=${encodeURIComponent(host)}&port=9100`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        ...(code ? { "X-Helper-Code": code } : {}),
      },
      body: copy.buffer,
    });
  } catch {
    throw new Error("PC 도우미에 연결하지 못했어요. 같은 컴퓨터에서 raw-print-helper 가 켜져 있는지 확인해 주세요.");
  }
  if (!response.ok) throw new Error(`PC 도우미가 거절했어요 (${response.status}).`);
}

export async function helperPing(base: string) {
  const root = base.replace(/\/$/, "");
  const response = await fetch(`${root}/ping`);
  if (!response.ok) throw new Error("도우미가 응답하지 않아요.");
  return response.json() as Promise<{ ok?: boolean; name?: string }>;
}
