import { tr, type MsgKey } from "./i18n/core.ts";
const PRIVATE = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;
/** 빠른 검색: 공유기 DHCP·고정 IP에서 프린터가 자주 받는 끝자리 40여 개 */
export const QUICK_OCTETS = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 25, 30, 31, 33, 40, 50, 51, 60, 70, 77, 80, 88, 99, 100, 101, 110, 111, 120, 150, 200, 201, 250, 251, 253, 254,
];
const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const SUBNET = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){2}$/;

/** 국내에서 많이 쓰는 사설 대역 원터치 프리셋 */
export const SUBNET_PRESETS: { subnet: string; labelKey: MsgKey }[] = [
  { subnet: "192.168.0", labelKey: "sub.iptime" },
  { subnet: "192.168.1", labelKey: "sub.router" },
  { subnet: "192.168.219", labelKey: "sub.lgu" },
  { subnet: "192.168.35", labelKey: "sub.skb" },
  { subnet: "172.30.1", labelKey: "sub.kt" },
  { subnet: "192.168.50", labelKey: "sub.office" },
  { subnet: "10.0.0", labelKey: "sub.corp" },
];

export function isValidIPv4(value: string) {
  return IPV4.test(value.trim());
}

export function isValidSubnet(value: string) {
  return SUBNET.test(value.trim());
}

function isPrivateIPv4(ip: string) {
  return PRIVATE.test(ip) && !ip.startsWith("127.");
}

export function subnetOf(ip: string) {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 브라우저가 알려 주는 사설 IPv4. 막혀 있으면 빈 목록이다. */
export async function guessLocalIPv4s(timeoutMs = 700): Promise<string[]> {
  if (typeof RTCPeerConnection === "undefined") return [];
  const ips = new Set<string>();
  const pc = new RTCPeerConnection({ iceServers: [] });
  try {
    pc.createDataChannel("p");
    pc.onicecandidate = (ev) => {
      const line = ev.candidate?.candidate ?? "";
      const found = line.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
      if (found && isPrivateIPv4(found[1])) ips.add(found[1]);
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const text = pc.localDescription?.sdp ?? "";
    for (const found of text.matchAll(/(\d{1,3}(?:\.\d{1,3}){3})/g)) {
      if (isPrivateIPv4(found[1])) ips.add(found[1]);
    }
    await wait(timeoutMs);
  } catch {
    /* 이 브라우저는 주소를 숨긴다 */
  } finally {
    try {
      pc.close();
    } catch {
      /* ignore */
    }
  }
  return [...ips];
}

async function probeIpp(host: string, ms: number, outer?: AbortSignal) {
  if (outer?.aborted) return false;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  const relay = () => ac.abort();
  outer?.addEventListener("abort", relay, { once: true });
  try {
    await fetch(`http://${host}:631/ipp/print`, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: ac.signal,
      targetAddressSpace: "local",
    } as RequestInit);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener("abort", relay);
  }
}

async function mapPool<T>(items: T[], limit: number, fn: (item: T) => Promise<T | null>, signal?: AbortSignal) {
  const out: T[] = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      if (signal?.aborted) return;
      const item = items[index++];
      const hit = await fn(item);
      if (hit) out.push(hit);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

export interface LanPrinter {
  host: string;
  port: number;
  answered: boolean;
}

export type ScanProgress = { done: number; total: number; found: number };

export type ScanOptions = {
  /** quick: 흔한 끝자리 40여 개 · full: .1~.254 전체 */
  mode?: "quick" | "full";
  prefer?: string[];
  signal?: AbortSignal;
  onStatus?: (label: string) => void;
  onProgress?: (progress: ScanProgress) => void;
  /** 찾는 즉시 한 대씩 알려 준다 */
  onFound?: (printer: LanPrinter) => void;
};

/* ───── 스마트 대역 학습: 실제로 연결에 성공한 IP의 대역을 다음 검색 때 맨 먼저 ───── */
const LEARN_KEY = "nuguna-subnet-learned";

function learnStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 학습된 대역 (최근 성공 순, 최대 4개) */
export function learnedSubnets(): string[] {
  try {
    const list = JSON.parse(learnStore()?.getItem(LEARN_KEY) || "[]") as unknown;
    return Array.isArray(list) ? list.filter((row): row is string => typeof row === "string" && isValidSubnet(row)).slice(0, 4) : [];
  } catch {
    return [];
  }
}

/** 연결 성공한 IP(예: 192.168.219.45)의 대역(192.168.219)을 맨 앞으로 기억 */
export function learnSubnetFromIp(ip: string) {
  if (!isValidIPv4(ip) || !isPrivateIPv4(ip)) return learnedSubnets();
  const subnet = subnetOf(ip);
  if (!subnet) return learnedSubnets();
  const next = [subnet, ...learnedSubnets().filter((row) => row !== subnet)].slice(0, 4);
  try {
    learnStore()?.setItem(LEARN_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

async function resolveSubnets(prefer: string[], onStatus?: (label: string) => void) {
  onStatus?.(tr("lan.readLocal"));
  const local = await guessLocalIPv4s();
  const subnets = new Set<string>();
  /* 순서: 직접 넣은 대역 → 학습된(성공) 대역 → 이 기기 대역 */
  for (const raw of [...prefer.slice(0, 1), ...learnedSubnets(), ...prefer.slice(1)]) {
    const text = raw.trim();
    if (isValidSubnet(text)) subnets.add(text);
  }
  for (const ip of local) {
    const subnet = subnetOf(ip);
    if (subnet) subnets.add(subnet);
  }
  if (subnets.size === 0) {
    subnets.add("192.168.0");
    subnets.add("192.168.1");
  }
  return { local, subnets: [...subnets] };
}

export async function scanLan(options: ScanOptions = {}): Promise<LanPrinter[]> {
  const mode = options.mode ?? "quick";
  const { local, subnets } = await resolveSubnets(options.prefer ?? [], options.onStatus);
  /* 정밀 검색은 대역 하나만 훑는다(첫 번째: 직접 넣은 대역 → 이 기기 대역 순). */
  const targets = mode === "full" ? subnets.slice(0, 1) : subnets;
  const octets = mode === "full" ? Array.from({ length: 254 }, (_, index) => index + 1) : QUICK_OCTETS;
  const self = new Set(local);
  const hosts = targets.flatMap((subnet) => octets.map((n) => `${subnet}.${n}`)).filter((host) => !self.has(host));
  const where = local[0] ? tr("lan.thisDevice", { ip: local[0] }) : targets.join(", ");
  options.onStatus?.(mode === "full" ? tr("lan.full", { subnet: targets[0], where }) : tr("lan.quick", { where, n: octets.length }));
  let done = 0;
  let found = 0;
  options.onProgress?.({ done, total: hosts.length, found });
  const hits = await mapPool(
    hosts,
    mode === "full" ? 24 : 20,
    async (host) => {
      const ok = await probeIpp(host, mode === "full" ? 900 : 700, options.signal);
      done += 1;
      if (ok && !options.signal?.aborted) {
        found += 1;
        options.onFound?.({ host, port: 631, answered: true });
      }
      options.onProgress?.({ done, total: hosts.length, found });
      return ok ? host : null;
    },
    options.signal,
  );
  return hits.map((host) => ({ host, port: 631, answered: true }));
}
