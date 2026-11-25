export type PrintRoute = "usb-pdf" | "usb-pcl" | "preview-only";

export type RouteInput = {
  liveUsb: boolean;
  cmd: string;
  catalogPcl5: boolean;
  catalogSure: boolean;
  pdfBytes: boolean;
  docKind: "pdf" | "photo" | "memo" | "test";
  pageMode: "all" | "span" | "list";
  gray: boolean;
  pdfDirect: boolean;
};

/** PCL5, PCL5e, or PCL5c only. A bare PCL, PCL 6, PCLXL, or PCL 3 does not count. */
export function commandHasPcl5(cmd: string) {
  return /\bPCL\s*5\s*[ce]?\b/i.test(cmd);
}

export function commandBlocksPcl5(cmd: string) {
  const text = cmd.trim();
  if (!text || commandHasPcl5(text)) return false;
  return /\b(UFR|CAPT|SPL|PCL\s*3|PCL3|PCL\s*6|PCLXL|POST\s*SCRIPT|POSTSCRIPT)\b/i.test(text);
}

export function languageIsPcl5(languages: string) {
  return commandHasPcl5(languages);
}

export function resolvePrintRoute(input: RouteInput): PrintRoute {
  if (!input.liveUsb) return "preview-only";
  const cmd = input.cmd.trim();
  let pcl5 = false;
  if (cmd && commandHasPcl5(cmd)) pcl5 = true;
  if (cmd && commandBlocksPcl5(cmd)) pcl5 = false;
  const pdfLang = /\bPDF\b/i.test(cmd);
  if (input.docKind === "pdf" && input.pdfBytes && input.pdfDirect && pdfLang && !input.gray && input.pageMode === "all") return "usb-pdf";
  if (pcl5) return "usb-pcl";
  return "preview-only";
}
