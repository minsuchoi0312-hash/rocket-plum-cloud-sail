/**
 * 삼성 SPL(QPDL) 추가 압축 · 컬러 띠 — spl.ts 에서 쓴다.
 * 규격은 공개 드라이버 SpliX(OpenPrinting) 의 동작을 보고 직접 썼다(코드를 옮기지 않음).
 *
 * 0x0D (초기 SCX-4100 계열): 줄 우선, 1 = 검정. 검은 점 덩어리(run)마다 토큰 하나.
 *   h = 이번 덩어리 시작 x − 앞 토큰 덩어리 시작 x(부호 있음), v = 앞 토큰 이후 내려간 줄 수
 *   2바이트: v≤1, |h|≤127, run≤63          → (v<<6 | run), h & 0xFF
 *   4바이트: v≤3, −8192≤h≤8191, run≤4095   → 0x80 | ((h>>8)&0x3F), h&0xFF, 0x80 | (v<<4) | (run>>8), run&0xFF
 *   6바이트: 그 밖                          → 0xC0, D(BE24) = v·W + h, 0xC0 | (run>>8), run&0xFF
 *   W(줄 감기 폭) = 4960(128줄 띠) / 2464(64줄 띠). 끝은 4바이트 경계까지 0 (이미 맞으면 0 네 개).
 *   한 줄이 122바이트(600dpi) · 250바이트(300dpi)를 넘으면 그 띠는 0x0E 로.
 * 0x0E: 줄 우선, 1 = 흰색(뒤집음). 줄마다 정확히 M바이트(620 / 308)로 자르거나 0xFF 로 채워 따로 압축.
 *   되풀이 2~65: 1바이트 (129−n), 값 / 되풀이 66 이상: BE16 (0x10001−n), 값 / 날 데이터 len: BE16 0x8000|(len−1), 바이트들
 *   띠 끝은 4바이트 경계까지 0.
 */

const be16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const be32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

class Out {
  bytes: number[] = [];
  push(...values: number[]) {
    for (const v of values) this.bytes.push(v & 0xff);
  }
  padTo4(always: boolean) {
    const rest = this.bytes.length % 4;
    const pad = rest ? 4 - rest : always ? 4 : 0;
    for (let i = 0; i < pad; i++) this.bytes.push(0);
  }
}

/** 0x0D 압축. rows: 줄 우선 1비트(1 = 검정), lineBytes 바이트씩. 한 줄이라도 예산을 넘으면 null(→ 0x0E) */
export function compress0x0d(rows: Uint8Array, lineBytes: number, height: number, dpi: 300 | 600): Uint8Array | null {
  const W = height >= 128 ? 4960 : 2464;
  const budget = dpi === 300 ? 250 : 122;
  const width = Math.min(lineBytes * 8, W);
  const out = new Out();
  let prevX = 0;
  let pendingV = 0;
  const bit = (y: number, x: number) => (rows[y * lineBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
  for (let y = 0; y < height; y++) {
    const lineStart = out.bytes.length;
    let x = 0;
    while (x < width) {
      if (!bit(y, x)) {
        x++;
        continue;
      }
      const start = x;
      while (x < width && bit(y, x)) x++;
      let run = x - start;
      const h = start - prevX;
      const v = pendingV;
      if (v <= 1 && h >= -128 && h <= 127 && run <= 63) out.push((v << 6) | run, h & 0xff);
      else if (v <= 3 && h >= -8192 && h <= 8191 && run <= 4095) out.push(0x80 | ((h >> 8) & 0x3f), h & 0xff, 0x80 | (v << 4) | (run >> 8), run & 0xff);
      else {
        /* 6바이트 토큰의 run 은 14비트 — 그보다 긴 덩어리는 이어 붙인다(줄 폭이 4960 이하라 실제로는 없다) */
        run = Math.min(run, 0x3fff);
        const d = v * W + h;
        out.push(0xc0, (d >> 16) & 0xff, (d >> 8) & 0xff, d & 0xff, 0xc0 | (run >> 8), run & 0xff);
      }
      prevX = start;
      pendingV = 0;
    }
    if (out.bytes.length - lineStart > budget) return null;
    pendingV++;
  }
  out.padTo4(true);
  return Uint8Array.from(out.bytes);
}

/** 0x0E 압축. rows: 줄 우선 1비트(1 = 검정) — 안에서 뒤집어(1 = 흰색) 줄마다 M바이트로 */
export function compress0x0e(rows: Uint8Array, lineBytes: number, height: number, dpi: 300 | 600): Uint8Array {
  const M = dpi === 300 ? 308 : 620;
  const out = new Out();
  const line = new Uint8Array(M);
  for (let y = 0; y < height; y++) {
    line.fill(0xff);
    const n = Math.min(M, lineBytes);
    for (let i = 0; i < n; i++) line[i] = ~rows[y * lineBytes + i] & 0xff;
    let i = 0;
    let literal: number[] = [];
    const flush = () => {
      if (!literal.length) return;
      out.push(...be16(0x8000 | (literal.length - 1)), ...literal);
      literal = [];
    };
    while (i < M) {
      let r = 1;
      while (i + r < M && line[i + r] === line[i] && r < 0x4001) r++;
      if (r >= 2) {
        flush();
        if (r <= 65) out.push(129 - r, line[i]);
        else out.push(...be16(0x10001 - r), line[i]);
        i += r;
      } else {
        literal.push(line[i]);
        i++;
        if (literal.length === 0x4000) flush();
      }
    }
    flush();
  }
  out.padTo4(false);
  return Uint8Array.from(out.bytes);
}

/** 0x0D · 0x0E 띠 패킷: 0C · 번호 · 폭(점, BE16) · 높이 · 압축 · 크기(n+4) · 데이터 · 체크섬(데이터 합). 서명 없음 */
export function band0x0d(bandNumber: number, lineBytes: number, height: number, rows: Uint8Array, dpi: 300 | 600): Uint8Array {
  const d = compress0x0d(rows, lineBytes, height, dpi);
  const comp = d ? 0x0d : 0x0e;
  const payload = d ?? compress0x0e(rows, lineBytes, height, dpi);
  let sum = 0;
  for (const b of payload) sum += b;
  const head = [0x0c, bandNumber & 0xff, ...be16(lineBytes * 8), ...be16(height), comp, ...be32(payload.length + 4)];
  const out = new Uint8Array(head.length + payload.length + 4);
  out.set(head, 0);
  out.set(payload, head.length);
  out.set(be32(sum >>> 0), head.length + payload.length);
  return out;
}

/* ───────── 풀기 (테스트 · 확인용) ───────── */

/** 0x0D 풀기 → 줄 우선 1비트 */
export function decode0x0d(payload: Uint8Array, lineBytes: number, height: number): Uint8Array {
  const W = height >= 128 ? 4960 : 2464;
  const rows = new Uint8Array(lineBytes * height);
  let pos = 0;
  let p = 0;
  while (p < payload.length) {
    const b = payload[p];
    if (b === 0) break;
    let h: number;
    let v: number;
    let run: number;
    if (b < 0x80) {
      v = b >> 6;
      run = b & 0x3f;
      h = (payload[p + 1] << 24) >> 24;
      p += 2;
      pos += v * W + h;
    } else if (b < 0xc0) {
      h = (((b & 0x3f) << 8) | payload[p + 1]) << 18 >> 18;
      v = (payload[p + 2] >> 4) & 3;
      run = ((payload[p + 2] & 0x0f) << 8) | payload[p + 3];
      p += 4;
      pos += v * W + h;
    } else {
      let d = (payload[p + 1] << 16) | (payload[p + 2] << 8) | payload[p + 3];
      if (d & 0x800000) d -= 0x1000000;
      run = ((payload[p + 4] & 0x3f) << 8) | payload[p + 5];
      p += 6;
      pos += d;
    }
    const y = Math.floor(pos / W);
    const x = pos - y * W;
    for (let k = 0; k < run; k++) rows[y * lineBytes + ((x + k) >> 3)] |= 0x80 >> ((x + k) & 7);
  }
  return rows;
}

/** 0x0E 풀기 → 줄 우선 1비트(1 = 검정), 줄마다 M바이트 중 lineBytes 만 */
export function decode0x0e(payload: Uint8Array, lineBytes: number, height: number, dpi: 300 | 600): Uint8Array {
  const M = dpi === 300 ? 308 : 620;
  const rows = new Uint8Array(lineBytes * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const line: number[] = [];
    while (line.length < M) {
      const b = payload[p];
      if (b >= 0x80) {
        const word = ((b << 8) | payload[p + 1]) & 0x7fff;
        const n = word & 0x4000 ? word - 0x8000 : word;
        p += 2;
        if (n >= 0) {
          for (let k = 0; k <= n; k++) line.push(payload[p++]);
        } else {
          const value = payload[p++];
          for (let k = 0; k < 1 - n; k++) line.push(value);
        }
      } else {
        const n = b & 0x40 ? (b & 0x7f) - 0x80 : b & 0x7f;
        p++;
        if (n >= 0) for (let k = 0; k <= n; k++) line.push(payload[p++]);
        else {
          const value = payload[p++];
          for (let k = 0; k < 1 - n; k++) line.push(value);
        }
      }
    }
    for (let i = 0; i < lineBytes && i < M; i++) rows[y * lineBytes + i] = ~line[i] & 0xff;
  }
  return rows;
}

/* ───────── 컬러 띠 (QPDL 1 · 0x11) ───────── */

/**
 * 컬러 띠 기록: 첫 면은 [0C · 번호 · 폭 · 높이 · 색 · 0x11 · 크기 …], 같은 띠의 다음 면은 [색 · 0x11 · 크기 …] 만,
 * 마지막 면 뒤에 00 한 바이트. 색 번호 C=1 · M=2 · Y=3 · K=4, 빈 면은 건너뛴다.
 * planes: [색 번호, 0x11 로 압축된 데이터(서명 · 체크섬 없는 본문)][]
 */
export function colorBandRecord(bandNumber: number, widthPx: number, height: number, planes: [number, Uint8Array][]): Uint8Array | null {
  if (!planes.length) return null;
  const sig = [0xef, 0xcd, 0xab, 0x09];
  const parts: number[][] = [];
  planes.forEach(([color, packed], index) => {
    let sum = sig.reduce((a, b) => a + b, 0);
    for (const b of packed) sum += b;
    const head = index === 0 ? [0x0c, bandNumber & 0xff, ...be16(widthPx), ...be16(height), color, 0x11, ...be32(packed.length + 8), ...sig] : [color, 0x11, ...be32(packed.length + 8), ...sig];
    parts.push(head, Array.from(packed), be32(sum >>> 0));
  });
  parts.push([0x00]);
  const size = parts.reduce((n, part) => n + part.length, 0);
  const out = new Uint8Array(size);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
