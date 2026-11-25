/** 모바일 브라우저 상단바(<meta name="theme-color">)를 앱 테마 색과 맞춘다 */
export const THEME_COLOR = { light: "#F2F4F6", dark: "#17171C" } as const;

export function syncThemeColor(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  const color = THEME_COLOR[theme];
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  if (!metas.length) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.append(meta);
    return;
  }
  metas.forEach((meta) => {
    meta.content = color;
    meta.removeAttribute("media");
  });
}
