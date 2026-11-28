import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSubnet, toIPv4, toSubnet } from "./lan-find.ts";

test("직접 입력한 대역을 앞 세 마디로 바꿔요", () => {
  for (const input of ["192.168.50", " 192.168.50 ", "192.168.50.", "192.168.50.x", "192.168.50.X", "192.168.50.*", "192.168.50.0/24", "192.168.50.23", "192.168.50.1-254", "192.168.50.1~254", "192.168.50.0"]) {
    assert.equal(toSubnet(input), "192.168.50", input);
  }
  assert.equal(toSubnet("10.0.0"), "10.0.0");
  assert.equal(toSubnet("172.30.1"), "172.30.1");
  assert.equal(toSubnet("169.254.1"), "169.254.1");
});

test("폰 키보드 · 붙여넣기 모양도 받아요", () => {
  assert.equal(toSubnet("192,168,0"), "192.168.0", "쉼표");
  assert.equal(toSubnet("１９２．１６８．０"), "192.168.0", "전각");
  assert.equal(toSubnet("192.168. 0"), "192.168.0", "공백");
  assert.equal(toSubnet("192·168·0"), "192.168.0", "가운뎃점");
  assert.equal(toSubnet("http://192.168.0.10:9100/"), "192.168.0", "주소창 복사");
});

test("못 쓰는 대역은 이유를 알려 줘요", () => {
  for (const input of ["", "192.168", "192.168.300", "abc", "192.168.0.1.5", "192.168.00"]) {
    assert.deepEqual(parseSubnet(input), { ok: false, reason: "format" }, input);
  }
  assert.deepEqual(parseSubnet("192.168.0.0/16"), { ok: false, reason: "wide" });
  assert.deepEqual(parseSubnet("8.8.8"), { ok: false, reason: "public" });
  assert.deepEqual(parseSubnet("172.32.0"), { ok: false, reason: "public" });
  assert.deepEqual(parseSubnet("203.0.113.5"), { ok: false, reason: "public" });
});

test("복사기 IP 직접 입력도 정리해요", () => {
  assert.equal(toIPv4("192.168.0.10"), "192.168.0.10");
  assert.equal(toIPv4(" 192,168,0,10 "), "192.168.0.10");
  assert.equal(toIPv4("１９２．１６８．０．１０"), "192.168.0.10");
  assert.equal(toIPv4("http://192.168.0.10:631/ipp/print"), "192.168.0.10");
  assert.equal(toIPv4("192.168.0.10:9100"), "192.168.0.10");
  assert.equal(toIPv4("192.168.0"), null);
  assert.equal(toIPv4("192.168.0.256"), null);
  assert.equal(toIPv4("printer.local"), null);
});
