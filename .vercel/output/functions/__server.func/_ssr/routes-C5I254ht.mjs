import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Sun, c as Globe, i as Trash2, l as Bookmark, n as Usb, o as Printer, s as Moon, t as Wifi } from "../_libs/lucide-react.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C5I254ht.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Atlas = (function() {
	const GENERATIONS = {
		legacy: {
			id: "legacy",
			label: "구형 호스트",
			era: "2001–2009",
			hint: "PC가 점을 찍어서 보내는 방식"
		},
		classic: {
			id: "classic",
			label: "구형 언어",
			era: "2003–2012",
			hint: "PCL·ESC/P처럼 프린터 스스로 그리는 방식"
		},
		transitional: {
			id: "transitional",
			label: "전환기",
			era: "2010–2017",
			hint: "래스터 팩과 초기 네트워크가 같이 있는 시기"
		},
		modern: {
			id: "modern",
			label: "신형 표준",
			era: "2016–",
			hint: "AirPrint·IPP Everywhere로 드라이버 없이 말하는 시기"
		}
	};
	const PACKS = {
		driverless: {
			id: "driverless",
			name: "표준 티켓",
			tag: "신형",
			summary: "IPP Everywhere, AirPrint, Mopria. 두꺼운 래스터를 받지 않고 인쇄 티켓만 맞춥니다."
		},
		"raster-ink": {
			id: "raster-ink",
			name: "잉크 래스터",
			tag: "구형·전환기",
			summary: "ESC/P-R, Canon 래스터, HP 잉크 래스터, Brother 잉크. 사진과 여백 없는 인쇄에 필요한 색·용지 조각."
		},
		"page-lang": {
			id: "page-lang",
			name: "페이지 언어",
			tag: "레이저",
			summary: "PCL 5/XL과 PostScript, BR-Script. 사무실 레이저가 페이지를 직접 해석합니다."
		},
		"legacy-host": {
			id: "legacy-host",
			name: "호스트 브리지",
			tag: "구형",
			summary: "CAPT, SPL, ZJS처럼 컴퓨터가 점을 만들어 보내야 하는 구형 기기의 번역 조각."
		},
		"mobile-label": {
			id: "mobile-label",
			name: "라벨·감열",
			tag: "휴대",
			summary: "ESC/POS, ZPL, EPL, ZINK. 영수증·라벨·손바닥 포토 전용 조각."
		}
	};
	function entry(partial) {
		return Object.assign({
			color: true,
			duplex: false,
			borderless: false,
			photo: false,
			airprint: false,
			connections: ["wifi"],
			year: 2014,
			languages: []
		}, partial);
	}
	const CATALOG = [
		entry({
			id: "ep-c80",
			brandId: "epson",
			brand: "Epson",
			model: "Stylus C80",
			year: 2001,
			generation: "classic",
			pack: "raster-ink",
			languages: ["ESC/P"],
			connections: ["usb"],
			photo: false,
			family: "stylus"
		}),
		entry({
			id: "ep-cx5400",
			brandId: "epson",
			brand: "Epson",
			model: "Stylus CX5400",
			year: 2004,
			generation: "classic",
			pack: "raster-ink",
			languages: ["ESC/P"],
			connections: ["usb"],
			family: "stylus"
		}),
		entry({
			id: "ep-photo1400",
			brandId: "epson",
			brand: "Epson",
			model: "Stylus Photo 1400",
			year: 2007,
			generation: "classic",
			pack: "raster-ink",
			languages: ["ESC/P-R"],
			connections: ["usb"],
			borderless: true,
			photo: true,
			family: "photo"
		}),
		entry({
			id: "ep-t13",
			brandId: "epson",
			brand: "Epson",
			model: "Stylus T13",
			year: 2010,
			generation: "classic",
			pack: "raster-ink",
			languages: ["ESC/P"],
			connections: ["usb"],
			family: "stylus"
		}),
		entry({
			id: "ep-tx100",
			brandId: "epson",
			brand: "Epson",
			model: "Stylus TX100",
			year: 2008,
			generation: "classic",
			pack: "raster-ink",
			languages: ["ESC/P"],
			connections: ["usb"],
			family: "stylus"
		}),
		entry({
			id: "ep-pma890",
			brandId: "epson",
			brand: "Epson",
			model: "PM-A890",
			year: 2008,
			generation: "classic",
			pack: "raster-ink",
			languages: ["ESC/P-R"],
			connections: ["usb"],
			borderless: true,
			photo: true,
			family: "pm"
		}),
		entry({
			id: "ep-artisan50",
			brandId: "epson",
			brand: "Epson",
			model: "Artisan 50",
			year: 2009,
			generation: "transitional",
			pack: "raster-ink",
			languages: ["ESC/P-R"],
			connections: ["wifi", "usb"],
			borderless: true,
			photo: true,
			family: "artisan"
		}),
		entry({
			id: "ep-wf1100",
			brandId: "epson",
			brand: "Epson",
			model: "WorkForce 1100",
			year: 2009,
			generation: "transitional",
			pack: "raster-ink",
			languages: ["ESC/P-R"],
			connections: ["usb", "wifi"],
			duplex: true,
			family: "workforce"
		}),
		entry({
			id: "ep-l3150",
			brandId: "epson",
			brand: "Epson",
			model: "L3150",
			year: 2019,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "ESC/P-R"],
			connections: ["wifi", "usb"],
			borderless: true,
			airprint: true,
			family: "ecotank"
		}),
		entry({
			id: "ep-l3250",
			brandId: "epson",
			brand: "Epson",
			model: "L3250",
			year: 2022,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "ESC/P-R"],
			connections: ["wifi", "usb"],
			borderless: true,
			duplex: true,
			airprint: true,
			family: "ecotank"
		}),
		entry({
			id: "ep-et2720",
			brandId: "epson",
			brand: "Epson",
			model: "ET-2720",
			year: 2019,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "ESC/P-R"],
			connections: ["wifi", "usb"],
			borderless: true,
			airprint: true,
			family: "ecotank"
		}),
		entry({
			id: "ep-et2850",
			brandId: "epson",
			brand: "Epson",
			model: "ET-2850",
			year: 2022,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "ESC/P-R"],
			connections: ["wifi", "usb"],
			borderless: true,
			duplex: true,
			airprint: true,
			family: "ecotank"
		}),
		entry({
			id: "ep-et4850",
			brandId: "epson",
			brand: "Epson",
			model: "ET-4850",
			year: 2022,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "ESC/P-R"],
			connections: ["wifi", "usb"],
			borderless: true,
			duplex: true,
			airprint: true,
			family: "ecotank"
		}),
		entry({
			id: "ep-et8550",
			brandId: "epson",
			brand: "Epson",
			model: "ET-8550",
			year: 2021,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "ESC/P-R"],
			connections: ["wifi", "usb"],
			borderless: true,
			duplex: true,
			photo: true,
			airprint: true,
			family: "ecotank"
		}),
		entry({
			id: "ep-et16500",
			brandId: "epson",
			brand: "Epson",
			model: "ET-16500",
			year: 2019,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "ESC/P-R"],
			connections: ["wifi", "usb"],
			borderless: true,
			duplex: true,
			airprint: true,
			family: "ecotank"
		}),
		entry({
			id: "hp-1020",
			brandId: "hp",
			brand: "HP",
			model: "LaserJet 1020",
			year: 2005,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["ZJS 호스트"],
			connections: ["usb"],
			color: false,
			family: "host-laser"
		}),
		entry({
			id: "hp-1018",
			brandId: "hp",
			brand: "HP",
			model: "LaserJet 1018",
			year: 2006,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["ZJS 호스트"],
			connections: ["usb"],
			color: false,
			family: "host-laser"
		}),
		entry({
			id: "hp-p1102",
			brandId: "hp",
			brand: "HP",
			model: "LaserJet P1102",
			year: 2010,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["호스트 기반"],
			connections: ["usb"],
			color: false,
			family: "host-laser"
		}),
		entry({
			id: "hp-p1102w",
			brandId: "hp",
			brand: "HP",
			model: "LaserJet Professional P1102w",
			year: 2011,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["호스트 기반"],
			connections: ["wifi", "usb"],
			color: false,
			family: "host-laser"
		}),
		entry({
			id: "hp-p1606",
			brandId: "hp",
			brand: "HP",
			model: "LaserJet Professional P1606dn",
			year: 2010,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["호스트 기반"],
			connections: ["wifi", "usb"],
			color: false,
			duplex: true,
			family: "host-laser"
		}),
		entry({
			id: "hp-m1005",
			brandId: "hp",
			brand: "HP",
			model: "LaserJet M1005",
			year: 2007,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["호스트 기반"],
			connections: ["usb"],
			color: false,
			family: "host-laser"
		}),
		entry({
			id: "hp-m15w",
			brandId: "hp",
			brand: "HP",
			model: "LaserJet M15w",
			year: 2018,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["호스트 기반"],
			connections: ["wifi", "usb"],
			color: false,
			family: "host-laser"
		}),
		entry({
			id: "hp-dj2010",
			brandId: "hp",
			brand: "HP",
			model: "DeskJet Ink Advantage 2010",
			year: 2011,
			generation: "classic",
			pack: "raster-ink",
			languages: ["LIDIL"],
			connections: ["usb"],
			borderless: true,
			family: "deskjet"
		}),
		entry({
			id: "hp-dj2130",
			brandId: "hp",
			brand: "HP",
			model: "DeskJet 2130",
			year: 2015,
			generation: "transitional",
			pack: "raster-ink",
			languages: ["호스트 래스터"],
			connections: ["usb"],
			family: "deskjet"
		}),
		entry({
			id: "hp-dj2720",
			brandId: "hp",
			brand: "HP",
			model: "DeskJet 2720",
			year: 2020,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "PCL3"],
			connections: ["wifi", "usb"],
			airprint: true,
			family: "deskjet"
		}),
		entry({
			id: "hp-oj100",
			brandId: "hp",
			brand: "HP",
			model: "OfficeJet 100 Mobile",
			year: 2009,
			generation: "classic",
			pack: "page-lang",
			languages: ["PCL 3"],
			connections: ["usb", "bluetooth"],
			family: "officejet"
		}),
		entry({
			id: "hp-oj150",
			brandId: "hp",
			brand: "HP",
			model: "OfficeJet 150 Mobile",
			year: 2011,
			generation: "transitional",
			pack: "page-lang",
			languages: ["PCL 3"],
			connections: ["wifi", "usb"],
			family: "officejet"
		}),
		entry({
			id: "hp-oj3830",
			brandId: "hp",
			brand: "HP",
			model: "OfficeJet 3830",
			year: 2016,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "PCL"],
			connections: ["wifi", "usb"],
			duplex: true,
			airprint: true,
			family: "officejet"
		}),
		entry({
			id: "hp-oj9020",
			brandId: "hp",
			brand: "HP",
			model: "OfficeJet Pro 9020",
			year: 2019,
			generation: "modern",
			pack: "driverless",
			fallback: "page-lang",
			languages: ["AirPrint", "PCL 6"],
			connections: ["wifi", "usb"],
			duplex: true,
			airprint: true,
			family: "officejet"
		}),
		entry({
			id: "hp-m404",
			brandId: "hp",
			brand: "HP",
			model: "LaserJet Pro M404dn",
			year: 2019,
			generation: "modern",
			pack: "driverless",
			fallback: "page-lang",
			languages: [
				"AirPrint",
				"PCL 6",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			color: false,
			duplex: true,
			airprint: true,
			family: "pcl-laser"
		}),
		entry({
			id: "hp-m428",
			brandId: "hp",
			brand: "HP",
			model: "LaserJet Pro M428fdw",
			year: 2019,
			generation: "modern",
			pack: "driverless",
			fallback: "page-lang",
			languages: [
				"AirPrint",
				"PCL 6",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			color: false,
			duplex: true,
			airprint: true,
			family: "pcl-laser"
		}),
		entry({
			id: "hp-envy",
			brandId: "hp",
			brand: "HP",
			model: "ENVY 6055",
			year: 2020,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint"],
			connections: ["wifi", "usb"],
			borderless: true,
			duplex: true,
			airprint: true,
			family: "envy"
		}),
		entry({
			id: "hp-sprocket",
			brandId: "hp",
			brand: "HP",
			model: "Sprocket",
			year: 2016,
			generation: "modern",
			pack: "mobile-label",
			languages: ["ZINK"],
			connections: ["bluetooth"],
			borderless: true,
			photo: true,
			family: "zink"
		}),
		entry({
			id: "cn-ip2700",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA iP2700",
			year: 2010,
			generation: "classic",
			pack: "raster-ink",
			languages: ["Canon 래스터"],
			connections: ["usb"],
			borderless: true,
			family: "pixma"
		}),
		entry({
			id: "cn-mp140",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA MP140",
			year: 2007,
			generation: "classic",
			pack: "raster-ink",
			languages: ["Canon 래스터"],
			connections: ["usb"],
			family: "pixma"
		}),
		entry({
			id: "cn-ip5200r",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA iP5200R",
			year: 2006,
			generation: "classic",
			pack: "raster-ink",
			languages: ["Canon 래스터"],
			connections: ["wifi", "usb"],
			borderless: true,
			photo: true,
			family: "pixma"
		}),
		entry({
			id: "cn-mp600r",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA MP600R",
			year: 2006,
			generation: "classic",
			pack: "raster-ink",
			languages: ["Canon 래스터"],
			connections: ["wifi", "usb"],
			borderless: true,
			photo: true,
			family: "pixma"
		}),
		entry({
			id: "cn-mg2500",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA MG2500",
			year: 2013,
			generation: "transitional",
			pack: "raster-ink",
			languages: ["Canon 래스터"],
			connections: ["usb"],
			borderless: true,
			family: "pixma"
		}),
		entry({
			id: "cn-mg3620",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA MG3620",
			year: 2015,
			generation: "transitional",
			pack: "raster-ink",
			fallback: "driverless",
			languages: ["AirPrint", "Canon 래스터"],
			connections: ["wifi", "usb"],
			borderless: true,
			airprint: true,
			family: "pixma"
		}),
		entry({
			id: "cn-mx920",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA MX920",
			year: 2012,
			generation: "transitional",
			pack: "raster-ink",
			fallback: "driverless",
			languages: ["AirPrint", "Canon 래스터"],
			connections: ["wifi", "usb"],
			duplex: true,
			airprint: true,
			family: "pixma"
		}),
		entry({
			id: "cn-g2010",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA G2010",
			year: 2017,
			generation: "transitional",
			pack: "raster-ink",
			languages: ["Canon 래스터"],
			connections: ["usb"],
			borderless: true,
			family: "megatank"
		}),
		entry({
			id: "cn-g3010",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA G3010",
			year: 2018,
			generation: "transitional",
			pack: "raster-ink",
			languages: ["Canon 래스터"],
			connections: ["wifi", "usb"],
			borderless: true,
			family: "megatank"
		}),
		entry({
			id: "cn-g6070",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA G6070",
			year: 2020,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "Canon 래스터"],
			connections: ["wifi", "usb"],
			borderless: true,
			duplex: true,
			airprint: true,
			family: "megatank"
		}),
		entry({
			id: "cn-ts9120",
			brandId: "canon",
			brand: "Canon",
			model: "PIXMA TS9120",
			year: 2017,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "Canon 래스터"],
			connections: ["wifi", "usb"],
			borderless: true,
			duplex: true,
			photo: true,
			airprint: true,
			family: "pixma"
		}),
		entry({
			id: "cn-gx4020",
			brandId: "canon",
			brand: "Canon",
			model: "MAXIFY GX4020",
			year: 2022,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint"],
			connections: ["wifi", "usb"],
			duplex: true,
			airprint: true,
			family: "maxify"
		}),
		entry({
			id: "cn-mf645",
			brandId: "canon",
			brand: "Canon",
			model: "imageCLASS MF645Cx",
			year: 2019,
			generation: "modern",
			pack: "driverless",
			fallback: "page-lang",
			languages: ["AirPrint", "UFR II"],
			connections: ["wifi", "usb"],
			duplex: true,
			airprint: true,
			family: "laser"
		}),
		entry({
			id: "cn-lbp2900",
			brandId: "canon",
			brand: "Canon",
			model: "LBP2900",
			year: 2005,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["CAPT"],
			connections: ["usb"],
			color: false,
			family: "capt"
		}),
		entry({
			id: "cn-lbp6030",
			brandId: "canon",
			brand: "Canon",
			model: "LBP6030",
			year: 2012,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["CAPT"],
			connections: ["usb"],
			color: false,
			family: "capt"
		}),
		entry({
			id: "cn-lbp6230",
			brandId: "canon",
			brand: "Canon",
			model: "LBP6230",
			year: 2014,
			generation: "transitional",
			pack: "page-lang",
			languages: ["UFR II"],
			connections: ["usb", "wifi"],
			color: false,
			family: "ufr"
		}),
		entry({
			id: "cn-mf3010",
			brandId: "canon",
			brand: "Canon",
			model: "MF3010",
			year: 2012,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["UFR II LT"],
			connections: ["usb"],
			color: false,
			family: "capt"
		}),
		entry({
			id: "cn-selphy",
			brandId: "canon",
			brand: "Canon",
			model: "SELPHY CP1300",
			year: 2016,
			generation: "transitional",
			pack: "raster-ink",
			languages: ["SELPHY"],
			connections: ["wifi", "usb"],
			borderless: true,
			photo: true,
			family: "selphy"
		}),
		entry({
			id: "br-hl2240",
			brandId: "brother",
			brand: "Brother",
			model: "HL-2240",
			year: 2010,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["호스트 기반"],
			connections: ["usb"],
			color: false,
			family: "host-laser"
		}),
		entry({
			id: "br-hl2270",
			brandId: "brother",
			brand: "Brother",
			model: "HL-2270DW",
			year: 2011,
			generation: "transitional",
			pack: "page-lang",
			fallback: "driverless",
			languages: ["PCL", "AirPrint"],
			connections: ["wifi", "usb"],
			color: false,
			duplex: true,
			airprint: true,
			family: "pcl-laser"
		}),
		entry({
			id: "br-hl2350",
			brandId: "brother",
			brand: "Brother",
			model: "HL-L2350DW",
			year: 2019,
			generation: "modern",
			pack: "driverless",
			fallback: "page-lang",
			languages: ["AirPrint", "PCL"],
			connections: ["wifi", "usb"],
			color: false,
			duplex: true,
			airprint: true,
			family: "pcl-laser"
		}),
		entry({
			id: "br-mfcl2750",
			brandId: "brother",
			brand: "Brother",
			model: "MFC-L2750DW",
			year: 2018,
			generation: "modern",
			pack: "driverless",
			fallback: "page-lang",
			languages: [
				"AirPrint",
				"PCL",
				"BR-Script"
			],
			connections: ["wifi", "usb"],
			color: false,
			duplex: true,
			airprint: true,
			family: "pcl-laser"
		}),
		entry({
			id: "br-t220",
			brandId: "brother",
			brand: "Brother",
			model: "DCP-T220",
			year: 2020,
			generation: "transitional",
			pack: "raster-ink",
			languages: ["Brother 잉크"],
			connections: ["usb"],
			borderless: true,
			family: "ink"
		}),
		entry({
			id: "br-t420w",
			brandId: "brother",
			brand: "Brother",
			model: "DCP-T420W",
			year: 2021,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint", "Brother 잉크"],
			connections: ["wifi", "usb"],
			borderless: true,
			airprint: true,
			family: "ink"
		}),
		entry({
			id: "br-j1205",
			brandId: "brother",
			brand: "Brother",
			model: "MFC-J1205W",
			year: 2022,
			generation: "modern",
			pack: "driverless",
			fallback: "raster-ink",
			languages: ["AirPrint"],
			connections: ["wifi", "usb"],
			borderless: true,
			airprint: true,
			family: "ink"
		}),
		entry({
			id: "br-ql800",
			brandId: "brother",
			brand: "Brother",
			model: "QL-800",
			year: 2017,
			generation: "transitional",
			pack: "mobile-label",
			languages: ["래스터 라벨"],
			connections: ["usb"],
			color: false,
			family: "label"
		}),
		entry({
			id: "br-ql820",
			brandId: "brother",
			brand: "Brother",
			model: "QL-820NWB",
			year: 2017,
			generation: "modern",
			pack: "mobile-label",
			languages: ["래스터 라벨", "AirPrint"],
			connections: [
				"wifi",
				"bluetooth",
				"usb"
			],
			airprint: true,
			family: "label"
		}),
		entry({
			id: "ss-ml1660",
			brandId: "samsung",
			brand: "Samsung",
			model: "ML-1660",
			year: 2010,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["SPL"],
			connections: ["usb"],
			color: false,
			family: "spl"
		}),
		entry({
			id: "ss-ml2160",
			brandId: "samsung",
			brand: "Samsung",
			model: "ML-2160",
			year: 2012,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["SPL"],
			connections: ["usb"],
			color: false,
			family: "spl"
		}),
		entry({
			id: "ss-m2020",
			brandId: "samsung",
			brand: "Samsung",
			model: "Xpress M2020",
			year: 2014,
			generation: "transitional",
			pack: "legacy-host",
			languages: ["SPL"],
			connections: ["usb"],
			color: false,
			family: "spl"
		}),
		entry({
			id: "ss-c480w",
			brandId: "samsung",
			brand: "Samsung",
			model: "Xpress C480W",
			year: 2014,
			generation: "transitional",
			pack: "page-lang",
			fallback: "legacy-host",
			languages: ["PCL", "SPL"],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "spl"
		}),
		entry({
			id: "xe-3020",
			brandId: "xerox",
			brand: "Xerox",
			model: "Phaser 3020",
			year: 2014,
			generation: "legacy",
			pack: "legacy-host",
			languages: ["호스트 기반"],
			connections: ["wifi", "usb"],
			color: false,
			family: "host-laser"
		}),
		entry({
			id: "xe-6515",
			brandId: "xerox",
			brand: "Xerox",
			model: "VersaLink C405",
			year: 2017,
			generation: "modern",
			pack: "driverless",
			fallback: "page-lang",
			languages: [
				"AirPrint",
				"PCL 6",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			airprint: true,
			family: "pcl-laser"
		}),
		entry({
			id: "sd-d450",
			brandId: "sindoh",
			brand: "Sindoh",
			model: "D450",
			year: 2019,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "sd-d452",
			brandId: "sindoh",
			brand: "Sindoh",
			model: "D452",
			year: 2020,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "sd-d330",
			brandId: "sindoh",
			brand: "Sindoh",
			model: "D330",
			year: 2018,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "sd-n610",
			brandId: "sindoh",
			brand: "Sindoh",
			model: "N610",
			year: 2021,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "cn-c3530",
			brandId: "canon",
			brand: "Canon",
			model: "imageRUNNER ADVANCE C3530",
			year: 2017,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"UFR II",
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "cn-c3830",
			brandId: "canon",
			brand: "Canon",
			model: "imageRUNNER ADVANCE C3830",
			year: 2019,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"UFR II",
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "cn-dx3926",
			brandId: "canon",
			brand: "Canon",
			model: "imageRUNNER ADVANCE DX C3926",
			year: 2021,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"UFR II",
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "fx-c2570",
			brandId: "xerox",
			brand: "Fujifilm",
			model: "Apeos C2570",
			year: 2021,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "fx-c3070",
			brandId: "xerox",
			brand: "Fujifilm",
			model: "Apeos C3070",
			year: 2021,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "fx-dc7",
			brandId: "xerox",
			brand: "Fujifilm",
			model: "DocuCentre-VII",
			year: 2016,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "rc-c2000",
			brandId: "ricoh",
			brand: "Ricoh",
			model: "IM C2000",
			year: 2019,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "rc-c3000",
			brandId: "ricoh",
			brand: "Ricoh",
			model: "IM C3000",
			year: 2019,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "rc-mpc3004",
			brandId: "ricoh",
			brand: "Ricoh",
			model: "MP C3004",
			year: 2015,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "km-c250i",
			brandId: "konica",
			brand: "Konica Minolta",
			model: "bizhub C250i",
			year: 2020,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "km-c300i",
			brandId: "konica",
			brand: "Konica Minolta",
			model: "bizhub C300i",
			year: 2020,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "km-c360i",
			brandId: "konica",
			brand: "Konica Minolta",
			model: "bizhub C360i",
			year: 2020,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "ky-2554",
			brandId: "kyocera",
			brand: "Kyocera",
			model: "TASKalfa 2554ci",
			year: 2021,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "ky-3554",
			brandId: "kyocera",
			brand: "Kyocera",
			model: "TASKalfa 3554ci",
			year: 2021,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "ss-k4350",
			brandId: "samsung",
			brand: "Samsung",
			model: "SL-K4350",
			year: 2016,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "ss-x4300",
			brandId: "samsung",
			brand: "Samsung",
			model: "SL-X4300",
			year: 2016,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "hp-e78523",
			brandId: "hp",
			brand: "HP",
			model: "LaserJet Managed E78523",
			year: 2022,
			generation: "modern",
			pack: "page-lang",
			languages: [
				"PCL5e",
				"PCL 6",
				"PDF",
				"PostScript"
			],
			connections: ["wifi", "usb"],
			duplex: true,
			family: "office"
		}),
		entry({
			id: "zb-zd220",
			brandId: "zebra",
			brand: "Zebra",
			model: "ZD220",
			year: 2018,
			generation: "modern",
			pack: "mobile-label",
			languages: ["ZPL"],
			connections: ["usb"],
			color: false,
			family: "zpl"
		}),
		entry({
			id: "zb-gk420",
			brandId: "zebra",
			brand: "Zebra",
			model: "GK420d",
			year: 2009,
			generation: "classic",
			pack: "mobile-label",
			languages: ["ZPL", "EPL"],
			connections: ["usb"],
			color: false,
			family: "zpl"
		}),
		entry({
			id: "ep-tmt20",
			brandId: "epson",
			brand: "Epson",
			model: "TM-T20",
			year: 2011,
			generation: "classic",
			pack: "mobile-label",
			languages: ["ESC/POS"],
			connections: ["usb", "wifi"],
			color: false,
			family: "receipt"
		})
	];
	const BRAND_NAMES = {
		epson: "Epson",
		hp: "HP",
		canon: "Canon",
		brother: "Brother",
		samsung: "Samsung",
		xerox: "Xerox",
		zebra: "Zebra",
		fujitsu: "Fujitsu",
		kyocera: "Kyocera",
		ricoh: "Ricoh",
		oki: "Oki",
		lexmark: "Lexmark",
		pantum: "Pantum",
		sindoh: "Sindoh",
		dell: "Dell",
		sharp: "Sharp",
		konica: "Konica Minolta",
		toshiba: "Toshiba",
		bixolon: "Bixolon",
		star: "Star",
		citizen: "Citizen",
		tsc: "TSC",
		generic: "일반"
	};
	function keyOf(value) {
		return String(value || "").toLowerCase().replace(/프린터|시리즈|series|printer/g, "").replace(/[^a-z0-9가-힣]+/g, "");
	}
	function expand(value) {
		let text = String(value || "").toLowerCase();
		[
			[/엡손/g, "epson"],
			[/캐논/g, "canon"],
			[/셀피/g, "selphy"],
			[/스타일러스/g, "stylus"],
			[/에코탱크/g, "ecotank"],
			[/레이저젯/g, "laserjet"],
			[/데스크젯/g, "deskjet"],
			[/오피스젯/g, "officejet"],
			[/픽스마/g, "pixma"],
			[/브라더/g, "brother"],
			[/삼성/g, "samsung"],
			[/제록스/g, "xerox"],
			[/제브라/g, "zebra"],
			[/휴렛팩커드/g, "hp"],
			[/휴렛/g, "hp"],
			[/스프라켓/g, "sprocket"]
		].forEach(([pattern, to]) => {
			text = text.replace(pattern, to);
		});
		return text;
	}
	function parseIdentity(input) {
		const raw = String(input || "").trim();
		const mfg = /(?:MFG|MANUFACTURER):([^;]+)/i.exec(raw);
		const mdl = /(?:MDL|MODEL):([^;]+)/i.exec(raw);
		const cmd = /(?:CMD|COMMAND SET):([^;]+)/i.exec(raw);
		if (mdl) {
			const brand = mfg ? mfg[1].trim() : "";
			const model = mdl[1].trim();
			return {
				text: brand && model.toLowerCase().startsWith(brand.toLowerCase()) ? model : `${brand} ${model}`.trim(),
				cmd: cmd ? cmd[1].trim() : "",
				pasted: true
			};
		}
		const cmdOnly = /(?:CMD|COMMAND SET):([^;]+)/i.exec(raw);
		return {
			text: raw,
			cmd: cmdOnly ? cmdOnly[1].trim() : "",
			pasted: false
		};
	}
	function detectBrand(text) {
		const t = text.toLowerCase();
		for (const [id, re] of [
			["zebra", /zebra|제브라|zpl|\bzd\d|\bgk420|\bzt\d|eltron|\bepl\b/],
			["canon", /canon|캐논|pixma|pixus|selphy|셀피|\blbp\b|imageclass|maxify|메가탱크|\bbp-?\d{3,4}\b|imagerunner|imageRUNNER|\bir-?\s?adv\b/i],
			["epson", /epson|엡손|stylus|workforce|artisan|ecotank|스타일러스|\btm-t|\bxp-?\d|\bwf-?\d|\bsx-?\d|\blq-?\d|\blx-?\d|\bfx-?\d|\bplq/],
			["hp", /\bhp\b|휴렛|레이저젯|laserjet|deskjet|officejet|envy|photosmart|sprocket|스프라켓|smart ?tank|\blj-?\d/],
			["brother", /brother|브라더|\bhl-|\bmfc-|\bdcp-|\bql-/],
			["samsung", /samsung|삼성|\bml-\d|xpress|\bscx-|\bsl-[kx]/],
			["xerox", /xerox|제록스|후지제록스|후지필름|phaser|versalink|workcentre|docuprint|docucentre|apeos/],
			["kyocera", /kyocera|교세라|ecosys|taskalfa|\bfs-?\d/],
			["ricoh", /ricoh|리코|aficio|\bim[ -]?c?\d/],
			["oki", /\boki\b|오키|microline|\bb4\d{2}d?n?\b/],
			["lexmark", /lexmark|렉스마크|\bms\d{3}(?!\d)/],
			["pantum", /pantum|팬텀|\bp2[25]\d{2}(?!\d)|\bp3300(?!\d)|\bm6500(?!\d)|\bm6700(?!\d)|\bm7100(?!\d)/],
			["sindoh", /sindoh|신도리코|신도/],
			["sharp", /sharp|샤프|\bmx-\d{2,4}|\bar-\d{3}/],
			["konica", /konica|코니카|bizhub|magicolor/],
			["toshiba", /toshiba|도시바|e-?studio/],
			["bixolon", /bixolon|빅솔론|\bsrp-?\d|\bslp-?\d/],
			["star", /star micronics|\btsp-?\d{2,3}|\bsm-t\d/],
			["citizen", /citizen|시티즌|\bct-s/],
			["tsc", /\btsc\b|godex|고덱스|argox|아르곡스|\bte200\b|\bttp-?\d|\btdp-?\d/],
			["dell", /\bdell\b/],
			["fujitsu", /fujitsu|후지쯔|\bdl-?\d/]
		]) if (re.test(t)) return id;
		if (/\bet-?\d{3,5}\b/.test(t) || /\bl\d{3,4}\b/.test(t)) return "epson";
		if (/\b(mg|mx|mp|ip|ts|tr|g)\s?-?\d{3,4}\b/.test(t)) return "canon";
		return "";
	}
	function searchCatalog(text) {
		const expanded = expand(text);
		const q = keyOf(expanded);
		if (!q) return [];
		const hits = CATALOG.map((printer) => {
			const modelKey = keyOf(printer.model);
			const full = keyOf(`${printer.brand} ${printer.model}`);
			let score = 0;
			if (q === full || q === modelKey) score = 98;
			else if (q.includes(modelKey) && modelKey.length >= 4) score = 94;
			else if (full.includes(q) && q.length >= 4) score = 90;
			else {
				const tokens = expanded.split(/[^a-z0-9가-힣]+/).filter((token) => token.length >= 2);
				if (tokens.length && tokens.every((token) => full.includes(keyOf(token)) || modelKey.includes(keyOf(token)))) score = 86;
			}
			return {
				printer,
				score
			};
		});
		const nums = (q.match(/\d{3,}/g) || []).sort((a, b) => b.length - a.length);
		const tagged = q.match(/[a-z]{1,8}\d{3,}/g) || [];
		if (nums[0]) {
			const brand = detectBrand(expanded);
			const tag = tagged.find((item) => item.endsWith(nums[0]) || item.includes(nums[0]));
			const prefix = tag ? tag.slice(0, tag.indexOf(nums[0])) : "";
			const prefixIsBrand = /^(hp|epson|canon|brother|samsung|xerox|kyocera|ricoh|oki|dell|lexmark)$/.test(prefix);
			let precise = CATALOG.filter((printer) => {
				const modelKey = keyOf(printer.model);
				if (!(modelKey.match(/\d{3,}/g) || []).includes(nums[0])) return false;
				if (prefix && !prefixIsBrand && !modelKey.includes(prefix + nums[0])) return false;
				return true;
			});
			if (brand) {
				const branded = precise.filter((printer) => printer.brandId === brand);
				if (branded.length) precise = branded;
			}
			if (precise.length === 1) {
				const found = hits.find((hit) => hit.printer.id === precise[0].id);
				if (found) found.score = Math.max(found.score, 96);
				else hits.push({
					printer: precise[0],
					score: 96
				});
			}
		}
		return hits.filter((hit) => hit.score >= 80).sort((a, b) => b.score - a.score || a.printer.model.length - b.printer.model.length);
	}
	function profileFromSignals(text, brandId, cmd) {
		const t = `${text} ${cmd}`.toLowerCase();
		const has = (re) => re.test(t);
		const brand = brandId || "generic";
		const named = BRAND_NAMES[brand] || "일반";
		if (has(/sprocket|스프라켓|zink/)) return skeleton({
			brandId: brand === "generic" ? "hp" : brand,
			brand: brand === "generic" ? "HP" : named,
			generation: "modern",
			pack: "mobile-label",
			languages: ["ZINK"],
			connections: ["bluetooth"],
			photo: true,
			borderless: true,
			family: "zink",
			reason: "손바닥 포토(ZINK)로 읽혔습니다."
		});
		if (has(/zpl|\bzd\d|\bgk420|zebra|제브라/)) return skeleton({
			brandId: "zebra",
			brand: "Zebra",
			generation: "modern",
			pack: "mobile-label",
			languages: ["ZPL"],
			connections: ["usb"],
			color: false,
			family: "zpl",
			reason: "라벨 명령 ZPL로 읽혔습니다."
		});
		if (has(/\bepl\b|eltron/)) return skeleton({
			brandId: "zebra",
			brand: "Zebra",
			generation: "classic",
			pack: "mobile-label",
			languages: ["EPL"],
			connections: ["usb"],
			color: false,
			family: "epl",
			reason: "구형 라벨 명령 EPL로 읽혔습니다."
		});
		if ((brand === "fujitsu" || has(/fujitsu|후지쯔/)) && has(/\bdl-?\d|도트/)) return skeleton({
			brandId: "fujitsu",
			brand: "Fujitsu",
			generation: "classic",
			pack: "page-lang",
			languages: ["ESC/P"],
			connections: ["usb"],
			color: false,
			family: "dot",
			reason: "후지쯔 도트입니다. ESC/P 문자로 찍습니다."
		});
		if (has(/esc\/?pos|tm-t|영수증|감열|gwp-?\s?80|mini printer|미니 프린터/)) return skeleton({
			brandId: brand === "generic" ? "epson" : brand,
			brand: brand === "generic" ? "Epson" : named,
			generation: "classic",
			pack: "mobile-label",
			languages: ["ESC/POS"],
			connections: ["usb", "bluetooth"],
			color: false,
			family: "receipt",
			reason: "영수증·감열 명령으로 읽혔습니다."
		});
		if (has(/\bql-/)) return skeleton({
			brandId: "brother",
			brand: "Brother",
			generation: has(/nwb|airprint/) ? "modern" : "transitional",
			pack: "mobile-label",
			languages: ["래스터 라벨"],
			connections: has(/nwb|wifi/) ? ["wifi", "usb"] : ["usb"],
			color: false,
			airprint: has(/airprint|nwb/),
			family: "label",
			reason: "Brother 라벨 프린터로 읽혔습니다."
		});
		if (has(/\bcapt\b/) || brand === "canon" && has(/lbp\s?-?(2900|3000|3010|3050|6000|6020|6030)|mf3010/)) return skeleton({
			brandId: "canon",
			brand: "Canon",
			generation: "legacy",
			pack: "legacy-host",
			languages: ["CAPT"],
			connections: ["usb"],
			color: false,
			family: "capt",
			reason: "CAPT·UFR LT 계열 구형 레이저로 읽혔습니다. 페이지 언어 팩으로는 안 맞습니다."
		});
		if (brand === "samsung" && has(/ml-|scx-/) && !has(/airprint|urf|pcl/)) return skeleton({
			brandId: "samsung",
			brand: "Samsung",
			generation: "legacy",
			pack: "legacy-host",
			languages: ["SPL"],
			connections: ["usb"],
			color: false,
			family: "spl",
			reason: "삼성 SPL 구형 레이저로 읽혔습니다."
		});
		if (brand === "hp" && has(/1020|1018|1010|1022|p1005|p1006|p1102|p1505|p1606|m1005|\bm15\b|\bm28\b/)) return skeleton({
			brandId: "hp",
			brand: "HP",
			generation: "legacy",
			pack: "legacy-host",
			languages: ["호스트 기반"],
			connections: has(/w\b|wifi|dn\b/) ? ["wifi", "usb"] : ["usb"],
			color: false,
			duplex: has(/dn\b/),
			family: "host-laser",
			reason: "PCL이 없는 HP 호스트 기반 레이저로 읽혔습니다."
		});
		if (brand === "brother" && has(/hl-?(11|12|21|22)\d{2}|dcp-?15\d{2}|dcp-?16\d{2}|dcp-?705|dcp-?706|mfc-?181|mfc-?7360|hl-2240|hl-2140|hl-1110|hl-1200/)) return skeleton({
			brandId: "brother",
			brand: "Brother",
			generation: "legacy",
			pack: "legacy-host",
			languages: ["호스트 기반"],
			connections: ["usb"],
			color: false,
			family: "host-laser",
			reason: "호스트 기반 구형 Brother 레이저로 읽혔습니다."
		});
		if (brand === "xerox" && has(/3020|3010|3040/)) return skeleton({
			brandId: "xerox",
			brand: "Xerox",
			generation: "legacy",
			pack: "legacy-host",
			languages: ["호스트 기반"],
			connections: ["usb", "wifi"],
			color: false,
			family: "host-laser",
			reason: "호스트 기반 구형 Xerox로 읽혔습니다."
		});
		const modernHint = has(/airprint|mopria|ipp everywhere|image\/urf|\burf\b|pwg-raster|driverless|드라이버리스/);
		if (brand === "epson") {
			if (has(/\blq-|\blx-|\bfx-|\bplq-|\bdlq-/)) return skeleton({
				brandId,
				brand: named,
				generation: "classic",
				pack: "page-lang",
				languages: ["ESC/P"],
				connections: ["usb"],
				color: false,
				family: "dot",
				reason: "도트 매트릭스입니다. ESC/P 문자로 찍고, USB가 열려 있으면 그 명령을 바로 넣습니다."
			});
			if (has(/stylus|스타일러스|\bcx\d|\bc80\b|\bt1[0-9]\b|\bt2[0-3]\b|\btx\d|pm-a|photo 1|\bsx-/)) return skeleton({
				brandId,
				brand: named,
				generation: "classic",
				pack: "raster-ink",
				languages: ["ESC/P"],
				connections: ["usb"],
				borderless: has(/photo/),
				photo: has(/photo/),
				family: "stylus",
				reason: "ESC/P 시대 Stylus·SX 계열로 읽혔습니다."
			});
			if (has(/\bwf-|\bxp-[3-9]/)) return skeleton({
				brandId,
				brand: named,
				generation: "modern",
				pack: "driverless",
				fallback: "raster-ink",
				languages: ["AirPrint", "ESC/P-R"],
				connections: ["wifi", "usb"],
				borderless: true,
				airprint: true,
				family: "workforce",
				reason: "WorkForce·XP 상위 기종은 표준 티켓이 먼저이고, 거절되면 ESC/P-R입니다."
			});
			if (has(/\bxp-[12]/)) return skeleton({
				brandId,
				brand: named,
				generation: "transitional",
				pack: "raster-ink",
				languages: ["ESC/P-R"],
				connections: ["wifi", "usb"],
				borderless: true,
				family: "xp",
				reason: "초기 XP 시리즈는 잉크 래스터가 맞습니다."
			});
			if (has(/\bet-?\d|\becotank\b|\bl[4-9]\d{3}\b|\bl1\d{4}\b/) || modernHint) return skeleton({
				brandId,
				brand: named,
				generation: "modern",
				pack: "driverless",
				fallback: "raster-ink",
				languages: ["AirPrint", "ESC/P-R"],
				connections: ["wifi", "usb"],
				borderless: true,
				duplex: has(/4850|8550|16500|l426|l6|wf-/),
				airprint: true,
				family: "ecotank",
				reason: "에코탱크·ET 계열은 표준 티켓이 먼저이고, 거절되면 ESC/P-R 래스터로 내려갑니다."
			});
			if (has(/\bl\d{3,4}\b|workforce|artisan/)) {
				if (parseInt((/\bl(\d{3,4})\b/.exec(t) || [])[1] || "0", 10) >= 3150 || has(/workforce [4-9]|wf-[4-9]/)) return skeleton({
					brandId,
					brand: named,
					generation: "modern",
					pack: "driverless",
					fallback: "raster-ink",
					languages: ["AirPrint", "ESC/P-R"],
					connections: ["wifi", "usb"],
					borderless: true,
					airprint: true,
					family: "ecotank",
					reason: "번호대가 신형 잉크탱크·WorkForce라 표준 티켓을 먼저 고릅니다."
				});
				return skeleton({
					brandId,
					brand: named,
					generation: "transitional",
					pack: "raster-ink",
					languages: ["ESC/P-R"],
					connections: ["usb", "wifi"],
					borderless: true,
					family: "ecotank",
					reason: "초기 L 시리즈·Artisan은 잉크 래스터가 맞습니다. AirPrint가 없는 모델이 많습니다."
				});
			}
		}
		if (brand === "canon") {
			if (has(/selphy|셀피/)) return skeleton({
				brandId,
				brand: named,
				generation: "transitional",
				pack: "raster-ink",
				languages: ["SELPHY"],
				connections: ["wifi", "usb"],
				borderless: true,
				photo: true,
				family: "selphy",
				reason: "셀피는 작은 염료승화 포토라 잉크 래스터 조각을 씁니다."
			});
			if (has(/\blbp\b/)) return skeleton({
				brandId,
				brand: named,
				generation: has(/6230|7100|226|airprint/) ? "transitional" : "legacy",
				pack: has(/6230|7100|226dw|ufr ii|pcl/) ? "page-lang" : "legacy-host",
				languages: [has(/6230|ufr/) ? "UFR II" : "CAPT"],
				connections: ["usb"],
				color: has(/color|컬러/),
				family: "laser",
				reason: "Canon 레이저는 CAPT면 호스트 브리지, UFR·PCL이면 페이지 언어입니다."
			});
			if (has(/\b(ts|tr)\s?-?\d|imageclass|maxify|\bgx\s?-?\d|\bg[5-7]\d{3}\b/) || modernHint) return skeleton({
				brandId,
				brand: named,
				generation: "modern",
				pack: "driverless",
				fallback: "raster-ink",
				languages: ["AirPrint", "Canon 래스터"],
				connections: ["wifi", "usb"],
				borderless: true,
				duplex: true,
				airprint: true,
				family: "pixma",
				reason: "TS·TR·GX·상위 G 시리즈는 표준 티켓이 먼저입니다."
			});
			if (has(/\bg\s?-?[1-4]0\d{2}\b|\bg2010\b|\bg3010\b|\bg4010\b/)) return skeleton({
				brandId,
				brand: named,
				generation: "transitional",
				pack: "raster-ink",
				languages: ["Canon 래스터"],
				connections: has(/3010|4010|3411|wifi/) ? ["wifi", "usb"] : ["usb"],
				borderless: true,
				family: "megatank",
				reason: "초기 메가탱크(G2010·G3010대)는 AirPrint가 없는 경우가 많아 잉크 래스터를 고릅니다."
			});
			return skeleton({
				brandId,
				brand: named,
				generation: "classic",
				pack: "raster-ink",
				languages: ["Canon 래스터"],
				connections: ["usb"],
				borderless: true,
				family: "pixma",
				reason: "PIXMA iP·MP·MG 구형은 Canon 래스터 조각이 맞습니다."
			});
		}
		if (brand === "hp") {
			if (has(/envy|officejet pro|pagewide|m40\d|m42\d|m45\d|m47\d|mfp m[2-9]|deskjet 27|deskjet 37|deskjet 41|deskjet plus|smart tank 6|smart tank 7/) || modernHint) {
				const laser = has(/laserjet|레이저/);
				return skeleton({
					brandId,
					brand: named,
					generation: "modern",
					pack: "driverless",
					fallback: laser ? "page-lang" : "raster-ink",
					languages: laser ? ["AirPrint", "PCL 6"] : ["AirPrint"],
					connections: ["wifi", "usb"],
					color: !laser,
					duplex: true,
					airprint: true,
					family: laser ? "pcl-laser" : "deskjet",
					reason: "신형 HP는 표준 티켓이 먼저이고, 레이저는 PCL, 잉크는 래스터로 내려갑니다."
				});
			}
			if (has(/laserjet|레이저젯/)) return skeleton({
				brandId,
				brand: named,
				generation: "classic",
				pack: "page-lang",
				languages: ["PCL 5"],
				connections: ["wifi", "usb"],
				color: has(/color|컬러|cp|mfp m/),
				duplex: has(/dn|duplex|양면/),
				family: "pcl-laser",
				reason: "구형 번호가 아닌 LaserJet이라 PCL 페이지 언어를 고릅니다. 1020·P1102처럼 호스트 기반이면 모델 번호를 더 넣어 주세요."
			});
			return skeleton({
				brandId,
				brand: named,
				generation: "transitional",
				pack: "raster-ink",
				languages: ["잉크 래스터"],
				connections: ["usb"],
				borderless: true,
				family: "deskjet",
				reason: "번호가 낮은 DeskJet·Ink Advantage로 보고 잉크 래스터를 고릅니다."
			});
		}
		if (brand === "brother") {
			if (has(/hl-l|mfc-l|dcp-l/) || modernHint) return skeleton({
				brandId,
				brand: named,
				generation: "modern",
				pack: "driverless",
				fallback: "page-lang",
				languages: ["AirPrint", "PCL"],
				connections: ["wifi", "usb"],
				color: has(/color|컬러|cdw|mfc-j/),
				duplex: true,
				airprint: true,
				family: "pcl-laser",
				reason: "Brother L 시리즈 레이저는 표준 티켓, 실패 시 PCL입니다."
			});
			if (has(/mfc-j|dcp-j|dcp-t|mfc-t/)) {
				const newer = has(/t4|t5|t7|t8|j120|j130|airprint/);
				return skeleton({
					brandId,
					brand: named,
					generation: newer ? "modern" : "transitional",
					pack: newer ? "driverless" : "raster-ink",
					fallback: "raster-ink",
					languages: newer ? ["AirPrint", "Brother 잉크"] : ["Brother 잉크"],
					connections: has(/w\b|wifi/) || newer ? ["wifi", "usb"] : ["usb"],
					borderless: true,
					airprint: newer,
					family: "ink",
					reason: newer ? "무선 잉크탱크 Brother는 표준 티켓을 먼저 씁니다." : "초기 Brother 잉크는 전용 래스터가 맞습니다."
				});
			}
			if (has(/dw\b/)) return skeleton({
				brandId,
				brand: named,
				generation: "transitional",
				pack: "page-lang",
				fallback: "driverless",
				languages: ["PCL", "AirPrint"],
				connections: ["wifi", "usb"],
				color: false,
				duplex: true,
				airprint: true,
				family: "pcl-laser",
				reason: "DW가 붙은 구형 Brother 레이저는 PCL이 본팩입니다."
			});
		}
		if (brand === "samsung" || brand === "xerox") {
			if (modernHint || has(/versalink|workcentre|c405|pcl/)) return skeleton({
				brandId: brand,
				brand: named,
				generation: "modern",
				pack: "driverless",
				fallback: "page-lang",
				languages: ["AirPrint", "PCL 6"],
				connections: ["wifi", "usb"],
				airprint: true,
				duplex: true,
				family: "pcl-laser",
				reason: "신형 사무 복합기는 표준 티켓 다음 PCL입니다."
			});
			return skeleton({
				brandId: brand,
				brand: named,
				generation: "transitional",
				pack: "legacy-host",
				languages: ["SPL"],
				connections: ["usb"],
				color: has(/color|컬러|c48/),
				family: "spl",
				reason: "Xpress·Phaser 일부는 아직 SPL·호스트 기반입니다."
			});
		}
		if (brand === "pantum") {
			const pcl = has(/p3|m67|bm5|pcl/);
			return skeleton({
				brandId,
				brand: named,
				generation: pcl ? "classic" : "legacy",
				pack: pcl ? "page-lang" : "legacy-host",
				languages: pcl ? ["PCL"] : ["호스트 기반"],
				connections: ["wifi", "usb"],
				color: has(/color|컬러/),
				family: pcl ? "pcl-laser" : "host-laser",
				reason: pcl ? "Pantum 상위 기종은 PCL로 봅니다." : "Pantum 보급 기종은 호스트 기반인 경우가 많습니다."
			});
		}
		if (brand === "oki" && has(/microline|ml3[02]|ml5[09]/)) return skeleton({
			brandId,
			brand: named,
			generation: "classic",
			pack: "page-lang",
			languages: ["ESC/P"],
			connections: ["usb"],
			color: false,
			family: "dot",
			reason: "OKI 도트입니다. ESC/P에 가까운 문자로 찍습니다."
		});
		if ([
			"kyocera",
			"ricoh",
			"oki",
			"lexmark",
			"dell",
			"sindoh",
			"sharp",
			"konica",
			"toshiba"
		].includes(brand)) return skeleton({
			brandId,
			brand: named,
			generation: modernHint ? "modern" : "classic",
			pack: modernHint ? "driverless" : "page-lang",
			fallback: modernHint ? "page-lang" : "",
			languages: modernHint ? ["AirPrint", "PCL"] : ["PCL"],
			connections: ["wifi", "usb"],
			color: has(/color|컬러|c\d/),
			duplex: has(/\bdn\b|duplex|양면/),
			airprint: !!modernHint,
			family: "pcl-laser",
			reason: modernHint ? "사무 레이저에 AirPrint 문구가 있어 표준 티켓을 먼저 둡니다." : "사무 레이저로 보고 PCL을 기본으로 둡니다."
		});
		if ([
			"bixolon",
			"star",
			"citizen"
		].includes(brand)) return skeleton({
			brandId,
			brand: named,
			generation: "classic",
			pack: "mobile-label",
			languages: ["ESC/POS"],
			connections: ["usb", "bluetooth"],
			color: false,
			family: "receipt",
			reason: "영수증 프린터입니다. ESC/POS로 글자를 넣고, USB가 열려 있으면 바로 보냅니다."
		});
		if (brand === "tsc") return skeleton({
			brandId,
			brand: named,
			generation: "classic",
			pack: "mobile-label",
			languages: ["TSPL"],
			connections: ["usb"],
			color: false,
			family: "tspl",
			reason: "라벨 프린터입니다. TSPL로 한 장을 찍습니다. ZPL 기종과 명령이 다릅니다."
		});
		if (modernHint) return skeleton({
			brandId: brand,
			brand: named,
			generation: "modern",
			pack: "driverless",
			fallback: "page-lang",
			languages: ["AirPrint", "IPP"],
			connections: ["wifi"],
			airprint: true,
			family: "ipp",
			reason: "AirPrint·IPP 문구가 있어 표준 티켓을 고릅니다. 제조사를 같이 적으면 폴백이 정확해집니다."
		});
		if (has(/\bpcl\b|postscript|br-script/)) return skeleton({
			brandId: brand,
			brand: named,
			generation: "classic",
			pack: "page-lang",
			languages: ["PCL"],
			connections: ["wifi", "usb"],
			family: "pcl",
			reason: "PCL·PostScript 문구가 있어 페이지 언어를 고릅니다."
		});
		return skeleton({
			brandId: brand,
			brand: named,
			generation: "classic",
			pack: "page-lang",
			languages: ["일반 PCL"],
			connections: ["wifi", "usb"],
			family: "unknown",
			reason: "카탈로그에 없는 이름이라 사무실에서 가장 흔한 페이지 언어로 일단 놓았습니다. 제조사와 모델 번호를 더 적어 주면 구형 호스트와 신형 표준을 다시 가릅니다.",
			weak: true
		});
	}
	function skeleton(partial) {
		return {
			id: "inferred",
			model: "",
			year: partial.generation === "modern" ? 2020 : partial.generation === "legacy" ? 2008 : 2013,
			color: true,
			duplex: false,
			borderless: false,
			photo: false,
			airprint: false,
			fallback: partial.pack === "driverless" ? "page-lang" : "",
			connections: ["wifi"],
			...partial
		};
	}
	function fromPrinter(printer, meta) {
		const packId = meta.packId || printer.pack;
		const generation = GENERATIONS[printer.generation];
		const alternatives = (meta.alternatives || []).slice(0, 3).map((item) => ({
			id: item.id,
			brand: item.brand,
			model: item.model,
			generation: item.generation,
			pack: item.pack
		}));
		return {
			kind: "match",
			query: meta.query,
			source: meta.source,
			confidence: meta.confidence,
			reason: meta.reason || `${printer.brand} ${printer.model} 카탈로그와 맞았습니다.`,
			printer: {
				id: printer.id,
				brandId: printer.brandId,
				brand: printer.brand,
				model: printer.model,
				year: printer.year,
				generation: printer.generation,
				languages: printer.languages,
				connections: printer.connections,
				color: printer.color,
				duplex: printer.duplex,
				borderless: printer.borderless,
				photo: printer.photo,
				airprint: printer.airprint,
				family: printer.family
			},
			generation,
			pack: PACKS[packId],
			fallback: printer.fallback ? PACKS[printer.fallback] : null,
			alternatives,
			log: meta.log
		};
	}
	function match(input, cmdHint) {
		const parsed = parseIdentity(input);
		const text = parsed.text.replace(/\s+/g, " ").trim();
		const cmd = parsed.cmd || String(cmdHint || "").trim();
		if (!text) return { kind: "empty" };
		const hits = searchCatalog(text);
		const brandId = detectBrand(`${text} ${cmd}`);
		const log = [{
			step: "읽기",
			detail: parsed.pasted ? "MFG·MDL은 모델로, CMD는 명령 힌트로 나눴습니다." : "모델 이름을 정규화했습니다."
		}, {
			step: "제조사",
			detail: brandId ? `${BRAND_NAMES[brandId]} 계열로 봤습니다.` : "제조사 단서가 약합니다."
		}];
		if (cmd) log.push({
			step: "명령",
			detail: `CMD에서 ${cmd} 를 봤습니다.`
		});
		if (hits.length === 1 || hits.length > 1 && hits[0].score >= 90 && hits[0].score - hits[1].score >= 4) {
			log.push({
				step: "카탈로그",
				detail: `${hits[0].printer.brand} ${hits[0].printer.model} 과 가장 가깝습니다.`
			});
			log.push({
				step: "세대",
				detail: `${GENERATIONS[hits[0].printer.generation].label} · ${GENERATIONS[hits[0].printer.generation].era}`
			});
			log.push({
				step: "팩",
				detail: `${PACKS[hits[0].printer.pack].name} 을 조립합니다.`
			});
			return fromPrinter(hits[0].printer, {
				query: text,
				source: "catalog",
				confidence: hits[0].score,
				alternatives: hits.slice(1).map((hit) => hit.printer),
				log
			});
		}
		if (hits.length >= 4 && hits[0].score < 93 && keyOf(text).length < 8) {
			log.push({
				step: "목록",
				detail: "이름이 넓어서 모델을 먼저 고르게 합니다."
			});
			return {
				kind: "list",
				query: text,
				log,
				hits: hits.slice(0, 8).map((hit) => hit.printer)
			};
		}
		const inferred = profileFromSignals(text, brandId, cmd);
		if (cmd && /urf|airprint|pwg/i.test(cmd) && inferred.pack !== "mobile-label" && inferred.generation !== "legacy") {
			inferred.generation = "modern";
			inferred.airprint = true;
			inferred.fallback = inferred.fallback || (inferred.color ? "raster-ink" : "page-lang");
			inferred.pack = "driverless";
			inferred.reason = "CMD에 URF·AirPrint가 있어 표준 티켓을 우선합니다. 카탈로그에 없는 모델이라 폴백을 같이 준비합니다.";
		}
		const confidence = inferred.weak ? 36 : hits[0] ? 74 : inferred.airprint ? 78 : 71;
		const namedBrand = BRAND_NAMES[brandId] || "";
		if (namedBrand && namedBrand !== "일반" && text.toLowerCase().startsWith(`${namedBrand.toLowerCase()} `)) inferred.model = text.slice(namedBrand.length).trim();
		else inferred.model = text;
		log.push({
			step: "추론",
			detail: inferred.reason
		});
		log.push({
			step: "세대",
			detail: `${GENERATIONS[inferred.generation].label} · ${GENERATIONS[inferred.generation].era}`
		});
		log.push({
			step: "팩",
			detail: `${PACKS[inferred.pack].name} 을 조립합니다.`
		});
		return fromPrinter(inferred, {
			query: text,
			source: inferred.weak ? "unknown" : "heuristic",
			confidence,
			reason: inferred.reason,
			alternatives: hits.slice(0, 3).map((hit) => hit.printer),
			log
		});
	}
	return {
		GENERATIONS,
		PACKS,
		match
	};
})();
var DRIVER_ROWS = [
	"splix	Dell 1100",
	"splix	Dell 1110",
	"splix	Samsung CLP-200",
	"splix	Samsung CLP-300",
	"splix	Samsung CLP-310",
	"splix	Samsung CLP-310N",
	"splix	Samsung CLP-315",
	"splix	Samsung CLP-500",
	"splix	Samsung CLP-510",
	"splix	Samsung CLP-550",
	"splix	Samsung CLP-600",
	"splix	Samsung CLX-216X",
	"splix	Samsung CLX-2170",
	"splix	Samsung CLX-3160",
	"splix	Toshiba eSTUDIO180S",
	"splix	Samsung M2020",
	"splix	Samsung M2070",
	"splix	Samsung M267x 287x",
	"splix	Samsung ML-1510",
	"splix	Samsung ML-1520",
	"splix	Samsung ML-1610",
	"splix	Samsung ML-1630",
	"splix	Samsung ML-1640",
	"splix	Samsung ML-1660",
	"splix	Samsung ML-1670",
	"splix	Samsung ML-1710",
	"splix	Samsung ML-1740",
	"splix	Samsung ML-1750",
	"splix	Samsung ML-1860",
	"splix	Samsung ML-1865W",
	"splix	Samsung ML-1910",
	"splix	Samsung ML-1915",
	"splix	Samsung ML-191x 252x",
	"splix	Samsung ML-2010",
	"splix	Samsung ML-2015",
	"splix	Samsung ML-2150",
	"splix	Samsung ML-2160",
	"splix	Samsung ML-2165",
	"splix	Samsung ML-2240",
	"splix	Samsung ML-2250",
	"splix	Samsung ML-2251",
	"splix	Samsung ML-2510",
	"splix	Samsung ML-2525",
	"splix	Samsung ML-2525W",
	"splix	Samsung ML-2550",
	"splix	Samsung ML-2571",
	"splix	Samsung ML-2580",
	"splix	Samsung ML-2580N",
	"splix	Samsung ML-3050",
	"splix	Samsung ML-3051",
	"splix	Samsung ML-3051ND",
	"splix	Samsung ML-3310",
	"splix	Samsung ML-3310ND",
	"splix	Samsung ML-331x",
	"splix	Samsung ML-3471ND",
	"splix	Samsung ML-3560",
	"splix	Xerox Phaser 3115",
	"splix	Xerox Phaser 3116",
	"splix	Xerox Phaser 3117",
	"splix	Xerox Phaser 3120",
	"splix	Xerox Phaser 3121",
	"splix	Xerox Phaser 3122",
	"splix	Xerox Phaser 3124",
	"splix	Xerox Phaser 3130",
	"splix	Xerox Phaser 3140",
	"splix	Xerox Phaser 3150",
	"splix	Xerox Phaser 3155",
	"splix	Xerox Phaser 3160",
	"splix	Xerox Phaser 3420",
	"splix	Xerox Phaser 3425",
	"splix	Xerox Phaser 5500",
	"splix	Xerox Phaser 6100",
	"splix	Xerox Phaser 6110",
	"splix	Samsung SCX-3200",
	"splix	Samsung SCX-3400",
	"splix	Samsung SCX-4100",
	"splix	Samsung SCX-4200",
	"splix	Samsung SCX-4216F",
	"splix	Samsung SCX-4300",
	"splix	Samsung SCX-4500",
	"splix	Samsung SCX-4521F",
	"splix	Samsung SCX-4600",
	"splix	Samsung SCX-4623",
	"splix	Samsung SCX-4623f",
	"splix	Samsung SCX-4623fw",
	"splix	Samsung SCX-4650 4x21S",
	"splix	Samsung SCX-4x21",
	"splix	Samsung SCX-5330N",
	"splix	Samsung SCX-5530FN",
	"splix	Samsung SF-565P",
	"splix	Xerox WorkCentre 3119",
	"splix	Xerox WorkCentre PE114e",
	"splix	Xerox WorkCentre PE16",
	"splix	Lexmark X215 MFP",
	"escpr	Epson Artisan 1430",
	"escpr	Epson Artisan 630",
	"escpr	Epson Artisan 700",
	"escpr	Epson Artisan 710",
	"escpr	Epson Artisan 720",
	"escpr	Epson Artisan 730",
	"escpr	Epson Artisan 800",
	"escpr	Epson Artisan 810",
	"escpr	Epson Artisan 830",
	"escpr	Epson Artisan 837",
	"escpr	Epson E-150",
	"escpr	Epson E-200",
	"escpr	Epson E-300",
	"escpr	Epson E-330",
	"escpr	Epson E-330S",
	"escpr	Epson E-340",
	"escpr	Epson E-350",
	"escpr	Epson E-360 Series",
	"escpr	EPSON E-370 Series",
	"escpr	Epson E-500",
	"escpr	Epson E-520",
	"escpr	Epson E-530",
	"escpr	Epson E-600",
	"escpr	Epson E-700",
	"escpr	Epson E-720",
	"escpr	Epson E-800",
	"escpr	Epson E-810",
	"escpr	Epson E-820",
	"escpr	Epson E-830 Series",
	"escpr	EPSON E-840 Series",
	"escpr	EPSON E-850 Series",
	"escpr	EPSON EC-C110 Series",
	"escpr	EPSON EP-10VA Series",
	"escpr	EPSON EP-306 Series",
	"escpr	EPSON EP-30VA Series",
	"escpr	Epson EP-4004",
	"escpr	Epson EP-702A",
	"escpr	Epson EP-703A",
	"escpr	Epson EP-704A",
	"escpr	Epson EP-705A Series",
	"escpr	EPSON EP-706A Series",
	"escpr	EPSON EP-707A Series",
	"escpr	EPSON EP-708A Series",
	"escpr	EPSON EP-709A Series",
	"escpr	EPSON EP-710A Series",
	"escpr	EPSON EP-711A Series",
	"escpr	EPSON EP-712A Series",
	"escpr	EPSON EP-713A Series",
	"escpr	Epson EP-774A",
	"escpr	Epson EP-775A Series",
	"escpr	EPSON EP-776A Series",
	"escpr	EPSON EP-777A Series",
	"escpr	Epson EP-801A",
	"escpr	Epson EP-802A",
	"escpr	Epson EP-803A",
	"escpr	Epson EP-804A",
	"escpr	Epson EP-805A Series",
	"escpr	EPSON EP-806A Series",
	"escpr	EPSON EP-807A Series",
	"escpr	EPSON EP-808A Series",
	"escpr	EPSON EP-810A Series",
	"escpr	EPSON EP-811A Series",
	"escpr	EPSON EP-812A Series",
	"escpr	EPSON EP-813A Series",
	"escpr	Epson EP-901A",
	"escpr	Epson EP-901F",
	"escpr	Epson EP-902A",
	"escpr	Epson EP-903A",
	"escpr	Epson EP-903F",
	"escpr	Epson EP-904A",
	"escpr	Epson EP-904F",
	"escpr	Epson EP-905A Series",
	"escpr	Epson EP-905F Series",
	"escpr	EPSON EP-906F Series",
	"escpr	EPSON EP-907F Series",
	"escpr	EPSON EP-976A3 Series",
	"escpr	EPSON EP-977A3 Series",
	"escpr	EPSON EP-978A3 Series",
	"escpr	EPSON EP-979A3 Series",
	"escpr	EPSON EP-M552T Series",
	"escpr	EPSON EP-M553T Series",
	"escpr	EPSON EP-M570T Series",
	"escpr	EPSON ET-1110 Series",
	"escpr	EPSON ET-16500 Series",
	"escpr	EPSON ET-1810 Series",
	"escpr	EPSON ET-2500 Series",
	"escpr	EPSON ET-2550 Series",
	"escpr	EPSON ET-2600 Series",
	"escpr	EPSON ET-2610 Series",
	"escpr	EPSON ET-2650 Series",
	"escpr	EPSON ET-2700 Series",
	"escpr	EPSON ET-2710 Series",
	"escpr	EPSON ET-2720 Series",
	"escpr	EPSON ET-2750 Series",
	"escpr	EPSON ET-2760 Series",
	"escpr	EPSON ET-2800 Series",
	"escpr	EPSON ET-2810 Series",
	"escpr	EPSON ET-2820 Series",
	"escpr	EPSON ET-2850 Series",
	"escpr	EPSON ET-4500 Series",
	"escpr	EPSON ET-4550 Series",
	"escpr	EPSON ET-4700 Series",
	"escpr	EPSON ET-4800 Series",
	"escpr	EPSON ET-7700 Series",
	"escpr	EPSON ET-7750 Series",
	"escpr	EPSON ET-M1100 Series",
	"escpr	EPSON ET-M1120 Series",
	"escpr	EPSON ET-M2120 Series",
	"escpr	EPSON EW-052A Series",
	"escpr	EPSON EW-M5071FT Series",
	"escpr	EPSON EW-M571T Series",
	"escpr	EPSON EW-M660FT Series",
	"escpr	EPSON EW-M770T Series",
	"escpr	EPSON EW-M970A3T Series",
	"escpr	Epson K200",
	"escpr	Epson K300",
	"escpr	EPSON L1110 Series",
	"escpr	EPSON L1455 Series",
	"escpr	EPSON L3050 Series",
	"escpr	EPSON L3060 Series",
	"escpr	EPSON L3070 Series",
	"escpr	EPSON L3100 Series",
	"escpr	EPSON L3110 Series",
	"escpr	EPSON L3150 Series",
	"escpr	EPSON L3160 Series",
	"escpr	EPSON L3250 Series",
	"escpr	EPSON L3260 Series",
	"escpr	EPSON L364 Series",
	"escpr	EPSON L375 Series",
	"escpr	EPSON L385 Series",
	"escpr	EPSON L386 Series",
	"escpr	EPSON L395 Series",
	"escpr	EPSON L396 Series",
	"escpr	EPSON L405 Series",
	"escpr	EPSON L4150 Series",
	"escpr	EPSON L4160 Series",
	"escpr	EPSON L4260 Series",
	"escpr	EPSON L455 Series",
	"escpr	EPSON L475 Series",
	"escpr	EPSON L485 Series",
	"escpr	EPSON L486 Series",
	"escpr	EPSON L495 Series",
	"escpr	EPSON L5190 Series",
	"escpr	EPSON L5290 Series",
	"escpr	EPSON L565 Series",
	"escpr	EPSON L575 Series",
	"escpr	EPSON L605 Series",
	"escpr	EPSON L655 Series",
	"escpr	EPSON L7160 Series",
	"escpr	EPSON L7180 Series",
	"escpr	EPSON L805 Series",
	"escpr	EPSON L810 Series",
	"escpr	EPSON L850 Series",
	"escpr	EPSON M1100 Series",
	"escpr	EPSON M1120 Series",
	"escpr	Epson M200 Series",
	"escpr	Epson M205 Series",
	"escpr	EPSON M2110 Series",
	"escpr	EPSON M2120 Series",
	"escpr	Epson ME-301 Series",
	"escpr	Epson ME-303 Series",
	"escpr	Epson ME-400 Series",
	"escpr	Epson ME 200",
	"escpr	Epson ME OFFICE 510",
	"escpr	Epson ME OFFICE 520",
	"escpr	Epson ME OFFICE 530",
	"escpr	Epson ME OFFICE 560W",
	"escpr	Epson ME OFFICE 570",
	"escpr	Epson ME Office 600F",
	"escpr	Epson ME OFFICE 620F",
	"escpr	Epson ME OFFICE 650FN",
	"escpr	Epson ME OFFICE 700FW",
	"escpr	Epson ME OFFICE 900WD",
	"escpr	Epson ME OFFICE 940FW",
	"escpr	Epson ME OFFICE 960FWD",
	"escpr	Epson NX230 TX230",
	"escpr	Epson NX430 TX435",
	"escpr	EPSON PF-70 Series",
	"escpr	EPSON PF-71 Series",
	"escpr	EPSON PF-81 Series",
	"escpr	Epson PictureMate 500",
	"escpr	Epson PictureMate Deluxe",
	"escpr	Epson PictureMate Express",
	"escpr	Epson PictureMate PM 200",
	"escpr	Epson PictureMate PM 210",
	"escpr	Epson PictureMate PM 215",
	"escpr	Epson PictureMate PM 225",
	"escpr	Epson PictureMate PM 235",
	"escpr	Epson PictureMate PM 240",
	"escpr	Epson PictureMate PM 245",
	"escpr	Epson PictureMate PM 250",
	"escpr	Epson PictureMate PM 260",
	"escpr	Epson PictureMate PM 270",
	"escpr	Epson PictureMate PM 280",
	"escpr	Epson PictureMate PM 290",
	"escpr	Epson PictureMate PM 300",
	"escpr	Epson PictureMate PM 310",
	"escpr	EPSON PM-400 Series",
	"escpr	Epson PM-A750",
	"escpr	Epson PM-A820",
	"escpr	Epson PM-A840",
	"escpr	Epson PM-A840S",
	"escpr	Epson PM-A890",
	"escpr	Epson PM-A920",
	"escpr	Epson PM-A940",
	"escpr	Epson PM-A950",
	"escpr	Epson PM-A970",
	"escpr	Epson PM-D600",
	"escpr	Epson PM-D800",
	"escpr	Epson PM-D870",
	"escpr	Epson PM-G4500",
	"escpr	Epson PM-G850",
	"escpr	Epson PM-T960",
	"escpr	Epson PM-T990",
	"escpr	EPSON PX-046A Series",
	"escpr	EPSON PX-047A Series",
	"escpr	EPSON PX-048A Series",
	"escpr	EPSON PX-049A Series",
	"escpr	Epson PX-1600F",
	"escpr	Epson PX-1700F",
	"escpr	Epson PX-205 Series",
	"escpr	Epson PX-404A",
	"escpr	Epson PX-405A Series",
	"escpr	Epson PX-434A",
	"escpr	Epson PX-435A Series",
	"escpr	EPSON PX-436A Series",
	"escpr	EPSON PX-437A Series",
	"escpr	Epson PX-501A",
	"escpr	Epson PX-502A",
	"escpr	Epson PX-503A",
	"escpr	Epson PX-504A",
	"escpr	Epson PX-505F Series",
	"escpr	Epson PX-535F Series",
	"escpr	Epson PX-5600",
	"escpr	Epson PX-5V",
	"escpr	Epson PX-601F",
	"escpr	Epson PX-602F",
	"escpr	Epson PX-603F",
	"escpr	Epson PX-605F Series",
	"escpr	Epson PX-673F",
	"escpr	Epson PX-675F Series",
	"escpr	Epson PX-7V",
	"escpr	Epson PX-A620",
	"escpr	Epson PX-A640",
	"escpr	Epson PX-A650",
	"escpr	Epson PX-A720",
	"escpr	Epson PX-A740",
	"escpr	Epson PX-B700",
	"escpr	Epson PX-B750F",
	"escpr	Epson PX-FA700",
	"escpr	Epson PX-G5300",
	"escpr	EPSON PX-M160T Series",
	"escpr	EPSON PX-M350F",
	"escpr	EPSON PX-M5040F",
	"escpr	EPSON PX-M5041F",
	"escpr	EPSON PX-M650A",
	"escpr	EPSON PX-M650F",
	"escpr	EPSON PX-M7050FP",
	"escpr	EPSON PX-M7050FX",
	"escpr	EPSON PX-M7050 Series",
	"escpr	EPSON PX-M740F",
	"escpr	EPSON PX-M741F",
	"escpr	EPSON PX-M840F",
	"escpr	EPSON PX-M840FX",
	"escpr	EPSON PX-M860F",
	"escpr	EPSON PX-S05 Series",
	"escpr	EPSON PX-S06 Series",
	"escpr	EPSON PX-S160T Series",
	"escpr	EPSON PX-S170T Series",
	"escpr	EPSON PX-S170UT Series",
	"escpr	EPSON PX-S350",
	"escpr	EPSON PX-S5040",
	"escpr	EPSON PX-S7050PS",
	"escpr	EPSON PX-S7050X",
	"escpr	EPSON PX-S7050 Series",
	"escpr	EPSON PX-S740",
	"escpr	EPSON PX-S840",
	"escpr	EPSON PX-S840X",
	"escpr	EPSON PX-S860",
	"escpr	EPSON ST-2000 Series",
	"escpr	EPSON ST-C2100 Series",
	"escpr	Epson Stylus CX2800",
	"escpr	Epson Stylus CX2900",
	"escpr	Epson Stylus CX3700",
	"escpr	Epson Stylus CX3800",
	"escpr	Epson Stylus CX3900",
	"escpr	Epson Stylus CX4200",
	"escpr	Epson Stylus CX4800",
	"escpr	Epson Stylus CX4900",
	"escpr	Epson Stylus CX5000",
	"escpr	Epson Stylus CX5900",
	"escpr	Epson Stylus CX6000",
	"escpr	Epson Stylus CX7300",
	"escpr	Epson Stylus CX7400",
	"escpr	Epson Stylus CX7700",
	"escpr	Epson Stylus CX7800",
	"escpr	Epson Stylus CX8300",
	"escpr	Epson Stylus CX8400",
	"escpr	Epson Stylus CX9300F",
	"escpr	Epson Stylus CX9400Fax",
	"escpr	Epson Stylus DX3800",
	"escpr	Epson Stylus DX4000",
	"escpr	Epson Stylus DX4200",
	"escpr	Epson Stylus DX4800",
	"escpr	Epson Stylus DX5000",
	"escpr	Epson Stylus DX7400",
	"escpr	Epson Stylus DX8400",
	"escpr	Epson Stylus DX9400F",
	"escpr	Epson Stylus NX200",
	"escpr	Epson Stylus NX210",
	"escpr	Epson Stylus NX230",
	"escpr	Epson Stylus NX300",
	"escpr	Epson Stylus NX330",
	"escpr	Epson Stylus NX400",
	"escpr	Epson Stylus NX410",
	"escpr	Epson Stylus NX420",
	"escpr	Epson Stylus NX430",
	"escpr	Epson Stylus NX510",
	"escpr	Epson Stylus NX530",
	"escpr	Epson Stylus NX620",
	"escpr	Epson Stylus NX635",
	"escpr	Epson Stylus Office BX300F",
	"escpr	Epson Stylus Office BX305",
	"escpr	Epson Stylus Office BX305 Plus",
	"escpr	Epson Stylus Office BX310FN",
	"escpr	Epson Stylus Office BX320FW",
	"escpr	Epson Stylus Office BX525WD",
	"escpr	Epson Stylus Office BX535WD",
	"escpr	Epson Stylus Office BX600FW",
	"escpr	Epson Stylus Office BX610FW",
	"escpr	Epson Stylus Office BX620FWD",
	"escpr	Epson Stylus Office BX630FW",
	"escpr	Epson Stylus Office BX635FWD",
	"escpr	Epson Stylus Office BX925",
	"escpr	Epson Stylus Office BX935",
	"escpr	Epson Stylus Office TX300F",
	"escpr	Epson Stylus Office TX320F",
	"escpr	Epson Stylus Office TX510FN",
	"escpr	Epson Stylus Office TX515FN",
	"escpr	Epson Stylus Office TX525FW",
	"escpr	Epson Stylus Office TX600FW",
	"escpr	Epson Stylus Office TX610FW",
	"escpr	Epson Stylus Office TX620FWD",
	"escpr	Epson Stylus Photo 1400",
	"escpr	Epson Stylus Photo 1410",
	"escpr	Epson Stylus Photo 1430",
	"escpr	Epson Stylus Photo 1500",
	"escpr	Epson Stylus Photo PX650",
	"escpr	Epson Stylus Photo PX660",
	"escpr	Epson Stylus Photo PX700W",
	"escpr	Epson Stylus Photo PX710W",
	"escpr	Epson Stylus Photo PX720WD",
	"escpr	Epson Stylus Photo PX730",
	"escpr	Epson Stylus Photo PX800FW",
	"escpr	Epson Stylus Photo PX810FW",
	"escpr	Epson Stylus Photo PX820FWD",
	"escpr	Epson Stylus Photo PX830",
	"escpr	Epson Stylus Photo R1900",
	"escpr	Epson Stylus Photo R2000",
	"escpr	Epson Stylus Photo R240",
	"escpr	Epson Stylus Photo R250",
	"escpr	Epson Stylus Photo R260",
	"escpr	Epson Stylus Photo R265",
	"escpr	Epson Stylus Photo R270",
	"escpr	Epson Stylus Photo R2880",
	"escpr	Epson Stylus Photo R3000",
	"escpr	Epson Stylus Photo R340",
	"escpr	Epson Stylus Photo R350",
	"escpr	Epson Stylus Photo R360",
	"escpr	Epson Stylus Photo R380",
	"escpr	Epson Stylus Photo R390",
	"escpr	Epson Stylus Photo RX520",
	"escpr	Epson Stylus Photo RX530",
	"escpr	Epson Stylus Photo RX560",
	"escpr	Epson Stylus Photo RX580",
	"escpr	Epson Stylus Photo RX585",
	"escpr	Epson Stylus Photo RX590",
	"escpr	Epson Stylus Photo RX595",
	"escpr	Epson Stylus Photo RX610",
	"escpr	Epson Stylus Photo RX640",
	"escpr	Epson Stylus Photo RX650",
	"escpr	Epson Stylus Photo RX680",
	"escpr	Epson Stylus Photo RX685",
	"escpr	Epson Stylus Photo RX690",
	"escpr	Epson Stylus Photo TX650",
	"escpr	Epson Stylus Photo TX700W",
	"escpr	Epson Stylus Photo TX710W",
	"escpr	Epson Stylus Photo TX720WD",
	"escpr	Epson Stylus Photo TX730",
	"escpr	Epson Stylus Photo TX800FW",
	"escpr	Epson Stylus Photo TX810FW",
	"escpr	Epson Stylus SX200",
	"escpr	Epson Stylus SX210",
	"escpr	Epson Stylus SX218",
	"escpr	Epson Stylus SX230",
	"escpr	Epson Stylus SX235",
	"escpr	Epson Stylus SX400",
	"escpr	Epson Stylus SX410",
	"escpr	Epson Stylus SX420W",
	"escpr	Epson Stylus SX430",
	"escpr	Epson Stylus SX440",
	"escpr	Epson Stylus SX510W",
	"escpr	Epson Stylus SX525WD",
	"escpr	Epson Stylus SX535WD",
	"escpr	Epson Stylus SX600FW",
	"escpr	Epson Stylus SX610FW",
	"escpr	Epson Stylus SX620FW",
	"escpr	Epson Stylus TX200",
	"escpr	Epson Stylus TX210",
	"escpr	Epson Stylus TX220",
	"escpr	Epson Stylus TX230",
	"escpr	Epson Stylus TX235",
	"escpr	Epson Stylus TX400",
	"escpr	Epson Stylus TX410",
	"escpr	Epson Stylus TX420W",
	"escpr	Epson Stylus TX430",
	"escpr	Epson Stylus TX550W",
	"escpr	Epson Stylus TX560WD",
	"escpr	Epson TX220 NX220",
	"escpr	Epson TX320 WorkForce320",
	"escpr	Epson TX420 NX420",
	"escpr	Epson TX720 Artisan720",
	"escpr	Epson TX820 Artisan830",
	"escpr	EPSON WF-100 Series",
	"escpr	EPSON WF-110 Series",
	"escpr	Epson WF-2510 Series",
	"escpr	Epson WF-2520 Series",
	"escpr	Epson WF-2530 Series",
	"escpr	Epson WF-2540 Series",
	"escpr	EPSON WF-2630 Series",
	"escpr	EPSON WF-2650 Series",
	"escpr	EPSON WF-2660 Series",
	"escpr	EPSON WF-2750 Series",
	"escpr	EPSON WF-2760 Series",
	"escpr	EPSON WF-2810 Series",
	"escpr	EPSON WF-2820 Series",
	"escpr	EPSON WF-2830 Series",
	"escpr	EPSON WF-2840 Series",
	"escpr	EPSON WF-2850 Series",
	"escpr	EPSON WF-2870 Series",
	"escpr	Epson WF-3010 Series",
	"escpr	Epson WF-3520 Series",
	"escpr	Epson WF-3530 Series",
	"escpr	Epson WF-3540 Series",
	"escpr	EPSON WF-3620 Series",
	"escpr	EPSON WF-3640 Series",
	"escpr	EPSON WF-4630 Series",
	"escpr	EPSON WF-4640 Series",
	"escpr	EPSON WF-5110 Series",
	"escpr	EPSON WF-5190 Series",
	"escpr	EPSON WF-5620 Series",
	"escpr	EPSON WF-5690 Series",
	"escpr	EPSON WF-6090 Series",
	"escpr	EPSON WF-6530 Series",
	"escpr	EPSON WF-6590 Series",
	"escpr	EPSON WF-7110 Series",
	"escpr	Epson WF-7510 Series",
	"escpr	Epson WF-7511 Series",
	"escpr	Epson WF-7515 Series",
	"escpr	Epson WF-7520 Series",
	"escpr	Epson WF-7521 Series",
	"escpr	Epson WF-7525 Series",
	"escpr	EPSON WF-7610 Series",
	"escpr	EPSON WF-7620 Series",
	"escpr	EPSON WF-8010 Series",
	"escpr	EPSON WF-8090 Series",
	"escpr	EPSON WF-8510 Series",
	"escpr	EPSON WF-8590 Series",
	"escpr	Epson WF-M1560 Series",
	"escpr	EPSON WF-M5190 Series",
	"escpr	EPSON WF-M5690 Series",
	"escpr	EPSON WF-R4640 Series",
	"escpr	EPSON WF-R5190 Series",
	"escpr	EPSON WF-R5690 Series",
	"escpr	EPSON WF-R8590 Series",
	"escpr	Epson WorkForce 310",
	"escpr	Epson WorkForce 320",
	"escpr	Epson WorkForce 435",
	"escpr	Epson WorkForce 500",
	"escpr	Epson WorkForce 520",
	"escpr	Epson WorkForce 545",
	"escpr	Epson WorkForce 600",
	"escpr	Epson WorkForce 610",
	"escpr	Epson WorkForce 620",
	"escpr	Epson WorkForce 630",
	"escpr	Epson WorkForce 645",
	"escpr	Epson WorkForce 840",
	"escpr	Epson WorkForce 845",
	"escpr	Epson WP-4010 Series",
	"escpr	Epson WP-4011 Series",
	"escpr	Epson WP-4015 Series",
	"escpr	Epson WP-4020 Series",
	"escpr	Epson WP-4022 Series",
	"escpr	Epson WP-4023 Series",
	"escpr	Epson WP-4025 Series",
	"escpr	Epson WP-4090 Series",
	"escpr	Epson WP-4091 Series",
	"escpr	Epson WP-4092 Series",
	"escpr	Epson WP-4095 Series",
	"escpr	Epson WP-4511 Series",
	"escpr	Epson WP-4515 Series",
	"escpr	Epson WP-4520 Series",
	"escpr	Epson WP-4521 Series",
	"escpr	Epson WP-4525 Series",
	"escpr	Epson WP-4530 Series",
	"escpr	Epson WP-4531 Series",
	"escpr	Epson WP-4532 Series",
	"escpr	Epson WP-4533 Series",
	"escpr	Epson WP-4535 Series",
	"escpr	Epson WP-4540 Series",
	"escpr	Epson WP-4545 Series",
	"escpr	Epson WP-4590 Series",
	"escpr	Epson WP-4592 Series",
	"escpr	Epson WP-4595 Series",
	"escpr	EPSON WP-M4011 Series",
	"escpr	EPSON WP-M4015 Series",
	"escpr	EPSON WP-M4095 Series",
	"escpr	EPSON WP-M4521 Series",
	"escpr	EPSON WP-M4525 Series",
	"escpr	EPSON WP-M4595 Series",
	"escpr	Epson XP-200 Series",
	"escpr	Epson XP-201 204 208 Series",
	"escpr	Epson XP-202 203 206 Series",
	"escpr	Epson XP-205 207 Series",
	"escpr	EPSON XP-2100 Series",
	"escpr	EPSON XP-211 214 216 Series",
	"escpr	EPSON XP-212 213 Series",
	"escpr	EPSON XP-2150 Series",
	"escpr	EPSON XP-215 217 Series",
	"escpr	EPSON XP-220 Series",
	"escpr	EPSON XP-225 Series",
	"escpr	EPSON XP-235 Series",
	"escpr	EPSON XP-240 Series",
	"escpr	EPSON XP-243 245 247 Series",
	"escpr	EPSON XP-255 257 Series",
	"escpr	Epson XP-300 Series",
	"escpr	Epson XP-302 303 305 306 Series",
	"escpr	EPSON XP-3100 Series",
	"escpr	EPSON XP-310 Series",
	"escpr	EPSON XP-312 313 315 Series",
	"escpr	EPSON XP-3150 Series",
	"escpr	EPSON XP-320 Series",
	"escpr	EPSON XP-322 323 325 Series",
	"escpr	EPSON XP-330 Series",
	"escpr	EPSON XP-332 335 Series",
	"escpr	EPSON XP-340 Series",
	"escpr	EPSON XP-342 343 345 Series",
	"escpr	EPSON XP-352 355 Series",
	"escpr	Epson XP-400 Series",
	"escpr	Epson XP-402 403 405 406 Series",
	"escpr	EPSON XP-4100 Series",
	"escpr	EPSON XP-410 Series",
	"escpr	EPSON XP-412 413 415 Series",
	"escpr	EPSON XP-4150 Series",
	"escpr	EPSON XP-420 Series",
	"escpr	EPSON XP-422 423 425 Series",
	"escpr	EPSON XP-430 Series",
	"escpr	EPSON XP-432 435 Series",
	"escpr	EPSON XP-440 Series",
	"escpr	EPSON XP-442 445 Series",
	"escpr	EPSON XP-452 455 Series",
	"escpr	EPSON XP-510 Series",
	"escpr	EPSON XP-520 Series",
	"escpr	EPSON XP-530 Series",
	"escpr	EPSON XP-540 Series",
	"escpr	EPSON XP-55 Series",
	"escpr	EPSON XP-600 Series",
	"escpr	EPSON XP-610 Series",
	"escpr	EPSON XP-620 Series",
	"escpr	EPSON XP-630 Series",
	"escpr	EPSON XP-640 Series",
	"escpr	EPSON XP-700 Series",
	"escpr	EPSON XP-7100 Series",
	"escpr	EPSON XP-710 Series",
	"escpr	EPSON XP-720 Series",
	"escpr	Epson XP-750 Series",
	"escpr	EPSON XP-760 Series",
	"escpr	EPSON XP-800 Series",
	"escpr	EPSON XP-810 Series",
	"escpr	EPSON XP-820 Series",
	"escpr	EPSON XP-830 Series",
	"escpr	Epson XP-850 Series",
	"escpr	EPSON XP-860 Series",
	"escpr	EPSON XP-900 Series",
	"escpr	EPSON XP-950 Series",
	"escpr	EPSON XP-960 Series",
	"escpr	Generic Epson ESC/P-R",
	"hplip	Apollo 2100",
	"hplip	Apollo 2150",
	"hplip	Apollo 2200",
	"hplip	Apollo 2500",
	"hplip	Apollo 2600",
	"hplip	Apollo 2650",
	"hplip	Apollo p2000-u	P2000-U Printer",
	"hplip	Apollo p2250	P2250 Printer",
	"hplip	Generic PCL 5c/PCL XL Printer",
	"hplip	Generic PCL 5e/PCL XL Printer",
	"hplip	HP 2000c",
	"hplip	HP 2500c	Plus Printer",
	"hplip	HP 910",
	"hplip	HP 915	Inkjet All-in-one Printer",
	"hplip	HP Amp	130 All-in-one",
	"hplip	HP Business Inkjet 1000",
	"hplip	HP Business Inkjet 1100",
	"hplip	HP Business Inkjet 1200",
	"hplip	HP Business Inkjet 2200",
	"hplip	HP Business Inkjet 2230",
	"hplip	HP Business Inkjet 2250",
	"hplip	HP Business Inkjet 2280",
	"hplip	HP Business Inkjet 2300",
	"hplip	HP Business Inkjet 2600",
	"hplip	HP Business Inkjet 2800",
	"hplip	HP Business Inkjet 3000",
	"hplip	HP Color Inkjet Printer cp1700	cp1700 Printer",
	"hplip	HP Color LaserJet 1600",
	"hplip	HP Color LaserJet 2500 Series",
	"hplip	HP Color LaserJet 2600n",
	"hplip	HP Color LaserJet 3000",
	"hplip	HP Color LaserJet 3500",
	"hplip	HP Color LaserJet 3500n",
	"hplip	HP Color LaserJet 3550",
	"hplip	HP Color LaserJet 3550n",
	"hplip	HP Color LaserJet 3600",
	"hplip	HP Color LaserJet 3700",
	"hplip	HP Color LaserJet 3700n	3700d Printer",
	"hplip	HP Color LaserJet 3800",
	"hplip	HP Color LaserJet 4500",
	"hplip	HP Color LaserJet 4550	4550hdn Plus Printer|4550n Plus Printer",
	"hplip	HP Color LaserJet 4600	Series Printer",
	"hplip	HP Color LaserJet 4610	4610n Printer",
	"hplip	HP Color LaserJet 4650",
	"hplip	HP Color LaserJet 4700",
	"hplip	HP Color LaserJet 4730mfp	4730 Multifunction Printer",
	"hplip	HP Color LaserJet 5",
	"hplip	HP Color LaserJet 5500",
	"hplip	HP Color LaserJet 5550",
	"hplip	HP Color LaserJet 5m",
	"hplip	HP Color LaserJet 8500",
	"hplip	HP Color LaserJet 8550	Multifunction Printer|8550mn Printer",
	"hplip	HP Color LaserJet 9500	Multifunction Printer",
	"hplip	HP Color LaserJet cm1312nfi MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm1312 MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm2320fxi MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm2320nf MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm2320n MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm2320 MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm3530 MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm4540 MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm4730 MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm6030 MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm6040 MFP	Multifunction Printer",
	"hplip	HP Color LaserJet cm6049 MFP",
	"hplip	HP Color LaserJet cp1215",
	"hplip	HP Color LaserJet cp1217",
	"hplip	HP Color LaserJet cp1514n",
	"hplip	HP Color LaserJet cp1515n",
	"hplip	HP Color LaserJet cp1518ni",
	"hplip	HP Color LaserJet cp2025",
	"hplip	HP Color LaserJet cp2025dn",
	"hplip	HP Color LaserJet cp2025n",
	"hplip	HP Color LaserJet cp2025x",
	"hplip	HP Color LaserJet cp3505",
	"hplip	HP Color LaserJet cp3525",
	"hplip	HP Color LaserJet cp4005	Series Printer|cp4005dn Printer",
	"hplip	HP Color LaserJet cp4020 Series",
	"hplip	HP Color LaserJet cp4520 Series",
	"hplip	HP Color LaserJet cp5225",
	"hplip	HP Color LaserJet cp5225dn",
	"hplip	HP Color LaserJet cp5225n",
	"hplip	HP Color LaserJet cp5520 Series",
	"hplip	HP Color LaserJet cp6015	cp6015de Printer",
	"hplip	HP Color LaserJet Pro MFP m176n",
	"hplip	HP Color LaserJet Pro MFP m177fw",
	"hplip	HP cp1160	Color Inkjet cp1160 Printer",
	"hplip	HP Deskjet 1000 j110 Series",
	"hplip	HP Deskjet 1010 Series	Ink Advantage 1010 Printer Series",
	"hplip	HP Deskjet 1050 j410 Series	All-in-one Printer|1051 All-in-one Printer",
	"hplip	HP Deskjet 1100	1100c Printer",
	"hplip	HP Deskjet 1110 Series	Ink Advantage 1110 Printer",
	"hplip	HP Deskjet 1120	1120c Printer",
	"hplip	HP Deskjet 1125	1125c Printer",
	"hplip	HP Deskjet 1200c	1200c/ps Printer",
	"hplip	HP Deskjet 1200 Series	Ink Advantage 1200",
	"hplip	HP Deskjet 1220c",
	"hplip	HP Deskjet 1280",
	"hplip	HP Deskjet 1510 Series	All-in-one Printer|Ink Advantage 1510 All-in-one Printer Series",
	"hplip	HP Deskjet 1600c",
	"hplip	HP Deskjet 1600cm",
	"hplip	HP Deskjet 1600cn",
	"hplip	HP Deskjet 2000 j210 Series",
	"hplip	HP Deskjet 2020 Series	Ink Advantage 2020hc Printer|Ultra Ink Advantage 2029 Printer",
	"hplip	HP Deskjet 2050 j510 Series	All-in-one Printer",
	"hplip	HP Deskjet 2130 Series	All-in-one Printer Series|Ink Advantage 2130 All-in_one Printer",
	"hplip	HP Deskjet 2200 Series	Ink Advantage 2200 All-in-one",
	"hplip	HP Deskjet 2300 Series	Ink Advantage 2300 All-in-one",
	"hplip	HP Deskjet 2510 Series	All-in-one Printer|Ink Advantage 2510 All-in-one",
	"hplip	HP Deskjet 2520 Series	Ink Advantage 2520hc All-in-one|Ultra 2529 All-in-one Printer",
	"hplip	HP Deskjet 2540 Series	All-in-one Printer|Ink Advantage 2540 All-in-one Printer Series",
	"hplip	HP Deskjet 2600 Series	2620 All-in-one|Ink Advantage 2635 All-in-one",
	"hplip	HP Deskjet 2640 Series	Ink Advantage 2645 All-in-one Printer",
	"hplip	HP Deskjet 2700 Series	All-in-one Printer Series|Ink Advantage 2700 All-in-one Printer Series",
	"hplip	HP Deskjet 2800 Series	All-in-one Printer Series|Ink Advantage 2800 All-in-one Printer Series",
	"hplip	HP Deskjet 3000 j310 Series",
	"hplip	HP Deskjet 3050a j611 Series	3051a E-all-in-one Printer j611h",
	"hplip	HP Deskjet 3050 j610 Series",
	"hplip	HP Deskjet 3070 b611 Series",
	"hplip	HP Deskjet 3320	Color Inkjet Printer",
	"hplip	HP Deskjet 3325	Printer/scanjet 3530c",
	"hplip	HP Deskjet 3420	Color Inkjet Printer",
	"hplip	HP Deskjet 3425",
	"hplip	HP Deskjet 3450	Color Inkjet Printer",
	"hplip	HP Deskjet 350	350c Printer",
	"hplip	HP Deskjet 3500	Color Inkjet Printer",
	"hplip	HP Deskjet 3510 Series	Ink Advantage 3515 E-all-in-one",
	"hplip	HP Deskjet 3520 Series	E-all-in-one Series|Ink Advantage 3525 E-all-in-one",
	"hplip	HP Deskjet 3540 Series	Ink Advantage 3540 E-all-in-one Printer Series",
	"hplip	HP Deskjet 3550	Color Inkjet Printer",
	"hplip	HP Deskjet 3600	Color Inkjet Printer",
	"hplip	HP Deskjet 3630 Series	All-in-one Printer|Ink Advantage 3630 All-in-one Printer",
	"hplip	HP Deskjet 3650	Color Inkjet Printer",
	"hplip	HP Deskjet 3700 Series	Ink Advantage 3775 All-in-one",
	"hplip	HP Deskjet 3740	Color Inkjet Printer",
	"hplip	HP Deskjet 3810	Color Inkjet Printer",
	"hplip	HP Deskjet 3816	Color Inkjet Printer",
	"hplip	HP Deskjet 3819	Color Inkjet Printer",
	"hplip	HP Deskjet 3820	Color Inkjet Printer",
	"hplip	HP Deskjet 3822	Color Inkjet Printer",
	"hplip	HP Deskjet 3830 Series	Ink Advantage 3830 All-in-one Printer",
	"hplip	HP Deskjet 3840	3843 Color Inkjet Printer",
	"hplip	HP Deskjet 3870	Color Inkjet Printer",
	"hplip	HP Deskjet 3900	Color Inkjet Printer",
	"hplip	HP Deskjet 3910	Color Inkjet Printer",
	"hplip	HP Deskjet 3920	Color Inkjet Printer",
	"hplip	HP Deskjet 3940	Color Inkjet Printer",
	"hplip	HP Deskjet 400	Color Capable Printer",
	"hplip	HP Deskjet 400l",
	"hplip	HP Deskjet 4100 Series	Ink Advantage 4100 All-in-one Printer Series",
	"hplip	HP Deskjet 4200 Series	All-in-one Printer Series|Ink Advantage 4200 All-in-one Printer Series",
	"hplip	HP Deskjet 450	450cbi Mobile Printer",
	"hplip	HP Deskjet 4510 Series	Ink Advantage 4515 E-all-in-one Printer",
	"hplip	HP Deskjet 4530 Series	Ink Advantage 4530 All-in-one",
	"hplip	HP Deskjet 460	460c Mobile Printer",
	"hplip	HP Deskjet 4610 Series	Ink Advantage 4610 All-in-one Printer Series",
	"hplip	HP Deskjet 4620 Series	Ink Advantage 4620 E-all-in-one Printer",
	"hplip	HP Deskjet 4640 Series	Ink Advantage 4640 E-all-in-one Printer Series",
	"hplip	HP Deskjet 4670 Series	Ink Advantage 4670 All-in-one",
	"hplip	HP Deskjet 4720 Series	Ink Advantage Ultra 4720 All-in-one Printer Series",
	"hplip	HP Deskjet 4800 Series	Ink Advantage Ultra 4800 All-in-one Printer Series",
	"hplip	HP Deskjet 4900 Series	Ink Advantage 4900 All-in-one Printer Series",
	"hplip	HP Deskjet 500",
	"hplip	HP Deskjet 5000 Series	Ink Advantage 5075 All-in-one",
	"hplip	HP Deskjet 500c",
	"hplip	HP Deskjet 505j",
	"hplip	HP Deskjet 510",
	"hplip	HP Deskjet 5100	Color Inkjet Printer",
	"hplip	HP Deskjet 520",
	"hplip	HP Deskjet 5200 Series	Ink Advantage 5275 All-in-one",
	"hplip	HP Deskjet 540",
	"hplip	HP Deskjet 5400 Series	5420v Photo Printer",
	"hplip	HP Deskjet 550c",
	"hplip	HP Deskjet 5520 Series	Ink Advantage 5525 E-all-in-one",
	"hplip	HP Deskjet 5550	Color Inkjet Printer",
	"hplip	HP Deskjet 5551	Color Inkjet Printer",
	"hplip	HP Deskjet 5552	Color Inkjet Printer",
	"hplip	HP Deskjet 5570 Series	Ink Advantage 5570 All-in-one",
	"hplip	HP Deskjet 5600	Color Inkjet Printer",
	"hplip	HP Deskjet 5640 Series	Ink Advantage 5640 All-in-one Printer Series",
	"hplip	HP Deskjet 5650	Color Inkjet Printer",
	"hplip	HP Deskjet 5652	Color Inkjet Printer",
	"hplip	HP Deskjet 5700	Color Inkjet Printer",
	"hplip	HP Deskjet 5730 Series	Ink Advantage Ultra 5738 All-in-one Printer",
	"hplip	HP Deskjet 5800	Color Inkjet Printer",
	"hplip	HP Deskjet 5810 Series	Gt 5810 All-in-one Printer",
	"hplip	HP Deskjet 5820 Series	Gt 5820 All-in-one Printer",
	"hplip	HP Deskjet 5850	Color Inkjet Printer",
	"hplip	HP Deskjet 5900 Series	5938 Photo Printer",
	"hplip	HP Deskjet 600",
	"hplip	HP Deskjet 610c",
	"hplip	HP Deskjet 610cl",
	"hplip	HP Deskjet 6120	Color Inkjet Printer",
	"hplip	HP Deskjet 6122	Color Inkjet Printer",
	"hplip	HP Deskjet 6127	Color Inkjet Printer",
	"hplip	HP Deskjet 612c",
	"hplip	HP Deskjet 630c",
	"hplip	HP Deskjet 632c",
	"hplip	HP Deskjet 640c	Lite Printer|Pavilion Turbo Printer",
	"hplip	HP Deskjet 648c",
	"hplip	HP Deskjet 6500	Color Inkjet Printer",
	"hplip	HP Deskjet 6520 Series	Ink Advantage 6525 E-all-in-one",
	"hplip	HP Deskjet 656c",
	"hplip	HP Deskjet 660	660c Printer",
	"hplip	HP Deskjet 6600	Series Color Inkjet Printer|6620 Color Inkjet Printer",
	"hplip	HP Deskjet 670	670k Printer",
	"hplip	HP Deskjet 670c",
	"hplip	HP Deskjet 670tv",
	"hplip	HP Deskjet 672c",
	"hplip	HP Deskjet 680	680c Printer",
	"hplip	HP Deskjet 6800	Color Inkjet Printer",
	"hplip	HP Deskjet 682	682c Printer",
	"hplip	HP Deskjet 690c	690 Printer|690c Plus Printer",
	"hplip	HP Deskjet 692	692c Printer",
	"hplip	HP Deskjet 693	693c Printer",
	"hplip	HP Deskjet 694	694c Printer",
	"hplip	HP Deskjet 6940 Series",
	"hplip	HP Deskjet 695	695c Printer",
	"hplip	HP Deskjet 697	697c Printer",
	"hplip	HP Deskjet 6980 Series",
	"hplip	HP Deskjet 810c",
	"hplip	HP Deskjet 812c",
	"hplip	HP Deskjet 815c",
	"hplip	HP Deskjet 816c	816 Printer",
	"hplip	HP Deskjet 825c",
	"hplip	HP Deskjet 830c",
	"hplip	HP Deskjet 832c",
	"hplip	HP Deskjet 840c",
	"hplip	HP Deskjet 841c",
	"hplip	HP Deskjet 842c",
	"hplip	HP Deskjet 843c",
	"hplip	HP Deskjet 845c",
	"hplip	HP Deskjet 850c",
	"hplip	HP Deskjet 855c",
	"hplip	HP Deskjet 870c",
	"hplip	HP Deskjet 880c",
	"hplip	HP Deskjet 882c",
	"hplip	HP Deskjet 890c",
	"hplip	HP Deskjet 895c",
	"hplip	HP Deskjet 916c",
	"hplip	HP Deskjet 920c",
	"hplip	HP Deskjet 9300",
	"hplip	HP Deskjet 930c",
	"hplip	HP Deskjet 932c",
	"hplip	HP Deskjet 933c",
	"hplip	HP Deskjet 934c",
	"hplip	HP Deskjet 935c",
	"hplip	HP Deskjet 940c",
	"hplip	HP Deskjet 948c",
	"hplip	HP Deskjet 950c",
	"hplip	HP Deskjet 952c",
	"hplip	HP Deskjet 955c	995ck Color Inkjet Printer",
	"hplip	HP Deskjet 957c",
	"hplip	HP Deskjet 959c",
	"hplip	HP Deskjet 9600	9650 Printer",
	"hplip	HP Deskjet 960c",
	"hplip	HP Deskjet 970c",
	"hplip	HP Deskjet 975c",
	"hplip	HP Deskjet 9800",
	"hplip	HP Deskjet 980c",
	"hplip	HP Deskjet 990c",
	"hplip	HP Deskjet 995c",
	"hplip	HP Deskjet d1300 Series	d1311 Printer",
	"hplip	HP Deskjet d1400 Series	d1415 Printer",
	"hplip	HP Deskjet d1500 Series	d1520 Printer",
	"hplip	HP Deskjet d1600 Series	d1620 Printer",
	"hplip	HP Deskjet d2300 Series	d2320 Printer",
	"hplip	HP Deskjet d2400 Series	d2430 Printer",
	"hplip	HP Deskjet d2500 Series	d2530 Printer",
	"hplip	HP Deskjet d2600 Series	d2645 Printer",
	"hplip	HP Deskjet d4100 Series	d4145 Printer",
	"hplip	HP Deskjet d4200 Series	d4245 Printer",
	"hplip	HP Deskjet d4300 Series	d4360 Printer",
	"hplip	HP Deskjet d5500 Series	d5545 Printer",
	"hplip	HP Deskjet d730",
	"hplip	HP Deskjet f2100 Series	f2110 All-in-one Printer",
	"hplip	HP Deskjet f2200 Series	f2210 All-in-one Printer",
	"hplip	HP Deskjet f2400 Series	f2410 All-in-one Printer",
	"hplip	HP Deskjet f300 Series	f310 All-in-one Printer",
	"hplip	HP Deskjet f4100 Series	f4135 All-in-one Printer",
	"hplip	HP Deskjet f4200 Series	f4210 All-in-one Printer",
	"hplip	HP Deskjet f4400 Series	f4435 All-in-one Printer",
	"hplip	HP Deskjet f4500 Series	All-in-one Printer Series",
	"hplip	HP Deskjet f735	All-in-one Printer",
	"hplip	HP Deskjet Ink Advant k109a-z	Advantage k109a Printer",
	"hplip	HP Deskjet Ink Advant k209a-z	Advantage k209a All-in-one Printer",
	"hplip	HP Deskjet Ink Adv 2010 k010",
	"hplip	HP Deskjet Ink Adv 2060 k110",
	"hplip	HP Deskjet Plus 4100 Series	All-in-one Printer Series",
	"hplip	HP Deskjet Plus 6000 Series",
	"hplip	HP Deskjet Plus 6400 Series",
	"hplip	HP Envy 100 d410 Series",
	"hplip	HP Envy 110 Series",
	"hplip	HP Envy 120 Series",
	"hplip	HP Envy 4500 Series",
	"hplip	HP Envy 4510 Series",
	"hplip	HP Envy 4520 Series	All-in-one Printer",
	"hplip	HP Envy 5000 Series",
	"hplip	HP Envy 5530 Series	E-all-in-one Printer",
	"hplip	HP Envy 5540 Series	All-in-one Printer|5542 E-all-in-one*|5543 All-in-one*|5545 E-all-in-one*|5546 All-in-one*",
	"hplip	HP Envy 5640 Series",
	"hplip	HP Envy 5660 Series",
	"hplip	HP Envy 6000 Series",
	"hplip	HP Envy 6400 Series",
	"hplip	HP Envy 7640 Series",
	"hplip	HP Envy 8000 Series",
	"hplip	HP Envy Inspire 7200 Series",
	"hplip	HP Envy Inspire 7900 Series",
	"hplip	HP Envy Photo 6200 Series",
	"hplip	HP Envy Photo 7100 Series",
	"hplip	HP Envy Photo 7200 Series",
	"hplip	HP Envy Photo 7800 Series",
	"hplip	HP Envy Photo 7900 Series",
	"hplip	HP Envy Pro 6400 Series",
	"hplip	HP Ink Tank 110 Series",
	"hplip	HP Ink Tank 310 Series",
	"hplip	HP Ink Tank Wireless 410 Series",
	"hplip	HP LaserJet 1000",
	"hplip	HP LaserJet 1005 Series",
	"hplip	HP LaserJet 1010",
	"hplip	HP LaserJet 1012",
	"hplip	HP LaserJet 1015",
	"hplip	HP LaserJet 1018",
	"hplip	HP LaserJet 1020	Plus Printer",
	"hplip	HP LaserJet 1022",
	"hplip	HP LaserJet 1022n",
	"hplip	HP LaserJet 1022nw",
	"hplip	HP LaserJet 1100",
	"hplip	HP LaserJet 1100a	All-in-one Printer|Se All-in-one Printer",
	"hplip	HP LaserJet 1100xi	1100a Xi All-in-one Printer",
	"hplip	HP LaserJet 1150",
	"hplip	HP LaserJet 1160 Series	Series Printer|1160le Printer",
	"hplip	HP LaserJet 1200",
	"hplip	HP LaserJet 1200n",
	"hplip	HP LaserJet 1220	All-in-one Printer",
	"hplip	HP LaserJet 1220se	All-in-one Printer",
	"hplip	HP LaserJet 1300",
	"hplip	HP LaserJet 1300n",
	"hplip	HP LaserJet 1300xi",
	"hplip	HP LaserJet 1320",
	"hplip	HP LaserJet 1320n",
	"hplip	HP LaserJet 1320nw",
	"hplip	HP LaserJet 1320tn",
	"hplip	HP LaserJet 1320 Series",
	"hplip	HP LaserJet 2100 Series",
	"hplip	HP LaserJet 2200 Series	Series Printer|2200d Printer|2200tn  Printer",
	"hplip	HP LaserJet 2300 Series	Series Printer|2300d Printer",
	"hplip	HP LaserJet 2410",
	"hplip	HP LaserJet 2420",
	"hplip	HP LaserJet 2430",
	"hplip	HP LaserJet 3015	All-in-one Printer",
	"hplip	HP LaserJet 3020	All-in-one Printer",
	"hplip	HP LaserJet 3030	All-in-one Printer",
	"hplip	HP LaserJet 3050	All-in-one Printer",
	"hplip	HP LaserJet 3052	All-in-one Printer",
	"hplip	HP LaserJet 3055	All-in-one Printer",
	"hplip	HP LaserJet 3100	All-in-one Printer",
	"hplip	HP LaserJet 3150	All-in-one Printer",
	"hplip	HP LaserJet 3200	All-in-one Printer",
	"hplip	HP LaserJet 3300 3310 3320	Multifunction Printer|3310 Digital*Copier|3320 Multifunction*",
	"hplip	HP LaserJet 3330	Multifunction Printer",
	"hplip	HP LaserJet 3380	All-in-one Printer",
	"hplip	HP LaserJet 3390	All-in-one Printer",
	"hplip	HP LaserJet 3392	All-in-one Printer",
	"hplip	HP LaserJet 4000 Series",
	"hplip	HP LaserJet 4050 Series",
	"hplip	HP LaserJet 4100 MFP	Multifunction Printer",
	"hplip	HP LaserJet 4100 Series",
	"hplip	HP LaserJet 4150 Series",
	"hplip	HP LaserJet 4200",
	"hplip	HP LaserJet 4240",
	"hplip	HP LaserJet 4250",
	"hplip	HP LaserJet 4300",
	"hplip	HP LaserJet 4345 MFP	Multifunction Printer",
	"hplip	HP LaserJet 4350",
	"hplip	HP LaserJet 4l	Pro Printer|4lc Printer",
	"hplip	HP LaserJet 4ml",
	"hplip	HP LaserJet 4mp",
	"hplip	HP LaserJet 4si	Mx Printer",
	"hplip	HP LaserJet 4v",
	"hplip	HP LaserJet 4 Plus",
	"hplip	HP LaserJet 5000 Series	Series Printer|5000dn Printer",
	"hplip	HP LaserJet 5100 Series",
	"hplip	HP LaserJet 5200",
	"hplip	HP LaserJet 5200l",
	"hplip	HP LaserJet 5200lx",
	"hplip	HP LaserJet 5l	Xtra Printer|5l-fs Printer",
	"hplip	HP LaserJet 5mp",
	"hplip	HP LaserJet 5p",
	"hplip	HP LaserJet 5si	Hm Printer",
	"hplip	HP LaserJet 5si Mopier",
	"hplip	HP LaserJet 6l	Gold Printer|Pro Printer|6lse Printer",
	"hplip	HP LaserJet 6mp	Se Printer",
	"hplip	HP LaserJet 6p",
	"hplip	HP LaserJet 8000 Series	Series Printer|8000dn Printer",
	"hplip	HP LaserJet 8100 MFP	Multifunction Printer",
	"hplip	HP LaserJet 8100 Series",
	"hplip	HP LaserJet 8150 MFP	Multifunction Printer",
	"hplip	HP LaserJet 8150 Series",
	"hplip	HP LaserJet 9000 MFP	Multifunction Printer",
	"hplip	HP LaserJet 9000 Series",
	"hplip	HP LaserJet 9040",
	"hplip	HP LaserJet 9040 MFP	Multifunction Printer",
	"hplip	HP LaserJet 9050",
	"hplip	HP LaserJet 9050 MFP	Multifunction Printer",
	"hplip	HP LaserJet 9055mfp	9055 Multifunction Printer",
	"hplip	HP LaserJet 9065mfp	9065 Multifunction Printer",
	"hplip	HP LaserJet cm1411fn	Professional cm1411fn",
	"hplip	HP LaserJet cm1412fn	Professional cm1412fn",
	"hplip	HP LaserJet cm1413fn	Professional cm1413fn",
	"hplip	HP LaserJet cm1415fn	Professional cm1415fn",
	"hplip	HP LaserJet cm1415fnw	Professional cm1415fnw",
	"hplip	HP LaserJet cm1416fnw	Professional cm1416fnw",
	"hplip	HP LaserJet cm1417fnw	Professional cm1417fnw",
	"hplip	HP LaserJet cm1418fnw	Professional cm1418fnw",
	"hplip	HP LaserJet cp1025	Pro cp1025 Color Printer Series",
	"hplip	HP LaserJet cp1025nw	Pro cp1025nw Color Printer Series",
	"hplip	HP LaserJet m1005	Multifunction Printer",
	"hplip	HP LaserJet m101-m106",
	"hplip	HP LaserJet m109-m112",
	"hplip	HP LaserJet m1120n MFP	Multifunction Printer",
	"hplip	HP LaserJet m1120 MFP	Multifunction Printer",
	"hplip	HP LaserJet m1319f MFP	Multifunction Printer",
	"hplip	HP LaserJet m14-m17	Pro m14cw",
	"hplip	HP LaserJet m1522nf MFP	Multifunction Printer",
	"hplip	HP LaserJet m1537dnf MFP",
	"hplip	HP LaserJet m1538dnf MFP",
	"hplip	HP LaserJet m1539dnf MFP",
	"hplip	HP LaserJet m207-m212	Lasejet  m211d|LaserJet m207d",
	"hplip	HP LaserJet m2727 MFP	Multifunction Printer",
	"hplip	HP LaserJet m3027 MFP	Multifunction Printer",
	"hplip	HP LaserJet m3035 MFP	Multifunction Printer",
	"hplip	HP LaserJet m4345 MFP	Multifunction Printer",
	"hplip	HP LaserJet m4349 MFP",
	"hplip	HP LaserJet m5025 MFP	Multifunction Printer",
	"hplip	HP LaserJet m5035 MFP	Multifunction Printer",
	"hplip	HP LaserJet m5039 MFP	Multifunction Printer",
	"hplip	HP LaserJet m9040 MFP	Multifunction Printer",
	"hplip	HP LaserJet m9050 MFP	Multifunction Printer",
	"hplip	HP LaserJet m9059 MFP",
	"hplip	HP LaserJet MFP m129-m134	Pro MFP m130a",
	"hplip	HP LaserJet MFP m139-m142",
	"hplip	HP LaserJet MFP m232-m237",
	"hplip	HP LaserJet MFP m28-m31	Pro MFP m28w",
	"hplip	HP LaserJet p1005",
	"hplip	HP LaserJet p1006",
	"hplip	HP LaserJet p1007",
	"hplip	HP LaserJet p1008",
	"hplip	HP LaserJet p1009",
	"hplip	HP LaserJet p1505",
	"hplip	HP LaserJet p1505n",
	"hplip	HP LaserJet p2014",
	"hplip	HP LaserJet p2014n",
	"hplip	HP LaserJet p2015dn Series",
	"hplip	HP LaserJet p2015d Series",
	"hplip	HP LaserJet p2015n Series",
	"hplip	HP LaserJet p2015x Series",
	"hplip	HP LaserJet p2015 Series",
	"hplip	HP LaserJet p2035",
	"hplip	HP LaserJet p2035n",
	"hplip	HP LaserJet p2055",
	"hplip	HP LaserJet p2055d",
	"hplip	HP LaserJet p2055dn",
	"hplip	HP LaserJet p2055x",
	"hplip	HP LaserJet p3004",
	"hplip	HP LaserJet p3005",
	"hplip	HP LaserJet p3010 Series	p3011 Printer",
	"hplip	HP LaserJet p4014",
	"hplip	HP LaserJet p4014dn",
	"hplip	HP LaserJet p4014n",
	"hplip	HP LaserJet p4015",
	"hplip	HP LaserJet p4015dn",
	"hplip	HP LaserJet p4015n",
	"hplip	HP LaserJet p4015tn",
	"hplip	HP LaserJet p4015x",
	"hplip	HP LaserJet p4515",
	"hplip	HP LaserJet p4515n",
	"hplip	HP LaserJet p4515tn",
	"hplip	HP LaserJet p4515x",
	"hplip	HP LaserJet p4515xm",
	"hplip	HP LaserJet Professional m1132 MFP	Multifunction Printer",
	"hplip	HP LaserJet Professional m1136 MFP	Multifunction Printer",
	"hplip	HP LaserJet Professional m1137 MFP	Multifunction Printer",
	"hplip	HP LaserJet Professional m1138 MFP	Multifunction Printer",
	"hplip	HP LaserJet Professional m1139 MFP	Multifunction Printer",
	"hplip	HP LaserJet Professional m1212nf MFP	Multifunction Printer",
	"hplip	HP LaserJet Professional m1213nf MFP	Multifunction Printer",
	"hplip	HP LaserJet Professional m1214nfh MFP	Multifunction Printer",
	"hplip	HP LaserJet Professional m1216nfh MFP",
	"hplip	HP LaserJet Professional m1217nfw MFP	Multifunction Printer",
	"hplip	HP LaserJet Professional m1218nfg MFP	m1210 MFP Series",
	"hplip	HP LaserJet Professional m1218nfs MFP	Hotspot LaserJet Pro m1218nfs MFP",
	"hplip	HP LaserJet Professional m1219nfg MFP",
	"hplip	HP LaserJet Professional m1219nfs MFP",
	"hplip	HP LaserJet Professional m1219nf MFP",
	"hplip	HP LaserJet Professional p1102",
	"hplip	HP LaserJet Professional p1106",
	"hplip	HP LaserJet Professional p1106w",
	"hplip	HP LaserJet Professional p1107",
	"hplip	HP LaserJet Professional p1107w",
	"hplip	HP LaserJet Professional p1108",
	"hplip	HP LaserJet Professional p1108w",
	"hplip	HP LaserJet Professional p1109",
	"hplip	HP LaserJet Professional p1109w",
	"hplip	HP LaserJet Professional p1566",
	"hplip	HP LaserJet Professional p1567",
	"hplip	HP LaserJet Professional p1568",
	"hplip	HP LaserJet Professional p1569",
	"hplip	HP LaserJet Professional p1606dn",
	"hplip	HP LaserJet Professional p1607dn",
	"hplip	HP LaserJet Professional p1608dn",
	"hplip	HP LaserJet Professional p1609dn",
	"hplip	HP LaserJet Professional p 1102w",
	"hplip	HP LaserJet Pro MFP m125a",
	"hplip	HP LaserJet Pro MFP m125nr",
	"hplip	HP LaserJet Pro MFP m125nw",
	"hplip	HP LaserJet Pro MFP m125r",
	"hplip	HP LaserJet Pro MFP m125rnw",
	"hplip	HP LaserJet Pro MFP m125s",
	"hplip	HP LaserJet Pro MFP m126a",
	"hplip	HP LaserJet Pro MFP m126nw",
	"hplip	HP LaserJet Pro MFP m126 Plus Series",
	"hplip	HP LaserJet Pro MFP m127fn",
	"hplip	HP LaserJet Pro MFP m127fp",
	"hplip	HP LaserJet Pro MFP m127fs",
	"hplip	HP LaserJet Pro MFP m127fw",
	"hplip	HP LaserJet Pro MFP m128fn",
	"hplip	HP LaserJet Pro MFP m128fp",
	"hplip	HP LaserJet Pro MFP m128fw",
	"hplip	HP LaserJet Pro MFP m25a",
	"hplip	HP LaserJet Pro MFP m25nw",
	"hplip	HP LaserJet Pro MFP m26a",
	"hplip	HP LaserJet Pro MFP m26nw",
	"hplip	HP LaserJet Pro MFP m27c",
	"hplip	HP LaserJet Pro MFP m27cnw",
	"hplip	HP LaserJet Pro p1100 Plus Series",
	"hplip	HP LaserJet Tank 1020",
	"hplip	HP LaserJet Tank 150x",
	"hplip	HP LaserJet Tank 250x",
	"hplip	HP LaserJet Tank MFP 1005",
	"hplip	HP LaserJet Tank MFP 160x",
	"hplip	HP LaserJet Tank MFP 260x",
	"hplip	HP Laser Ns 1020",
	"hplip	HP Laser Ns MFP 1005",
	"hplip	HP Mopier 240",
	"hplip	HP Mopier 320",
	"hplip	HP Neverstop Laser 100x",
	"hplip	HP Neverstop Laser MFP 120x",
	"hplip	HP Officejet	All-in-one Printer",
	"hplip	HP Officejet 100 Mobile l411",
	"hplip	HP Officejet 150 Mobile l511",
	"hplip	HP Officejet 200 Mobile Series",
	"hplip	HP Officejet 250 Mobile Series",
	"hplip	HP Officejet 2620 Series",
	"hplip	HP Officejet 3830 Series	All-in-one Printer",
	"hplip	HP Officejet 4000 k210",
	"hplip	HP Officejet 4100 Series	All-in-one Printer|4110 All-in-one Printer",
	"hplip	HP Officejet 4105	All-in-one Printer",
	"hplip	HP Officejet 4115 Series	All-in-one Printer",
	"hplip	HP Officejet 4200 Series	All-in-one Printer",
	"hplip	HP Officejet 4255	4251 All-in-one Printer",
	"hplip	HP Officejet 4300 Series	4308 All-in-one Printer",
	"hplip	HP Officejet 4400 k410	All-in-one Printer",
	"hplip	HP Officejet 4500 g510a-f	All-in-one Desktop Printer - g510b|Desktop All-in-one**g510a",
	"hplip	HP Officejet 4500 g510g-m	All-in-one Printer - g510g",
	"hplip	HP Officejet 4500 g510n-z	All-in-one Printer",
	"hplip	HP Officejet 4500 k710	All-in-one Printer - k710",
	"hplip	HP Officejet 4610 Series	All-in-one Printer Series",
	"hplip	HP Officejet 4620 Series	E-all-in-one Printer",
	"hplip	HP Officejet 4630 Series	E-all-in-one Printer",
	"hplip	HP Officejet 4650 Series	All-in-one Printer",
	"hplip	HP Officejet 5100 Series	All-in-one Printer",
	"hplip	HP Officejet 5200 Series",
	"hplip	HP Officejet 5500 Series	5505 All-in-one Printer",
	"hplip	HP Officejet 5600 Series	All-in-one Printer|5605 All-in-one Printer",
	"hplip	HP Officejet 5740 Series",
	"hplip	HP Officejet 6000 e609a	Printer - e609a",
	"hplip	HP Officejet 6000 e609n	Wireless Printer - e609n",
	"hplip	HP Officejet 6100	Eprinter h611a",
	"hplip	HP Officejet 6100 Series	6105 All-in-one Printer",
	"hplip	HP Officejet 6150 Series	All-in-one Printer",
	"hplip	HP Officejet 6200 Series	All-in-one Printer",
	"hplip	HP Officejet 6300 Series	6301 All-in-one Printer",
	"hplip	HP Officejet 6500 e709a	All-in-one Printer - e709a",
	"hplip	HP Officejet 6500 e709n	Wireless All-in-one Printer - e709n",
	"hplip	HP Officejet 6500 e710a-f",
	"hplip	HP Officejet 6500 e710n-z",
	"hplip	HP Officejet 6600	E-all-in-one Printer - h711a",
	"hplip	HP Officejet 6700	Premium E-all-in-one Printer-h711n",
	"hplip	HP Officejet 6800	6810*Printer Series",
	"hplip	HP Officejet 6950",
	"hplip	HP Officejet 6960",
	"hplip	HP Officejet 7000 e809a Series	Wide Format Printer -e809a|e809 Printer",
	"hplip	HP Officejet 7100 Series	All-in-one Printer",
	"hplip	HP Officejet 7110 Series	Wide Format Eprinter",
	"hplip	HP Officejet 7200 Series	7205 All-in-one Printer",
	"hplip	HP Officejet 7300 Series	7310 All-in-one Printer",
	"hplip	HP Officejet 7400 Series	7408 All-in-one Printer",
	"hplip	HP Officejet 7500 e910",
	"hplip	HP Officejet 7510 Series	Wide Format E-all-in-one Printer",
	"hplip	HP Officejet 7610 Series	Wide Format E-all-in-one Printer",
	"hplip	HP Officejet 8010 Series	All-in-one Printer Series",
	"hplip	HP Officejet 8020 Series	All-in-one Printer Series",
	"hplip	HP Officejet 8040 Series",
	"hplip	HP Officejet 8120e Series	8120 All-in-one Series",
	"hplip	HP Officejet 8120 Series	All-in-one Series",
	"hplip	HP Officejet 8130e Series	8130 All-in-one Series",
	"hplip	HP Officejet 8130 Series	All-in-one Series",
	"hplip	HP Officejet 8700	8702 All-in-one",
	"hplip	HP Officejet 9010 Series	All-in-one 9010",
	"hplip	HP Officejet 9100 Series	9110 All-in-one Printer",
	"hplip	HP Officejet 9120e Series",
	"hplip	HP Officejet 9120 Series",
	"hplip	HP Officejet D Series	d125xi All-in-one Printer",
	"hplip	HP Officejet g55	All-in-one Printer",
	"hplip	HP Officejet g55xi	All-in-one Printer",
	"hplip	HP Officejet g85	All-in-one Printer",
	"hplip	HP Officejet g85xi	All-in-one Printer",
	"hplip	HP Officejet g95	All-in-one Printer",
	"hplip	HP Officejet h470	Mobile Printer",
	"hplip	HP Officejet j3500 Series	j3508 All-in-one Printer",
	"hplip	HP Officejet j3600 Series	j3608 All-in-one Printer",
	"hplip	HP Officejet j4500 Series	j4524 All-in-one Printer",
	"hplip	HP Officejet j4660 Series	All-in-one Printer",
	"hplip	HP Officejet j4680 Series	All-in-one Printer",
	"hplip	HP Officejet j5500 Series	j5505 All-in-one Printer",
	"hplip	HP Officejet j5700 Series	j5725 All-in-one Printer",
	"hplip	HP Officejet j6400 Series	j6405 All-in-one Printer",
	"hplip	HP Officejet k60	All-in-one Printer",
	"hplip	HP Officejet k60xi	All-in-one Printer",
	"hplip	HP Officejet k7100",
	"hplip	HP Officejet k80	All-in-one Printer",
	"hplip	HP Officejet k80xi	All-in-one Printer",
	"hplip	HP Officejet Lx	All-in-one Printer",
	"hplip	HP Officejet Pro 1150c	All-in-one Printer",
	"hplip	HP Officejet Pro 1170c Series	All-in-one Printer",
	"hplip	HP Officejet Pro 3610	Black And White E-all-in-one",
	"hplip	HP Officejet Pro 3620	Black And White E-all-in-one",
	"hplip	HP Officejet Pro 6230",
	"hplip	HP Officejet Pro 6830",
	"hplip	HP Officejet Pro 6960",
	"hplip	HP Officejet Pro 6970",
	"hplip	HP Officejet Pro 7720 Series	Wide Format All-in-one",
	"hplip	HP Officejet Pro 7730 Series	Wide Format All-in-one",
	"hplip	HP Officejet Pro 7740 Series	Wide Format All-in-one",
	"hplip	HP Officejet Pro 8000 a809	Printer - a809a|Wireless Printer - a809n",
	"hplip	HP Officejet Pro 8020 Series	All-in-one Printer Series",
	"hplip	HP Officejet Pro 8030 Series	All-in-one Printer Series",
	"hplip	HP Officejet Pro 8100",
	"hplip	HP Officejet Pro 8120e Series	8120 All-in-one Series",
	"hplip	HP Officejet Pro 8120 Series	All-in-one Series",
	"hplip	HP Officejet Pro 8130e Series	8130 All-in-one Series",
	"hplip	HP Officejet Pro 8130 Series	All-in-one Series",
	"hplip	HP Officejet Pro 8500 a909a	All-in-one Printer - a909a",
	"hplip	HP Officejet Pro 8500 a909g	Wireless All-in-one Printer - a909g",
	"hplip	HP Officejet Pro 8500 a909n	Premier All-in-one Printer - a909n",
	"hplip	HP Officejet Pro 8500 a910	8500a E-aio Printer - a910a|Plus E-aio Printer - a910g",
	"hplip	HP Officejet Pro 8600	E-aio n911a|Plus E-aio n911g",
	"hplip	HP Officejet Pro 8610	E-all-in-one Printer",
	"hplip	HP Officejet Pro 8620	E-all-in-one Printer",
	"hplip	HP Officejet Pro 8630	E-all-in-one Printer",
	"hplip	HP Officejet Pro 8640	E-all-in-one Printer",
	"hplip	HP Officejet Pro 8660	E-all-in-one Printer",
	"hplip	HP Officejet Pro 8710	All-in-one Printer",
	"hplip	HP Officejet Pro 8720	All-in-one Printer",
	"hplip	HP Officejet Pro 9010 Series	All-in-one 9010",
	"hplip	HP Officejet Pro 9020 Series	All-in-one 9020",
	"hplip	HP Officejet Pro 9110b Series",
	"hplip	HP Officejet Pro 9110e Series",
	"hplip	HP Officejet Pro 9110 Series",
	"hplip	HP Officejet Pro 9120b Series",
	"hplip	HP Officejet Pro 9120e Series",
	"hplip	HP Officejet Pro 9120 Series	9120 Series",
	"hplip	HP Officejet Pro 9130b Series",
	"hplip	HP Officejet Pro 9130e Series",
	"hplip	HP Officejet Pro 9130 Series",
	"hplip	HP Officejet Pro 9720e Series",
	"hplip	HP Officejet Pro 9720 Series",
	"hplip	HP Officejet Pro 9730e Series",
	"hplip	HP Officejet Pro 9730 Series",
	"hplip	HP Officejet Pro k5300",
	"hplip	HP Officejet Pro k5400",
	"hplip	HP Officejet Pro k550",
	"hplip	HP Officejet Pro k850",
	"hplip	HP Officejet Pro k8600	Color Printer",
	"hplip	HP Officejet Pro l7300	Series All-in-one Printer|l7380 All-in-one Printer",
	"hplip	HP Officejet Pro l7400	l7480 All-in-one Printer",
	"hplip	HP Officejet Pro l7500	Series All-in-one Printer|l7550 All-in-one Printer",
	"hplip	HP Officejet Pro l7600	Series All-in-one Printer|l7650 All-in-one Printer",
	"hplip	HP Officejet Pro l7700	Series All-in-one Printer|l7710 All-in-one Printer",
	"hplip	HP Officejet r40	All-in-one Printer",
	"hplip	HP Officejet r40xi	All-in-one Printer",
	"hplip	HP Officejet r45	All-in-one Printer",
	"hplip	HP Officejet r60	All-in-one Printer",
	"hplip	HP Officejet r65	All-in-one Printer",
	"hplip	HP Officejet r80	All-in-one Printer",
	"hplip	HP Officejet r80xi	All-in-one Printer",
	"hplip	HP Officejet Series 300	300 All-in-one Printer",
	"hplip	HP Officejet Series 310	310 All-in-one Series Printer",
	"hplip	HP Officejet Series 320	320 All-in-one Series Printer",
	"hplip	HP Officejet Series 330	330 All-in-one Printer",
	"hplip	HP Officejet Series 350	350 All-in-one Printer",
	"hplip	HP Officejet Series 520	520 All-in-one Printer",
	"hplip	HP Officejet Series 570	570 All-in-one Printer",
	"hplip	HP Officejet Series 580	580 All-in-one Printer",
	"hplip	HP Officejet Series 590	590 All-in-one Printer",
	"hplip	HP Officejet Series 600	600 All-in-one Printer",
	"hplip	HP Officejet Series 610	610 All-in-one Printer",
	"hplip	HP Officejet Series 630	630 All-in-one Printer",
	"hplip	HP Officejet Series 700	700 All-in-one Printer",
	"hplip	HP Officejet Series 710	710 All-in-one Printer",
	"hplip	HP Officejet Series 720	720 All-in-one Printer",
	"hplip	HP Officejet Series 725	725 All-in-one Printer",
	"hplip	HP Officejet T Series	t45 All-in-one Printer",
	"hplip	HP Officejet v30	All-in-one Printer",
	"hplip	HP Officejet v40	All-in-one Printer",
	"hplip	HP Officejet v40xi	All-in-one Printer",
	"hplip	HP Officejet v45	All-in-one Printer",
	"hplip	HP Photosmart 100",
	"hplip	HP Photosmart 1115",
	"hplip	HP Photosmart 1215",
	"hplip	HP Photosmart 1218",
	"hplip	HP Photosmart 130",
	"hplip	HP Photosmart 1315",
	"hplip	HP Photosmart 140 Series	Compact Photo Printer",
	"hplip	HP Photosmart 230",
	"hplip	HP Photosmart 240 Series	Compact Photo Printer",
	"hplip	HP Photosmart 2570 Series	All-in-one Printer",
	"hplip	HP Photosmart 2600 Series	2605 All-in-one Printer",
	"hplip	HP Photosmart 2700 Series	2710 All-in-one Printer",
	"hplip	HP Photosmart 3100 Series	3108 All-in-one Printer",
	"hplip	HP Photosmart 3200 Series	3207 All-in-one Printer",
	"hplip	HP Photosmart 320 Series	Compact Photo Printer",
	"hplip	HP Photosmart 3300 Series	3308 All-in-one Printer",
	"hplip	HP Photosmart 330 Series	Compact Photo Printer|335 Compact Photo Printer",
	"hplip	HP Photosmart 370 Series	Compact Photo Printer|375b***With Battery",
	"hplip	HP Photosmart 380 Series	385 Compact Photo Printer",
	"hplip	HP Photosmart 420 Series	Compact Photo Printer",
	"hplip	HP Photosmart 470 Series	Compact Photo Printer|475 Compact Photo Printer",
	"hplip	HP Photosmart 5510d Series",
	"hplip	HP Photosmart 5510 Series",
	"hplip	HP Photosmart 5520 Series",
	"hplip	HP Photosmart 6510 Series",
	"hplip	HP Photosmart 6520 Series	6525 E All-in-one|Photsmart 6520**",
	"hplip	HP Photosmart 7200 Series	7260 Photo Printer",
	"hplip	HP Photosmart 7345",
	"hplip	HP Photosmart 7400 Series	7450 Photo Printer",
	"hplip	HP Photosmart 7510 Series",
	"hplip	HP Photosmart 7520 Series",
	"hplip	HP Photosmart 7550",
	"hplip	HP Photosmart 7600 Series	7655 Photo Printer",
	"hplip	HP Photosmart 7700 Series	7755 Photo Printer",
	"hplip	HP Photosmart 7800 Series	7830 Printer",
	"hplip	HP Photosmart 7900 Series	7960 Photo Printer",
	"hplip	HP Photosmart 8000 Series	8030 Printer",
	"hplip	HP Photosmart 8100 Series	8150 Photo Printer",
	"hplip	HP Photosmart 8200 Series	8230 Printer",
	"hplip	HP Photosmart 8400 Series	8450 Photo Printer",
	"hplip	HP Photosmart 8700 Series	8750 Professional Photo Printer",
	"hplip	HP Photosmart a310 Series	Compact Photo Printer",
	"hplip	HP Photosmart a320 Series	Compact Photo Printer",
	"hplip	HP Photosmart a430 Series	Compact Photo Printer",
	"hplip	HP Photosmart a440 Series	Compact Photo Printer",
	"hplip	HP Photosmart a510 Series	Compact Photo Printer",
	"hplip	HP Photosmart a520 Series",
	"hplip	HP Photosmart a530 Series",
	"hplip	HP Photosmart a610 Series	Compact Photo Printer",
	"hplip	HP Photosmart a620 Series	Compact Photo Printer",
	"hplip	HP Photosmart a630 Series",
	"hplip	HP Photosmart a640 Series	Printer Series",
	"hplip	HP Photosmart a710 Series",
	"hplip	HP Photosmart a820 Series",
	"hplip	HP Photosmart b010 Series	All-in-one Printer - b010",
	"hplip	HP Photosmart b109a Series",
	"hplip	HP Photosmart b110 Series	Wireless All-in-one Printer - b110",
	"hplip	HP Photosmart b8500 Series",
	"hplip	HP Photosmart c309a Series	Premium Fax All-in-one Printer - c309a",
	"hplip	HP Photosmart c3100 Series",
	"hplip	HP Photosmart c4100 Series",
	"hplip	HP Photosmart c4200 Series",
	"hplip	HP Photosmart c4340 Series	All-in-one Printer",
	"hplip	HP Photosmart c4380 Series	All-in-one Printer",
	"hplip	HP Photosmart c4400 Series",
	"hplip	HP Photosmart c4500 Series",
	"hplip	HP Photosmart c4600 Series",
	"hplip	HP Photosmart c4700 Series",
	"hplip	HP Photosmart c5100 Series",
	"hplip	HP Photosmart c5200 Series",
	"hplip	HP Photosmart c5300 Series",
	"hplip	HP Photosmart c5500 Series",
	"hplip	HP Photosmart c6100 Series",
	"hplip	HP Photosmart c6200 Series",
	"hplip	HP Photosmart c6300 Series",
	"hplip	HP Photosmart c7100 Series",
	"hplip	HP Photosmart c7200 Series",
	"hplip	HP Photosmart c8100 Series",
	"hplip	HP Photosmart d110 Series",
	"hplip	HP Photosmart d5060 Series",
	"hplip	HP Photosmart d5100 Series	d5145 Printer",
	"hplip	HP Photosmart d5300 Series	d5345 Printer",
	"hplip	HP Photosmart d5400 Series	d5460 Printer",
	"hplip	HP Photosmart d6100 Series	d6160 Printer",
	"hplip	HP Photosmart d7100 Series	d7145 Printer",
	"hplip	HP Photosmart d7200 Series	d7245 Printer",
	"hplip	HP Photosmart d7300 Series	d7345 Printer",
	"hplip	HP Photosmart d7400 Series	d7460 Printer",
	"hplip	HP Photosmart d7500 Series	d7560 Printer",
	"hplip	HP Photosmart Estn c510 Series",
	"hplip	HP Photosmart Ink Adv k510",
	"hplip	HP Photosmart p1000	p1000/1000 Printer",
	"hplip	HP Photosmart p1100",
	"hplip	HP Photosmart Plus b209a-m	All-in-one Printer - b209a",
	"hplip	HP Photosmart Plus b210 Series",
	"hplip	HP Photosmart Prem-web c309n-s	Premium Fax All-in-one Printer Series -c309a",
	"hplip	HP Photosmart Premium c309g-m	All-in-one Printer Series - c309g",
	"hplip	HP Photosmart Prem c310 Series",
	"hplip	HP Photosmart Prem c410 Series",
	"hplip	HP Photosmart Pro b8300 Series",
	"hplip	HP Photosmart Pro b8800 Series",
	"hplip	HP Photosmart Wireless b109n-z	All-in-one Printer - b109n",
	"hplip	HP Printer Scanner Copier 300",
	"hplip	HP PSC 1000 Series",
	"hplip	HP PSC 1100 Series	1110 All-in-one Printer",
	"hplip	HP PSC 1200 Series	All-in-one Printer",
	"hplip	HP PSC 1300 Series	All-in-one Printer",
	"hplip	HP PSC 1310 Series	All-in-one Printer",
	"hplip	HP PSC 1358 Series",
	"hplip	HP PSC 1400 Series	1401 All-in-one Printer",
	"hplip	HP PSC 1500 Series	1508 All-in-one Printer|1510s All-in-one Printer",
	"hplip	HP PSC 1600 Series	All-in-one Printer",
	"hplip	HP PSC 2100 Series	2105 All-in-one Printer",
	"hplip	HP PSC 2150 Series	All-in-one Printer",
	"hplip	HP PSC 2170 Series	All-in-one Printer",
	"hplip	HP PSC 2200 Series	All-in-one Printer",
	"hplip	HP PSC 2210 Series	All-in-one Printer",
	"hplip	HP PSC 2300 Series	All-in-one Printer|2310 All-in-one Printer",
	"hplip	HP PSC 2350 Series	All-in-one Printer",
	"hplip	HP PSC 2400 Series	2405 Photosmart All-in-one Printer",
	"hplip	HP PSC 2500 Series",
	"hplip	HP PSC 500	All-in-one Printer",
	"hplip	HP PSC 720	All-in-one Printer",
	"hplip	HP PSC 750	All-in-one Printer",
	"hplip	HP PSC 750xi	All-in-one Printer",
	"hplip	HP PSC 760	All-in-one Printer",
	"hplip	HP PSC 780	All-in-one Printer",
	"hplip	HP PSC 780xi	All-in-one Printer",
	"hplip	HP PSC 900 Series	All-in-one Printer",
	"hplip	HP PSC 920	All-in-one Printer",
	"hplip	HP PSC 950	All-in-one Printer",
	"hplip	HP PSC 950vr	All-in-one Printer",
	"hplip	HP PSC 950xi	All-in-one Printer",
	"hplip	HP Smart Tank 210-220 Series",
	"hplip	HP Smart Tank 350 Series",
	"hplip	HP Smart Tank 500 Series",
	"hplip	HP Smart Tank 5100 Series",
	"hplip	HP Smart Tank 510 Series",
	"hplip	HP Smart Tank 520 540 Series	520_540 Series",
	"hplip	HP Smart Tank 530 Series",
	"hplip	HP Smart Tank 580-590 Series",
	"hplip	HP Smart Tank 6000 Series	Plus 6000",
	"hplip	HP Smart Tank 610 Series",
	"hplip	HP Smart Tank 660-670 Series	Plus 660-670",
	"hplip	HP Smart Tank 7000 Series	Plus 7000",
	"hplip	HP Smart Tank 710-720 Series	Plus 710-720",
	"hplip	HP Smart Tank 7300 Series",
	"hplip	HP Smart Tank 750 Series",
	"hplip	HP Smart Tank 7600 Series",
	"hplip	HP Smart Tank 790 Series",
	"hplip	HP Smart Tank Plus 550 Series",
	"hplip	HP Smart Tank Plus 570 Series",
	"hplip	HP Smart Tank Plus 650 Series",
	"hplip	HP Smart Tank Wireless 450 Series",
	"hplip	HP Tango",
	"gutenprint	Apollo P-2100",
	"gutenprint	Apollo P-2150",
	"gutenprint	Apollo P-2200",
	"gutenprint	Apollo P-2250",
	"gutenprint	Apollo P-2500",
	"gutenprint	Apollo P-2550",
	"gutenprint	Apollo P-2600",
	"gutenprint	Apollo P-2650",
	"gutenprint	Apple Color StyleWriter 4100",
	"gutenprint	Apple Color StyleWriter 4500",
	"gutenprint	Apple Color StyleWriter 6500",
	"gutenprint	Apple LaserWriter Select 360",
	"gutenprint	Brother DCP-1200",
	"gutenprint	Brother DCP-8045D",
	"gutenprint	Brother HL-1040",
	"gutenprint	Brother HL-1050",
	"gutenprint	Brother HL-1060",
	"gutenprint	Brother HL-1070",
	"gutenprint	Brother HL-10h",
	"gutenprint	Brother HL-10V",
	"gutenprint	Brother HL-1240",
	"gutenprint	Brother HL-1250",
	"gutenprint	Brother HL-1260",
	"gutenprint	Brother HL-1270N",
	"gutenprint	Brother HL-1430",
	"gutenprint	Brother HL-1440",
	"gutenprint	Brother HL-1450",
	"gutenprint	Brother HL-1470N",
	"gutenprint	Brother HL-1650",
	"gutenprint	Brother HL-1660e",
	"gutenprint	Brother HL-1670N",
	"gutenprint	Brother HL-1850",
	"gutenprint	Brother HL-1870N",
	"gutenprint	Brother HL-2030",
	"gutenprint	Brother HL-2035",
	"gutenprint	Brother HL-2060",
	"gutenprint	Brother HL-2460",
	"gutenprint	Brother HL-2460N",
	"gutenprint	Brother HL-4Ve",
	"gutenprint	Brother HL-5030",
	"gutenprint	Brother HL-5040",
	"gutenprint	Brother HL-5050",
	"gutenprint	Brother HL-5070N",
	"gutenprint	Brother HL-5140",
	"gutenprint	Brother HL-5150D",
	"gutenprint	Brother HL-5170DN",
	"gutenprint	Brother HL-630",
	"gutenprint	Brother HL-660",
	"gutenprint	Brother HL-7050",
	"gutenprint	Brother HL-7050N",
	"gutenprint	Brother HL-760",
	"gutenprint	Brother HL-960",
	"gutenprint	Brother MFC-6550MC",
	"gutenprint	Brother MFC-8300",
	"gutenprint	Brother MFC-9500",
	"gutenprint	Brother MFC-9600",
	"gutenprint	Canon BJ-30",
	"gutenprint	Canon BJC-1000",
	"gutenprint	Canon BJC-2000",
	"gutenprint	Canon BJC-2010",
	"gutenprint	Canon BJC-210",
	"gutenprint	Canon BJC-2100",
	"gutenprint	Canon BJC-2110",
	"gutenprint	Canon BJC-240",
	"gutenprint	Canon BJC-250",
	"gutenprint	Canon BJC-3000",
	"gutenprint	Canon BJC-4000",
	"gutenprint	Canon BJC-4300",
	"gutenprint	Canon BJC-4400",
	"gutenprint	Canon BJC-4550",
	"gutenprint	Canon BJC-50",
	"gutenprint	Canon BJC-5100",
	"gutenprint	Canon BJC-55",
	"gutenprint	Canon BJC-5500",
	"gutenprint	Canon BJC-6000",
	"gutenprint	Canon BJC-6100",
	"gutenprint	Canon BJC-6200",
	"gutenprint	Canon BJC-6500",
	"gutenprint	Canon BJC-7000",
	"gutenprint	Canon BJC-7100",
	"gutenprint	Canon BJC-80",
	"gutenprint	Canon BJC-8200",
	"gutenprint	Canon BJC-85",
	"gutenprint	Canon BJC-8500",
	"gutenprint	Canon CP-10",
	"gutenprint	Canon CP-100",
	"gutenprint	Canon CP-200",
	"gutenprint	Canon CP-220",
	"gutenprint	Canon CP-300",
	"gutenprint	Canon CP-330",
	"gutenprint	Canon GP 335",
	"gutenprint	Canon i450",
	"gutenprint	Canon i455",
	"gutenprint	Canon i470D",
	"gutenprint	Canon i50",
	"gutenprint	Canon i550",
	"gutenprint	Canon i560",
	"gutenprint	Canon i6100",
	"gutenprint	Canon i6500",
	"gutenprint	Canon i70",
	"gutenprint	Canon i80",
	"gutenprint	Canon i850",
	"gutenprint	Canon i850old",
	"gutenprint	Canon i860",
	"gutenprint	Canon i860old",
	"gutenprint	Canon i865",
	"gutenprint	Canon i865old",
	"gutenprint	Canon i900",
	"gutenprint	Canon i9100",
	"gutenprint	Canon i950",
	"gutenprint	Canon i960",
	"gutenprint	Canon i9900",
	"gutenprint	Canon imageRunner 330s",
	"gutenprint	Canon iP4000",
	"gutenprint	Canon LBP-1000",
	"gutenprint	Canon LBP-1260",
	"gutenprint	Canon LBP-1760",
	"gutenprint	Canon LBP-3360",
	"gutenprint	Canon LBP-430",
	"gutenprint	Canon LBP-4sx",
	"gutenprint	Canon PIXMA MP140",
	"gutenprint	Canon PIXMA MP150",
	"gutenprint	Canon PIXMA MP160",
	"gutenprint	Canon PIXMA MP170",
	"gutenprint	Canon PIXMA MP180",
	"gutenprint	Canon PIXMA MP190",
	"gutenprint	Canon PIXMA MP210",
	"gutenprint	Canon PIXMA MP220",
	"gutenprint	Canon PIXMA MP240",
	"gutenprint	Canon PIXMA MP250",
	"gutenprint	Canon PIXMA MP270",
	"gutenprint	Canon PIXMA MP280",
	"gutenprint	Canon PIXMA MP360",
	"gutenprint	Canon PIXMA MP370",
	"gutenprint	Canon PIXMA MP375R",
	"gutenprint	Canon PIXMA MP390",
	"gutenprint	Canon PIXMA MP450",
	"gutenprint	Canon PIXMA MP460",
	"gutenprint	Canon PIXMA MP470",
	"gutenprint	Canon PIXMA MP480",
	"gutenprint	Canon PIXMA MP490",
	"gutenprint	Canon PIXMA MP493",
	"gutenprint	Canon PIXMA MP495",
	"gutenprint	Canon PIXMA MP500",
	"gutenprint	Canon PIXMA MP510",
	"gutenprint	Canon PIXMA MP520",
	"gutenprint	Canon PIXMA MP530",
	"gutenprint	Canon PIXMA MP540",
	"gutenprint	Canon PIXMA MP550",
	"gutenprint	Canon PIXMA MP560",
	"gutenprint	Canon PIXMA MP600",
	"gutenprint	Canon PIXMA MP610",
	"gutenprint	Canon PIXMA MP620",
	"gutenprint	Canon PIXMA MP630",
	"gutenprint	Canon PIXMA MP640",
	"gutenprint	Canon PIXMA MP700",
	"gutenprint	Canon PIXMA MP710",
	"gutenprint	Canon PIXMA MP730",
	"gutenprint	Canon PIXMA MP740",
	"gutenprint	Canon PIXMA MP750",
	"gutenprint	Canon PIXMA MP760",
	"gutenprint	Canon PIXMA MP770",
	"gutenprint	Canon PIXMA MP780",
	"gutenprint	Canon PIXMA MP790",
	"gutenprint	Canon PIXMA MP800",
	"gutenprint	Canon PIXMA MP810",
	"gutenprint	Canon PIXMA MP830",
	"gutenprint	Canon PIXMA MP900",
	"gutenprint	Canon PIXMA MP950",
	"gutenprint	Canon PIXMA MP960",
	"gutenprint	Canon PIXMA MP970",
	"gutenprint	Canon PIXMA MP980",
	"gutenprint	Canon PIXMA MP990",
	"gutenprint	Canon PIXMA MX300",
	"gutenprint	Canon PIXMA MX330",
	"gutenprint	Canon PIXMA MX340",
	"gutenprint	Canon PIXMA MX360",
	"gutenprint	Canon PIXMA MX410",
	"gutenprint	Canon PIXMA MX420",
	"gutenprint	Canon PIXMA MX700",
	"gutenprint	Canon PIXMA MX7600",
	"gutenprint	Canon PIXMA MX850",
	"gutenprint	Canon PIXMA MX860",
	"gutenprint	Canon PIXMA MX870",
	"gutenprint	Canon PIXMA MX880",
	"gutenprint	Canon PIXMA iP100",
	"gutenprint	Canon PIXMA iP2000",
	"gutenprint	Canon PIXMA iP3000",
	"gutenprint	Canon PIXMA iP3100",
	"gutenprint	Canon PIXMA iP3300",
	"gutenprint	Canon PIXMA iP3500",
	"gutenprint	Canon PIXMA iP3600",
	"gutenprint	Canon PIXMA iP4100",
	"gutenprint	Canon PIXMA iP4200",
	"gutenprint	Canon PIXMA iP4300",
	"gutenprint	Canon PIXMA iP4500",
	"gutenprint	Canon PIXMA iP4600",
	"gutenprint	Canon PIXMA iP4700",
	"gutenprint	Canon PIXMA iP4800",
	"gutenprint	Canon PIXMA iP4900",
	"gutenprint	Canon PIXMA iP5000",
	"gutenprint	Canon PIXMA iP5200",
	"gutenprint	Canon PIXMA iP5300",
	"gutenprint	Canon PIXMA iP6000D",
	"gutenprint	Canon PIXMA iP6100D",
	"gutenprint	Canon PIXMA iP6210D",
	"gutenprint	Canon PIXMA iP6220D",
	"gutenprint	Canon PIXMA iP6310D",
	"gutenprint	Canon PIXMA iP6600D",
	"gutenprint	Canon PIXMA iP6700",
	"gutenprint	Canon PIXMA iP7100",
	"gutenprint	Canon PIXMA iP7500",
	"gutenprint	Canon PIXMA iP8100",
	"gutenprint	Canon PIXMA iP8500",
	"gutenprint	Canon PIXMA iP8600",
	"gutenprint	Canon PIXMA iP9910",
	"gutenprint	Canon PIXMA iX4000",
	"gutenprint	Canon PIXMA iX5000",
	"gutenprint	Canon PIXMA iX6500",
	"gutenprint	Canon PIXMA iX7000",
	"gutenprint	Canon PIXMA MG2100",
	"gutenprint	Canon PIXMA MG3100",
	"gutenprint	Canon PIXMA MG5100",
	"gutenprint	Canon PIXMA MG5200",
	"gutenprint	Canon PIXMA MG5300",
	"gutenprint	Canon PIXMA MG6100",
	"gutenprint	Canon PIXMA MG6200",
	"gutenprint	Canon PIXMA MG8100",
	"gutenprint	Canon PIXMA MG8200",
	"gutenprint	Canon PIXMA mini220",
	"gutenprint	Canon PIXMA mini320",
	"gutenprint	Canon PIXMA mini360",
	"gutenprint	Canon PIXMA Pro9000",
	"gutenprint	Canon PIXMA Pro9000-Mk2",
	"gutenprint	Canon PIXMA Pro9500",
	"gutenprint	Canon PIXMA Pro9500-Mk2",
	"gutenprint	Canon PIXMA iP2700",
	"gutenprint	Canon PIXMA iP3100",
	"gutenprint	Canon PIXMA iP4100",
	"gutenprint	Canon S100",
	"gutenprint	Canon S200",
	"gutenprint	Canon S300",
	"gutenprint	Canon S330",
	"gutenprint	Canon S400",
	"gutenprint	Canon S450",
	"gutenprint	Canon S4500",
	"gutenprint	Canon S500",
	"gutenprint	Canon S520",
	"gutenprint	Canon S530D",
	"gutenprint	Canon S600",
	"gutenprint	Canon S630",
	"gutenprint	Canon S750",
	"gutenprint	Canon S800",
	"gutenprint	Canon S820",
	"gutenprint	Canon S830D",
	"gutenprint	Canon S900",
	"gutenprint	Canon S9000",
	"gutenprint	Canon SELPHY-CP-400",
	"gutenprint	Canon SELPHY-CP-500",
	"gutenprint	Canon SELPHY-CP-510",
	"gutenprint	Canon SELPHY-CP-520",
	"gutenprint	Canon SELPHY-CP-530",
	"gutenprint	Canon SELPHY-CP-600",
	"gutenprint	Canon SELPHY-CP-710",
	"gutenprint	Canon SELPHY-CP-730",
	"gutenprint	Canon SELPHY-CP-740",
	"gutenprint	Canon SELPHY-CP-750",
	"gutenprint	Canon SELPHY-CP-760",
	"gutenprint	Canon SELPHY-CP-770",
	"gutenprint	Canon SELPHY-CP-790",
	"gutenprint	Canon SELPHY-DS700",
	"gutenprint	Canon SELPHY-DS810",
	"gutenprint	Citizen ProJet II",
	"gutenprint	Compaq IJ1200",
	"gutenprint	DEC 1800",
	"gutenprint	DEC LN17",
	"gutenprint	DNP DS40",
	"gutenprint	DNP DS80",
	"gutenprint	Epson ActionLaser 1100",
	"gutenprint	Epson ActionLaser II",
	"gutenprint	Epson AL-C2000",
	"gutenprint	Epson AL-C2000 PS3",
	"gutenprint	Epson AL-C8500",
	"gutenprint	Epson AL-C8500PS",
	"gutenprint	Epson AL-C8600",
	"gutenprint	Epson AL-C8600 PS3",
	"gutenprint	Epson Artisan 50",
	"gutenprint	Epson Artisan 700",
	"gutenprint	Epson Artisan 710",
	"gutenprint	Epson Artisan 800",
	"gutenprint	Epson Artisan 810",
	"gutenprint	Epson Artisan 835",
	"gutenprint	Epson B300",
	"gutenprint	Epson B308",
	"gutenprint	Epson B310",
	"gutenprint	Epson B310N",
	"gutenprint	Epson B500DN",
	"gutenprint	Epson B508DN",
	"gutenprint	Epson B510DN",
	"gutenprint	Epson CL 700",
	"gutenprint	Epson CL 750",
	"gutenprint	Epson CL 760",
	"gutenprint	Epson EM 900C",
	"gutenprint	Epson EM 930C",
	"gutenprint	Epson EPL-5200",
	"gutenprint	Epson EPL-5200plus",
	"gutenprint	Epson EPL-5700",
	"gutenprint	Epson EPL-5700PS",
	"gutenprint	Epson EPL-5800",
	"gutenprint	Epson EPL-5800PS",
	"gutenprint	Epson EPL-5900",
	"gutenprint	Epson EPL-5900 PS3",
	"gutenprint	Epson EPL-6100",
	"gutenprint	Epson EPL-6100 PS3",
	"gutenprint	Epson EPL-7100",
	"gutenprint	Epson EPL-N2050",
	"gutenprint	Epson EPL-N2050plus",
	"gutenprint	Epson EPL-N2050PS",
	"gutenprint	Epson EPL-N2050PSplus",
	"gutenprint	Epson EPL-N2120",
	"gutenprint	Epson EPL-N2500",
	"gutenprint	Epson EPL-N2500 PS3",
	"gutenprint	Epson EPL-N2750",
	"gutenprint	Epson EPL-N2750PS",
	"gutenprint	Epson EP 302",
	"gutenprint	Epson EP 702A",
	"gutenprint	Epson EP 801A",
	"gutenprint	Epson EP 801F",
	"gutenprint	Epson EP 901A",
	"gutenprint	Epson E 100",
	"gutenprint	Epson E 150",
	"gutenprint	Epson E 200",
	"gutenprint	Epson E 300",
	"gutenprint	Epson E 500",
	"gutenprint	Epson E 520",
	"gutenprint	Epson E 700",
	"gutenprint	Epson E 720",
	"gutenprint	Epson MC 10000",
	"gutenprint	Epson MC 2000",
	"gutenprint	Epson MC 5000",
	"gutenprint	Epson MC 7000",
	"gutenprint	Epson MC 9000",
	"gutenprint	Epson ME 300",
	"gutenprint	Epson ME 320",
	"gutenprint	Epson ME Office 1100",
	"gutenprint	Epson ME Office 360",
	"gutenprint	Epson ME Office 600F",
	"gutenprint	Epson ME Office 620F",
	"gutenprint	Epson ME Office 70",
	"gutenprint	Epson ME Office 700FW",
	"gutenprint	Epson ME Office 80W",
	"gutenprint	Epson ME Office 940FW",
	"gutenprint	Epson MJ 5100C",
	"gutenprint	Epson MJ 6000C",
	"gutenprint	Epson MJ 8000C",
	"gutenprint	Epson MJ 930C",
	"gutenprint	Epson Offirio-PX B300",
	"gutenprint	Epson Offirio-PX B500",
	"gutenprint	Epson PictureMate",
	"gutenprint	Epson PictureMate 100",
	"gutenprint	Epson PictureMate 200",
	"gutenprint	Epson PictureMate 2005",
	"gutenprint	Epson PictureMate 210",
	"gutenprint	Epson PictureMate 215",
	"gutenprint	Epson PictureMate 240",
	"gutenprint	Epson PictureMate 250",
	"gutenprint	Epson PictureMate 260",
	"gutenprint	Epson PictureMate 270",
	"gutenprint	Epson PictureMate 280",
	"gutenprint	Epson PictureMate 290",
	"gutenprint	Epson PictureMate 500",
	"gutenprint	Epson PictureMate Dash",
	"gutenprint	Epson PictureMate Deluxe",
	"gutenprint	Epson PictureMate Flash",
	"gutenprint	Epson PictureMate Pal",
	"gutenprint	Epson PictureMate Snap",
	"gutenprint	Epson PM 10000",
	"gutenprint	Epson PM 2000C",
	"gutenprint	Epson PM 2200C",
	"gutenprint	Epson PM 3000C",
	"gutenprint	Epson PM 3300C",
	"gutenprint	Epson PM 3500C",
	"gutenprint	Epson PM 3700C",
	"gutenprint	Epson PM 4000PX",
	"gutenprint	Epson PM 5000C",
	"gutenprint	Epson PM 670C",
	"gutenprint	Epson PM 7000C",
	"gutenprint	Epson PM 700C",
	"gutenprint	Epson PM 730C",
	"gutenprint	Epson PM 740C",
	"gutenprint	Epson PM 750C",
	"gutenprint	Epson PM 760C",
	"gutenprint	Epson PM 770C",
	"gutenprint	Epson PM 780C",
	"gutenprint	Epson PM 790PT",
	"gutenprint	Epson PM 800C",
	"gutenprint	Epson PM 850PT",
	"gutenprint	Epson PM 870C",
	"gutenprint	Epson PM 880C",
	"gutenprint	Epson PM 9000C",
	"gutenprint	Epson PM 930C",
	"gutenprint	Epson PM 940C",
	"gutenprint	Epson PM 950C",
	"gutenprint	Epson PM 970C",
	"gutenprint	Epson PM 980C",
	"gutenprint	Epson PM A650",
	"gutenprint	Epson PM A750",
	"gutenprint	Epson PM A820",
	"gutenprint	Epson PM A890",
	"gutenprint	Epson PM A900",
	"gutenprint	Epson PM A940",
	"gutenprint	Epson PM A950",
	"gutenprint	Epson PM D1000",
	"gutenprint	Epson PM D600",
	"gutenprint	Epson PM D750",
	"gutenprint	Epson PM D770",
	"gutenprint	Epson PM D800",
	"gutenprint	Epson PM D870",
	"gutenprint	Epson PM G4500",
	"gutenprint	Epson PM G700",
	"gutenprint	Epson PM G720",
	"gutenprint	Epson PM G730",
	"gutenprint	Epson PM G800",
	"gutenprint	Epson PM G820",
	"gutenprint	Epson PM G850",
	"gutenprint	Epson PM T960",
	"gutenprint	Epson PX 1001",
	"gutenprint	Epson PX 101",
	"gutenprint	Epson PX 201",
	"gutenprint	Epson PX 204",
	"gutenprint	Epson PX 401",
	"gutenprint	Epson PX 504A",
	"gutenprint	Epson PX 5500",
	"gutenprint	Epson PX 601F",
	"gutenprint	Epson PX 7000",
	"gutenprint	Epson PX 7V",
	"gutenprint	Epson PX 9000",
	"gutenprint	Epson PX A650",
	"gutenprint	Epson PX G5000",
	"gutenprint	Epson PX G5300",
	"gutenprint	Epson PX G5600",
	"gutenprint	Epson PX G900",
	"gutenprint	Epson PX G920",
	"gutenprint	Epson PX V500",
	"gutenprint	Epson PX V600",
	"gutenprint	Epson PX V630",
	"gutenprint	Epson PX V780",
	"gutenprint	Epson Stylus C110",
	"gutenprint	Epson Stylus C120",
	"gutenprint	Epson Stylus C20",
	"gutenprint	Epson Stylus C20SX",
	"gutenprint	Epson Stylus C20UX",
	"gutenprint	Epson Stylus C40",
	"gutenprint	Epson Stylus C40SX",
	"gutenprint	Epson Stylus C40UX",
	"gutenprint	Epson Stylus C41",
	"gutenprint	Epson Stylus C41SX",
	"gutenprint	Epson Stylus C41UX",
	"gutenprint	Epson Stylus C42",
	"gutenprint	Epson Stylus C42SX",
	"gutenprint	Epson Stylus C42UX",
	"gutenprint	Epson Stylus C43",
	"gutenprint	Epson Stylus C43SX",
	"gutenprint	Epson Stylus C43UX",
	"gutenprint	Epson Stylus C44",
	"gutenprint	Epson Stylus C44SX",
	"gutenprint	Epson Stylus C44UX",
	"gutenprint	Epson Stylus C45",
	"gutenprint	Epson Stylus C46",
	"gutenprint	Epson Stylus C48",
	"gutenprint	Epson Stylus C50",
	"gutenprint	Epson Stylus C60",
	"gutenprint	Epson Stylus C61",
	"gutenprint	Epson Stylus C62",
	"gutenprint	Epson Stylus C63",
	"gutenprint	Epson Stylus C64",
	"gutenprint	Epson Stylus C65",
	"gutenprint	Epson Stylus C66",
	"gutenprint	Epson Stylus C68",
	"gutenprint	Epson Stylus C70",
	"gutenprint	Epson Stylus C79",
	"gutenprint	Epson Stylus C80",
	"gutenprint	Epson Stylus C82",
	"gutenprint	Epson Stylus C83",
	"gutenprint	Epson Stylus C84",
	"gutenprint	Epson Stylus C85",
	"gutenprint	Epson Stylus C86",
	"gutenprint	Epson Stylus C87",
	"gutenprint	Epson Stylus C88",
	"gutenprint	Epson Stylus Color",
	"gutenprint	Epson Stylus Color 1160",
	"gutenprint	Epson Stylus Color 1500",
	"gutenprint	Epson Stylus Color 1520",
	"gutenprint	Epson Stylus Color 3000",
	"gutenprint	Epson Stylus Color 400",
	"gutenprint	Epson Stylus Color 440",
	"gutenprint	Epson Stylus Color 460",
	"gutenprint	Epson Stylus Color 480",
	"gutenprint	Epson Stylus Color 500",
	"gutenprint	Epson Stylus Color 580",
	"gutenprint	Epson Stylus Color 600",
	"gutenprint	Epson Stylus Color 640",
	"gutenprint	Epson Stylus Color 660",
	"gutenprint	Epson Stylus Color 670",
	"gutenprint	Epson Stylus Color 680",
	"gutenprint	Epson Stylus Color 740",
	"gutenprint	Epson Stylus Color 760",
	"gutenprint	Epson Stylus Color 777",
	"gutenprint	Epson Stylus Color 800",
	"gutenprint	Epson Stylus Color 850",
	"gutenprint	Epson Stylus Color 860",
	"gutenprint	Epson Stylus Color 880",
	"gutenprint	Epson Stylus Color 8 3",
	"gutenprint	Epson Stylus Color 900",
	"gutenprint	Epson Stylus Color 980",
	"gutenprint	Epson Stylus Color I",
	"gutenprint	Epson Stylus Color II",
	"gutenprint	Epson Stylus Color IIs",
	"gutenprint	Epson Stylus Color PRO",
	"gutenprint	Epson Stylus CX1500",
	"gutenprint	Epson Stylus CX3100",
	"gutenprint	Epson Stylus CX3200",
	"gutenprint	Epson Stylus CX3500",
	"gutenprint	Epson Stylus CX3600",
	"gutenprint	Epson Stylus CX3650",
	"gutenprint	Epson Stylus CX3700",
	"gutenprint	Epson Stylus CX3800",
	"gutenprint	Epson Stylus CX3805",
	"gutenprint	Epson Stylus CX3810",
	"gutenprint	Epson Stylus CX3900",
	"gutenprint	Epson Stylus CX4100",
	"gutenprint	Epson Stylus CX4200",
	"gutenprint	Epson Stylus CX4400",
	"gutenprint	Epson Stylus CX4500",
	"gutenprint	Epson Stylus CX4600",
	"gutenprint	Epson Stylus CX4700",
	"gutenprint	Epson Stylus CX4800",
	"gutenprint	Epson Stylus CX4900",
	"gutenprint	Epson Stylus CX5000",
	"gutenprint	Epson Stylus CX5000F",
	"gutenprint	Epson Stylus CX5100",
	"gutenprint	Epson Stylus CX5200",
	"gutenprint	Epson Stylus CX5300",
	"gutenprint	Epson Stylus CX5400",
	"gutenprint	Epson Stylus CX5500",
	"gutenprint	Epson Stylus CX5600",
	"gutenprint	Epson Stylus CX5700",
	"gutenprint	Epson Stylus CX5800",
	"gutenprint	Epson Stylus CX6000",
	"gutenprint	Epson Stylus CX6300",
	"gutenprint	Epson Stylus CX6400",
	"gutenprint	Epson Stylus CX6500",
	"gutenprint	Epson Stylus CX6600",
	"gutenprint	Epson Stylus CX7000F",
	"gutenprint	Epson Stylus CX7400",
	"gutenprint	Epson Stylus CX7700",
	"gutenprint	Epson Stylus CX7800",
	"gutenprint	Epson Stylus CX8300",
	"gutenprint	Epson Stylus CX8400",
	"gutenprint	Epson Stylus CX9300F",
	"gutenprint	Epson Stylus CX9400",
	"gutenprint	Epson Stylus CX9400F",
	"gutenprint	Epson Stylus CX9475F",
	"gutenprint	Epson Stylus D120",
	"gutenprint	Epson Stylus D68",
	"gutenprint	Epson Stylus D88",
	"gutenprint	Epson Stylus D92",
	"gutenprint	Epson Stylus DX3800",
	"gutenprint	Epson Stylus DX3850",
	"gutenprint	Epson Stylus DX4000",
	"gutenprint	Epson Stylus DX4050",
	"gutenprint	Epson Stylus DX4200",
	"gutenprint	Epson Stylus DX4250",
	"gutenprint	Epson Stylus DX4400",
	"gutenprint	Epson Stylus DX4450",
	"gutenprint	Epson Stylus DX4800",
	"gutenprint	Epson Stylus DX4850",
	"gutenprint	Epson Stylus DX7000F",
	"gutenprint	Epson Stylus DX7400",
	"gutenprint	Epson Stylus DX7450",
	"gutenprint	Epson Stylus DX8400",
	"gutenprint	Epson Stylus DX8450",
	"gutenprint	Epson Stylus DX9400F",
	"gutenprint	Epson Stylus NX100",
	"gutenprint	Epson Stylus NX105",
	"gutenprint	Epson Stylus NX115",
	"gutenprint	Epson Stylus NX200",
	"gutenprint	Epson Stylus NX215",
	"gutenprint	Epson Stylus NX300",
	"gutenprint	Epson Stylus NX400",
	"gutenprint	Epson Stylus NX415",
	"gutenprint	Epson Stylus NX515",
	"gutenprint	Epson Stylus NX530",
	"gutenprint	Epson Stylus NX635",
	"gutenprint	Epson Stylus Office B1100",
	"gutenprint	Epson Stylus Office B30",
	"gutenprint	Epson Stylus Office B33",
	"gutenprint	Epson Stylus Office B40W",
	"gutenprint	Epson Stylus Office BX300F",
	"gutenprint	Epson Stylus Office BX535WD",
	"gutenprint	Epson Stylus Office BX600FW",
	"gutenprint	Epson Stylus Office BX630FW",
	"gutenprint	Epson Stylus Office BX635FWD",
	"gutenprint	Epson Stylus Office SX600FW",
	"gutenprint	Epson Stylus Office T1100",
	"gutenprint	Epson Stylus Office T1110",
	"gutenprint	Epson Stylus Office T30",
	"gutenprint	Epson Stylus Office T33",
	"gutenprint	Epson Stylus Office T40W",
	"gutenprint	Epson Stylus Office TX300F",
	"gutenprint	Epson Stylus Office TX600FW",
	"gutenprint	Epson Stylus Office TX620FWD",
	"gutenprint	Epson Stylus Photo",
	"gutenprint	Epson Stylus Photo 1200",
	"gutenprint	Epson Stylus Photo 1270",
	"gutenprint	Epson Stylus Photo 1280",
	"gutenprint	Epson Stylus Photo 1290",
	"gutenprint	Epson Stylus Photo 1290s",
	"gutenprint	Epson Stylus Photo 1400",
	"gutenprint	Epson Stylus Photo 1410",
	"gutenprint	Epson Stylus Photo 2000P",
	"gutenprint	Epson Stylus Photo 2100",
	"gutenprint	Epson Stylus Photo 2200",
	"gutenprint	Epson Stylus Photo 700",
	"gutenprint	Epson Stylus Photo 720",
	"gutenprint	Epson Stylus Photo 750",
	"gutenprint	Epson Stylus Photo 780",
	"gutenprint	Epson Stylus Photo 785",
	"gutenprint	Epson Stylus Photo 790",
	"gutenprint	Epson Stylus Photo 810",
	"gutenprint	Epson Stylus Photo 820",
	"gutenprint	Epson Stylus Photo 825",
	"gutenprint	Epson Stylus Photo 830",
	"gutenprint	Epson Stylus Photo 830U",
	"gutenprint	Epson Stylus Photo 870",
	"gutenprint	Epson Stylus Photo 875",
	"gutenprint	Epson Stylus Photo 890",
	"gutenprint	Epson Stylus Photo 895",
	"gutenprint	Epson Stylus Photo 900",
	"gutenprint	Epson Stylus Photo 915",
	"gutenprint	Epson Stylus Photo 925",
	"gutenprint	Epson Stylus Photo 935",
	"gutenprint	Epson Stylus Photo 950",
	"gutenprint	Epson Stylus Photo 960",
	"gutenprint	Epson Stylus Photo EX",
	"gutenprint	Epson Stylus Photo EX3",
	"gutenprint	Epson Stylus Photo P50",
	"gutenprint	Epson Stylus Photo PX650",
	"gutenprint	Epson Stylus Photo PX700W",
	"gutenprint	Epson Stylus Photo PX710W",
	"gutenprint	Epson Stylus Photo PX800FW",
	"gutenprint	Epson Stylus Photo PX810FW",
	"gutenprint	Epson Stylus Photo R1800",
	"gutenprint	Epson Stylus Photo R1900",
	"gutenprint	Epson Stylus Photo R200",
	"gutenprint	Epson Stylus Photo R2000",
	"gutenprint	Epson Stylus Photo R210",
	"gutenprint	Epson Stylus Photo R220",
	"gutenprint	Epson Stylus Photo R230",
	"gutenprint	Epson Stylus Photo R240",
	"gutenprint	Epson Stylus Photo R2400",
	"gutenprint	Epson Stylus Photo R245",
	"gutenprint	Epson Stylus Photo R260",
	"gutenprint	Epson Stylus Photo R265",
	"gutenprint	Epson Stylus Photo R270",
	"gutenprint	Epson Stylus Photo R280",
	"gutenprint	Epson Stylus Photo R285",
	"gutenprint	Epson Stylus Photo R2880",
	"gutenprint	Epson Stylus Photo R290",
	"gutenprint	Epson Stylus Photo R300",
	"gutenprint	Epson Stylus Photo R3000",
	"gutenprint	Epson Stylus Photo R310",
	"gutenprint	Epson Stylus Photo R320",
	"gutenprint	Epson Stylus Photo R340",
	"gutenprint	Epson Stylus Photo R350",
	"gutenprint	Epson Stylus Photo R360",
	"gutenprint	Epson Stylus Photo R380",
	"gutenprint	Epson Stylus Photo R390",
	"gutenprint	Epson Stylus Photo R800",
	"gutenprint	Epson Stylus Photo RX400",
	"gutenprint	Epson Stylus Photo RX420",
	"gutenprint	Epson Stylus Photo RX425",
	"gutenprint	Epson Stylus Photo RX430",
	"gutenprint	Epson Stylus Photo RX500",
	"gutenprint	Epson Stylus Photo RX510",
	"gutenprint	Epson Stylus Photo RX560",
	"gutenprint	Epson Stylus Photo RX580",
	"gutenprint	Epson Stylus Photo RX585",
	"gutenprint	Epson Stylus Photo RX590",
	"gutenprint	Epson Stylus Photo RX595",
	"gutenprint	Epson Stylus Photo RX600",
	"gutenprint	Epson Stylus Photo RX610",
	"gutenprint	Epson Stylus Photo RX620",
	"gutenprint	Epson Stylus Photo RX630",
	"gutenprint	Epson Stylus Photo RX640",
	"gutenprint	Epson Stylus Photo RX650",
	"gutenprint	Epson Stylus Photo RX680",
	"gutenprint	Epson Stylus Photo RX685",
	"gutenprint	Epson Stylus Photo RX690",
	"gutenprint	Epson Stylus Photo RX700",
	"gutenprint	Epson Stylus Photo S50",
	"gutenprint	Epson Stylus Photo TX700W",
	"gutenprint	Epson Stylus Photo TX710W",
	"gutenprint	Epson Stylus Photo TX800FW",
	"gutenprint	Epson Stylus Photo TX810FW",
	"gutenprint	Epson Stylus Pro 10000",
	"gutenprint	Epson Stylus Pro 11600",
	"gutenprint	Epson Stylus Pro 11800",
	"gutenprint	Epson Stylus Pro 11880",
	"gutenprint	Epson Stylus Pro 3800",
	"gutenprint	Epson Stylus Pro 3880",
	"gutenprint	Epson Stylus Pro 3885",
	"gutenprint	Epson Stylus Pro 4000",
	"gutenprint	Epson Stylus Pro 4600",
	"gutenprint	Epson Stylus Pro 4800",
	"gutenprint	Epson Stylus Pro 4880",
	"gutenprint	Epson Stylus Pro 5000",
	"gutenprint	Epson Stylus Pro 5500",
	"gutenprint	Epson Stylus Pro 7000",
	"gutenprint	Epson Stylus Pro 7500",
	"gutenprint	Epson Stylus Pro 7600",
	"gutenprint	Epson Stylus Pro 7700",
	"gutenprint	Epson Stylus Pro 7800",
	"gutenprint	Epson Stylus Pro 7880",
	"gutenprint	Epson Stylus Pro 7890",
	"gutenprint	Epson Stylus Pro 7900",
	"gutenprint	Epson Stylus Pro 9000",
	"gutenprint	Epson Stylus Pro 9500",
	"gutenprint	Epson Stylus Pro 9600",
	"gutenprint	Epson Stylus Pro 9700",
	"gutenprint	Epson Stylus Pro 9800",
	"gutenprint	Epson Stylus Pro 9880",
	"gutenprint	Epson Stylus Pro 9890",
	"gutenprint	Epson Stylus Pro 9900",
	"gutenprint	Epson Stylus Pro XL",
	"gutenprint	Epson Stylus S20",
	"gutenprint	Epson Stylus S21",
	"gutenprint	Epson Stylus Scan 2000",
	"gutenprint	Epson Stylus Scan 2500",
	"gutenprint	Epson Stylus SX100",
	"gutenprint	Epson Stylus SX105",
	"gutenprint	Epson Stylus SX110",
	"gutenprint	Epson Stylus SX115",
	"gutenprint	Epson Stylus SX200",
	"gutenprint	Epson Stylus SX205",
	"gutenprint	Epson Stylus SX210",
	"gutenprint	Epson Stylus SX215",
	"gutenprint	Epson Stylus SX400",
	"gutenprint	Epson Stylus SX405",
	"gutenprint	Epson Stylus SX410",
	"gutenprint	Epson Stylus SX415",
	"gutenprint	Epson Stylus SX510W",
	"gutenprint	Epson Stylus SX515",
	"gutenprint	Epson Stylus SX525",
	"gutenprint	Epson Stylus SX535FW",
	"gutenprint	Epson Stylus SX600FW",
	"gutenprint	Epson Stylus SX610FW",
	"gutenprint	Epson Stylus SX615",
	"gutenprint	Epson Stylus SX650",
	"gutenprint	Epson Stylus T13",
	"gutenprint	Epson Stylus T20",
	"gutenprint	Epson Stylus T21",
	"gutenprint	Epson Stylus T22",
	"gutenprint	Epson Stylus T22E",
	"gutenprint	Epson Stylus T26",
	"gutenprint	Epson Stylus T30",
	"gutenprint	Epson Stylus T40W",
	"gutenprint	Epson Stylus T50",
	"gutenprint	Epson Stylus T59",
	"gutenprint	Epson Stylus T60",
	"gutenprint	Epson Stylus TX100",
	"gutenprint	Epson Stylus TX101",
	"gutenprint	Epson Stylus TX102",
	"gutenprint	Epson Stylus TX103",
	"gutenprint	Epson Stylus TX104",
	"gutenprint	Epson Stylus TX105",
	"gutenprint	Epson Stylus TX106",
	"gutenprint	Epson Stylus TX109",
	"gutenprint	Epson Stylus TX110",
	"gutenprint	Epson Stylus TX200",
	"gutenprint	Epson Stylus TX210",
	"gutenprint	Epson Stylus TX300F",
	"gutenprint	Epson Stylus TX400",
	"gutenprint	Epson Stylus TX410",
	"gutenprint	Epson Stylus TX510FN",
	"gutenprint	Epson Stylus TX550W",
	"gutenprint	Epson Stylus TX610FW",
	"gutenprint	Epson Stylus TX615",
	"gutenprint	Epson Stylus TX650",
	"gutenprint	Epson Stylus TX659",
	"gutenprint	Epson WorkForce 1100",
	"gutenprint	Epson WorkForce 30",
	"gutenprint	Epson WorkForce 310",
	"gutenprint	Epson WorkForce 315",
	"gutenprint	Epson WorkForce 40",
	"gutenprint	Epson WorkForce 500",
	"gutenprint	Epson WorkForce 545",
	"gutenprint	Epson WorkForce 600",
	"gutenprint	Epson WorkForce 610",
	"gutenprint	Epson WorkForce 615",
	"gutenprint	Epson WorkForce 630",
	"gutenprint	Epson WorkForce 635",
	"gutenprint	Epson WorkForce 645",
	"gutenprint	Fujifilm FinePix-NX-500",
	"gutenprint	Fujifilm Printpix-CX-400",
	"gutenprint	Fujifilm Printpix-CX-550",
	"gutenprint	Fujitsu PrintPartner 10V",
	"gutenprint	Fujitsu PrintPartner 16DV",
	"gutenprint	Fujitsu PrintPartner 20W",
	"gutenprint	Fujitsu PrintPartner 8000",
	"gutenprint	Generic PCL 4 Printer",
	"gutenprint	Generic PCL 5 Printer",
	"gutenprint	Generic PCL 6 PCL XL Printer",
	"gutenprint	Generic PostScript Level 2",
	"gutenprint	Gestetner 10512",
	"gutenprint	Gestetner 2212",
	"gutenprint	Gestetner 2712",
	"gutenprint	Gestetner 3212",
	"gutenprint	Gestetner 3502",
	"gutenprint	Gestetner 3532 4235g",
	"gutenprint	Gestetner 4502",
	"gutenprint	Gestetner 4532 4245g",
	"gutenprint	Gestetner 6002",
	"gutenprint	Gestetner 7502",
	"gutenprint	Gestetner 9002",
	"gutenprint	Gestetner DSm415",
	"gutenprint	Gestetner DSm615",
	"gutenprint	Gestetner DSm616",
	"gutenprint	Gestetner DSm618",
	"gutenprint	Gestetner DSm618d",
	"gutenprint	Gestetner DSm620",
	"gutenprint	Gestetner DSm620d",
	"gutenprint	Gestetner DSm622",
	"gutenprint	Gestetner DSm627",
	"gutenprint	Gestetner DSm635 635G",
	"gutenprint	Gestetner DSm645 645G",
	"gutenprint	Gestetner DSm651",
	"gutenprint	Gestetner DSm660",
	"gutenprint	Gestetner DSm675",
	"gutenprint	Gestetner DSm725",
	"gutenprint	Gestetner DSm730",
	"gutenprint	Gestetner DSm735 735G",
	"gutenprint	Gestetner DSm745 745G",
	"gutenprint	Gestetner MP1100 DSm7110",
	"gutenprint	Gestetner MP1350 DSm7135",
	"gutenprint	Gestetner MP1600 DSm716",
	"gutenprint	Gestetner MP2000 DSm721d",
	"gutenprint	Gestetner MP2500 DSm625",
	"gutenprint	Gestetner MP3500 DSm735e",
	"gutenprint	Gestetner MP4500 DSm745e",
	"gutenprint	Gestetner MP5500 DSm755",
	"gutenprint	Gestetner MP6500 DSm765",
	"gutenprint	Gestetner MP7500 DSm775",
	"gutenprint	Gestetner MP9000 DSm790",
	"gutenprint	Gestetner MP 161 DSm416",
	"gutenprint	Gestetner MP 2510 DSm725e",
	"gutenprint	Gestetner MP 2550",
	"gutenprint	Gestetner MP 2550B",
	"gutenprint	Gestetner MP 3010 DSm730e",
	"gutenprint	Gestetner MP 3350",
	"gutenprint	Gestetner MP 3350B",
	"gutenprint	Gestetner MP 4000",
	"gutenprint	Gestetner MP 4000B",
	"gutenprint	Gestetner MP 5000",
	"gutenprint	Gestetner MP 5000B",
	"gutenprint	HP 2000C",
	"gutenprint	HP 2500C",
	"gutenprint	HP 2500CM",
	"gutenprint	HP Business Inkjet 2200",
	"gutenprint	HP Business Inkjet 2230",
	"gutenprint	HP Business Inkjet 2250",
	"gutenprint	HP Business Inkjet 2250TN",
	"gutenprint	HP Business Inkjet 2280",
	"gutenprint	HP Color Inkjet Printer CP1160",
	"gutenprint	HP Color Inkjet Printer CP1700",
	"gutenprint	HP Color LaserJet 2500",
	"gutenprint	HP Color LaserJet 4500",
	"gutenprint	HP Color LaserJet 4550",
	"gutenprint	HP Color LaserJet 4600",
	"gutenprint	HP Color LaserJet 5",
	"gutenprint	HP Color LaserJet 5000",
	"gutenprint	HP Color LaserJet 5500",
	"gutenprint	HP Color LaserJet 8550GN",
	"gutenprint	HP DesignJet 230",
	"gutenprint	HP DesignJet 2500CP",
	"gutenprint	HP DesignJet 250C",
	"gutenprint	HP DesignJet 3500CP",
	"gutenprint	HP DesignJet 430",
	"gutenprint	HP DesignJet 450C",
	"gutenprint	HP DesignJet 455CA",
	"gutenprint	HP DesignJet 488CA",
	"gutenprint	HP DesignJet 700",
	"gutenprint	HP DesignJet 750",
	"gutenprint	HP DesignJet 750C Plus",
	"gutenprint	HP DesignJet ColorPro CAD",
	"gutenprint	HP DeskJet 1100C",
	"gutenprint	HP DeskJet 1120C",
	"gutenprint	HP DeskJet 1125C",
	"gutenprint	HP DeskJet 1200C",
	"gutenprint	HP DeskJet 1220C",
	"gutenprint	HP DeskJet 1600C",
	"gutenprint	HP DeskJet 1600CM",
	"gutenprint	HP DeskJet 340C",
	"gutenprint	HP DeskJet 3810",
	"gutenprint	HP DeskJet 3816",
	"gutenprint	HP DeskJet 3820",
	"gutenprint	HP DeskJet 3822",
	"gutenprint	HP DeskJet 400",
	"gutenprint	HP DeskJet 420C",
	"gutenprint	HP DeskJet 450",
	"gutenprint	HP DeskJet 500",
	"gutenprint	HP DeskJet 500C",
	"gutenprint	HP DeskJet 505J Plus",
	"gutenprint	HP DeskJet 510",
	"gutenprint	HP DeskJet 520",
	"gutenprint	HP DeskJet 540C",
	"gutenprint	HP DeskJet 550C",
	"gutenprint	HP DeskJet 5550",
	"gutenprint	HP DeskJet 5551",
	"gutenprint	HP DeskJet 560C",
	"gutenprint	HP DeskJet 600",
	"gutenprint	HP DeskJet 600C",
	"gutenprint	HP DeskJet 610C",
	"gutenprint	HP DeskJet 610CL",
	"gutenprint	HP DeskJet 6122",
	"gutenprint	HP DeskJet 6127",
	"gutenprint	HP DeskJet 612C",
	"gutenprint	HP DeskJet 640C",
	"gutenprint	HP DeskJet 648C",
	"gutenprint	HP DeskJet 660C",
	"gutenprint	HP DeskJet 670C",
	"gutenprint	HP DeskJet 670TV",
	"gutenprint	HP DeskJet 672C",
	"gutenprint	HP DeskJet 680C",
	"gutenprint	HP DeskJet 682C",
	"gutenprint	HP DeskJet 690C",
	"gutenprint	HP DeskJet 692C",
	"gutenprint	HP DeskJet 693C",
	"gutenprint	HP DeskJet 694C",
	"gutenprint	HP DeskJet 695C",
	"gutenprint	HP DeskJet 697C",
	"gutenprint	HP DeskJet 810C",
	"gutenprint	HP DeskJet 812C",
	"gutenprint	HP DeskJet 815C",
	"gutenprint	HP DeskJet 816C",
	"gutenprint	HP DeskJet 825C",
	"gutenprint	HP DeskJet 830C",
	"gutenprint	HP DeskJet 832C",
	"gutenprint	HP DeskJet 840C",
	"gutenprint	HP DeskJet 841C",
	"gutenprint	HP DeskJet 842C",
	"gutenprint	HP DeskJet 843C",
	"gutenprint	HP DeskJet 845C",
	"gutenprint	HP DeskJet 850C",
	"gutenprint	HP DeskJet 855C",
	"gutenprint	HP DeskJet 870C",
	"gutenprint	HP DeskJet 880C",
	"gutenprint	HP DeskJet 882C",
	"gutenprint	HP DeskJet 890C",
	"gutenprint	HP DeskJet 895C",
	"gutenprint	HP DeskJet 916C",
	"gutenprint	HP DeskJet 920C",
	"gutenprint	HP DeskJet 9300",
	"gutenprint	HP DeskJet 930C",
	"gutenprint	HP DeskJet 932C",
	"gutenprint	HP DeskJet 933C",
	"gutenprint	HP DeskJet 934C",
	"gutenprint	HP DeskJet 935C",
	"gutenprint	HP DeskJet 940C",
	"gutenprint	HP DeskJet 948C",
	"gutenprint	HP DeskJet 950C",
	"gutenprint	HP DeskJet 952C",
	"gutenprint	HP DeskJet 955C",
	"gutenprint	HP DeskJet 957C",
	"gutenprint	HP DeskJet 959C",
	"gutenprint	HP DeskJet 960C",
	"gutenprint	HP DeskJet 970C",
	"gutenprint	HP DeskJet 975C",
	"gutenprint	HP DeskJet 980C",
	"gutenprint	HP DeskJet 990C",
	"gutenprint	HP DeskJet 995C",
	"gutenprint	HP e-printer e20",
	"gutenprint	HP LaserJet 1010",
	"gutenprint	HP LaserJet 1012",
	"gutenprint	HP LaserJet 1015",
	"gutenprint	HP LaserJet 1022",
	"gutenprint	HP LaserJet 1100",
	"gutenprint	HP LaserJet 1100A",
	"gutenprint	HP LaserJet 1150",
	"gutenprint	HP LaserJet 1160",
	"gutenprint	HP LaserJet 1200",
	"gutenprint	HP LaserJet 1220",
	"gutenprint	HP LaserJet 1300",
	"gutenprint	HP LaserJet 1320",
	"gutenprint	HP LaserJet 2",
	"gutenprint	HP LaserJet 2100",
	"gutenprint	HP LaserJet 2100M",
	"gutenprint	HP LaserJet 2200",
	"gutenprint	HP LaserJet 2300",
	"gutenprint	HP LaserJet 2410",
	"gutenprint	HP LaserJet 2420",
	"gutenprint	HP LaserJet 2430",
	"gutenprint	HP LaserJet 2D",
	"gutenprint	HP LaserJet 2P",
	"gutenprint	HP LaserJet 2P Plus",
	"gutenprint	HP LaserJet 3",
	"gutenprint	HP LaserJet 3015",
	"gutenprint	HP LaserJet 3020",
	"gutenprint	HP LaserJet 3030",
	"gutenprint	HP LaserJet 3050",
	"gutenprint	HP LaserJet 3052",
	"gutenprint	HP LaserJet 3055",
	"gutenprint	HP LaserJet 3200",
	"gutenprint	HP LaserJet 3200m",
	"gutenprint	HP LaserJet 3200se",
	"gutenprint	HP LaserJet 3300 MFP",
	"gutenprint	HP LaserJet 3310 MFP",
	"gutenprint	HP LaserJet 3320N MFP",
	"gutenprint	HP LaserJet 3320 MFP",
	"gutenprint	HP LaserJet 3330 MFP",
	"gutenprint	HP LaserJet 3380",
	"gutenprint	HP LaserJet 3390",
	"gutenprint	HP LaserJet 3392",
	"gutenprint	HP LaserJet 3D",
	"gutenprint	HP LaserJet 3P w PCL5",
	"gutenprint	HP LaserJet 3P w PS",
	"gutenprint	HP LaserJet 4",
	"gutenprint	HP LaserJet 4000",
	"gutenprint	HP LaserJet 4050",
	"gutenprint	HP LaserJet 4100",
	"gutenprint	HP LaserJet 4200",
	"gutenprint	HP LaserJet 4240",
	"gutenprint	HP LaserJet 4250",
	"gutenprint	HP LaserJet 4300",
	"gutenprint	HP LaserJet 4345 mfp",
	"gutenprint	HP LaserJet 4350",
	"gutenprint	HP LaserJet 4L",
	"gutenprint	HP LaserJet 4M",
	"gutenprint	HP LaserJet 4ML",
	"gutenprint	HP LaserJet 4P",
	"gutenprint	HP LaserJet 4Si",
	"gutenprint	HP LaserJet 4V",
	"gutenprint	HP LaserJet 4 Plus",
	"gutenprint	HP LaserJet 5",
	"gutenprint	HP LaserJet 5000",
	"gutenprint	HP LaserJet 5100",
	"gutenprint	HP LaserJet 5200",
	"gutenprint	HP LaserJet 5200L",
	"gutenprint	HP LaserJet 5L",
	"gutenprint	HP LaserJet 5M",
	"gutenprint	HP LaserJet 5MP",
	"gutenprint	HP LaserJet 5P",
	"gutenprint	HP LaserJet 5Si",
	"gutenprint	HP LaserJet 6",
	"gutenprint	HP LaserJet 6L",
	"gutenprint	HP LaserJet 6MP",
	"gutenprint	HP LaserJet 6P",
	"gutenprint	HP LaserJet 8000",
	"gutenprint	HP LaserJet 8100",
	"gutenprint	HP LaserJet 8150",
	"gutenprint	HP LaserJet 9000",
	"gutenprint	HP LaserJet 9040",
	"gutenprint	HP LaserJet 9040 MFP",
	"gutenprint	HP LaserJet 9050",
	"gutenprint	HP LaserJet 9050 MFP",
	"gutenprint	HP LaserJet M3027 MFP",
	"gutenprint	HP LaserJet M3035 MFP",
	"gutenprint	HP LaserJet M4345 MFP",
	"gutenprint	HP LaserJet M5025 MFP",
	"gutenprint	HP LaserJet M5035 MFP",
	"gutenprint	HP LaserJet P2010",
	"gutenprint	HP LaserJet P2015",
	"gutenprint	HP LaserJet P3004",
	"gutenprint	HP LaserJet P3005",
	"gutenprint	HP Mopier 240",
	"gutenprint	HP Mopier 320",
	"gutenprint	HP OfficeJet",
	"gutenprint	HP OfficeJet 300",
	"gutenprint	HP OfficeJet 330",
	"gutenprint	HP OfficeJet 350",
	"gutenprint	HP OfficeJet 500",
	"gutenprint	HP OfficeJet 5105",
	"gutenprint	HP OfficeJet 5110",
	"gutenprint	HP OfficeJet 5110xi",
	"gutenprint	HP OfficeJet 520",
	"gutenprint	HP OfficeJet 570",
	"gutenprint	HP OfficeJet 580",
	"gutenprint	HP OfficeJet 590",
	"gutenprint	HP OfficeJet 600",
	"gutenprint	HP OfficeJet 610",
	"gutenprint	HP OfficeJet 6105",
	"gutenprint	HP OfficeJet 6110",
	"gutenprint	HP OfficeJet 625",
	"gutenprint	HP OfficeJet 630",
	"gutenprint	HP OfficeJet 635",
	"gutenprint	HP OfficeJet 700",
	"gutenprint	HP OfficeJet 710",
	"gutenprint	HP OfficeJet 7110",
	"gutenprint	HP OfficeJet 7130",
	"gutenprint	HP OfficeJet 7140",
	"gutenprint	HP OfficeJet 720",
	"gutenprint	HP OfficeJet 725",
	"gutenprint	HP OfficeJet D125",
	"gutenprint	HP OfficeJet D135",
	"gutenprint	HP OfficeJet D145",
	"gutenprint	HP OfficeJet D155",
	"gutenprint	HP OfficeJet G55",
	"gutenprint	HP OfficeJet G85",
	"gutenprint	HP OfficeJet G95",
	"gutenprint	HP OfficeJet K60",
	"gutenprint	HP OfficeJet K60xi",
	"gutenprint	HP OfficeJet K80",
	"gutenprint	HP OfficeJet K80xi",
	"gutenprint	HP OfficeJet LX",
	"gutenprint	HP OfficeJet Pro 1150C",
	"gutenprint	HP OfficeJet Pro 1170C",
	"gutenprint	HP OfficeJet Pro 1175C",
	"gutenprint	HP OfficeJet R40",
	"gutenprint	HP OfficeJet R45",
	"gutenprint	HP OfficeJet R60",
	"gutenprint	HP OfficeJet R65",
	"gutenprint	HP OfficeJet R80",
	"gutenprint	HP OfficeJet T45",
	"gutenprint	HP OfficeJet T65",
	"gutenprint	HP OfficeJet V40",
	"gutenprint	HP OfficeJet V40xi",
	"gutenprint	HP PhotoSmart 7150",
	"gutenprint	HP PhotoSmart 7345",
	"gutenprint	HP PhotoSmart 7350",
	"gutenprint	HP PhotoSmart 7550",
	"gutenprint	HP PhotoSmart P100",
	"gutenprint	HP PhotoSmart P1000",
	"gutenprint	HP PhotoSmart P1100",
	"gutenprint	HP PhotoSmart P1115",
	"gutenprint	HP PhotoSmart P1215",
	"gutenprint	HP PhotoSmart P1218",
	"gutenprint	HP PhotoSmart P130",
	"gutenprint	HP PhotoSmart P1315",
	"gutenprint	HP PhotoSmart P230",
	"gutenprint	HP PSC 2110",
	"gutenprint	HP PSC 2150",
	"gutenprint	HP PSC 2210",
	"gutenprint	HP PSC 370",
	"gutenprint	HP PSC 380",
	"gutenprint	HP PSC 500",
	"gutenprint	HP PSC 750",
	"gutenprint	HP PSC 950",
	"gutenprint	HP PSC 950xi",
	"gutenprint	IBM 4019",
	"gutenprint	IBM 4029 030 LaserPrinter 10",
	"gutenprint	IBM 4312",
	"gutenprint	IBM Infoprint 12",
	"gutenprint	IBM Page Printer 3112",
	"gutenprint	Infotec 4353 MF",
	"gutenprint	Infotec 4452 MF",
	"gutenprint	Infotec 4651 MF",
	"gutenprint	Infotec IS2022",
	"gutenprint	Infotec IS2027",
	"gutenprint	Infotec IS2032",
	"gutenprint	Infotec IS2035",
	"gutenprint	Infotec IS2045",
	"gutenprint	Infotec IS2090",
	"gutenprint	Infotec IS2105",
	"gutenprint	Infotec IS 2015",
	"gutenprint	Infotec IS 2018",
	"gutenprint	Infotec IS 2018D",
	"gutenprint	Infotec IS 2060",
	"gutenprint	Infotec IS 2075",
	"gutenprint	Infotec IS 2122",
	"gutenprint	Infotec IS 2127",
	"gutenprint	Infotec IS 2132",
	"gutenprint	Infotec IS 2135",
	"gutenprint	Infotec IS 2145",
	"gutenprint	Infotec IS 2151",
	"gutenprint	Infotec IS 2160",
	"gutenprint	Infotec IS 2175",
	"gutenprint	Infotec IS 2215",
	"gutenprint	Infotec IS 2216",
	"gutenprint	Infotec IS 2220",
	"gutenprint	Infotec IS 2220D",
	"gutenprint	Infotec IS 2225",
	"gutenprint	Infotec IS 2230",
	"gutenprint	Infotec IS 2235",
	"gutenprint	Infotec IS 2245",
	"gutenprint	Infotec IS 2255",
	"gutenprint	Infotec IS 2265",
	"gutenprint	Infotec IS 2275",
	"gutenprint	Infotec IS 2316",
	"gutenprint	Infotec IS 2320",
	"gutenprint	Infotec IS 2325",
	"gutenprint	Infotec IS 2416",
	"gutenprint	Infotec IS 2425",
	"gutenprint	Infotec IS 2430",
	"gutenprint	Infotec IS 2435",
	"gutenprint	Infotec IS 2445",
	"gutenprint	Infotec IS 3090",
	"gutenprint	Infotec IS 3110",
	"gutenprint	Infotec IS 3135",
	"gutenprint	Infotec MP 2550",
	"gutenprint	Infotec MP 2550B",
	"gutenprint	Infotec MP 3350",
	"gutenprint	Infotec MP 3350B",
	"gutenprint	Infotec MP 4000",
	"gutenprint	Infotec MP 4000B",
	"gutenprint	Infotec MP 5000",
	"gutenprint	Infotec MP 5000B",
	"gutenprint	Kodak EasyShare-G600-Printer-Dock",
	"gutenprint	Kodak Easyshare-Printer-Dock",
	"gutenprint	Kodak PD-4000",
	"gutenprint	Kodak PD-6000",
	"gutenprint	Kodak Photo-Printer-500",
	"gutenprint	Kodak Photo-Printer",
	"gutenprint	Kodak Printer-Dock-Plus",
	"gutenprint	Kodak Printer-Dock-Plus-S3",
	"gutenprint	Kyocera CS-1815",
	"gutenprint	Kyocera F-1010",
	"gutenprint	Kyocera FS-1000",
	"gutenprint	Kyocera FS-1000plus",
	"gutenprint	Kyocera FS-1010",
	"gutenprint	Kyocera FS-1018MFP",
	"gutenprint	Kyocera FS-1020D",
	"gutenprint	Kyocera FS-1030D",
	"gutenprint	Kyocera FS-1050",
	"gutenprint	Kyocera FS-1118MFP",
	"gutenprint	Kyocera FS-1200",
	"gutenprint	Kyocera FS-1600",
	"gutenprint	Kyocera FS-1600plus",
	"gutenprint	Kyocera FS-1700",
	"gutenprint	Kyocera FS-1700plus",
	"gutenprint	Kyocera FS-1714M",
	"gutenprint	Kyocera FS-1750",
	"gutenprint	Kyocera FS-1800",
	"gutenprint	Kyocera FS-1800plus",
	"gutenprint	Kyocera FS-1900",
	"gutenprint	Kyocera FS-1920",
	"gutenprint	Kyocera FS-2000D",
	"gutenprint	Kyocera FS-3500",
	"gutenprint	Kyocera FS-3600",
	"gutenprint	Kyocera FS-3600plus",
	"gutenprint	Kyocera FS-3700",
	"gutenprint	Kyocera FS-3700plus",
	"gutenprint	Kyocera FS-3718M",
	"gutenprint	Kyocera FS-3750",
	"gutenprint	Kyocera FS-3800",
	"gutenprint	Kyocera FS-3820N",
	"gutenprint	Kyocera FS-3830N",
	"gutenprint	Kyocera FS-3900DN",
	"gutenprint	Kyocera FS-4000DN",
	"gutenprint	Kyocera FS-5800C",
	"gutenprint	Kyocera FS-5900C",
	"gutenprint	Kyocera FS-600",
	"gutenprint	Kyocera FS-600 KPDL-2",
	"gutenprint	Kyocera FS-6020",
	"gutenprint	Kyocera FS-6026",
	"gutenprint	Kyocera FS-6300",
	"gutenprint	Kyocera FS-6500",
	"gutenprint	Kyocera FS-6500plus",
	"gutenprint	Kyocera FS-6700",
	"gutenprint	Kyocera FS-6750",
	"gutenprint	Kyocera FS-680",
	"gutenprint	Kyocera FS-6900",
	"gutenprint	Kyocera FS-6950DN",
	"gutenprint	Kyocera FS-7000",
	"gutenprint	Kyocera FS-7000plus",
	"gutenprint	Kyocera FS-7028M",
	"gutenprint	Kyocera FS-800",
	"gutenprint	Kyocera FS-8000C",
	"gutenprint	Kyocera FS-9000",
	"gutenprint	Kyocera FS-9100DN",
	"gutenprint	Kyocera FS-9130DN",
	"gutenprint	Kyocera FS-920",
	"gutenprint	Kyocera FS-9500DN",
	"gutenprint	Kyocera FS-9530DN",
	"gutenprint	Kyocera KM-1510",
	"gutenprint	Kyocera KM-1530",
	"gutenprint	Kyocera KM-1810",
	"gutenprint	Kyocera KM-1815",
	"gutenprint	Kyocera KM-1820",
	"gutenprint	Kyocera KM-2030",
	"gutenprint	Kyocera KM-2530",
	"gutenprint	Kyocera KM-3050",
	"gutenprint	Kyocera KM-3530",
	"gutenprint	Kyocera KM-4050",
	"gutenprint	Kyocera KM-4230",
	"gutenprint	Kyocera KM-4230 5230",
	"gutenprint	Kyocera KM-4530",
	"gutenprint	Kyocera KM-5050",
	"gutenprint	Kyocera KM-5230",
	"gutenprint	Kyocera KM-5530",
	"gutenprint	Kyocera KM-6030",
	"gutenprint	Kyocera KM-6230",
	"gutenprint	Kyocera KM-8030",
	"gutenprint	Lanier 5622",
	"gutenprint	Lanier 5627",
	"gutenprint	Lanier 5632",
	"gutenprint	Lanier 5635",
	"gutenprint	Lanier 5645",
	"gutenprint	Lanier LD0105",
	"gutenprint	Lanier LD015",
	"gutenprint	Lanier LD035",
	"gutenprint	Lanier LD045",
	"gutenprint	Lanier LD060",
	"gutenprint	Lanier LD075",
	"gutenprint	Lanier LD090",
	"gutenprint	Lanier LD115",
	"gutenprint	Lanier LD116",
	"gutenprint	Lanier LD118",
	"gutenprint	Lanier LD118d",
	"gutenprint	Lanier LD120",
	"gutenprint	Lanier LD120d",
	"gutenprint	Lanier LD122",
	"gutenprint	Lanier LD127",
	"gutenprint	Lanier LD132",
	"gutenprint	Lanier LD135",
	"gutenprint	Lanier LD145",
	"gutenprint	Lanier LD151",
	"gutenprint	Lanier LD160",
	"gutenprint	Lanier LD175",
	"gutenprint	Lanier LD225",
	"gutenprint	Lanier LD230",
	"gutenprint	Lanier LD235",
	"gutenprint	Lanier LD245",
	"gutenprint	Lanier MP2500 LD125",
	"gutenprint	Lanier MP 1100 LD1100",
	"gutenprint	Lanier MP 1350 LD1135",
	"gutenprint	Lanier MP 1600 LD316",
	"gutenprint	Lanier MP 161 LD016",
	"gutenprint	Lanier MP 2000 LD320d",
	"gutenprint	Lanier MP 2510 LD325",
	"gutenprint	Lanier MP 2550B LD425B",
	"gutenprint	Lanier MP 2550 LD425",
	"gutenprint	Lanier MP 3010 LD330",
	"gutenprint	Lanier MP 3350B LD433B",
	"gutenprint	Lanier MP 3350 LD433",
	"gutenprint	Lanier MP 3500 LD335",
	"gutenprint	Lanier MP 4000B LD040B",
	"gutenprint	Lanier MP 4000 LD040",
	"gutenprint	Lanier MP 4500 LD345",
	"gutenprint	Lanier MP 5000B LD050B",
	"gutenprint	Lanier MP 5000 LD050",
	"gutenprint	Lanier MP 5500 LD255",
	"gutenprint	Lanier MP 6500 LD265",
	"gutenprint	Lanier MP 7500 LD275",
	"gutenprint	Lanier MP 9000 LD190",
	"gutenprint	Lexmark 4076",
	"gutenprint	Lexmark Optra E",
	"gutenprint	Lexmark Optra E220",
	"gutenprint	Lexmark Optra E321",
	"gutenprint	Lexmark Optra E323",
	"gutenprint	Lexmark Optra Eplus",
	"gutenprint	Lexmark Valuewriter 300",
	"gutenprint	Lexmark X73",
	"gutenprint	Lexmark Z42",
	"gutenprint	Lexmark Z43",
	"gutenprint	Lexmark Z52",
	"gutenprint	Lexmark Z53",
	"gutenprint	Minolta PagePro 1100",
	"gutenprint	Minolta PagePro 6",
	"gutenprint	Minolta PagePro 6e",
	"gutenprint	Minolta PagePro 6ex",
	"gutenprint	Minolta PagePro 8",
	"gutenprint	Minolta PagePro 8L",
	"gutenprint	NEC SuperScript 1260",
	"gutenprint	NEC SuperScript 1400",
	"gutenprint	NEC SuperScript 1800",
	"gutenprint	NEC SuperScript 660i",
	"gutenprint	NEC SuperScript 860",
	"gutenprint	NEC SuperScript 870",
	"gutenprint	NRG 10515 10518 10512",
	"gutenprint	NRG 2205 2238 2212",
	"gutenprint	NRG 2705 2738 2712",
	"gutenprint	NRG 3205 3238 3212",
	"gutenprint	NRG 3525 3508 3502",
	"gutenprint	NRG 3545 3518 3532",
	"gutenprint	NRG 4525 4508 4502",
	"gutenprint	NRG 4545 4518 4532",
	"gutenprint	NRG 6002 6005 6008",
	"gutenprint	NRG 7502 7505 7508",
	"gutenprint	NRG 9005 9008 9002",
	"gutenprint	NRG DSm415",
	"gutenprint	NRG DSm615",
	"gutenprint	NRG DSm616",
	"gutenprint	NRG DSm618",
	"gutenprint	NRG DSm618d",
	"gutenprint	NRG DSm620",
	"gutenprint	NRG DSm620d",
	"gutenprint	NRG DSm622",
	"gutenprint	NRG DSm627",
	"gutenprint	NRG DSm632",
	"gutenprint	NRG DSm635",
	"gutenprint	NRG DSm645",
	"gutenprint	NRG DSm651",
	"gutenprint	NRG DSm660",
	"gutenprint	NRG DSm675",
	"gutenprint	NRG DSm725",
	"gutenprint	NRG DSm730",
	"gutenprint	NRG DSm735",
	"gutenprint	NRG DSm745",
	"gutenprint	NRG MP 1100",
	"gutenprint	NRG MP 1350",
	"gutenprint	NRG MP 1600",
	"gutenprint	NRG MP 161",
	"gutenprint	NRG MP 2000",
	"gutenprint	NRG MP 2500",
	"gutenprint	NRG MP 2510",
	"gutenprint	NRG MP 2550",
	"gutenprint	NRG MP 2550B",
	"gutenprint	NRG MP 3010",
	"gutenprint	NRG MP 3350",
	"gutenprint	NRG MP 3350B",
	"gutenprint	NRG MP 3500",
	"gutenprint	NRG MP 4000",
	"gutenprint	NRG MP 4000B",
	"gutenprint	NRG MP 4500",
	"gutenprint	NRG MP 5000",
	"gutenprint	NRG MP 5000B",
	"gutenprint	NRG MP 5500",
	"gutenprint	NRG MP 6500",
	"gutenprint	NRG MP 7500",
	"gutenprint	NRG MP 9000",
	"gutenprint	Oki B4350",
	"gutenprint	Oki Okipage 10e",
	"gutenprint	Oki Okipage 10ex",
	"gutenprint	Oki Okipage 14ex",
	"gutenprint	Oki Okipage 6e",
	"gutenprint	Oki Okipage 6ex",
	"gutenprint	Oki Okipage 8p",
	"gutenprint	Oki OL400",
	"gutenprint	Oki OL400e",
	"gutenprint	Oki OL400ex",
	"gutenprint	Oki OL410e",
	"gutenprint	Oki OL600e",
	"gutenprint	Oki OL610e S",
	"gutenprint	Oki OL800",
	"gutenprint	Oki OL810ex",
	"gutenprint	Oki Super 6e",
	"gutenprint	Olivetti JP350S",
	"gutenprint	Olivetti PG 306",
	"gutenprint	Olympus P-10",
	"gutenprint	Olympus P-11",
	"gutenprint	Olympus P-200",
	"gutenprint	Olympus P-300",
	"gutenprint	Olympus P-300E",
	"gutenprint	Olympus P-300U",
	"gutenprint	Olympus P-330E",
	"gutenprint	Olympus P-330NE",
	"gutenprint	Olympus P-400",
	"gutenprint	Olympus P-440",
	"gutenprint	Olympus P-S100",
	"gutenprint	Panasonic KX-P4410",
	"gutenprint	Panasonic KX-P4450",
	"gutenprint	Panasonic KX-P6150",
	"gutenprint	Panasonic KX-P6500",
	"gutenprint	PCPI 1030",
	"gutenprint	Raven LP-410",
	"gutenprint	Ricoh Aficio 1022",
	"gutenprint	Ricoh Aficio 1027",
	"gutenprint	Ricoh Aficio 1032",
	"gutenprint	Ricoh Aficio 1035",
	"gutenprint	Ricoh Aficio 1045",
	"gutenprint	Ricoh Aficio 1060",
	"gutenprint	Ricoh Aficio 1075",
	"gutenprint	Ricoh Aficio 1515",
	"gutenprint	Ricoh Aficio 2015",
	"gutenprint	Ricoh Aficio 2016",
	"gutenprint	Ricoh Aficio 2018",
	"gutenprint	Ricoh Aficio 2018D",
	"gutenprint	Ricoh Aficio 2020",
	"gutenprint	Ricoh Aficio 2020D",
	"gutenprint	Ricoh Aficio 2022",
	"gutenprint	Ricoh Aficio 2027",
	"gutenprint	Ricoh Aficio 2032",
	"gutenprint	Ricoh Aficio 2035",
	"gutenprint	Ricoh Aficio 2035e",
	"gutenprint	Ricoh Aficio 2045",
	"gutenprint	Ricoh Aficio 2045e",
	"gutenprint	Ricoh Aficio 2051",
	"gutenprint	Ricoh Aficio 2060",
	"gutenprint	Ricoh Aficio 2075",
	"gutenprint	Ricoh Aficio 2090",
	"gutenprint	Ricoh Aficio 2105",
	"gutenprint	Ricoh Aficio 220",
	"gutenprint	Ricoh Aficio 3025",
	"gutenprint	Ricoh Aficio 3030",
	"gutenprint	Ricoh Aficio 3035",
	"gutenprint	Ricoh Aficio 3045",
	"gutenprint	Ricoh Aficio 401",
	"gutenprint	Ricoh Aficio 700",
	"gutenprint	Ricoh Aficio MP 1100",
	"gutenprint	Ricoh Aficio MP 1350",
	"gutenprint	Ricoh Aficio MP 1600",
	"gutenprint	Ricoh Aficio MP 161",
	"gutenprint	Ricoh Aficio MP 2000",
	"gutenprint	Ricoh Aficio MP 2500",
	"gutenprint	Ricoh Aficio MP 2510",
	"gutenprint	Ricoh Aficio MP 2550",
	"gutenprint	Ricoh Aficio MP 2550B",
	"gutenprint	Ricoh Aficio MP 3010",
	"gutenprint	Ricoh Aficio MP 3350",
	"gutenprint	Ricoh Aficio MP 3350B",
	"gutenprint	Ricoh Aficio MP 3500",
	"gutenprint	Ricoh Aficio MP 4000",
	"gutenprint	Ricoh Aficio MP 4000B",
	"gutenprint	Ricoh Aficio MP 4500",
	"gutenprint	Ricoh Aficio MP 5000",
	"gutenprint	Ricoh Aficio MP 5000B",
	"gutenprint	Ricoh Aficio MP 5500",
	"gutenprint	Ricoh Aficio MP 6500",
	"gutenprint	Ricoh Aficio MP 7500",
	"gutenprint	Ricoh Aficio MP 9000",
	"gutenprint	Samsung ML-1250",
	"gutenprint	Samsung ML-1450",
	"gutenprint	Samsung ML-1450PS",
	"gutenprint	Samsung ML-1650",
	"gutenprint	Samsung ML-1651N",
	"gutenprint	Samsung ML-1750",
	"gutenprint	Samsung ML-2150",
	"gutenprint	Samsung ML-2150PS",
	"gutenprint	Samsung ML-2151N",
	"gutenprint	Samsung ML-2151NPS",
	"gutenprint	Samsung ML-2152W",
	"gutenprint	Samsung ML-2152WPS",
	"gutenprint	Samsung ML-2250",
	"gutenprint	Samsung ML-2550",
	"gutenprint	Samsung ML-2551N",
	"gutenprint	Samsung ML-2552W",
	"gutenprint	Samsung ML-4600",
	"gutenprint	Samsung ML-5000a",
	"gutenprint	Samsung ML-6000",
	"gutenprint	Samsung ML-6100",
	"gutenprint	Samsung ML-7000",
	"gutenprint	Samsung ML-7000N",
	"gutenprint	Samsung ML-7000P",
	"gutenprint	Samsung ML-7050",
	"gutenprint	Samsung ML-7300",
	"gutenprint	Samsung ML-7300N",
	"gutenprint	Samsung ML-85",
	"gutenprint	Samsung QL-5100A",
	"gutenprint	Samsung QL-6050",
	"gutenprint	Savin 2522",
	"gutenprint	Savin 2527",
	"gutenprint	Savin 2532",
	"gutenprint	Savin 2535 2235",
	"gutenprint	Savin 2545 2245",
	"gutenprint	Savin 2560",
	"gutenprint	Savin 2575",
	"gutenprint	Savin 3515",
	"gutenprint	Savin 40105",
	"gutenprint	Savin 4015",
	"gutenprint	Savin 4018",
	"gutenprint	Savin 4018d",
	"gutenprint	Savin 4022",
	"gutenprint	Savin 4027",
	"gutenprint	Savin 4035e 4135eG",
	"gutenprint	Savin 4035 4135g",
	"gutenprint	Savin 4045e 4145eG",
	"gutenprint	Savin 4045 4145g",
	"gutenprint	Savin 4051",
	"gutenprint	Savin 4060",
	"gutenprint	Savin 4075",
	"gutenprint	Savin 4090",
	"gutenprint	Savin 7025",
	"gutenprint	Savin 8016",
	"gutenprint	Savin 8020",
	"gutenprint	Savin 8020d",
	"gutenprint	Savin 8025",
	"gutenprint	Savin 8025e",
	"gutenprint	Savin 8030",
	"gutenprint	Savin 8030e",
	"gutenprint	Savin 8035e",
	"gutenprint	Savin 8035 8035g",
	"gutenprint	Savin 8045e",
	"gutenprint	Savin 8045 8045g",
	"gutenprint	Savin 8055",
	"gutenprint	Savin 8065",
	"gutenprint	Savin 8075",
	"gutenprint	Savin 8090",
	"gutenprint	Savin 8110",
	"gutenprint	Savin 8135",
	"gutenprint	Savin 816",
	"gutenprint	Savin 9016",
	"gutenprint	Savin 9021d",
	"gutenprint	Savin 9025",
	"gutenprint	Savin 9025b",
	"gutenprint	Savin 9033",
	"gutenprint	Savin 9033b",
	"gutenprint	Savin 9040",
	"gutenprint	Savin 9040b",
	"gutenprint	Savin 9050",
	"gutenprint	Savin 9050b",
	"gutenprint	Seiko SpeedJET 200",
	"gutenprint	Sharp AR-161",
	"gutenprint	Sharp AR-M257",
	"gutenprint	Shinko CHC-S9045",
	"gutenprint	Sony DPP-EX5",
	"gutenprint	Sony DPP-EX7",
	"gutenprint	Sony IJP-V100",
	"gutenprint	Sony UP-DP10",
	"gutenprint	Sony UP-DR100",
	"gutenprint	Sony UP-DR150",
	"gutenprint	Star LaserPrinter 8",
	"gutenprint	Star LS-04",
	"gutenprint	Tally MT908",
	"gutenprint	Tektronix Phaser 750DP",
	"gutenprint	Tektronix Phaser 750DX",
	"gutenprint	Tektronix Phaser 750N",
	"gutenprint	Tektronix Phaser 750P",
	"gutenprint	Xerox Able 1406",
	"gutenprint	Xerox Document Centre 400",
	"gutenprint	Xerox DocuPrint 4508",
	"gutenprint	Xerox DocuPrint C20",
	"gutenprint	Xerox DocuPrint N4512",
	"gutenprint	Xerox DocuPrint N4512PS",
	"gutenprint	Xerox DocuPrint P12",
	"gutenprint	Xerox DocuPrint P1202",
	"gutenprint	Xerox DocuPrint P8e",
	"gutenprint	Xerox Phaser 2135",
	"gutenprint	Xerox Phaser 4400B",
	"gutenprint	Xerox Phaser 4400DT",
	"gutenprint	Xerox Phaser 4400DX",
	"gutenprint	Xerox Phaser 4400N",
	"gutenprint	Xerox Phaser 4500B",
	"gutenprint	Xerox Phaser 4500DT",
	"gutenprint	Xerox Phaser 4500DX",
	"gutenprint	Xerox Phaser 4500N",
	"gutenprint	Xerox Phaser 4510B",
	"gutenprint	Xerox Phaser 4510DT",
	"gutenprint	Xerox Phaser 4510DX",
	"gutenprint	Xerox Phaser 4510N",
	"gutenprint	Xerox Phaser 5500B",
	"gutenprint	Xerox Phaser 5500DN",
	"gutenprint	Xerox Phaser 5500DT",
	"gutenprint	Xerox Phaser 5500DX",
	"gutenprint	Xerox Phaser 5500N",
	"gutenprint	Xerox Phaser 6130N",
	"gutenprint	Xerox Phaser 6180DN",
	"gutenprint	Xerox Phaser 6180MFP-D",
	"gutenprint	Xerox Phaser 6200B",
	"gutenprint	Xerox Phaser 6200DP",
	"gutenprint	Xerox Phaser 6200DX",
	"gutenprint	Xerox Phaser 6200N",
	"gutenprint	Xerox Phaser 6250B",
	"gutenprint	Xerox Phaser 6250DP",
	"gutenprint	Xerox Phaser 6250DT",
	"gutenprint	Xerox Phaser 6250DX",
	"gutenprint	Xerox Phaser 6250N",
	"gutenprint	Xerox Phaser 6300DN",
	"gutenprint	Xerox Phaser 6300N",
	"gutenprint	Xerox Phaser 6350DP",
	"gutenprint	Xerox Phaser 6350DT",
	"gutenprint	Xerox Phaser 6350DX",
	"gutenprint	Xerox Phaser 6360DN",
	"gutenprint	Xerox Phaser 6360DX",
	"gutenprint	Xerox Phaser 7300B",
	"gutenprint	Xerox Phaser 7300DN",
	"gutenprint	Xerox Phaser 7300DT",
	"gutenprint	Xerox Phaser 7300DX",
	"gutenprint	Xerox Phaser 7300N",
	"gutenprint	Xerox Phaser 7400DN",
	"gutenprint	Xerox Phaser 7400DT",
	"gutenprint	Xerox Phaser 7400DX",
	"gutenprint	Xerox Phaser 7400DXF",
	"gutenprint	Xerox Phaser 7400N",
	"gutenprint	Xerox Phaser 7700DN",
	"gutenprint	Xerox Phaser 7700DX",
	"gutenprint	Xerox Phaser 7700GX",
	"gutenprint	Xerox Phaser 7750B",
	"gutenprint	Xerox Phaser 7750DN",
	"gutenprint	Xerox Phaser 7750DXF",
	"gutenprint	Xerox Phaser 7750GX",
	"gutenprint	Xerox Phaser 7760DN",
	"gutenprint	Xerox Phaser 7760DX",
	"gutenprint	Xerox Phaser 7760GX",
	"gutenprint	Xerox Phaser 8400B",
	"gutenprint	Xerox Phaser 8400BD",
	"gutenprint	Xerox Phaser 8400DP",
	"gutenprint	Xerox Phaser 8400DX",
	"gutenprint	Xerox Phaser 8400N",
	"gutenprint	Xerox Phaser 8500DN",
	"gutenprint	Xerox Phaser 8500N",
	"gutenprint	Xerox Phaser 8550DP",
	"gutenprint	Xerox Phaser 8550DT",
	"gutenprint	Xerox Phaser 8550DX",
	"gutenprint	Xerox Phaser 8560DN",
	"gutenprint	Xerox WorkCentre 7345",
	"gutenprint	Xerox Work Centre M118"
];
var FOLD = [
	[/엡손/g, "epson"],
	[/캐논/g, "canon"],
	[/브라더/g, "brother"],
	[/삼성/g, "samsung"],
	[/제록스|후지제록스/g, "xerox"],
	[/교세라/g, "kyocera"],
	[/리코/g, "ricoh"],
	[/신도리코|신도/g, "sindoh"],
	[/팬텀/g, "pantum"],
	[/렉스마크/g, "lexmark"],
	[/오키/g, "oki"],
	[/델/g, "dell"],
	[/레이저젯/g, "laserjet"],
	[/에코탱크/g, "ecotank"],
	[/픽스마/g, "pixma"]
];
var BRANDS = [
	"epson",
	"canon",
	"brother",
	"samsung",
	"xerox",
	"hp",
	"kyocera",
	"ricoh",
	"oki",
	"lexmark",
	"dell",
	"apollo",
	"kodak",
	"panasonic",
	"sindoh",
	"pantum"
];
function fold(value) {
	let text = value.toLowerCase();
	for (const [pattern, to] of FOLD) text = text.replace(pattern, to);
	return text;
}
function driverKey(value) {
	return fold(value).replace(/프린터|시리즈|series|printer/g, "").replace(/[^a-z0-9]+/g, "");
}
function codesOf(key) {
	const found = /* @__PURE__ */ new Set();
	const brands = /^(epson|canon|brother|samsung|xerox|kyocera|ricoh|lexmark|pantum|sindoh|dell|oki|hp|apollo)$/;
	for (const match of key.matchAll(/([a-z]{0,8})(\d{2,5})([a-z]{0,3})/g)) {
		const letters = match[1] || "";
		const digits = match[2];
		const tail = match[3] || "";
		if (!letters && /^(19|20)\d{2}$/.test(digits)) continue;
		const full = `${letters}${digits}${tail}`;
		if (full.length >= 4) found.add(full);
		if (letters.length > 1 && brands.test(letters.slice(0, -1))) {
			const short = `${letters.slice(-1)}${digits}${tail}`;
			if (short.length >= 5) found.add(short);
		}
	}
	return [...found];
}
function stemOf(key) {
	const tagged = key.match(/(et|xp|wf|sx|hl|ml|mfc|dcp|mg|mx|ts|tr|clp|scx|clx|fs|bp|ql|lbp|ip|gx|tm|zd)\d/);
	if (tagged) return tagged[1];
	if (/(^|epson)l\d{3,4}/.test(key)) return "l";
	if (/(^|canon)g\d{3,4}/.test(key)) return "g";
	return "";
}
function agrees(queryKey, rowKey) {
	const stem = stemOf(queryKey);
	if (!stem) return true;
	if (stem === "l") return /(^|epson)l\d{3,4}/.test(rowKey);
	if (stem === "g") return /(^|canon|pixma)g\d{3,4}/.test(rowKey);
	return rowKey.includes(stem);
}
var ROWS = [];
var BY_KEY = /* @__PURE__ */ new Map();
var BY_CODE = /* @__PURE__ */ new Map();
for (const line of DRIVER_ROWS) {
	const [family, name, extra] = line.split("	");
	const names = [name, ...extra ? extra.split("|") : []];
	for (const label of names) {
		const key = driverKey(label);
		if (key.length < 5 || BY_KEY.has(key)) continue;
		const row = {
			key,
			name,
			family,
			codes: codesOf(key)
		};
		ROWS.push(row);
		BY_KEY.set(key, row);
		for (const code of row.codes) {
			const list = BY_CODE.get(code);
			if (list) list.push(row);
			else BY_CODE.set(code, [row]);
		}
	}
}
function brandIn(key) {
	return BRANDS.find((brand) => key.includes(brand)) || "";
}
function pickClosest(queryKey, rows) {
	const brand = brandIn(queryKey);
	const branded = brand ? rows.filter((row) => row.key.includes(brand)) : rows;
	return (branded.length ? branded : rows).slice().sort((a, b) => Math.abs(a.key.length - queryKey.length) - Math.abs(b.key.length - queryKey.length))[0];
}
function lookupDriver(input) {
	const mdl = /(?:MDL|MODEL):([^;]+)/i.exec(input);
	const mfg = /(?:MFG|MANUFACTURER):([^;]+)/i.exec(input);
	const key = driverKey(mdl ? `${mfg ? mfg[1] : ""} ${mdl[1]}`.trim() : input);
	if (!/\d/.test(key) || key.length < 4) return null;
	const exact = BY_KEY.get(key);
	if (exact) return {
		name: exact.name,
		family: exact.family,
		exact: true
	};
	let best = null;
	for (const row of ROWS) {
		if (row.key.length < 5) continue;
		if (!((key.includes(row.key) || row.key.includes(key) && key.length >= 6) && agrees(key, row.key))) continue;
		if (!best || Math.abs(row.key.length - key.length) < Math.abs(best.key.length - key.length)) best = row;
	}
	if (best) return {
		name: best.name,
		family: best.family,
		exact: best.key === key
	};
	const codes = codesOf(key).sort((a, b) => b.length - a.length);
	for (const code of codes) {
		if (code.length < 5) continue;
		const rows = (BY_CODE.get(code) || []).filter((row) => row.codes.includes(code) && agrees(key, row.key));
		if (!rows.length) continue;
		const chosen = pickClosest(key, rows);
		return {
			name: chosen.name,
			family: chosen.family,
			exact: false
		};
	}
	return null;
}
var FAMILY_LABEL = {
	escpr: "ESC/P-R",
	hplip: "HPLIP",
	splix: "SpliX",
	gutenprint: "Gutenprint"
};
function familyLabel(family) {
	return FAMILY_LABEL[family];
}
function matchQuery(input, options) {
	const cmd = options?.cmd?.trim() || "";
	const base = Atlas.match(input, cmd);
	const hit = lookupDriver(input);
	if (!hit) return base;
	if (base.kind === "list") return base;
	if (base.kind === "match" && base.source === "catalog" && base.confidence >= 88) return base;
	if (cmd && !hit.exact) return base;
	return fromDriver(input, hit);
}
function fromDriver(input, hit) {
	const packs = Atlas.PACKS;
	const generations = Atlas.GENERATIONS;
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
			family: profile.family
		},
		generation,
		pack,
		fallback: profile.fallback ? packs[profile.fallback] : null,
		alternatives: [],
		log: [{
			step: "목록",
			detail: `${familyLabel(hit.family)} 드라이버 목록에서 ${hit.name} 을 찾았습니다.`
		}, {
			step: "팩",
			detail: `${pack.name} 으로 맞춥니다.`
		}]
	};
}
function profileFor(name, family) {
	const n = name.toLowerCase();
	const connections = /\b(w|dw|dn|nw)\b|wifi|wi-fi|wireless|series/.test(n) ? ["wifi", "usb"] : ["usb"];
	const color = /color|colour|clp|clx|pixma|stylus|deskjet|officejet|envy|artisan|workforce|ecotank/.test(n);
	if (/\blq-|\blx-|\bfx-|\bplq-|\bdlq-/.test(n)) return {
		pack: "page-lang",
		generation: "classic",
		languages: ["ESC/P"],
		color: false,
		duplex: false,
		airprint: false,
		connections: ["usb"],
		year: 2004,
		family: "dot",
		fallback: "",
		reason: `${name}은 도트 매트릭스입니다. ESC/P 문자로 찍습니다.`
	};
	if (family === "escpr") return {
		pack: "raster-ink",
		generation: "transitional",
		languages: ["ESC/P-R"],
		color: true,
		duplex: false,
		airprint: false,
		connections,
		year: 2014,
		family: "escpr",
		fallback: "",
		reason: `${name}은 ESC/P-R 목록에 있습니다. 잉크 래스터로 맞추고, 표준 인쇄가 되면 그 경로를 씁니다.`
	};
	if (family === "splix") return {
		pack: "legacy-host",
		generation: "legacy",
		languages: ["SPL"],
		color,
		duplex: false,
		airprint: false,
		connections,
		year: 2009,
		family: "spl",
		fallback: "",
		reason: `${name}은 SpliX 목록입니다. 컴퓨터가 점을 만들어 보내는 SPL 기종이라 휴대폰 인쇄창만으로는 부족합니다.`
	};
	if (family === "hplip") {
		const host = /1020|1018|1005|1006|1007|1008|1102|1505|1606/.test(n);
		const laser = /laserjet|laser|mfp|pagewide/.test(n);
		if (host) return {
			pack: "legacy-host",
			generation: "legacy",
			languages: ["호스트 기반"],
			color: false,
			duplex: false,
			airprint: false,
			connections,
			year: 2007,
			family: "host-laser",
			fallback: "",
			reason: `${name}은 HPLIP 목록의 호스트 기반 레이저입니다. 점을 PC가 만들어야 합니다.`
		};
		if (laser) {
			const modern = /m404|m428|m479|m454|e4|m28[0-9]/.test(n);
			return {
				pack: modern ? "driverless" : "page-lang",
				generation: modern ? "modern" : "classic",
				languages: modern ? ["AirPrint", "PCL"] : ["PCL"],
				color,
				duplex: /dn|dw|duplex/.test(n),
				airprint: modern,
				connections: ["wifi", "usb"],
				year: modern ? 2019 : 2012,
				family: "pcl-laser",
				fallback: modern ? "page-lang" : "",
				reason: modern ? `${name}은 HPLIP 목록의 신형 레이저입니다. 표준 티켓을 먼저, 거절되면 PCL입니다.` : `${name}은 HPLIP 목록의 레이저입니다. PCL로 맞춥니다.`
			};
		}
		return {
			pack: "raster-ink",
			generation: "transitional",
			languages: ["HP 래스터"],
			color: true,
			duplex: false,
			airprint: false,
			connections,
			year: 2013,
			family: "hplip",
			fallback: "",
			reason: `${name}은 HPLIP 잉크 목록입니다. 래스터로 맞춥니다.`
		};
	}
	if (/kyocera|ricoh|oki|lexmark|phaser|laserjet|brother hl/.test(n)) return {
		pack: "page-lang",
		generation: "classic",
		languages: ["PCL"],
		color,
		duplex: /dn|duplex/.test(n),
		airprint: false,
		connections: ["wifi", "usb"],
		year: 2011,
		family: "pcl-laser",
		fallback: "",
		reason: `${name}은 Gutenprint 사무 기종 목록입니다. PCL로 맞춥니다.`
	};
	return {
		pack: "raster-ink",
		generation: "classic",
		languages: ["Gutenprint"],
		color: true,
		duplex: false,
		airprint: false,
		connections,
		year: 2008,
		family: "gutenprint",
		fallback: "",
		reason: `${name}은 Gutenprint 목록의 잉크젯입니다. 래스터로 맞춥니다.`
	};
}
var VENDORS = {
	1008: "HP",
	1193: "Canon",
	1208: "Epson",
	1273: "Brother",
	1256: "Samsung",
	2340: "Xerox",
	2655: "Zebra",
	1242: "Panasonic",
	1317: "Netchip",
	6790: "QinHeng",
	1155: "STMicro",
	1046: "Winbond",
	4070: "ICS",
	10473: "GigaDevice",
	1154: "Kyocera",
	1482: "Ricoh",
	1724: "OKI",
	1085: "Lexmark",
	1245: "Sharp",
	4907: "Konica",
	1305: "Star",
	5380: "Bixolon",
	4611: "TSC",
	1227: "Fujifilm",
	16700: "Dell",
	1659: "Prolific",
	3540: "Custom",
	2214: "SII"
};
function usbApi() {
	return navigator.usb;
}
function vendorName(vendorId, manufacturer) {
	return VENDORS[vendorId] || manufacturer || "USB";
}
function labelUsb(device) {
	const brand = vendorName(device.vendorId, device.manufacturerName);
	const product = (device.productName || "").replace(/\s+/g, " ").trim();
	const generic = /usb printing support|printer|usb device/i.test(product);
	const query = [brand, generic ? "" : product].filter(Boolean).join(" ");
	return {
		title: generic || !product ? `${brand} USB 복사기` : product,
		query,
		subtitle: `USB · ${brand}`
	};
}
async function grantedUsb() {
	const usb = usbApi();
	if (!usb?.getDevices) return [];
	try {
		return await usb.getDevices();
	} catch {
		return [];
	}
}
async function pickUsb(all = false) {
	const usb = usbApi();
	if (!usb?.requestDevice) throw new Error("여기서는 USB 창이 안 열려요. 컴퓨터나 안드로이드 크롬에서 열어 주세요.");
	const filters = all ? [] : [
		{ classCode: 7 },
		{ classCode: 255 },
		...Object.keys(VENDORS).map((id) => ({ vendorId: Number(id) }))
	];
	return usb.requestDevice({ filters });
}
var sessions = /* @__PURE__ */ new Map();
var objectIds = /* @__PURE__ */ new WeakMap();
var nextObjectId = 1;
function usbKeyOf(device) {
	const id = `${device.vendorId.toString(16)}:${device.productId.toString(16)}`;
	const serial = (device.serialNumber || "").trim();
	if (serial) return `${id}:${serial}`;
	let token = objectIds.get(device);
	if (!token) {
		token = nextObjectId;
		nextObjectId += 1;
		objectIds.set(device, token);
	}
	return `${id}:obj${token}`;
}
function modelFromIdentity(identity) {
	const field = (names) => identity.match(new RegExp(`(?:^|[;\\n])\\s*(?:${names})\\s*:\\s*([^;\\n]+)`, "i"))?.[1]?.trim() || "";
	const mfg = field("MFG|MANUFACTURER");
	const mdl = field("MDL|MODEL");
	return {
		mfg,
		mdl,
		cmd: field("CMD|COMMAND SET"),
		query: Boolean(mfg && mdl && mdl.toLowerCase().startsWith(mfg.toLowerCase())) ? mdl : [mfg, mdl].filter(Boolean).join(" ")
	};
}
function decodeIdentity(data) {
	if (data.byteLength < 3) return "";
	const raw = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
	const score = (value) => {
		let n = 0;
		if (/MFG:|MDL:|MODEL:|MANUFACTURER:/i.test(value)) n += 5;
		if (value.includes(";")) n += 2;
		return n;
	};
	const sliceText = (length) => {
		const count = Math.min(raw.length - 2, Math.max(0, length - 2));
		return new TextDecoder("utf-8", { fatal: false }).decode(raw.slice(2, 2 + count));
	};
	const be = data.getUint16(0, false);
	const le = data.getUint8(0) | data.getUint8(1) << 8;
	const options = [
		sliceText(be),
		sliceText(le),
		new TextDecoder("utf-8", { fatal: false }).decode(raw)
	];
	options.sort((a, b) => score(b) - score(a));
	return tidyIdentity(options[0] || "");
}
function tidyIdentity(value) {
	const text = value.replace(/\0/g, "").trim();
	const at = text.search(/MFG:|MANUFACTURER:|MDL:|MODEL:/i);
	return (at > 0 ? text.slice(at) : text).trim();
}
function printerChannel(interfaces) {
	const found = [];
	for (const iface of interfaces) for (const alt of iface.alternates) {
		const protocol = alt.interfaceProtocol ?? 0;
		if (alt.interfaceClass !== 7 || protocol !== 2 && protocol !== 1) continue;
		if (!alt.endpoints.some((endpoint) => endpoint.direction === "out")) continue;
		found.push({
			iface,
			alt,
			protocol
		});
	}
	found.sort((a, b) => a.protocol - b.protocol);
	return found.find((item) => item.protocol === 2) || found.find((item) => item.protocol === 1) || null;
}
async function readDeviceId(device) {
	if (!device.open || !device.claimInterface || !device.controlTransferIn) return {
		id: "",
		out: void 0,
		iface: void 0
	};
	if (!device.opened) await device.open();
	if (!device.configuration && device.selectConfiguration) {
		const value = device.configurations?.[0]?.configurationValue ?? 1;
		await device.selectConfiguration(value);
	}
	const picked = printerChannel(device.configuration?.interfaces || []);
	if (!picked) {
		try {
			if (device.opened && device.close) await device.close();
		} catch {}
		return {
			id: "",
			out: void 0,
			iface: void 0
		};
	}
	const iface = picked.iface;
	const alt = picked.alt;
	try {
		await device.claimInterface(iface.interfaceNumber);
	} catch {
		try {
			if (device.opened && device.close) await device.close();
		} catch {}
		throw new Error("다른 앱이나 OS 드라이버가 USB를 사용 중이라 이 앱에서 바로 보낼 수 없어요. 인쇄 창으로 진행해 주세요.");
	}
	const setting = alt.alternateSetting ?? 0;
	if (device.selectAlternateInterface && setting !== 0) try {
		await device.selectAlternateInterface(iface.interfaceNumber, setting);
	} catch {}
	const out = alt.endpoints.find((endpoint) => endpoint.direction === "out" && (endpoint.type === "bulk" || endpoint.type === "interrupt")) || alt.endpoints.find((endpoint) => endpoint.direction === "out");
	let id = "";
	const indexes = [iface.interfaceNumber << 8 | setting & 255, iface.interfaceNumber];
	for (const index of indexes) try {
		const result = await device.controlTransferIn({
			requestType: "class",
			recipient: "interface",
			request: 0,
			value: 0,
			index
		}, 1024);
		if (result?.data) {
			const text = decodeIdentity(result.data);
			if (text) {
				id = text;
				break;
			}
		}
	} catch {}
	return {
		id,
		out: out?.endpointNumber,
		iface: iface.interfaceNumber
	};
}
async function identifyUsb(device) {
	const label = labelUsb(device);
	const key = usbKeyOf(device);
	const session = device;
	try {
		const read = await readDeviceId(session);
		const held = session;
		held.atlasOut = read.out;
		held.atlasIface = read.iface;
		if (read.out != null) sessions.set(key, held);
		const identity = read.id;
		const parsed = modelFromIdentity(identity);
		return {
			title: parsed.mdl ? parsed.query : label.title,
			query: parsed.query || label.query,
			cmd: parsed.cmd,
			subtitle: identity ? "USB로 연결됨" : read.out != null ? "USB로 연결됨" : label.subtitle,
			usbKey: key,
			live: read.out != null
		};
	} catch (error) {
		try {
			if (session.opened && session.close) await session.close();
		} catch {}
		sessions.delete(key);
		if (error instanceof Error && error.message.includes("USB를 사용 중")) throw error;
		return {
			title: label.title,
			query: label.query,
			cmd: "",
			subtitle: label.subtitle,
			usbKey: key,
			live: false
		};
	}
}
async function dropUsbSession(usbKey) {
	const device = sessions.get(usbKey);
	sessions.delete(usbKey);
	if (!device) return;
	try {
		if (device.clearHalt && device.atlasOut != null) await device.clearHalt("out", device.atlasOut);
	} catch {}
	try {
		if (device.releaseInterface && device.atlasIface != null) await device.releaseInterface(device.atlasIface);
	} catch {}
	try {
		await device.close?.();
	} catch {}
}
function watchUsbDisconnect(onKey) {
	const usb = usbApi();
	if (!usb?.addEventListener || !usb.removeEventListener) return () => void 0;
	const listener = (event) => {
		const device = event.device;
		if (!device) return;
		const key = usbKeyOf(device);
		dropUsbSession(key);
		onKey(key);
	};
	usb.addEventListener("disconnect", listener);
	return () => usb.removeEventListener?.("disconnect", listener);
}
function watchUsbConnect(onDevice) {
	const usb = usbApi();
	if (!usb?.addEventListener || !usb.removeEventListener) return () => void 0;
	const listener = (event) => {
		const device = event.device;
		if (device) onDevice(device);
	};
	usb.addEventListener("connect", listener);
	return () => usb.removeEventListener?.("connect", listener);
}
async function transferChunk(device, endpoint, bytes) {
	let view = bytes;
	let stalls = 0;
	while (view.byteLength) {
		const slice = view;
		const payload = new ArrayBuffer(slice.byteLength);
		new Uint8Array(payload).set(slice);
		let result;
		try {
			result = await Promise.race([device.transferOut(endpoint, payload), new Promise((_, reject) => {
				setTimeout(() => reject(/* @__PURE__ */ new Error("복사기가 15초 안에 받지 않았어요. 용지가 없거나 걸린 것 같아요.")), 15e3);
			})]);
		} catch (error) {
			await dropUsbSession(usbKeyOf(device));
			throw error instanceof Error ? error : /* @__PURE__ */ new Error("복사기가 15초 안에 받지 않았어요. 용지가 없거나 걸린 것 같아요.");
		}
		if (result?.status === "stall") {
			stalls += 1;
			if (stalls > 3 || !device.clearHalt) {
				await dropUsbSession(usbKeyOf(device));
				throw new Error("복사기가 데이터를 거절했어요. USB 연결을 닫았어요.");
			}
			try {
				await device.clearHalt("out", endpoint);
			} catch {
				await dropUsbSession(usbKeyOf(device));
				throw new Error("복사기가 데이터를 거절했어요. USB 연결을 닫았어요.");
			}
			continue;
		}
		if (result?.status && result.status !== "ok") {
			await dropUsbSession(usbKeyOf(device));
			throw new Error("프린터가 데이터를 거절했어요. USB 연결을 닫았어요.");
		}
		const wrote = typeof result?.bytesWritten === "number" ? result.bytesWritten : slice.byteLength;
		if (wrote <= 0) {
			await dropUsbSession(usbKeyOf(device));
			throw new Error("프린터가 데이터를 거절했어요. USB 연결을 닫았어요.");
		}
		view = view.subarray(Math.min(wrote, view.byteLength));
		stalls = 0;
	}
}
async function sendUsbBytes(usbKey, bytes, onProgress, shouldStop, atomic = false) {
	const device = sessions.get(usbKey);
	if (!device?.transferOut || device.atlasOut == null) throw new Error("USB로 바로 넣지는 못해요. 인쇄 창에서 복사기를 고르세요.");
	const total = Math.max(1, bytes.length);
	let sent = 0;
	const pieces = atomic || bytes.length <= 4096 ? [bytes] : Array.from({ length: Math.ceil(bytes.length / 4096) }, (_, index) => bytes.subarray(index * 4096, Math.min(bytes.length, (index + 1) * 4096)));
	for (const piece of pieces) {
		if (shouldStop?.()) throw new Error("보내기를 멈췄어요.");
		await transferChunk(device, device.atlasOut, piece);
		sent += piece.byteLength;
		onProgress?.(Math.min(100, Math.round(sent / total * 100)));
	}
}
var PAPER = {
	A4: {
		mm: [210, 297],
		pcl: 26,
		pjl: "A4",
		pt: [595.28, 841.89]
	},
	A3: {
		mm: [297, 420],
		pcl: 27,
		pjl: "A3",
		pt: [841.89, 1190.55]
	},
	B5: {
		mm: [182, 257],
		pcl: 45,
		pjl: "JISB5",
		pt: [515.91, 728.5]
	}
};
var encoder = new TextEncoder();
function paperPoints(paper) {
	const spec = PAPER[paper === "A3" || paper === "B5" ? paper : "A4"];
	return {
		width: spec.pt[0],
		height: spec.pt[1]
	};
}
function rasterSize(paper) {
	const [mmW, mmH] = PAPER[paper].mm;
	const raw = Math.round(mmW / 25.4 * 300);
	return {
		width: Math.ceil(raw / 8) * 8,
		height: Math.round(mmH / 25.4 * 300)
	};
}
function printableSize(paper) {
	if (paper === "A3") return {
		width: 3368,
		height: 4817
	};
	if (paper === "B5") return {
		width: 2008,
		height: 2891
	};
	return {
		width: 2336,
		height: 3364
	};
}
function previewSize(paper) {
	const full = rasterSize(paper === "A3" || paper === "B5" ? paper : "A4");
	const width = 620;
	return {
		width,
		height: Math.max(1, Math.round(full.height / full.width * width))
	};
}
function concat$1(parts) {
	const size = parts.reduce((sum, part) => sum + part.length, 0);
	const out = new Uint8Array(size);
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}
function pjl(options) {
	const count = Math.min(9, Math.max(1, options.copies));
	const lines = ["\x1B%-12345X@PJL JOB", options.pages > 1 ? `@PJL SET QTY=${count}` : `@PJL SET COPIES=${count}`];
	if (options.paper !== "B5") lines.push(`@PJL SET PAPER=${PAPER[options.paper].pjl}`);
	if (options.duplex === "simplex") lines.push("@PJL SET DUPLEX=OFF");
	else {
		lines.push("@PJL SET DUPLEX=ON");
		lines.push(`@PJL SET BINDING=${options.duplex === "long" ? "LONGEDGE" : "SHORTEDGE"}`);
	}
	lines.push(`@PJL ENTER LANGUAGE=${options.language}`);
	return `${lines.join("\r\n")}\r\n`;
}
function wrapPdfJob(pdf, options) {
	return concat$1([
		encoder.encode(pjl({
			...options,
			language: "PDF"
		})),
		pdf,
		encoder.encode("\r\n\x1B%-12345X@PJL EOJ\r\n\x1B%-12345X")
	]);
}
function printPixelSize(paper) {
	if (paper === "A3") return {
		width: 1754,
		height: 2480
	};
	if (paper === "B5") return {
		width: 1075,
		height: 1518
	};
	return {
		width: 1240,
		height: 1754
	};
}
function osRasterSize(paper, pageCount) {
	const base = printPixelSize(paper);
	if (pageCount <= 30) return base;
	const scale = pageCount > 60 ? .5 : .72;
	return {
		width: Math.max(620, Math.round(base.width * scale)),
		height: Math.max(877, Math.round(base.height * scale))
	};
}
function wrapMeasuredLines(text, measure, maxWidth) {
	const lines = [];
	for (const paragraph of text.split("\n")) {
		let line = "";
		if (!paragraph) {
			lines.push("");
			continue;
		}
		for (const ch of paragraph) {
			const next = line + ch;
			if (line && measure(next) > maxWidth) {
				lines.push(line);
				line = ch.trim() ? ch : "";
			} else line = next;
		}
		lines.push(line);
	}
	return lines.length ? lines : [""];
}
function paginateLines(lines, linesPerPage) {
	const size = Math.max(1, Math.floor(linesPerPage) || 1);
	const pages = [];
	for (let index = 0; index < Math.max(1, lines.length); index += size) pages.push(lines.slice(index, index + size).join("\n"));
	return pages.length ? pages : [""];
}
function officeMemoChunks(text, width, height) {
	const ctx = document.createElement("canvas").getContext("2d");
	const font = Math.max(18, Math.round(width / 28));
	if (!ctx) return [text];
	ctx.font = `${font}px "IBM Plex Sans KR", sans-serif`;
	return paginateLines(wrapMeasuredLines(text, (value) => ctx.measureText(value).width, Math.max(40, width - font * 2)), Math.max(1, Math.floor((height - font * 2) / (font * 1.4))));
}
function pclJobHeader(options) {
	const spec = PAPER[options.paper];
	const side = options.duplex === "long" ? 1 : options.duplex === "short" ? 2 : 0;
	return encoder.encode(`${pjl({
		...options,
		language: "PCL"
	})}\x1bE\x1b&l${spec.pcl}A\x1b&l0O\x1b&l${side}S\x1b&u300D\x1b&l0E\x1b&l0L\x1b&a0L\x1b*t300R\x1b*r0F`);
}
function pclJobFooter() {
	return encoder.encode("\x1BE\x1B%-12345X@PJL EOJ\r\n\x1B%-12345X");
}
function pclAbortFooter() {
	return encoder.encode("\x1B*rC\x1BE\x1B%-12345X@PJL EOJ\r\n\x1B%-12345X");
}
function needsBlankBack(pageCount, duplex) {
	return duplex !== "simplex" && pageCount % 2 === 1;
}
function packBits(row) {
	const out = [];
	let index = 0;
	while (index < row.length) {
		let run = 1;
		while (index + run < row.length && row[index + run] === row[index] && run < 128) run += 1;
		if (run >= 2) {
			out.push(1 - run & 255, row[index]);
			index += run;
			continue;
		}
		const start = index;
		index += 1;
		while (index < row.length && index - start < 128) {
			if (index + 1 < row.length && row[index] === row[index + 1]) break;
			index += 1;
		}
		const length = index - start;
		out.push(length - 1);
		for (let cursor = 0; cursor < length; cursor += 1) out.push(row[start + cursor]);
	}
	return Uint8Array.from(out);
}
function monoFromLuma(luma, width, height, mode) {
	const count = width * height;
	const mono = new Uint8Array(count);
	if (mode === "threshold") {
		for (let index = 0; index < count; index += 1) mono[index] = luma[index] < 175 ? 1 : 0;
		return mono;
	}
	const gray = new Float32Array(luma);
	for (let index = 0; index < count; index += 1) if (gray[index] >= 240) gray[index] = 255;
	else if (gray[index] <= 40) gray[index] = 0;
	for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
		const index = y * width + x;
		const old = gray[index];
		const next = old < 128 ? 0 : 255;
		const error = old - next;
		gray[index] = next;
		if (x + 1 < width) gray[index + 1] += error * 7 / 16;
		if (y + 1 < height) {
			if (x > 0) gray[index + width - 1] += error * 3 / 16;
			gray[index + width] += error * 5 / 16;
			if (x + 1 < width) gray[index + width + 1] += error / 16;
		}
	}
	for (let index = 0; index < count; index += 1) mono[index] = gray[index] < 128 ? 1 : 0;
	return mono;
}
function pclPageCommands(mono, width, height) {
	const dots = mono.slice();
	let marked = false;
	for (let index = 0; index < dots.length; index += 1) if (dots[index]) {
		marked = true;
		break;
	}
	if (!marked && width > 0 && height > 0) dots[dots.length - 1] = 1;
	const bytesPerRow = Math.ceil(width / 8);
	const commands = [encoder.encode(`\x1b*p0x72Y\x1b*r${width}S\x1b*r${height}T\x1b*r1A\x1b*b2M`)];
	let skip = 0;
	const flushSkip = () => {
		if (skip < 1) return;
		commands.push(encoder.encode(`\x1b*b${skip}Y`));
		skip = 0;
	};
	for (let y = 0; y < height; y += 1) {
		const packed = new Uint8Array(bytesPerRow);
		let ink = false;
		for (let x = 0; x < width; x += 1) {
			if (!dots[y * width + x]) continue;
			packed[x >> 3] |= 128 >> (x & 7);
			ink = true;
		}
		if (!ink) {
			skip += 1;
			continue;
		}
		flushSkip();
		let end = packed.length;
		while (end > 0 && packed[end - 1] === 0) end -= 1;
		const compressed = packBits(packed.subarray(0, end));
		const prefix = encoder.encode(`\x1b*b${compressed.length}W`);
		const line = new Uint8Array(prefix.length + compressed.length);
		line.set(prefix, 0);
		line.set(compressed, prefix.length);
		commands.push(line);
	}
	flushSkip();
	commands.push(encoder.encode("\x1B*rC\f"));
	return commands;
}
function bundleCommands(commands, limit = 4096) {
	const packets = [];
	let bucket = [];
	let size = 0;
	const flush = () => {
		if (!bucket.length) return;
		packets.push(concat$1(bucket));
		bucket = [];
		size = 0;
	};
	for (const command of commands) {
		if (size > 0 && size + command.length > limit) flush();
		bucket.push(command);
		size += command.length;
		if (size >= limit) flush();
	}
	flush();
	return packets;
}
function commandsFromCanvas(canvas, mode) {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx || canvas.width < 8 || canvas.height < 8) return [encoder.encode("\x1B*p0x72Y\x1B*r0S\x1B*r0T\x1B*r1A\x1B*b2M\x1B*rC\f")];
	const width = canvas.width & -8;
	const height = canvas.height;
	const image = ctx.getImageData(0, 0, width, height);
	const luma = new Float32Array(width * height);
	for (let index = 0; index < luma.length; index += 1) {
		const offset = index * 4;
		luma[index] = image.data[offset] * .3 + image.data[offset + 1] * .59 + image.data[offset + 2] * .11;
	}
	return pclPageCommands(monoFromLuma(luma, width, height, mode), width, height);
}
function canvasPclCommands(canvas, mode) {
	return commandsFromCanvas(canvas, mode);
}
function drawOfficePage(canvas, options) {
	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;
	ctx.filter = "none";
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#1a2744";
	if (options.gray) ctx.filter = "grayscale(1)";
	if (options.image) {
		drawFittedLocal(ctx, options.image, canvas.width, canvas.height, options.fit || "contain", options.turn || 0);
		ctx.filter = "none";
		return canvas;
	}
	const text = options.kind === "memo" ? options.note : options.kind === "test" ? `${options.title}\n${options.note}` : options.note;
	const font = Math.max(18, Math.round(canvas.width / 28));
	ctx.font = `${font}px "IBM Plex Sans KR", sans-serif`;
	let line = "";
	let y = font * 2;
	const maxWidth = canvas.width - font * 2;
	for (const paragraph of text.split("\n")) {
		for (const ch of paragraph) {
			const next = line + ch;
			if (line && ctx.measureText(next).width > maxWidth) {
				ctx.fillText(line, font, y);
				y += font * 1.4;
				line = ch.trim() ? ch : "";
			} else line = next;
		}
		if (line) {
			ctx.fillText(line, font, y);
			y += font * 1.4;
			line = "";
		}
	}
	ctx.filter = "none";
	return canvas;
}
function drawFittedLocal(ctx, image, width, height, fit, turn) {
	const turns = (turn % 360 + 360) % 360;
	const swap = turns === 90 || turns === 270;
	const sourceWidth = Math.max(1, "width" in image ? Number(image.width) : width);
	const sourceHeight = Math.max(1, "height" in image ? Number(image.height) : height);
	const boxW = swap ? sourceHeight : sourceWidth;
	const boxH = swap ? sourceWidth : sourceHeight;
	const scale = fit === "cover" ? Math.max(width / boxW, height / boxH) : Math.min(width / boxW, height / boxH);
	ctx.save();
	ctx.beginPath();
	ctx.rect(0, 0, width, height);
	ctx.clip();
	ctx.translate(width / 2, height / 2);
	ctx.rotate(turns * Math.PI / 180);
	ctx.drawImage(image, -sourceWidth * scale / 2, -sourceHeight * scale / 2, sourceWidth * scale, sourceHeight * scale);
	ctx.restore();
}
function concat(parts) {
	const size = parts.reduce((sum, part) => sum + part.length, 0);
	const out = new Uint8Array(size);
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}
function grayCanvas(canvas) {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx || canvas.width < 1 || canvas.height < 1) return canvas;
	const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = image.data;
	for (let index = 0; index < data.length; index += 4) {
		const lum = data[index] * .3 + data[index + 1] * .59 + data[index + 2] * .11;
		const value = lum < 0 ? 0 : lum > 255 ? 255 : lum;
		data[index] = value;
		data[index + 1] = value;
		data[index + 2] = value;
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}
function jpegToPdf(jpeg, imgW, imgH, pageW, pageH) {
	const enc = new TextEncoder();
	const chunks = [];
	const offsets = [
		0,
		0,
		0,
		0,
		0,
		0
	];
	let length = 0;
	const pushText = (text) => {
		const data = enc.encode(text);
		chunks.push(data);
		length += data.length;
	};
	const push = (data) => {
		chunks.push(data);
		length += data.length;
	};
	pushText("%PDF-1.4\n");
	offsets[1] = length;
	pushText("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
	offsets[2] = length;
	pushText("2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n");
	offsets[3] = length;
	pushText(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>\nendobj\n`);
	const content = `q ${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm /Im0 Do Q\n`;
	offsets[4] = length;
	pushText(`4 0 obj\n<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`);
	offsets[5] = length;
	pushText(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
	push(jpeg);
	pushText("\nendstream\nendobj\n");
	const xrefAt = length;
	let xref = "xref\n0 6\n0000000000 65535 f \n";
	for (let index = 1; index <= 5; index += 1) xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
	pushText(`${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`);
	return concat(chunks);
}
async function downloadCanvasPdf(canvas, filename, page) {
	const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .86));
	if (!blob) throw new Error("PDF로 만들지 못했어요.");
	const bytes = jpegToPdf(new Uint8Array(await blob.arrayBuffer()), canvas.width, canvas.height, page.width, page.height);
	const file = new Blob([bytes], { type: "application/pdf" });
	const url = URL.createObjectURL(file);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
	link.click();
	URL.revokeObjectURL(url);
}
function drawFitted(ctx, image, width, height, fit, turn) {
	const turns = (turn % 360 + 360) % 360;
	const swap = turns === 90 || turns === 270;
	const sourceWidth = Math.max(1, "width" in image ? Number(image.width) : width);
	const sourceHeight = Math.max(1, "height" in image ? Number(image.height) : height);
	const boxW = swap ? sourceHeight : sourceWidth;
	const boxH = swap ? sourceWidth : sourceHeight;
	const scale = fit === "cover" ? Math.max(width / boxW, height / boxH) : Math.min(width / boxW, height / boxH);
	ctx.save();
	ctx.beginPath();
	ctx.rect(0, 0, width, height);
	ctx.clip();
	ctx.translate(width / 2, height / 2);
	ctx.rotate(turns * Math.PI / 180);
	ctx.drawImage(image, -sourceWidth * scale / 2, -sourceHeight * scale / 2, sourceWidth * scale, sourceHeight * scale);
	ctx.restore();
}
async function renderSheetCanvas(options) {
	const size = options.paper === "A3" ? [1754, 2480] : options.paper === "B5" ? [1075, 1518] : options.paper === "Letter" ? [1275, 1650] : [1240, 1754];
	const width = size[0];
	const height = size[1];
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = "#1a2744";
	if (options.gray) ctx.filter = "grayscale(1)";
	if (options.kind === "photo" && options.image) {
		drawFitted(ctx, options.image, width, height, options.fit || "contain", options.turn || 0);
		return canvas;
	}
	const text = options.kind === "memo" ? options.note : `${options.title}\n${options.note}`;
	ctx.font = "48px \"IBM Plex Sans KR\", sans-serif";
	let line = "";
	let y = 120;
	const maxWidth = width - 160;
	for (const paragraph of text.split("\n")) {
		for (const ch of paragraph) {
			const next = line + ch;
			if (line && ctx.measureText(next).width > maxWidth) {
				ctx.fillText(line, 80, y);
				y += 68;
				line = ch.trim() ? ch : "";
			} else line = next;
		}
		if (line) {
			ctx.fillText(line, 80, y);
			y += 68;
			line = "";
		}
		if (options.kind !== "memo") y += 16;
	}
	return canvas;
}
function sheetMemoChunks(text, paper) {
	const width = paper === "A3" ? 1754 : paper === "B5" ? 1075 : 1240;
	const height = paper === "A3" ? 2480 : paper === "B5" ? 1518 : 1754;
	const ctx = document.createElement("canvas").getContext("2d");
	if (!ctx) return [text];
	ctx.font = "48px \"IBM Plex Sans KR\", sans-serif";
	return paginateLines(wrapMeasuredLines(text, (value) => ctx.measureText(value).width, Math.max(80, width - 160)), Math.max(1, Math.floor((height - 120) / 68)));
}
var heldUrls = /* @__PURE__ */ new Set();
function track(url) {
	if (url.startsWith("blob:")) heldUrls.add(url);
	return url;
}
function clearPrintRoot() {
	const root = document.getElementById("print-root");
	if (root) {
		root.querySelectorAll("img").forEach((img) => {
			const src = img.getAttribute("src") || "";
			if (src.startsWith("blob:")) heldUrls.add(src);
		});
		root.replaceChildren();
	}
	for (const url of heldUrls) URL.revokeObjectURL(url);
	heldUrls.clear();
	document.body.classList.remove("is-printing", "print-gray");
	delete document.body.dataset.printPaper;
}
function canvasObjectUrl(canvas, quality = .92) {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) reject(/* @__PURE__ */ new Error("인쇄 이미지를 만들지 못했어요."));
			else resolve(track(URL.createObjectURL(blob)));
		}, "image/jpeg", quality);
	});
}
function loadImage$1(src) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(/* @__PURE__ */ new Error("사진을 열지 못했어요."));
		image.src = src;
	});
}
async function bake(src, gray) {
	if (!gray) return src;
	const image = await loadImage$1(src);
	const canvas = document.createElement("canvas");
	canvas.width = image.naturalWidth || image.width;
	canvas.height = image.naturalHeight || image.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return src;
	ctx.drawImage(image, 0, 0);
	grayCanvas(canvas);
	const next = await canvasObjectUrl(canvas, .92);
	if (src.startsWith("blob:")) URL.revokeObjectURL(src);
	heldUrls.delete(src);
	return next;
}
function finishPrint(root) {
	const cleanup = () => {
		window.removeEventListener("afterprint", cleanup);
		clearPrintRoot();
	};
	window.addEventListener("afterprint", cleanup);
	document.body.classList.add("is-printing");
	window.print();
}
async function appendCanvas(root, canvas, paper, last) {
	const sheet = document.createElement("section");
	sheet.className = `print-page is-sheet paper-${paper.toLowerCase()}${last ? " is-last" : ""}`;
	const shot = document.createElement("img");
	shot.className = "print-photo";
	shot.alt = "";
	shot.src = await canvasObjectUrl(canvas);
	canvas.width = 0;
	canvas.height = 0;
	sheet.append(shot);
	root.append(sheet);
	if (typeof shot.decode === "function") await shot.decode().catch(() => void 0);
}
async function printSheet(job) {
	clearPrintRoot();
	let root = document.getElementById("print-root");
	if (!root) {
		root = document.createElement("div");
		root.id = "print-root";
		document.body.appendChild(root);
	}
	document.body.dataset.printPaper = job.paper;
	document.body.classList.toggle("print-gray", job.gray);
	if (job.kind === "pdf") {
		const shots = [];
		for (const [index, src] of job.pages.entries()) {
			const sheet = document.createElement("section");
			const last = index === job.pages.length - 1;
			sheet.className = `print-page is-sheet paper-${job.paper.toLowerCase()}${last ? " is-last" : ""}`;
			const shot = document.createElement("img");
			shot.className = "print-photo";
			shot.alt = "";
			shot.src = track(await bake(src, job.gray));
			sheet.append(shot);
			root.append(sheet);
			shots.push(shot);
		}
		await Promise.all(shots.map((shot) => typeof shot.decode === "function" ? shot.decode().catch(() => void 0) : Promise.resolve()));
		finishPrint(root);
		return;
	}
	if (job.kind === "photo") {
		const image = await loadImage$1(job.src);
		const canvas = await renderSheetCanvas({
			kind: "photo",
			title: "",
			note: "",
			paper: job.paper,
			image,
			fit: job.fit,
			turn: job.turn,
			gray: job.gray
		});
		if (job.gray) grayCanvas(canvas);
		await appendCanvas(root, canvas, job.paper, true);
		finishPrint(root);
		return;
	}
	if (job.kind === "memo") {
		const chunks = sheetMemoChunks(job.text, job.paper);
		for (const [index, chunk] of chunks.entries()) {
			const canvas = await renderSheetCanvas({
				kind: "memo",
				title: "",
				note: chunk,
				paper: job.paper,
				gray: job.gray
			});
			if (job.gray) grayCanvas(canvas);
			await appendCanvas(root, canvas, job.paper, index === chunks.length - 1);
		}
		finishPrint(root);
		return;
	}
	const page = document.createElement("section");
	page.className = `print-page paper-${job.paper.toLowerCase()}`;
	const kicker = document.createElement("p");
	kicker.className = "print-kicker";
	kicker.textContent = "인쇄 확인";
	const heading = document.createElement("h1");
	heading.textContent = job.title;
	const body = document.createElement("p");
	body.textContent = job.note;
	const bars = document.createElement("div");
	bars.className = "print-bars";
	for (const tone of [
		"ink",
		"c",
		"m",
		"y"
	]) {
		const bar = document.createElement("span");
		bar.dataset.tone = tone;
		bars.append(bar);
	}
	page.append(kicker, heading, body, bars);
	root.append(page);
	finishPrint(root);
}
var pdfjsPromise = null;
async function loadPdfjs() {
	if (!pdfjsPromise) pdfjsPromise = import("../_libs/pdfjs-dist.mjs").then((n) => n.t).then(async (mod) => {
		const worker = await import("./pdf.worker.min-BDqvoJpD.mjs");
		mod.GlobalWorkerOptions.workerSrc = worker.default;
		return mod;
	});
	return pdfjsPromise;
}
async function openPdf(data, password) {
	const pdfjs = await loadPdfjs();
	const copy = data.slice();
	const task = pdfjs.getDocument({
		data: copy,
		password: password || void 0,
		cMapUrl: "/pdfjs/cmaps/",
		cMapPacked: true,
		standardFontDataUrl: "/pdfjs/standard_fonts/"
	});
	const doc = await task.promise;
	return {
		doc,
		destroy: async () => {
			try {
				if (typeof doc.destroy === "function") await doc.destroy();
				else await doc.cleanup?.();
			} catch {}
			try {
				await task.destroy();
			} catch {}
		}
	};
}
function rasterTurn(displayedWidth, displayedHeight) {
	return displayedWidth > displayedHeight ? 90 : 0;
}
function pageDrawPlan(pageWidth, pageHeight, canvasWidth, canvasHeight) {
	const rotation = rasterTurn(pageWidth, pageHeight);
	const landscape = rotation === 90;
	const srcW = landscape ? pageHeight : pageWidth;
	const srcH = landscape ? pageWidth : pageHeight;
	const scale = Math.min(canvasWidth / srcW, canvasHeight / srcH);
	const drawWidth = srcW * scale;
	const drawHeight = srcH * scale;
	return {
		landscape,
		rotation,
		scale,
		drawWidth,
		drawHeight,
		offsetX: (canvasWidth - drawWidth) / 2,
		offsetY: (canvasHeight - drawHeight) / 2
	};
}
async function renderPdfPage(doc, pageNumber, width, height, slot) {
	const page = await doc.getPage(pageNumber);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		page.cleanup();
		return canvas;
	}
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, width, height);
	const base = page.getViewport({ scale: 1 });
	const plan = pageDrawPlan(base.width, base.height, width, height);
	const viewport = page.getViewport({ scale: plan.scale });
	const shot = document.createElement("canvas");
	shot.width = Math.max(1, Math.ceil(viewport.width));
	shot.height = Math.max(1, Math.ceil(viewport.height));
	let dropped = false;
	try {
		const pdfjs = await loadPdfjs();
		const task = page.render({
			canvas: shot,
			viewport,
			annotationMode: pdfjs.AnnotationMode.ENABLE_FORMS
		});
		if (slot) slot.current = { cancel: () => {
			dropped = true;
			task.cancel();
		} };
		await task.promise;
		if (dropped) return null;
		ctx.save();
		ctx.translate(width / 2, height / 2);
		if (plan.landscape) ctx.rotate(Math.PI / 2);
		const destW = plan.landscape ? plan.drawHeight : plan.drawWidth;
		const destH = plan.landscape ? plan.drawWidth : plan.drawHeight;
		ctx.drawImage(shot, -destW / 2, -destH / 2, destW, destH);
		ctx.restore();
	} catch (error) {
		const name = error instanceof Error ? error.name : "";
		if (dropped || name === "RenderingCancelledException") return null;
		throw error;
	} finally {
		page.cleanup();
		shot.width = 0;
		shot.height = 0;
	}
	return canvas;
}
function pdfLooksEncrypted(data) {
	const needle = [
		47,
		69,
		110,
		99,
		114,
		121,
		112,
		116
	];
	const find = (start, end) => {
		for (let index = start; index <= end - needle.length; index += 1) {
			let same = true;
			for (let offset = 0; offset < needle.length; offset += 1) if (data[index + offset] !== needle[offset]) {
				same = false;
				break;
			}
			if (same) return true;
		}
		return false;
	};
	if (find(0, Math.min(data.length, 65536))) return true;
	const tail = Math.max(0, data.length - 262144);
	return tail > 0 && find(tail, data.length);
}
function canPdfDirect(data) {
	return data.byteLength > 0 && data.byteLength <= 26214400 && !pdfLooksEncrypted(data);
}
function pageSpan(total, mode, from, to) {
	if (total < 1) return [];
	if (mode === "all") return Array.from({ length: total }, (_, index) => index + 1);
	const start = Math.min(total, Math.max(1, Math.floor(from) || 1));
	const end = Math.min(total, Math.max(start, Math.floor(to) || start));
	return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
async function slicePdf(data, pages) {
	const { PDFDocument } = await import("../_libs/pdf-lib.mjs").then((n) => n.t);
	const source = await PDFDocument.load(data, { ignoreEncryption: true });
	const next = await PDFDocument.create();
	const copied = await next.copyPages(source, pages.map((page) => page - 1));
	for (const page of copied) next.addPage(page);
	return next.save();
}
async function imagesToPdf(pages, page) {
	const { PDFDocument } = await import("../_libs/pdf-lib.mjs").then((n) => n.t);
	const pdf = await PDFDocument.create();
	for (const sheet of pages) {
		const image = await pdf.embedJpg(sheet.jpeg);
		pdf.addPage([page.width, page.height]).drawImage(image, {
			x: 0,
			y: 0,
			width: page.width,
			height: page.height
		});
	}
	return pdf.save();
}
/** PCL5, PCL5e, or PCL5c only. A bare PCL, PCL 6, PCLXL, or PCL 3 does not count. */
function commandHasPcl5(cmd) {
	return /\bPCL\s*5\s*[ce]?\b/i.test(cmd);
}
function commandBlocksPcl5(cmd) {
	const text = cmd.trim();
	if (!text || commandHasPcl5(text)) return false;
	return /\b(UFR|CAPT|SPL|PCL\s*3|PCL3|PCL\s*6|PCLXL|POST\s*SCRIPT|POSTSCRIPT)\b/i.test(text);
}
function languageIsPcl5(languages) {
	return commandHasPcl5(languages);
}
function resolvePrintRoute(input) {
	if (!input.liveUsb) return "os-print";
	const cmd = input.cmd.trim();
	let pcl5 = false;
	if (cmd && commandHasPcl5(cmd)) pcl5 = true;
	if (cmd && commandBlocksPcl5(cmd)) pcl5 = false;
	const pdfLang = /\bPDF\b/i.test(cmd);
	if (input.docKind === "pdf" && input.pdfBytes && input.pdfDirect && pdfLang && !input.gray && input.pageMode === "all") return "usb-pdf";
	if (pcl5) return "usb-pcl";
	return "os-print";
}
var usePrinterStore = create()(persist((set, get) => ({
	saved: [],
	remember: (item) => {
		set({ saved: [item, ...get().saved.filter((row) => row.uid !== item.uid)].slice(0, 24) });
	},
	forget: (uid) => set({ saved: get().saved.filter((row) => row.uid !== uid) })
}), {
	name: "print-atlas-v2",
	skipHydration: true
}));
var VIA_LABEL = {
	saved: "저장",
	usb: "USB",
	bluetooth: "블루투스"
};
function uidOf(title) {
	return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9가-힣-]/g, "");
}
function chunkLoadError(error) {
	return error instanceof Error && /Failed to fetch|dynamically imported|Importing a module script failed|Loading chunk|error loading dynamically/i.test(error.message);
}
function humanError(error, fallback) {
	if (chunkLoadError(error)) return "네트워크에 다시 연결하거나 새로고침해 주세요.";
	if (error instanceof DOMException) {
		if (error.name === "NotFoundError") return "기기 고르기를 취소했어요.";
		if (error.name === "NotAllowedError" || error.name === "SecurityError") return "여기서는 기기 창이 안 열려요. Chrome으로 열어 주세요.";
		if (error.name === "NetworkError") return "복사기와 연결이 끊겼어요. 다시 연결해 주세요.";
		if (error.name === "InvalidStateError") return "복사기가 다른 곳에서 쓰이는 중이에요. 다시 눌러 주세요.";
	}
	if (error instanceof Error && /[가-힣]/.test(error.message)) return error.message;
	return fallback;
}
function inAppBrowser() {
	return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent);
}
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(/* @__PURE__ */ new Error("사진을 열지 못했어요."));
		image.src = src;
	});
}
function isSure(result, query) {
	if (!result || result.kind !== "match") return false;
	if (result.source === "catalog") return result.confidence >= 88;
	if (result.source === "driver-db") return result.confidence >= 90;
	if (result.source === "heuristic" && result.confidence >= 70) return /\d{2,}/.test(query);
	return false;
}
function stageForQuery(query, cmd) {
	const text = query.trim();
	const found = text ? matchQuery(text, { cmd }) : null;
	if ((found && found.kind === "match" ? found : null) && isSure(found, text)) return "print";
	return "confirm";
}
function isInkjet(match) {
	return match.pack.id === "raster-ink";
}
function Mark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "grid size-14 shrink-0 grid-cols-2 overflow-hidden rounded-2xl",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex items-center justify-end bg-paper pr-0.5 text-ink",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-6" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex items-center justify-start bg-accent pl-0.5 text-paper",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "size-6" })
		})]
	});
}
function AtlasApp() {
	const saved = usePrinterStore((state) => state.saved);
	const remember = usePrinterStore((state) => state.remember);
	const forget = usePrinterStore((state) => state.forget);
	const [scanId, setScanId] = (0, import_react.useState)(0);
	const [scanning, setScanning] = (0, import_react.useState)(true);
	const [hits, setHits] = (0, import_react.useState)([]);
	const [extra, setExtra] = (0, import_react.useState)([]);
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [overrideQuery, setOverrideQuery] = (0, import_react.useState)(null);
	const [askName, setAskName] = (0, import_react.useState)("");
	const [notice, setNotice] = (0, import_react.useState)("");
	const [copies, setCopies] = (0, import_react.useState)(1);
	const [paper, setPaper] = (0, import_react.useState)("A4");
	const [gray, setGray] = (0, import_react.useState)(false);
	const [duplex, setDuplex] = (0, import_react.useState)("simplex");
	const [theme, setTheme] = (0, import_react.useState)("dark");
	const [phonePrint, setPhonePrint] = (0, import_react.useState)(false);
	const [inApp, setInApp] = (0, import_react.useState)(false);
	const [usbMissed, setUsbMissed] = (0, import_react.useState)(false);
	const [step, setStep] = (0, import_react.useState)("connect");
	const [docKind, setDocKind] = (0, import_react.useState)("pdf");
	const [memo, setMemo] = (0, import_react.useState)("");
	const [photoUrl, setPhotoUrl] = (0, import_react.useState)(null);
	const [pdfBytes, setPdfBytes] = (0, import_react.useState)(null);
	const [pdfKey, setPdfKey] = (0, import_react.useState)("");
	const [pdfNeedsKey, setPdfNeedsKey] = (0, import_react.useState)(false);
	const [pdfName, setPdfName] = (0, import_react.useState)("");
	const [pdfCount, setPdfCount] = (0, import_react.useState)(0);
	const [pdfPreview, setPdfPreview] = (0, import_react.useState)(null);
	const [pageMode, setPageMode] = (0, import_react.useState)("all");
	const [pageFrom, setPageFrom] = (0, import_react.useState)(1);
	const [pageTo, setPageTo] = (0, import_react.useState)(1);
	const [previewPage, setPreviewPage] = (0, import_react.useState)(1);
	const [sending, setSending] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [photoFit, setPhotoFit] = (0, import_react.useState)("contain");
	const [photoTurn, setPhotoTurn] = (0, import_react.useState)(0);
	const stopRef = (0, import_react.useRef)(false);
	const photoUrlRef = (0, import_react.useRef)(null);
	const photoGen = (0, import_react.useRef)(0);
	const pdfRef = (0, import_react.useRef)(null);
	const previewReq = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		const savedTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
		setTheme(savedTheme);
		const ua = navigator.userAgent;
		const ios = /iPad|iPhone|iPod/.test(ua) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
		setPhonePrint(ios);
		setInApp(inAppBrowser());
		if ("serviceWorker" in navigator) {
			let hadController = Boolean(navigator.serviceWorker.controller);
			navigator.serviceWorker.addEventListener("controllerchange", () => {
				if (!hadController) {
					hadController = true;
					return;
				}
				window.location.reload();
			});
			navigator.serviceWorker.register("/sw.js").catch(() => void 0);
		}
		const stopDisconnect = watchUsbDisconnect((usbKey) => {
			const mark = (item) => item.usbKey === usbKey ? {
				...item,
				live: false,
				subtitle: "USB가 빠졌어요"
			} : item;
			setHits((prev) => prev.map(mark));
			setExtra((prev) => prev.map(mark));
			setNotice("USB 케이블이 빠졌어요. 다시 연결해 주세요.");
		});
		const stopConnect = watchUsbConnect((device) => {
			identifyUsb(device).then((linked) => {
				const item = {
					id: `usb-live:${linked.usbKey}`,
					title: linked.title,
					subtitle: linked.subtitle,
					via: "usb",
					query: linked.query,
					cmd: linked.cmd,
					live: linked.live,
					usbKey: linked.usbKey
				};
				const merge = (prev) => [item, ...prev.filter((row) => row.usbKey !== linked.usbKey)];
				setHits(merge);
				setExtra(merge);
				setNotice(linked.live ? "USB 복사기를 다시 연결했어요." : "USB는 다시 꽂혔지만 바로 보내지는 못해요.");
			}).catch((error) => {
				setNotice(error instanceof Error ? error.message : "USB 복사기를 열지 못했어요.");
			});
		});
		return () => {
			stopDisconnect();
			stopConnect();
		};
	}, []);
	function toggleTheme() {
		const next = theme === "dark" ? "light" : "dark";
		setTheme(next);
		document.documentElement.dataset.theme = next;
		localStorage.setItem("atlas-theme", next);
	}
	(0, import_react.useEffect)(() => {
		let stop = false;
		setScanning(true);
		setHits([]);
		(async () => {
			try {
				await usePrinterStore.persist.rehydrate();
			} catch {}
			if (stop) return;
			const usbHits = [];
			for (const [index, device] of (await grantedUsb()).entries()) {
				const linked = await identifyUsb(device);
				if (stop) return;
				usbHits.push({
					id: `usb:${linked.usbKey}:${index}`,
					title: linked.title,
					subtitle: linked.subtitle,
					via: "usb",
					query: linked.query,
					cmd: linked.cmd,
					live: linked.live,
					usbKey: linked.usbKey
				});
			}
			if (stop) return;
			setHits(usbHits);
			setScanning(false);
		})();
		return () => {
			stop = true;
		};
	}, [scanId]);
	const list = (0, import_react.useMemo)(() => {
		const fromSaved = saved.map((item) => ({
			id: `saved:${item.uid}`,
			title: item.title,
			subtitle: `저장됨 · ${item.via}`,
			via: "saved",
			query: item.query
		}));
		const seen = /* @__PURE__ */ new Set();
		const seenQuery = /* @__PURE__ */ new Set();
		const merged = [];
		for (const item of [
			...hits,
			...extra,
			...fromSaved
		]) {
			const queryKey = item.query.trim().toLowerCase();
			if (queryKey && seenQuery.has(queryKey)) continue;
			if (seen.has(item.id)) continue;
			seen.add(item.id);
			if (queryKey) seenQuery.add(queryKey);
			merged.push(item);
		}
		return merged;
	}, [
		saved,
		hits,
		extra
	]);
	(0, import_react.useEffect)(() => {
		return () => {
			photoGen.current += 1;
			const url = photoUrlRef.current;
			photoUrlRef.current = null;
			if (url) URL.revokeObjectURL(url);
		};
	}, []);
	const selected = list.find((item) => item.id === selectedId) || null;
	const query = (overrideQuery ?? selected?.query ?? "").trim();
	const result = query ? matchQuery(query, { cmd: selected?.cmd }) : null;
	const match = result && result.kind === "match" ? result : null;
	const sure = isSure(result, query);
	const remembered = (() => {
		if (!match) return void 0;
		const title = `${match.printer.brand} ${match.printer.model}`.trim();
		const selectedUid = selected?.id.startsWith("saved:") ? selected.id.slice(6) : "";
		const byUid = selectedUid ? saved.find((item) => item.uid === selectedUid) : void 0;
		if (byUid) return byUid;
		return saved.find((item) => item.title === title || item.query === title || query.length > 0 && (item.query === query || item.title === query));
	})();
	function addFound(item) {
		const key = item.query.trim().toLowerCase();
		const already = list.find((row) => key && row.query.trim().toLowerCase() === key);
		setExtra((prev) => [item, ...prev.filter((row) => row.id !== item.id)]);
		setSelectedId(already?.live ? already.id : item.id);
		setOverrideQuery(null);
		setAskName("");
		setNotice("");
		setStep(stageForQuery(item.query, item.cmd));
	}
	async function connectUsb(all = false) {
		setNotice("");
		try {
			const linked = await identifyUsb(await pickUsb(all));
			addFound({
				id: `usb-pick:${linked.usbKey}:${linked.query}`,
				title: linked.title,
				subtitle: linked.subtitle,
				via: "usb",
				query: linked.query,
				cmd: linked.cmd,
				live: linked.live,
				usbKey: linked.usbKey
			});
			setUsbMissed(false);
			setNotice(linked.live ? "USB로 연결했어요." : "USB로 기기는 잡았어요. 인쇄할 내용을 고르면 인쇄 창이 열려요.");
		} catch (error) {
			setUsbMissed(true);
			setNotice(humanError(error, "USB 복사기를 열지 못했어요."));
		}
	}
	function applyName(name) {
		const text = name.trim();
		if (text.length < 2 || !selected) {
			setNotice("앞면에 적힌 이름을 적어 주세요.");
			return;
		}
		setExtra((prev) => prev.map((item) => item.id === selected.id ? {
			...item,
			title: text,
			query: text
		} : item));
		setOverrideQuery(text);
		setAskName("");
		setStep(stageForQuery(text, selected.cmd));
		setNotice("그 이름으로 다시 봤어요.");
	}
	function onRemember() {
		if (!match || !sure) return;
		const title = `${match.printer.brand} ${match.printer.model}`.trim();
		if (title.length < 2) return;
		const item = {
			uid: uidOf(title) || uidOf(query),
			title,
			query: title,
			via: selected?.via ? VIA_LABEL[selected.via] : "직접",
			savedAt: Date.now()
		};
		remember(item);
		setSelectedId(`saved:${item.uid}`);
		setNotice("다음에도 이 복사기가 나와요.");
	}
	function openChooser() {
		setStep("print");
		setNotice("");
	}
	function backToConnect() {
		if (sending) return;
		clearPrintRoot();
		setPdfBytes(null);
		setPdfPreview(null);
		setPdfName("");
		setPdfCount(0);
		setPdfKey("");
		setPdfNeedsKey(false);
		setStep("connect");
		setSelectedId(null);
		setOverrideQuery(null);
		setAskName("");
		setNotice("");
	}
	function useRecent() {
		const recent = saved[0];
		if (!recent) return;
		const key = recent.query.trim().toLowerCase();
		const matches = list.filter((item) => item.query.trim().toLowerCase() === key);
		const picked = matches.find((item) => item.live && item.via === "usb") || matches[0];
		setSelectedId(picked ? picked.id : `saved:${recent.uid}`);
		setOverrideQuery(null);
		setAskName("");
		setStep("print");
	}
	function choosePhoto(file) {
		if (!file || sending) return;
		if (/\.heic$|\.heif$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif") {
			setNotice("HEIC 사진은 지원하지 않아요. JPG/PNG로 바꿔서 골라 주세요.");
			return;
		}
		if (file.size > 12582912) {
			setNotice("사진이 너무 커요. JPG나 PNG로, 긴 변 2000px 정도로 줄여 주세요.");
			return;
		}
		clearPrintRoot();
		const token = ++photoGen.current;
		const raw = URL.createObjectURL(file);
		const keep = (next) => {
			if (token !== photoGen.current) {
				URL.revokeObjectURL(next);
				return;
			}
			const previous = photoUrlRef.current;
			photoUrlRef.current = next;
			if (previous && previous !== next) URL.revokeObjectURL(previous);
			setPhotoUrl(next);
			setDocKind("photo");
		};
		loadImage(raw).then(async (image) => {
			const long = Math.max(image.width, image.height);
			let next = raw;
			if (image.width * image.height >= 4e7 || long > 2e3) {
				const scale = 2e3 / long;
				const canvas = document.createElement("canvas");
				canvas.width = Math.max(1, Math.round(image.width * scale));
				canvas.height = Math.max(1, Math.round(image.height * scale));
				canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
				const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .86));
				if (blob) {
					URL.revokeObjectURL(raw);
					next = URL.createObjectURL(blob);
				}
			}
			keep(next);
		}).catch(() => keep(raw));
	}
	(0, import_react.useEffect)(() => {
		if (!pdfBytes) {
			setPdfCount(0);
			setPdfPreview(null);
			const previous = pdfRef.current;
			pdfRef.current = null;
			previous?.opened.destroy();
			return;
		}
		const requestId = ++previewReq.current;
		const slot = { current: null };
		let cancel = false;
		const bytes = pdfBytes;
		(async () => {
			try {
				if (!pdfRef.current || pdfRef.current.bytes !== bytes) {
					const previous = pdfRef.current;
					pdfRef.current = null;
					await previous?.opened.destroy();
					const opened = await openPdf(bytes, pdfKey || void 0);
					if (cancel || requestId !== previewReq.current) {
						await opened.destroy();
						return;
					}
					pdfRef.current = {
						bytes,
						opened
					};
					setPdfCount(opened.doc.numPages);
					setPageTo((current) => current <= 1 ? opened.doc.numPages : Math.min(opened.doc.numPages, current));
				}
				const opened = pdfRef.current?.opened;
				if (!opened || cancel || requestId !== previewReq.current) return;
				const page = Math.min(opened.doc.numPages, Math.max(1, previewPage));
				const size = previewSize(paper);
				const canvas = await renderPdfPage(opened.doc, page, size.width, size.height, slot);
				if (!canvas || cancel || requestId !== previewReq.current) {
					if (canvas) {
						canvas.width = 0;
						canvas.height = 0;
					}
					return;
				}
				setPdfPreview(canvas.toDataURL("image/jpeg", .82));
				canvas.width = 0;
				canvas.height = 0;
				setPdfNeedsKey(false);
			} catch (error) {
				if (cancel || requestId !== previewReq.current) return;
				if ((error instanceof Error ? error.name : "") === "PasswordException" || error instanceof Error && /password/i.test(error.message)) {
					setPdfNeedsKey(true);
					setPdfPreview(null);
					setNotice(pdfKey ? "비밀번호가 맞지 않아요." : "이 PDF는 열기 비밀번호가 필요해요.");
					return;
				}
				if (chunkLoadError(error)) {
					setNotice("네트워크에 다시 연결하거나 새로고침해 주세요.");
					return;
				}
				setNotice("PDF를 열지 못했어요.");
			}
		})();
		return () => {
			cancel = true;
			slot.current?.cancel();
		};
	}, [
		pdfBytes,
		previewPage,
		paper,
		pdfKey
	]);
	(0, import_react.useEffect)(() => () => {
		const previous = pdfRef.current;
		pdfRef.current = null;
		previous?.opened.destroy();
		clearPrintRoot();
	}, []);
	function choosePdf(file) {
		if (!file || sending) return;
		clearPrintRoot();
		file.arrayBuffer().then((buffer) => {
			setPdfBytes(new Uint8Array(buffer));
			setPdfName(file.name);
			setPageMode("all");
			setPageFrom(1);
			setPageTo(1);
			setPreviewPage(1);
			setPdfKey("");
			setPdfNeedsKey(false);
			setDocKind("pdf");
			setNotice("");
		});
	}
	const catalogPcl5 = Boolean(match && sure && !isInkjet(match) && languageIsPcl5((match.printer.languages || []).join(" ")));
	const route = resolvePrintRoute({
		liveUsb: Boolean(selected?.live && selected.usbKey),
		cmd: selected?.cmd || "",
		catalogPcl5,
		catalogSure: Boolean(match && sure),
		pdfBytes: Boolean(pdfBytes),
		docKind,
		pageMode,
		gray,
		pdfDirect: Boolean(pdfBytes && canPdfDirect(pdfBytes))
	});
	async function buildSystem(forceColor = false) {
		const useGray = forceColor ? false : gray;
		const title = match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || "인쇄";
		const note = docKind === "memo" ? memo.trim() : "인쇄 창에서 이 복사기를 고르세요.";
		if (docKind === "pdf" && pdfBytes) {
			const opened = await openPdf(pdfBytes, pdfKey || void 0);
			try {
				const numbers = pageSpan(opened.doc.numPages, pageMode, pageFrom, pageTo);
				const size = osRasterSize(paper, numbers.length);
				const urls = [];
				for (const number of numbers) {
					const canvas = await renderPdfPage(opened.doc, number, size.width, size.height);
					if (!canvas) throw new Error("PDF를 열지 못했어요.");
					urls.push(await canvasObjectUrl(canvas, .86));
					canvas.width = 0;
					canvas.height = 0;
				}
				return {
					kind: "pdf",
					pages: urls,
					paper,
					gray: useGray
				};
			} finally {
				await opened.destroy();
			}
		}
		if (docKind === "photo" && photoUrl) return {
			kind: "photo",
			src: photoUrl,
			fit: photoFit,
			turn: photoTurn,
			paper,
			gray: useGray
		};
		if (docKind === "memo") return {
			kind: "memo",
			text: memo.trim(),
			paper,
			gray: useGray
		};
		return {
			kind: "test",
			title,
			note,
			paper,
			gray: useGray
		};
	}
	async function onPrint() {
		if (sending) return;
		const pages = pageSpan(pdfCount, pageMode, pageFrom, pageTo);
		if (docKind === "pdf" && (!pdfBytes || pages.length < 1)) {
			setNotice("PDF를 골라 주세요.");
			return;
		}
		if (docKind === "memo" && memo.trim().length < 1) {
			setNotice("메모를 적어 주세요.");
			return;
		}
		if (docKind === "photo" && !photoUrl) {
			setNotice("사진을 골라 주세요.");
			return;
		}
		const title = match ? `${match.printer.brand} ${match.printer.model}` : selected?.title || "인쇄";
		const note = docKind === "memo" ? memo.trim() : "인쇄 창에서 이 복사기를 고르세요.";
		if (route === "os-print" || !selected?.usbKey) {
			await printSheet(await buildSystem());
			setNotice(dialogNotice("인쇄 창을 열었어요. 거기서 이 복사기를 고르면 돼요."));
			return;
		}
		const usbKey = selected.usbKey;
		stopRef.current = false;
		setSending(true);
		setProgress(0);
		let started = false;
		const stop = () => stopRef.current;
		const fatalUsb = (error) => error instanceof Error && /15초|USB 연결을 닫|거절/.test(error.message);
		const sendPackets = async (commands, progress) => {
			const packets = bundleCommands(commands);
			for (const [index, packet] of packets.entries()) {
				if (stopRef.current) throw new Error("보내기를 멈췄어요.");
				await sendUsbBytes(usbKey, packet, () => progress(Math.round((index + 1) / packets.length * 100)), () => false, true);
			}
		};
		try {
			if (route === "usb-pdf" && pdfBytes) {
				const bytes = wrapPdfJob(pdfBytes, {
					copies,
					duplex,
					paper,
					pages: Math.max(1, pdfCount)
				});
				setProgress(8);
				await sendUsbBytes(usbKey, bytes, (percent) => setProgress(8 + Math.round(percent * .92)), stop);
			} else {
				const size = printableSize(paper);
				const memoChunks = docKind === "memo" ? officeMemoChunks(note, size.width, size.height) : null;
				const jobPages = docKind === "pdf" ? Math.max(1, pages.length) : memoChunks?.length || 1;
				await sendUsbBytes(usbKey, pclJobHeader({
					copies,
					duplex,
					paper,
					pages: jobPages
				}), () => setProgress(2), stop, true);
				started = true;
				if (stopRef.current) throw new Error("보내기를 멈췄어요.");
				if (docKind === "pdf" && pdfBytes) {
					const opened = await openPdf(pdfBytes, pdfKey || void 0);
					try {
						const listPages = pageSpan(opened.doc.numPages, pageMode, pageFrom, pageTo);
						for (const [index, number] of listPages.entries()) {
							if (stopRef.current) throw new Error("보내기를 멈췄어요.");
							const canvas = await renderPdfPage(opened.doc, number, size.width, size.height);
							if (!canvas || stopRef.current) {
								if (canvas) {
									canvas.width = 0;
									canvas.height = 0;
								}
								throw new Error("보내기를 멈췄어요.");
							}
							const commands = canvasPclCommands(canvas, "dither");
							canvas.width = 0;
							canvas.height = 0;
							const percent = Math.round(4 + (index + 1) / listPages.length * 90);
							await sendPackets(commands, () => setProgress(percent));
						}
						if (needsBlankBack(listPages.length, duplex)) await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
					} finally {
						await opened.destroy();
					}
				} else if (memoChunks) {
					for (const [index, chunk] of memoChunks.entries()) {
						if (stopRef.current) throw new Error("보내기를 멈췄어요.");
						const canvas = document.createElement("canvas");
						canvas.width = size.width;
						canvas.height = size.height;
						drawOfficePage(canvas, {
							kind: "memo",
							title,
							note: chunk,
							gray: true
						});
						const commands = canvasPclCommands(canvas, "threshold");
						canvas.width = 0;
						canvas.height = 0;
						await sendPackets(commands, () => setProgress(Math.round(8 + (index + 1) / memoChunks.length * 84)));
					}
					if (needsBlankBack(memoChunks.length, duplex)) await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
				} else {
					const canvas = document.createElement("canvas");
					canvas.width = size.width;
					canvas.height = size.height;
					const image = docKind === "photo" && photoUrl ? await loadImage(photoUrl) : null;
					drawOfficePage(canvas, {
						kind: docKind,
						title,
						note,
						image,
						fit: photoFit,
						turn: photoTurn,
						gray: true
					});
					if (stopRef.current) throw new Error("보내기를 멈췄어요.");
					const commands = canvasPclCommands(canvas, docKind === "photo" ? "dither" : "threshold");
					canvas.width = 0;
					canvas.height = 0;
					await sendPackets(commands, (percent) => setProgress(8 + Math.round(percent * .84)));
					if (needsBlankBack(1, duplex)) await sendPackets(pclPageCommands(new Uint8Array(size.width * size.height), size.width, size.height), () => setProgress(96));
				}
				if (stopRef.current) throw new Error("보내기를 멈췄어요.");
				await sendUsbBytes(usbKey, pclJobFooter(), () => setProgress(100), () => false, true);
				started = false;
			}
			if (stopRef.current) {
				setNotice("보내기를 멈췄어요.");
				return;
			}
			setNotice("USB로 보냈어요.");
		} catch (error) {
			if (started && !fatalUsb(error)) try {
				await sendUsbBytes(usbKey, pclAbortFooter(), void 0, () => false, true);
			} catch {}
			if (fatalUsb(error) && selected?.usbKey) {
				const mark = (item) => item.usbKey === selected.usbKey ? {
					...item,
					live: false,
					subtitle: "USB 연결을 닫았어요"
				} : item;
				setHits((prev) => prev.map(mark));
				setExtra((prev) => prev.map(mark));
			}
			if (stopRef.current) {
				setNotice("보내기를 멈췄어요.");
				return;
			}
			if (!started) {
				setNotice(dialogNotice(humanError(error, "바로 넣지는 못해서 인쇄 창을 열었어요.")));
				await printSheet(await buildSystem());
				return;
			}
			setNotice(humanError(error, "보내는 중에 끊겼어요. 복사기에서 작업을 지운 뒤 다시 눌러 주세요."));
		} finally {
			setSending(false);
		}
	}
	async function onColorPrint() {
		if (sending) return;
		await printSheet(await buildSystem(true));
		setNotice(dialogNotice("인쇄 창을 열었어요. 거기서 컬러로 고르면 돼요."));
	}
	function dialogNotice(base) {
		const count = docKind === "pdf" ? pageSpan(pdfCount, pageMode, pageFrom, pageTo).length : 0;
		const safari = typeof navigator !== "undefined" && /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|Edg|Android/i.test(navigator.userAgent);
		const notes = [base];
		if (count > 30) notes.push("30쪽이 넘어 인쇄 창 해상도를 낮췄어요. 더 선명하게 찍으려면 30쪽씩 나눠 주세요.");
		if (safari && (paper === "A3" || paper === "B5")) notes.push("사파리 인쇄 창에서 용지 크기를 한 번 더 확인해 주세요.");
		return notes.join(" ");
	}
	const skippedConfirm = step === "print" && !(match && sure);
	const stepNo = step === "print" ? 3 : step === "confirm" ? 2 : 1;
	const chosenPages = pageSpan(pdfCount, pageMode, pageFrom, pageTo);
	const readyDoc = docKind === "test" || (docKind === "photo" ? Boolean(photoUrl) : docKind === "memo" ? memo.trim().length > 0 : Boolean(pdfBytes && chosenPages.length && !pdfNeedsKey));
	const viaName = selected?.live && selected.usbKey ? "USB" : "와이파이 (인쇄 창)";
	async function onPdf() {
		if (!readyDoc || sending) return;
		try {
			if (docKind === "pdf" && pdfBytes) {
				if (!gray) {
					const bytes = pageMode === "all" ? pdfBytes : await slicePdf(pdfBytes, chosenPages);
					const copy = new Uint8Array(bytes.byteLength);
					copy.set(bytes);
					const file = new Blob([copy], { type: "application/pdf" });
					const url = URL.createObjectURL(file);
					const link = document.createElement("a");
					link.href = url;
					link.download = pdfName || "문서.pdf";
					link.click();
					URL.revokeObjectURL(url);
					return;
				}
				const opened = await openPdf(pdfBytes, pdfKey || void 0);
				try {
					const size = osRasterSize(paper, chosenPages.length);
					const sheets = [];
					for (const number of chosenPages) {
						const canvas = await renderPdfPage(opened.doc, number, size.width, size.height);
						if (!canvas) throw new Error("PDF로 만들지 못했어요.");
						grayCanvas(canvas);
						const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .92));
						canvas.width = 0;
						canvas.height = 0;
						if (!blob) throw new Error("PDF로 만들지 못했어요.");
						sheets.push({
							jpeg: new Uint8Array(await blob.arrayBuffer()),
							width: size.width,
							height: size.height
						});
					}
					const bytes = await imagesToPdf(sheets, paperPoints(paper));
					const copy = new Uint8Array(bytes.byteLength);
					copy.set(bytes);
					const url = URL.createObjectURL(new Blob([copy], { type: "application/pdf" }));
					const link = document.createElement("a");
					link.href = url;
					link.download = pdfName || "문서.pdf";
					link.click();
					URL.revokeObjectURL(url);
				} finally {
					await opened.destroy();
				}
				return;
			}
			if (docKind === "memo") {
				const chunks = sheetMemoChunks(memo.trim(), paper);
				const sheets = [];
				for (const chunk of chunks) {
					const canvas = await renderSheetCanvas({
						kind: "memo",
						title: "",
						note: chunk,
						paper,
						gray
					});
					if (gray) grayCanvas(canvas);
					const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .92));
					const width = canvas.width;
					const height = canvas.height;
					canvas.width = 0;
					canvas.height = 0;
					if (!blob) throw new Error("PDF로 만들지 못했어요.");
					sheets.push({
						jpeg: new Uint8Array(await blob.arrayBuffer()),
						width,
						height
					});
				}
				const bytes = await imagesToPdf(sheets, paperPoints(paper));
				const copy = new Uint8Array(bytes.byteLength);
				copy.set(bytes);
				const url = URL.createObjectURL(new Blob([copy], { type: "application/pdf" }));
				const link = document.createElement("a");
				link.href = url;
				link.download = "메모.pdf";
				link.click();
				URL.revokeObjectURL(url);
				return;
			}
			const image = docKind === "photo" && photoUrl ? await loadImage(photoUrl) : null;
			const canvas = await renderSheetCanvas({
				kind: docKind === "photo" ? "photo" : "test",
				title: match ? `${match.printer.brand} ${match.printer.model}` : "인쇄",
				note: "인쇄 창에서 이 복사기를 고르세요.",
				paper,
				image,
				fit: photoFit,
				turn: photoTurn,
				gray
			});
			if (gray) grayCanvas(canvas);
			await downloadCanvasPdf(canvas, "인쇄", paper === "A3" ? {
				width: 841.89,
				height: 1190.55
			} : paper === "B5" ? {
				width: 515.91,
				height: 728.5
			} : {
				width: 595.28,
				height: 841.89
			});
		} catch (error) {
			setNotice(humanError(error, "PDF로 만들지 못했어요."));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "shell mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6 sm:py-10",
		children: [
			inApp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-2xl border border-warn bg-subtle px-4 py-3 text-sm leading-relaxed",
				children: "이 앱 안에서는 복사기를 열 수 없어요. 메뉴에서 Chrome이나 Safari로 열어 주세요."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-3xl font-semibold leading-none",
							children: "인쇄"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm leading-snug text-muted",
							children: [
								"사무용 복사기·복합기를 USB로 바로 연결하거나,",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"사내 와이파이 인쇄 창으로 인쇄합니다."
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: toggleTheme,
						className: "inline-flex size-11 items-center justify-center rounded-full border border-line bg-subtle",
						"aria-label": theme === "dark" ? "밝게" : "어둡게",
						children: theme === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "grid grid-cols-3 gap-2 text-center text-xs",
				children: [
					"연결",
					"확인",
					"인쇄"
				].map((label, index) => {
					const skipped = skippedConfirm && index === 1;
					const on = stepNo === index + 1;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: `rounded-full px-2 py-2 ${on ? "bg-accent text-accent-fg" : "bg-subtle text-muted"}`,
						children: skipped ? "2. 건너뜀" : `${index + 1}. ${label}`
					}, label);
				})
			}),
			skippedConfirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "-mt-2 text-center text-xs text-muted",
				children: "복사기 확인은 넘어갔어요. 인쇄할 내용만 고르면 됩니다."
			}) : null,
			step === "print" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-2xl bg-subtle px-4 py-3 text-sm text-fg",
				children: [
					"연결 방식: ",
					viaName,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: backToConnect,
						disabled: sending,
						className: "ml-2 font-medium disabled:opacity-40",
						children: "· 바꾸기"
					})
				]
			}) : null,
			step === "connect" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel rounded-3xl p-4 sm:p-5",
				children: [
					saved[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: useRecent,
						className: "mb-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-3 py-3 text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-medium",
							children: "최근 복사기 바로 쓰기"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block text-xs text-ink/60",
							children: saved[0].title
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {
							className: "size-4 shrink-0",
							"aria-hidden": "true"
						})]
					}) : null,
					phonePrint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiLane, {
						primary: true,
						onOpen: openChooser
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void connectUsb(false),
						className: `flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-medium ${phonePrint ? "mt-3 border border-ink/15" : "bg-accent text-accent-fg"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Usb, {
							className: "size-5",
							"aria-hidden": "true"
						}), "선으로 연결"]
					}),
					usbMissed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void connectUsb(true),
						className: "mt-2 text-xs text-ink/60 underline-offset-2 hover:underline",
						children: "USB 목록에 없으면 다른 기기도 보기"
					}) : null,
					phonePrint ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiLane, { onOpen: openChooser }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm text-ink/70",
						"aria-live": "polite",
						children: scanning ? "전에 연결했던 복사기가 있나 보고 있어요." : selected?.live ? "연결되어 있어요." : "위에서 하나만 누르면 돼요."
					}),
					notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-warn",
						children: notice
					}) : null,
					list.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-2",
						children: list.map((item) => {
							const on = item.id === selectedId;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									setSelectedId(item.id);
									setOverrideQuery(null);
									setAskName("");
									setStep(stageForQuery(item.query, item.cmd));
								},
								className: `flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left ${on ? "border-accent bg-white" : "border-ink/10 bg-white/70"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {
										className: "size-4 shrink-0",
										"aria-hidden": "true"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate font-medium",
											children: item.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-0.5 block text-xs text-ink/60",
											children: item.subtitle
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `text-xs ${item.live ? "text-ok" : "text-ink/50"}`,
										children: item.live ? "연결됨" : VIA_LABEL[item.via]
									})
								]
							}) }, item.id);
						})
					}) : null
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "panel rounded-3xl p-4 sm:p-5",
				children: step === "confirm" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: (event) => {
						event.preventDefault();
						applyName(askName);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-semibold",
							children: selected?.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-ink/70",
							children: result?.kind === "list" ? "이름이 여러 기종에 걸려요. 앞면에 적힌 글자를 조금 더 적어 주세요." : "앞면에 적힌 이름을 알면, 바로 보낼지 인쇄 창으로 열지를 골라요."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: askName,
							onChange: (event) => setAskName(event.target.value),
							placeholder: "예: 신도리코 D450, 캐논 iR-ADV C3530, 후지필름 Apeos",
							className: "mt-4 h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "h-12 rounded-2xl bg-accent text-sm font-medium text-accent-fg",
								children: "이 이름으로 볼게요"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: openChooser,
								className: "h-12 rounded-2xl border border-ink/15 text-sm",
								children: "이름은 모르겠고, 인쇄할 내용 고르기"
							})]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-sm text-warn",
						children: notice
					}) : null,
					match && sure && selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadyCard, {
						match,
						saved: Boolean(remembered),
						direct: route !== "os-print",
						route,
						onRemember,
						onForget: () => {
							if (remembered) forget(remembered.uid);
						}
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-semibold",
						children: "무엇을 인쇄할까요?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeOptions, {
						paper,
						gray,
						duplex,
						copies,
						route,
						locked: sending,
						onPaper: setPaper,
						onGray: setGray,
						onDuplex: setDuplex,
						onCopies: setCopies
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintChooser, {
						docKind,
						memo,
						photoUrl,
						pdfName,
						pdfCount,
						pageMode,
						pageFrom,
						pageTo,
						sending,
						progress,
						ready: readyDoc,
						label: route === "os-print" ? "이 기기의 인쇄 창으로 열기" : "USB로 바로 인쇄",
						preview: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaperPreview, {
							paper,
							gray: gray || route === "usb-pcl",
							docKind,
							title: match ? `${match.printer.brand} ${match.printer.model}` : "인쇄",
							memo,
							photoUrl,
							pdfPreview,
							pdfCount,
							previewPage,
							photoFit,
							photoTurn,
							onFit: setPhotoFit,
							onTurn: () => setPhotoTurn((value) => (value + 90) % 360),
							onPreview: setPreviewPage
						}),
						onKind: setDocKind,
						onMemo: setMemo,
						onPhoto: choosePhoto,
						onPdfFile: choosePdf,
						pdfNeedsKey,
						onPdfUnlock: setPdfKey,
						onPageMode: setPageMode,
						onPageFrom: setPageFrom,
						onPageTo: setPageTo,
						onPrint: () => void onPrint(),
						onColorPrint: route === "usb-pcl" ? () => void onColorPrint() : void 0,
						onPdf: () => void onPdf(),
						onCancel: () => {
							stopRef.current = true;
						}
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "help-card rounded-3xl px-4 py-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "cursor-pointer font-medium",
					children: "연결이 안 될 때"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-3 space-y-2 leading-relaxed",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "컴퓨터는 Chrome으로 여세요. 선을 꽂고 선으로 연결을 누르면 복사기 목록이 나옵니다." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "아이폰은 선을 여기서 못 잡습니다. 인쇄할 내용 고르기를 누른 뒤, 인쇄 창에서 복사기를 고르세요." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "같은 와이파이에 복사기가 안 보이면, 폰이나 컴퓨터 설정에서 한 번 추가하세요." })
					]
				})]
			}),
			saved.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setScanId((value) => value + 1),
				className: "self-center text-xs text-faint",
				children: "전에 연결한 복사기 다시 보기"
			}) : null
		]
	});
}
function WifiLane({ primary, onOpen }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `wifi-card rounded-2xl p-3 ${primary ? "" : "mt-5"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-1.5 text-sm font-medium",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, {
					className: "size-4",
					"aria-hidden": "true"
				}), "와이파이"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-ink/70",
				children: "같은 와이파이에 있는 복사기는 따로 연결하지 않고, 인쇄 창에서 바로 고릅니다."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onOpen,
				className: `mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium ${primary ? "bg-accent text-accent-fg" : "bg-navy text-paper"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {
					className: "size-4",
					"aria-hidden": "true"
				}), "인쇄할 내용 고르기"]
			})
		]
	});
}
function ReadyCard({ match, saved, direct, route, onRemember, onForget }) {
	const printer = match.printer;
	const inkjet = isInkjet(match);
	const line = inkjet ? "잉크젯은 웹에서 바로 보낼 수 없어 이 기기의 인쇄 창을 엽니다. 목록에 없으면 폰이나 PC 설정에서 복사기를 먼저 추가해야 합니다." : route === "usb-pdf" ? "전체 쪽을 컬러로 보낼 때 USB로 PDF를 바로 넣어요." : route === "usb-pcl" ? "USB로는 흑백으로 바로 넣어요. 컬러는 인쇄 창을 쓰면 됩니다." : "이 기기의 인쇄 창으로 열어서 인쇄해요.";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-ink/60",
			children: "확인됨"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "mt-1 text-2xl font-semibold leading-tight",
			children: [
				printer.brand,
				" ",
				printer.model
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm leading-relaxed text-ink/80",
			children: line
		}),
		inkjet ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-ink/70",
			children: direct ? "USB로 바로 인쇄합니다." : "이 기기의 인쇄 창으로 엽니다."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-xs leading-relaxed text-ink/55",
			children: "파일을 받지 않고, 이 브라우저에 복사기 종류만 기억합니다."
		}),
		saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onForget,
			className: "mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-2xl border border-ink/15 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
				className: "size-3.5",
				"aria-hidden": "true"
			}), "기억 지우기"]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onRemember,
			className: "mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-2xl border border-ink/15 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, {
				className: "size-3.5",
				"aria-hidden": "true"
			}), "이 복사기 기억하기"]
		})
	] });
}
function OfficeOptions({ paper, gray, duplex, copies, route, locked, onPaper, onGray, onDuplex, onCopies }) {
	const usbJob = route !== "os-print";
	const monoUsb = route === "usb-pcl";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [[
					"A4",
					"A3",
					"B5"
				].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: locked,
					onClick: () => onPaper(item),
					className: `h-10 rounded-full px-3 text-sm disabled:opacity-40 ${paper === item ? "bg-navy text-paper" : "border border-ink/15"}`,
					children: item
				}, item)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: monoUsb || locked,
					onClick: () => onGray(!gray),
					className: `h-10 rounded-full px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${monoUsb || gray ? "bg-navy text-paper" : "border border-ink/15"}`,
					children: monoUsb || gray ? "흑백" : "컬러"
				})]
			}),
			monoUsb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-ink/70",
				children: "USB 기본 인쇄는 흑백만 지원해요. 컬러는 인쇄 창을 이용해 주세요."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex flex-wrap items-center gap-2 ${usbJob && !locked ? "" : "opacity-40"}`,
				children: [
					[
						["simplex", "단면"],
						["long", "긴 쪽 넘김"],
						["short", "짧은 쪽 넘김"]
					].map(([id, text]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !usbJob || locked,
						onClick: () => onDuplex(id),
						className: `h-10 rounded-full px-3 text-sm disabled:cursor-not-allowed ${duplex === id && usbJob ? "bg-navy text-paper" : "border border-ink/15"}`,
						children: text
					}, id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !usbJob || locked,
						className: "size-10 rounded-full border border-ink/15 disabled:cursor-not-allowed",
						onClick: () => onCopies(Math.max(1, copies - 1)),
						"aria-label": "장수 줄이기",
						children: "−"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-8 text-center text-sm tabular-nums",
						children: usbJob ? copies : 1
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !usbJob || locked,
						className: "size-10 rounded-full border border-ink/15 disabled:cursor-not-allowed",
						onClick: () => onCopies(Math.min(9, copies + 1)),
						"aria-label": "장수 늘리기",
						children: "+"
					})
				]
			}),
			usbJob ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-ink/55",
				children: "장수와 양면은 인쇄 창에서 고릅니다."
			})
		]
	});
}
function PrintChooser({ docKind, memo, photoUrl, pdfName, pdfCount, pageMode, pageFrom, pageTo, sending, progress, ready, label, preview, onKind, onMemo, onPhoto, onPdfFile, pdfNeedsKey, onPdfUnlock, onPageMode, onPageFrom, onPageTo, onPrint, onColorPrint, onPdf, onCancel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-4 gap-1 rounded-2xl bg-ink/5 p-1",
				role: "tablist",
				children: [
					["pdf", "PDF 문서"],
					["photo", "사진 인쇄"],
					["memo", "간단 메모"],
					["test", "테스트"]
				].map(([id, text]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "tab",
					"aria-selected": docKind === id,
					onClick: () => {
						if (!sending) onKind(id);
					},
					disabled: sending,
					className: `min-h-10 rounded-xl px-1 py-2 text-xs disabled:opacity-40 ${docKind === id ? "bg-white font-medium" : "text-ink/60"}`,
					children: text
				}, id))
			}),
			docKind === "pdf" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex h-12 cursor-pointer items-center justify-center rounded-xl border border-ink/15 text-sm",
						children: ["PDF 고르기", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: "application/pdf,.pdf",
							disabled: sending,
							className: "sr-only",
							onChange: (event) => onPdfFile(event.target.files?.[0])
						})]
					}),
					pdfName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-ink/70",
						children: [
							pdfName,
							" · 총 ",
							pdfCount,
							"쪽"
						]
					}) : null,
					pdfNeedsKey ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "flex gap-2",
						onSubmit: (event) => {
							event.preventDefault();
							const value = new FormData(event.currentTarget).get("pdf-key");
							onPdfUnlock(typeof value === "string" ? value : "");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "pdf-key",
							type: "password",
							placeholder: "열기 비밀번호",
							className: "h-10 min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							className: "h-10 rounded-xl bg-navy px-3 text-sm text-paper",
							children: "열기"
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: sending,
							onClick: () => onPageMode("all"),
							className: `h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "all" ? "bg-navy text-paper" : "border border-ink/15"}`,
							children: "전체"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: !pdfCount || sending,
							onClick: () => onPageMode("span"),
							className: `h-10 rounded-full px-3 text-sm disabled:opacity-40 ${pageMode === "span" ? "bg-navy text-paper" : "border border-ink/15"}`,
							children: "시작~끝"
						})]
					}),
					pageMode === "span" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: 1,
								max: pdfCount || 1,
								disabled: sending,
								value: pageFrom,
								onChange: (event) => onPageFrom(Number(event.target.value)),
								className: "h-10 w-16 rounded-xl border border-ink/15 bg-white px-2 text-center disabled:opacity-40",
								"aria-label": "시작 페이지"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "~" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: 1,
								max: pdfCount || 1,
								disabled: sending,
								value: pageTo,
								onChange: (event) => onPageTo(Number(event.target.value)),
								className: "h-10 w-16 rounded-xl border border-ink/15 bg-white px-2 text-center disabled:opacity-40",
								"aria-label": "끝 페이지"
							})
						]
					}) : null
				]
			}) : null,
			docKind === "photo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex h-12 cursor-pointer items-center justify-center rounded-xl border border-ink/15 text-sm",
					children: ["사진 고르기", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "file",
						accept: "image/*",
						disabled: sending,
						className: "sr-only",
						onChange: (event) => onPhoto(event.target.files?.[0])
					})]
				})
			}) : null,
			docKind === "memo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: memo,
				onChange: (event) => onMemo(event.target.value),
				rows: 4,
				disabled: sending,
				placeholder: "적을 내용을 적어 주세요",
				className: "mt-3 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none"
			}) : null,
			docKind === "test" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-ink/70",
				children: "연결이 되는지 확인하는 시험 페이지입니다."
			}) : null,
			preview,
			sending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onCancel,
				className: "mt-3 h-12 w-full rounded-2xl border border-ink/15 text-sm",
				children: [
					"취소 · ",
					progress,
					"%"
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onPrint,
						disabled: !ready,
						className: "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-base font-medium text-accent-fg disabled:opacity-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {
							className: "size-5",
							"aria-hidden": "true"
						}), label]
					}),
					onColorPrint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onColorPrint,
						disabled: !ready,
						className: "h-12 w-full rounded-2xl border border-ink/15 text-sm disabled:opacity-40",
						children: "컬러로 인쇄 창 열기"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onPdf,
						disabled: !ready,
						className: "h-12 w-full rounded-2xl border border-ink/15 text-sm disabled:opacity-40",
						children: "PDF로 저장"
					})
				]
			})
		]
	});
}
function PaperPreview({ paper, gray, docKind, title, memo, photoUrl, pdfPreview, pdfCount, previewPage, photoFit, photoTurn, onFit, onTurn, onPreview }) {
	const pageRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (docKind !== "photo" || !photoUrl) return;
		let stop = false;
		const size = previewSize(paper);
		loadImage(photoUrl).then((image) => {
			const canvas = pageRef.current;
			if (stop || !canvas) return;
			canvas.width = size.width;
			canvas.height = size.height;
			drawOfficePage(canvas, {
				kind: "photo",
				title,
				note: "",
				image,
				fit: photoFit,
				turn: photoTurn,
				gray
			});
		}).catch(() => void 0);
		return () => {
			stop = true;
		};
	}, [
		docKind,
		photoUrl,
		paper,
		photoFit,
		photoTurn,
		gray,
		title
	]);
	const emptyPhoto = docKind === "photo" && !photoUrl;
	const emptyMemo = docKind === "memo" && memo.trim().length < 1;
	const emptyPdf = docKind === "pdf" && !pdfPreview;
	const paperClass = paper === "A3" ? "a3" : paper === "B5" ? "b5" : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `preview-stage ${gray ? "gray" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-center text-xs text-ink/70",
				children: [
					paper,
					" 미리보기",
					docKind === "pdf" && pdfCount ? ` · ${previewPage} / ${pdfCount}쪽` : ""
				]
			}),
			docKind === "photo" && photoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: pageRef,
				className: `sheet-a4 ${paperClass}`,
				style: { height: "auto" }
			}) : docKind === "pdf" && pdfPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: pdfPreview,
				alt: "",
				className: `sheet-a4 ${paperClass}`
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `sheet-a4 relative ${paperClass}`,
				children: emptyPhoto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed text-ink/60",
					children: "사진을 고르면 여기에 미리보기가 나타납니다"
				}) : emptyMemo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed text-ink/60",
					children: "메모를 적으면 여기에 미리보기가 나타납니다"
				}) : emptyPdf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "absolute inset-0 grid place-items-center px-4 text-center text-xs leading-relaxed text-ink/60",
					children: "PDF를 고르면 여기에 미리보기가 나타납니다"
				}) : docKind === "memo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "absolute inset-0 overflow-hidden whitespace-pre-wrap p-3 text-left text-[11px] leading-snug",
					children: memo
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-0 p-3 text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] tracking-wide",
						children: "인쇄 확인"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm",
						children: title
					})]
				})
			}),
			docKind === "pdf" && pdfCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: previewPage <= 1,
						onClick: () => onPreview(previewPage - 1),
						className: "h-10 rounded-full border border-ink/15 bg-white px-3 text-sm disabled:opacity-40",
						children: "< 이전"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-16 text-center text-sm tabular-nums",
						children: [
							previewPage,
							" / ",
							pdfCount
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: previewPage >= pdfCount,
						onClick: () => onPreview(Math.min(pdfCount, previewPage + 1)),
						className: "h-10 rounded-full border border-ink/15 bg-white px-3 text-sm disabled:opacity-40",
						children: "다음 >"
					})
				]
			}) : null,
			docKind === "photo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap justify-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: emptyPhoto,
						onClick: () => onFit("contain"),
						className: `h-10 rounded-full px-3 text-sm disabled:opacity-40 ${photoFit === "contain" && !emptyPhoto ? "bg-navy text-paper" : "border border-ink/15 bg-white"}`,
						children: "안 잘리게 맞추기"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: emptyPhoto,
						onClick: () => onFit("cover"),
						className: `h-10 rounded-full px-3 text-sm disabled:opacity-40 ${photoFit === "cover" && !emptyPhoto ? "bg-navy text-paper" : "border border-ink/15 bg-white"}`,
						children: "꽉 채우기"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: emptyPhoto,
						onClick: onTurn,
						className: "h-10 rounded-full border border-ink/15 bg-white px-3 text-sm disabled:opacity-40",
						children: "90도 회전"
					})
				]
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtlasApp, {});
}
//#endregion
export { Home as component };
