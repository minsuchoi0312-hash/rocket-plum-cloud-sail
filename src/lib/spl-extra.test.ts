import { test } from "node:test";
import assert from "node:assert/strict";
import { band0x0d, colorBandRecord, compress0x0d, compress0x0e, decode0x0d, decode0x0e } from "./spl-extra.ts";
import { splGeometry, splJobHeader, splPageHeader, splProfile } from "./spl.ts";

/** 줄 우선 1비트 띠: 글자처럼 띄엄띄엄 · 가로선 · 여러 빈 줄 */
function rowsSample(lineBytes: number, height: number, dense = false) {
  const rows = new Uint8Array(lineBytes * height);
  const set = (x: number, y: number) => (rows[y * lineBytes + (x >> 3)] |= 0x80 >> (x & 7));
  for (let x = 30; x < 900; x++) set(x, 3);
  for (let y = 10; y < 40; y++) for (let x = 100; x < 140; x += 3) set(x, y);
  for (let x = 4000; x < 4100; x++) set(x, 90);
  if (dense) for (let y = 50; y < 52; y++) for (let x = 0; x < lineBytes * 8; x += 2) set(x, y);
  return rows;
}

test("0x0D: 띄엄띄엄 그림은 0x0D 로 줄고 원래대로 풀려요", () => {
  const lineBytes = 620;
  const rows = rowsSample(lineBytes, 128);
  const packed = compress0x0d(rows, lineBytes, 128, 600);
  assert.ok(packed, "0x0D 로 되어야 함");
  assert.equal(packed!.length % 4, 0);
  assert.deepEqual(decode0x0d(packed!, lineBytes, 128), rows);
});

test("0x0D 가 못 하는 빽빽한 줄은 띠 전체가 0x0E 로", () => {
  const lineBytes = 620;
  const rows = rowsSample(lineBytes, 128, true);
  assert.equal(compress0x0d(rows, lineBytes, 128, 600), null);
  const packed = compress0x0e(rows, lineBytes, 128, 600);
  assert.equal(packed.length % 4, 0);
  assert.deepEqual(decode0x0e(packed, lineBytes, 128, 600), rows);
  const record = band0x0d(2, lineBytes, 128, rows, 600);
  assert.deepEqual([...record.subarray(0, 7)], [0x0c, 2, (lineBytes * 8) >> 8, (lineBytes * 8) & 255, 0, 128, 0x0e]);
});

test("0x0D 띠 패킷: 서명 없이 크기 = 본문 + 4, 끝은 본문 합", () => {
  const rows = rowsSample(620, 128);
  const record = band0x0d(0, 620, 128, rows, 600);
  assert.equal(record[6], 0x0d);
  const size = new DataView(record.buffer, record.byteOffset).getUint32(7);
  assert.equal(record.length, 11 + size);
  const body = record.subarray(11, record.length - 4);
  let sum = 0;
  for (const b of body) sum += b;
  assert.equal(new DataView(record.buffer, record.byteOffset).getUint32(record.length - 4), sum >>> 0);
});

test("컬러 띠: 첫 면만 긴 머리, 다음 면은 색 · 압축 · 크기, 끝에 00", () => {
  const record = colorBandRecord(5, 4960, 128, [
    [1, new Uint8Array([1, 2, 3])],
    [4, new Uint8Array([9])],
  ])!;
  assert.deepEqual([...record.subarray(0, 8)], [0x0c, 5, 0x13, 0x60, 0, 128, 1, 0x11]);
  /* 첫 면: 머리 8 + 크기 4 + 서명 4 + 본문 3 + 합 4 = 23 → 둘째 면은 23번째부터 */
  assert.deepEqual([...record.subarray(23, 25)], [4, 0x11]);
  assert.equal(record[record.length - 1], 0);
  assert.equal(colorBandRecord(0, 100, 128, []), null);
});

test("기종: 초기 SCX 는 0x0D, CLP-500 은 컬러 · 양면, JBIG 기종은 아직", () => {
  assert.equal(splProfile("Samsung SCX-4100")?.comp, 0x0d);
  assert.equal(splProfile("Samsung CLP-500")?.color, true);
  assert.equal(splProfile("Samsung CLP-500")?.duplex, true);
  assert.equal(splProfile("Samsung ML-3471ND")?.duplex, true);
  assert.equal(splProfile("Samsung M2675FN")?.duplex, true);
  assert.equal(splProfile("Samsung M2020")?.duplex, undefined);
  assert.equal(splProfile("Samsung CLP-300"), null);
  assert.equal(splProfile("Samsung ML-1860"), null);
});

test("양면: PJL DUPLEX · BINDING, 쪽 머리 0x0B(긴 쪽) · 0x0C(앞면)", () => {
  const head = new TextDecoder().decode(splJobHeader({ duplex: "long", color: true }));
  assert.ok(head.includes("@PJL SET COLORMODE=COLOR"));
  assert.ok(head.includes("@PJL SET DUPLEX=ON\n@PJL SET BINDING=LONGEDGE"));
  assert.ok(new TextDecoder().decode(splJobHeader()).includes("@PJL SET DUPLEX=OFF"));
  const profile = splProfile("Samsung ML-3471ND")!;
  const geo = splGeometry("A4", profile);
  const front = splPageHeader(geo, profile, 1, { duplex: "long", page: 1 });
  const back = splPageHeader(geo, profile, 1, { duplex: "long", page: 2 });
  const short = splPageHeader(geo, profile, 1, { duplex: "short", page: 1 });
  const simplex = splPageHeader(geo, profile, 1);
  assert.deepEqual([front[11], front[12]], [1, 1]);
  assert.deepEqual([back[11], back[12]], [1, 0]);
  assert.deepEqual([short[11], short[12]], [0, 1]);
  assert.deepEqual([simplex[11], simplex[12]], [1, 0]);
});
