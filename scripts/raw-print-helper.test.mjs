// PC 도우미(public/raw-print-helper.mjs) 보안 규칙 테스트
// 실행: node --test scripts/raw-print-helper.test.mjs
import assert from "node:assert/strict";
import http from "node:http";
import { after, before, test } from "node:test";
import { createHelper, isPrivateHost } from "../public/raw-print-helper.mjs";

const CODE = "123456";
let server;
let port;

before(async () => {
  /* 검색은 실제 네트워크를 훑지 않게 가짜로 바꾼다 */
  server = createHelper({ code: CODE, discover: async () => ({ printers: [] }) });
  await new Promise((resolve) => server.listen(0, "0.0.0.0", resolve));
  port = server.address().port;
});

after(() => new Promise((resolve) => server.close(resolve)));

/** from: 보내는 쪽 주소(127.0.0.x)로 다른 기기를 흉내 낸다 */
function call(path, { code, from = "127.0.0.1", method = "GET" } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path, method, localAddress: from, headers: code === undefined ? {} : { "X-Helper-Code": code } },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null, headers: res.headers }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

test("ping은 코드 없이 응답하고 코드가 필요하다고 알린다", async () => {
  const r = await call("/ping");
  assert.equal(r.status, 200);
  assert.equal(r.body.needsCode, true);
  assert.equal(r.headers["access-control-allow-private-network"], "true");
});

test("코드가 없거나 틀리면 401", async () => {
  assert.equal((await call("/check", { from: "127.0.0.5" })).status, 401);
  assert.equal((await call("/check", { code: "000000", from: "127.0.0.5" })).status, 401);
});

test("맞는 코드는 통과", async () => {
  assert.equal((await call("/check", { code: CODE, from: "127.0.0.6" })).status, 200);
});

test("틀린 코드 10번이면 그 기기만 1분간 막히고, 다른 기기는 그대로 쓴다", async () => {
  const attacker = "127.0.0.2";
  for (let i = 0; i < 10; i++) assert.equal((await call("/check", { code: "999999", from: attacker })).status, 401);
  /* 막힌 뒤에는 맞는 코드를 보내도 429 — 맞혀 보기(무차별 대입)를 막는다 */
  assert.equal((await call("/check", { code: CODE, from: attacker })).status, 429);
  /* 같은 와이파이의 다른 기기(진짜 사용자)는 영향을 받지 않는다 */
  assert.equal((await call("/check", { code: CODE, from: "127.0.0.3" })).status, 200);
});

test("인터넷 주소나 허용 안 된 포트로는 보내지 않는다", async () => {
  const ok = { code: CODE, from: "127.0.0.7" };
  assert.equal((await call("/probe?ip=8.8.8.8&port=9100", ok)).status, 400);
  assert.equal((await call("/probe?ip=192.168.0.10&port=22", ok)).status, 400);
  assert.equal((await call("/probe?ip=127.0.0.1&port=9100", ok)).status, 400);
  assert.equal((await call("/discover?subnet=8.8.8", ok)).status, 400);
  assert.equal((await call("/discover?subnet=192.168.0", ok)).status, 200);
});

test("사설 주소 판별", () => {
  for (const ip of ["10.0.0.5", "172.16.1.2", "172.31.255.1", "192.168.0.100", "169.254.3.4"]) assert.equal(isPrivateHost(ip), true, ip);
  for (const ip of ["8.8.8.8", "172.32.0.1", "192.169.0.1", "127.0.0.1", "localhost", "192.168.0.1.evil.com", ""]) assert.equal(isPrivateHost(ip), false, ip);
});
