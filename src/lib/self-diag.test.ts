// 자가진단 판정: 웹(브라우저)과 앱(APK)에서 1 · 3단계가 다르게 판정되는지
// 실행: node --experimental-strip-types --test src/lib/self-diag.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { judgeEnv } from "./self-diag.ts";
import { tr } from "./i18n/core.ts";

const env = { browser: "Chrome 145", os: "Android 17", inApp: false, webUsb: false, serviceWorker: false, online: true };

test("웹 브라우저: 오프라인 준비(서비스 워커)가 안 됐으면 주의 + 새로고침 안내", () => {
  const step = judgeEnv(env);
  assert.equal(step.level, "warn");
  assert.equal(step.fix?.action, "reload");
});

test("앱(APK): 화면이 앱에 들어 있어 오프라인 준비 · WebUSB 경고를 하지 않는다", () => {
  const g = globalThis as { window?: unknown };
  g.window = { __nugunaPhone: true };
  try {
    const step = judgeEnv(env);
    assert.equal(step.level, "pass");
    assert.equal(step.fix, undefined);
    assert.ok(step.detail.includes(tr("diag.envApp")));
  } finally {
    delete g.window;
  }
});

test("카카오톡 같은 앱 안 브라우저는 여전히 실패로 알린다", () => {
  assert.equal(judgeEnv({ ...env, inApp: true }).level, "fail");
});
