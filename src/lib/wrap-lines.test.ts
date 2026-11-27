import { test } from "node:test";
import assert from "node:assert/strict";
import { wrapMeasuredLines } from "./office-job.ts";

/* 글자 하나 = 폭 1 로 재는 가짜 자 */
const len = (s: string) => Array.from(s).length;

test("영어는 단어째 다음 줄로 넘겨요", () => {
  assert.deepEqual(wrapMeasuredLines("the lazy dog. Pack my box", len, 14), ["the lazy dog.", "Pack my box"]);
});

test("한 줄보다 긴 단어만 글자 단위로 잘라요", () => {
  assert.deepEqual(wrapMeasuredLines("abcdefghij", len, 4), ["abcd", "efgh", "ij"]);
});

test("빈 줄은 그대로, 줄 끝 공백은 버려요", () => {
  assert.deepEqual(wrapMeasuredLines("가나 다라\n\n마", len, 3), ["가나", "다라", "", "마"]);
});

test("베트남어 결합 부호를 글자에서 떼지 않아요", () => {
  const rows = wrapMeasuredLines("Nguyễn", (s) => s.normalize("NFC").length, 2);
  for (const row of rows) assert.ok(!/^[̀-ͯ]/.test(row));
});
