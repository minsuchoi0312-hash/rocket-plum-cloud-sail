/**
 * 복사기 QR 공유 모달 + "복사기 연결 QR 안내 카드" 인쇄.
 * QR은 src/lib/qr-svg.ts(순수 TS)로 만든다. 카드는 캔버스로 그려 화면 인쇄 또는 PDF로 저장한다.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useModal } from "@/components/use-modal";
import { toast } from "@/lib/toast";
import { Copy, Printer, Share, X } from "@/components/icons";
import { qrSvg, drawQr } from "@/lib/qr-svg";
import { copyText } from "@/lib/clipboard";
import { buildConnectLink } from "@/lib/connect-link";
import { CONNECT_PAGE_URL } from "@/lib/contact";
import { phoneApp } from "@/lib/phone-helper";
import { canShare, shareLink } from "@/lib/qr-scan";
import { downloadCanvasPdf } from "@/lib/pdf-page";
import { paperPoints } from "@/lib/office-job";
import { printSheet } from "@/lib/print-sheet";
import { fontsReady, sheetGlyphs } from "@/lib/font-ready";
import { currentLang, m, tr } from "@/lib/i18n";
import type { MsgKey } from "@/lib/i18n/types";

export type QrTarget = { name: string; ip: string; helper?: { url: string; code: string } | null };

type CardSize = "half" | "two" | "a4";
const CARD_SIZE_KEY: Record<CardSize, MsgKey> = { half: "qr.half", two: "qr.two", a4: "qr.a4" };

/** 카드 글꼴: 지금 언어 글자가 대체 글꼴로 잘 나오게 */
function cardFace() {
  const lang = currentLang();
  if (lang === "ja") return '"Hiragino Sans", "Noto Sans JP", "Yu Gothic", "Pretendard Variable", sans-serif';
  if (lang === "zh") return '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Pretendard Variable", sans-serif';
  return '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif';
}

/** 카드 1장을 top 위치부터 area 높이 안에 그린다 */
function drawCardAt(ctx: CanvasRenderingContext2D, target: QrTarget, link: string, W: number, top: number, area: number, full: boolean) {
  const k = W / 210;
  const scale = full ? 1 : 0.72;
  const mm = (v: number) => v * k * scale;
  const font = (pt: number, weight = 400) => `${weight} ${Math.round(pt * (25.4 / 72) * k * scale)}px ${cardFace()}`;
  ctx.save();
  ctx.fillStyle = "#1e242b";
  ctx.textAlign = "center";
  let y = top + mm(28);
  ctx.font = font(14, 600);
  ctx.fillText(tr("qr.cardTitle"), W / 2, y, W - mm(24));
  y += mm(16);
  ctx.font = font(26, 700);
  ctx.fillText(target.name || tr("qr.printerDefault"), W / 2, y, W - mm(30));
  y += mm(11);
  ctx.font = font(14);
  ctx.fillStyle = "#55606e";
  ctx.fillText(`IP ${target.ip}`, W / 2, y);
  const qrSize = mm(full ? 95 : 78);
  y += mm(8);
  drawQr(ctx, link, (W - qrSize) / 2, y, qrSize, 4);
  y += qrSize + mm(12);
  ctx.fillStyle = "#1e242b";
  ctx.font = font(12);
  const steps = [tr("qr.step1"), tr("qr.step2"), tr("qr.step3")];
  for (const line of steps) {
    ctx.fillText(line, W / 2, y, W - mm(30));
    y += mm(8.5);
  }
  ctx.font = font(9.5);
  ctx.fillStyle = "#7b8592";
  ctx.fillText(tr("qr.footer"), W / 2, Math.min(top + area - mm(12), y + mm(4)), W - mm(24));
  ctx.strokeStyle = "#c9c4b8";
  ctx.lineWidth = 3;
  ctx.strokeRect(mm(8), top + mm(8), W - mm(16), area - mm(16));
  ctx.restore();
}

/** A4 전체 · A4 반장(위쪽 1장) · A4에 2장(위·아래 같은 카드, 절약 배치) */
function drawQrCard(target: QrTarget, link: string, size: CardSize) {
  const W = 1240;
  const H = 1754;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  if (size === "a4") {
    drawCardAt(ctx, target, link, W, 0, H, true);
    return canvas;
  }
  drawCardAt(ctx, target, link, W, 0, H / 2, false);
  if (size === "two") drawCardAt(ctx, target, link, W, H / 2, H / 2, false);
  ctx.setLineDash([18, 12]);
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `24px ${cardFace()}`;
  ctx.fillStyle = "#999";
  ctx.textAlign = "left";
  ctx.fillText(tr(size === "two" ? "qr.cutTwo" : "qr.cutHere"), 40, H / 2 - 12);
  return canvas;
}

export function PrinterQrModal({ target, onClose }: { target: QrTarget; onClose: () => void }) {
  const [origin, setOrigin] = useState("");
  /* 앱: 링크는 공개 연결 페이지로(앱 안 주소 http://localhost 는 다른 폰에서 안 열린다), 폰 안 도우미는 넣지 않는다 */
  const [inApp, setInApp] = useState(false);
  const [shareOk, setShareOk] = useState(false);
  const [withHelper, setWithHelper] = useState(false);
  const [size, setSize] = useState<CardSize>("two");
  const dialogRef = useRef<HTMLDivElement>(null);
  useModal(dialogRef, onClose);
  useEffect(() => {
    setOrigin(window.location.origin);
    setInApp(phoneApp());
    setShareOk(canShare());
  }, []);
  const link = !origin ? "" : inApp ? buildConnectLink(target, { page: CONNECT_PAGE_URL }) : buildConnectLink(target, { origin, withHelper });
  const helperOption = Boolean(target.helper) && !inApp;

  async function share() {
    const title = tr("qr.shareTitle", { name: target.name || target.ip });
    if (!(await shareLink(`${title}
${link}`, title))) toast(m("qr.shareFail"));
  }
  const svg = useMemo(() => (link ? qrSvg(link, { margin: 3 }) : ""), [link]);

  async function printCard() {
    await fontsReady(sheetGlyphs(target.name, target.ip));
    const canvas = drawQrCard(target, link, size);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    canvas.width = 0;
    if (!blob) return;
    onClose();
    await printSheet({ kind: "pdf", pages: [URL.createObjectURL(blob)], paper: "A4", gray: false });
    window.setTimeout(() => window.print(), 300);
  }

  async function saveCard() {
    await fontsReady(sheetGlyphs(target.name, target.ip));
    const canvas = drawQrCard(target, link, size);
    await downloadCanvasPdf(canvas, tr("qr.file", { name: target.name || target.ip }), paperPoints("A4"));
    canvas.width = 0;
    toast(m("qr.saved"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} className="card w-full max-w-sm p-4 text-sm outline-none" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={tr("qr.aria")}>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-fg">{tr("qr.title")}</p>
          <button type="button" onClick={onClose} className="icon-btn inline-flex size-9 items-center justify-center rounded-full" aria-label={tr("qr.close")}>
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1 truncate text-muted">
          {target.name} · {target.ip}
        </p>
        <div className="qr-box mx-auto mt-3 w-52 rounded-2xl p-2" aria-label={tr("qr.codeAria")} dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-2 text-center text-xs text-muted">{tr("qr.scanHint")}</p>
        {helperOption ? (
          <label className="mt-3 flex items-start gap-2 text-xs text-fg">
            <input type="checkbox" checked={withHelper} onChange={(event) => setWithHelper(event.target.checked)} className="mt-0.5" />
            <span>
              {tr("qr.withHelper")}
              <span className="block text-muted">{tr("qr.withHelperWarn")}</span>
            </span>
          </label>
        ) : null}
        <p className="mt-3 text-xs font-medium text-muted">{tr("qr.size")}</p>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {(["half", "two", "a4"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setSize(value)} className={`chip min-h-9 rounded-xl px-1.5 py-1 text-xs leading-tight ${size === value ? "is-on" : ""}`}>
              {tr(CARD_SIZE_KEY[value])}
            </button>
          ))}
        </div>
        <div className={`mt-3 grid gap-2 ${shareOk ? "grid-cols-2" : "grid-cols-1"}`}>
          <button type="button" onClick={() => void copyText(link).then((ok) => toast(m(ok ? "qr.linkCopied" : "qr.copyFail")))} className="chip weak inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-1 py-1 text-center font-semibold">
            <Copy className="size-4" aria-hidden="true" />
            {tr("qr.copyLink")}
          </button>
          {shareOk ? (
            <button type="button" onClick={() => void share()} className="chip weak inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-1 py-1 text-center font-semibold">
              <Share className="size-4" aria-hidden="true" />
              {tr("qr.shareLink")}
            </button>
          ) : null}
        </div>
        <button type="button" onClick={() => void printCard()} className="btn-solid mt-2 inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-2xl px-1 py-1 text-center font-semibold">
          <Printer className="size-4 shrink-0" aria-hidden="true" />
          {tr("qr.print")}
        </button>
        <button type="button" onClick={() => void saveCard()} className="mt-2 h-9 w-full text-xs font-semibold text-accent">
          {tr("qr.savePdf")}
        </button>
      </div>
    </div>
  );
}
