import { test } from "node:test";
import assert from "node:assert/strict";
import { IPP_TRIES, ippRetryable, ippStatus, printJobPacket } from "./ipp-send.ts";

const text = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);
const opts = { copies: 1, duplex: "long" as const, paper: "A4" as const, gray: true };

test("최신 판: IPP 2.0 · /ipp/print · PWG 용지 이름 · 양면 긴 쪽", () => {
  const p = printJobPacket("10.0.0.5", new Uint8Array([0x25]), opts);
  assert.deepEqual([p[0], p[1], p[2], p[3]], [2, 0, 0, 2]);
  const t = text(p);
  assert.ok(t.includes("ipp://10.0.0.5:631/ipp/print"));
  assert.ok(t.includes("two-sided-long-edge"));
  assert.ok(t.includes("iso_a4_210x297mm"));
  assert.ok(t.includes("print-color-mode"));
});

test("코니카 · 옛 기기: IPP 1.1 · /ipp · 옛 용지 이름, 2.0 전용 속성은 빼요", () => {
  const konica = IPP_TRIES.find((t) => t.path === "/ipp")!;
  const p = printJobPacket("192.168.0.100", new Uint8Array([0x25]), { ...opts, duplex: "short" }, konica);
  assert.deepEqual([p[0], p[1]], [1, 1]);
  const t = text(p);
  assert.ok(t.includes("ipp://192.168.0.100:631/ipp\u0000") || t.includes("ipp://192.168.0.100:631/ipp"));
  assert.ok(!t.includes("/ipp/print"));
  assert.ok(t.includes("two-sided-short-edge"));
  assert.ok(t.includes("iso-a4"));
  assert.ok(!t.includes("print-color-mode"));
});

test("IPP 상태 읽기와 다시 해 볼 거절", () => {
  assert.equal(ippStatus(new Uint8Array([1, 1, 0x05, 0x03])), 0x0503);
  assert.equal(ippStatus(new Uint8Array([1])), null);
  assert.equal(ippRetryable(200, 0x0503), true);
  assert.equal(ippRetryable(404, null), true);
  assert.equal(ippRetryable(200, 0x0401), false);
});
