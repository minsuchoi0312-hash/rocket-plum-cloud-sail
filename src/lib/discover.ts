export type UsbLite = {
  vendorId: number;
  productId: number;
  serialNumber?: string;
  productName?: string;
  manufacturerName?: string;
};

const VENDORS: Record<number, string> = {
  0x03f0: "HP",
  0x04a9: "Canon",
  0x04b8: "Epson",
  0x04f9: "Brother",
  0x04e8: "Samsung",
  0x0924: "Xerox",
  0x0a5f: "Zebra",
  0x04da: "Panasonic",
  0x0525: "Netchip",
  0x1a86: "QinHeng",
  0x0483: "STMicro",
  0x0416: "Winbond",
  0x0fe6: "ICS",
  0x28e9: "GigaDevice",
  0x0482: "Kyocera",
  0x05ca: "Ricoh",
  0x06bc: "OKI",
  0x043d: "Lexmark",
  0x04dd: "Sharp",
  0x132b: "Konica",
  0x0519: "Star",
  0x1504: "Bixolon",
  0x1203: "TSC",
  0x04cb: "Fujifilm",
  0x413c: "Dell",
  0x067b: "Prolific",
  0x0dd4: "Custom",
  0x08a6: "SII",
};

type UsbApi = {
  getDevices?: () => Promise<UsbLite[]>;
  requestDevice?: (options: { filters: { vendorId?: number; classCode?: number }[] }) => Promise<UsbLite>;
  addEventListener?: (type: string, listener: (event: Event) => void) => void;
  removeEventListener?: (type: string, listener: (event: Event) => void) => void;
};

function usbApi(): UsbApi | undefined {
  return (navigator as Navigator & { usb?: UsbApi }).usb;
}

function vendorName(vendorId: number, manufacturer?: string) {
  return VENDORS[vendorId] || manufacturer || "USB";
}

function labelUsb(device: UsbLite) {
  const brand = vendorName(device.vendorId, device.manufacturerName);
  const product = (device.productName || "").replace(/\s+/g, " ").trim();
  const generic = /usb printing support|printer|usb device/i.test(product);
  const query = [brand, generic ? "" : product].filter(Boolean).join(" ");
  return {
    title: generic || !product ? `${brand} USB 복사기` : product,
    query,
    subtitle: `USB · ${brand}`,
  };
}

export async function grantedUsb() {
  const usb = usbApi();
  if (!usb?.getDevices) return [];
  try {
    return await usb.getDevices();
  } catch {
    return [];
  }
}

export async function pickUsb(all = false) {
  const usb = usbApi();
  if (!usb?.requestDevice) {
    throw new Error("여기서는 USB 창이 안 열려요. 컴퓨터나 안드로이드 크롬에서 열어 주세요.");
  }
  const filters = all
    ? []
    : [{ classCode: 7 }, { classCode: 255 }, ...Object.keys(VENDORS).map((id) => ({ vendorId: Number(id) }))];
  return usb.requestDevice({ filters });
}

type UsbEndpoint = { endpointNumber: number; direction: "in" | "out"; type: string };
type UsbAlt = { alternateSetting?: number; interfaceClass: number; interfaceProtocol?: number; endpoints: UsbEndpoint[] };
type UsbIface = { interfaceNumber: number; alternates: UsbAlt[] };

type UsbSession = UsbLite & {
  opened?: boolean;
  configurations?: { configurationValue: number; interfaces: UsbIface[] }[];
  configuration?: { interfaces: UsbIface[] } | null;
  open?: () => Promise<void>;
  close?: () => Promise<void>;
  selectConfiguration?: (value: number) => Promise<void>;
  claimInterface?: (iface: number) => Promise<void>;
  releaseInterface?: (iface: number) => Promise<void>;
  selectAlternateInterface?: (iface: number, alternate: number) => Promise<void>;
  clearHalt?: (direction: "in" | "out", endpointNumber: number) => Promise<void>;
  controlTransferIn?: (
    setup: { requestType: "class"; recipient: "interface"; request: number; value: number; index: number },
    length: number,
  ) => Promise<{ data?: DataView }>;
  transferOut?: (endpoint: number, data: BufferSource) => Promise<{ status?: string; bytesWritten?: number }>;
};

type Held = UsbSession & { atlasOut?: number; atlasIface?: number };

const sessions = new Map<string, Held>();
const objectIds = new WeakMap<object, number>();
let nextObjectId = 1;

function usbKeyOf(device: UsbLite) {
  const id = `${device.vendorId.toString(16)}:${device.productId.toString(16)}`;
  const serial = (device.serialNumber || "").trim();
  if (serial) return `${id}:${serial}`;
  let token = objectIds.get(device);
  if (!token) {
    token = nextObjectId;
    nextObjectId += 1;
    objectIds.set(device, token);
  }
  return `${id}:obj${token}`;
}

function modelFromIdentity(identity: string) {
  const field = (names: string) => identity.match(new RegExp(`(?:^|[;\\n])\\s*(?:${names})\\s*:\\s*([^;\\n]+)`, "i"))?.[1]?.trim() || "";
  const mfg = field("MFG|MANUFACTURER");
  const mdl = field("MDL|MODEL");
  const cmd = field("CMD|COMMAND SET");
  const duplicated = Boolean(mfg && mdl && mdl.toLowerCase().startsWith(mfg.toLowerCase()));
  const query = duplicated ? mdl : [mfg, mdl].filter(Boolean).join(" ");
  return { mfg, mdl, cmd, query };
}

function decodeIdentity(data: DataView) {
  if (data.byteLength < 3) return "";
  const raw = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const score = (value: string) => {
    let n = 0;
    if (/MFG:|MDL:|MODEL:|MANUFACTURER:/i.test(value)) n += 5;
    if (value.includes(";")) n += 2;
    return n;
  };
  const sliceText = (length: number) => {
    const count = Math.min(raw.length - 2, Math.max(0, length - 2));
    return new TextDecoder("utf-8", { fatal: false }).decode(raw.slice(2, 2 + count));
  };
  const be = data.getUint16(0, false);
  const le = data.getUint8(0) | (data.getUint8(1) << 8);
  const options = [sliceText(be), sliceText(le), new TextDecoder("utf-8", { fatal: false }).decode(raw)];
  options.sort((a, b) => score(b) - score(a));
  return tidyIdentity(options[0] || "");
}

function tidyIdentity(value: string) {
  const text = value.replace(/\0/g, "").trim();
  const at = text.search(/MFG:|MANUFACTURER:|MDL:|MODEL:/i);
  return (at > 0 ? text.slice(at) : text).trim();
}

export function pickPrinterProtocol(candidates: { interfaceClass: number; interfaceProtocol?: number; hasOut: boolean }[]) {
  const found = candidates.filter((item) => item.interfaceClass === 7 && item.hasOut && (item.interfaceProtocol === 2 || item.interfaceProtocol === 1));
  return (found.find((item) => item.interfaceProtocol === 2) || found.find((item) => item.interfaceProtocol === 1))?.interfaceProtocol ?? null;
}

function printerChannel(interfaces: UsbIface[]) {
  const found: { iface: UsbIface; alt: UsbAlt; protocol: number }[] = [];
  for (const iface of interfaces) {
    for (const alt of iface.alternates) {
      const protocol = alt.interfaceProtocol ?? 0;
      if (alt.interfaceClass !== 7 || (protocol !== 2 && protocol !== 1)) continue;
      if (!alt.endpoints.some((endpoint) => endpoint.direction === "out")) continue;
      found.push({ iface, alt, protocol });
    }
  }
  found.sort((a, b) => a.protocol - b.protocol);
  const picked = found.find((item) => item.protocol === 2) || found.find((item) => item.protocol === 1);
  return picked || null;
}

async function readDeviceId(device: UsbSession) {
  if (!device.open || !device.claimInterface || !device.controlTransferIn) return { id: "", out: undefined as number | undefined, iface: undefined as number | undefined };
  if (!device.opened) await device.open();
  if (!device.configuration && device.selectConfiguration) {
    const value = device.configurations?.[0]?.configurationValue ?? 1;
    await device.selectConfiguration(value);
  }
  const picked = printerChannel(device.configuration?.interfaces || []);
  if (!picked) {
    try {
      if (device.opened && device.close) await device.close();
    } catch {
      /* already closed */
    }
    return { id: "", out: undefined, iface: undefined };
  }
  const iface = picked.iface;
  const alt = picked.alt;
  try {
    await device.claimInterface(iface.interfaceNumber);
  } catch {
    try {
      if (device.opened && device.close) await device.close();
    } catch {
      /* already closed */
    }
    throw new Error("다른 앱이나 OS 드라이버가 USB를 사용 중이라 이 앱에서 바로 보낼 수 없어요.");
  }
  const setting = alt.alternateSetting ?? 0;
  if (device.selectAlternateInterface && setting !== 0) {
    try {
      await device.selectAlternateInterface(iface.interfaceNumber, setting);
    } catch {
      /* 지금 설정 그대로 사용 */
    }
  }
  const out =
    alt.endpoints.find((endpoint) => endpoint.direction === "out" && (endpoint.type === "bulk" || endpoint.type === "interrupt")) ||
    alt.endpoints.find((endpoint) => endpoint.direction === "out");
  let id = "";
  const indexes = [(iface.interfaceNumber << 8) | (setting & 0xff), iface.interfaceNumber];
  for (const index of indexes) {
    try {
      const result = await device.controlTransferIn(
        { requestType: "class", recipient: "interface", request: 0, value: 0, index },
        1024,
      );
      if (result?.data) {
        const text = decodeIdentity(result.data);
        if (text) {
          id = text;
          break;
        }
      }
    } catch {
      /* 다른 wIndex로 다시 */
    }
  }
  return { id, out: out?.endpointNumber, iface: iface.interfaceNumber };
}

export type LinkedUsb = {
  title: string;
  query: string;
  cmd: string;
  subtitle: string;
  usbKey: string;
  live: boolean;
};

export async function identifyUsb(device: UsbLite): Promise<LinkedUsb> {
  const label = labelUsb(device);
  const key = usbKeyOf(device);
  const session = device as UsbSession;
  try {
    const read = await readDeviceId(session);
    const held = session as Held;
    held.atlasOut = read.out;
    held.atlasIface = read.iface;
    if (read.out != null) sessions.set(key, held);
    const identity = read.id;
    const parsed = modelFromIdentity(identity);
    const title = parsed.mdl ? parsed.query : label.title;
    return {
      title,
      query: parsed.query || label.query,
      cmd: parsed.cmd,
      subtitle: identity ? "USB로 연결됨" : read.out != null ? "USB로 연결됨" : label.subtitle,
      usbKey: key,
      live: read.out != null,
    };
  } catch (error) {
    try {
      if (session.opened && session.close) await session.close();
    } catch {
      /* already closed */
    }
    sessions.delete(key);
    if (error instanceof Error && error.message.includes("USB를 사용 중")) throw error;
    return {
      title: label.title,
      query: label.query,
      cmd: "",
      subtitle: label.subtitle,
      usbKey: key,
      live: false,
    };
  }
}

export async function dropUsbSession(usbKey: string) {
  const device = sessions.get(usbKey);
  sessions.delete(usbKey);
  if (!device) return;
  try {
    if (device.clearHalt && device.atlasOut != null) await device.clearHalt("out", device.atlasOut);
  } catch {
    /* halt already clear */
  }
  try {
    if (device.releaseInterface && device.atlasIface != null) await device.releaseInterface(device.atlasIface);
  } catch {
    /* interface already free */
  }
  try {
    await device.close?.();
  } catch {
    /* already closed */
  }
}

export function watchUsbDisconnect(onKey: (usbKey: string) => void) {
  const usb = usbApi();
  if (!usb?.addEventListener || !usb.removeEventListener) return () => undefined;
  const listener = (event: Event) => {
    const device = (event as Event & { device?: UsbLite }).device;
    if (!device) return;
    const key = usbKeyOf(device);
    void dropUsbSession(key);
    onKey(key);
  };
  usb.addEventListener("disconnect", listener);
  return () => usb.removeEventListener?.("disconnect", listener);
}

export function watchUsbConnect(onDevice: (device: UsbLite) => void) {
  const usb = usbApi();
  if (!usb?.addEventListener || !usb.removeEventListener) return () => undefined;
  const listener = (event: Event) => {
    const device = (event as Event & { device?: UsbLite }).device;
    if (device) onDevice(device);
  };
  usb.addEventListener("connect", listener);
  return () => usb.removeEventListener?.("connect", listener);
}

async function transferChunk(device: Held, endpoint: number, bytes: Uint8Array) {
  let view = bytes;
  let stalls = 0;
  while (view.byteLength) {
    const slice = view;
    const payload = new ArrayBuffer(slice.byteLength);
    new Uint8Array(payload).set(slice);
    let result: { status?: string; bytesWritten?: number };
    try {
      result = await Promise.race([
        device.transferOut!(endpoint, payload),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("복사기가 15초 안에 받지 않았어요. 용지가 없거나 걸린 것 같아요.")), 15000);
        }),
      ]);
    } catch (error) {
      await dropUsbSession(usbKeyOf(device));
      throw error instanceof Error ? error : new Error("복사기가 15초 안에 받지 않았어요. 용지가 없거나 걸린 것 같아요.");
    }
    if (result?.status === "stall") {
      stalls += 1;
      if (stalls > 3 || !device.clearHalt) {
        await dropUsbSession(usbKeyOf(device));
        throw new Error("복사기가 데이터를 거절했어요. USB 연결을 닫았어요.");
      }
      try {
        await device.clearHalt("out", endpoint);
      } catch {
        await dropUsbSession(usbKeyOf(device));
        throw new Error("복사기가 데이터를 거절했어요. USB 연결을 닫았어요.");
      }
      continue;
    }
    if (result?.status && result.status !== "ok") {
      await dropUsbSession(usbKeyOf(device));
      throw new Error("프린터가 데이터를 거절했어요. USB 연결을 닫았어요.");
    }
    const wrote = typeof result?.bytesWritten === "number" ? result.bytesWritten : slice.byteLength;
    if (wrote <= 0) {
      await dropUsbSession(usbKeyOf(device));
      throw new Error("프린터가 데이터를 거절했어요. USB 연결을 닫았어요.");
    }
    view = view.subarray(Math.min(wrote, view.byteLength));
    stalls = 0;
  }
}

export async function sendUsbBytes(
  usbKey: string,
  bytes: Uint8Array,
  onProgress?: (percent: number) => void,
  shouldStop?: () => boolean,
  atomic = false,
) {
  const device = sessions.get(usbKey);
  if (!device?.transferOut || device.atlasOut == null) {
    throw new Error("USB로 바로 넣지는 못해요. 선을 다시 확인한 뒤 이 화면에서 다시 눌러 주세요.");
  }
  const total = Math.max(1, bytes.length);
  let sent = 0;
  const pieces = atomic || bytes.length <= 4096 ? [bytes] : Array.from({ length: Math.ceil(bytes.length / 4096) }, (_, index) => bytes.subarray(index * 4096, Math.min(bytes.length, (index + 1) * 4096)));
  for (const piece of pieces) {
    if (shouldStop?.()) throw new Error("보내기를 멈췄어요.");
    await transferChunk(device, device.atlasOut, piece);
    sent += piece.byteLength;
    onProgress?.(Math.min(100, Math.round((sent / total) * 100)));
  }
}

