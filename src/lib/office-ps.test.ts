import { test } from "node:test";
import assert from "node:assert/strict";
import { ascii85, psJobFooter, psJobHeader, psPage, speaksPostScript } from "./office-job.ts";

/** ASCII85 풀기 (테스트용) */
function unascii85(text: string) {
  const body = text.replace(/\s+/g, "").replace(/~>$/, "");
  const out: number[] = [];
  let group: number[] = [];
  const flush = (n: number) => {
    while (group.length < 5) group.push(84);
    let value = 0;
    for (const d of group) value = value * 85 + d;
    const bytes = [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
    out.push(...bytes.slice(0, n));
    group = [];
  };
  for (const ch of body) {
    if (ch === "z" && group.length === 0) {
      out.push(0, 0, 0, 0);
      continue;
    }
    group.push(ch.charCodeAt(0) - 33);
    if (group.length === 5) flush(4);
  }
  if (group.length) flush(group.length - 1);
  return new Uint8Array(out);
}

test("ASCII85: 알려진 값 · 0 묶음(z) · 끝 자투리 · 되풀기", () => {
  assert.equal(ascii85(new TextEncoder().encode("Man ")).replace(/\s/g, ""), "9jqo^~>");
  assert.ok(ascii85(new Uint8Array([0, 0, 0, 0, 1])).startsWith("z"));
  const data = new Uint8Array(1003).map((_, i) => (i * 37 + 11) & 255);
  assert.deepEqual([...unascii85(ascii85(data))], [...data]);
});

test("PostScript 를 말하는 기기 알아보기", () => {
  assert.equal(speaksPostScript("application/postscript,application/vnd.hp-pcl,application/pdf"), true);
  assert.equal(speaksPostScript("PJL,PCL,PCLXL,POSTSCRIPT"), true);
  assert.equal(speaksPostScript("PCL5e,PS"), true);
  assert.equal(speaksPostScript("KPDL,PCL"), true);
  assert.equal(speaksPostScript("BR-Script3,PCL"), true);
  assert.equal(speaksPostScript("application/pdf,image/urf"), false);
  assert.equal(speaksPostScript("PCL5e,PCLXL"), false);
  assert.equal(speaksPostScript(""), false);
});

test("PS 작업: PJL 머리(부수 · 양면 · 보안) → setpagedevice → 쪽 → 꼬리", () => {
  const head = new TextDecoder().decode(psJobHeader({ copies: 2, duplex: "long", paper: "A4", pages: 3, secure: { pin: "1234", user: "kim" } }));
  assert.ok(head.startsWith("\x1b%-12345X@PJL"));
  assert.ok(head.includes("@PJL SET QTY=2"));
  assert.ok(head.includes("@PJL SET DUPLEX=ON"));
  assert.ok(head.includes("@PJL SET HOLDKEY=1234"));
  assert.ok(head.includes("@PJL ENTER LANGUAGE=POSTSCRIPT"));
  assert.ok(head.includes("%!PS-Adobe-3.0"));
  assert.ok(head.includes("/PageSize [595 842] /Duplex true /Tumble false"));
  const page = new TextDecoder().decode(psPage(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), 2400, 3300, "A4", 0));
  assert.ok(page.startsWith("%%Page: 1 1"));
  assert.ok(page.includes("/DCTDecode filter"));
  assert.ok(page.includes("showpage"));
  /* 2400px @300dpi = 576pt → A4(595pt) 가운데: (595-576)/2 = 9.5 */
  assert.ok(page.includes("9.50 "));
  const land = new TextDecoder().decode(psPage(new Uint8Array([1]), 3300, 2400, "A4", 1));
  assert.ok(land.includes("90 rotate"));
  assert.ok(new TextDecoder().decode(psJobFooter()).includes("@PJL EOJ"));
});
