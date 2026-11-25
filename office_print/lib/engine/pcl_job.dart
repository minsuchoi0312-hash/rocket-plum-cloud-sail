import 'dart:isolate';
import 'dart:typed_data';

import 'packbits.dart';

enum OfficePaper { a4, a3, b5 }

enum DuplexMode { simplex, long, short }

enum RasterMode { threshold, dither }

enum PaperTray { auto, manual, tray1, tray2 }

/// HP PCL5e `ESC &l#H`. 자동은 7이라 이전 작업의 용지함이 남지 않는다. 용지함 2는 하단 카세트(4). 45는 B5 용지 코드라 쓰지 않는다.
int pclTrayCode(PaperTray tray) => switch (tray) {
      PaperTray.auto => 7,
      PaperTray.manual => 2,
      PaperTray.tray1 => 1,
      PaperTray.tray2 => 4,
    };

String pjlMediaSource(PaperTray tray) => switch (tray) {
      PaperTray.auto => 'AUTO',
      PaperTray.manual => 'MANUAL',
      PaperTray.tray1 => 'TRAY1',
      PaperTray.tray2 => 'TRAY2',
    };

String sanitizeUsername(String raw) {
  final cleaned = raw.replaceAll(RegExp(r'[^A-Za-z0-9]'), '');
  if (cleaned.isEmpty) return 'MOBILE';
  return cleaned.length > 31 ? cleaned.substring(0, 31) : cleaned;
}

bool validHoldPin(String pin) => RegExp(r'^\d{4}$').hasMatch(pin);

int outputSheetCount(int pageCount, int perSheet) {
  final pages = pageCount < 0 ? 0 : pageCount;
  final each = perSheet < 1 ? 1 : perSheet;
  if (pages == 0) return 0;
  return (pages + each - 1) ~/ each;
}

/// 모아찍기는 읽기 순서로 먼저 묶고, 역순은 그 묶음만 뒤집는다.
/// 쪽을 먼저 뒤집으면 2쪽에서 1·2가 한 장에 모이지 않는다.
List<List<int>> nupGroups(List<int> pages, int perSheet, {bool reverse = false}) {
  final per = perSheet < 1 ? 1 : perSheet;
  final groups = <List<int>>[];
  for (var start = 0; start < pages.length; start += per) {
    final end = start + per > pages.length ? pages.length : start + per;
    groups.add(List<int>.from(pages.sublist(start, end)));
  }
  if (!reverse) return groups;
  return groups.reversed.toList();
}

class PaperSpec {
  const PaperSpec({required this.pcl, required this.pjl, required this.width, required this.height});
  final int pcl;
  final String pjl;
  final int width;
  final int height;
}

const papers = <OfficePaper, PaperSpec>{
  OfficePaper.a4: PaperSpec(pcl: 26, pjl: 'A4', width: 2336, height: 3364),
  OfficePaper.a3: PaperSpec(pcl: 27, pjl: 'A3', width: 3368, height: 4817),
  OfficePaper.b5: PaperSpec(pcl: 45, pjl: 'B5', width: 2008, height: 2891),
};

int clampCopies(int copies) => copies < 1 ? 1 : (copies > 99 ? 99 : copies);

Uint8List concat(List<Uint8List> parts) {
  final size = parts.fold<int>(0, (sum, part) => sum + part.length);
  final out = Uint8List(size);
  var offset = 0;
  for (final part in parts) {
    out.setRange(offset, offset + part.length, part);
    offset += part.length;
  }
  return out;
}

final _ascii = _Ascii();

class _Ascii {
  Uint8List encode(String text) => Uint8List.fromList(text.codeUnits);
}

String pjl({
  required int copies,
  required DuplexMode duplex,
  required OfficePaper paper,
  required String language,
  required int pages,
  String? holdKey,
  String username = 'MOBILE',
  PaperTray tray = PaperTray.auto,
}) {
  final count = clampCopies(copies);
  // QTY와 COPIES를 같이 넣으면 기종에 따라 부수가 곱해진다. 여러 쪽은 QTY, 한 쪽은 COPIES만.
  final lines = <String>[
    '\x1B%-12345X@PJL JOB',
    pages > 1 ? '@PJL SET QTY=$count' : '@PJL SET COPIES=$count',
  ];
  if (paper != OfficePaper.b5) lines.add('@PJL SET PAPER=${papers[paper]!.pjl}');
  lines.add('@PJL SET MEDIASOURCE=${pjlMediaSource(tray)}');
  if (duplex == DuplexMode.simplex) {
    lines.add('@PJL SET DUPLEX=OFF');
  } else {
    lines.add('@PJL SET DUPLEX=ON');
    lines.add('@PJL SET BINDING=${duplex == DuplexMode.long ? 'LONGEDGE' : 'SHORTEDGE'}');
  }
  if (holdKey != null && validHoldPin(holdKey)) {
    lines.add('@PJL SET HOLD=ON');
    lines.add('@PJL SET HOLDTYPE=PRIVATE');
    lines.add('@PJL SET HOLDKEY="$holdKey"');
    lines.add('@PJL SET USERNAME="${sanitizeUsername(username)}"');
  }
  lines.add('@PJL ENTER LANGUAGE=$language');
  return '${lines.join('\r\n')}\r\n';
}

Uint8List wrapPdfJob(
  Uint8List pdf, {
  required int copies,
  required DuplexMode duplex,
  required OfficePaper paper,
  required int pages,
  String? holdKey,
  String username = 'MOBILE',
  PaperTray tray = PaperTray.auto,
}) {
  return concat([
    _ascii.encode(pjl(copies: copies, duplex: duplex, paper: paper, language: 'PDF', pages: pages, holdKey: holdKey, username: username, tray: tray)),
    pdf,
    _ascii.encode('\r\n\x1B%-12345X@PJL EOJ\r\n\x1B%-12345X'),
  ]);
}

Uint8List pclJobHeader({
  required int copies,
  required DuplexMode duplex,
  required OfficePaper paper,
  required int pages,
  String? holdKey,
  String username = 'MOBILE',
  PaperTray tray = PaperTray.auto,
}) {
  final spec = papers[paper]!;
  final side = duplex == DuplexMode.long ? 1 : duplex == DuplexMode.short ? 2 : 0;
  final trayEsc = '\x1B&l${pclTrayCode(tray)}H';
  return _ascii.encode(
    '${pjl(copies: copies, duplex: duplex, paper: paper, language: 'PCL', pages: pages, holdKey: holdKey, username: username, tray: tray)}'
    '\x1BE\x1B&l${spec.pcl}A\x1B&l0O$trayEsc\x1B&l${side}S\x1B&u300D\x1B&l0E\x1B&l0L\x1B&a0L\x1B*t300R\x1B*r0F',
  );
}

Uint8List pclJobFooter() => _ascii.encode('\x1BE\x1B%-12345X@PJL EOJ\r\n\x1B%-12345X');

Uint8List pclAbortFooter() => _ascii.encode('\x1B*rC\x1BE\x1B%-12345X@PJL EOJ\r\n\x1B%-12345X');

bool needsBlankBack(int pageCount, DuplexMode duplex) => duplex != DuplexMode.simplex && pageCount.isOdd;

Uint8List monoFromLuma(Float32List luma, int width, int height, RasterMode mode) {
  final count = width * height;
  final mono = Uint8List(count);
  if (mode == RasterMode.threshold) {
    for (var index = 0; index < count; index += 1) {
      mono[index] = luma[index] < 175 ? 1 : 0;
    }
    return mono;
  }
  final gray = Float32List.fromList(luma);
  for (var index = 0; index < count; index += 1) {
    if (gray[index] >= 240) {
      gray[index] = 255;
    } else if (gray[index] <= 40) {
      gray[index] = 0;
    }
  }
  for (var y = 0; y < height; y += 1) {
    for (var x = 0; x < width; x += 1) {
      final index = y * width + x;
      final old = gray[index];
      final next = old < 128 ? 0.0 : 255.0;
      final error = old - next;
      gray[index] = next;
      if (x + 1 < width) gray[index + 1] += error * 7 / 16;
      if (y + 1 < height) {
        if (x > 0) gray[index + width - 1] += error * 3 / 16;
        gray[index + width] += error * 5 / 16;
        if (x + 1 < width) gray[index + width + 1] += error / 16;
      }
    }
  }
  for (var index = 0; index < count; index += 1) {
    mono[index] = gray[index] < 128 ? 1 : 0;
  }
  return mono;
}

List<Uint8List> pclPageCommands(Uint8List mono, int width, int height) {
  final dots = Uint8List.fromList(mono);
  var marked = false;
  for (var index = 0; index < dots.length; index += 1) {
    if (dots[index] != 0) {
      marked = true;
      break;
    }
  }
  if (!marked && width > 0 && height > 0) dots[dots.length - 1] = 1;
  final bytesPerRow = (width + 7) >> 3;
  final commands = <Uint8List>[_ascii.encode('\x1B*p0x72Y\x1B*r${width}S\x1B*r${height}T\x1B*r1A\x1B*b2M')];
  var skip = 0;
  void flushSkip() {
    if (skip < 1) return;
    commands.add(_ascii.encode('\x1B*b${skip}Y'));
    skip = 0;
  }

  for (var y = 0; y < height; y += 1) {
    final packed = Uint8List(bytesPerRow);
    var ink = false;
    for (var x = 0; x < width; x += 1) {
      if (dots[y * width + x] == 0) continue;
      packed[x >> 3] |= 0x80 >> (x & 7);
      ink = true;
    }
    if (!ink) {
      skip += 1;
      continue;
    }
    flushSkip();
    var end = packed.length;
    while (end > 0 && packed[end - 1] == 0) {
      end -= 1;
    }
    final compressed = packBits(Uint8List.sublistView(packed, 0, end));
    final prefix = _ascii.encode('\x1B*b${compressed.length}W');
    final line = Uint8List(prefix.length + compressed.length);
    line.setRange(0, prefix.length, prefix);
    line.setRange(prefix.length, line.length, compressed);
    commands.add(line);
  }
  flushSkip();
  commands.add(_ascii.encode('\x1B*rC\x0C'));
  return commands;
}

List<Uint8List> bundleCommands(List<Uint8List> commands, {int limit = 4096}) {
  final packets = <Uint8List>[];
  final bucket = <Uint8List>[];
  var size = 0;
  void flush() {
    if (bucket.isEmpty) return;
    packets.add(concat(bucket));
    bucket.clear();
    size = 0;
  }

  for (final command in commands) {
    if (size > 0 && size + command.length > limit) flush();
    bucket.add(command);
    size += command.length;
    if (size >= limit) flush();
  }
  flush();
  return packets;
}

Uint8List encodePclPageFromMono(Uint8List mono, int width, int height) => concat(pclPageCommands(mono, width, height));

int overWhite(int channel, int alpha) => (channel * alpha + 255 * (255 - alpha) + 127) ~/ 255;

/// 투명 픽셀은 흰 종이 위로 합성한 뒤 0.3R+0.59G+0.11B.
double compositedLuma(int r, int g, int b, int a) {
  return overWhite(r, a) * 0.3 + overWhite(g, a) * 0.59 + overWhite(b, a) * 0.11;
}

List<Uint8List> packetsFromRgba(Uint8List rgba, int width, int height, String modeName) {
  final need = width * height * 4;
  if (width < 1 || height < 1 || rgba.length < need) {
    throw StateError('래스터 크기와 헤더가 달라요.');
  }
  final mode = modeName == 'threshold' ? RasterMode.threshold : RasterMode.dither;
  final encoder = _RowEncoder(width, height);
  _emitMonoRows(rgba, width, height, mode, encoder.add);
  return bundleCommands(encoder.finish());
}

List<Uint8List> packetsFromTransfer(TransferableTypedData data, int width, int height, String modeName) {
  final rgba = data.materialize().asUint8List();
  return packetsFromRgba(rgba, width, height, modeName);
}

List<Uint8List> blankPagePackets(int width, int height) => bundleCommands(blankSheetCommands(width, height));

/// 전부 흰 쪽에 끝 픽셀 한 점만 찍은 PCL. 전체 버퍼를 만들지 않는다.
List<Uint8List> blankSheetCommands(int width, int height) {
  final encoder = _RowEncoder(width, height, blankIfEmpty: false);
  for (var y = 0; y < height; y += 1) {
    final row = Uint8List(width);
    if (y == height - 1 && width > 0) row[width - 1] = 1;
    encoder.add(row);
  }
  return encoder.finish();
}

/// 테스트용. 롤링 2줄 디더의 1비트 평면을 돌려준다.
Uint8List monoRolling(Uint8List rgba, int width, int height, RasterMode mode) {
  final mono = Uint8List(width * height);
  var y = 0;
  _emitMonoRows(rgba, width, height, mode, (row) {
    mono.setRange(y * width, (y + 1) * width, row);
    y += 1;
  });
  return mono;
}

void _emitMonoRows(Uint8List rgba, int width, int height, RasterMode mode, void Function(Uint8List row) emit) {
  if (width < 1 || height < 1) return;
  if (mode == RasterMode.threshold) {
    final row = Uint8List(width);
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        row[x] = _lumaAt(rgba, width, x, y) < 175 ? 1 : 0;
      }
      emit(Uint8List.fromList(row));
    }
    return;
  }
  var current = Float32List(width);
  var next = Float32List(width);
  final row = Uint8List(width);
  for (var y = 0; y < height; y += 1) {
    for (var x = 0; x < width; x += 1) {
      var luma = _lumaAt(rgba, width, x, y);
      if (luma >= 240) {
        luma = 255;
      } else if (luma <= 40) {
        luma = 0;
      }
      final old = luma + current[x];
      final quant = old < 128 ? 0.0 : 255.0;
      final error = old - quant;
      row[x] = quant < 128 ? 1 : 0;
      if (x + 1 < width) current[x + 1] = current[x + 1] + error * 7 / 16;
      if (y + 1 < height) {
        if (x > 0) next[x - 1] = next[x - 1] + error * 3 / 16;
        next[x] = next[x] + error * 5 / 16;
        if (x + 1 < width) next[x + 1] = next[x + 1] + error / 16;
      }
    }
    emit(Uint8List.fromList(row));
    final swap = current;
    current = next;
    next = swap;
    next.fillRange(0, width, 0);
  }
}

double _lumaAt(Uint8List rgba, int width, int x, int y) {
  final offset = (y * width + x) * 4;
  final a = offset + 3 < rgba.length ? rgba[offset + 3] : 255;
  final r = offset < rgba.length ? rgba[offset] : 0;
  final g = offset + 1 < rgba.length ? rgba[offset + 1] : 0;
  final b = offset + 2 < rgba.length ? rgba[offset + 2] : 0;
  return compositedLuma(r, g, b, a);
}

class _RowEncoder {
  _RowEncoder(this.width, this.height, {this.blankIfEmpty = true}) {
    if (width > 0 && height > 0) {
      commands.add(_ascii.encode('\x1B*p0x72Y\x1B*r${width}S\x1B*r${height}T\x1B*r1A\x1B*b2M'));
    }
  }

  final int width;
  final int height;
  final bool blankIfEmpty;
  final commands = <Uint8List>[];
  var marked = false;
  var skip = 0;

  void add(Uint8List row) {
    final bytesPerRow = (width + 7) >> 3;
    final packed = Uint8List(bytesPerRow);
    var ink = false;
    final limit = row.length < width ? row.length : width;
    for (var x = 0; x < limit; x += 1) {
      if (row[x] == 0) continue;
      packed[x >> 3] |= 0x80 >> (x & 7);
      ink = true;
    }
    if (!ink) {
      skip += 1;
      return;
    }
    marked = true;
    _flushSkip();
    var end = packed.length;
    while (end > 0 && packed[end - 1] == 0) {
      end -= 1;
    }
    final compressed = packBits(Uint8List.sublistView(packed, 0, end));
    final prefix = _ascii.encode('\x1B*b${compressed.length}W');
    final line = Uint8List(prefix.length + compressed.length);
    line.setRange(0, prefix.length, prefix);
    line.setRange(prefix.length, line.length, compressed);
    commands.add(line);
  }

  List<Uint8List> finish() {
    if (blankIfEmpty && !marked) return blankSheetCommands(width, height);
    _flushSkip();
    commands.add(_ascii.encode('\x1B*rC\x0C'));
    return commands;
  }

  void _flushSkip() {
    if (skip < 1) return;
    commands.add(_ascii.encode('\x1B*b${skip}Y'));
    skip = 0;
  }
}

int rasterTurn(double width, double height) => width > height ? 90 : 0;
