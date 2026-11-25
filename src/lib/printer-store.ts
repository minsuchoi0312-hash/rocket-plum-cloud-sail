import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SavedPrinter = {
  uid: string;
  title: string;
  query: string;
  via: string;
  savedAt: number;
};

type PrinterState = {
  saved: SavedPrinter[];
  remember: (item: SavedPrinter) => void;
  forget: (uid: string) => void;
};

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set, get) => ({
      saved: [],
      remember: (item) => {
        const rest = get().saved.filter((row) => row.uid !== item.uid);
        set({ saved: [item, ...rest].slice(0, 24) });
      },
      forget: (uid) => set({ saved: get().saved.filter((row) => row.uid !== uid) }),
    }),
    { name: "print-atlas-v2", skipHydration: true },
  ),
);
