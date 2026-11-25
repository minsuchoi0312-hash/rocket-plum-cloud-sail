import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:office_print/discovery/mdns_browser.dart';
import 'package:office_print/engine/languages.dart';
import 'package:office_print/engine/memo.dart';
import 'package:office_print/engine/packbits.dart';
import 'package:office_print/engine/pcl_job.dart';
import 'package:office_print/engine/pjl_id.dart';
import 'package:office_print/engine/route.dart';
import 'package:office_print/engine/usb_select.dart';
import 'package:office_print/engine/user_error.dart';
import 'package:office_print/render/sheet_image.dart';
import 'package:office_print/store/diag_log.dart';

void main() {
  test('PackBits boundaries never emit 0x80', () {
    final same = packBits(Uint8List(128)..fillRange(0, 128, 7));
    expect(same[0], 129);
    expect(same[1], 7);
    expect(same.length, 2);
    final longer = packBits(Uint8List(129)..fillRange(0, 129, 7));
    expect(longer[0], 129);
    expect(longer[2], 0);
    expect(longer[3], 7);
    final mixed = packBits(Uint8List.fromList([for (var i = 0; i < 128; i++) (i % 40) + 1]));
    expect(mixed[0], 127);
    expect(mixed.length, 129);
    final mixedLong = packBits(Uint8List.fromList([for (var i = 0; i < 129; i++) (i % 40) + 1]));
    expect(mixedLong[0], 127);
    expect(mixedLong[129], 0);
    final pair = packBits(Uint8List.fromList([4, 4]));
    expect(pair[0], 255);
    expect(pair[1], 4);
    final tail = packBits(Uint8List.fromList([1, 2, 2]));
    expect(tail, [0, 1, 255, 2]);
    for (final packed in [same, longer, mixed, mixedLong, pair, tail]) {
      expect(packed.contains(0x80), isFalse);
    }
  });

  test('PJL copies, B5 paper, odd duplex pad, and page cursor', () {
    final many = String.fromCharCodes(pclJobHeader(copies: 2, duplex: DuplexMode.long, paper: OfficePaper.a4, pages: 3));
    expect(many, contains('@PJL SET QTY=2'));
    expect(many.contains('@PJL SET COPIES'), isFalse);
    expect(many.contains('\x1B&l2X'), isFalse);
    expect(many, contains('@PJL SET DUPLEX=ON'));
    expect(many, contains('@PJL SET BINDING=LONGEDGE'));
    expect(many, contains('\x1B&l26A'));
    final one = String.fromCharCodes(pclJobHeader(copies: 2, duplex: DuplexMode.simplex, paper: OfficePaper.a4, pages: 1));
    expect(one, contains('@PJL SET COPIES=2'));
    expect(one.contains('@PJL SET QTY'), isFalse);
    final b5 = String.fromCharCodes(pclJobHeader(copies: 1, duplex: DuplexMode.short, paper: OfficePaper.b5, pages: 1));
    expect(b5, contains('\x1B&l45A'));
    expect(b5.contains('JISB5'), isFalse);
    expect(b5.contains('@PJL SET PAPER'), isFalse);
    final footer = String.fromCharCodes(pclJobFooter());
    expect(footer.startsWith('\x1BE'), isTrue);
    expect(footer, contains('@PJL EOJ'));
    expect(footer.endsWith('\x1B%-12345X'), isTrue);
    expect(needsBlankBack(3, DuplexMode.long), isTrue);
    expect(needsBlankBack(2, DuplexMode.short), isFalse);
    final mono = Uint8List(8 * 8);
    mono[0] = 1;
    final page = String.fromCharCodes(encodePclPageFromMono(mono, 8, 8));
    expect(page, contains('\x1B*p0x72Y\x1B*r8S\x1B*r8T\x1B*r1A\x1B*b2M'));
    expect(page.contains('\x1B*r0A'), isFalse);
    final blank = String.fromCharCodes(encodePclPageFromMono(Uint8List(64), 8, 8));
    expect(RegExp(r'\x1B\*b\d+W').hasMatch(blank), isTrue);
    final commands = pclPageCommands(mono, 8, 8);
    final packets = bundleCommands(commands, limit: 80);
    expect(packets.fold<int>(0, (sum, part) => sum + part.length), commands.fold<int>(0, (sum, part) => sum + part.length));
    for (final packet in packets) {
      expect(_closed(packet), isTrue);
    }
  });

  test('route, rotation, protocol, and memo pages', () {
    expect(
      resolvePrintRoute(docKind: DocKind.pdf, hasPdfBytes: true, pdfDirectAllowed: true, devicePdf: true, pageMode: PageMode.all, gray: false),
      PrintRoute.pdfDirect,
    );
    expect(
      resolvePrintRoute(docKind: DocKind.pdf, hasPdfBytes: true, pdfDirectAllowed: true, devicePdf: true, pageMode: PageMode.span, gray: false),
      PrintRoute.pcl,
    );
    expect(
      resolvePrintRoute(docKind: DocKind.pdf, hasPdfBytes: true, pdfDirectAllowed: false, devicePdf: true, pageMode: PageMode.all, gray: false),
      PrintRoute.pcl,
    );
    expect(commandHasPcl5('PCL,PCLXL'), isFalse);
    expect(commandHasPcl5('PCL5e'), isTrue);
    expect(rasterTurn(842, 595), 90);
    expect(rasterTurn(595, 842), 0);
    expect(rasterTurn(842, 595) == 180, isFalse);
    expect(
      pickPrinterProtocol(const [
        (interfaceClass: 7, protocol: 4, hasOut: true),
        (interfaceClass: 7, protocol: 3, hasOut: true),
        (interfaceClass: 255, protocol: 2, hasOut: true),
        (interfaceClass: 7, protocol: 1, hasOut: true),
        (interfaceClass: 7, protocol: 2, hasOut: true),
      ]),
      2,
    );
    expect(pickPrinterProtocol(const [(interfaceClass: 7, protocol: 4, hasOut: true)]), isNull);
    final lines = wrapMeasuredLines('a' * 50, (value) => (value.length * 10).toDouble(), 100);
    expect(lines.length, 5);
    expect(paginateLines(lines, 2).length, 3);
    expect(parsePjlId('@PJL INFO ID\r\n"HP LaserJet M404"\r\n\x1B%-12345X'), 'HP LaserJet M404');
    expect(parsePjlId('@PJL INFO ID\r\nID="Canon iR-ADV"\r\n'), 'Canon iR-ADV');
    expect(parsePjlId('@PJL INFO ID\r\nSindoh D450\r\n'), 'Sindoh D450');
    expect(parsePjlId(''), isNull);
    expect(parsePjlId('@PJL INFO ID\r\n'), isNull);
    expect(commandHasPcl5('PCL6'), isFalse);
    expect(commandHasPcl5('UFR II'), isFalse);
    expect(deviceSupportsPcl5('PCL,PCLXL'), isFalse);
    expect(deviceSupportsPcl5('application/vnd.hp-PCLXL'), isFalse);
    expect(deviceSupportsPcl5('application/vnd.hp-PCL,application/vnd.hp-PCLXL'), isTrue);
    expect(deviceSupportsPdf('application/pdf,image/urf'), isTrue);
    expect(deviceSupportsPcl5('image/urf,application/octet-stream'), isFalse);
    final txt = parseServiceTxt('ty=Sindoh D450\npdl=application/pdf,image/urf,application/vnd.hp-PCLXL\n');
    expect(txt.model, 'Sindoh D450');
    expect(txt.pdf, isTrue);
    expect(txt.pcl5, isFalse);
    expect(txt.known, isTrue);
    final pclOnly = parseServiceTxt('product=(Canon iR)\npdl=application/vnd.hp-PCL\n');
    expect(pclOnly.model, 'Canon iR');
    expect(pclOnly.pdf, isFalse);
    expect(pclOnly.pcl5, isTrue);
    expect(parseServiceTxt('pdl=application/vnd.hp-PCLXL,image/urf\n').known, isFalse);
  });

  test('transparent PDF pixels composite onto white paper', () {
    final clear = compositeBgraOverWhite(Uint8List.fromList([0, 0, 0, 0]), 1, 1);
    expect(clear, [255, 255, 255, 255]);
    final red = compositeBgraOverWhite(Uint8List.fromList([0, 0, 255, 255]), 1, 1);
    expect(red, [255, 0, 0, 255]);
    expect(compositedLuma(0, 0, 0, 0), 255);
    expect(compositedLuma(255, 0, 0, 255), closeTo(76.5, 0.01));
    final blank = Uint8List(8 * 8 * 4);
    final white = Uint8List(8 * 8 * 4)..fillRange(0, blank.length, 255);
    expect(
      String.fromCharCodes(concat(packetsFromRgba(blank, 8, 8, 'threshold'))),
      String.fromCharCodes(concat(packetsFromRgba(white, 8, 8, 'threshold'))),
    );
    final black = Uint8List(8 * 8 * 4);
    for (var index = 0; index < black.length; index += 4) {
      black[index + 3] = 255;
    }
    expect(
      String.fromCharCodes(concat(packetsFromRgba(black, 8, 8, 'threshold'))),
      isNot(String.fromCharCodes(concat(packetsFromRgba(white, 8, 8, 'threshold')))),
    );
  });

  test('diagnostic log keeps 50 lines and hides passwords', () {
    final log = DiagLog();
    for (var i = 0; i < 60; i++) {
      log.add('mDNS $i');
    }
    expect(log.length, 50);
    expect(log.dump().contains('mDNS 0'), isFalse);
    expect(log.dump().contains('mDNS 59'), isTrue);
    log.add('비밀번호=secret-file');
    expect(log.dump().contains('secret-file'), isFalse);
    expect(log.dump().contains('비밀번호=***'), isTrue);
  });

  test('rolling dither matches full-buffer Floyd-Steinberg', () {
    final patterns = <Uint8List>[
      Uint8List.fromList([for (var i = 0; i < 8 * 6 * 4; i++) (i * 17) % 256]),
      Uint8List.fromList([for (var i = 0; i < 3 * 5 * 4; i++) i.isEven ? 0 : 255]),
      Uint8List.fromList([for (var i = 0; i < 1 * 4 * 4; i++) 90]),
      Uint8List(2 * 2 * 4)..fillRange(0, 16, 180),
    ];
    final sizes = [(8, 6), (3, 5), (1, 4), (2, 2)];
    for (var sample = 0; sample < patterns.length; sample += 1) {
      final rgba = patterns[sample];
      final width = sizes[sample].$1;
      final height = sizes[sample].$2;
      for (final mode in [RasterMode.dither, RasterMode.threshold]) {
        expect(monoRolling(rgba, width, height, mode), _referenceMono(rgba, width, height, mode), reason: '$mode ${width}x$height');
      }
    }
    expect(concat(blankSheetCommands(8, 8)), encodePclPageFromMono(Uint8List(8 * 8), 8, 8));
    expect(concat(blankSheetCommands(17, 3)), encodePclPageFromMono(Uint8List(17 * 3), 17, 3));
  });

  test('mDNS stop swallows lookup and TimeoutException is not an address error', () async {
    final closed = ScanGate()..stop();
    var called = false;
    final blocked = await lookupIfActive<int>(closed, () async {
      called = true;
      throw StateError('mDNS client must be started before calling lookup.');
    });
    expect(called, isFalse);
    expect(blocked, isNull);
    final open = ScanGate();
    final failed = await lookupIfActive<int>(open, () async {
      throw StateError('mDNS client must be started before calling lookup.');
    });
    expect(failed, isNull);
    final message = friendlyPrintError(TimeoutException('after 0:00:15.000000'));
    expect(message, contains('15초'));
    expect(message.contains('주소를 다시'), isFalse);
    expect(pdfHasPages(0), isFalse);
    expect(pdfHasPages(2), isTrue);
    expect(connectFailureMessage(host: '192.168.0.10', service: '_ipp._tcp', ios: false), contains('9100'));
    expect(shareFailureMessage('too_large'), contains('80MB'));
    expect(shareFailureMessage('empty'), contains('빈 파일'));
  });

  test('password-unlocked PDF stays on PCL5e', () {
    expect(
      resolvePrintRoute(
        docKind: DocKind.pdf,
        hasPdfBytes: true,
        pdfDirectAllowed: true,
        devicePdf: true,
        pageMode: PageMode.all,
        gray: false,
        passwordUnlocked: true,
      ),
      PrintRoute.pcl,
    );
    final encrypted = Uint8List.fromList('/Encrypt 1 0 R'.codeUnits);
    expect(pdfLooksEncrypted(encrypted), isTrue);
    expect(canPdfDirectBytes(encrypted), isFalse);
    expect(
      resolvePrintRoute(
        docKind: DocKind.pdf,
        hasPdfBytes: true,
        pdfDirectAllowed: canPdfDirectBytes(encrypted),
        devicePdf: true,
        pageMode: PageMode.all,
        gray: false,
      ),
      PrintRoute.pcl,
    );
  });

  test('mDNS merges IPP text and ignores link-local IPv6', () {
    final ipp = mergePrinter(
      existing: null,
      service: '_ipp._tcp',
      host: '192.168.0.20',
      port: 9100,
      instanceName: 'Canon._ipp._tcp.local',
      model: 'Canon iR',
      languages: 'application/pdf,application/vnd.hp-PCL',
    );
    final merged = mergePrinter(
      existing: ipp,
      service: '_pdl-datastream._tcp',
      host: '192.168.0.20',
      port: 9100,
      instanceName: 'Canon._pdl-datastream._tcp.local',
      model: '',
      languages: '',
    );
    expect(merged.model, 'Canon iR');
    expect(merged.languages, contains('application/pdf'));
    expect(merged.service, '_ipp._tcp');
    expect(merged.name, 'Canon iR');
    expect(usablePrinterHost(InternetAddress('192.168.0.20')), isTrue);
    expect(usablePrinterHost(InternetAddress('fe80::1')), isFalse);
    expect(usablePrinterHost(InternetAddress('2001:db8::1')), isFalse);
  });

  test('paper pixels match PCL S and T', () {
    for (final spec in papers.values) {
      expect(spec.width % 8, 0, reason: spec.pjl);
      expect((spec.width + 7) >> 3, spec.width ~/ 8, reason: spec.pjl);
      final text = String.fromCharCodes(concat(blankSheetCommands(spec.width, spec.height)));
      expect(text, contains('\x1B*r${spec.width}S\x1B*r${spec.height}T'));
    }
    expect(() => packetsFromRgba(Uint8List(8 * 8 * 4 - 4), 8, 8, 'threshold'), throwsStateError);
    final exact = Uint8List(8 * 8 * 4)..fillRange(0, 8 * 8 * 4, 255);
    final page = String.fromCharCodes(concat(packetsFromRgba(exact, 8, 8, 'threshold')));
    expect(page, contains('\x1B*r8S\x1B*r8T'));
  });
}

bool _closed(Uint8List packet) {
  var index = 0;
  while (index < packet.length) {
    if (packet[index] == 0x0c) {
      index += 1;
      continue;
    }
    if (packet[index] != 0x1b) return false;
    index += 1;
    if (index < packet.length && packet[index] == 0x45) {
      index += 1;
      continue;
    }
    var word = '';
    while (index < packet.length) {
      final value = packet[index];
      index += 1;
      if (value >= 65 && value <= 90) {
        word += String.fromCharCode(value);
        break;
      }
      if ((value >= 48 && value <= 57) || (value >= 97 && value <= 122)) word += String.fromCharCode(value);
    }
    if (word.endsWith('W')) {
      final count = int.parse(word.replaceAll(RegExp(r'[^\d]'), ''));
      if (index + count > packet.length) return false;
      index += count;
    }
  }
  return index == packet.length;
}

Uint8List _referenceMono(Uint8List rgba, int width, int height, RasterMode mode) {
  final count = width * height;
  final luma = Float32List(count);
  for (var index = 0; index < count; index += 1) {
    final offset = index * 4;
    final a = offset + 3 < rgba.length ? rgba[offset + 3] : 255;
    luma[index] = compositedLuma(rgba[offset], rgba[offset + 1], rgba[offset + 2], a);
  }
  return monoFromLuma(luma, width, height, mode);
}
