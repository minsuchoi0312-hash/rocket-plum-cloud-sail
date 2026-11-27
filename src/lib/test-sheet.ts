/**
 * 실제 복합기 점검용 테스트 시트.
 * 어느 해상도의 캔버스에도 같은 배치(mm 단위)로 그린다: 화면 미리보기, PDF 저장, IPP, USB PCL 모두 같은 그림.
 * 문구는 지금 화면 언어로 찍는다(언어별 글꼴 깨짐 점검에도 쓸 수 있어요).
 */
import { currentLang, tr } from "./i18n/core.ts";
import { paperLabel, paperMm as tableMm } from "./office-job.ts";

/** 언어별 글꼴: 한국어·일본어·중국어 글자가 시스템 글꼴로 대체되도록 뒤에 일반 글꼴을 붙여요. */
function fontStack() {
  const lang = currentLang();
  if (lang === "ja") return '"Hiragino Sans", "Noto Sans JP", "Yu Gothic", "Pretendard Variable", Pretendard, Roboto, "Segoe UI", "Noto Sans", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "Hiragino Sans", "Yu Gothic", sans-serif';
  if (lang === "zh") return '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Pretendard Variable", Pretendard, Roboto, "Segoe UI", "Noto Sans", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "Hiragino Sans", "Yu Gothic", sans-serif';
  return '"Pretendard Variable", Pretendard, Roboto, "Segoe UI", "Noto Sans", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "Hiragino Sans", "Yu Gothic", sans-serif';
}

export type TestSheetInfo = {
  /** 대상 프린터 이름 */
  printer: string;
  /** 연결 경로: 예) "와이파이 192.168.0.30", "USB", "PC 도우미 → 192.168.0.30" */
  link: string;
  paper: string;
  orient: "portrait" | "landscape";
  gray: boolean;
  at?: number;
};

/** 용지 크기는 office-job의 용지 표 하나만 쓴다 */
export function paperMm(paper: string, orient: "portrait" | "landscape" = "portrait") {
  return tableMm(paper, orient);
}

/** 1pt = 25.4/72 mm */
const PT_MM = 25.4 / 72;

export function testSheetStamp(at = Date.now()) {
  const d = new Date(at);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 캔버스의 한 영역을 밝기(휘도) 기준 회색으로 바꾼다 */
function toGray(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.min(ctx.canvas.width - sx, Math.ceil(w));
  const sh = Math.min(ctx.canvas.height - sy, Math.ceil(h));
  if (sw <= 0 || sh <= 0) return;
  const image = ctx.getImageData(sx, sy, sw, sh);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
  ctx.putImageData(image, sx, sy);
}

export function drawTestSheet(canvas: HTMLCanvasElement, info: TestSheetInfo) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const W = canvas.width;
  const H = canvas.height;
  const sheetMm = paperMm(info.paper, info.orient);
  /* 캔버스 가로가 용지 가로에 대응한다 */
  const k = W / sheetMm.width;
  /* 본문 배율 — A4 세로 기준(약 190×200mm)으로 짜인 내용이 작은 용지(A5·A6·엽서)나 가로에서 넘치지 않게 줄인다.
     테두리는 용지 가장자리 점검용이라 배율 없이(s=1) 그리고, 그 뒤 본문부터 s=fit 으로 바꾼다. */
  const fit = Math.min(1, sheetMm.width / 190, (sheetMm.height - 20) / 200);
  let s = 1;
  const mm = (value: number) => value * k * s;
  const pt = (value: number) => value * PT_MM * k * s;
  const ink = "#111111";
  const face = fontStack();
  ctx.save();
  ctx.filter = "none";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  /* 1) 사방 여백 정렬 테두리선: 3mm 실선 + 10mm 점선, 모서리 십자 */
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1, mm(0.4));
  ctx.strokeRect(mm(3), mm(3), W - mm(6), H - mm(6));
  ctx.setLineDash([mm(2), mm(1.5)]);
  ctx.lineWidth = Math.max(1, mm(0.25));
  ctx.strokeRect(mm(10), mm(10), W - mm(20), H - mm(20));
  ctx.setLineDash([]);
  const cross = (x: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(x - mm(3), y);
    ctx.lineTo(x + mm(3), y);
    ctx.moveTo(x, y - mm(3));
    ctx.lineTo(x, y + mm(3));
    ctx.stroke();
  };
  ctx.lineWidth = Math.max(1, mm(0.3));
  cross(mm(10), mm(10));
  cross(W - mm(10), mm(10));
  cross(mm(10), H - mm(10));
  cross(W - mm(10), H - mm(10));
  ctx.fillStyle = ink;
  ctx.font = `${pt(7)}px ${face}`;
  ctx.fillText(tr("ts.solid"), mm(4.5), mm(7.6));
  ctx.fillText(tr("ts.dashed"), mm(12), mm(14.2));

  s = fit;
  const left = k * 18;
  const usable = W - k * 36;
  /* 본문은 10mm 점선 · 안내 글씨 아래(16mm)부터 — 배율이 작아도 겹치지 않게. A4에서는 예전처럼 28mm */
  let y = k * 16 + mm(12);

  /* 2) 제목 + 작업 정보 */
  ctx.font = `600 ${pt(20)}px ${face}`;
  ctx.fillText(tr("ts.title"), left, y, usable);
  y += mm(9);
  ctx.font = `${pt(10)}px ${face}`;
  const lines = [
    tr("ts.at", { v: testSheetStamp(info.at) }),
    tr("ts.printer", { v: info.printer || tr("ts.noName") }),
    tr("ts.link", { v: info.link || tr("ts.preview") }),
    tr("ts.paper", { paper: paperLabel(info.paper), orient: tr(info.orient === "landscape" ? "ts.land" : "ts.port"), color: tr(info.gray ? "ts.gray" : "ts.color") }),
  ];
  for (const line of lines) {
    ctx.fillText(line, left, y, usable);
    y += mm(5.6);
  }
  y += mm(3);
  ctx.lineWidth = Math.max(1, mm(0.2));
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(left + usable, y);
  ctx.stroke();
  y += mm(8);

  /* 3) 5단계 그레이스케일 농도 막대 */
  ctx.font = `600 ${pt(11)}px ${face}`;
  ctx.fillText(tr("ts.density"), left, y, usable);
  y += mm(3.5);
  const steps = [0.1, 0.3, 0.5, 0.75, 1];
  const gap = mm(2);
  const barW = (usable - gap * (steps.length - 1)) / steps.length;
  const barH = mm(14);
  steps.forEach((tone, index) => {
    const value = Math.round(255 * (1 - tone));
    const x = left + index * (barW + gap);
    ctx.fillStyle = `rgb(${value},${value},${value})`;
    ctx.fillRect(x, y, barW, barH);
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1, mm(0.2));
    ctx.strokeRect(x, y, barW, barH);
    ctx.fillStyle = ink;
    ctx.font = `${pt(9)}px ${face}`;
    ctx.fillText(`${Math.round(tone * 100)}%`, x + mm(1.5), y + barH + mm(4.5));
  });
  y += barH + mm(12);

  /* 4) 컬러 점검 — C·M·Y·K·R·G·B 칸 + 무지개 띠.
     컬러면 그대로, 흑백이면 이 영역을 회색으로 바꿔서 흑백 변환이 되는지 보이게 한다. */
  ctx.fillStyle = ink;
  ctx.font = `600 ${pt(11)}px ${face}`;
  ctx.fillText(tr(info.gray ? "ts.grayCheck" : "ts.colorCheck"), left, y, usable);
  y += mm(3.5);
  const colorTop = y;
  const patches: [string, string][] = [
    ["C", "#00aeef"],
    ["M", "#ec008c"],
    ["Y", "#fff200"],
    ["K", "#111111"],
    ["R", "#ed1c24"],
    ["G", "#00a651"],
    ["B", "#2e3192"],
  ];
  const pGap = mm(1.6);
  const pW = (usable - pGap * (patches.length - 1)) / patches.length;
  const pH = mm(12);
  patches.forEach(([name, color], index) => {
    const x = left + index * (pW + pGap);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, pW, pH);
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1, mm(0.2));
    ctx.strokeRect(x, y, pW, pH);
    ctx.fillStyle = ink;
    ctx.font = `600 ${pt(9)}px ${face}`;
    ctx.fillText(name, x + mm(1.5), y + pH + mm(4.5));
  });
  y += pH + mm(7.5);
  const rainbow = ctx.createLinearGradient(left, 0, left + usable, 0);
  ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "#ff0000"].forEach((color, index, all) => rainbow.addColorStop(index / (all.length - 1), color));
  ctx.fillStyle = rainbow;
  ctx.fillRect(left, y, usable, mm(6));
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1, mm(0.2));
  ctx.strokeRect(left, y, usable, mm(6));
  const colorBottom = y + mm(6) + Math.max(1, mm(0.2));
  if (info.gray) toGray(ctx, left - mm(0.5), colorTop - mm(0.5), usable + mm(1), colorBottom - colorTop + mm(1));
  y += mm(6) + mm(5.5);
  ctx.fillStyle = ink;
  ctx.font = `${pt(9)}px ${face}`;
  ctx.fillText(tr(info.gray ? "ts.grayNote" : "ts.colorNote"), left, y, usable);
  y += mm(10);

  /* 5) 한글·영문·숫자 크기별 샘플 */
  ctx.fillStyle = ink;
  ctx.font = `600 ${pt(11)}px ${face}`;
  ctx.fillText(tr("ts.textSample"), left, y, usable);
  y += mm(4);
  for (const size of [10, 14, 20]) {
    y += pt(size) * 1.25;
    ctx.font = `${pt(size)}px ${face}`;
    ctx.fillText(`${size}pt  ${tr("ts.sample")}`, left, y, usable);
    y += mm(2.5);
  }
  y += mm(6);

  /* 6) 가는 선 해상도 패턴 */
  ctx.font = `600 ${pt(11)}px ${face}`;
  ctx.fillText(tr("ts.lines"), left, y, usable);
  y += mm(3);
  [0.1, 0.2, 0.3, 0.5].forEach((width, index) => {
    const lineY = y + index * mm(3) + mm(1);
    ctx.lineWidth = Math.max(1, mm(width));
    ctx.beginPath();
    ctx.moveTo(left, lineY);
    ctx.lineTo(left + usable * 0.6, lineY);
    ctx.stroke();
    ctx.font = `${pt(8)}px ${face}`;
    ctx.fillText(`${width}mm`, left + usable * 0.6 + mm(3), lineY + mm(1));
  });

  /* 7) 안내 */
  ctx.font = `${pt(9)}px ${face}`;
  ctx.fillText(tr("ts.footer"), left, H - k * 16, usable);
  ctx.restore();
  return canvas;
}
