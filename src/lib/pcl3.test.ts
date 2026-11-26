import { test } from "node:test";
import assert from "node:assert/strict";
import { pcl3Geometry, pcl3JobFooter, pcl3JobHeader, pcl3Profile } from "./pcl3.ts";

test("HP 잉크젯만 고르고, 초기 3색 DeskJet 은 CMY", () => {
  assert.deepEqual(pcl3Profile("HP Deskjet 970C"), { inks: "kcmy" });
  assert.deepEqual(pcl3Profile("HP OfficeJet Pro 8500"), { inks: "kcmy" });
  assert.deepEqual(pcl3Profile("HP Business Inkjet 2800"), { inks: "kcmy" });
  assert.deepEqual(pcl3Profile("HP DeskJet 540C"), { inks: "cmy" });
  assert.equal(pcl3Profile("HP LaserJet Pro M404dn"), null);
  assert.equal(pcl3Profile("Epson Stylus C80"), null);
  assert.equal(pcl3Profile("Canon PIXMA MP250"), null);
});

test("A4 300dpi 인쇄 영역 · 시작 위치 · 용지 코드", () => {
  const geo = pcl3Geometry("A4");
  /* 210mm − 36pt, 297mm − 54pt @300dpi */
  assert.equal(geo.width, 2330);
  assert.equal(geo.height, 3282);
  assert.equal(geo.left, 180);
  assert.equal(geo.top, 180);
  assert.equal(geo.code, 26);
  assert.equal(pcl3Geometry("Letter").code, 2);
});

test("작업 머리 · 꼬리", () => {
  assert.equal(Buffer.from(pcl3JobHeader({ paper: "A4", copies: 2 })).toString("latin1"), "\x1bE\x1b&l26A\x1b&l0O\x1b&l0L\x1b&l0E\x1b&l0M\x1b&l2X");
  assert.equal(Buffer.from(pcl3JobFooter()).toString("latin1"), "\x1bE");
});
