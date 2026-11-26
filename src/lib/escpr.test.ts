import { test } from "node:test";
import assert from "node:assert/strict";
import { escprEndPage, escprGeometry, escprJobFooter, escprJobHeader, escprRle } from "./escpr.ts";

/** 규격대로 푸는 디코더 (점 = RGB 3바이트) */
function unpack(data: Uint8Array) {
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    const n = data[i++];
    if (n >= 128) {
      const run = 257 - n;
      for (let k = 0; k < run; k++) out.push(data[i], data[i + 1], data[i + 2]);
      i += 3;
    } else {
      const lit = n + 1;
      out.push(...data.subarray(i, i + lit * 3));
      i += lit * 3;
    }
  }
  return Uint8Array.from(out);
}

test("RLE 되풀이 · 섞인 줄이 원래대로 풀린다", () => {
  const pixels = 700;
  const row = new Uint8Array(pixels * 3).fill(255);
  for (let x = 100; x < 140; x++) row.set([x % 7, 20, 30], x * 3); // 섞인 점
  for (let x = 300; x < 600; x++) row.set([0, 0, 0], x * 3); // 긴 검정(129 넘게)
  const packed = escprRle(row, pixels);
  assert.ok(packed && packed.length < row.length);
  assert.deepEqual(unpack(packed), row);
});

test("RLE 가 원본보다 커지면 null(무압축)", () => {
  const pixels = 50;
  const row = Uint8Array.from({ length: pixels * 3 }, (_, i) => (i * 37) % 256);
  const packed = escprRle(row, pixels);
  if (packed) assert.deepEqual(unpack(packed), row);
  else assert.equal(packed, null);
});

test("A4 360dpi 크기와 3mm 여백", () => {
  assert.deepEqual(escprGeometry("A4"), { paperW: 2976, paperH: 4209, areaW: 2892, areaH: 4125 });
});

test("머리말: 패킷 모드 해제 → 원격 → ESCPR → setq · seti · setj", () => {
  const h = escprJobHeader({ paper: "A4", color: false });
  const text = Buffer.from(h).toString("latin1");
  assert.ok(text.startsWith("\x00\x00\x00\x1b\x01@EJL 1284.4\n@EJL     \n\x1b@\x1b(R\x08\x00\x00REMOTE1"));
  assert.ok(text.includes("\x1b(R\x06\x00\x00ESCPR"));
  const q = text.indexOf("setq");
  assert.equal(text.slice(q - 6, q), "\x1bq\x09\x00\x00\x00");
  assert.equal(h[q + 4 + 2], 1, "흑백 = 1");
  const j = text.indexOf("setj");
  assert.equal(text.slice(j - 6, j), "\x1bj\x16\x00\x00\x00");
  const view = new DataView(h.buffer, h.byteOffset + j + 4);
  assert.equal(view.getUint32(0), 2976);
  assert.equal(view.getUint32(4), 4209);
  assert.equal(view.getUint16(8), 42);
  assert.equal(view.getUint32(12), 2892);
  assert.equal(view.getUint32(16), 4125);
});

test("쪽 끝 · 작업 끝", () => {
  assert.deepEqual([...escprEndPage(false)], [0x1b, 0x70, 1, 0, 0, 0, 0x65, 0x6e, 0x64, 0x70, 0]);
  const f = Buffer.from(escprJobFooter()).toString("latin1");
  assert.ok(f.startsWith("\x1bj\x00\x00\x00\x00endj\x1b@\x1b(R\x08\x00\x00REMOTE1JE\x01\x00\x00\x1b\x00\x00\x00"));
});
