import { Atlas } from "./atlas-engine.js";
import { familyLabel, lookupDriver, type DriverFamily } from "./drivers.ts";

export type GenerationId = "legacy" | "classic" | "transitional" | "modern";

export type CatalogPrinter = {
  id: string;
  brandId: string;
  brand: string;
  model: string;
  year: number;
  generation: GenerationId;
  pack: string;
  languages: string[];
  connections: string[];
  color: boolean;
  duplex: boolean;
  borderless: boolean;
  photo: boolean;
  airprint: boolean;
  family: string;
};

export type PackInfo = {
  id: string;
  name: string;
  tag: string;
  summary: string;
};

export type TraceLine = { step: string; detail: string };

export type MatchResult =
  | { kind: "empty" }
  | { kind: "list"; query: string; hits: CatalogPrinter[]; log: TraceLine[] }
  | {
      kind: "match";
      query: string;
      source: "catalog" | "heuristic" | "unknown" | string;
      confidence: number;
      reason: string;
      printer: CatalogPrinter;
      generation: { id: GenerationId; label: string; era: string; hint: string };
      pack: PackInfo;
      fallback: PackInfo | null;
      alternatives: { brand: string; model: string }[];
      log: TraceLine[];
    };

export function matchQuery(input: string, options?: { cmd?: string }): MatchResult {
  const cmd = options?.cmd?.trim() || "";
  const base = Atlas.match(input, cmd) as MatchResult;
  const hit = lookupDriver(input);
  if (!hit) return base;
  if (base.kind === "list") return base;
  if (base.kind === "match" && base.source === "catalog" && base.confidence >= 88) return base;
  if (cmd && !hit.exact) return base;
  return fromDriver(input, hit);
}

function fromDriver(input: string, hit: { name: string; family: DriverFamily; exact: boolean }): MatchResult {
  const packs = Atlas.PACKS as Record<string, PackInfo>;
  const generations = Atlas.GENERATIONS as Record<GenerationId, { id: GenerationId; label: string; era: string; hint: string }>;
  const profile = profileFor(hit.name, hit.family);
  const pack = packs[profile.pack];
  const generation = generations[profile.generation];
  const [brandRaw, ...rest] = hit.name.split(" ");
  const brand = brandRaw === "EPSON" ? "Epson" : brandRaw;
  const model = rest.join(" ") || hit.name;
  return {
    kind: "match",
    query: input.trim(),
    source: "driver-db",
    confidence: hit.exact ? 94 : 82,
    reason: profile.reason,
    printer: {
      id: `drv-${hit.family}-${model.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      brandId: brand.toLowerCase(),
      brand,
      model,
      year: profile.year,
      generation: profile.generation,
      pack: profile.pack,
      languages: profile.languages,
      connections: profile.connections,
      color: profile.color,
      duplex: profile.duplex,
      borderless: false,
      photo: profile.pack === "raster-ink",
      airprint: profile.airprint,
      family: profile.family,
    },
    generation,
    pack,
    fallback: profile.fallback ? packs[profile.fallback] : null,
    alternatives: [],
    log: [
      { step: "목록", detail: `${familyLabel(hit.family)} 드라이버 목록에서 ${hit.name} 을 찾았습니다.` },
      { step: "팩", detail: `${pack.name} 으로 맞춥니다.` },
    ],
  };
}

function profileFor(name: string, family: DriverFamily) {
  const n = name.toLowerCase();
  const wifi = /\b(w|dw|dn|nw)\b|wifi|wi-fi|wireless|series/.test(n);
  const connections = wifi ? ["wifi", "usb"] : ["usb"];
  const color = /color|colour|clp|clx|pixma|stylus|deskjet|officejet|envy|artisan|workforce|ecotank/.test(n);
  if (/\blq-|\blx-|\bfx-|\bplq-|\bdlq-/.test(n)) {
    return {
      pack: "page-lang",
      generation: "classic" as GenerationId,
      languages: ["ESC/P"],
      color: false,
      duplex: false,
      airprint: false,
      connections: ["usb"],
      year: 2004,
      family: "dot",
      fallback: "",
      reason: `${name}은 도트 매트릭스입니다. ESC/P 문자로 찍습니다.`,
    };
  }
  if (family === "escpr") {
    return {
      pack: "raster-ink",
      generation: "transitional" as GenerationId,
      languages: ["ESC/P-R"],
      color: true,
      duplex: false,
      airprint: false,
      connections,
      year: 2014,
      family: "escpr",
      fallback: "",
      reason: `${name}은 ESC/P-R 목록에 있습니다. 잉크 래스터로 맞추고, 표준 인쇄가 되면 그 경로를 씁니다.`,
    };
  }
  if (family === "splix") {
    return {
      pack: "legacy-host",
      generation: "legacy" as GenerationId,
      languages: ["SPL"],
      color,
      duplex: false,
      airprint: false,
      connections,
      year: 2009,
      family: "spl",
      fallback: "",
      reason: `${name}은 SpliX 목록입니다. 컴퓨터가 점을 만들어 보내는 SPL 기종이라 이 화면에서는 미리보기만 볼 수 있어요.`,
    };
  }
  if (family === "hplip") {
    const host = /1020|1018|1005|1006|1007|1008|1102|1505|1606/.test(n);
    const laser = /laserjet|laser|mfp|pagewide/.test(n);
    if (host) {
      return {
        pack: "legacy-host",
        generation: "legacy" as GenerationId,
        languages: ["호스트 기반"],
        color: false,
        duplex: false,
        airprint: false,
        connections,
        year: 2007,
        family: "host-laser",
        fallback: "",
        reason: `${name}은 HPLIP 목록의 호스트 기반 레이저입니다. 점을 PC가 만들어야 합니다.`,
      };
    }
    if (laser) {
      const modern = /m404|m428|m479|m454|e4|m28[0-9]/.test(n);
      return {
        pack: modern ? "driverless" : "page-lang",
        generation: (modern ? "modern" : "classic") as GenerationId,
        languages: modern ? ["AirPrint", "PCL"] : ["PCL"],
        color,
        duplex: /dn|dw|duplex/.test(n),
        airprint: modern,
        connections: ["wifi", "usb"],
        year: modern ? 2019 : 2012,
        family: "pcl-laser",
        fallback: modern ? "page-lang" : "",
        reason: modern
          ? `${name}은 HPLIP 목록의 신형 레이저입니다. 표준 티켓을 먼저, 거절되면 PCL입니다.`
          : `${name}은 HPLIP 목록의 레이저입니다. PCL로 맞춥니다.`,
      };
    }
    return {
      pack: "raster-ink",
      generation: "transitional" as GenerationId,
      languages: ["HP 래스터"],
      color: true,
      duplex: false,
      airprint: false,
      connections,
      year: 2013,
      family: "hplip",
      fallback: "",
      reason: `${name}은 HPLIP 잉크 목록입니다. 래스터로 맞춥니다.`,
    };
  }
  const office = /kyocera|ricoh|oki|lexmark|phaser|laserjet|brother hl/.test(n);
  if (office) {
    return {
      pack: "page-lang",
      generation: "classic" as GenerationId,
      languages: ["PCL"],
      color,
      duplex: /dn|duplex/.test(n),
      airprint: false,
      connections: ["wifi", "usb"],
      year: 2011,
      family: "pcl-laser",
      fallback: "",
      reason: `${name}은 Gutenprint 사무 기종 목록입니다. PCL로 맞춥니다.`,
    };
  }
  return {
    pack: "raster-ink",
    generation: "classic" as GenerationId,
    languages: ["Gutenprint"],
    color: true,
    duplex: false,
    airprint: false,
    connections,
    year: 2008,
    family: "gutenprint",
    fallback: "",
    reason: `${name}은 Gutenprint 목록의 잉크젯입니다. 래스터로 맞춥니다.`,
  };
}
