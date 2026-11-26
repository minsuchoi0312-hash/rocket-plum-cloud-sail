import { test } from "node:test";
import assert from "node:assert/strict";
import { splBandPacket, splCompress, splGeometry, splJobFooter, splJobHeader, splPageHeader, splProfile } from "./spl.ts";

/** 0x11 해제(프린터가 하는 일) */
function unpack(packed: Uint8Array, size: number) {
  const view = new DataView(packed.buffer, packed.byteOffset);
  const head = view.getUint32(0, true);
  const table = Array.from({ length: 64 }, (_, i) => view.getUint16(4 + i * 2, true));
  const out = new Uint8Array(size);
  let r = 4 + 128;
  let w = 0;
  for (let i = 0; i < head; i++) out[w++] = packed[r++];
  while (r < packed.length) {
    const b = packed[r++];
    if (b & 0x80) {
      const b2 = packed[r++];
      const n = (b & 0x7f) | ((b2 & 0xc0) << 1);
      const d = table[b2 & 0x3f];
      for (let k = 0; k < n + 3; k++, w++) out[w] = out[w - d];
    } else {
      for (let k = 0; k <= b; k++) out[w++] = packed[r++];
    }
  }
  assert.equal(w, size, "풀린 길이");
  return out;
}

function sampleBand(bytes: number, height: number) {
  const data = new Uint8Array(bytes * height).fill(0xff);
  /* 글자처럼 띄엄띄엄 검은 점 · 긴 선 · 섞인 바이트 */
  for (let x = 40; x < 300; x++) for (let y = 20; y < 30; y++) data[x * height + y] = 0x00;
  for (let x = 100; x < 140; x++) for (let y = 50; y < 110; y++) data[x * height + y] = (x * 31 + y * 7) & 0xff;
  return data;
}

test("0x11 압축이 원래대로 풀린다", () => {
  const data = sampleBand(608, 128);
  const packed = splCompress(data);
  assert.ok(packed && packed.length < data.length / 4, "흰 바탕은 크게 줄어야 함");
  assert.deepEqual(unpack(packed, data.length), data);
});

test("0x11 압축: 긴 같은 바이트(거리 1)와 128바이트 넘는 날 데이터", () => {
  const data = new Uint8Array(20000);
  for (let i = 0; i < 5000; i++) data[i] = (i * 2654435761) >>> 24; // 되풀이 없는 구간
  data.fill(0xff, 5000);
  const packed = splCompress(data);
  assert.ok(packed);
  assert.deepEqual(unpack(packed, data.length), data);
});

test("띠 패킷: 머리 · 서명 · 체크섬", () => {
  const data = sampleBand(620, 128);
  const p = splBandPacket(3, 620, 128, data)!;
  assert.deepEqual([...p.subarray(0, 7)], [0x0c, 3, 0x13, 0x60, 0x00, 0x80, 0x11]);
  const size = new DataView(p.buffer, p.byteOffset).getUint32(7);
  assert.equal(p.length, 11 + size);
  assert.deepEqual([...p.subarray(11, 15)], [0xef, 0xcd, 0xab, 0x09]);
  const body = p.subarray(15, p.length - 4);
  let sum = 0xef + 0xcd + 0xab + 0x09;
  for (const b of body) sum += b;
  assert.equal(new DataView(p.buffer, p.byteOffset).getUint32(p.length - 4), sum >>> 0);
  assert.deepEqual(unpack(body, data.length), data);
});

test("A4 · 600dpi 크기, 기종별 설정", () => {
  const m2020 = splProfile("Samsung M2020 Series")!;
  assert.equal(m2020.band, "special");
  const geo = splGeometry("A4", m2020);
  assert.equal(geo.bandBytes, 608);
  assert.equal(geo.width300, 2480);
  assert.equal(geo.height300, 3509);
  assert.equal(geo.paperType, 2);
  assert.equal(splGeometry("A4", splProfile("ML-2160")!).bandBytes, 620);
  assert.equal(splProfile("ML-1610")!.dpi, 300);
  assert.equal(splProfile("ML-2010")!.qpdl, 2);
  assert.equal(splProfile("SCX-4100"), null);
  assert.equal(splProfile("CLP-315"), null);
  const head = splPageHeader(geo, m2020, 2);
  assert.deepEqual([...head], [0, 6, 0, 2, 2, 0x09, 0xb0, 0x0d, 0xb5, 1, 0, 1, 0, 0, 3, 1, 6]);
});

test("PJL 머리 · 꼬리", () => {
  const text = Buffer.from(splJobHeader({ name: "누구 test", date: new Date(2026, 10, 26) })).toString("latin1");
  assert.ok(text.startsWith("\x1b%-12345X@PJL DEFAULT SERVICEDATE=20261126\n"));
  /* 한글 등 ASCII 밖 글자는 PJL 에 넣지 않는다 */
  assert.ok(text.includes('@PJL SET JOBNAME=" test"\n'));
  assert.ok(text.endsWith("@PJL ENTER LANGUAGE = QPDL\n"));
  assert.equal(Buffer.from(splJobFooter()).toString("latin1"), "\t\x1b%-12345X");
});
