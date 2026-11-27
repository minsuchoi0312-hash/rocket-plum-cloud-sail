/**
 * 앱 공용 효과 훅 (atlas-app.tsx에서 분리): 링크 자동 연결 · 저장된 PC 도우미 확인 · 파일 끌어놓기/붙여넣기 · 오프라인 감지.
 * 모두 useEffect 안에서만 window·localStorage에 닿는다(SSR 안전).
 */
import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { diag } from "@/lib/diag";
import { helperDiscover, helperInfo, helperPing, helperProgress } from "@/lib/helper-send";
import { isValidIPv4, isValidSubnet, scanLan, type ScanProgress } from "@/lib/lan-find";
import type { LinkTab } from "@/lib/app-utils";
import { m, tr, useI18n, type Msg } from "@/lib/i18n";
import { parseConnectLink, type ConnectInfo } from "@/lib/connect-link";
import type { HelperStatus } from "@/components/printer-panel";
import { isPhoneHelper, phoneApp } from "@/lib/phone-helper";

type Set<T> = Dispatch<SetStateAction<T>>;

/**
 * 프린터 연결 링크 적용: ?helper=…&code=… / ?ip=…&name=… 로 열리면 자동 연결하고, 주소창에서 코드를 지운다.
 * 돌려주는 applyLink(글)는 QR 찍기 · 앱 링크(nugunaprint://connect)도 같은 길로 연결한다 — 연결 링크가 아니면 false.
 * 앱에서는 window.__nugunaApplyLink 로도 열어 둔다(android-main 이 앱 링크를 넘긴다).
 */
export function useLinkParams(h: {
  setHelperUrl: Set<string>;
  setHelperCode: Set<string>;
  setUseHelper: Set<boolean>;
  setLinkTab: Set<LinkTab>;
  setLinkOpen: Set<boolean>;
  setHelperOk: Set<boolean>;
  setLanNote: Set<Msg>;
  setSubnetInput: Set<string>;
  setNotice: Set<Msg>;
  addWifi: (host: string, answered: boolean, opts?: { title?: string; subtitle?: Msg; query?: string; select?: boolean }) => unknown;
  rememberHost: (host: string, title: string, viaHelper: boolean) => void;
}) {
  const latest = useRef(h);
  latest.current = h;
  // 언어 감지가 끝난 뒤 한 번만 처리해야 안내 문구가 고른 언어로 나와요.
  const { ready } = useI18n();

  const apply = useCallback((info: ConnectInfo, allowHelper: boolean) => {
    const { setHelperUrl, setHelperCode, setUseHelper, setLinkTab, setLinkOpen, setHelperOk, setLanNote, setSubnetInput, setNotice, addWifi, rememberHost } = latest.current;
    /* 앱에서는 받은 링크로 도우미를 바꾸지 않는다 — 폰 안 도우미 대신 남의 PC로 인쇄가 새지 않게 */
    const helper = allowHelper ? info.helper : "";
    const code = helper ? info.code : "";
    const { ip, name } = info;
    let helperLinked = false;
    if (/^https?:\/\/[^\s/]+(:\d+)?\/?$/i.test(helper)) {
      setHelperUrl(helper.replace(/\/$/, ""));
      if (code) setHelperCode(code);
      setUseHelper(true);
      setLinkTab("helper");
      setLinkOpen(true);
      helperLinked = true;
      void helperPing(helper)
        .then(() => {
          setHelperOk(true);
          setLanNote(m("fx.linkHelper"));
          return code ? helperInfo(helper, code) : null;
        })
        .then((res) => {
          if (res?.subnets[0]) setSubnetInput(res.subnets[0]);
        })
        .catch(() => setLanNote(m("fx.linkHelperDown")));
    }
    if (isValidIPv4(ip)) {
      addWifi(ip, false, { title: name || tr("fx.printerIp", { ip }), subtitle: m("fx.viaLink", { ip }), query: name || ip });
      rememberHost(ip, name || tr("fx.printerIp", { ip }), Boolean(helper));
      if (!helper) setLinkTab("wifi");
    }
    /* 키로 담아 두면 언어를 바꿔도 바로 다시 번역돼요 */
    const target = isValidIPv4(ip) ? name || ip : "";
    if (!helperLinked && !target) return false;
    setNotice(target ? m(helperLinked ? "fx.linkedBoth" : "fx.linked", { name: target }) : m("fx.linkedHelperOnly"));
    diag(tr("fx.logLink", { helper: helper ? tr("fx.logHelper") : "", ip: ip ? `ip=${ip}` : "" }));
    return true;
  }, []);

  const applyLink = useCallback(
    (text: string) => {
      const info = parseConnectLink(text);
      return info ? apply(info, !phoneApp()) : false;
    },
    [apply],
  );

  useEffect(() => {
    if (!ready) return;
    /* 웹 주소창 ?ip= · #ip= (이 페이지 자체로 열렸으니 도우미도 받는다) */
    const info = parseConnectLink(window.location.href);
    if (info) {
      apply(info, true);
      /* 연결 코드가 주소창·방문 기록에 남지 않게 */
      const keepHash = /(^|[#&])(ip|helper|code)=/.test(window.location.hash) ? "" : window.location.hash;
      window.history.replaceState(null, "", `${window.location.pathname}${keepHash}`);
    }
    const w = window as { __nugunaApplyLink?: (text: string) => boolean };
    w.__nugunaApplyLink = applyLink;
    window.dispatchEvent(new Event("nuguna-link-ready"));
    return () => {
      delete w.__nugunaApplyLink;
    };
  }, [ready, apply, applyLink]);

  return applyLink;
}

/** 이전에 연결한 PC 도우미가 있으면 /info를 1.5초 안에 한 번 찔러 상태를 바로 보여 주고, 연결되면 기억한다 */
export function useSavedHelper(h: {
  helperOk: boolean;
  helperUrl: string;
  helperCode: string;
  setHelperUrl: Set<string>;
  setHelperCode: Set<string>;
  setHelperStatus: Set<HelperStatus | null>;
  setHelperOk: Set<boolean>;
  setUseHelper: Set<boolean>;
}) {
  const { helperOk, helperUrl, helperCode, setHelperUrl, setHelperCode, setHelperStatus, setHelperOk, setUseHelper } = h;
  useEffect(() => {
    let saved: { url?: string; code?: string } | null = null;
    try {
      saved = JSON.parse(localStorage.getItem("nuguna-helper") || "null");
    } catch {
      saved = null;
    }
    if (!saved?.url) return;
    const url = saved.url;
    const code = saved.code || "";
    setHelperUrl(url);
    setHelperCode(code);
    setHelperStatus({ state: "checking" });
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), 1500);
    const started = performance.now();
    void fetch(`${url.replace(/\/$/, "")}/info`, { headers: code ? { "X-Helper-Code": code } : {}, signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        setHelperStatus({ state: "on", ms: Math.round(performance.now() - started) });
        setHelperOk(true);
        setUseHelper(true);
      })
      .catch(() => setHelperStatus({ state: "off" }))
      .finally(() => window.clearTimeout(timer));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!helperOk || !helperUrl.trim()) return;
    try {
      localStorage.setItem("nuguna-helper", JSON.stringify({ url: helperUrl.trim(), code: helperCode }));
    } catch {
      /* ignore */
    }
    setHelperStatus((prev) => (prev?.state === "on" ? prev : { state: "on", ms: prev?.ms ?? null }));
  }, [helperOk, helperUrl, helperCode]);
}

/** 화면 어디든 파일 끌어놓기 · 이미지/PDF 붙여넣기 → handler.current(files, pasted) */
export function useFileDrop(handler: MutableRefObject<(files: File[], pasted: boolean) => void>, setDragOver: Set<boolean>) {
  useEffect(() => {
    let depth = 0;
    const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");
    const onEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setDragOver(true);
    };
    const onOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    };
    const onLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragOver(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDragOver(false);
      handler.current([...(event.dataTransfer?.files ?? [])], false);
    };
    const onPaste = (event: ClipboardEvent) => {
      const files = [...(event.clipboardData?.files ?? [])].filter((file) => file.type.startsWith("image/") || file.type === "application/pdf");
      if (!files.length) return; /* 글자 붙여넣기(메모 입력 등)는 그대로 둔다 */
      event.preventDefault();
      handler.current(files, true);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    /* 안드로이드 앱: 다른 앱의 '공유'로 받은 파일도 끌어놓기와 같은 길로 연다 (android-main.tsx 가 부른다) */
    const host = window as { __nugunaOpenFiles?: (files: File[]) => void };
    host.__nugunaOpenFiles = (files) => handler.current(files, false);
    window.dispatchEvent(new Event("nuguna-files-ready"));
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
      delete host.__nugunaOpenFiles;
    };
  }, []);
}

/** 오프라인 자립 모드 배지용: 서버 렌더에서는 null, 브라우저에서만 navigator.onLine을 본다 */
export function useOnline() {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online;
}

export type WifiExtra = { cmd?: string; ipp?: boolean; raw9100?: boolean; canon?: boolean };
type AddWifi = (host: string, answered: boolean, opts?: { title?: string; subtitle?: Msg; query?: string; select?: boolean; viaHelper?: boolean } & WifiExtra) => unknown;

/** 와이파이 프린터 찾기(빠른/전체·대역 칩)와 PC 도우미 실제 검색. 렌더마다 최신 값으로 다시 만든다(훅 아님). */
export function lanSearch(d: {
  lanBusy: boolean;
  sending: boolean;
  useHelper: boolean;
  helperUrl: string;
  helperCode: string;
  subnetInput: string;
  scanAbortRef: MutableRefObject<AbortController | null>;
  setLanBusy: Set<boolean>;
  setScanMode: Set<"quick" | "full" | "helper" | null>;
  setScanProg: Set<ScanProgress | null>;
  setLanNote: Set<Msg>;
  setSubnetInput: Set<string>;
  setHelperOk: Set<boolean>;
  setUseHelper: Set<boolean>;
  addWifi: AddWifi;
}) {
  const { lanBusy, sending, useHelper, helperUrl, helperCode, subnetInput, scanAbortRef, setLanBusy, setScanMode, setScanProg, setLanNote, setSubnetInput, setHelperOk, setUseHelper, addWifi } = d;
  function stopScan() {
    scanAbortRef.current?.abort();
  }

  async function findOnWifi(mode: "quick" | "full" = "quick", subnetOverride?: string) {
    if (lanBusy || sending) return;
    /* 앱(APK): 폰 내장 도우미가 mDNS · SNMP · 포트로 직접 찾는다 — 빠른 · 전체 · 대역 칩 모두 */
    if (useHelper && isPhoneHelper(helperUrl)) {
      await findViaHelper(subnetOverride || (mode === "full" && isValidSubnet(subnetInput) ? subnetInput.trim() : ""));
      return;
    }
    if (mode === "quick" && !subnetOverride && useHelper && helperUrl.trim()) {
      await findViaHelper();
      return;
    }
    const ac = new AbortController();
    scanAbortRef.current = ac;
    setLanBusy(true);
    setScanMode(mode);
    setScanProg(null);
    setLanNote(m("fx.allowLan"));
    let first = true;
    const prefer = subnetOverride ? [subnetOverride] : [subnetInput, localStorage.getItem("nuguna-subnet") || ""];
    try {
      const found = await scanLan({
        mode,
        prefer,
        signal: ac.signal,
        onStatus: setLanNote,
        onProgress: setScanProg,
        onFound: (hit) => {
          addWifi(hit.host, true, { select: first, viaHelper: false });
          first = false;
        },
      });
      diag(tr("fx.logScan", { mode: tr(mode === "full" ? "fx.modeFull" : "fx.modeQuick"), n: found.length, hosts: found.map((row) => row.host).join(",") }));
      if (ac.signal.aborted) {
        setLanNote(m("fx.stopped", { n: found.length }));
        return;
      }
      if (found.length === 0) {
        setLanNote(
          m(mode === "quick" ? "fx.quickNone" : "fx.fullNone"),
        );
        return;
      }
      const subnet = found[0].host.split(".").slice(0, 3).join(".");
      localStorage.setItem("nuguna-subnet", subnet);
      setSubnetInput(subnet);
      setLanNote(m("fx.found", { n: found.length }));
    } catch {
      setLanNote(m("fx.noLan"));
    } finally {
      setLanBusy(false);
      setScanMode(null);
      scanAbortRef.current = null;
    }
  }

  /** PC 도우미가 직접 9100/631을 훑고 모델명까지 읽어 온 실제 목록 */
  async function findViaHelper(subnetArg?: string) {
    if (lanBusy || sending) return;
    const phone = isPhoneHelper(helperUrl);
    if (!helperUrl.trim()) {
      setLanNote(m("fx.needHelperUrl"));
      return;
    }
    const ac = new AbortController();
    scanAbortRef.current = ac;
    setLanBusy(true);
    setScanMode("helper");
    setScanProg(null);
    /* 폰은 지금 붙은 와이파이 대역을 직접 읽으니, 예전에 저장된 대역 대신 고른 대역만 쓴다 */
    const pickedSubnet = subnetArg ?? (phone ? "" : subnetInput);
    const subnet = isValidSubnet(pickedSubnet) ? pickedSubnet.trim() : "";
    setLanNote(phone ? m("ph.scanning", { where: subnet ? `${subnet}.x` : tr("ph.thisWifi") }) : m("fx.helperScanning", { where: subnet ? `${subnet}.1~254` : tr("fx.thisPcNet") }));
    /* 폰 내장 도우미는 /progress 로 진행률을 알려 준다 — 웹 검색처럼 % 막대로 보여 주기 */
    let polling = true;
    const poll = async () => {
      while (polling && !ac.signal.aborted) {
        const prog = await helperProgress(helperUrl, helperCode);
        if (!polling) break;
        if (!prog) {
          if (!phone) break;
        } else if (prog.running && prog.total > 0) {
          setScanProg({ done: Math.min(prog.done, prog.total), total: prog.total, found: prog.found });
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    };
    void poll();
    try {
      const result = await helperDiscover(helperUrl, helperCode, subnet, ac.signal);
      polling = false;
      setHelperOk(true);
      setUseHelper(true);
      diag(tr("fx.logHelperScan", { nets: result.subnets.join(","), n: result.printers.length, ms: result.ms, list: result.printers.map((row) => `${row.host}=${row.model || "?"}`).join(" ") }));
      if (!result.printers.length) {
        setLanNote(phone ? m("ph.none", { where: result.subnets.map((net) => `${net}.x`).join(", ") || tr("ph.thisWifi") }) : m("fx.helperNone", { where: result.subnets.join(", ") || tr("fx.thisPcNet") }));
        return;
      }
      const ordered = [...result.printers].sort((a, b) => Number(b.raw9100) - Number(a.raw9100));
      ordered.forEach((row, index) => {
        addWifi(row.host, true, {
          title: row.model || tr("fx.printerIp", { ip: row.host }),
          subtitle: phone ? m("ph.checked", { host: row.host, how: foundHow(row) }) : m("fx.helperChecked", { host: row.host, raw: tr(row.raw9100 ? "fx.raw9100" : "fx.raw9100No"), ipp: row.ipp ? " · IPP" : "" }),
          query: row.model || row.host,
          select: index === 0,
          viaHelper: true,
          cmd: row.cmd || undefined,
          ipp: row.ipp,
          raw9100: row.raw9100,
          canon: row.canon,
        });
      });
      const ready = result.printers.filter((row) => row.raw9100).length;
      setLanNote(phone ? m("ph.found", { n: result.printers.length, sec: (result.ms / 1000).toFixed(1) }) : m("fx.helperFound", { n: result.printers.length, ready, sec: (result.ms / 1000).toFixed(1) }));
      if (phone && result.subnets[0]) setSubnetInput(result.subnets[0]);
    } catch (error) {
      setLanNote(error instanceof Error ? error.message : tr("fx.helperFail"));
    } finally {
      polling = false;
      setScanProg(null);
      setLanBusy(false);
      setScanMode(null);
      scanAbortRef.current = null;
    }
  }

  /** 어떻게 찾았는지 짧게: "9100 · IPP" */
  function foundHow(row: { raw9100: boolean; ipp: boolean; lpd?: boolean; canon?: boolean }) {
    return [row.raw9100 ? "9100" : "", row.ipp ? "IPP" : "", row.lpd ? "LPD" : "", row.canon ? "BJNP" : ""].filter(Boolean).join(" · ") || "mDNS";
  }

  function pickPreset(subnet: string) {
    setSubnetInput(subnet);
    localStorage.setItem("nuguna-subnet", subnet);
    void findOnWifi("quick", subnet);
  }
  return { stopScan, findOnWifi, findViaHelper, pickPreset };
}
