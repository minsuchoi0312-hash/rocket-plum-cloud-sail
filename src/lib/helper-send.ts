import { tr } from "@/lib/i18n/core";
import { cleanIPv4, cleanText } from "@/lib/sanitize";
/** port: 9100(Raw) 기본, 8611 이면 폰 내장 도우미가 캐논 BJNP 로 보낸다 */
export async function helperSend(base: string, code: string, host: string, bytes: Uint8Array, port = 9100) {
  const root = base.replace(/\/$/, "");
  let response: Response;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  try {
    response = await fetch(`${root}/print?host=${encodeURIComponent(host)}&port=${port}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        ...(code ? { "X-Helper-Code": code } : {}),
      },
      body: copy.buffer,
    });
  } catch {
    throw new Error(tr("hs.noConnect"));
  }
  if (response.status === 413) throw new Error(tr("hs.tooLarge"));
  if (response.status === 401) throw new Error(tr("hs.code6"));
  if (response.status === 502) throw new Error(tr("hs.printerDown"));
  if (!response.ok) throw new Error(tr("hs.refused", { code: response.status }));
}

export async function helperPing(base: string) {
  const root = base.replace(/\/$/, "");
  const response = await fetch(`${root}/ping`);
  if (!response.ok) throw new Error(tr("hs.noReply"));
  return response.json() as Promise<{ ok?: boolean; name?: string; version?: number; discover?: boolean }>;
}

export type HelperPrinter = {
  host: string;
  /** 9100(Raw) 포트가 열려 있으면 PC 도우미로 바로 보낼 수 있다 */
  raw9100: boolean;
  ipp: boolean;
  model: string;
  via: "ipp" | "pjl" | "mdns" | "snmp" | "http" | null;
  /** 폰 내장 도우미: 프린터가 알려 준 인쇄 언어(IEEE 1284 CMD · IPP 형식 · mDNS pdl) */
  cmd?: string;
  lpd?: boolean;
  canon?: boolean;
};

export type HelperDiscovery = { subnets: string[]; printers: HelperPrinter[]; ms: number };

/** PC 도우미가 같은 망을 직접 훑어(9100/631 + 모델명 조회) 찾은 실제 프린터 목록 */
export async function helperDiscover(base: string, code: string, subnet = "", signal?: AbortSignal): Promise<HelperDiscovery> {
  const root = base.replace(/\/$/, "");
  const query = subnet ? `?subnet=${encodeURIComponent(subnet)}` : "";
  let response: Response;
  try {
    response = await fetch(`${root}/discover${query}`, {
      headers: code ? { "X-Helper-Code": code } : {},
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error(tr("hs.searchStopped"));
    throw new Error(tr("hs.noConnect2"));
  }
  if (response.status === 401) throw new Error(tr("hs.code6"));
  if (response.status === 404) throw new Error(tr("hs.oldScript"));
  if (!response.ok) throw new Error(tr("hs.searchRefused", { code: response.status }));
  const body = (await response.json()) as Partial<HelperDiscovery> & { ok?: boolean };
  /* 복사기가 알려 준 모델명·이름은 정화하고, 주소는 엄격한 IPv4만 남긴다 */
  const printers = (Array.isArray(body.printers) ? body.printers : [])
    .map((row) => ({ ...row, host: cleanIPv4(row?.host), model: cleanText(row?.model, 80), cmd: cleanText(row?.cmd, 400) }))
    .filter((row) => row.host);
  const subnets = (Array.isArray(body.subnets) ? body.subnets : []).filter((s): s is string => typeof s === "string" && /^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s));
  return { subnets, printers, ms: typeof body.ms === "number" ? body.ms : 0 };
}

export type HelperProbe = { open: boolean; ms: number | null };

/** 도우미로 한 대의 9100 응답·지연시간 확인 */
export async function helperProbe(base: string, code: string, ip: string, signal?: AbortSignal): Promise<HelperProbe> {
  const root = base.replace(/\/$/, "");
  const response = await fetch(`${root}/probe?ip=${encodeURIComponent(ip)}&port=9100`, { headers: code ? { "X-Helper-Code": code } : {}, signal });
  if (response.status === 401) throw new Error(tr("st.err401"));
  if (!response.ok) throw new Error(tr("hs.checkFail", { code: response.status }));
  const body = (await response.json()) as { open?: boolean; ms?: number | null };
  return { open: Boolean(body.open), ms: typeof body.ms === "number" ? body.ms : null };
}

export type HelperInfo = { recommended: string; addresses: { iface: string; address: string; url: string }[]; subnets: string[]; version?: number };

/** 도우미 PC의 추천 접속 주소와 감지된 실제 대역 */
export async function helperInfo(base: string, code: string): Promise<HelperInfo> {
  const root = base.replace(/\/$/, "");
  const response = await fetch(`${root}/info`, { headers: code ? { "X-Helper-Code": code } : {} });
  if (!response.ok) throw new Error(response.status === 404 ? tr("hs.old") : tr("hs.infoFail", { code: response.status }));
  const body = (await response.json()) as Partial<HelperInfo>;
  return { recommended: body.recommended ?? "", addresses: body.addresses ?? [], subnets: body.subnets ?? [], version: body.version };
}
