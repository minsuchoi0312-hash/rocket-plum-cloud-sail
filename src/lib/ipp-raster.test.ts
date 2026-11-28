import { test } from "node:test";
import assert from "node:assert/strict";
import { Bytes, encodeRaster, encodeRasterPage, packLine, planIpp, unpackBody, type RasterOptions, type RasterPage } from "./ipp-raster.ts";
import { getAttributesPacket, parseIppAttributes } from "./ipp-attrs.ts";

/** 가로 w · 세로 h RGBA 쪽 — fill(x, y) 가 [r, g, b] 를 준다 */
function page(w: number, h: number, fill: (x: number, y: number) => [number, number, number]): RasterPage {
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fill(x, y);
      rgba.set([r, g, b, 255], (y * w + x) * 4);
    }
  return { width: w, height: h, rgba };
}

const opts = (over: Partial<RasterOptions> = {}): RasterOptions => ({
  format: "image/pwg-raster",
  dpi: 300,
  space: "srgb",
  points: { width: 595, height: 842 },
  mediaName: "iso_a4_210x297mm",
  duplex: "simplex",
  sheetBack: "normal",
  totalPages: 1,
  ...over,
});

test("줄 압축은 풀면 그대로예요 (반복 · 낱개 · 128 넘는 반복)", () => {
  const line = new Uint8Array([...Array(300).fill(255), 1, 2, 3, 4, 5, 9, 9, 7]);
  const out = new Bytes();
  packLine(line, 1, out);
  const body = new Uint8Array([0, ...out.done()]);
  assert.deepEqual([...unpackBody(body, line.length, 1, 1)[0]], [...line]);
});

test("PWG 래스터: 머리 · 크기 · 색 공간 · 본문", () => {
  const p = page(10, 6, (x, y) => (y < 3 ? [255, 255, 255] : [x * 20, 0, 0]));
  const file = encodeRaster([p], opts());
  assert.equal(new TextDecoder().decode(file.subarray(0, 4)), "RaS2");
  const head = new DataView(file.buffer, 4, 1796);
  assert.equal(new TextDecoder().decode(file.subarray(4, 13)), "PwgRaster");
  assert.equal(head.getUint32(276), 300);
  assert.equal(head.getUint32(352), 595);
  assert.equal(head.getUint32(372), 10);
  assert.equal(head.getUint32(376), 6);
  assert.equal(head.getUint32(388), 24);
  assert.equal(head.getUint32(392), 30);
  assert.equal(head.getUint32(400), 19);
  const lines = unpackBody(file.subarray(4 + 1796), 10, 6, 3);
  assert.equal(lines.length, 6);
  assert.deepEqual([...lines[0].subarray(0, 3)], [255, 255, 255]);
  assert.deepEqual([...lines[5].subarray(27, 30)], [180, 0, 0]);
});

test("URF(AirPrint): UNIRAST 머리 · 회색 8비트 · 양면 표시", () => {
  const p = page(4, 2, () => [0, 0, 0]);
  const file = encodeRaster([p, p], opts({ format: "image/urf", space: "sgray", duplex: "long", totalPages: 2 }));
  assert.equal(new TextDecoder().decode(file.subarray(0, 7)), "UNIRAST");
  assert.equal(new DataView(file.buffer).getUint32(8), 2);
  const head = file.subarray(12, 44);
  assert.equal(head[0], 8);
  assert.equal(head[1], 0);
  assert.equal(head[2], 3);
  assert.equal(new DataView(head.buffer, head.byteOffset).getUint32(12), 4);
  const lines = unpackBody(file.subarray(44), 4, 2, 1);
  assert.deepEqual([...lines[1]], [0, 0, 0, 0]);
});

test("양면 뒷면은 프린터가 원하는 대로 뒤집어요 (flipped · 긴 쪽 = 위아래)", () => {
  const p = page(2, 2, (_x, y) => (y === 0 ? [0, 0, 0] : [255, 255, 255]));
  const o = opts({ space: "sgray", duplex: "long", sheetBack: "flipped", totalPages: 2 });
  const front = unpackBody(encodeRasterPage(p, o, 0).subarray(1796), 2, 2, 1);
  const back = unpackBody(encodeRasterPage(p, o, 1).subarray(1796), 2, 2, 1);
  assert.deepEqual([...front[0]], [0, 0]);
  assert.deepEqual([...back[0]], [255, 255]);
});

test("받는 형식에 맞춰 보낼 길을 골라요", () => {
  const plan = (formats: string[], extra: Record<string, string[]> = {}, want = { gray: false, photo: false, duplex: false }) => planIpp({ "document-format-supported": formats, ...extra }, want);
  assert.equal(plan(["application/pdf", "image/urf"]).format, "application/pdf");
  assert.equal(plan(["image/urf", "image/jpeg"], { "urf-supported": ["V1.4", "RS300-600", "SRGB24", "W8", "DM3"] }).format, "image/urf");
  assert.equal(plan(["image/urf"], { "urf-supported": ["RS300-600", "DM3"] }).sheetBack, "rotated");
  assert.equal(plan(["image/pwg-raster", "image/urf"], { "pwg-raster-document-resolution-supported": ["600x600dpi", "300x300dpi"] }).format, "image/pwg-raster");
  assert.equal(plan(["image/pwg-raster"], { "pwg-raster-document-resolution-supported": ["360x360dpi", "720x720dpi"] }).dpi, 360);
  assert.equal(plan(["image/pwg-raster"], { "pwg-raster-document-type-supported": ["sgray_8"] }, { gray: false, photo: false, duplex: false }).space, "sgray");
  assert.equal(plan(["image/urf", "image/jpeg"], {}, { gray: false, photo: true, duplex: false }).format, "image/jpeg");
  assert.equal(plan(["image/jpeg"]).format, "image/jpeg");
  assert.equal(plan(["application/vnd.hp-pcl"]).format, null);
  assert.equal(plan(["image/urf"], { "sides-supported": ["one-sided"] }).duplexOk, false);
  assert.equal(planIpp(null, { gray: false, photo: false, duplex: false }).guessed, true);
});

test("IPP 응답에서 프린터 속성을 읽어요 (정수 · 해상도 · 여러 값 · 묶음 건너뛰기)", () => {
  const enc = new TextEncoder();
  const parts: number[] = [2, 0, 0, 0, 0, 0, 0, 1, 0x04];
  const put = (tag: number, name: string, value: Uint8Array) => {
    const n = enc.encode(name);
    parts.push(tag, n.length >> 8, n.length & 255, ...n, value.length >> 8, value.length & 255, ...value);
  };
  put(0x49, "document-format-supported", enc.encode("image/urf"));
  put(0x49, "", enc.encode("image/pwg-raster"));
  put(0x34, "media-col-default", new Uint8Array());
  put(0x4a, "", enc.encode("media-size"));
  put(0x34, "", new Uint8Array());
  put(0x4a, "", enc.encode("x-dimension"));
  put(0x21, "", new Uint8Array([0, 0, 0x52, 0x08]));
  put(0x37, "", new Uint8Array());
  put(0x37, "", new Uint8Array());
  put(0x32, "pwg-raster-document-resolution-supported", new Uint8Array([0, 0, 1, 44, 0, 0, 1, 44, 3]));
  put(0x21, "copies-default", new Uint8Array([0, 0, 0, 1]));
  parts.push(0x03);
  const attrs = parseIppAttributes(new Uint8Array(parts));
  assert.deepEqual(attrs["document-format-supported"], ["image/urf", "image/pwg-raster"]);
  assert.deepEqual(attrs["pwg-raster-document-resolution-supported"], ["300x300dpi"]);
  assert.deepEqual(attrs["copies-default"], ["1"]);
  assert.equal(attrs["media-col-default"], undefined);
});

test("Get-Printer-Attributes 요청: 작업 번호 0x000B · 여러 속성 이름", () => {
  const packet = getAttributesPacket("192.168.0.10", { major: 2, minor: 0, path: "/ipp/print" });
  assert.equal(packet[2], 0x00);
  assert.equal(packet[3], 0x0b);
  const text = new TextDecoder().decode(packet);
  assert.ok(text.includes("requested-attributes"));
  assert.ok(text.includes("urf-supported"));
  assert.ok(text.includes("ipp://192.168.0.10:631/ipp/print"));
});
