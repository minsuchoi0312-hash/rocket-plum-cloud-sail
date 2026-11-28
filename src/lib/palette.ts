/**
 * 화면 모양 설정 — 밝기 모드(시스템 · 밝게 · 어둡게)와 색 테마(팔레트).
 * 색 테마는 밝을 때 · 어두울 때를 따로 고른다(예: 밝을 땐 종이 · 잉크, 어두울 땐 포도).
 * 저장: atlas-theme = system | light | dark (없으면 system), atlas-palette-light · atlas-palette-dark (없으면 blue).
 * 적용: html[data-theme] = 실제 밝기, html[data-palette] = 그 밝기의 색 테마(기본 파랑이면 속성 없음).
 * 색 값은 styles.css '색 테마' 블록. 여기 목록과 이름을 맞출 것.
 */
export const PALETTES = [
  { id: "blue", label: "pal.blue", light: ["#3182f6", "#f2f4f6"], dark: ["#3485fa", "#17171c"] },
  { id: "paper", label: "pal.paper", light: ["#c8175d", "#f4f1ea"], dark: ["#ff5c9d", "#12110f"] },
  { id: "forest", label: "pal.forest", light: ["#0e7c54", "#eef4f0"], dark: ["#3ccf91", "#111714"] },
  { id: "sunset", label: "pal.sunset", light: ["#d24a1c", "#f8f1ec"], dark: ["#ff8a5c", "#191312"] },
  { id: "grape", label: "pal.grape", light: ["#6741d9", "#f3f1f9"], dark: ["#a08cff", "#14121b"] },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];
export type Scheme = "light" | "dark";
export type ThemeMode = "system" | Scheme;

export const THEME_KEY = "atlas-theme";
export const PALETTE_KEYS = { light: "atlas-palette-light", dark: "atlas-palette-dark" } as const;
/** 예전(밝기 구분 없던) 저장 키 — 따로 고른 적이 없으면 이 값을 쓴다 */
const OLD_PALETTE_KEY = "atlas-palette";

export function isPalette(value: unknown): value is PaletteId {
  return PALETTES.some((row) => row.id === value);
}

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 저장 못 해도 이번 화면에는 적용된다 */
  }
}

export function readMode(): ThemeMode {
  const saved = read(THEME_KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

export function systemScheme(): Scheme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function resolveScheme(mode: ThemeMode): Scheme {
  return mode === "system" ? systemScheme() : mode;
}

export function readPalette(scheme: Scheme): PaletteId {
  const saved = read(PALETTE_KEYS[scheme]) ?? read(OLD_PALETTE_KEY);
  return isPalette(saved) ? saved : "blue";
}

/** 지금 설정대로 html 에 밝기 · 색 테마를 적용하고 실제 밝기를 돌려준다 */
export function applyAppearance(mode: ThemeMode = readMode()): Scheme {
  const scheme = resolveScheme(mode);
  if (typeof document === "undefined") return scheme;
  const root = document.documentElement;
  root.dataset.theme = scheme;
  const palette = readPalette(scheme);
  if (palette === "blue") delete root.dataset.palette;
  else root.dataset.palette = palette;
  return scheme;
}

export function saveMode(mode: ThemeMode) {
  write(THEME_KEY, mode);
}

export function savePalette(scheme: Scheme, id: PaletteId) {
  write(PALETTE_KEYS[scheme], id);
}

/**
 * 첫 그림 전에 넣는 한 줄 스크립트(깜빡임 방지) — __root.tsx 에서 쓴다.
 * 안드로이드 사본 index.html 에도 같은 내용이 있다(고치면 같이 고칠 것).
 */
export const APPEARANCE_BOOT =
  "try{var d=document.documentElement,t=localStorage.getItem('atlas-theme');if(t!=='light'&&t!=='dark')t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';d.dataset.theme=t;var p=localStorage.getItem('atlas-palette-'+t)||localStorage.getItem('atlas-palette');if(p&&p!=='blue')d.dataset.palette=p;}catch(e){}";
