// 개인정보처리방침 · 이용약관을 단독 웹페이지(public/privacy.html · public/terms.html)로 만든다.
// Google Play 등록에 필요한 '처리방침 공개 주소'용. 본문은 앱과 같은 src/lib/legal.ts에서 가져온다.
// 사용: node scripts/make-legal-pages.mjs   (legal.ts를 고치면 다시 돌린다)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { legalDoc, LEGAL_VERSION } = await import(new URL("../src/lib/legal.ts", import.meta.url).href);

const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function section(doc, lang) {
  return `<section lang="${lang}">
  <h1>${esc(doc.title)}</h1>
  <p class="intro">${esc(doc.intro)}</p>
${doc.sections.map((s) => `  <h2>${esc(s.h)}</h2>\n${s.p.map((p) => `  <p>${esc(p)}</p>`).join("\n")}`).join("\n")}
</section>`;
}

function page(kind, other) {
  const ko = legalDoc(kind, "ko");
  const en = legalDoc(kind, "en");
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>누구나프린트 ${esc(ko.title)} · ${esc(en.title)}</title>
<meta name="robots" content="index" />
<style>
  :root { color-scheme: light dark; --fg: #191f28; --muted: #4e5968; --line: #e5e8eb; --bg: #ffffff; --accent: #3182f6; }
  @media (prefers-color-scheme: dark) { :root { --fg: #ffffff; --muted: #c3c3c6; --line: #3c3c47; --bg: #17171c; --accent: #3485fa; } }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.65 "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", Roboto, sans-serif; word-break: keep-all; overflow-wrap: anywhere; }
  main { max-width: 720px; margin: 0 auto; padding: 32px 24px 64px; }
  nav { display: flex; gap: 16px; font-size: 15px; margin-bottom: 24px; }
  a { color: var(--accent); }
  h1 { font-size: 28px; line-height: 1.3; letter-spacing: -0.02em; margin: 0 0 12px; }
  h2 { font-size: 18px; margin: 28px 0 6px; }
  p { margin: 6px 0; color: var(--muted); }
  .intro { color: var(--fg); }
  section + section { margin-top: 48px; padding-top: 32px; border-top: 1px solid var(--line); }
  footer { margin-top: 48px; font-size: 14px; color: var(--muted); }
</style>
</head>
<body>
<main>
<nav><a href="#ko">한국어</a><a href="#en">English</a><a href="${other.href}">${esc(other.label)}</a></nav>
<div id="ko">${section(ko, "ko")}</div>
<div id="en">${section(en, "en")}</div>
<footer>시행일 · Effective ${esc(LEGAL_VERSION)}</footer>
</main>
</body>
</html>
`;
}

writeFileSync(join(root, "public", "privacy.html"), page("privacy", { href: "terms.html", label: "이용약관 · Terms" }), "utf8");
writeFileSync(join(root, "public", "terms.html"), page("terms", { href: "privacy.html", label: "개인정보처리방침 · Privacy" }), "utf8");
console.log("완료: public/privacy.html, public/terms.html");
