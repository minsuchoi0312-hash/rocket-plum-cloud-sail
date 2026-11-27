import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConnectLink, parseConnectLink } from "./connect-link.ts";

const PAGE = "https://minsuchoi0312-hash.github.io/nuguna-print-legal/connect.html";

test("앱 링크는 공개 페이지 # 뒤에 IP · 이름만 담고 도우미는 뺀다", () => {
  const link = buildConnectLink({ ip: "192.168.0.100", name: "3층 복사기", helper: { url: "http://127.0.0.1:47631", code: "123456" } }, { page: PAGE, withHelper: true });
  assert.ok(link.startsWith(`${PAGE}#`));
  assert.ok(!link.includes("?"));
  assert.ok(!link.includes("helper") && !link.includes("123456"));
  assert.deepEqual(parseConnectLink(link), { ip: "192.168.0.100", name: "3층 복사기", helper: "", code: "" });
});

test("웹 링크는 ?ip= 로, 고르면 도우미도 담는다", () => {
  const link = buildConnectLink({ ip: "10.0.0.5", name: "A", helper: { url: "http://192.168.0.6:47631", code: "654321" } }, { origin: "https://print.example/", withHelper: true });
  assert.equal(link, "https://print.example/?ip=10.0.0.5&name=A&helper=http%3A%2F%2F192.168.0.6%3A47631&code=654321");
  assert.deepEqual(parseConnectLink(link), { ip: "10.0.0.5", name: "A", helper: "http://192.168.0.6:47631", code: "654321" });
});

test("앱 주소(nugunaprint://connect)도 읽는다", () => {
  assert.deepEqual(parseConnectLink("nugunaprint://connect?ip=192.168.0.100&name=28BW-4"), { ip: "192.168.0.100", name: "28BW-4", helper: "", code: "" });
});

test("연결 링크가 아니거나 위험한 값은 버린다", () => {
  for (const bad of ["", "hello", "https://example.com/", "https://example.com/?ip=999.1.1.1", "javascript:alert(1)//?ip=192.168.0.1", "file:///x?ip=192.168.0.1", "WIFI:S:home;T:WPA;P:pw;;", null, 42]) {
    assert.equal(parseConnectLink(bad), null, String(bad));
  }
  /* 외부 도우미 주소는 버리고, 코드도 같이 버린다 */
  assert.deepEqual(parseConnectLink("https://x.example/?ip=192.168.0.9&helper=http://evil.example:47631&code=111111"), { ip: "192.168.0.9", name: "", helper: "", code: "" });
  /* 이름의 제어 문자 · 길이 */
  assert.equal(parseConnectLink(`https://x.example/#ip=192.168.0.9&name=${encodeURIComponent("a\u0000b" + "c".repeat(80))}`)?.name.length, 40);
});
