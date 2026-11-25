import 'dart:async';
import 'dart:io';
import 'dart:isolate';
import 'dart:ui' as ui;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';
import 'package:pdfrx/pdfrx.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../discovery/mdns_browser.dart';
import '../engine/languages.dart';
import '../engine/pcl_job.dart';
import '../engine/route.dart';
import '../engine/user_error.dart';
import '../render/sheet_image.dart';
import '../store/diag_log.dart';
import '../store/printer_memory.dart';
import '../transport/share_inbox.dart';
import '../transport/usb_android.dart';
import '../transport/wifi_raw.dart';

enum FlowStep { connect, print }

class OfficePrintApp extends StatelessWidget {
  const OfficePrintApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '바로 인쇄',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1B3A6B)),
        scaffoldBackgroundColor: const Color(0xFFF6F1E7),
        useMaterial3: true,
        fontFamily: 'sans-serif',
      ),
      home: const OfficeHome(),
    );
  }
}

class OfficeHome extends StatefulWidget {
  const OfficeHome({super.key});

  @override
  State<OfficeHome> createState() => _OfficeHomeState();
}

class _OfficeHomeState extends State<OfficeHome> with WidgetsBindingObserver {
  final _usb = UsbAndroid();
  final _memory = PrinterMemory();
  final _mdns = MdnsBrowser();
  final _diag = DiagLog();
  final _host = TextEditingController(text: '192.168.0.50');
  final _port = TextEditingController(text: '9100');
  final _memo = TextEditingController();
  final _password = TextEditingController();
  final _rangeCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  final _userCtrl = TextEditingController(text: 'MOBILE');

  FlowStep _step = FlowStep.connect;
  DocKind _kind = DocKind.pdf;
  OfficePaper _paper = OfficePaper.a4;
  DuplexMode _duplex = DuplexMode.simplex;
  PageMode _pageMode = PageMode.all;
  int _copies = 1;
  int _nup = 1;
  int _photoGrid = 1;
  bool _gray = false;
  bool _secure = false;
  bool _reverse = false;
  bool _usbMissing = false;
  PaperTray _tray = PaperTray.auto;
  FrameTurn _turn = FrameTurn.auto;
  FrameFit _photoFit = FrameFit.contain;
  bool _scanning = false;
  bool _sending = false;
  bool _cancel = false;
  bool _devicePdf = false;
  bool _needsPassword = false;
  bool _unlockedWithPassword = false;
  bool _usbPulled = false;
  int _progress = 0;
  int _previewToken = 0;
  int _pdfCount = 0;
  int _previewPage = 1;
  String _notice = '';
  String _title = '';
  String? _hostName;
  int? _hostPort;
  bool _usbLive = false;
  bool _bgDuringSend = false;
  bool _sendOk = false;
  List<FoundPrinter> _found = const [];
  List<RememberedPrinter> _saved = const [];
  ui.Image? _preview;
  Uint8List? _pdfBytes;
  String? _pdfPath;
  PdfDocument? _pdf;
  PdfPageRenderCancellationToken? _pageRenderCancel;
  RawLink? _link;
  ui.Image? _photo;

  bool get _android => Platform.isAndroid;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _usb.listenDetached(_onUsbDetached);
    ShareInbox.listen(_openShared);
    unawaited(_takeShare());
    _loadSaved();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final background = state == AppLifecycleState.paused || state == AppLifecycleState.hidden;
    if (background && _sending) {
      _bgDuringSend = true;
      _log('인쇄 중 앱이 백그라운드로 갔어요. 화면이 꺼지면 전송이 멈출 수 있어요.');
      return;
    }
    if (state == AppLifecycleState.resumed && _bgDuringSend) {
      _bgDuringSend = false;
      if (_sending) {
        _log('인쇄 중 다시 앞으로 돌아왔어요. 전송은 아직 이어지고 있어요.');
        return;
      }
      if (!_sendOk && mounted) {
        _toast('백그라운드로 가는 동안 전송이 끊겼을 수 있어요. 복사기 화면과 와이파이·USB 연결을 확인해 주세요.');
      }
    }
  }

  void _log(String line) => _diag.add(line);

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _host.dispose();
    _port.dispose();
    _memo.dispose();
    _password.dispose();
    _rangeCtrl.dispose();
    _pinCtrl.dispose();
    _userCtrl.dispose();
    _photo?.dispose();
    _preview?.dispose();
    _pageRenderCancel?.cancel();
    unawaited(_pdf?.dispose());
    super.dispose();
  }

  Future<void> _loadSaved() async {
    final saved = await _memory.load();
    if (!mounted) return;
    setState(() => _saved = saved);
  }

  PaperSpec get _spec => papers[_paper]!;

  void _onUsbDetached() {
    if (!_usbLive) return;
    _usbPulled = true;
    _usbLive = false;
    _log('USB 케이블이 빠졌어요.');
    if (!mounted) return;
    setState(() {
      _step = FlowStep.connect;
      _notice = usbDroppedHint;
    });
  }

  PrintRoute get _route => resolvePrintRoute(
        docKind: _kind,
        hasPdfBytes: _pdf != null,
        pdfDirectAllowed: canPdfDirectBytes(_pdfBytes) && !_unlockedWithPassword,
        devicePdf: _devicePdf,
        pageMode: _pageMode,
        gray: _gray,
        passwordUnlocked: _unlockedWithPassword,
        reverse: _kind == DocKind.pdf && _reverse,
        pagesPerSheet: _kind == DocKind.pdf ? _nup : 1,
        manualOrientation: _turn != FrameTurn.auto,
      );

  bool get _pcl => _route == PrintRoute.pcl;

  void _toast(String text) => setState(() => _notice = text);

  Future<void> _scan() async {
    setState(() {
      _scanning = true;
      _notice = '같은 와이파이에서 복사기를 찾고 있어요.';
    });
    try {
      final found = await _mdns.scan();
      if (!mounted) return;
      setState(() {
        _found = found;
        _notice = found.isEmpty ? scanFailureMessage(ios: Platform.isIOS, empty: true) : '${found.length}대를 찾았어요.';
      });
      _log(
        found.isEmpty
            ? 'mDNS 결과 없음'
            : 'mDNS ${found.length}대 ${found.map((item) => '${item.name} ${item.host}:${item.port} ${item.service} pdl=${item.languages.isEmpty ? '없음' : item.languages}').join(', ')}',
      );
    } catch (error) {
      _log('mDNS 실패 ${errorSummary(error)}');
      _toast(scanFailureMessage(ios: Platform.isIOS, empty: false));
    } finally {
      if (mounted) setState(() => _scanning = false);
    }
  }

  Future<void> _useWifi(String name, String host, int port, String languages, {String service = ''}) async {
    await _usb.close();
    if (!mounted) return;
    setState(() {
      _usbLive = false;
      _notice = '$host 에 연결하는지 확인하고 있어요.';
    });
    final PrinterProbe probe;
    try {
      probe = await queryPrinterId(host, port);
    } catch (error) {
      _log('TCP 9100 $host:$port 연결 실패 ${errorSummary(error)}');
      _toast(connectFailureMessage(host: host, service: service, ios: Platform.isIOS));
      return;
    }
    _log('TCP 9100 $host:$port ${probe.connectMs}ms');
    _log(probe.raw.isEmpty ? 'PJL INFO ID 응답 없음' : 'PJL INFO ID ${probe.raw}');
    if (!mounted) return;
    final model = probe.model;
    final title = (model == null || model.isEmpty) ? name : model;
    final pdf = deviceSupportsPdf(languages);
    final pcl5 = deviceSupportsPcl5(languages);
    final known = pdf || pcl5;
    setState(() {
      _title = title;
      _devicePdf = pdf;
      _hostName = host;
      _hostPort = port;
      _usbLive = false;
      _step = FlowStep.print;
      _notice = known ? '' : '지원 언어를 못 읽었어요. 다른 앱으로 넘기지 않고 이 앱이 흑백으로 복사합니다.';
    });
    await _memory.remember(RememberedPrinter(name: title, host: host, port: port, languages: languages));
    await _loadSaved();
  }

  Future<void> _connectTyped() async {
    final host = _host.text.trim();
    final port = int.tryParse(_port.text.trim()) ?? 9100;
    if (host.isEmpty) {
      _toast('IP 주소를 입력해 주세요.');
      return;
    }
    await _useWifi('직접 입력한 복사기', host, port, '');
  }

  Future<void> _connectUsb() async {
    try {
      final devices = await _usb.list();
      if (!mounted) return;
      if (devices.isEmpty) {
        setState(() => _usbMissing = true);
        _toast('USB 복사기가 안 보여요. 선을 꽂고 다시 눌러 주세요.');
        return;
      }
      setState(() => _usbMissing = false);
      final picked = await showDialog<UsbPrinterInfo>(
        context: context,
        builder: (context) => SimpleDialog(
          title: const Text('USB 복사기'),
          children: [
            for (final device in devices)
              SimpleDialogOption(
                onPressed: () => Navigator.pop(context, device),
                child: Text(device.name),
              ),
          ],
        ),
      );
      if (picked == null) return;
      final identity = await _usb.open(picked.deviceId);
      if (!mounted) return;
      _log(identity.raw.isEmpty ? 'USB GET_DEVICE_ID 빈 응답' : 'USB GET_DEVICE_ID ${identity.raw}');
      final pdf = deviceSupportsPdf(identity.cmd);
      final pcl5 = deviceSupportsPcl5(identity.cmd);
      final known = pdf || pcl5;
      setState(() {
        _title = identity.title;
        _devicePdf = pdf;
        _hostName = null;
        _hostPort = null;
        _usbLive = true;
        _usbPulled = false;
        _step = FlowStep.print;
        _notice = known ? '' : '이름만으로는 언어를 못 읽었어요. 다른 앱으로 넘기지 않고 이 앱이 흑백으로 복사합니다.';
      });
    } catch (error) {
      _log('USB 연결 실패 ${errorSummary(error)}');
      _toast(_friendly(error));
    }
  }

  String _friendly(Object error) => friendlyPrintError(error);

  void _back() {
    if (_sending) return;
    unawaited(_leaveToConnect());
  }

  Future<void> _leaveToConnect({String notice = ''}) async {
    await _usb.close();
    if (!mounted) return;
    setState(() {
      _usbLive = false;
      _step = FlowStep.connect;
      _notice = notice;
    });
  }

  Future<void> _pickPdf() async {
    if (_sending) return;
    final picked = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: const ['pdf']);
    final path = picked?.files.single.path;
    if (path == null || path.isEmpty) {
      if (picked != null) _toast('파일을 불러오지 못했어요. 기기에 저장된 파일인지 확인해 주세요.');
      return;
    }
    await _loadPdfFromPath(path);
  }

  Future<bool> _loadPdfFromPath(String path) async {
    try {
      final file = File(path);
      final length = await file.length();
      if (length > 80 * 1024 * 1024) {
        _log('PDF가 80MB를 넘어요.');
        _toast('PDF가 너무 커요. 80MB 이하로 나눠 주세요.');
        return false;
      }
      if (length == 0) {
        _log('PDF 파일이 비어 있어요.');
        _toast('빈 파일은 인쇄할 수 없어요.');
        return false;
      }
      final previous = _pdf;
      _pdf = null;
      await previous?.dispose();
      _unlockedWithPassword = false;
      _pdfBytes = length <= 25 * 1024 * 1024 ? await file.readAsBytes() : null;
      if (_pdfBytes != null && (_pdfBytes!.length > 25 * 1024 * 1024 || pdfLooksEncrypted(_pdfBytes!))) {
        _pdfBytes = null;
      }
      final oldPreview = _preview;
      _preview = null;
      oldPreview?.dispose();
      setState(() {
        _pdfPath = path;
        _needsPassword = false;
        _password.clear();
        _kind = DocKind.pdf;
      });
      await _openPdf();
      return _pdf != null || _needsPassword;
    } catch (error) {
      _log('PDF 파일 오류 ${errorSummary(error)}');
      _toast('파일을 불러오지 못했어요. 기기에 저장된 파일인지 확인해 주세요.');
      return false;
    }
  }

  Future<void> _openPdf() async {
    final path = _pdfPath;
    if (path == null) return;
    final token = ++_previewToken;
    _pageRenderCancel?.cancel();
    var supplied = false;
    try {
      final doc = await PdfDocument.openFile(
        path,
        passwordProvider: () {
          if (supplied) return null;
          final text = _password.text.trim();
          if (text.isEmpty) return null;
          supplied = true;
          return text;
        },
      );
      if (!mounted || token != _previewToken) {
        await doc.dispose();
        return;
      }
      if (!pdfHasPages(doc.pages.length)) {
        await doc.dispose();
        _log('0쪽 PDF는 열지 않아요.');
        _toast('쪽이 없는 PDF예요. 다른 파일을 골라 주세요.');
        return;
      }
      final previous = _pdf;
      final previousPreview = _preview;
      final unlocked = supplied;
      if (unlocked) {
        _pdfBytes = null;
        _log('암호로 연 PDF는 원본 대신 PCL5e로 인쇄해요.');
      }
      setState(() {
        _pdf = doc;
        _pdfCount = doc.pages.length;
        _previewPage = 1;
        _preview = null;
        _needsPassword = false;
        _unlockedWithPassword = unlocked;
        _notice = '';
      });
      await previous?.dispose();
      previousPreview?.dispose();
      await _renderPreview();
    } on PdfPasswordException {
      if (!mounted || token != _previewToken) return;
      setState(() {
        _needsPassword = true;
        _notice = supplied ? '비밀번호가 맞지 않아요.' : '이 PDF는 열기 비밀번호가 필요해요.';
      });
      _log(supplied ? 'PDF 비밀번호가 맞지 않아요.' : 'PDF 열기 비밀번호가 필요해요.');
    } catch (_) {
      if (!mounted || token != _previewToken) return;
      _log('PDF를 열지 못했어요.');
      _toast('PDF를 열지 못했어요.');
    }
  }

  Future<void> _renderPreview() async {
    final doc = _pdf;
    if (doc == null || doc.pages.isEmpty) return;
    final token = ++_previewToken;
    _pageRenderCancel?.cancel();
    final pageNumber = _previewPage.clamp(1, doc.pages.length);
    final page = doc.pages[pageNumber - 1];
    if (page.width <= 0 || page.height <= 0) return;
    final cancel = page.createCancellationToken();
    _pageRenderCancel = cancel;
    final rendered = await page.render(
      fullWidth: 480,
      fullHeight: 480 * page.height / page.width,
      backgroundColor: 0xFFFFFFFF,
      cancellationToken: cancel,
    );
    if (!mounted || token != _previewToken || rendered == null) {
      rendered?.dispose();
      return;
    }
    final ui.Image image;
    try {
      image = await imageFromBgra(rendered.pixels, rendered.width, rendered.height);
    } finally {
      rendered.dispose();
    }
    if (!mounted || token != _previewToken) {
      image.dispose();
      return;
    }
    final previous = _preview;
    setState(() => _preview = image);
    previous?.dispose();
  }

  Future<void> _pickPhoto() async {
    if (_sending) return;
    final picked = await FilePicker.platform.pickFiles(type: FileType.image, withData: false);
    final path = picked?.files.single.path ?? '';
    if (path.isEmpty) {
      if (picked != null) _toast('파일을 불러오지 못했어요. 기기에 저장된 파일인지 확인해 주세요.');
      return;
    }
    await _loadPhotoFromPath(path);
  }

  Future<bool> _loadPhotoFromPath(String path) async {
    final lower = path.toLowerCase();
    if (lower.endsWith('.heic') || lower.endsWith('.heif')) {
      _log('HEIC 사진은 받지 않아요.');
      _toast('HEIC 사진은 지원하지 않아요. JPG/PNG로 바꿔서 골라 주세요.');
      return false;
    }
    try {
      final size = await File(path).length();
      if (size > 12 * 1024 * 1024) {
        _log('사진이 12MB를 넘어요.');
        _toast('사진이 너무 커요. JPG나 PNG로, 긴 변 2000px 정도로 줄여 주세요.');
        return false;
      }
      final bytes = await File(path).readAsBytes();
      final image = await decodeBytes(bytes, targetWidth: 2000);
      _photo?.dispose();
      setState(() {
        _photo = image;
        _kind = DocKind.photo;
        _notice = '';
      });
      return true;
    } on FileSystemException catch (error) {
      _log('사진을 열지 못했어요. ${errorSummary(error)}');
      _toast('파일을 불러오지 못했어요. 기기에 저장된 파일인지 확인해 주세요.');
      return false;
    } catch (error) {
      _log('사진을 열지 못했어요. ${errorSummary(error)}');
      _toast('이 사진은 열 수 없어요. JPG/PNG로 바꿔 주세요.');
      return false;
    }
  }

  Future<void> _takeShare() async {
    final file = await ShareInbox.take();
    if (file != null) await _openShared(file);
  }

  Future<void> _openShared(SharedFile file) async {
    if (file.failed) {
      final message = shareFailureMessage(file.error);
      _log('공유 실패 ${file.error}');
      _toast(message);
      return;
    }
    if (_sending) {
      _log('인쇄 중이라 공유 파일을 열지 않았어요.');
      return;
    }
    _log(file.kind == 'pdf' ? '공유로 PDF를 받았어요.' : '공유로 사진을 받았어요.');
    final ready = file.kind == 'pdf' ? await _loadPdfFromPath(file.path) : await _loadPhotoFromPath(file.path);
    if (!mounted || !ready) return;
    final connected = _hostName != null || _usbLive;
    setState(() {
      _kind = file.kind == 'pdf' ? DocKind.pdf : DocKind.photo;
      _step = connected ? FlowStep.print : FlowStep.connect;
      if (!connected && !_needsPassword) _notice = '파일을 받아 두었어요. 아래에서 복사기를 고르면 이 앱이 바로 복사합니다.';
      if (connected) _notice = '';
    });
  }

  /// 전체와 쪽 지정은 인쇄하는 순간에만 갈라진다. 입력칸은 모드를 바꿔도 비우지 않는다.
  List<int>? _selectedPages() {
    if (_pdf == null || _pdfCount < 1) return const [];
    if (_pageMode == PageMode.all) {
      return [for (var i = 1; i <= _pdfCount; i++) i];
    }
    return parsePageRange(_rangeCtrl.text, _pdfCount);
  }

  Uint8List _jobHeader(int pages) {
    return pclJobHeader(
      copies: _copies,
      duplex: _duplex,
      paper: _paper,
      pages: pages,
      holdKey: _secure ? _pinCtrl.text.trim() : null,
      username: _userCtrl.text,
      tray: _tray,
    );
  }

  Future<void> _print() async {
    if (_sending) return;
    if (_hostName == null && !_usbLive) {
      _toast('먼저 복사기를 연결해 주세요.');
      return;
    }
    if (_kind == DocKind.pdf && _pdf == null) {
      _toast('PDF를 골라 주세요.');
      return;
    }
    if (_kind == DocKind.memo && _memo.text.trim().isEmpty) {
      _toast('메모를 적어 주세요.');
      return;
    }
    if (_kind == DocKind.photo && _photo == null) {
      _toast('사진을 골라 주세요.');
      return;
    }
    if (_secure && !validHoldPin(_pinCtrl.text.trim())) {
      _toast('보안 인쇄 PIN은 숫자 4자리예요.');
      return;
    }
    if (_kind == DocKind.pdf && _pageMode == PageMode.span && parsePageRange(_rangeCtrl.text, _pdfCount) == null) {
      _toast('쪽 범위를 확인해 주세요. 예: 1, 3-5, 8');
      return;
    }
    _log('경로 ${_route == PrintRoute.pdfDirect ? 'PDF Direct' : 'PCL5e'}');
    RawLink? link;
    final usbJob = _usbLive;
    setState(() {
      _sending = true;
      _cancel = false;
      _sendOk = false;
      _progress = 0;
      _notice = '';
    });
    try {
      try {
        await WakelockPlus.enable();
      } catch (_) {}
      try {
        await _usb.startGuard();
      } catch (_) {}
      if (!usbJob) {
        link = RawLink();
        await link.open(_hostName!, _hostPort!);
        _link = link;
      }
      if (_route == PrintRoute.pdfDirect && _pdfBytes != null) {
        final job = wrapPdfJob(
          _pdfBytes!,
          copies: _copies,
          duplex: _duplex,
          paper: _paper,
          pages: _pdfCount,
          holdKey: _secure ? _pinCtrl.text.trim() : null,
          username: _userCtrl.text,
          tray: _tray,
        );
        await _sendAll([job]);
      } else {
        await _sendPcl();
      }
      if (_cancel) {
        _log('보내기를 멈췄어요.');
        _toast('보내기를 멈췄어요.');
      } else if (mounted) {
        _sendOk = true;
        final held = _secure;
        final done = held ? '복사기에 넣어 두었어요. 복사기 화면에서 PIN을 입력해야 출력돼요.' : '복사기로 보냈어요.';
        _log(held ? '보안 인쇄로 넣어 두었어요.' : '복사기로 보냈어요.');
        _toast(done);
      }
    } catch (error) {
      _log('인쇄 오류 ${errorSummary(error)}');
      final stalled = usbPipeStalled(error);
      if (_cancel && !stalled) {
        try {
          await _writeRaw(pclAbortFooter());
        } catch (abortError) {
          _log('마감 실패 ${errorSummary(abortError)}');
        }
      }
      if (usbJob && (stalled || _usbPulled)) {
        await _usb.close();
        _usbLive = false;
        final dropped = '$error'.contains('불안정') ? usbUnstableHint : usbDroppedHint;
        if (mounted) {
          setState(() {
            _step = FlowStep.connect;
            _notice = dropped;
          });
        }
      } else if (_cancel) {
        if (mounted) _toast('보내기를 멈췄어요.');
      } else if (mounted) {
        _toast(_friendly(error));
      }
    } finally {
      try {
        await _usb.stopGuard();
      } catch (_) {}
      try {
        await WakelockPlus.disable();
      } catch (_) {}
      await link?.close();
      _link = null;
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _sendPcl() async {
    if (_kind == DocKind.pdf) {
      final numbers = _selectedPages();
      if (numbers == null || numbers.isEmpty) {
        throw StateError('쪽 범위를 확인해 주세요. 예: 1, 3-5, 8');
      }
      final per = _nup >= 4 ? 4 : (_nup == 2 ? 2 : 1);
      final columns = per >= 4 ? 2 : 1;
      final rows = per >= 4 ? 2 : (per == 2 ? 2 : 1);
      final groups = nupGroups(numbers, per, reverse: _reverse);
      final sheets = groups.length;
      await _writeChunk(_jobHeader(sheets), 2);
      for (var sheetIndex = 0; sheetIndex < groups.length; sheetIndex += 1) {
        if (_cancel) break;
        final group = groups[sheetIndex];
        final images = <ui.Image>[];
        ui.Image? sheet;
        try {
          for (final number in group) {
            if (_cancel) break;
            final image = await _renderPdfImage(number, targetWidth: _spec.width / columns, targetHeight: _spec.height / rows);
            if (_cancel) {
              image?.dispose();
              break;
            }
            if (image == null) throw StateError('쪽을 그리지 못했어요.');
            images.add(image);
          }
          if (!_cancel && images.length == group.length) {
            sheet = await composeNup(
              sources: images,
              width: _spec.width,
              height: _spec.height,
              columns: columns,
              rows: rows,
              turn: _turn,
            );
          }
        } finally {
          for (final image in images) {
            image.dispose();
          }
        }
        if (_cancel) {
          sheet?.dispose();
          break;
        }
        if (sheet == null) throw StateError('쪽을 그리지 못했어요.');
        await _sendImage(sheet, sheetIndex, sheets, RasterMode.dither);
      }
      if (!_cancel && needsBlankBack(sheets, _duplex)) await _sendBlank();
    } else if (_kind == DocKind.photo && _photo != null) {
      await _writeChunk(_jobHeader(1), 2);
      if (_photoGrid >= 4) {
        // 같은 사진을 네 칸에 그린다. composeNup은 원본을 버리지 않고, 합성본만 보낸 뒤 버린다.
        final sheet = await composeNup(
          sources: [_photo!, _photo!, _photo!, _photo!],
          width: _spec.width,
          height: _spec.height,
          columns: 2,
          rows: 2,
          fit: _photoFit,
          turn: _turn,
        );
        await _sendImage(sheet, 0, 1, RasterMode.dither);
      } else {
        await _sendImage(_photo!, 0, 1, RasterMode.dither, disposeImage: false, fit: _photoFit, turn: _turn);
      }
      if (!_cancel && needsBlankBack(1, _duplex)) await _sendBlank();
    } else {
      final chunks = await _textPages();
      await _writeChunk(_jobHeader(chunks.length), 2);
      for (var index = 0; index < chunks.length; index += 1) {
        if (_cancel) break;
        final image = await paintTextSheet(chunks[index], _spec.width, _spec.height);
        await _sendImage(image, index, chunks.length, RasterMode.threshold, turn: _turn);
      }
      if (!_cancel && needsBlankBack(chunks.length, _duplex)) await _sendBlank();
    }
    if (_cancel) {
      await _writeChunk(pclAbortFooter(), _progress);
      return;
    }
    await _writeChunk(pclJobFooter(), 100);
  }

  Future<List<String>> _textPages() async {
    if (_kind == DocKind.memo) return memoChunksFor(_memo.text.trim(), _spec.width, _spec.height);
    final title = _title.isEmpty ? '인쇄 확인' : _title;
    return ['$title\n연결이 되는지 확인하는 시험 페이지입니다.'];
  }

  Future<ui.Image?> _renderPdfImage(int number, {required double targetWidth, required double targetHeight}) async {
    final doc = _pdf;
    if (doc == null || number < 1 || number > doc.pages.length) return null;
    final page = doc.pages[number - 1];
    if (page.width <= 0 || page.height <= 0) throw StateError('쪽을 그리지 못했어요.');
    _pageRenderCancel?.cancel();
    final cancel = page.createCancellationToken();
    _pageRenderCancel = cancel;
    final longPaper = targetWidth > targetHeight ? targetWidth : targetHeight;
    final shortPaper = targetWidth > targetHeight ? targetHeight : targetWidth;
    final pageLong = page.width > page.height ? page.width : page.height;
    final pageShort = page.width > page.height ? page.height : page.width;
    var scale = longPaper / pageLong;
    final shortScale = shortPaper / pageShort;
    if (shortScale < scale) scale = shortScale;
    final rendered = await page.render(
      fullWidth: (page.width * scale).clamp(1, 8000).toDouble(),
      fullHeight: (page.height * scale).clamp(1, 8000).toDouble(),
      backgroundColor: 0xFFFFFFFF,
      cancellationToken: cancel,
    );
    if (rendered == null) return null;
    try {
      return await imageFromBgra(rendered.pixels, rendered.width, rendered.height);
    } finally {
      rendered.dispose();
    }
  }

  Future<void> _sendImage(
    ui.Image image,
    int index,
    int total,
    RasterMode mode, {
    bool disposeImage = true,
    FrameFit fit = FrameFit.contain,
    FrameTurn turn = FrameTurn.auto,
  }) async {
    var release = disposeImage;
    try {
      final rgba = await rasterize(image, _spec.width, _spec.height, fit: fit, turn: turn);
      if (release) {
        image.dispose();
        release = false;
      }
      final modeName = mode == RasterMode.threshold ? 'threshold' : 'dither';
      final width = _spec.width;
      final height = _spec.height;
      final data = TransferableTypedData.fromList([rgba]);
      final packets = await Isolate.run(() => packetsFromTransfer(data, width, height, modeName));
      for (final packet in packets) {
        if (_cancel) return;
        final percent = (4 + ((index + 1) / total) * 90).round();
        await _writeChunk(packet, percent);
      }
    } finally {
      if (release) image.dispose();
    }
  }

  Future<void> _sendBlank() async {
    final packets = blankPagePackets(_spec.width, _spec.height);
    for (final packet in packets) {
      if (_cancel) return;
      await _writeChunk(packet, 96);
    }
  }

  Future<void> _sendAll(List<Uint8List> chunks) async {
    var sent = 0;
    final total = chunks.fold<int>(0, (sum, chunk) => sum + chunk.length);
    for (final chunk in _slice(chunks.first)) {
      if (_cancel) {
        await _writeRaw(pclAbortFooter());
        return;
      }
      await _writeRaw(chunk);
      sent += chunk.length;
      if (mounted) setState(() => _progress = total == 0 ? 0 : (sent * 100 / total).round());
    }
  }

  List<Uint8List> _slice(Uint8List bytes) {
    const size = 4096;
    return [for (var offset = 0; offset < bytes.length; offset += size) Uint8List.sublistView(bytes, offset, offset + size > bytes.length ? bytes.length : offset + size)];
  }

  Future<void> _writeChunk(Uint8List bytes, int percent) async {
    await _writeRaw(bytes);
    if (mounted) setState(() => _progress = percent.clamp(0, 100));
  }

  Future<void> _writeRaw(Uint8List bytes) async {
    if (_usbPulled) throw StateError(usbDroppedHint);
    if (_usbLive) {
      await _usb.write(bytes);
      return;
    }
    final link = _link;
    if (link == null) throw StateError('복사기가 연결되지 않았어요.');
    await link.write(bytes);
  }

  void _showDiag() {
    final text = _diag.dump();
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) {
        final height = MediaQuery.sizeOf(context).height * 0.62;
        return SafeArea(
          child: SizedBox(
            height: height,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('진단 로그 보기', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  const Text('복사기 연결 기록만 보여요. 문서 내용과 비밀번호는 남지 않아요.', style: TextStyle(color: Color(0xFF5C6570))),
                  const SizedBox(height: 8),
                  Expanded(
                    child: DecoratedBox(
                      decoration: BoxDecoration(color: const Color(0xFFF6F1E7), borderRadius: BorderRadius.circular(8)),
                      child: SingleChildScrollView(padding: const EdgeInsets.all(12), child: SelectableText(text)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(text: text));
                      if (context.mounted) Navigator.pop(context);
                      _toast('로그를 복사했어요.');
                    },
                    child: const Text('로그 복사'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_sending,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop || !_sending) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('인쇄 중에는 나갈 수 없어요.')));
      },
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFF1B3A6B),
          foregroundColor: Colors.white,
          title: const Text('바로 인쇄'),
          actions: [
            IconButton(
              tooltip: '진단 로그',
              onPressed: _showDiag,
              icon: const Icon(Icons.help_outline),
            ),
          ],
          leading: _step == FlowStep.print
              ? IconButton(onPressed: _sending ? null : _back, icon: const Icon(Icons.arrow_back), tooltip: '복사기 바꾸기')
              : null,
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            Text(_connected ? '복사할 내용을 고르세요' : '복사기와 문서를 이 화면에서 고르세요', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 6),
            const Text(
              '와이파이나 USB로 이 앱이 직접 보냅니다. 기본 인쇄 앱, 에어프린트, 시스템 인쇄 창으로 넘기지 않아요.',
              style: TextStyle(color: Color(0xFF5C6570)),
            ),
            if (_notice.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(_notice, style: const TextStyle(color: Color(0xFF8A4B08))),
            ],
            const SizedBox(height: 16),
            _printerCard(),
            const SizedBox(height: 16),
            _printBody(),
          ],
        ),
      ),
    );
  }

  bool get _connected => _hostName != null || _usbLive;

  Widget _printerCard() {
    if (_connected && _step == FlowStep.print) {
      final where = _usbLive ? 'USB' : '${_hostName ?? ''}:${_hostPort ?? 9100}';
      return Card(
        child: ListTile(
          leading: Icon(_usbLive ? Icons.usb : Icons.wifi, color: const Color(0xFF1B3A6B)),
          title: Text(_title.isEmpty ? '연결된 복사기' : _title),
          subtitle: Text(where),
          trailing: TextButton(onPressed: _sending ? null : _back, child: const Text('바꾸기')),
        ),
      );
    }
    return _connectBody();
  }

  Widget _connectBody() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FilledButton.icon(
          onPressed: _scanning || _sending ? null : _scan,
          icon: const Icon(Icons.wifi_find),
          label: Text(_scanning ? '찾는 중' : '와이파이에서 찾기'),
        ),
        const SizedBox(height: 8),
        for (final item in _found)
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(item.name),
            subtitle: Text('${item.host}:${item.port}'),
            trailing: const Icon(Icons.chevron_right),
            onTap: _sending ? null : () => _useWifi(item.name, item.host, item.port, item.languages, service: item.service),
          ),
        const SizedBox(height: 8),
        TextField(controller: _host, enabled: !_sending, decoration: const InputDecoration(labelText: 'IP 주소', border: OutlineInputBorder())),
        const SizedBox(height: 8),
        TextField(
          controller: _port,
          enabled: !_sending,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: '포트 (기본 9100)', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 8),
        OutlinedButton(onPressed: _sending ? null : _connectTyped, child: const Text('이 주소로 연결 확인')),
        if (_android) ...[
          const SizedBox(height: 8),
          FilledButton.icon(onPressed: _sending ? null : _connectUsb, icon: const Icon(Icons.usb), label: const Text('USB 선으로 연결')),
          if (_usbMissing)
            OutlinedButton(onPressed: _sending ? null : () => _usb.openSettings(), child: const Text('OTG 설정 열기')),
        ],
        if (_saved.isNotEmpty) ...[
          const SizedBox(height: 20),
          const Text('최근 복사기', style: TextStyle(fontWeight: FontWeight.w600)),
          for (final item in _saved)
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(item.name),
              subtitle: Text('${item.host}:${item.port}'),
              onTap: _sending ? null : () => _useWifi(item.name, item.host, item.port, item.languages),
            ),
        ],
      ],
    );
  }

  Widget _printBody() {
    final locked = _sending;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('무엇을 복사할까요', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ChoiceChip(label: const Text('문서 복사'), selected: _kind == DocKind.pdf, onSelected: locked ? null : (_) => setState(() => _kind = DocKind.pdf)),
            ChoiceChip(label: const Text('사진 복사'), selected: _kind == DocKind.photo, onSelected: locked ? null : (_) => setState(() => _kind = DocKind.photo)),
            ChoiceChip(label: const Text('글 복사'), selected: _kind == DocKind.memo, onSelected: locked ? null : (_) => setState(() => _kind = DocKind.memo)),
            ChoiceChip(label: const Text('시험 페이지'), selected: _kind == DocKind.test, onSelected: locked ? null : (_) => setState(() => _kind = DocKind.test)),
          ],
        ),
        const SizedBox(height: 8),
        Text(_route == PrintRoute.pdfDirect ? '이 PDF는 앱이 그대로 복사기로 넣어요.' : 'USB/와이파이 직접 인쇄는 흑백만 지원해요.'),
        if (_kind == DocKind.pdf) ...[
          OutlinedButton(onPressed: locked ? null : _pickPdf, child: const Text('PDF 고르기')),
          if (_pdfCount > 0) Text('총 $_pdfCount쪽'),
          if (_needsPassword)
            TextField(
              controller: _password,
              enabled: !locked,
              obscureText: true,
              decoration: const InputDecoration(labelText: '열기 비밀번호'),
              onSubmitted: (_) => _openPdf(),
            ),
          if (_needsPassword) Align(alignment: Alignment.centerRight, child: TextButton(onPressed: locked ? null : _openPdf, child: const Text('이 비밀번호로 열기'))),
          if (_preview != null) RawImage(image: _preview, height: 280, fit: BoxFit.contain),
          if (_pdfCount > 0)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(onPressed: locked || _previewPage <= 1 ? null : () => _flip(-1), icon: const Icon(Icons.chevron_left)),
                Text('$_previewPage / $_pdfCount'),
                IconButton(onPressed: locked || _previewPage >= _pdfCount ? null : () => _flip(1), icon: const Icon(Icons.chevron_right)),
              ],
            ),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(label: const Text('전체'), selected: _pageMode == PageMode.all, onSelected: locked ? null : (_) => setState(() => _pageMode = PageMode.all)),
              ChoiceChip(label: const Text('쪽 지정'), selected: _pageMode == PageMode.span, onSelected: locked || _pdfCount == 0 ? null : (_) => setState(() => _pageMode = PageMode.span)),
            ],
          ),
          if (_pageMode == PageMode.span)
            TextField(
              controller: _rangeCtrl,
              enabled: !locked,
              decoration: const InputDecoration(labelText: '쪽 범위', hintText: '1, 3-5, 8', border: OutlineInputBorder()),
            ),
        ],
        if (_kind == DocKind.photo) ...[
          OutlinedButton(onPressed: locked ? null : _pickPhoto, child: const Text('사진 고르기')),
          if (_photo != null) RawImage(image: _photo, height: 180, fit: BoxFit.contain),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(label: const Text('맞춤(안 자름)'), selected: _photoFit == FrameFit.contain, onSelected: locked ? null : (_) => setState(() => _photoFit = FrameFit.contain)),
              ChoiceChip(label: const Text('채우기(자름)'), selected: _photoFit == FrameFit.cover, onSelected: locked ? null : (_) => setState(() => _photoFit = FrameFit.cover)),
              ChoiceChip(label: const Text('1장'), selected: _photoGrid == 1, onSelected: locked ? null : (_) => setState(() => _photoGrid = 1)),
              ChoiceChip(label: const Text('2×2 분할'), selected: _photoGrid == 4, onSelected: locked ? null : (_) => setState(() => _photoGrid = 4)),
            ],
          ),
        ],
        if (_kind == DocKind.memo)
          TextField(controller: _memo, enabled: !locked, minLines: 4, maxLines: 8, decoration: const InputDecoration(labelText: '적을 내용', border: OutlineInputBorder())),
        if (_kind == DocKind.test) const Text('연결이 되는지 확인하는 시험 페이지입니다.'),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: [
            for (final paper in OfficePaper.values)
              ChoiceChip(
                label: Text(paper.name.toUpperCase()),
                selected: _paper == paper,
                onSelected: locked ? null : (_) => setState(() => _paper = paper),
              ),
            ChoiceChip(label: Text(_pcl || _gray ? '흑백' : '컬러'), selected: _pcl || _gray, onSelected: locked || _pcl ? null : (_) => setState(() => _gray = !_gray)),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            ChoiceChip(label: const Text('단면'), selected: _duplex == DuplexMode.simplex, onSelected: locked ? null : (_) => setState(() => _duplex = DuplexMode.simplex)),
            ChoiceChip(label: const Text('긴 쪽 넘김'), selected: _duplex == DuplexMode.long, onSelected: locked ? null : (_) => setState(() => _duplex = DuplexMode.long)),
            ChoiceChip(label: const Text('짧은 쪽 넘김'), selected: _duplex == DuplexMode.short, onSelected: locked ? null : (_) => setState(() => _duplex = DuplexMode.short)),
          ],
        ),
        Row(
          children: [
            IconButton(onPressed: locked ? null : () => setState(() => _copies = (_copies - 1).clamp(1, 99)), icon: const Icon(Icons.remove)),
            Text('$_copies부'),
            IconButton(onPressed: locked ? null : () => setState(() => _copies = (_copies + 1).clamp(1, 99)), icon: const Icon(Icons.add)),
          ],
        ),
        if (_advancedBadges.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(spacing: 8, children: [for (final badge in _advancedBadges) Chip(label: Text(badge), visualDensity: VisualDensity.compact)]),
        ],
        ExpansionTile(
          title: const Text('고급 인쇄 옵션'),
          childrenPadding: const EdgeInsets.fromLTRB(8, 0, 8, 12),
          children: [
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('보안 인쇄 (PIN)'),
              value: _secure,
              onChanged: locked ? null : (value) => setState(() => _secure = value),
            ),
            if (_secure) ...[
              TextField(
                controller: _pinCtrl,
                enabled: !locked,
                keyboardType: TextInputType.number,
                maxLength: 4,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'PIN 4자리', counterText: ''),
              ),
              TextField(
                controller: _userCtrl,
                enabled: !locked,
                decoration: const InputDecoration(labelText: '사용자 이름 (영문/숫자, 비우면 MOBILE)'),
              ),
            ],
            const SizedBox(height: 8),
            const Text('모아찍기'),
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(label: const Text('1쪽'), selected: _nup == 1, onSelected: locked ? null : (_) => setState(() => _nup = 1)),
                ChoiceChip(label: const Text('2쪽'), selected: _nup == 2, onSelected: locked ? null : (_) => setState(() => _nup = 2)),
                ChoiceChip(label: const Text('4쪽'), selected: _nup == 4, onSelected: locked ? null : (_) => setState(() => _nup = 4)),
              ],
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('역순 인쇄'),
              value: _reverse,
              onChanged: locked ? null : (value) => setState(() => _reverse = value),
            ),
            const Text('용지함'),
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(label: const Text('자동'), selected: _tray == PaperTray.auto, onSelected: locked ? null : (_) => setState(() => _tray = PaperTray.auto)),
                ChoiceChip(label: const Text('수동급지'), selected: _tray == PaperTray.manual, onSelected: locked ? null : (_) => setState(() => _tray = PaperTray.manual)),
                ChoiceChip(label: const Text('용지함 1'), selected: _tray == PaperTray.tray1, onSelected: locked ? null : (_) => setState(() => _tray = PaperTray.tray1)),
                ChoiceChip(label: const Text('용지함 2'), selected: _tray == PaperTray.tray2, onSelected: locked ? null : (_) => setState(() => _tray = PaperTray.tray2)),
              ],
            ),
            const SizedBox(height: 8),
            const Text('방향'),
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(label: const Text('자동'), selected: _turn == FrameTurn.auto, onSelected: locked ? null : (_) => setState(() => _turn = FrameTurn.auto)),
                ChoiceChip(label: const Text('세로'), selected: _turn == FrameTurn.portrait, onSelected: locked ? null : (_) => setState(() => _turn = FrameTurn.portrait)),
                ChoiceChip(label: const Text('가로'), selected: _turn == FrameTurn.landscape, onSelected: locked ? null : (_) => setState(() => _turn = FrameTurn.landscape)),
              ],
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_sending)
          FilledButton(
            onPressed: () {
              if (!_sending || _cancel) return;
              _pageRenderCancel?.cancel();
              setState(() => _cancel = true);
              if (_usbLive) unawaited(_usb.stopWrite());
            },
            child: Text('취소 · $_progress%'),
          )
        else
          FilledButton.icon(onPressed: _print, icon: const Icon(Icons.copy), label: const Text('이 앱에서 복사')),
      ],
    );
  }

  List<String> get _advancedBadges {
    final badges = <String>[];
    if (_secure) badges.add('보안');
    if (_kind == DocKind.pdf && _nup == 2) badges.add('2쪽');
    if (_kind == DocKind.pdf && _nup == 4) badges.add('4쪽');
    if (_kind == DocKind.pdf && _reverse) badges.add('역순');
    if (_tray == PaperTray.manual) badges.add('수동급지');
    if (_tray == PaperTray.tray1) badges.add('용지함 1');
    if (_tray == PaperTray.tray2) badges.add('용지함 2');
    if (_turn == FrameTurn.portrait) badges.add('세로');
    if (_turn == FrameTurn.landscape) badges.add('가로');
    return badges;
  }

  Future<void> _flip(int delta) async {
    setState(() => _previewPage = (_previewPage + delta).clamp(1, _pdfCount));
    await _renderPreview();
  }
}
