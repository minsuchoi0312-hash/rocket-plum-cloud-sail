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

enum FlowStep { connect, confirm, print }

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
  final _pageFromCtrl = TextEditingController(text: '1');
  final _pageToCtrl = TextEditingController(text: '1');

  FlowStep _step = FlowStep.connect;
  DocKind _kind = DocKind.pdf;
  OfficePaper _paper = OfficePaper.a4;
  DuplexMode _duplex = DuplexMode.simplex;
  PageMode _pageMode = PageMode.all;
  int _copies = 1;
  bool _gray = false;
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
  int _pageFrom = 1;
  int _pageTo = 1;
  String _notice = '';
  String _title = '';
  String _cmd = '';
  String? _hostName;
  int? _hostPort;
  bool _usbLive = false;
  bool _languageChosen = false;
  bool _askTest = false;
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
    _pageFromCtrl.dispose();
    _pageToCtrl.dispose();
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
      _cmd = languages;
      _devicePdf = pdf;
      _askTest = false;
      _languageChosen = known;
      _hostName = host;
      _hostPort = port;
      _usbLive = false;
      _step = known ? FlowStep.print : FlowStep.confirm;
      _notice = known ? '' : 'PDF와 PCL5e 지원을 아직 몰라요. 확인한 뒤 시험 인쇄부터 하는 편이 안전해요.';
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
        _toast('USB 복사기가 안 보여요. 선을 꽂고 다시 눌러 주세요.');
        return;
      }
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
        _cmd = identity.cmd;
        _devicePdf = pdf;
        _askTest = false;
        _languageChosen = known;
        _hostName = null;
        _hostPort = null;
        _usbLive = true;
        _usbPulled = false;
        _step = known ? FlowStep.print : FlowStep.confirm;
        _notice = known ? '' : '이름만으로는 언어를 확정하지 못했어요. 시험 인쇄부터 확인해 주세요.';
      });
    } catch (error) {
      _log('USB 연결 실패 ${errorSummary(error)}');
      _toast(_friendly(error));
    }
  }

  String _friendly(Object error) => friendlyPrintError(error);

  Future<void> _confirmLanguage({required bool pdf}) async {
    final stored = pdf
        ? (deviceSupportsPdf(_cmd) ? _cmd : 'PDF')
        : 'PCL5e';
    final host = _hostName;
    final port = _hostPort;
    final title = _title.isEmpty ? '복사기' : _title;
    setState(() {
      _devicePdf = pdf;
      _askTest = false;
      _languageChosen = true;
      _cmd = stored;
      _step = FlowStep.print;
      _notice = '';
    });
    if (host == null || port == null) return;
    await _memory.remember(RememberedPrinter(name: title, host: host, port: port, languages: stored));
    await _loadSaved();
  }

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
        _pageFrom = 1;
        _pageTo = doc.pages.length;
        _pageFromCtrl.text = '1';
        _pageToCtrl.text = '${doc.pages.length}';
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
      if (_askTest) _kind = DocKind.test;
      if (!connected) {
        _step = FlowStep.connect;
        if (!_needsPassword) _notice = '파일을 받아 두었어요. 복사기를 연결하면 이어서 인쇄해요.';
      } else if (!_languageChosen) {
        _step = FlowStep.confirm;
        _notice = 'PDF와 PCL5e 지원을 아직 몰라요. 확인한 뒤 시험 인쇄부터 하는 편이 안전해요.';
      } else {
        _step = FlowStep.print;
      }
    });
  }

  List<int> _pageSpan() {
    if (_pdf == null) return const [];
    if (_pageMode == PageMode.all) return [for (var i = 1; i <= _pdfCount; i++) i];
    final start = _pageFrom.clamp(1, _pdfCount);
    final end = _pageTo.clamp(start, _pdfCount);
    return [for (var i = start; i <= end; i++) i];
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
      if (!usbJob) {
        link = RawLink();
        await link.open(_hostName!, _hostPort!);
        _link = link;
      }
      if (_route == PrintRoute.pdfDirect && _pdfBytes != null) {
        final job = wrapPdfJob(_pdfBytes!, copies: _copies, duplex: _duplex, paper: _paper, pages: _pdfCount);
        await _sendAll([job]);
      } else {
        await _sendPcl();
      }
      if (_cancel) {
        _log('보내기를 멈췄어요.');
        _toast('보내기를 멈췄어요.');
      } else if (mounted) {
        _sendOk = true;
        _log('복사기로 보냈어요.');
        _toast('복사기로 보냈어요.');
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
        if (mounted) {
          setState(() {
            _step = FlowStep.connect;
            _notice = usbDroppedHint;
          });
        }
      } else if (_cancel) {
        if (mounted) _toast('보내기를 멈췄어요.');
      } else if (mounted) {
        _toast(_friendly(error));
      }
    } finally {
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
      final numbers = _pageSpan();
      final header = pclJobHeader(copies: _copies, duplex: _duplex, paper: _paper, pages: numbers.length);
      await _writeChunk(header, 2);
      for (var index = 0; index < numbers.length; index += 1) {
        if (_cancel) break;
        await _sendPdfPage(numbers[index], index, numbers.length);
      }
      if (!_cancel && needsBlankBack(numbers.length, _duplex)) await _sendBlank();
    } else if (_kind == DocKind.photo && _photo != null) {
      final header = pclJobHeader(copies: _copies, duplex: _duplex, paper: _paper, pages: 1);
      await _writeChunk(header, 2);
      await _sendImage(_photo!, 0, 1, RasterMode.dither, disposeImage: false);
      if (!_cancel && needsBlankBack(1, _duplex)) await _sendBlank();
    } else {
      final chunks = await _textPages();
      final header = pclJobHeader(copies: _copies, duplex: _duplex, paper: _paper, pages: chunks.length);
      await _writeChunk(header, 2);
      for (var index = 0; index < chunks.length; index += 1) {
        if (_cancel) break;
        final image = await paintTextSheet(chunks[index], _spec.width, _spec.height);
        await _sendImage(image, index, chunks.length, RasterMode.threshold);
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

  Future<void> _sendPdfPage(int number, int index, int total) async {
    final doc = _pdf;
    if (doc == null || number < 1 || number > doc.pages.length) return;
    final page = doc.pages[number - 1];
    if (page.width <= 0 || page.height <= 0) throw StateError('쪽을 그리지 못했어요.');
    _pageRenderCancel?.cancel();
    final cancel = page.createCancellationToken();
    _pageRenderCancel = cancel;
    final longPaper = _spec.height.toDouble();
    final shortPaper = _spec.width.toDouble();
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
    if (rendered == null) {
      if (_cancel) return;
      throw StateError('쪽을 그리지 못했어요.');
    }
    final ui.Image image;
    try {
      image = await imageFromBgra(rendered.pixels, rendered.width, rendered.height);
    } finally {
      rendered.dispose();
    }
    await _sendImage(image, index, total, RasterMode.dither);
  }

  Future<void> _sendImage(ui.Image image, int index, int total, RasterMode mode, {bool disposeImage = true}) async {
    var release = disposeImage;
    try {
      final rgba = await rasterize(image, _spec.width, _spec.height);
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
          leading: _step == FlowStep.connect
              ? null
              : IconButton(onPressed: _sending ? null : _back, icon: const Icon(Icons.arrow_back)),
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            Text(_stepTitle, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 6),
            Text(
              '사무용 복사기를 같은 와이파이(9100)나 USB로 바로 찍습니다. 기본 인쇄 창으로 넘기지 않아요.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (_notice.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(_notice, style: const TextStyle(color: Color(0xFF8A4B08))),
            ],
            const SizedBox(height: 16),
            if (_step == FlowStep.connect) _connectBody(),
            if (_step == FlowStep.confirm) _confirmBody(),
            if (_step == FlowStep.print) _printBody(),
          ],
        ),
      ),
    );
  }

  String get _stepTitle => switch (_step) {
        FlowStep.connect => '1. 복사기 연결',
        FlowStep.confirm => '2. 이 복사기 확인',
        FlowStep.print => '3. 인쇄',
      };

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

  Widget _confirmBody() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(_title.isEmpty ? '복사기' : _title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Text(_cmd.isEmpty ? '지원 언어를 아직 모르겠어요. 아래에서 고르거나, 잘 모르면 시험 인쇄부터 하세요.' : '읽은 언어: $_cmd'),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: () => _confirmLanguage(pdf: true),
          child: const Text('PDF 지원'),
        ),
        const SizedBox(height: 8),
        FilledButton.tonal(
          onPressed: () => _confirmLanguage(pdf: false),
          child: const Text('PCL5e 흑백'),
        ),
        const SizedBox(height: 8),
        OutlinedButton(
          onPressed: () => setState(() {
            _devicePdf = false;
            _askTest = true;
            _languageChosen = true;
            _kind = DocKind.test;
            _step = FlowStep.print;
            _notice = '언어를 모르는 복사기예요. 먼저 1쪽 시험 인쇄로 깨지지 않는지 확인해 주세요.';
          }),
          child: const Text('잘 모름'),
        ),
      ],
    );
  }

  Widget _printBody() {
    final locked = _sending;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(_title.isEmpty ? '연결된 복사기' : _title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(_route == PrintRoute.pdfDirect ? 'PDF를 그대로 넣어요.' : 'USB/와이파이 직접 인쇄는 흑백만 지원해요.'),
        if (_askTest) ...[
          const SizedBox(height: 8),
          const Text('먼저 시험 페이지 1쪽만 보내 정상 출력되는지 확인해 주세요. 이상 없으면 PDF나 사진으로 바꾸세요.'),
        ],
        const SizedBox(height: 12),
        SegmentedButton<DocKind>(
          showSelectedIcon: false,
          segments: const [
            ButtonSegment(value: DocKind.pdf, label: Text('PDF')),
            ButtonSegment(value: DocKind.photo, label: Text('사진')),
            ButtonSegment(value: DocKind.memo, label: Text('메모')),
            ButtonSegment(value: DocKind.test, label: Text('시험')),
          ],
          selected: {_kind},
          onSelectionChanged: locked ? null : (value) => setState(() => _kind = value.first),
        ),
        const SizedBox(height: 12),
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
              ChoiceChip(label: const Text('시작~끝'), selected: _pageMode == PageMode.span, onSelected: locked || _pdfCount == 0 ? null : (_) => setState(() => _pageMode = PageMode.span)),
            ],
          ),
          if (_pageMode == PageMode.span)
            Row(
              children: [
                SizedBox(
                  width: 72,
                  child: TextField(
                    enabled: !locked,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: '시작'),
                    controller: _pageFromCtrl,
                    onChanged: (value) => _pageFrom = int.tryParse(value) ?? 1,
                  ),
                ),
                const Text(' ~ '),
                SizedBox(
                  width: 72,
                  child: TextField(
                    enabled: !locked,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: '끝'),
                    controller: _pageToCtrl,
                    onChanged: (value) => _pageTo = int.tryParse(value) ?? _pageFrom,
                  ),
                ),
              ],
            ),
        ],
        if (_kind == DocKind.photo) ...[
          OutlinedButton(onPressed: locked ? null : _pickPhoto, child: const Text('사진 고르기')),
          if (_photo != null) RawImage(image: _photo, height: 180, fit: BoxFit.contain),
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
          FilledButton.icon(onPressed: _print, icon: const Icon(Icons.print), label: const Text('복사기로 바로 인쇄')),
      ],
    );
  }

  Future<void> _flip(int delta) async {
    setState(() => _previewPage = (_previewPage + delta).clamp(1, _pdfCount));
    await _renderPreview();
  }
}
