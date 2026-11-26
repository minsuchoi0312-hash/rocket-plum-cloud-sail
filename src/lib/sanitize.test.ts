import { test } from "node:test";
import assert from "node:assert/strict";
import { localHelperOrigin } from "./sanitize.ts";

test("링크로 받은 도우미 주소는 이 기기 · 사설망만 허용", () => {
  for (const ok of ["http://127.0.0.1:47631", "http://localhost:47631/", "http://192.168.0.6:47631", "http://10.0.0.5:47631", "http://172.20.1.2:47631", "http://my-pc.local:47631"]) {
    assert.notEqual(localHelperOrigin(ok), "", ok);
  }
  for (const bad of ["http://evil.example:47631", "https://8.8.8.8", "http://172.32.0.1:47631", "http://192.169.0.1", "javascript:alert(1)", "http://user:pw@127.0.0.1:47631", "", null]) {
    assert.equal(localHelperOrigin(bad), "", String(bad));
  }
});
