#!/usr/bin/env node
// 누구나프린트 PC 도우미 — 브라우저가 못 여는 9100(Raw) 포트를 대신 열어 줍니다.
// 실행: node raw-print-helper.mjs   (Node 18 이상, 설치할 것 없음)
// 이 PC의 모든 주소에서 듣고, 같은 망(사설 IP)의 9100~9102 포트로만 보냅니다.
// 연결 코드가 없으면 인쇄·검색 요청은 거절합니다.
// GET /info     : 이 PC의 추천 접속 주소와 감지된 실제 LAN 대역(가상 어댑터 제외)
// GET /discover : 실제 대역 .1~.254의 9100/631 포트 스캔 + mDNS(_pdl-datastream/_ipp) 병렬 탐색,
//                 모델명은 IPP → mDNS TXT → PJL INFO ID → 웹(80) <title> 순으로 채웁니다. 사설 대역만.
// GET /probe?ip=…: 한 대의 9100 응답 여부와 지연시간(ms)
// GET /status?ip=…: 읽기 전용 상태 조회(인쇄 데이터 없음) — IPP 상태·토너·지원 기능 + PJL INFO STATUS/CONFIG + 웹 관리(80)
// 실행 시 폰에서 바로 여는 연결 링크와 터미널 QR을 함께 보여 줍니다 (APP_URL 또는 --app=주소).
import http from "node:http";
import dgram from "node:dgram";
import net from "node:net";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_PORT = 47631;
/** /print 최대 수신 용량: 고해상도 50쪽 PCL5e/PDF도 넉넉히 담는 120MB. 넘으면 413 JSON */
export const MAX_BYTES = 120 * 1024 * 1024;
/** 복사기 9100 전송: 64KB씩 나눠 쓰고, 버퍼가 차면 drain을 기다린다. 60초 동안 진척이 없으면 끊는다 */
const WRITE_CHUNK = 64 * 1024;
const SOCKET_IDLE_MS = 60_000;

export const CONFIG_FILE_NAME = ".nuguna-print-helper.json";
const LEGACY_CODE_FILE = ".nuguna-print-helper-code";

/**
 * 연결 코드를 정한다 — 홈 폴더의 ~/.nuguna-print-helper.json에 저장해 재부팅 후에도 같은 코드를 쓴다
 * (복사기에 붙여 둔 QR 안내 카드가 계속 작동).
 * 우선순위: --code=123456 (또는 HELPER_CODE) → 저장된 코드 → 옛 코드 파일 이전 → 새로 발급.
 * --new-code 를 주면 저장된 코드를 버리고 새로 발급한다.
 */
export function resolveCode({ argv = process.argv, env = process.env, home = os.homedir() } = {}) {
  const file = path.join(home, CONFIG_FILE_NAME);
  let config = {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (parsed && typeof parsed === "object") config = parsed;
  } catch {
    /* 아직 없음 */
  }
  const manual = (argv.find((arg) => arg.startsWith("--code="))?.slice(7) || env.HELPER_CODE || "").trim();
  const fresh = argv.includes("--new-code");
  let code = "";
  let source = "";
  if (manual) {
    if (!/^\d{6}$/.test(manual)) throw new Error("--code 는 숫자 6자리로 넣어 주세요. 예: --code=123456");
    code = manual;
    source = "manual";
  } else if (!fresh && /^\d{6}$/.test(String(config.code || ""))) {
    code = String(config.code);
    source = "saved";
  } else {
    if (!fresh) {
      try {
        const old = fs.readFileSync(path.join(home, LEGACY_CODE_FILE), "utf8").trim();
        if (/^\d{6}$/.test(old)) {
          code = old;
          source = "migrated";
        }
      } catch {
        /* 옛 파일 없음 */
      }
    }
    if (!code) {
      let next = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
      while (fresh && next === config.code) next = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
      code = next;
      source = fresh ? "new" : "created";
    }
  }
  let saved = true;
  try {
    fs.writeFileSync(file, `${JSON.stringify({ ...config, code, updatedAt: new Date().toISOString() }, null, 2)}\n`, { mode: 0o600 });
  } catch {
    saved = false; /* 저장 못 해도 이번 실행에는 쓸 수 있다 */
  }
  return { code, source, file, saved };
}

/** (예전 호환) 연결 코드 파일 경로를 받아 6자리 코드를 돌려준다 */
export function loadCode(file = path.join(os.homedir(), LEGACY_CODE_FILE)) {
  try {
    const saved = fs.readFileSync(file, "utf8").trim();
    if (/^\d{6}$/.test(saved)) return saved;
  } catch {
    /* 아직 없음 */
  }
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  try {
    fs.writeFileSync(file, `${code}\n`, { mode: 0o600 });
  } catch {
    /* 저장 못 해도 이번 실행에는 쓸 수 있다 */
  }
  return code;
}

function sameCode(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const IPV4_STRICT = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

/**
 * 인쇄·상태 조회 대상 검증: 점 네 개짜리 IPv4 숫자만 받고, 사설 대역(10/8, 172.16/12, 192.168/16, 169.254/16)만 허용.
 * 호스트 이름(예: 10.evil.com, x.local), IPv6(::ffff:…), 0.0.0.0, 네트워크 주소(.0)·브로드캐스트(.255), 공인 IP는 모두 거절.
 * 루프백 127.0.0.1은 테스트용 allowLoopback일 때만.
 */
export function isPrivateHost(host, allowLoopback = false) {
  const text = String(host ?? "");
  if (allowLoopback && text === "127.0.0.1") return true;
  if (!IPV4_STRICT.test(text)) return false;
  const [a, b, , d] = text.split(".").map(Number);
  if (d === 0 || d === 255) return false;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

/** 큰 데이터를 백프레셔(drain)를 지키며 보내고 끝(FIN)까지 확인한다 */
export function writeAll(socket, buf, chunkSize = WRITE_CHUNK, idleMs = SOCKET_IDLE_MS) {
  return new Promise((resolve, reject) => {
    let offset = 0;
    let done = false;
    const finish = (err) => {
      if (done) return;
      done = true;
      socket.setTimeout(0);
      socket.off("drain", pump);
      if (err) {
        socket.destroy();
        reject(err);
      } else resolve(offset);
    };
    socket.setTimeout(idleMs, () => finish(new Error("printer did not accept data (timeout)")));
    socket.once("error", finish);
    socket.once("close", () => (offset >= buf.length ? finish() : finish(new Error("printer closed the connection early"))));
    function pump() {
      while (offset < buf.length) {
        const end = Math.min(offset + chunkSize, buf.length);
        const ok = socket.write(buf.subarray(offset, end));
        offset = end;
        if (!ok) {
          socket.once("drain", pump);
          return;
        }
      }
      socket.end(() => finish());
    }
    pump();
  });
}

function connect(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("timeout"));
    }, timeoutMs);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

class TooLarge extends Error {
  constructor() {
    super("payload too large");
    this.status = 413;
  }
}

function readBody(req, limit = MAX_BYTES) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] ?? 0);
    if (declared > limit) return reject(new TooLarge());
    const chunks = [];
    let size = 0;
    let over = false;
    req.on("data", (c) => {
      if (over) return;
      size += c.length;
      if (size > limit) {
        over = true;
        chunks.length = 0;
        reject(new TooLarge());
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!over) resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

/** 이 PC의 사설 IPv4와 /24 대역 */
/** WSL·Docker·Hyper-V·VPN·가상머신·루프백 같은 가상 어댑터 이름 */
const VIRTUAL_IFACE = /^(lo|docker|br-|veth|virbr|vmnet|vboxnet|zt|tailscale|utun|tun|tap|wg|ham|isatap|teredo|llw|awdl|anpi|bridge)|vEthernet|WSL|Hyper-V|VirtualBox|VMware|Loopback|Pseudo|Bluetooth|Npcap|ZeroTier|Tailscale|Hamachi|OpenVPN|WireGuard/i;
/** 실제 랜/와이파이 어댑터일 가능성이 높은 이름 (우선순위용) */
const REAL_IFACE = /^(en|eth|wlan|wl|wi-?fi|wlp|enp|eno|ens)|Wi-?Fi|Ethernet|이더넷|무선/i;

/**
 * 가상 어댑터를 뺀 실제 사설 IPv4 목록. 실제(와이파이·이더넷) 이름이 앞에 온다.
 * ifaces 인자는 테스트용(기본: os.networkInterfaces()).
 */
export function realInterfaces(ifaces = os.networkInterfaces()) {
  const out = [];
  for (const [name, list] of Object.entries(ifaces)) {
    if (VIRTUAL_IFACE.test(name)) continue;
    for (const item of list ?? []) {
      if (item.family !== "IPv4" && item.family !== 4) continue;
      if (item.internal || !isPrivateHost(item.address)) continue;
      if (item.address.startsWith("169.254.")) continue;
      /* Docker 기본 브리지(172.17.x)는 이름이 바뀌어도 거른다 */
      if (/^172\.17\./.test(item.address)) continue;
      out.push({ iface: name, address: item.address, subnet: item.address.split(".").slice(0, 3).join("."), real: REAL_IFACE.test(name) });
    }
  }
  return out.sort((a, b) => Number(b.real) - Number(a.real));
}

export function localSubnets(ifaces) {
  const out = [];
  for (const row of realInterfaces(ifaces)) {
    if (!out.some((item) => item.subnet === row.subnet)) out.push({ subnet: row.subnet, self: row.address, iface: row.iface });
  }
  return out;
}

async function portOpen(host, port, timeoutMs) {
  const socket = await connect(host, port, timeoutMs).catch(() => null);
  socket?.destroy();
  return Boolean(socket);
}

async function poolMap(items, limit, fn) {
  const out = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const item = items[index++];
      const value = await fn(item);
      if (value) out.push(value);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function ippAttrRequest(host) {
  const attr = (tag, name, value) => {
    const n = Buffer.from(name);
    const v = Buffer.from(value);
    const b = Buffer.alloc(1 + 2 + n.length + 2 + v.length);
    let o = b.writeUInt8(tag, 0);
    o = b.writeUInt16BE(n.length, o);
    o += n.copy(b, o);
    o = b.writeUInt16BE(v.length, o);
    v.copy(b, o);
    return b;
  };
  return Buffer.concat([
    Buffer.from([0x01, 0x01, 0x00, 0x0b, 0x00, 0x00, 0x00, 0x01, 0x01]),
    attr(0x47, "attributes-charset", "utf-8"),
    attr(0x48, "attributes-natural-language", "en"),
    attr(0x45, "printer-uri", `ipp://${host}:631/ipp/print`),
    attr(0x44, "requested-attributes", "printer-make-and-model"),
    Buffer.from([0x03]),
  ]);
}

/** 인쇄하지 않는 조회: IPP Get-Printer-Attributes 로 printer-make-and-model 읽기 */
export function ippModel(host, timeoutMs = 1500, pathName = "/ipp/print") {
  return new Promise((resolve) => {
    const body = ippAttrRequest(host);
    const req = http.request({ host, port: 631, path: pathName, method: "POST", timeout: timeoutMs, headers: { "Content-Type": "application/ipp", "Content-Length": body.length } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        const name = Buffer.from("printer-make-and-model");
        const at = buf.indexOf(name);
        if (at < 0 || at + name.length + 2 > buf.length) return resolve("");
        const len = buf.readUInt16BE(at + name.length);
        resolve(buf.subarray(at + name.length + 2, at + name.length + 2 + len).toString("utf8").trim());
      });
      res.on("error", () => resolve(""));
    });
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(""));
    req.end(body);
  });
}

/** PJL INFO ID: 9100으로 모델명만 묻는다(인쇄 데이터 없음, UEL로 열고 닫음) */
export function pjlModel(host, timeoutMs = 1800) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: 9100 });
    let text = "";
    const done = (value) => {
      clearTimeout(timer);
      socket.destroy();
      resolve(value);
    };
    const timer = setTimeout(() => done(parsePjlId(text)), timeoutMs);
    socket.once("connect", () => socket.write("\x1b%-12345X@PJL\r\n@PJL INFO ID\r\n\x1b%-12345X"));
    socket.on("data", (c) => {
      text += c.toString("latin1");
      if (text.includes("\f") || /INFO ID[\s\S]*\r?\n[^\r\n]+\r?\n/.test(text)) done(parsePjlId(text));
    });
    socket.once("error", () => done(""));
  });
}

export function parsePjlId(text) {
  const at = text.indexOf("INFO ID");
  if (at < 0) return "";
  const line = text.slice(at + 7).split(/\r?\n/).map((row) => row.trim()).find((row) => row && row !== "\f");
  return (line ?? "").replace(/^"|"$/g, "").replace(/\f/g, "").trim().slice(0, 80);
}

/** 같은 대역을 훑어 실제 네트워크 프린터를 찾는다 */
/* ───────── mDNS (순수 dgram, RFC 6762 원샷 질의) ───────── */
export const MDNS_SERVICES = ["_pdl-datastream._tcp.local", "_ipp._tcp.local"];
const DNS_TYPE = { A: 1, PTR: 12, TXT: 16, AAAA: 28, SRV: 33 };

function encodeName(name) {
  const parts = name.replace(/\.$/, "").split(".");
  const bufs = parts.map((label) => {
    const b = Buffer.from(label, "utf8");
    return Buffer.concat([Buffer.from([b.length]), b]);
  });
  return Buffer.concat([...bufs, Buffer.from([0])]);
}

/** PTR 질의 패킷 (QU 비트: 응답을 우리 포트로 직접 받기) */
export function buildMdnsQuery(names = MDNS_SERVICES, id = 0) {
  const head = Buffer.alloc(12);
  head.writeUInt16BE(id, 0);
  head.writeUInt16BE(names.length, 4);
  const qs = names.map((name) => Buffer.concat([encodeName(name), Buffer.from([0x00, DNS_TYPE.PTR, 0x80, 0x01])]));
  return Buffer.concat([head, ...qs]);
}

function readName(buf, offset) {
  const labels = [];
  let pos = offset;
  let jumped = false;
  let end = offset;
  for (let guard = 0; guard < 128; guard++) {
    if (pos >= buf.length) throw new Error("dns name overflow");
    const len = buf[pos];
    if (len === 0) {
      if (!jumped) end = pos + 1;
      return { name: labels.join("."), end };
    }
    if ((len & 0xc0) === 0xc0) {
      if (pos + 1 >= buf.length) throw new Error("dns pointer overflow");
      if (!jumped) end = pos + 2;
      pos = ((len & 0x3f) << 8) | buf[pos + 1];
      jumped = true;
      continue;
    }
    labels.push(buf.subarray(pos + 1, pos + 1 + len).toString("utf8"));
    pos += 1 + len;
  }
  throw new Error("dns name loop");
}

/** DNS 메시지 파서: 질문 + 답/권한/추가 레코드(PTR·SRV·TXT·A) */
export function parseDnsMessage(buf) {
  if (buf.length < 12) throw new Error("dns too short");
  const id = buf.readUInt16BE(0);
  const flags = buf.readUInt16BE(2);
  const qd = buf.readUInt16BE(4);
  const total = buf.readUInt16BE(6) + buf.readUInt16BE(8) + buf.readUInt16BE(10);
  let pos = 12;
  const questions = [];
  for (let i = 0; i < qd; i++) {
    const { name, end } = readName(buf, pos);
    questions.push({ name, type: buf.readUInt16BE(end) });
    pos = end + 4;
  }
  const records = [];
  for (let i = 0; i < total; i++) {
    const { name, end } = readName(buf, pos);
    const type = buf.readUInt16BE(end);
    const ttl = buf.readUInt32BE(end + 4);
    const rdlen = buf.readUInt16BE(end + 8);
    const rd = end + 10;
    if (rd + rdlen > buf.length) throw new Error("dns rdata overflow");
    let data = null;
    if (type === DNS_TYPE.PTR) data = readName(buf, rd).name;
    else if (type === DNS_TYPE.SRV) data = { priority: buf.readUInt16BE(rd), weight: buf.readUInt16BE(rd + 2), port: buf.readUInt16BE(rd + 4), target: readName(buf, rd + 6).name };
    else if (type === DNS_TYPE.A && rdlen === 4) data = `${buf[rd]}.${buf[rd + 1]}.${buf[rd + 2]}.${buf[rd + 3]}`;
    else if (type === DNS_TYPE.TXT) {
      const txt = {};
      for (let p2 = rd; p2 < rd + rdlen; ) {
        const len = buf[p2];
        const entry = buf.subarray(p2 + 1, p2 + 1 + len).toString("utf8");
        const eq = entry.indexOf("=");
        if (entry) txt[(eq < 0 ? entry : entry.slice(0, eq)).toLowerCase()] = eq < 0 ? "" : entry.slice(eq + 1);
        p2 += 1 + len;
      }
      data = txt;
    }
    records.push({ name, type, ttl, data });
    pos = rd + rdlen;
  }
  return { id, flags, questions, records };
}

/** 여러 응답 메시지를 프린터 목록으로 합친다. from: 응답을 보낸 주소(A 레코드가 없을 때 대신 씀) */
export function mdnsPrinters(messages) {
  const srv = new Map();
  const txt = new Map();
  const addr = new Map();
  const instances = [];
  for (const { message, from } of messages) {
    for (const r of message.records) {
      const key = r.name.toLowerCase();
      if (r.type === DNS_TYPE.PTR && MDNS_SERVICES.some((svc) => key === svc.toLowerCase())) instances.push({ instance: r.data, service: key, from });
      else if (r.type === DNS_TYPE.SRV) srv.set(key, r.data);
      else if (r.type === DNS_TYPE.TXT) txt.set(key, { ...(txt.get(key) || {}), ...r.data });
      else if (r.type === DNS_TYPE.A) addr.set(key, r.data);
    }
  }
  const byHost = new Map();
  for (const { instance, service, from } of instances) {
    const key = String(instance).toLowerCase();
    const s = srv.get(key);
    const t = txt.get(key) || {};
    const host = (s && addr.get(String(s.target).toLowerCase())) || from || "";
    if (!host || !isPrivateHost(host)) continue;
    const model = (t.ty || t.product || "").replace(/^\(|\)$/g, "").trim() || String(instance).split("._")[0];
    const prev = byHost.get(host) || { host, model: "", name: "", pdl: false, ipp: false, port9100: 0 };
    if (!prev.model || t.ty) prev.model = model;
    prev.name = prev.name || String(instance).split("._")[0];
    if (service.startsWith("_pdl-datastream")) {
      prev.pdl = true;
      prev.port9100 = s?.port || 9100;
    } else prev.ipp = true;
    byHost.set(host, prev);
  }
  return [...byHost.values()];
}

/** 실제 어댑터마다 소켓을 열어 timeoutMs 동안 응답을 모은다 */
export function mdnsDiscover(timeoutMs = 1500, ifaces) {
  const locals = realInterfaces(ifaces);
  const binds = locals.length ? locals.map((row) => row.address) : [undefined];
  return new Promise((resolve) => {
    const messages = [];
    const sockets = [];
    for (const address of binds) {
      try {
        const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
        sockets.push(sock);
        sock.on("error", () => sock.close());
        sock.on("message", (msg, rinfo) => {
          try {
            const message = parseDnsMessage(msg);
            if (message.flags & 0x8000) messages.push({ message, from: rinfo.address });
          } catch {
            /* 다른 mDNS 잡음 */
          }
        });
        sock.bind({ port: 0, address }, () => {
          try {
            if (address) sock.setMulticastInterface(address);
            const q = buildMdnsQuery();
            sock.send(q, 5353, "224.0.0.251");
            setTimeout(() => sock.send(q, 5353, "224.0.0.251", () => undefined), 400);
          } catch {
            /* 멀티캐스트가 막힌 망 */
          }
        });
      } catch {
        /* 소켓 실패: 포트 스캔만 쓴다 */
      }
    }
    setTimeout(() => {
      for (const sock of sockets) {
        try {
          sock.close();
        } catch {
          /* ignore */
        }
      }
      resolve(mdnsPrinters(messages));
    }, timeoutMs);
  });
}

/** 마지막 보조 수단: 프린터 내장 웹페이지 <title> (500ms 제한) */
export function httpTitle(host, timeoutMs = 500, port = 80) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      req.destroy();
      finish("");
    }, timeoutMs);
    const req = http.get({ host, port, path: "/", timeout: timeoutMs }, (res) => {
      let html = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        html += chunk;
        const hit = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (hit || html.length > 65536) {
          req.destroy();
          finish(cleanTitle(hit?.[1] || ""));
        }
      });
      res.on("end", () => finish(cleanTitle(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "")));
      res.on("error", () => finish(""));
    });
    req.on("error", () => finish(""));
  });
}

function cleanTitle(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** 한 대의 포트 응답과 지연시간 */
export async function probeHost(host, port = 9100, timeoutMs = 800) {
  const started = Date.now();
  const socket = await connect(host, port, timeoutMs).catch(() => null);
  socket?.destroy();
  return { open: Boolean(socket), ms: socket ? Date.now() - started : null };
}

/** 실제 대역 포트 스캔 + mDNS를 병렬로 돌려 IP 기준으로 합친다 */
export async function discoverPrinters(subnet, opts = {}) {
  const started = Date.now();
  const targets = subnet ? [{ subnet, self: "" }] : localSubnets(opts.ifaces);
  const hosts = targets.flatMap(({ subnet: net24, self }) => Array.from({ length: 254 }, (_, i) => `${net24}.${i + 1}`).filter((h) => h !== self));
  const [open, viaMdns] = await Promise.all([
    poolMap(hosts, opts.concurrency ?? 64, async (host) => {
      const [raw9100, ipp] = await Promise.all([portOpen(host, 9100, opts.timeoutMs ?? 400), portOpen(host, 631, opts.timeoutMs ?? 400)]);
      return raw9100 || ipp ? { host, raw9100, ipp } : null;
    }),
    opts.mdns === false ? Promise.resolve([]) : (opts.mdnsDiscover ?? mdnsDiscover)(opts.mdnsMs ?? 1500, opts.ifaces).catch(() => []),
  ]);
  const merged = new Map(open.map((row) => [row.host, { ...row, mdns: false, mdnsModel: "" }]));
  for (const m of viaMdns) {
    const prev = merged.get(m.host) || { host: m.host, raw9100: false, ipp: false, mdns: false, mdnsModel: "" };
    prev.mdns = true;
    prev.mdnsModel = m.model;
    prev.ipp = prev.ipp || m.ipp;
    if (m.pdl && !prev.raw9100) prev.raw9100 = (await portOpen(m.host, m.port9100 || 9100, 600)) || prev.raw9100;
    merged.set(m.host, prev);
  }
  const printers = await poolMap([...merged.values()], 8, async (row) => {
    let model = "";
    let via = null;
    if (row.ipp) {
      model = (await ippModel(row.host)) || (await ippModel(row.host, 1500, "/ipp"));
      if (model) via = "ipp";
    }
    if (!model && row.mdnsModel) {
      model = row.mdnsModel;
      via = "mdns";
    }
    if (!model && row.raw9100 && opts.pjl !== false) {
      model = await pjlModel(row.host);
      if (model) via = "pjl";
    }
    if (!model && opts.http !== false) {
      model = await (opts.httpTitle ?? httpTitle)(row.host, 500);
      if (model) via = "http";
    }
    return { host: row.host, raw9100: row.raw9100, ipp: row.ipp, mdns: row.mdns, model, via };
  });
  printers.sort((a, b) => a.host.localeCompare(b.host, "en", { numeric: true }));
  return { subnets: targets.map((t) => t.subnet), printers, ms: Date.now() - started, mdns: viaMdns.length };
}

/** 이 PC로 접속하는 추천 주소 */
export function helperInfo(port = DEFAULT_PORT, ifaces) {
  const rows = realInterfaces(ifaces);
  const addresses = rows.map((row) => ({ iface: row.iface, address: row.address, url: `http://${row.address}:${port}` }));
  return {
    name: "nuguna-print-helper",
    version: 4,
    port,
    recommended: addresses[0]?.url || `http://127.0.0.1:${port}`,
    addresses,
    subnets: [...new Set(rows.map((row) => row.subnet))],
  };
}

/* ───────── 터미널 QR (웹 앱 src/lib/qr-svg.ts와 같은 인코더) ───────── */
// <qr-core-js>
// (자동 생성: src/lib/qr-svg.ts 의 qr-core를 JS로 옮긴 것)
const ECL_ORDINAL = { L: 0, M: 1, Q: 2, H: 3 };
const ECL_FORMAT = { L: 1, M: 0, Q: 3, H: 2 };
const ECC_PER_BLOCK = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
];
const NUM_BLOCKS = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
];
function rawDataModules(ver) {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}
function dataCodewords(ver, ecl) {
  const o = ECL_ORDINAL[ecl];
  return Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[o][ver] * NUM_BLOCKS[o][ver];
}
function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = z << 1 ^ (z >>> 7) * 285;
    z ^= (y >>> i & 1) * x;
  }
  return z & 255;
}
function rsDivisor(degree) {
  const result = [];
  for (let i = 0; i < degree - 1; i++) result.push(0);
  result.push(1);
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 2);
  }
  return result;
}
function rsRemainder(data, divisor) {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= gfMul(coef, factor);
    });
  }
  return result;
}
function alignmentPositions(ver, size) {
  if (ver === 1) return [];
  const numAlign = Math.floor(ver / 7) + 2;
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}
function bit(value, i) {
  return (value >>> i & 1) !== 0;
}
export function qrMatrix(text, ecl = "M") {
  const bytes = Array.from(new TextEncoder().encode(text));
  let ver = 1;
  for (; ver <= 40; ver++) {
    const ccBits2 = ver <= 9 ? 8 : 16;
    if (4 + ccBits2 + bytes.length * 8 <= dataCodewords(ver, ecl) * 8) break;
  }
  if (ver > 40) throw new Error("QR\uC5D0 \uB2F4\uAE30\uC5D0\uB294 \uAE00\uC790\uAC00 \uB108\uBB34 \uAE38\uC5B4\uC694.");
  const ccBits = ver <= 9 ? 8 : 16;
  const capacity = dataCodewords(ver, ecl) * 8;
  const bits = [];
  const push = (value, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push(value >>> i & 1);
  };
  push(4, 4);
  push(bytes.length, ccBits);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - bits.length % 8) % 8);
  for (let pad = 236; bits.length < capacity; pad ^= 236 ^ 17) push(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = v << 1 | bits[i + j];
    data.push(v);
  }
  const o = ECL_ORDINAL[ecl];
  const numBlocks = NUM_BLOCKS[o][ver];
  const blockEcc = ECC_PER_BLOCK[o][ver];
  const rawCodewords = Math.floor(rawDataModules(ver) / 8);
  const numShort = numBlocks - rawCodewords % numBlocks;
  const shortLen = Math.floor(rawCodewords / numBlocks);
  const divisor = rsDivisor(blockEcc);
  const blocks = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortLen - blockEcc + (i < numShort ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, divisor);
    if (i < numShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const codewords = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortLen - blockEcc || j >= numShort) codewords.push(block[i]);
    });
  }
  const size = ver * 4 + 17;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const isFn = Array.from({ length: size }, () => Array(size).fill(false));
  const setFn = (x, y, dark) => {
    modules[y][x] = dark;
    isFn[y][x] = true;
  };
  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }
  const finder = (x, y) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) setFn(xx, yy, dist !== 2 && dist !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  const align = alignmentPositions(ver, size);
  const last = align.length - 1;
  align.forEach((ay, i) => {
    align.forEach((ax, j) => {
      if (i === 0 && j === 0 || i === 0 && j === last || i === last && j === 0) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setFn(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    });
  });
  const drawFormat = (mask) => {
    const fdata = ECL_FORMAT[ecl] << 3 | mask;
    let rem = fdata;
    for (let i = 0; i < 10; i++) rem = rem << 1 ^ (rem >>> 9) * 1335;
    const fb = (fdata << 10 | rem) ^ 21522;
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(fb, i));
    setFn(8, 7, bit(fb, 6));
    setFn(8, 8, bit(fb, 7));
    setFn(7, 8, bit(fb, 8));
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(fb, i));
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(fb, i));
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(fb, i));
    setFn(8, size - 8, true);
  };
  drawFormat(0);
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = rem << 1 ^ (rem >>> 11) * 7973;
    const vb = ver << 12 | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + i % 3;
      const b = Math.floor(i / 3);
      setFn(a, b, bit(vb, i));
      setFn(b, a, bit(vb, i));
    }
  }
  let idx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = (right + 1 & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFn[y][x] && idx < codewords.length * 8) {
          modules[y][x] = bit(codewords[idx >>> 3], 7 - (idx & 7));
          idx++;
        }
      }
    }
  }
  const maskHit = (mask, x, y) => {
    switch (mask) {
      case 0:
        return (x + y) % 2 === 0;
      case 1:
        return y % 2 === 0;
      case 2:
        return x % 3 === 0;
      case 3:
        return (x + y) % 3 === 0;
      case 4:
        return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5:
        return x * y % 2 + x * y % 3 === 0;
      case 6:
        return (x * y % 2 + x * y % 3) % 2 === 0;
      default:
        return ((x + y) % 2 + x * y % 3) % 2 === 0;
    }
  };
  const applyMask = (mask) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!isFn[y][x] && maskHit(mask, x, y)) modules[y][x] = !modules[y][x];
  };
  const penalty = () => {
    let score = 0;
    const lineScore = (get) => {
      let run = 1;
      let s = 0;
      for (let i = 1; i <= size; i++) {
        if (i < size && get(i) === get(i - 1)) run++;
        else {
          if (run >= 5) s += 3 + (run - 5);
          run = 1;
        }
      }
      for (let i = 0; i + 6 < size; i++) {
        if (get(i) && !get(i + 1) && get(i + 2) && get(i + 3) && get(i + 4) && !get(i + 5) && get(i + 6)) {
          const before = i >= 4 && !get(i - 1) && !get(i - 2) && !get(i - 3) && !get(i - 4);
          const after = i + 10 < size && !get(i + 7) && !get(i + 8) && !get(i + 9) && !get(i + 10);
          if (before || after) s += 40;
        }
      }
      return s;
    };
    for (let y = 0; y < size; y++) score += lineScore((x) => modules[y][x]);
    for (let x = 0; x < size; x++) score += lineScore((y) => modules[y][x]);
    let dark = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (modules[y][x]) dark++;
        if (x + 1 < size && y + 1 < size) {
          const c = modules[y][x];
          if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
        }
      }
    }
    const total = size * size;
    score += Math.max(0, Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return score;
  };
  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(mask);
    drawFormat(mask);
    const s = penalty();
    if (s < bestScore) {
      bestScore = s;
      best = mask;
    }
    applyMask(mask);
  }
  applyMask(best);
  drawFormat(best);
  return modules;
}
// </qr-core-js>

/** 어두운 터미널 기준: 밝은 칸=█, 어두운 칸=공백 (invert=true면 반대) */
export function terminalQr(text, invert = false) {
  const m = qrMatrix(text, "M");
  const pad = 2;
  const n = m.length + pad * 2;
  const dark = (x, y) => x >= pad && y >= pad && x < n - pad && y < n - pad && m[y - pad][x - pad];
  const lines = [];
  for (let y = 0; y < n; y += 2) {
    let line = "";
    for (let x = 0; x < n; x++) {
      const top = invert ? dark(x, y) : !dark(x, y);
      const bottom = y + 1 < n ? (invert ? dark(x, y + 1) : !dark(x, y + 1)) : !invert;
      line += top && bottom ? "█" : top ? "▀" : bottom ? "▄" : " ";
    }
    lines.push(line);
  }
  return lines.join("\n");
}

export function connectLink(appUrl, helperUrl, code) {
  const query = `helper=${encodeURIComponent(helperUrl)}&code=${encodeURIComponent(code)}`;
  if (!appUrl) return { query, url: "" };
  const base = appUrl.replace(/[?#].*$/, "").replace(/\/?$/, "/");
  return { query, url: `${base}?${query}` };
}

/* ───────── 읽기 전용 상태 조회 (/status) ───────── */
const IPP_STATUS_ATTRS = ["printer-state", "printer-state-reasons", "marker-names", "marker-levels", "marker-colors", "marker-types", "sides-supported", "color-supported", "document-format-supported", "media-ready", "printer-make-and-model"];

/** IPP 요청: Get-Printer-Attributes (requested-attributes 여러 개 = 1setOf keyword) */
export function buildIppAttrRequest(host, attrs = IPP_STATUS_ATTRS, id = 1) {
  const attr = (tag, name, value) => {
    const n = Buffer.from(name);
    const v = Buffer.from(value);
    const b = Buffer.alloc(1 + 2 + n.length + 2 + v.length);
    let o = b.writeUInt8(tag, 0);
    o = b.writeUInt16BE(n.length, o);
    o += n.copy(b, o);
    o = b.writeUInt16BE(v.length, o);
    v.copy(b, o);
    return b;
  };
  const head = Buffer.from([0x01, 0x01, 0x00, 0x0b, 0, 0, 0, 0, 0x01]);
  head.writeUInt32BE(id, 4);
  return Buffer.concat([
    head,
    attr(0x47, "attributes-charset", "utf-8"),
    attr(0x48, "attributes-natural-language", "en"),
    attr(0x45, "printer-uri", `ipp://${host}:631/ipp/print`),
    ...attrs.map((name, i) => attr(0x44, i === 0 ? "requested-attributes" : "", name)),
    Buffer.from([0x03]),
  ]);
}

/** IPP 응답 → { status, attrs: { 이름: 값[] } } (정수·enum·불리언·문자열, 추가 값은 이름 길이 0) */
export function parseIppResponse(buf) {
  if (buf.length < 9) throw new Error("ipp too short");
  const status = buf.readUInt16BE(2);
  const attrs = {};
  let pos = 8;
  let last = "";
  while (pos < buf.length) {
    const tag = buf[pos++];
    if (tag === 0x03) break;
    if (tag <= 0x0f) continue; /* 구분자(operation/printer/job 그룹) */
    if (pos + 2 > buf.length) break;
    const nlen = buf.readUInt16BE(pos);
    pos += 2;
    const name = nlen ? buf.subarray(pos, pos + nlen).toString("utf8") : last;
    pos += nlen;
    if (pos + 2 > buf.length) break;
    const vlen = buf.readUInt16BE(pos);
    pos += 2;
    if (pos + vlen > buf.length) break;
    const raw = buf.subarray(pos, pos + vlen);
    pos += vlen;
    let value;
    if ((tag === 0x21 || tag === 0x23) && vlen === 4) value = raw.readInt32BE(0);
    else if (tag === 0x22 && vlen === 1) value = raw[0] === 1;
    else value = raw.toString("utf8");
    last = name;
    (attrs[name] ||= []).push(value);
  }
  return { status, attrs };
}

function ippPost(host, body, timeoutMs, pathName) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      req.destroy();
      finish(null);
    }, timeoutMs);
    const req = http.request({ host, port: 631, path: pathName, method: "POST", headers: { "Content-Type": "application/ipp", "Content-Length": body.length } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => finish(res.statusCode === 200 ? Buffer.concat(chunks) : null));
      res.on("error", () => finish(null));
    });
    req.on("error", () => finish(null));
    req.end(body);
  });
}

/** IPP로 상태·토너·지원 기능 읽기 (2초) */
export async function ippStatus(host, timeoutMs = 2000) {
  const body = buildIppAttrRequest(host);
  for (const pathName of ["/ipp/print", "/ipp", "/"]) {
    const buf = await ippPost(host, body, timeoutMs, pathName);
    if (!buf) continue;
    try {
      const parsed = parseIppResponse(buf);
      if (parsed.status < 0x0400) return parsed.attrs;
    } catch {
      /* 다음 경로 */
    }
  }
  return null;
}

/** 여러 PJL 질의를 한 연결로 보내고 응답 글자를 모은다 (인쇄 데이터 없음, UEL로 열고 닫음) */
export function pjlQuery(host, commands, timeoutMs = 2000, port = 9100) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let text = "";
    let settled = false;
    const wantFF = commands.length;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(text);
    };
    const timer = setTimeout(done, timeoutMs);
    socket.once("connect", () => socket.write(`\x1b%-12345X@PJL\r\n${commands.map((c) => `${c}\r\n`).join("")}\x1b%-12345X`));
    socket.on("data", (c) => {
      text += c.toString("latin1");
      if ((text.match(/\f/g) || []).length >= wantFF) done();
    });
    socket.once("error", done);
  });
}

/** PJL 상태 코드 → 상태·사유 (HP 및 공통 PJL 표준 코드표) */
export function pjlCodeInfo(code) {
  const n = Number(code);
  if (!Number.isFinite(n)) return { state: "unknown", reason: "" };
  if (n === 10001 || n === 10000) return { state: "ready", reason: n === 10000 ? "power-save" : "" };
  if (n === 10006) return { state: "warning", reason: "toner-low" };
  if ([10002, 10003, 10004, 10005, 10007, 10023, 10024].includes(n)) return { state: "busy", reason: n === 10003 ? "warming-up" : "processing" };
  if (n >= 10000 && n < 11000) return { state: "ready", reason: "" };
  if (n >= 11000 && n < 12000) return { state: "error", reason: "media-empty" }; /* 용지함 비어 있음(자동 계속) */
  if (n >= 30000 && n < 31000) return { state: "error", reason: "cover-open" };
  if (n >= 35000 && n < 36000) return { state: "warning", reason: "attention" };
  if (n >= 41000 && n < 42000) return { state: "error", reason: "media-empty" };
  if (n >= 42000 && n < 43000) return { state: "error", reason: "media-jam" };
  if (n === 40021) return { state: "error", reason: "cover-open" };
  if (n === 40022 || n === 40019) return { state: "error", reason: "media-jam" };
  if (n === 40038 || n === 40026) return { state: "warning", reason: "toner-low" };
  if (n >= 40000 && n < 50000) return { state: "error", reason: "printer-error" };
  if (n >= 50000) return { state: "error", reason: "hardware-error" };
  return { state: "unknown", reason: "" };
}

export function parsePjlStatus(text) {
  const block = text.slice(text.indexOf("INFO STATUS"));
  const code = block.match(/CODE\s*=\s*(\d{5})/i)?.[1] || "";
  const display = (block.match(/DISPLAY\s*=\s*"([^"]*)"/i)?.[1] || "").trim();
  const online = /ONLINE\s*=\s*TRUE/i.test(block) ? true : /ONLINE\s*=\s*FALSE/i.test(block) ? false : null;
  return { code, display, online, ...pjlCodeInfo(code) };
}

export function parsePjlConfig(text) {
  const at = text.indexOf("INFO CONFIG");
  const block = at < 0 ? "" : text.slice(at, text.indexOf("\f", at) < 0 ? undefined : text.indexOf("\f", at));
  const langs = [...block.matchAll(/^\s*(PCL\w*|PDF|POSTSCRIPT|PS|XPS|PCLXL|URF|PWG\w*)\s*$/gim)].map((m) => m[1].toUpperCase());
  return {
    duplex: /DUPLEX/i.test(block) ? true : null,
    languages: [...new Set(langs)],
    memory: block.match(/MEMORY\s*=\s*(\d+)/i)?.[1] || "",
    trays: (block.match(/IN TRAYS[^\n]*/i)?.[0] || "").trim(),
  };
}

const REASON_KO = {
  "media-empty": "용지 없음",
  "media-needed": "용지 없음",
  "media-jam": "용지 걸림",
  "toner-low": "토너 부족",
  "toner-empty": "토너 없음",
  "marker-supply-low": "토너 부족",
  "marker-supply-empty": "토너 없음",
  "cover-open": "덮개 열림",
  "door-open": "덮개 열림",
  "input-tray-missing": "용지함 빠짐",
  "output-area-full": "배출함 가득 참",
  paused: "일시 정지",
  offline: "오프라인",
  "warming-up": "예열 중",
  processing: "인쇄 처리 중",
  "power-save": "절전 중",
  attention: "확인 필요",
  "printer-error": "복사기 오류",
  "hardware-error": "하드웨어 오류",
};

/** IPP·PJL 결과를 하나의 상태로 합친다 (더 나쁜 쪽이 이긴다) */
export function summarizeStatus({ ipp, pjl, config, raw9100, ipp631, webAdmin }) {
  const rank = { unknown: 0, ready: 1, busy: 2, warning: 3, error: 4 };
  let state = "unknown";
  const reasons = new Set();
  const take = (s) => {
    if (rank[s] > rank[state]) state = s;
  };
  if (ipp) {
    const ps = Number(ipp["printer-state"]?.[0]);
    take(ps === 5 ? "error" : ps === 4 ? "busy" : ps === 3 ? "ready" : "unknown");
    for (const raw of ipp["printer-state-reasons"] || []) {
      const r = String(raw).replace(/-(report|warning|error)$/, "");
      if (!r || r === "none") continue;
      if (/jam|empty|needed|cover|door|missing|offline|-error$/.test(r) || /-error$/.test(String(raw))) take("error");
      else if (/low|warning|full|paused|attention/.test(r) || /-warning$/.test(String(raw))) take("warning");
      reasons.add(r === "media-needed" ? "media-empty" : r === "door-open" ? "cover-open" : r === "marker-supply-low" ? "toner-low" : r);
    }
  }
  if (pjl && pjl.code) {
    take(pjl.state);
    if (pjl.reason && !["processing", "power-save"].includes(pjl.reason)) reasons.add(pjl.reason);
  }
  const names = ipp?.["marker-names"] || [];
  const levels = ipp?.["marker-levels"] || [];
  const colors = ipp?.["marker-colors"] || [];
  const toners = names.map((name, i) => ({ name: String(name), level: typeof levels[i] === "number" && levels[i] >= 0 ? Math.min(100, levels[i]) : null, color: String(colors[i] || "") }));
  if (toners.some((t) => t.level !== null && t.level <= 10) && !reasons.has("toner-low")) {
    reasons.add("toner-low");
    take("warning");
  }
  const formats = (ipp?.["document-format-supported"] || []).map((f) => String(f).toLowerCase());
  const langs = config?.languages || [];
  const sides = (ipp?.["sides-supported"] || []).map(String);
  const caps = {
    pdfDirect: formats.length ? formats.includes("application/pdf") : langs.length ? langs.includes("PDF") : null,
    pcl5: langs.length ? langs.some((l) => /^PCL(5|$)/.test(l)) : formats.length ? formats.some((f) => /pcl/.test(f)) : null,
    duplex: sides.length ? sides.some((x) => x.startsWith("two-sided")) : config?.duplex ?? null,
    color: ipp?.["color-supported"]?.length ? ipp["color-supported"][0] === true : colors.length ? colors.some((c) => /^#(?!000000)/i.test(String(c)) && !/black/i.test(String(c))) : null,
    raw9100: Boolean(raw9100),
    ipp631: Boolean(ipp631),
    webAdmin: Boolean(webAdmin),
  };
  if (state === "unknown" && (raw9100 || ipp631)) state = "unknown";
  const list = [...reasons];
  const summary =
    state === "ready"
      ? "대기 중"
      : state === "busy"
        ? `처리 중${pjl?.reason === "warming-up" ? " (예열)" : ""}`
        : state === "warning"
          ? `주의: ${list.map((r) => REASON_KO[r] || r).join(", ") || "확인 필요"}`
          : state === "error"
            ? `오류: ${list.map((r) => REASON_KO[r] || r).join(", ") || "복사기 확인"}`
            : raw9100 || ipp631
              ? "상태 미확인 (응답은 있음)"
              : "상태 미확인";
  return { state, summary, reasons: list, toners, capabilities: caps, media: (ipp?.["media-ready"] || []).map(String), model: String(ipp?.["printer-make-and-model"]?.[0] || ""), display: pjl?.display || "" };
}

/** /status 본체: 모든 질의를 병렬로(각 2초), 인쇄 데이터는 보내지 않는다 */
export async function printerStatus(host, opts = {}) {
  const started = Date.now();
  const t = opts.timeoutMs ?? 2000;
  const [raw9100, ipp631, webAdmin] = await Promise.all([portOpen(host, 9100, 800), portOpen(host, 631, 800), portOpen(host, 80, 800)]);
  const [ipp, pjlText] = await Promise.all([ipp631 ? ippStatus(host, t) : Promise.resolve(null), raw9100 && opts.pjl !== false ? pjlQuery(host, ["@PJL INFO STATUS", "@PJL INFO CONFIG"], t) : Promise.resolve("")]);
  const pjl = pjlText ? parsePjlStatus(pjlText) : null;
  const config = pjlText ? parsePjlConfig(pjlText) : null;
  const sum = summarizeStatus({ ipp, pjl, config, raw9100, ipp631, webAdmin });
  return { ok: true, ip: host, ...sum, pjlCode: pjl?.code || "", latencyMs: Date.now() - started, checkedAt: new Date().toISOString() };
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Private-Network": "true",
  "Access-Control-Allow-Headers": "Content-Type, X-Helper-Code, Access-Control-Request-Private-Network",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "600",
};

export function createHelper(opts = {}) {
  const allowedPorts = opts.allowedPorts ?? new Set([9100, 9101, 9102]);
  const allowLoopback = opts.allowLoopback ?? false;
  const code = opts.code ?? "";
  /* 틀린 코드는 보낸 기기(IP)마다 따로 센다 — 예전처럼 한데 세면 같은 와이파이의 누군가가
     틀린 코드만 보내 모든 사람의 인쇄를 1분씩 막을 수 있었다 */
  const fails = new Map();
  const FAIL_LIMIT = 10;
  const FAIL_WINDOW = 60_000;
  const MAX_TRACKED = 1000;

  return http.createServer(async (req, res) => {
    // 모든 응답(오류·프리플라이트 포함)에 같은 CORS + PNA(Private Network Access) 헤더를 붙인다.
    // 쿠키를 쓰지 않으므로 Origin은 "*"로 연다. 실제 보호는 6자리 연결 코드가 맡는다.
    const send = (code, body) => {
      res.writeHead(code, {
        ...CORS_HEADERS,
        ...(code === 204 ? {} : { "Content-Type": "application/json" }),
      });
      res.end(code === 204 ? undefined : JSON.stringify(body));
    };
    if (req.method === "OPTIONS") return send(204, {});

    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/ping") {
      return send(200, { ok: true, name: "nuguna-print-helper", version: 3, needsCode: Boolean(code), discover: true });
    }

    // 연결 코드를 모르는 웹페이지는 프린터에 아무것도 보낼 수 없다.
    if (code) {
      const now = Date.now();
      const who = String(req.socket.remoteAddress ?? "");
      const mine = (fails.get(who) ?? []).filter((t) => now - t < FAIL_WINDOW);
      if (mine.length >= FAIL_LIMIT) {
        fails.set(who, mine);
        return send(429, { ok: false, error: "too many tries" });
      }
      if (!sameCode(String(req.headers["x-helper-code"] ?? ""), code)) {
        mine.push(now);
        fails.delete(who);
        fails.set(who, mine);
        /* 기록이 끝없이 늘지 않게 가장 오래된 기기부터 지운다 */
        while (fails.size > MAX_TRACKED) fails.delete(fails.keys().next().value);
        return send(401, { ok: false, error: "code required" });
      }
      if (mine.length) fails.set(who, mine);
      else fails.delete(who);
    }
    if (url.pathname === "/check") return send(200, { ok: true });

    if (url.pathname === "/info" && req.method === "GET") {
      return send(200, { ok: true, ...helperInfo(opts.port ?? DEFAULT_PORT, opts.ifaces) });
    }

    if (url.pathname === "/discover" && req.method === "GET") {
      const subnet = (url.searchParams.get("subnet") ?? "").trim();
      if (subnet && (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(subnet) || !isPrivateHost(`${subnet}.1`))) {
        return send(400, { ok: false, error: "subnet not allowed" });
      }
      try {
        const found = await (opts.discover ?? discoverPrinters)(subnet, { pjl: url.searchParams.get("pjl") !== "0", mdns: url.searchParams.get("mdns") !== "0", ifaces: opts.ifaces });
        return send(200, { ok: true, ...found });
      } catch (err) {
        return send(500, { ok: false, error: String(err?.message ?? err) });
      }
    }

    const host = url.searchParams.get("host") ?? url.searchParams.get("ip") ?? "";
    const port = Number(url.searchParams.get("port") ?? 9100);
    if (!isPrivateHost(host, allowLoopback) || !allowedPorts.has(port)) {
      return send(400, { ok: false, error: "target not allowed" });
    }

    try {
      if (url.pathname === "/status" && req.method === "GET") {
        const result = await (opts.status ?? printerStatus)(host, { pjl: url.searchParams.get("pjl") !== "0" });
        return send(200, result);
      }
      if (url.pathname === "/probe") {
        const hit = await (opts.probe ?? probeHost)(host, port, 800);
        return send(200, { ok: true, host, port, open: hit.open, ms: hit.ms });
      }
      if (url.pathname === "/wake") {
        // 데이터 없이 연결만 열었다 닫는다: 절전 프린터가 깨어난다.
        const s = await connect(host, port, 1500).catch(() => null);
        s?.destroy();
        return send(200, { ok: true, open: Boolean(s) });
      }
      if (url.pathname === "/print" && req.method === "POST") {
        let body;
        try {
          body = await readBody(req, opts.maxBytes ?? MAX_BYTES);
        } catch (err) {
          if (err instanceof TooLarge) {
            /* 응답을 먼저 보낸 뒤 연결을 닫아 브라우저가 413을 받게 한다 */
            res.setHeader("Connection", "close");
            send(413, { ok: false, error: "payload too large", maxBytes: opts.maxBytes ?? MAX_BYTES });
            req.resume();
            return;
          }
          throw err;
        }
        if (body.length === 0) return send(400, { ok: false, error: "empty" });
        const socket = await connect(host, port, 4000);
        const sent = await writeAll(socket, body, opts.writeChunk, opts.idleMs);
        return send(200, { ok: true, bytes: sent });
      }
      return send(404, { ok: false, error: "not found" });
    } catch (err) {
      return send(502, { ok: false, error: String(err?.message ?? err) });
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || DEFAULT_PORT);
  let resolved;
  try {
    resolved = resolveCode();
  } catch (err) {
    console.error(String(err?.message ?? err));
    process.exit(1);
  }
  const code = resolved.code;
  const argApp = process.argv.find((arg) => arg.startsWith("--app="))?.slice(6) || "";
  const appUrl = (process.env.APP_URL || argApp).trim();
  const invert = process.argv.includes("--qr-invert");
  const server = createHelper({ code, port });
  server.on("error", (err) => {
    if (err?.code === "EADDRINUSE") {
      console.error(`이미 PC 도우미가 실행 중이에요 (포트 ${port}). 열려 있는 도우미 창을 그대로 쓰거나, 그 창을 닫은 뒤 다시 실행해 주세요.`);
      process.exit(2);
    }
    if (err?.code === "EACCES") {
      console.error(`포트 ${port}를 열 권한이 없어요. PORT=다른번호 로 실행해 주세요.`);
      process.exit(2);
    }
    console.error(`PC 도우미를 시작하지 못했어요: ${String(err?.message ?? err)}`);
    process.exit(1);
  });
  const stop = (signal) => {
    console.log(`\nPC 도우미를 종료해요 (${signal}).`);
    server.close(() => process.exit(0));
    /* 열린 연결이 남아 있어도 2초 뒤에는 정리하고 끝낸다 */
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.once("SIGINT", () => stop("SIGINT"));
  process.once("SIGTERM", () => stop("SIGTERM"));
  server.listen(port, "0.0.0.0", () => {
    const info = helperInfo(port);
    console.log(`누구나프린트 PC 도우미 실행 중 (포트 ${port}) — 이 창을 닫으면 멈춥니다.`);
    console.log(`이 컴퓨터 브라우저: http://127.0.0.1:${port}`);
    for (const row of info.addresses) console.log(`같은 와이파이의 폰: ${row.url}  (${row.iface})`);
    if (!info.addresses.length) console.log("실제 랜/와이파이 주소를 찾지 못했어요. 같은 와이파이에 연결돼 있는지 확인해 주세요.");
    console.log(`연결 코드: ${code}  (앱의 PC 도우미에 입력하세요)`);
    const how = { saved: "저장된 코드 재사용", created: "새로 발급", new: "--new-code 로 새로 발급", manual: "직접 지정", migrated: "예전 코드 이어 쓰기" }[resolved.source] || "";
    console.log(resolved.saved ? `  └ ${how} · ${resolved.file} 에 저장돼 재부팅해도 유지돼요 (새 코드: --new-code)` : `  └ ${how} · 설정 파일에 저장하지 못해 이번 실행에만 쓰여요`);
    if (info.subnets.length) console.log(`프린터 찾기 대역(자동): ${info.subnets.map((s) => `${s}.x`).join(", ")}`);
    const link = connectLink(appUrl, info.recommended, code);
    console.log("");
    if (link.url) {
      console.log("📱 폰 카메라로 아래 QR을 찍으면 도우미 주소와 코드가 자동으로 들어갑니다:");
      console.log(terminalQr(link.url, invert));
      console.log(link.url);
      console.log("(QR이 안 읽히면 --qr-invert 를 붙여 다시 실행해 보세요)");
    } else {
      console.log("📱 원터치 연결: 누구나프린트 주소 뒤에 아래를 붙여 열면 자동 연결돼요.");
      console.log(`   ?${link.query}`);
      console.log("   QR까지 보려면: APP_URL=https://누구나프린트주소 node raw-print-helper.mjs  (또는 --app=주소)");
    }
  });
}
