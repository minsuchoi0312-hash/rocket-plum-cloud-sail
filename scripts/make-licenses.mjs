// 앱에 들어가는 오픈소스의 라이선스 전문을 public/licenses.txt 로 모은다(앱 '오픈소스' 화면에서 보여 줌).
// 각 패키지의 LICENSE 파일을 그대로 옮겨 적으므로, 패키지를 바꾸면 다시 돌린다.
// 사용: node scripts/make-licenses.mjs [node_modules 경로]   (기본: 이 저장소 node_modules)
//   안드로이드 사본에만 있는 글꼴까지 담으려면: node scripts/make-licenses.mjs C:\dev\nuguna-print-android\node_modules
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mods = process.argv[2] || join(root, "node_modules");

/** [패키지, 화면에 쓸 이름, 라이선스 파일 경로(없으면 자동)] */
const PACKAGES = [
  ["react", "React"],
  ["react-dom", "React DOM"],
  ["scheduler", "Scheduler"],
  ["@tanstack/react-router", "TanStack Router"],
  ["zustand", "Zustand"],
  ["zod", "Zod"],
  ["@phosphor-icons/react", "Phosphor Icons"],
  ["@capacitor/core", "Capacitor"],
  ["@capacitor/android", "Capacitor Android"],
  ["pdfjs-dist", "PDF.js"],
  ["pdf-lib", "pdf-lib"],
  ["@pdf-lib/standard-fonts", "pdf-lib standard fonts"],
  ["@pdf-lib/upng", "UPNG.js"],
  ["pako", "pako"],
  ["tslib", "tslib"],
  ["tailwindcss", "Tailwind CSS"],
  ["pretendard", "Pretendard (글꼴)", "dist/LICENSE.txt"],
];

/** node_modules 에 없는 안드로이드 라이브러리 — Apache-2.0 전문은 PDF.js 것을 함께 쓴다 */
const ANDROID_APACHE = [
  "AndroidX (appcompat, core, coordinatorlayout, core-splashscreen, webkit 등) — Copyright The Android Open Source Project",
  "Apache Cordova Android — Copyright The Apache Software Foundation",
];

/** 패키지가 아니라 public/pdfjs 로 따로 싣는 데이터 — [이름 · 라이선스, pdfjs-dist 안 파일] */
const PDFJS_DATA = [
  ["PDF.js CMap (Adobe CMap, 한글 Adobe-Korea1 · KSC · UniKS 포함) — BSD-3-Clause", "cmaps/LICENSE"],
  ["PDF.js 표준 글꼴 Foxit (PDFium) — BSD-3-Clause", "standard_fonts/LICENSE_FOXIT"],
  ["PDF.js 표준 글꼴 Liberation Sans (Red Hat) — GPL-2.0 + 글꼴 예외", "standard_fonts/LICENSE_LIBERATION"],
];

function licenseFile(dir, given) {
  if (given) return join(dir, given);
  const hit = readdirSync(dir).find((name) => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(name));
  return hit ? join(dir, hit) : null;
}

const out = [
  "누구나프린트 — 오픈소스 라이선스 / Open source licenses",
  "이 앱은 아래 오픈소스 소프트웨어를 사용합니다. 각 라이선스 전문을 그대로 싣습니다.",
  "",
];
let apache = "";
const missing = [];

for (const [pkg, label, given] of PACKAGES) {
  const dir = join(mods, pkg);
  if (!existsSync(dir)) {
    missing.push(pkg);
    continue;
  }
  const meta = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const file = licenseFile(dir, given);
  if (!file || !existsSync(file)) {
    missing.push(`${pkg} (LICENSE 없음)`);
    continue;
  }
  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim();
  if (pkg === "pdfjs-dist") apache = text;
  out.push("=".repeat(72), `${label} ${meta.version} — ${meta.license}`, meta.homepage || "", "-".repeat(72), text, "");
}

for (const [label, rel] of PDFJS_DATA) {
  const file = join(mods, "pdfjs-dist", rel);
  if (!existsSync(file)) {
    missing.push(`pdfjs-dist/${rel}`);
    continue;
  }
  out.push("=".repeat(72), label, "-".repeat(72), readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim(), "");
}

if (apache) {
  out.push("=".repeat(72), "Android 라이브러리 — Apache-2.0", "-".repeat(72), ...ANDROID_APACHE, "", "(Apache License 2.0 전문은 위 PDF.js 항목과 같습니다.)", "");
}

if (missing.length) {
  console.error(`못 찾은 패키지: ${missing.join(", ")}`);
  process.exit(1);
}

const target = join(root, "public", "licenses.txt");
writeFileSync(target, `${out.join("\n").replace(/\n{3,}/g, "\n\n")}\n`, "utf8");
console.log(`완료: ${target} (${PACKAGES.length}개 패키지)`);
