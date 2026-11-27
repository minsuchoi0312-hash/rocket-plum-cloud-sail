import { test } from "node:test";
import assert from "node:assert/strict";
import { pendingGlyphs, sheetGlyphs } from "./font-ready.ts";

test("같은 글자는 한 번만, 공백 · 줄바꿈은 빼요", () => {
  assert.equal(pendingGlyphs("가 가\n나다다"), "가나다");
});

test("이미 받은 글자는 빼요", () => {
  assert.equal(pendingGlyphs("수험표 A4", new Set(["수", "A"])), "험표4");
});

test("빈칸뿐이면 받을 글자가 없어요", () => {
  assert.equal(pendingGlyphs("  \n", new Set()), "");
});

test("인쇄 이미지 글자에 테스트 쪽 문구와 사용자 글이 들어가요", () => {
  const text = sheetGlyphs("내 메모 제목");
  assert.ok(text.includes("테스트 페이지"));
  assert.ok(text.includes("내 메모 제목"));
});
