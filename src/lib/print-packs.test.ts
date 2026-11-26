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
  assert.equal(pick("Samsung SCX-4100"), "spl(준비 중)");
  assert.equal(pick("Epson Stylus C80"), "inkjet(준비 중)");
  assert.equal(pick("Kyocera FS-1020D"), "laser");
  assert.equal(pick("Epson Stylus C80", { ipp: true, cmd: "application/pdf" }), "standard");
  assert.equal(pick("Canon PIXMA MG3650", { ipp: true, cmd: "application/pdf,image/urf" }), "standard");
  assert.equal(pick("Canon PIXMA MP250"), "canon(준비 중)");
  assert.equal(pick("HP ENVY 6000"), "inkjet");
});

test("준비 중인 팩은 대신 보낼 길을 권한다", () => {
  const choice = packFor({ model: "Epson Stylus C80", raw9100: true, ipp: true });
  assert.equal(choice.need.ready, false);
  assert.equal(choice.fallback?.id, "standard");
});
