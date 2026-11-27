import { maskSecrets } from "@/lib/diag";
import { tr, type MsgKey } from "@/lib/i18n/core";
import { phoneApp } from "@/lib/phone-helper";

/**
 * 문의 메일 받는 주소: src/lib/contact.ts 한 곳에서 바꾼다 (약관 · 처리방침과 같은 값).
 * 비어 있으면 버튼을 숨기고 "복사해서 메일/카톡으로 보내 주세요" 안내를 보여 준다.
 */
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from "@/lib/contact";
export { PRIVACY_POLICY_URL, SUPPORT_EMAIL };

export const HELPER_FILE = "/raw-print-helper.mjs";

export const HELPER_COMMAND = "node raw-print-helper.mjs";

export const INQUIRY_TYPES = ["noConnect", "broken", "model", "idea", "other"] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];

export function inquiryLabel(type: InquiryType) {
  return tr(`inq.${type}` as MsgKey);
}

/** app: 누구나프린트 안드로이드 앱(APK) 안 — USB 대신 폰 내장 도우미로 와이파이 인쇄하므로 WebUSB는 따지지 않는다 */
export type EnvInfo = { browser: string; os: string; webUsb: boolean; inApp: boolean; app?: boolean };

/** 기기 정보 칩 · 문의 글에 쓰는 인쇄 방식 한 마디 */
export function usbLabel(env: EnvInfo) {
  return tr(env.app ? "env.app" : env.webUsb ? "env.usbYes" : "env.usbNo");
}

export function readEnv(): EnvInfo {
  if (typeof navigator === "undefined") return { browser: tr("env.unknown"), os: tr("env.unknown"), webUsb: false, inApp: false };
  const ua = navigator.userAgent;
  const major = (re: RegExp) => ua.match(re)?.[1]?.split(".")[0] ?? "";
  const browsers: [RegExp, string][] = [
    [/SamsungBrowser\/([\d.]+)/, tr("env.samsung")],
    [/Whale\/([\d.]+)/, tr("env.whale")],
    [/Edg\/([\d.]+)/, "Edge"],
    [/CriOS\/([\d.]+)/, "Chrome(iOS)"],
    [/Chrome\/([\d.]+)/, "Chrome"],
    [/Firefox\/([\d.]+)/, "Firefox"],
    [/Version\/([\d.]+).*Safari/, "Safari"],
  ];
  const hit = browsers.find(([re]) => re.test(ua));
  const browser = hit ? `${hit[1]} ${major(hit[0])}`.trim() : tr("env.otherBrowser");
  const android = ua.match(/Android ([\d.]+)/)?.[1];
  const ios = ua.match(/(?:iPhone|iPad|iPod).*OS ([\d_]+)/)?.[1];
  const os = android
    ? `Android ${android}`
    : ios
      ? `iOS ${ios.replace(/_/g, ".")}`
      : /Windows NT/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : tr("env.otherOs");
  return {
    browser,
    os,
    webUsb: "usb" in navigator,
    inApp: /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(ua),
    app: phoneApp(),
  };
}

export function envLine(env: EnvInfo) {
  return `${env.browser} · ${env.os} · ${usbLabel(env)}${env.inApp ? ` · ${tr("env.inApp")}` : ""}`;
}

export type Inquiry = {
  type: InquiryType;
  model: string;
  body: string;
  withLog: boolean;
  log: string;
  env: EnvInfo;
  route: string;
};

/** 문의 본문(사용자 글 포함)도 PIN·비밀번호 마스킹을 다시 거친다. */
export function inquiryText(inq: Inquiry, logLines = 50) {
  const log = inq.withLog ? maskSecrets(inq.log).split("\n").slice(-logLines).join("\n") : "";
  const parts = [
    tr("iq.title"),
    tr("iq.type", { v: inquiryLabel(inq.type) }),
    tr("iq.model", { v: inq.model.trim() || tr("iq.modelNone") }),
    tr("iq.env", { v: envLine(inq.env) }),
    tr("iq.route", { v: inq.route }),
    "",
    tr("iq.body"),
    maskSecrets(inq.body.trim() || tr("iq.bodyNone")),
  ];
  if (inq.withLog) parts.push("", tr("iq.log"), log || tr("iq.logNone"));
  return parts.join("\n");
}

export function inquiryMailto(inq: Inquiry): string | null {
  const to = SUPPORT_EMAIL.trim();
  if (!to) return null;
  const subject = tr("iq.subject", { v: `${inquiryLabel(inq.type)}${inq.model.trim() ? ` · ${inq.model.trim()}` : ""}` });
  /* 메일 앱 주소 길이 한계 때문에 로그는 최근 20줄만 싣는다(전체는 '한 번에 복사' 사용). */
  const body = inquiryText(inq, 20);
  const encoded = encodeURIComponent(body);
  const safeBody = encoded.length > 1800 ? encodeURIComponent(`${body.slice(0, 1200)}\n${tr("iq.cut")}`) : encoded;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${safeBody}`;
}

/** 복사기 패널에서 IP 찾는 1줄 요약 (기종·펌웨어마다 메뉴 이름은 조금씩 달라요). 지금 언어로 만들어요. */
export function ipGuide(): { brand: string; how: string }[] {
  return [
    { brand: tr("ipg.samsung"), how: tr("ipg.samsungHow") },
    { brand: "HP", how: tr("ipg.hpHow") },
    { brand: tr("ipg.canon"), how: tr("ipg.canonHow") },
    { brand: tr("ipg.sindoh"), how: tr("ipg.sindohHow") },
    { brand: tr("ipg.xerox"), how: tr("ipg.xeroxHow") },
  ];
}

export type Faq = { id: string; q: string; a: string[]; copy?: string; download?: string };

const FAQ_DEF: { id: string; lines: number; copy?: string; download?: string }[] = [
  { id: "wifi", lines: 4 },
  { id: "cors", lines: 2, copy: HELPER_COMMAND, download: HELPER_FILE },
  { id: "usb", lines: 4 },
  { id: "ios", lines: 3 },
  { id: "pin", lines: 3 },
];

/** 자주 묻는 질문(지금 언어) */
export function faqs(): Faq[] {
  return FAQ_DEF.map((row) => ({
    id: row.id,
    q: tr(`faq.${row.id}.q` as MsgKey),
    a: Array.from({ length: row.lines }, (_, i) => tr(`faq.${row.id}.a${i + 1}` as MsgKey)),
    copy: row.copy,
    download: row.download,
  }));
}
