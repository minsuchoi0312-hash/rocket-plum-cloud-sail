/** 모바일 브라우저 상단바(<meta name="theme-color">)를 앱 테마 색과 맞춘다 */
export const THEME_COLOR = { light: "#F2F4F6", dark: "#17171C" } as const;

export function syncThemeColor(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  /* 색 테마마다 바탕이 달라 실제 바탕색을 읽는다(못 읽으면 기본값) */
  const color = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim() || THEME_COLOR[theme];
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
