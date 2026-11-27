/**
 * 이용약관 · 개인정보처리방침 본문.
 * - 한국어가 원문이에요. 영어는 번역본이고, 일본어 · 중국어 화면에서도 영어본을 보여 줘요.
 * - 내용을 바꾸면 LEGAL_VERSION(시행일)을 올려요 → 앱이 다음 실행 때 동의를 다시 받아요.
 * - 개인정보보호법 제30조(처리방침에 적을 내용)와 Google Play 사용자 데이터 정책에 맞춰 썼어요.
 *   앱이 개인정보를 모으지 않으므로 '개인정보 수집 동의'는 받지 않아요(필요 없는 동의를 받지 않는 게 원칙).
 */
/* 상대 경로 + .ts: scripts/make-legal-pages.mjs가 Node로 바로 읽을 수 있게 (타입 import는 실행 때 지워진다) */
import { SUPPORT_EMAIL } from "./contact.ts";
import type { Lang } from "./i18n/types.ts";

/** 시행일 — 약관 · 처리방침을 고치면 이 값을 바꾼다 */
export const LEGAL_VERSION = "2026-11-26";
export const LEGAL_STORAGE_KEY = "nuguna-legal";

export type LegalKind = "terms" | "privacy";
export type LegalSection = { h: string; p: string[] };
export type LegalDoc = { title: string; intro: string; sections: LegalSection[] };

const MAIL = SUPPORT_EMAIL || "앱 안 '문의하기'";
const DATE_KO = "2026년 11월 26일";
const DATE_EN = "November 26, 2026";
/* 처리방침만 고친 날(약관은 그대로라 LEGAL_VERSION 은 두어 동의를 다시 받지 않는다): USB OTG · PDF 저장 · 보안 PIN 안내 추가 */
const PRIVACY_DATE_KO = "2026년 11월 27일";
const PRIVACY_DATE_EN = "November 27, 2026";

const KO: Record<LegalKind, LegalDoc> = {
  terms: {
    title: "이용약관",
    intro: `이 약관은 누구나프린트(이하 '앱')를 쓰는 데 필요한 기본 약속이에요. 시행일 ${DATE_KO}.`,
    sections: [
      { h: "제1조 (목적)", p: ["이 약관은 앱 운영자(이하 '운영자')와 앱을 쓰는 분(이하 '이용자') 사이의 권리 · 의무와 책임을 정해요."] },
      {
        h: "제2조 (서비스 내용)",
        p: [
          "앱은 이용자의 기기에 있는 사진 · PDF · 글을 같은 와이파이(사내망 포함)에 있는 프린터 · 복사기로 보내 인쇄하도록 돕는 무료 도구예요.",
          "회원가입 · 로그인 · 결제가 없고, 운영자의 서버를 거치지 않아요.",
        ],
      },
      { h: "제3조 (약관의 효력)", p: ["이용자가 처음 실행할 때 이 약관에 동의하면 효력이 생겨요. 동의하지 않으면 앱을 쓰지 않고 지우면 돼요."] },
      {
        h: "제4조 (이용자의 의무)",
        p: [
          "다른 사람의 저작권 · 초상권 등 권리를 침해하는 자료, 지폐 · 증명서 위조처럼 법으로 금지된 자료를 인쇄하면 안 돼요.",
          "회사 · 학교 · 공용 프린터는 관리자가 허락한 범위에서만 써야 해요.",
          "앱을 고쳐 다른 사람의 기기 · 네트워크를 방해하는 데 쓰면 안 돼요.",
        ],
      },
      {
        h: "제5조 (서비스의 한계)",
        p: [
          "프린터 기종 · 펌웨어 · 네트워크 설정에 따라 인쇄가 안 되거나 결과가 다를 수 있어요. 중요한 문서는 먼저 한 장으로 확인해 주세요.",
          "앱에 나오는 HP · 캐논 · 엡손 · 삼성 · 신도리코 · 제록스 등 제조사 이름과 상표는 기종을 알아보려고 쓴 것이며, 운영자는 이 회사들과 관계가 없어요.",
        ],
      },
      {
        h: "제6조 (책임의 제한)",
        p: [
          "앱은 무료로 제공돼요. 운영자는 고의 또는 중대한 과실이 없는 한 인쇄 실패, 용지 · 토너 소모, 잘못 인쇄된 결과로 생긴 손해에 책임지지 않아요.",
          "이용자가 제4조를 어겨 생긴 문제는 이용자에게 책임이 있어요.",
        ],
      },
      { h: "제7조 (서비스 변경 · 중단)", p: ["운영자는 기능을 바꾸거나 업데이트 · 배포를 멈출 수 있어요. 이미 설치한 앱은 기기 안에서 그대로 쓸 수 있어요."] },
      { h: "제8조 (약관 변경)", p: ["약관을 바꿀 때는 시행 7일 전부터 앱 안에 알려요(이용자에게 불리하면 30일 전). 바뀐 뒤 처음 실행할 때 다시 동의를 받아요."] },
      { h: "제9조 (준거법 · 관할)", p: ["이 약관은 대한민국 법을 따르고, 분쟁은 민사소송법에 따른 관할 법원에서 해결해요."] },
      { h: "문의", p: [`이메일: ${MAIL}`] },
    ],
  },
  privacy: {
    title: "개인정보처리방침",
    intro: `누구나프린트(이하 '앱')는 개인정보를 모으지 않아요. 앱이 다루는 정보와 그 처리 방법을 「개인정보 보호법」 제30조에 따라 알려 드려요. 시행일 ${PRIVACY_DATE_KO}.`,
    sections: [
      {
        h: "1. 수집하는 개인정보",
        p: [
          "없어요. 앱에는 회원가입 · 로그인 · 서버가 없고, 광고 · 통계(분석) 도구도 넣지 않았어요.",
          "운영자는 이용자의 이름 · 전화번호 · 위치 · 연락처 · 사진 · 파일을 받거나 저장하지 않아요.",
        ],
      },
      {
        h: "2. 기기 안에만 저장되는 정보",
        p: [
          "편하게 쓰도록 아래 정보를 이용자의 기기 안(앱 저장 공간)에만 저장해요. 운영자를 포함해 누구에게도 보내지 않아요.",
          "· 내 프린터: 프린터 이름 · IP 주소 · 별명",
          "· 인쇄 기록: 파일 이름 · 쪽수 · 프린터 · 시각(최근 몇 건)",
          "· 설정: 인쇄 설정 · 언어 · 화면 테마 · 진단 기록",
          "앱의 '기록 지우기'나 앱 삭제로 바로 지워져요. 클라우드 백업이나 새 폰으로 옮기기(기기 간 이전)로도 복사되지 않아요. '백업 파일 받기'는 이용자가 직접 고른 곳에만 파일로 저장돼요.",
          "'PDF로 저장'한 파일은 기기의 다운로드 › NugunaPrint 폴더에 남아요. 앱을 지워도 남으니, 필요 없으면 파일 앱에서 직접 지워 주세요.",
        ],
      },
      {
        h: "3. 인쇄할 파일",
        p: [
          "이용자가 고르거나 다른 앱에서 '공유'한 사진 · PDF · 글은 기기 안에서 인쇄용 데이터로 바꾼 뒤, 이용자가 고른 같은 와이파이의 프린터(또는 USB 선으로 연결한 프린터)로만 보내요.",
          "보안 인쇄 PIN은 인쇄 데이터에 담겨 그 프린터로만 가고, 기기에 저장하지 않아요.",
          "파일을 복사해 두지 않고, 인쇄가 끝나면 메모리에서 사라져요.",
        ],
      },
      {
        h: "4. 앱이 쓰는 권한",
        p: [
          "· 인터넷 · 네트워크 상태 · 와이파이 상태 · 멀티캐스트: 같은 와이파이 안의 프린터를 찾고 인쇄 데이터를 보내는 데만 써요. 인터넷의 외부 서버로는 보내지 않아요.",
          "· USB(OTG): 이용자가 연결을 허락한 USB 프린터로 인쇄 데이터를 보내는 데만 써요. 프린터마다 안드로이드가 허락을 먼저 물어요.",
          "위치 · 카메라 · 마이크 · 연락처 · 전화 권한은 쓰지 않아요. 사진 · 파일은 이용자가 직접 고르거나 공유한 것만 열어요.",
        ],
      },
      {
        h: "5. 문의할 때",
        p: [
          "이용자가 이메일로 문의하면 운영자는 보낸 이메일 주소와 문의 내용(이용자가 넣기로 고른 기기 환경 · 진단 기록 포함)을 받아요.",
          "답변에만 쓰고, 답변을 마치면 지체 없이 지워요. 진단 기록의 PIN · 비밀번호는 앱이 보내기 전에 가려요.",
        ],
      },
      {
        h: "6. 제3자 제공 · 처리 위탁 · 국외 이전",
        p: [
          "없어요. 앱은 외부 회사에 정보를 주거나 처리를 맡기지 않아요.",
          "웹(브라우저) 버전은 화면 글꼴을 Google Fonts에서 불러와요. 이때 브라우저가 접속 IP 등을 Google LLC(미국)에 보낼 수 있어요. 안드로이드 앱은 글꼴을 앱 안에 넣어 이 전송이 없어요.",
        ],
      },
      { h: "7. 파기", p: ["기기 안 정보는 이용자가 지우거나 앱을 지우면 바로 없어져요. 문의 메일은 답변 후 지체 없이 지워요."] },
      {
        h: "8. 이용자의 권리",
        p: [
          "이용자(만 14세 미만은 법정대리인)는 언제든 자신의 정보를 열람 · 정정 · 삭제 · 처리 정지를 요청할 수 있어요. 기기 안 정보는 앱에서 직접 지울 수 있고, 문의 메일 관련 요청은 아래 이메일로 보내 주세요.",
          "앱은 개인정보를 모으지 않으므로 만 14세 미만 아동의 개인정보도 모으지 않아요.",
        ],
      },
      {
        h: "9. 안전 조치",
        p: [
          "앱 안 프린터 도우미는 이 기기 안(127.0.0.1)에서만 열리고, 다른 앱 · 기기가 쓰지 못하게 코드로 잠가요.",
          "앱 저장 공간은 클라우드 백업과 기기 간 이전에서 빠지도록 해 두었어요.",
        ],
      },
      { h: "10. 쿠키 등 자동 수집 장치", p: ["쓰지 않아요. 설정은 기기 안 저장 공간(localStorage)에만 두고 밖으로 보내지 않아요."] },
      {
        h: "11. 개인정보 보호책임자",
        p: [`누구나프린트 운영자(개인 개발자) · 이메일 ${MAIL}`, "개인정보 관련 문의 · 불만 · 피해 구제는 위 이메일로 보내 주시면 빠르게 답해 드려요."],
      },
      {
        h: "12. 권익 침해 구제",
        p: [
          "아래 기관에 분쟁 해결이나 상담을 신청할 수 있어요.",
          "· 개인정보분쟁조정위원회 1833-6972 (www.kopico.go.kr)",
          "· 개인정보침해신고센터 118 (privacy.kisa.or.kr)",
          "· 대검찰청 1301 (www.spo.go.kr)",
          "· 경찰청 182 (ecrm.police.go.kr)",
        ],
      },
      { h: "13. 변경", p: [`이 방침은 ${PRIVACY_DATE_KO}부터 시행해요. 바뀌면 시행 7일 전부터 앱 안에 알려요.`, `· ${PRIVACY_DATE_KO}: USB 선 인쇄 · 'PDF로 저장' · 보안 인쇄 PIN 안내를 더했어요(처리하는 정보는 그대로예요).`] },
    ],
  },
};

const EN: Record<LegalKind, LegalDoc> = {
  terms: {
    title: "Terms of Use",
    intro: `These terms are the basic agreement for using Nuguna Print (the "App"). Effective ${DATE_EN}. The Korean version governs; this is a translation.`,
    sections: [
      { h: "1. Purpose", p: ["These terms set out the rights, duties and responsibilities between the App's operator (the \"Operator\") and you."] },
      { h: "2. Service", p: ["The App is a free tool that sends photos, PDFs and text on your device to printers and copiers on the same Wi-Fi network.", "There is no sign-up, login or payment, and nothing passes through the Operator's servers."] },
      { h: "3. Acceptance", p: ["These terms apply once you agree on first launch. If you do not agree, simply do not use the App and uninstall it."] },
      {
        h: "4. Your obligations",
        p: [
          "Do not print material that infringes others' rights (e.g. copyright) or that is illegal to reproduce (e.g. banknotes, forged documents).",
          "Use work, school or shared printers only as permitted by their administrator.",
          "Do not modify or use the App to disrupt other people's devices or networks.",
        ],
      },
      {
        h: "5. Limitations",
        p: [
          "Depending on the printer model, firmware or network, printing may fail or look different. Please test with one page first for important documents.",
          "Manufacturer names and trademarks (HP, Canon, Epson, Samsung, Sindoh, Xerox, etc.) are used only to identify models; the Operator is not affiliated with these companies.",
        ],
      },
      { h: "6. Limitation of liability", p: ["The App is provided free of charge. Except for wilful misconduct or gross negligence, the Operator is not liable for failed prints, paper or toner use, or misprints.", "You are responsible for problems caused by breaching section 4."] },
      { h: "7. Changes to the service", p: ["The Operator may change features or stop updates and distribution. An installed App keeps working on your device."] },
      { h: "8. Changes to these terms", p: ["Changes are announced in the App at least 7 days in advance (30 days if unfavourable to you). You will be asked to agree again on the next launch."] },
      { h: "9. Governing law", p: ["These terms are governed by the laws of the Republic of Korea, and disputes go to the competent court under the Korean Civil Procedure Act."] },
      { h: "Contact", p: [`Email: ${SUPPORT_EMAIL || "via 'Contact' in the App"}`] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: `Nuguna Print (the "App") does not collect personal information. This policy explains, under Article 30 of Korea's Personal Information Protection Act, what information the App handles. Effective ${PRIVACY_DATE_EN}. The Korean version governs.`,
    sections: [
      { h: "1. Information collected", p: ["None. The App has no accounts, no login and no server, and contains no advertising or analytics SDKs.", "The Operator does not receive or store your name, phone number, location, contacts, photos or files."] },
      {
        h: "2. Stored only on your device",
        p: [
          "For convenience, the following stays only in the App's storage on your device and is never sent to anyone, including the Operator:",
          "· My printers: name, IP address, nickname",
          "· Print history: file name, pages, printer, time (recent items)",
          "· Settings: print settings, language, theme, diagnostic log",
          "It is erased by 'Clear history' or by uninstalling the App, and is excluded from cloud backups and device-to-device transfer. 'Download backup file' saves a file only where you choose.",
          "Files saved with 'Save as PDF' stay in your device's Download › NugunaPrint folder, even after uninstalling. Delete them in your Files app if you no longer need them.",
        ],
      },
      { h: "3. Files you print", p: ["Photos, PDFs and text you pick or share to the App are converted on your device and sent only to the printer you choose on the same Wi-Fi (or connected by USB cable).", "A secure-print PIN travels inside the print data to that printer only and is not stored on your device.", "Files are not copied and are released from memory after printing."] },
      { h: "4. Permissions", p: ["· Internet, network state, Wi-Fi state, multicast: used only to find printers on your Wi-Fi and send print data. Nothing is sent to external internet servers.", "· USB (OTG): used only to send print data to a USB printer you allow. Android asks for your permission for each printer.", "No location, camera, microphone, contacts or phone permissions. Only photos and files you pick or share are opened."] },
      { h: "5. When you contact us", p: ["If you email us, the Operator receives your email address and message (including any device info or diagnostic log you choose to attach).", "It is used only to reply and is deleted without delay afterwards. PINs and passwords in the log are masked before sending."] },
      {
        h: "6. Third parties and transfers abroad",
        p: [
          "None. The App does not share information with, or outsource processing to, other companies.",
          "The web (browser) version loads a font from Google Fonts, which may send your IP address to Google LLC (USA). The Android app bundles the font, so no such transfer occurs.",
        ],
      },
      { h: "7. Deletion", p: ["On-device data is gone as soon as you clear it or uninstall the App. Support emails are deleted without delay after replying."] },
      { h: "8. Your rights", p: ["You (or a legal guardian for children under 14) may request access, correction, deletion or suspension at any time. On-device data can be deleted in the App; email requests about support mail to the address below.", "Because the App collects no personal information, it collects none from children under 14."] },
      { h: "9. Security", p: ["The built-in printer helper listens only on this device (127.0.0.1) and is locked with a code so other apps or devices cannot use it.", "App storage is excluded from cloud backups and device-to-device transfer."] },
      { h: "10. Cookies and trackers", p: ["None. Settings stay in on-device storage (localStorage) and are not sent anywhere."] },
      { h: "11. Privacy officer", p: [`Nuguna Print operator (individual developer) · Email ${SUPPORT_EMAIL || "via 'Contact' in the App"}`] },
      { h: "12. Remedies (Korea)", p: ["Personal Information Dispute Mediation Committee 1833-6972 (www.kopico.go.kr)", "Personal Information Infringement Report Center 118 (privacy.kisa.or.kr)", "Supreme Prosecutors' Office 1301 · Korean National Police Agency 182"] },
      { h: "13. Changes", p: [`This policy is effective from ${PRIVACY_DATE_EN}. Changes are announced in the App at least 7 days in advance.`, `· ${PRIVACY_DATE_EN}: added notes on USB cable printing, 'Save as PDF' and secure-print PINs (the information handled is unchanged).`] },
    ],
  },
};

/** 한국어면 원문, 그 밖의 언어는 영어 번역본 */
export function legalDoc(kind: LegalKind, lang: Lang): LegalDoc {
  return (lang === "ko" ? KO : EN)[kind];
}

/** 지금 시행일 약관에 동의했는지 */
export function legalAgreed(): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem(LEGAL_STORAGE_KEY) || "null") as { v?: string } | null;
    return saved?.v === LEGAL_VERSION;
  } catch {
    return false;
  }
}

/** 동의한 약관 시행일과 시각을 기기에 남긴다(동의 증빙 — 밖으로 보내지 않음) */
export function saveLegalAgree() {
  try {
    localStorage.setItem(LEGAL_STORAGE_KEY, JSON.stringify({ v: LEGAL_VERSION, at: new Date().toISOString() }));
  } catch {
    // 저장소를 못 써도 이번 실행에서는 시작할 수 있어요
  }
}
