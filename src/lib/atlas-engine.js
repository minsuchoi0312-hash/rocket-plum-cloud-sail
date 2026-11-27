/* eslint-disable @typescript-eslint/ban-ts-comment -- 자동 생성한 기종 표라 타입 검사를 끈다 */
// @ts-nocheck
/* Print Atlas pack resolver.
   Classifications follow publicly documented page languages
   (PCL, PostScript, ESC/P-R, IPP, AirPrint, SPL, CAPT, ESC/POS, ZPL).
   This file does not contain third-party driver binaries. */
export const Atlas = (function () {

  const GENERATIONS = {
    legacy: { id: "legacy", label: "구형 호스트", era: "2001–2009", hint: "PC가 점을 찍어서 보내는 방식" },
    classic: { id: "classic", label: "구형 언어", era: "2003–2012", hint: "PCL·ESC/P처럼 프린터 스스로 그리는 방식" },
    transitional: { id: "transitional", label: "전환기", era: "2010–2017", hint: "래스터 팩과 초기 네트워크가 같이 있는 시기" },
    modern: { id: "modern", label: "신형 표준", era: "2016–", hint: "AirPrint·IPP Everywhere로 드라이버 없이 말하는 시기" },
  };

  const PACKS = {
    driverless: {
      id: "driverless",
      name: "표준 티켓",
      tag: "신형",
      summary: "IPP Everywhere, AirPrint, Mopria. 두꺼운 래스터를 받지 않고 인쇄 티켓만 맞춥니다.",
    },
    "raster-ink": {
      id: "raster-ink",
      name: "잉크 래스터",
      tag: "구형·전환기",
      summary: "ESC/P-R, Canon 래스터, HP 잉크 래스터, Brother 잉크. 사진과 여백 없는 인쇄에 필요한 색·용지 조각.",
    },
    "page-lang": {
      id: "page-lang",
      name: "페이지 언어",
      tag: "레이저",
      summary: "PCL 5/XL과 PostScript, BR-Script. 사무실 레이저가 페이지를 직접 해석합니다.",
    },
    "legacy-host": {
      id: "legacy-host",
      name: "호스트 브리지",
      tag: "구형",
      summary: "CAPT, SPL, ZJS처럼 컴퓨터가 점을 만들어 보내야 하는 구형 기기의 번역 조각.",
    },
    "mobile-label": {
      id: "mobile-label",
      name: "라벨·감열",
      tag: "휴대",
      summary: "ESC/POS, ZPL, EPL, ZINK. 영수증·라벨·손바닥 포토 전용 조각.",
    },
  };

  function entry(partial) {
    return Object.assign(
      {
        color: true,
        duplex: false,
        borderless: false,
        photo: false,
        airprint: false,
        connections: ["wifi"],
        year: 2014,
        languages: [],
      },
      partial
    );
  }

  const CATALOG = [
    entry({ id: "ep-c80", brandId: "epson", brand: "Epson", model: "Stylus C80", year: 2001, generation: "classic", pack: "raster-ink", languages: ["ESC/P"], connections: ["usb"], photo: false, family: "stylus" }),
    entry({ id: "ep-cx5400", brandId: "epson", brand: "Epson", model: "Stylus CX5400", year: 2004, generation: "classic", pack: "raster-ink", languages: ["ESC/P"], connections: ["usb"], family: "stylus" }),
    entry({ id: "ep-photo1400", brandId: "epson", brand: "Epson", model: "Stylus Photo 1400", year: 2007, generation: "classic", pack: "raster-ink", languages: ["ESC/P-R"], connections: ["usb"], borderless: true, photo: true, family: "photo" }),
    entry({ id: "ep-t13", brandId: "epson", brand: "Epson", model: "Stylus T13", year: 2010, generation: "classic", pack: "raster-ink", languages: ["ESC/P"], connections: ["usb"], family: "stylus" }),
    entry({ id: "ep-tx100", brandId: "epson", brand: "Epson", model: "Stylus TX100", year: 2008, generation: "classic", pack: "raster-ink", languages: ["ESC/P"], connections: ["usb"], family: "stylus" }),
    entry({ id: "ep-pma890", brandId: "epson", brand: "Epson", model: "PM-A890", year: 2008, generation: "classic", pack: "raster-ink", languages: ["ESC/P-R"], connections: ["usb"], borderless: true, photo: true, family: "pm" }),
    entry({ id: "ep-artisan50", brandId: "epson", brand: "Epson", model: "Artisan 50", year: 2009, generation: "transitional", pack: "raster-ink", languages: ["ESC/P-R"], connections: ["wifi", "usb"], borderless: true, photo: true, family: "artisan" }),
    entry({ id: "ep-wf1100", brandId: "epson", brand: "Epson", model: "WorkForce 1100", year: 2009, generation: "transitional", pack: "raster-ink", languages: ["ESC/P-R"], connections: ["usb", "wifi"], duplex: true, family: "workforce" }),
    entry({ id: "ep-l3150", brandId: "epson", brand: "Epson", model: "L3150", year: 2019, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "ESC/P-R"], connections: ["wifi", "usb"], borderless: true, airprint: true, family: "ecotank" }),
    entry({ id: "ep-l3250", brandId: "epson", brand: "Epson", model: "L3250", year: 2022, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "ESC/P-R"], connections: ["wifi", "usb"], borderless: true, duplex: true, airprint: true, family: "ecotank" }),
    entry({ id: "ep-et2720", brandId: "epson", brand: "Epson", model: "ET-2720", year: 2019, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "ESC/P-R"], connections: ["wifi", "usb"], borderless: true, airprint: true, family: "ecotank" }),
    entry({ id: "ep-et2850", brandId: "epson", brand: "Epson", model: "ET-2850", year: 2022, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "ESC/P-R"], connections: ["wifi", "usb"], borderless: true, duplex: true, airprint: true, family: "ecotank" }),
    entry({ id: "ep-et4850", brandId: "epson", brand: "Epson", model: "ET-4850", year: 2022, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "ESC/P-R"], connections: ["wifi", "usb"], borderless: true, duplex: true, airprint: true, family: "ecotank" }),
    entry({ id: "ep-et8550", brandId: "epson", brand: "Epson", model: "ET-8550", year: 2021, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "ESC/P-R"], connections: ["wifi", "usb"], borderless: true, duplex: true, photo: true, airprint: true, family: "ecotank" }),
    entry({ id: "ep-et16500", brandId: "epson", brand: "Epson", model: "ET-16500", year: 2019, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "ESC/P-R"], connections: ["wifi", "usb"], borderless: true, duplex: true, airprint: true, family: "ecotank" }),

    entry({ id: "hp-1020", brandId: "hp", brand: "HP", model: "LaserJet 1020", year: 2005, generation: "legacy", pack: "legacy-host", languages: ["ZJS 호스트"], connections: ["usb"], color: false, family: "host-laser" }),
    entry({ id: "hp-1018", brandId: "hp", brand: "HP", model: "LaserJet 1018", year: 2006, generation: "legacy", pack: "legacy-host", languages: ["ZJS 호스트"], connections: ["usb"], color: false, family: "host-laser" }),
    entry({ id: "hp-p1102", brandId: "hp", brand: "HP", model: "LaserJet P1102", year: 2010, generation: "legacy", pack: "legacy-host", languages: ["호스트 기반"], connections: ["usb"], color: false, family: "host-laser" }),
    entry({ id: "hp-p1102w", brandId: "hp", brand: "HP", model: "LaserJet Professional P1102w", year: 2011, generation: "legacy", pack: "legacy-host", languages: ["호스트 기반"], connections: ["wifi", "usb"], color: false, family: "host-laser" }),
    entry({ id: "hp-p1606", brandId: "hp", brand: "HP", model: "LaserJet Professional P1606dn", year: 2010, generation: "legacy", pack: "legacy-host", languages: ["호스트 기반"], connections: ["wifi", "usb"], color: false, duplex: true, family: "host-laser" }),
    entry({ id: "hp-m1005", brandId: "hp", brand: "HP", model: "LaserJet M1005", year: 2007, generation: "legacy", pack: "legacy-host", languages: ["호스트 기반"], connections: ["usb"], color: false, family: "host-laser" }),
    entry({ id: "hp-m15w", brandId: "hp", brand: "HP", model: "LaserJet M15w", year: 2018, generation: "legacy", pack: "legacy-host", languages: ["호스트 기반"], connections: ["wifi", "usb"], color: false, family: "host-laser" }),
    entry({ id: "hp-dj2010", brandId: "hp", brand: "HP", model: "DeskJet Ink Advantage 2010", year: 2011, generation: "classic", pack: "raster-ink", languages: ["LIDIL"], connections: ["usb"], borderless: true, family: "deskjet" }),
    entry({ id: "hp-dj2130", brandId: "hp", brand: "HP", model: "DeskJet 2130", year: 2015, generation: "transitional", pack: "raster-ink", languages: ["호스트 래스터"], connections: ["usb"], family: "deskjet" }),
    entry({ id: "hp-dj2720", brandId: "hp", brand: "HP", model: "DeskJet 2720", year: 2020, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "PCL3"], connections: ["wifi", "usb"], airprint: true, family: "deskjet" }),
    entry({ id: "hp-oj100", brandId: "hp", brand: "HP", model: "OfficeJet 100 Mobile", year: 2009, generation: "classic", pack: "page-lang", languages: ["PCL 3"], connections: ["usb", "bluetooth"], family: "officejet" }),
    entry({ id: "hp-oj150", brandId: "hp", brand: "HP", model: "OfficeJet 150 Mobile", year: 2011, generation: "transitional", pack: "page-lang", languages: ["PCL 3"], connections: ["wifi", "usb"], family: "officejet" }),
    entry({ id: "hp-oj3830", brandId: "hp", brand: "HP", model: "OfficeJet 3830", year: 2016, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "PCL"], connections: ["wifi", "usb"], duplex: true, airprint: true, family: "officejet" }),
    entry({ id: "hp-oj9020", brandId: "hp", brand: "HP", model: "OfficeJet Pro 9020", year: 2019, generation: "modern", pack: "driverless", fallback: "page-lang", languages: ["AirPrint", "PCL 6"], connections: ["wifi", "usb"], duplex: true, airprint: true, family: "officejet" }),
    entry({ id: "hp-m404", brandId: "hp", brand: "HP", model: "LaserJet Pro M404dn", year: 2019, generation: "modern", pack: "driverless", fallback: "page-lang", languages: ["AirPrint", "PCL 6", "PostScript"], connections: ["wifi", "usb"], color: false, duplex: true, airprint: true, family: "pcl-laser" }),
    entry({ id: "hp-m428", brandId: "hp", brand: "HP", model: "LaserJet Pro M428fdw", year: 2019, generation: "modern", pack: "driverless", fallback: "page-lang", languages: ["AirPrint", "PCL 6", "PostScript"], connections: ["wifi", "usb"], color: false, duplex: true, airprint: true, family: "pcl-laser" }),
    entry({ id: "hp-envy", brandId: "hp", brand: "HP", model: "ENVY 6055", year: 2020, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint"], connections: ["wifi", "usb"], borderless: true, duplex: true, airprint: true, family: "envy" }),
    entry({ id: "hp-sprocket", brandId: "hp", brand: "HP", model: "Sprocket", year: 2016, generation: "modern", pack: "mobile-label", languages: ["ZINK"], connections: ["bluetooth"], borderless: true, photo: true, family: "zink" }),

    entry({ id: "cn-ip2700", brandId: "canon", brand: "Canon", model: "PIXMA iP2700", year: 2010, generation: "classic", pack: "raster-ink", languages: ["Canon 래스터"], connections: ["usb"], borderless: true, family: "pixma" }),
    entry({ id: "cn-mp140", brandId: "canon", brand: "Canon", model: "PIXMA MP140", year: 2007, generation: "classic", pack: "raster-ink", languages: ["Canon 래스터"], connections: ["usb"], family: "pixma" }),
    entry({ id: "cn-ip5200r", brandId: "canon", brand: "Canon", model: "PIXMA iP5200R", year: 2006, generation: "classic", pack: "raster-ink", languages: ["Canon 래스터"], connections: ["wifi", "usb"], borderless: true, photo: true, family: "pixma" }),
    entry({ id: "cn-mp600r", brandId: "canon", brand: "Canon", model: "PIXMA MP600R", year: 2006, generation: "classic", pack: "raster-ink", languages: ["Canon 래스터"], connections: ["wifi", "usb"], borderless: true, photo: true, family: "pixma" }),
    entry({ id: "cn-mg2500", brandId: "canon", brand: "Canon", model: "PIXMA MG2500", year: 2013, generation: "transitional", pack: "raster-ink", languages: ["Canon 래스터"], connections: ["usb"], borderless: true, family: "pixma" }),
    entry({ id: "cn-mg3620", brandId: "canon", brand: "Canon", model: "PIXMA MG3620", year: 2015, generation: "transitional", pack: "raster-ink", fallback: "driverless", languages: ["AirPrint", "Canon 래스터"], connections: ["wifi", "usb"], borderless: true, airprint: true, family: "pixma" }),
    entry({ id: "cn-mx920", brandId: "canon", brand: "Canon", model: "PIXMA MX920", year: 2012, generation: "transitional", pack: "raster-ink", fallback: "driverless", languages: ["AirPrint", "Canon 래스터"], connections: ["wifi", "usb"], duplex: true, airprint: true, family: "pixma" }),
    entry({ id: "cn-g2010", brandId: "canon", brand: "Canon", model: "PIXMA G2010", year: 2017, generation: "transitional", pack: "raster-ink", languages: ["Canon 래스터"], connections: ["usb"], borderless: true, family: "megatank" }),
    entry({ id: "cn-g3010", brandId: "canon", brand: "Canon", model: "PIXMA G3010", year: 2018, generation: "transitional", pack: "raster-ink", languages: ["Canon 래스터"], connections: ["wifi", "usb"], borderless: true, family: "megatank" }),
    entry({ id: "cn-g6070", brandId: "canon", brand: "Canon", model: "PIXMA G6070", year: 2020, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "Canon 래스터"], connections: ["wifi", "usb"], borderless: true, duplex: true, airprint: true, family: "megatank" }),
    entry({ id: "cn-ts9120", brandId: "canon", brand: "Canon", model: "PIXMA TS9120", year: 2017, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "Canon 래스터"], connections: ["wifi", "usb"], borderless: true, duplex: true, photo: true, airprint: true, family: "pixma" }),
    entry({ id: "cn-gx4020", brandId: "canon", brand: "Canon", model: "MAXIFY GX4020", year: 2022, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint"], connections: ["wifi", "usb"], duplex: true, airprint: true, family: "maxify" }),
    entry({ id: "cn-mf645", brandId: "canon", brand: "Canon", model: "imageCLASS MF645Cx", year: 2019, generation: "modern", pack: "driverless", fallback: "page-lang", languages: ["AirPrint", "UFR II"], connections: ["wifi", "usb"], duplex: true, airprint: true, family: "laser" }),
    entry({ id: "cn-lbp2900", brandId: "canon", brand: "Canon", model: "LBP2900", year: 2005, generation: "legacy", pack: "legacy-host", languages: ["CAPT"], connections: ["usb"], color: false, family: "capt" }),
    entry({ id: "cn-lbp6030", brandId: "canon", brand: "Canon", model: "LBP6030", year: 2012, generation: "legacy", pack: "legacy-host", languages: ["CAPT"], connections: ["usb"], color: false, family: "capt" }),
    entry({ id: "cn-lbp6230", brandId: "canon", brand: "Canon", model: "LBP6230", year: 2014, generation: "transitional", pack: "page-lang", languages: ["UFR II"], connections: ["usb", "wifi"], color: false, family: "ufr" }),
    entry({ id: "cn-mf3010", brandId: "canon", brand: "Canon", model: "MF3010", year: 2012, generation: "legacy", pack: "legacy-host", languages: ["UFR II LT"], connections: ["usb"], color: false, family: "capt" }),
    entry({ id: "cn-selphy", brandId: "canon", brand: "Canon", model: "SELPHY CP1300", year: 2016, generation: "transitional", pack: "raster-ink", languages: ["SELPHY"], connections: ["wifi", "usb"], borderless: true, photo: true, family: "selphy" }),

    entry({ id: "br-hl2240", brandId: "brother", brand: "Brother", model: "HL-2240", year: 2010, generation: "legacy", pack: "legacy-host", languages: ["호스트 기반"], connections: ["usb"], color: false, family: "host-laser" }),
    entry({ id: "br-hl2270", brandId: "brother", brand: "Brother", model: "HL-2270DW", year: 2011, generation: "transitional", pack: "page-lang", fallback: "driverless", languages: ["PCL", "AirPrint"], connections: ["wifi", "usb"], color: false, duplex: true, airprint: true, family: "pcl-laser" }),
    entry({ id: "br-hl2350", brandId: "brother", brand: "Brother", model: "HL-L2350DW", year: 2019, generation: "modern", pack: "driverless", fallback: "page-lang", languages: ["AirPrint", "PCL"], connections: ["wifi", "usb"], color: false, duplex: true, airprint: true, family: "pcl-laser" }),
    entry({ id: "br-mfcl2750", brandId: "brother", brand: "Brother", model: "MFC-L2750DW", year: 2018, generation: "modern", pack: "driverless", fallback: "page-lang", languages: ["AirPrint", "PCL", "BR-Script"], connections: ["wifi", "usb"], color: false, duplex: true, airprint: true, family: "pcl-laser" }),
    entry({ id: "br-t220", brandId: "brother", brand: "Brother", model: "DCP-T220", year: 2020, generation: "transitional", pack: "raster-ink", languages: ["Brother 잉크"], connections: ["usb"], borderless: true, family: "ink" }),
    entry({ id: "br-t420w", brandId: "brother", brand: "Brother", model: "DCP-T420W", year: 2021, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "Brother 잉크"], connections: ["wifi", "usb"], borderless: true, airprint: true, family: "ink" }),
    entry({ id: "br-j1205", brandId: "brother", brand: "Brother", model: "MFC-J1205W", year: 2022, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint"], connections: ["wifi", "usb"], borderless: true, airprint: true, family: "ink" }),
    entry({ id: "br-ql800", brandId: "brother", brand: "Brother", model: "QL-800", year: 2017, generation: "transitional", pack: "mobile-label", languages: ["래스터 라벨"], connections: ["usb"], color: false, family: "label" }),
    entry({ id: "br-ql820", brandId: "brother", brand: "Brother", model: "QL-820NWB", year: 2017, generation: "modern", pack: "mobile-label", languages: ["래스터 라벨", "AirPrint"], connections: ["wifi", "bluetooth", "usb"], airprint: true, family: "label" }),

    entry({ id: "ss-ml1660", brandId: "samsung", brand: "Samsung", model: "ML-1660", year: 2010, generation: "legacy", pack: "legacy-host", languages: ["SPL"], connections: ["usb"], color: false, family: "spl" }),
    entry({ id: "ss-ml2160", brandId: "samsung", brand: "Samsung", model: "ML-2160", year: 2012, generation: "legacy", pack: "legacy-host", languages: ["SPL"], connections: ["usb"], color: false, family: "spl" }),
    entry({ id: "ss-m2020", brandId: "samsung", brand: "Samsung", model: "Xpress M2020", year: 2014, generation: "transitional", pack: "legacy-host", languages: ["SPL"], connections: ["usb"], color: false, family: "spl" }),
    entry({ id: "ss-c480w", brandId: "samsung", brand: "Samsung", model: "Xpress C480W", year: 2014, generation: "transitional", pack: "page-lang", fallback: "legacy-host", languages: ["PCL", "SPL"], connections: ["wifi", "usb"], duplex: true, family: "spl" }),

    entry({ id: "xe-3020", brandId: "xerox", brand: "Xerox", model: "Phaser 3020", year: 2014, generation: "legacy", pack: "legacy-host", languages: ["호스트 기반"], connections: ["wifi", "usb"], color: false, family: "host-laser" }),
    entry({ id: "xe-6515", brandId: "xerox", brand: "Xerox", model: "VersaLink C405", year: 2017, generation: "modern", pack: "driverless", fallback: "page-lang", languages: ["AirPrint", "PCL 6", "PostScript"], connections: ["wifi", "usb"], duplex: true, airprint: true, family: "pcl-laser" }),

    entry({ id: "sd-d450", brandId: "sindoh", brand: "Sindoh", model: "D450", year: 2019, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "sd-d452", brandId: "sindoh", brand: "Sindoh", model: "D452", year: 2020, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "sd-d330", brandId: "sindoh", brand: "Sindoh", model: "D330", year: 2018, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "sd-n610", brandId: "sindoh", brand: "Sindoh", model: "N610", year: 2021, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "cn-c3530", brandId: "canon", brand: "Canon", model: "imageRUNNER ADVANCE C3530", year: 2017, generation: "modern", pack: "page-lang", languages: ["UFR II", "PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "cn-c3830", brandId: "canon", brand: "Canon", model: "imageRUNNER ADVANCE C3830", year: 2019, generation: "modern", pack: "page-lang", languages: ["UFR II", "PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "cn-dx3926", brandId: "canon", brand: "Canon", model: "imageRUNNER ADVANCE DX C3926", year: 2021, generation: "modern", pack: "page-lang", languages: ["UFR II", "PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "fx-c2570", brandId: "xerox", brand: "Fujifilm", model: "Apeos C2570", year: 2021, generation: "modern", pack: "page-lang", languages: ["PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "fx-c3070", brandId: "xerox", brand: "Fujifilm", model: "Apeos C3070", year: 2021, generation: "modern", pack: "page-lang", languages: ["PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "fx-dc7", brandId: "xerox", brand: "Fujifilm", model: "DocuCentre-VII", year: 2016, generation: "modern", pack: "page-lang", languages: ["PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "rc-c2000", brandId: "ricoh", brand: "Ricoh", model: "IM C2000", year: 2019, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "rc-c3000", brandId: "ricoh", brand: "Ricoh", model: "IM C3000", year: 2019, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "rc-mpc3004", brandId: "ricoh", brand: "Ricoh", model: "MP C3004", year: 2015, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "km-c250i", brandId: "konica", brand: "Konica Minolta", model: "bizhub C250i", year: 2020, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "km-c300i", brandId: "konica", brand: "Konica Minolta", model: "bizhub C300i", year: 2020, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "km-c360i", brandId: "konica", brand: "Konica Minolta", model: "bizhub C360i", year: 2020, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "ky-2554", brandId: "kyocera", brand: "Kyocera", model: "TASKalfa 2554ci", year: 2021, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "ky-3554", brandId: "kyocera", brand: "Kyocera", model: "TASKalfa 3554ci", year: 2021, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "ss-k4350", brandId: "samsung", brand: "Samsung", model: "SL-K4350", year: 2016, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "ss-x4300", brandId: "samsung", brand: "Samsung", model: "SL-X4300", year: 2016, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),
    entry({ id: "hp-e78523", brandId: "hp", brand: "HP", model: "LaserJet Managed E78523", year: 2022, generation: "modern", pack: "page-lang", languages: ["PCL5e", "PCL 6", "PDF", "PostScript"], connections: ["wifi", "usb"], duplex: true, family: "office" }),

    entry({ id: "zb-zd220", brandId: "zebra", brand: "Zebra", model: "ZD220", year: 2018, generation: "modern", pack: "mobile-label", languages: ["ZPL"], connections: ["usb"], color: false, family: "zpl" }),
    entry({ id: "zb-gk420", brandId: "zebra", brand: "Zebra", model: "GK420d", year: 2009, generation: "classic", pack: "mobile-label", languages: ["ZPL", "EPL"], connections: ["usb"], color: false, family: "zpl" }),
    entry({ id: "ep-tmt20", brandId: "epson", brand: "Epson", model: "TM-T20", year: 2011, generation: "classic", pack: "mobile-label", languages: ["ESC/POS"], connections: ["usb", "wifi"], color: false, family: "receipt" }),
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
    generic: "일반",
  };

function keyOf(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/프린터|시리즈|series|printer/g, "")
    .replace(/[^a-z0-9가-힣]+/g, "");
}

function expand(value) {
  let text = String(value || "").toLowerCase();
  const pairs = [
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
    [/스프라켓/g, "sprocket"],
  ];
  pairs.forEach(([pattern, to]) => {
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
      const duplicated = brand && model.toLowerCase().startsWith(brand.toLowerCase());
      return { text: duplicated ? model : `${brand} ${model}`.trim(), cmd: cmd ? cmd[1].trim() : "", pasted: true };
    }
    const cmdOnly = /(?:CMD|COMMAND SET):([^;]+)/i.exec(raw);
    return { text: raw, cmd: cmdOnly ? cmdOnly[1].trim() : "", pasted: false };
  }

  function detectBrand(text) {
    const t = text.toLowerCase();
    const rules = [
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
      ["fujitsu", /fujitsu|후지쯔|\bdl-?\d/],
    ];
    for (const [id, re] of rules) if (re.test(t)) return id;
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
      const tokens = expanded
        .split(/[^a-z0-9가-힣]+/)
        .filter((token) => token.length >= 2);
      if (tokens.length && tokens.every((token) => full.includes(keyOf(token)) || modelKey.includes(keyOf(token)))) {
        score = 86;
      }
    }
    return { printer, score };
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
      const modelNums = modelKey.match(/\d{3,}/g) || [];
      if (!modelNums.includes(nums[0])) return false;
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
      else hits.push({ printer: precise[0], score: 96 });
    }
  }

  return hits
    .filter((hit) => hit.score >= 80)
    .sort((a, b) => b.score - a.score || a.printer.model.length - b.printer.model.length);
}

  function profileFromSignals(text, brandId, cmd) {
    const t = `${text} ${cmd}`.toLowerCase();
    const has = (re) => re.test(t);
    const brand = brandId || "generic";
    const named = BRAND_NAMES[brand] || "일반";

    if (has(/sprocket|스프라켓|zink/)) {
      return skeleton({ brandId: brand === "generic" ? "hp" : brand, brand: brand === "generic" ? "HP" : named, generation: "modern", pack: "mobile-label", languages: ["ZINK"], connections: ["bluetooth"], photo: true, borderless: true, family: "zink", reason: "손바닥 포토(ZINK)로 읽혔습니다." });
    }
    if (has(/zpl|\bzd\d|\bgk420|zebra|제브라/)) {
      return skeleton({ brandId: "zebra", brand: "Zebra", generation: "modern", pack: "mobile-label", languages: ["ZPL"], connections: ["usb"], color: false, family: "zpl", reason: "라벨 명령 ZPL로 읽혔습니다." });
    }
    if (has(/\bepl\b|eltron/)) {
      return skeleton({ brandId: "zebra", brand: "Zebra", generation: "classic", pack: "mobile-label", languages: ["EPL"], connections: ["usb"], color: false, family: "epl", reason: "구형 라벨 명령 EPL로 읽혔습니다." });
    }
    if ((brand === "fujitsu" || has(/fujitsu|후지쯔/)) && has(/\bdl-?\d|도트/)) {
      return skeleton({ brandId: "fujitsu", brand: "Fujitsu", generation: "classic", pack: "page-lang", languages: ["ESC/P"], connections: ["usb"], color: false, family: "dot", reason: "후지쯔 도트입니다. ESC/P 문자로 찍습니다." });
    }
    if (has(/esc\/?pos|tm-t|영수증|감열|gwp-?\s?80|mini printer|미니 프린터/)) {
      return skeleton({ brandId: brand === "generic" ? "epson" : brand, brand: brand === "generic" ? "Epson" : named, generation: "classic", pack: "mobile-label", languages: ["ESC/POS"], connections: ["usb", "bluetooth"], color: false, family: "receipt", reason: "영수증·감열 명령으로 읽혔습니다." });
    }
    if (has(/\bql-/)) {
      return skeleton({ brandId: "brother", brand: "Brother", generation: has(/nwb|airprint/) ? "modern" : "transitional", pack: "mobile-label", languages: ["래스터 라벨"], connections: has(/nwb|wifi/) ? ["wifi", "usb"] : ["usb"], color: false, airprint: has(/airprint|nwb/), family: "label", reason: "Brother 라벨 프린터로 읽혔습니다." });
    }

    if (has(/\bcapt\b/) || (brand === "canon" && has(/lbp\s?-?(2900|3000|3010|3050|6000|6020|6030)|mf3010/))) {
      return skeleton({ brandId: "canon", brand: "Canon", generation: "legacy", pack: "legacy-host", languages: ["CAPT"], connections: ["usb"], color: false, family: "capt", reason: "CAPT·UFR LT 계열 구형 레이저로 읽혔습니다. 페이지 언어 팩으로는 안 맞습니다." });
    }
    if (brand === "samsung" && has(/ml-|scx-/) && !has(/airprint|urf|pcl/)) {
      return skeleton({ brandId: "samsung", brand: "Samsung", generation: "legacy", pack: "legacy-host", languages: ["SPL"], connections: ["usb"], color: false, family: "spl", reason: "삼성 SPL 구형 레이저로 읽혔습니다." });
    }
    if (brand === "hp" && has(/1020|1018|1010|1022|p1005|p1006|p1102|p1505|p1606|m1005|\bm15\b|\bm28\b/)) {
      return skeleton({ brandId: "hp", brand: "HP", generation: "legacy", pack: "legacy-host", languages: ["호스트 기반"], connections: has(/w\b|wifi|dn\b/) ? ["wifi", "usb"] : ["usb"], color: false, duplex: has(/dn\b/), family: "host-laser", reason: "PCL이 없는 HP 호스트 기반 레이저로 읽혔습니다." });
    }
    if (brand === "brother" && has(/hl-?(11|12|21|22)\d{2}|dcp-?15\d{2}|dcp-?16\d{2}|dcp-?705|dcp-?706|mfc-?181|mfc-?7360|hl-2240|hl-2140|hl-1110|hl-1200/)) {
      return skeleton({ brandId: "brother", brand: "Brother", generation: "legacy", pack: "legacy-host", languages: ["호스트 기반"], connections: ["usb"], color: false, family: "host-laser", reason: "호스트 기반 구형 Brother 레이저로 읽혔습니다." });
    }
    if (brand === "xerox" && has(/3020|3010|3040/)) {
      return skeleton({ brandId: "xerox", brand: "Xerox", generation: "legacy", pack: "legacy-host", languages: ["호스트 기반"], connections: ["usb", "wifi"], color: false, family: "host-laser", reason: "호스트 기반 구형 Xerox로 읽혔습니다." });
    }

    const modernHint = has(/airprint|mopria|ipp everywhere|image\/urf|\burf\b|pwg-raster|driverless|드라이버리스/);

    if (brand === "epson") {
      if (has(/\blq-|\blx-|\bfx-|\bplq-|\bdlq-/)) {
        return skeleton({ brandId, brand: named, generation: "classic", pack: "page-lang", languages: ["ESC/P"], connections: ["usb"], color: false, family: "dot", reason: "도트 매트릭스입니다. ESC/P 문자로 찍고, USB가 열려 있으면 그 명령을 바로 넣습니다." });
      }
      if (has(/stylus|스타일러스|\bcx\d|\bc80\b|\bt1[0-9]\b|\bt2[0-3]\b|\btx\d|pm-a|photo 1|\bsx-/)) {
        return skeleton({ brandId, brand: named, generation: "classic", pack: "raster-ink", languages: ["ESC/P"], connections: ["usb"], borderless: has(/photo/), photo: has(/photo/), family: "stylus", reason: "ESC/P 시대 Stylus·SX 계열로 읽혔습니다." });
      }
      if (has(/\bwf-|\bxp-[3-9]/)) {
        return skeleton({ brandId, brand: named, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "ESC/P-R"], connections: ["wifi", "usb"], borderless: true, airprint: true, family: "workforce", reason: "WorkForce·XP 상위 기종은 표준 티켓이 먼저이고, 거절되면 ESC/P-R입니다." });
      }
      if (has(/\bxp-[12]/)) {
        return skeleton({ brandId, brand: named, generation: "transitional", pack: "raster-ink", languages: ["ESC/P-R"], connections: ["wifi", "usb"], borderless: true, family: "xp", reason: "초기 XP 시리즈는 잉크 래스터가 맞습니다." });
      }
      if (has(/\bet-?\d|\becotank\b|\bl[4-9]\d{3}\b|\bl1\d{4}\b/) || modernHint) {
        return skeleton({ brandId, brand: named, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "ESC/P-R"], connections: ["wifi", "usb"], borderless: true, duplex: has(/4850|8550|16500|l426|l6|wf-/), airprint: true, family: "ecotank", reason: "에코탱크·ET 계열은 표준 티켓이 먼저이고, 거절되면 ESC/P-R 래스터로 내려갑니다." });
      }
      if (has(/\bl\d{3,4}\b|workforce|artisan/)) {
        const num = parseInt((/\bl(\d{3,4})\b/.exec(t) || [])[1] || "0", 10);
        if (num >= 3150 || has(/workforce [4-9]|wf-[4-9]/)) {
          return skeleton({ brandId, brand: named, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "ESC/P-R"], connections: ["wifi", "usb"], borderless: true, airprint: true, family: "ecotank", reason: "번호대가 신형 잉크탱크·WorkForce라 표준 티켓을 먼저 고릅니다." });
        }
        return skeleton({ brandId, brand: named, generation: "transitional", pack: "raster-ink", languages: ["ESC/P-R"], connections: ["usb", "wifi"], borderless: true, family: "ecotank", reason: "초기 L 시리즈·Artisan은 잉크 래스터가 맞습니다. AirPrint가 없는 모델이 많습니다." });
      }
    }

    if (brand === "canon") {
      if (has(/selphy|셀피/)) {
        return skeleton({ brandId, brand: named, generation: "transitional", pack: "raster-ink", languages: ["SELPHY"], connections: ["wifi", "usb"], borderless: true, photo: true, family: "selphy", reason: "셀피는 작은 염료승화 포토라 잉크 래스터 조각을 씁니다." });
      }
      if (has(/\blbp\b/)) {
        return skeleton({ brandId, brand: named, generation: has(/6230|7100|226|airprint/) ? "transitional" : "legacy", pack: has(/6230|7100|226dw|ufr ii|pcl/) ? "page-lang" : "legacy-host", languages: [has(/6230|ufr/) ? "UFR II" : "CAPT"], connections: ["usb"], color: has(/color|컬러/), family: "laser", reason: "Canon 레이저는 CAPT면 호스트 브리지, UFR·PCL이면 페이지 언어입니다." });
      }
      if (has(/\b(ts|tr)\s?-?\d|imageclass|maxify|\bgx\s?-?\d|\bg[5-7]\d{3}\b/) || modernHint) {
        return skeleton({ brandId, brand: named, generation: "modern", pack: "driverless", fallback: "raster-ink", languages: ["AirPrint", "Canon 래스터"], connections: ["wifi", "usb"], borderless: true, duplex: true, airprint: true, family: "pixma", reason: "TS·TR·GX·상위 G 시리즈는 표준 티켓이 먼저입니다." });
      }
      if (has(/\bg\s?-?[1-4]0\d{2}\b|\bg2010\b|\bg3010\b|\bg4010\b/)) {
        return skeleton({ brandId, brand: named, generation: "transitional", pack: "raster-ink", languages: ["Canon 래스터"], connections: has(/3010|4010|3411|wifi/) ? ["wifi", "usb"] : ["usb"], borderless: true, family: "megatank", reason: "초기 메가탱크(G2010·G3010대)는 AirPrint가 없는 경우가 많아 잉크 래스터를 고릅니다." });
      }
      return skeleton({ brandId, brand: named, generation: "classic", pack: "raster-ink", languages: ["Canon 래스터"], connections: ["usb"], borderless: true, family: "pixma", reason: "PIXMA iP·MP·MG 구형은 Canon 래스터 조각이 맞습니다." });
    }

    if (brand === "hp") {
      if (has(/envy|officejet pro|pagewide|m40\d|m42\d|m45\d|m47\d|mfp m[2-9]|deskjet 27|deskjet 37|deskjet 41|deskjet plus|smart tank 6|smart tank 7/) || modernHint) {
        const laser = has(/laserjet|레이저/);
        return skeleton({ brandId, brand: named, generation: "modern", pack: "driverless", fallback: laser ? "page-lang" : "raster-ink", languages: laser ? ["AirPrint", "PCL 6"] : ["AirPrint"], connections: ["wifi", "usb"], color: !laser, duplex: true, airprint: true, family: laser ? "pcl-laser" : "deskjet", reason: "신형 HP는 표준 티켓이 먼저이고, 레이저는 PCL, 잉크는 래스터로 내려갑니다." });
      }
      if (has(/laserjet|레이저젯/)) {
        return skeleton({ brandId, brand: named, generation: "classic", pack: "page-lang", languages: ["PCL 5"], connections: ["wifi", "usb"], color: has(/color|컬러|cp|mfp m/), duplex: has(/dn|duplex|양면/), family: "pcl-laser", reason: "구형 번호가 아닌 LaserJet이라 PCL 페이지 언어를 고릅니다. 1020·P1102처럼 호스트 기반이면 모델 번호를 더 넣어 주세요." });
      }
      return skeleton({ brandId, brand: named, generation: "transitional", pack: "raster-ink", languages: ["잉크 래스터"], connections: ["usb"], borderless: true, family: "deskjet", reason: "번호가 낮은 DeskJet·Ink Advantage로 보고 잉크 래스터를 고릅니다." });
    }

    if (brand === "brother") {
      if (has(/hl-l|mfc-l|dcp-l/) || modernHint) {
        return skeleton({ brandId, brand: named, generation: "modern", pack: "driverless", fallback: "page-lang", languages: ["AirPrint", "PCL"], connections: ["wifi", "usb"], color: has(/color|컬러|cdw|mfc-j/), duplex: true, airprint: true, family: "pcl-laser", reason: "Brother L 시리즈 레이저는 표준 티켓, 실패 시 PCL입니다." });
      }
      if (has(/mfc-j|dcp-j|dcp-t|mfc-t/)) {
        const newer = has(/t4|t5|t7|t8|j120|j130|airprint/);
        return skeleton({ brandId, brand: named, generation: newer ? "modern" : "transitional", pack: newer ? "driverless" : "raster-ink", fallback: "raster-ink", languages: newer ? ["AirPrint", "Brother 잉크"] : ["Brother 잉크"], connections: has(/w\b|wifi/) || newer ? ["wifi", "usb"] : ["usb"], borderless: true, airprint: newer, family: "ink", reason: newer ? "무선 잉크탱크 Brother는 표준 티켓을 먼저 씁니다." : "초기 Brother 잉크는 전용 래스터가 맞습니다." });
      }
      if (has(/dw\b/)) {
        return skeleton({ brandId, brand: named, generation: "transitional", pack: "page-lang", fallback: "driverless", languages: ["PCL", "AirPrint"], connections: ["wifi", "usb"], color: false, duplex: true, airprint: true, family: "pcl-laser", reason: "DW가 붙은 구형 Brother 레이저는 PCL이 본팩입니다." });
      }
    }

    if (brand === "samsung" || brand === "xerox") {
      if (modernHint || has(/versalink|workcentre|c405|pcl/)) {
        return skeleton({ brandId: brand, brand: named, generation: "modern", pack: "driverless", fallback: "page-lang", languages: ["AirPrint", "PCL 6"], connections: ["wifi", "usb"], airprint: true, duplex: true, family: "pcl-laser", reason: "신형 사무 복합기는 표준 티켓 다음 PCL입니다." });
      }
      return skeleton({ brandId: brand, brand: named, generation: "transitional", pack: "legacy-host", languages: ["SPL"], connections: ["usb"], color: has(/color|컬러|c48/), family: "spl", reason: "Xpress·Phaser 일부는 아직 SPL·호스트 기반입니다." });
    }

    if (brand === "pantum") {
      const pcl = has(/p3|m67|bm5|pcl/);
      return skeleton({ brandId, brand: named, generation: pcl ? "classic" : "legacy", pack: pcl ? "page-lang" : "legacy-host", languages: pcl ? ["PCL"] : ["호스트 기반"], connections: ["wifi", "usb"], color: has(/color|컬러/), family: pcl ? "pcl-laser" : "host-laser", reason: pcl ? "Pantum 상위 기종은 PCL로 봅니다." : "Pantum 보급 기종은 호스트 기반인 경우가 많습니다." });
    }

    if (brand === "oki" && has(/microline|ml3[02]|ml5[09]/)) {
      return skeleton({ brandId, brand: named, generation: "classic", pack: "page-lang", languages: ["ESC/P"], connections: ["usb"], color: false, family: "dot", reason: "OKI 도트입니다. ESC/P에 가까운 문자로 찍습니다." });
    }

    if (["kyocera", "ricoh", "oki", "lexmark", "dell", "sindoh", "sharp", "konica", "toshiba"].includes(brand)) {
      return skeleton({
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
        reason: modernHint ? "사무 레이저에 AirPrint 문구가 있어 표준 티켓을 먼저 둡니다." : "사무 레이저로 보고 PCL을 기본으로 둡니다.",
      });
    }

    if (["bixolon", "star", "citizen"].includes(brand)) {
      return skeleton({ brandId, brand: named, generation: "classic", pack: "mobile-label", languages: ["ESC/POS"], connections: ["usb", "bluetooth"], color: false, family: "receipt", reason: "영수증 프린터입니다. ESC/POS로 글자를 넣고, USB가 열려 있으면 바로 보냅니다." });
    }

    if (brand === "tsc") {
      return skeleton({ brandId, brand: named, generation: "classic", pack: "mobile-label", languages: ["TSPL"], connections: ["usb"], color: false, family: "tspl", reason: "라벨 프린터입니다. TSPL로 한 장을 찍습니다. ZPL 기종과 명령이 다릅니다." });
    }

    if (modernHint) {
      return skeleton({ brandId: brand, brand: named, generation: "modern", pack: "driverless", fallback: "page-lang", languages: ["AirPrint", "IPP"], connections: ["wifi"], airprint: true, family: "ipp", reason: "AirPrint·IPP 문구가 있어 표준 티켓을 고릅니다. 제조사를 같이 적으면 폴백이 정확해집니다." });
    }
    if (has(/\bpcl\b|postscript|br-script/)) {
      return skeleton({ brandId: brand, brand: named, generation: "classic", pack: "page-lang", languages: ["PCL"], connections: ["wifi", "usb"], family: "pcl", reason: "PCL·PostScript 문구가 있어 페이지 언어를 고릅니다." });
    }

    return skeleton({
      brandId: brand,
      brand: named,
      generation: "classic",
      pack: "page-lang",
      languages: ["일반 PCL"],
      connections: ["wifi", "usb"],
      family: "unknown",
      reason: "카탈로그에 없는 이름이라 사무실에서 가장 흔한 페이지 언어로 일단 놓았습니다. 제조사와 모델 번호를 더 적어 주면 구형 호스트와 신형 표준을 다시 가릅니다.",
      weak: true,
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
      ...partial,
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
      pack: item.pack,
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
        family: printer.family,
      },
      generation,
      pack: PACKS[packId],
      fallback: printer.fallback ? PACKS[printer.fallback] : null,
      alternatives,
      log: meta.log,
    };
  }

  function match(input, cmdHint) {
    const parsed = parseIdentity(input);
    const text = parsed.text.replace(/\s+/g, " ").trim();
    const cmd = parsed.cmd || String(cmdHint || "").trim();
    if (!text) return { kind: "empty" };

    const hits = searchCatalog(text);
    const brandId = detectBrand(`${text} ${cmd}`);
    const log = [
      { step: "읽기", detail: parsed.pasted ? "MFG·MDL은 모델로, CMD는 명령 힌트로 나눴습니다." : "모델 이름을 정규화했습니다." },
      { step: "제조사", detail: brandId ? `${BRAND_NAMES[brandId]} 계열로 봤습니다.` : "제조사 단서가 약합니다." },
    ];
    if (cmd) log.push({ step: "명령", detail: `CMD에서 ${cmd} 를 봤습니다.` });

    if (hits.length === 1 || (hits.length > 1 && hits[0].score >= 90 && hits[0].score - hits[1].score >= 4)) {
      log.push({ step: "카탈로그", detail: `${hits[0].printer.brand} ${hits[0].printer.model} 과 가장 가깝습니다.` });
      log.push({ step: "세대", detail: `${GENERATIONS[hits[0].printer.generation].label} · ${GENERATIONS[hits[0].printer.generation].era}` });
      log.push({ step: "팩", detail: `${PACKS[hits[0].printer.pack].name} 을 조립합니다.` });
      return fromPrinter(hits[0].printer, {
        query: text,
        source: "catalog",
        confidence: hits[0].score,
        alternatives: hits.slice(1).map((hit) => hit.printer),
        log,
      });
    }

    if (hits.length >= 4 && hits[0].score < 93 && keyOf(text).length < 8) {
      log.push({ step: "목록", detail: "이름이 넓어서 모델을 먼저 고르게 합니다." });
      return {
        kind: "list",
        query: text,
        log,
        hits: hits.slice(0, 8).map((hit) => hit.printer),
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
    if (namedBrand && namedBrand !== "일반" && text.toLowerCase().startsWith(`${namedBrand.toLowerCase()} `)) {
      inferred.model = text.slice(namedBrand.length).trim();
    } else {
      inferred.model = text;
    }
    log.push({ step: "추론", detail: inferred.reason });
    log.push({ step: "세대", detail: `${GENERATIONS[inferred.generation].label} · ${GENERATIONS[inferred.generation].era}` });
    log.push({ step: "팩", detail: `${PACKS[inferred.pack].name} 을 조립합니다.` });
    return fromPrinter(inferred, {
      query: text,
      source: inferred.weak ? "unknown" : "heuristic",
      confidence,
      reason: inferred.reason,
      alternatives: hits.slice(0, 3).map((hit) => hit.printer),
      log,
    });
  }

  return { GENERATIONS, PACKS, match };
})();
