import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cleanText } from "@/lib/sanitize";

export type SavedPrinter = {
  uid: string;
  title: string;
  query: string;
  via: string;
  savedAt: number;
  /** 사용자가 붙인 별칭 (예: 3층 복합기) */
  alias?: string;
  /** 와이파이·PC 도우미로 연결했던 주소 */
  host?: string;
  /** 다시 연결할 방식 */
  link?: "wifi" | "usb" | "helper";
};

type PrinterState = {
  saved: SavedPrinter[];
  remember: (item: SavedPrinter) => void;
  forget: (uid: string) => void;
  rename: (uid: string, alias: string) => void;
};

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set, get) => ({
      saved: [],
      remember: (item) => {
        const before = get().saved.find((row) => row.uid === item.uid);
        const rest = get().saved.filter((row) => row.uid !== item.uid);
        /* 다시 연결해도 사용자가 붙인 별칭은 지키기 */
        const clean = { ...item, title: cleanText(item.title, 80) || item.uid, alias: item.alias ? cleanText(item.alias, 30) || undefined : undefined };
        const merged = before?.alias && !clean.alias ? { ...clean, alias: before.alias } : clean;
        set({ saved: [merged, ...rest].slice(0, 24) });
      },
      forget: (uid) => set({ saved: get().saved.filter((row) => row.uid !== uid) }),
      rename: (uid, alias) =>
        set({
          saved: get().saved.map((row) => (row.uid === uid ? { ...row, alias: cleanText(alias, 30) || undefined } : row)),
        }),
    }),
    { name: "print-atlas-v2", skipHydration: true },
  ),
);

export function printerLabel(item: Pick<SavedPrinter, "alias" | "title">) {
  return item.alias?.trim() || item.title;
}
