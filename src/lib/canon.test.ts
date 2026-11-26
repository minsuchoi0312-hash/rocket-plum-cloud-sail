import { test } from "node:test";
import assert from "node:assert/strict";
import { canonBlock, canonGeometry, canonJobFooter, canonJobHeader, canonLine, canonPageSetup, canonProfile } from "./canon.ts";

/** ESC ( 명령을 순서대로 [이름, 인자] 로 */
function commands(bytes: Uint8Array) {
  const out: [string, number[]][] = [];
  let i = 0;
  while (i < bytes.length) {
    if (bytes[i] === 0x1b && bytes[i + 1] === 0x5b) {
      const len = bytes[i + 3] | (bytes[i + 4] << 8);
      const args = [...bytes.subarray(i + 5, i + 5 + len)];
      i += 5 + len;
      if (args[1] === 0x1f) {
        const end = Buffer.from(bytes.subarray(i)).indexOf("BJLEND\n") + 7;
        out.push(["BJL", [...Buffer.from(bytes.subarray(i, i + end))]]);
        i += end;
      } else out.push(["[K", args]);
      continue;
    }
    assert.equal(bytes[i], 0x1b, `ESC @${i}`);
    assert.equal(bytes[i + 1], 0x28);
    const name = String.fromCharCode(bytes[i + 2]);
    const len = bytes[i + 3] | (bytes[i + 4] << 8);
    out.push([name, [...bytes.subarray(i + 5, i + 5 + len)]]);
    i += 5 + len;
  }
  return out;
}

test("기종 표: 네트워크 PIXMA 만, AirPrint 신형 · 다른 상표는 null", () => {
  assert.equal(canonProfile("Canon PIXMA MX870 series")?.name, "PIXMA MX870");
  assert.equal(canonProfile("Canon MX880 series")?.name, "PIXMA MX880");
  assert.equal(canonProfile("Canon MG5250 series")?.name, "PIXMA MG5200");
  assert.equal(canonProfile("Canon PIXMA MG3650"), null);
  assert.equal(canonProfile("Canon PIXMA MX7600"), null);
  assert.equal(canonProfile("HP Deskjet 970C"), null);
});

test("A4 크기(여백 10 · 10 · 9 · 15pt, 300dpi)", () => {
  const geo = canonGeometry("A4");
  assert.deepEqual([geo.pageW, geo.pageH, geo.width, geo.height, geo.lineBytes, geo.code], [575, 818, 2395, 3408, 300, 3]);
  assert.equal(canonGeometry("A3").code, 3, "못 받는 용지는 A4");
});

test("MX870 쪽 시작: 명령 순서와 값", () => {
  const profile = canonProfile("MX870")!;
  const cmds = commands(canonPageSetup(profile, canonGeometry("A4"), true));
  assert.deepEqual(cmds.map(([n]) => n), ["BJL", "[K", "b", "q", "d", "t", "c", "p", "P", "l", "r", "I", "J", "L"]);
  const get = (n: string) => cmds.find(([name]) => name === n)![1];
  assert.equal(Buffer.from(get("BJL")).toString("latin1"), "BJLSTART\nControlMode=Common\nSetSilent=OFF\nBJLEND\n");
  assert.deepEqual(get("[K"), [0x00, 0x0f]);
  assert.deepEqual(get("d"), [0x01, 0x2c, 0x01, 0x2c]);
  const t = get("t");
  assert.equal(t.length, 13 * 3 + 3);
  assert.deepEqual(t.slice(0, 15), [0x80, 0x00, 0x01, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2]);
  assert.ok(t.slice(15).every((v) => v === 0));
  assert.deepEqual(get("c"), [0x30, 0x00, 0x01]);
  const p = Buffer.from(get("p"));
  assert.equal(p.length, 46);
  assert.deepEqual([p.readUInt16BE(0), p.readUInt16BE(4), p.readUInt16BE(12), p.readUInt32BE(14), p.readUInt32BE(18), p.readUInt32BE(22), p.readUInt32BE(26), p.readUInt32BE(38), p.readUInt32BE(42)], [682, 480, 600, 83, 75, 4791, 6816, 4961, 7016]);
  assert.deepEqual(get("P"), [0x00, 0x03, 0x00, 0x00, 0x01, 0x00]);
  assert.deepEqual(get("l"), [0x3e, 0x00, 0x00]);
  assert.deepEqual(get("r"), [0x64]);
  assert.deepEqual(get("J"), [8]);
  assert.equal(Buffer.from(get("L")).toString("latin1"), "CMYK");
});

test("기종별 차이: MX340 은 (T · 급지 4, MP990 은 30자리 잉크 표 KCMY 배치, MX860 은 XML 없음 · (P 4바이트", () => {
  const mx340 = commands(canonPageSetup(canonProfile("MX340")!, canonGeometry("A4"), false));
  assert.deepEqual(mx340.map(([n]) => n), ["b", "q", "d", "t", "c", "p", "P", "T", "l", "I", "J", "L"]);
  assert.deepEqual(mx340.find(([n]) => n === "l")![1], [0x34, 0x00, 0x00]);
  const t = commands(canonPageSetup(canonProfile("MP990")!, canonGeometry("A4"), false)).find(([n]) => n === "t")![1];
  assert.equal(t.length, 30 * 3 + 3);
  for (const at of [0, 1, 3, 5]) assert.deepEqual(t.slice(3 + at * 3, 6 + at * 3), [1, 0, 2]);
  assert.deepEqual(t.slice(3 + 2 * 3, 6 + 2 * 3), [0, 0, 0]);
  const mx860 = canonProfile("MX860")!;
  assert.equal(canonJobHeader(mx860).length, 0);
  assert.deepEqual(commands(canonPageSetup(mx860, canonGeometry("A4"), false)).find(([n]) => n === "P")![1], [0x00, 0x03, 0x00, 0x00]);
  assert.ok(Buffer.from(canonJobHeader(canonProfile("MX870")!)).toString("latin1").includes("<ivec:operation>StartJob"));
  assert.ok(Buffer.from(canonJobFooter(canonProfile("MX870")!)).toString("latin1").startsWith("\x1b@<?xml"));
});

test("줄 · 묶음: 빈 줄은 0x80, 잉크 줄은 PackBits + 0x80", () => {
  assert.deepEqual([...canonLine(new Uint8Array(300))], [0x80]);
  const bits = new Uint8Array(300);
  bits.fill(0xff, 10, 20);
  const line = canonLine(bits);
  assert.equal(line[line.length - 1], 0x80);
  const block = canonBlock([line, Uint8Array.of(0x80)]);
  assert.deepEqual([...block.subarray(0, 3)], [0x1b, 0x28, 0x46]);
  assert.equal(block[3] | (block[4] << 8), line.length + 1);
});
