import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

/**
 * 누구나프린트 웹 빌드 (TanStack Start · Nitro → Vercel).
 * 처음 만든 앱 빌더 템플릿의 로그인 · DB · 미리보기 · 설치 안내 플러그인은 이 앱에서 쓰지 않아 뺐다.
 * 안드로이드 앱은 vite.android.config.ts(사본 저장소)로 따로 빌드한다.
 */
export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview ? [nitro({ preset: "vercel" })] : []),
    viteReact(),
  ],
}));
