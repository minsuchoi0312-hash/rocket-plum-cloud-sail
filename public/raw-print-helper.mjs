#!/usr/bin/env node
// 누구나프린트 PC 도우미 — 브라우저가 못 여는 9100(Raw) 포트를 대신 열어 줍니다.
// 실행: node raw-print-helper.mjs   (Node 18 이상, 설치할 것 없음)
// 이 PC의 모든 주소에서 듣고, 같은 망(사설 IP)의 9100~9102 포트로만 보냅니다.
// 연결 코드가 없으면 인쇄 요청은 거절합니다.
import http from "node:http";
import net from "node:net";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_PORT = 47631;
const MAX_BYTES = 128 * 1024 * 1024;

/** 연결 코드: 처음 한 번 만들어 파일에 저장한다. 앱 설정에서 이 6자리를 입력하면 연결된다. */
export function loadCode(file = path.join(os.homedir(), ".nuguna-print-helper-code")) {
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

export function isPrivateHost(host, allowLoopback = false) {
  if (allowLoopback && (host === "127.0.0.1" || host === "localhost")) return true;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(host)) return true;
  return /^[a-z0-9-]+\.local$/i.test(host);
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BYTES) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export function createHelper(opts = {}) {
  const allowedPorts = opts.allowedPorts ?? new Set([9100, 9101, 9102]);
  const allowLoopback = opts.allowLoopback ?? false;
  const code = opts.code ?? "";
  let fails = [];

  return http.createServer(async (req, res) => {
    const send = (code, body) => {
      res.writeHead(code, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Private-Network": "true",
        "Access-Control-Allow-Headers": "Content-Type, X-Helper-Code",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        Vary: "Origin",
      });
      res.end(JSON.stringify(body));
    };
    if (req.method === "OPTIONS") return send(204, {});

    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/ping") {
      return send(200, { ok: true, name: "nuguna-print-helper", version: 2, needsCode: Boolean(code) });
    }

    // 연결 코드를 모르는 웹페이지는 프린터에 아무것도 보낼 수 없다.
    const now = Date.now();
    fails = fails.filter((t) => now - t < 60_000);
    if (code) {
      if (fails.length >= 10) return send(429, { ok: false, error: "too many tries" });
      if (!sameCode(String(req.headers["x-helper-code"] ?? ""), code)) {
        fails.push(now);
        return send(401, { ok: false, error: "code required" });
      }
    }
    if (url.pathname === "/check") return send(200, { ok: true });

    const host = url.searchParams.get("host") ?? "";
    const port = Number(url.searchParams.get("port") ?? 9100);
    if (!isPrivateHost(host, allowLoopback) || !allowedPorts.has(port)) {
      return send(400, { ok: false, error: "target not allowed" });
    }

    try {
      if (url.pathname === "/probe") {
        const s = await connect(host, port, 400).catch(() => null);
        s?.destroy();
        return send(200, { ok: true, open: Boolean(s) });
      }
      if (url.pathname === "/wake") {
        // 데이터 없이 연결만 열었다 닫는다: 절전 프린터가 깨어난다.
        const s = await connect(host, port, 1500).catch(() => null);
        s?.destroy();
        return send(200, { ok: true, open: Boolean(s) });
      }
      if (url.pathname === "/print" && req.method === "POST") {
        const body = await readBody(req);
        if (body.length === 0) return send(400, { ok: false, error: "empty" });
        const socket = await connect(host, port, 4000);
        await new Promise((resolve, reject) => {
          socket.once("error", reject);
          socket.once("close", resolve);
          socket.end(body);
        });
        return send(200, { ok: true, bytes: body.length });
      }
      return send(404, { ok: false, error: "not found" });
    } catch (err) {
      return send(502, { ok: false, error: String(err?.message ?? err) });
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || DEFAULT_PORT);
  const code = process.env.HELPER_CODE || loadCode();
  createHelper({ code }).listen(port, "0.0.0.0", () => {
    console.log(`누구나프린트 PC 도우미 실행 중 (포트 ${port}) — 이 창을 닫으면 멈춥니다.`);
    console.log(`이 컴퓨터 브라우저: http://127.0.0.1:${port}`);
    console.log(`같은 와이파이의 폰: 이 PC의 사설 IP, 예: http://192.168.0.20:${port}`);
    console.log(`연결 코드: ${code}  (앱의 PC 도우미에 입력하세요)`);
  });
}
