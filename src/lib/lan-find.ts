const PRIVATE = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;
const OCTETS = [2, 3, 4, 10, 11, 12, 15, 16, 20, 21, 22, 25, 30, 40, 50, 51, 60, 80, 100, 101, 110, 150, 200, 254];
const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export function isValidIPv4(value: string) {
  return IPV4.test(value.trim());
}

function isPrivateIPv4(ip: string) {
  return PRIVATE.test(ip) && !ip.startsWith("127.");
}

function subnetOf(ip: string) {
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

async function probeIpp(host: string, ms = 700) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
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
  }
}

async function mapPool<T>(items: T[], limit: number, fn: (item: T) => Promise<T | null>) {
  const out: T[] = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
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

export async function discoverLanPrinters(onStatus?: (label: string) => void, prefer: string[] = []): Promise<LanPrinter[]> {
  onStatus?.("이 기기 주소를 읽는 중…");
  const local = await guessLocalIPv4s();
  const subnets = new Set<string>();
  for (const raw of prefer) {
    const text = raw.trim();
    if (/^(\d{1,3}\.){2}\d{1,3}$/.test(text)) subnets.add(text);
  }
  for (const ip of local) {
    const subnet = subnetOf(ip);
    if (subnet) subnets.add(subnet);
  }
  if (subnets.size === 0) {
    subnets.add("192.168.0");
    subnets.add("192.168.1");
  }
  const hosts = [...subnets].flatMap((subnet) => OCTETS.map((n) => `${subnet}.${n}`));
  const where = local[0] ? `이 기기 ${local[0]}` : [...subnets].join(", ");
  onStatus?.(`${where} · ${hosts.length}곳, 끝자리 ${OCTETS.length}개만 확인`);
  const hits = await mapPool(hosts, 8, async (host) => ((await probeIpp(host)) ? host : null));
  return hits.map((host) => ({ host, port: 631, answered: true }));
}
