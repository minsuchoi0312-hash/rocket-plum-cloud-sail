import { test } from "node:test";
import assert from "node:assert/strict";
import { packFor } from "./print-packs.ts";

const pick = (model: string, extra: { cmd?: string; ipp?: boolean; raw9100?: boolean } = {}) => {
  const choice = packFor({ model, raw9100: true, ...extra });
  return `${choice.need.id}${choice.need.ready ? "" : "(준비 중)"}`;
};

test("찾은 프린터 → 알맞은 팩", () => {
  assert.equal(pick("HP LaserJet Pro M404dn", { cmd: "application/pdf,application/vnd.hp-pcl" }), "laser");
  assert.equal(pick("HP Deskjet 970C"), "inkjet");
  assert.equal(pick("HP ENVY 6000", { ipp: true, cmd: "application/pdf,image/urf" }), "standard");
  assert.equal(pick("EPSON L3150 Series"), "epson");
  assert.equal(pick("Samsung M2020 Series"), "spl");
  assert.equal(pick("Samsung SCX-4100"), "spl");
  assert.equal(pick("Samsung CLP-500"), "spl");
  assert.equal(pick("Epson Stylus C80"), "inkjet(준비 중)");
  assert.equal(pick("Kyocera FS-1020D"), "laser");
  assert.equal(pick("Epson Stylus C80", { ipp: true, cmd: "application/pdf" }), "standard");
  assert.equal(pick("Canon PIXMA MG3650", { ipp: true, cmd: "application/pdf,image/urf" }), "standard");
  assert.equal(pick("Canon PIXMA MP250"), "canon(준비 중)");
  assert.equal(pick("Canon MX870 series", { raw9100: false }), "canon");
  assert.equal(pick("Canon MG3600 series", { raw9100: false, ipp: true, cmd: "application/pdf,image/urf" }), "standard");
  assert.equal(pick("HP ENVY 6000"), "inkjet");
});

test("PCL 을 못 읽는 기기에 레이저 팩을 고르지 않아요", () => {
  /* 브라더 잉크젯 · 캐논 신형 잉크젯: IPP 가 PDF 를 받는다고 해도 표준 팩(래스터까지) */
  assert.equal(pick("Brother MFC-J4335DW", { ipp: true, cmd: "application/pdf,image/urf,image/pwg-raster" }), "standard");
  assert.equal(pick("Canon TS5300 series", { ipp: true, cmd: "image/urf,image/pwg-raster,image/jpeg" }), "standard");
  assert.equal(pick("Canon G3010 series", { ipp: true, cmd: "application/pdf,image/urf" }), "standard");
  /* PDF 만 말하는 IPP 기기 → 표준 팩, IPP 없이 9100 + PDF → 레이저(PDF Direct) */
  assert.equal(pick("Generic Office MFP", { ipp: true, cmd: "application/pdf,image/urf" }), "standard");
  assert.equal(pick("Generic Office MFP", { cmd: "PDF" }), "laser");
  /* 캐논 UFR II 레이저: IPP 면 표준, 아니면 아직 */
  assert.equal(pick("Canon LBP6030", { ipp: true, cmd: "UFR2" }), "standard");
  assert.equal(pick("Canon LBP6030", { cmd: "UFR2" }), "vendor(준비 중)");
  /* HP LIDIL DeskJet 은 PCL3 를 못 읽는다 → 잉크젯 팩으로 보내지 않고 '아직' */
  assert.equal(pick("HP Deskjet 3650", { cmd: "LDL,DW-PCL" }), "inkjet(준비 중)");
  /* 삼성 GDI(SPL)는 그대로 SPL 팩, 레이저 언어를 말하는 사무용은 그대로 레이저 팩 */
  assert.equal(pick("Samsung ML-2010", { cmd: "GDI" }), "spl");
  assert.equal(pick("KONICA MINOLTA bizhub 287", { ipp: true, cmd: "application/postscript,application/vnd.hp-pcl,application/pdf" }), "laser");
});

test("제조사 전용 방식 기기(호스트 기반 · 승화형 · 도트 · 대형)에 PCL 을 보내지 않아요", () => {
  for (const model of ["HP LaserJet 1020", "HP LaserJet Pro P1102w", "HP Color LaserJet CP1215", "Brother HL-2130", "Brother DCP-1610W", "Canon SELPHY CP1300", "Canon CP-100", "Epson LQ-590", "HP DesignJet 500"]) {
    assert.equal(pick(model), "vendor(준비 중)", model);
  }
  /* IPP(AirPrint)가 되면 표준 팩으로 */
  assert.equal(pick("Canon SELPHY CP1300", { ipp: true, cmd: "image/urf,image/jpeg" }), "standard");
  /* 레이저 언어를 분명히 말하면 그 말을 믿는다 */
  assert.equal(pick("HP LaserJet 1020", { cmd: "PJL,PCL" }), "laser");
  /* 일반 레이저는 그대로 레이저 팩 */
  for (const model of ["HP LaserJet P2055dn", "Brother HL-L2340D", "Kyocera FS-1020D", "Ricoh SP 3600DN"]) assert.equal(pick(model), "laser", model);
});

test("준비 중인 팩은 대신 보낼 길을 권한다", () => {
  const choice = packFor({ model: "Epson Stylus C80", raw9100: true, ipp: true });
  assert.equal(choice.need.ready, false);
  assert.equal(choice.fallback?.id, "standard");
});
