/**
 * QR 찍기 · 링크 공유 — 앱이면 네이티브(android-native.ts 가 window 에 달아 둔 함수), 웹이면 브라우저 기능.
 * - 앱 QR: 구글 Play 서비스 코드 스캐너. 카메라 화면은 앱에 오지 않고 QR 글자만 온다(카메라 권한 없음).
 * - 웹 QR: BarcodeDetector 가 있는 브라우저(안드로이드 크롬 등)에서만 — 카메라로 한 장 찍어 읽는다.
 * - 공유: 앱은 안드로이드 공유 창, 웹은 navigator.share.
 */
type ScanResult = { text?: string; canceled?: boolean };
type Host = {
  __nugunaScanQr?: () => Promise<ScanResult>;
  __nugunaShareText?: (text: string, title: string) => Promise<void>;
  BarcodeDetector?: new (o: { formats: string[] }) => { detect(src: ImageBitmapSource): Promise<{ rawValue: string }[]> };
};

const host = () => (typeof window === "undefined" ? ({} as Host) : (window as unknown as Host));

export function canScanQr() {
  const h = host();
  return Boolean(h.__nugunaScanQr || h.BarcodeDetector);
}

/** 사진 한 장 고르기(카메라 우선). 취소하면 null */
function pickPhoto(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener("cancel", () => resolve(null), { once: true });
    input.click();
  });
}

/** QR 글자. 취소면 "" , 못 읽었으면 null */
export async function scanQr(): Promise<string | null> {
  const h = host();
  if (h.__nugunaScanQr) {
    const r = await h.__nugunaScanQr();
    return r.canceled ? "" : (r.text ?? null);
  }
  if (!h.BarcodeDetector) return null;
  const file = await pickPhoto();
  if (!file) return "";
  const bitmap = await createImageBitmap(file);
  try {
    const found = await new h.BarcodeDetector({ formats: ["qr_code"] }).detect(bitmap);
    return found[0]?.rawValue ?? null;
  } finally {
    bitmap.close();
  }
}

export function canShare() {
  const h = host();
  return Boolean(h.__nugunaShareText || (typeof navigator !== "undefined" && typeof navigator.share === "function"));
}

/** 공유 창 열기. 사용자가 닫은 것은 실패가 아니다 */
export async function shareLink(text: string, title: string): Promise<boolean> {
  const h = host();
  try {
    if (h.__nugunaShareText) await h.__nugunaShareText(text, title);
    else await navigator.share({ title, text });
    return true;
  } catch (e) {
    return (e as { name?: string })?.name === "AbortError";
  }
}
