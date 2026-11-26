/**
 * 앱 전체 아이콘 — 예전 lucide 이름 그대로 쓰되, 실제 모양은 끝이 둥근 Phosphor(bold)로 그린다.
 * 애플 SF Symbols · 토스 TDS 아이콘처럼 굵고 둥근 선. 와이파이 · USB는 참고 이미지로 직접 그린 아이콘.
 * 새 아이콘이 필요하면 여기에만 추가한다.
 */
import type { ComponentType } from "react";
import {
  ArrowClockwise,
  ArrowRight as PhArrowRight,
  ArrowsClockwise,
  ArrowsOutSimple,
  BookmarkSimple,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Check as PhCheck,
  CheckCircle,
  ClockCounterClockwise,
  Copy as PhCopy,
  Desktop,
  EnvelopeSimple,
  FilePlus,
  FileText as PhFileText,
  Globe as PhGlobe,
  House as PhHouse,
  Image as PhImage,
  MagnifyingGlass,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Minus as PhMinus,
  Moon as PhMoon,
  NotePencil,
  Package as PhPackage,
  PencilSimple,
  Plus as PhPlus,
  Printer as PhPrinter,
  QrCode as PhQrCode,
  Question,
  Repeat as PhRepeat,
  Stethoscope as PhStethoscope,
  Sun as PhSun,
  Table,
  Trash,
  UploadSimple,
  Warning,
  X as PhX,
  type IconProps,
  type IconWeight,
} from "@phosphor-icons/react";
import { UsbIcon, WifiIcon } from "@/components/link-icons";

type Props = IconProps & { strokeWidth?: number | string };

function round(Ph: ComponentType<IconProps>, weight: IconWeight = "bold") {
  function RoundIcon({ strokeWidth: _strokeWidth, ...props }: Props) {
    return <Ph weight={weight} {...props} />;
  }
  RoundIcon.displayName = `Round(${Ph.displayName ?? "Icon"})`;
  return RoundIcon;
}

export const ArrowLeft = round(CaretLeft);
export const ArrowRight = round(PhArrowRight);
export const Bookmark = round(BookmarkSimple);
export const Check = round(PhCheck);
export const ChevronDown = round(CaretDown);
export const ChevronUp = round(CaretUp);
export const ChevronRight = round(CaretRight);
export const CircleCheck = round(CheckCircle, "fill");
export const CircleHelp = round(Question);
export const Copy = round(PhCopy);
export const FilePlus2 = round(FilePlus);
export const FileText = round(PhFileText);
export const Globe = round(PhGlobe);
export const History = round(ClockCounterClockwise);
export const House = round(PhHouse);
export const Image = round(PhImage);
export const Mail = round(EnvelopeSimple);
export const Maximize2 = round(ArrowsOutSimple);
export const Monitor = round(Desktop);
export const Moon = round(PhMoon);
export const Package = round(PhPackage);
export const Pencil = round(PencilSimple);
export const Plus = round(PhPlus);
export const Minus = round(PhMinus);
export const Printer = round(PhPrinter);
export const QrCode = round(PhQrCode);
export const RefreshCw = round(ArrowsClockwise);
export const Repeat = round(PhRepeat);
export const RotateCw = round(ArrowClockwise);
export const Search = round(MagnifyingGlass);
export const Sheet = round(Table);
export const Stethoscope = round(PhStethoscope);
export const StickyNote = round(NotePencil);
export const Sun = round(PhSun);
export const Trash2 = round(Trash);
export const TriangleAlert = round(Warning, "fill");
export const Upload = round(UploadSimple);
export const X = round(PhX);
export const ZoomIn = round(MagnifyingGlassPlus);
export const ZoomOut = round(MagnifyingGlassMinus);
export const Wifi = WifiIcon;
export const Usb = UsbIcon;
