import 'dart:async';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:material_ui/material_ui.dart';

import '../engine/memo.dart';

Future<Uint8List> rgbaOf(ui.Image image) async {
  final data = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
  if (data == null) throw StateError('화면을 만들지 못했어요.');
  final bytes = data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes);
  final expectLength = image.width * image.height * 4;
  if (bytes.length != expectLength) throw StateError('래스터 크기와 헤더가 달라요.');
  return bytes;
}

enum FrameFit { contain, cover }

enum FrameTurn { auto, portrait, landscape }

bool _shouldTurn(ui.Image source, FrameTurn turn) => switch (turn) {
      FrameTurn.auto => source.width > source.height,
      FrameTurn.portrait => false,
      FrameTurn.landscape => true,
    };

class FramePlacement {
  const FramePlacement({
    required this.visualWidth,
    required this.visualHeight,
    required this.destWidth,
    required this.destHeight,
    required this.rotate,
  });

  final double visualWidth;
  final double visualHeight;
  final double destWidth;
  final double destHeight;
  final bool rotate;
}

/// 맞춤은 칸 안에 들어가고, 채우기는 칸을 덮는다. 회전은 그리기 전에만 하고 종이 픽셀 크기는 바꾸지 않는다.
FramePlacement? framePlacement({
  required double sourceWidth,
  required double sourceHeight,
  required double cellWidth,
  required double cellHeight,
  required FrameFit fit,
  required bool rotate,
}) {
  final srcW = rotate ? sourceHeight : sourceWidth;
  final srcH = rotate ? sourceWidth : sourceHeight;
  if (srcW <= 0 || srcH <= 0 || cellWidth <= 0 || cellHeight <= 0) return null;
  final scale = fit == FrameFit.cover ? math.max(cellWidth / srcW, cellHeight / srcH) : math.min(cellWidth / srcW, cellHeight / srcH);
  if (!scale.isFinite || scale <= 0) return null;
  final drawW = srcW * scale;
  final drawH = srcH * scale;
  final destW = rotate ? drawH : drawW;
  final destH = rotate ? drawW : drawH;
  if (destW <= 0 || destH <= 0 || !destW.isFinite || !destH.isFinite) return null;
  return FramePlacement(visualWidth: drawW, visualHeight: drawH, destWidth: destW, destHeight: destH, rotate: rotate);
}

void _paintFitted(Canvas canvas, ui.Image source, Rect cell, FrameFit fit, FrameTurn turn) {
  final placed = framePlacement(
    sourceWidth: source.width.toDouble(),
    sourceHeight: source.height.toDouble(),
    cellWidth: cell.width,
    cellHeight: cell.height,
    fit: fit,
    rotate: _shouldTurn(source, turn),
  );
  if (placed == null) return;
  canvas.save();
  canvas.clipRect(cell);
  canvas.translate(cell.center.dx, cell.center.dy);
  if (placed.rotate) canvas.rotate(math.pi / 2);
  canvas.drawImageRect(
    source,
    Rect.fromLTWH(0, 0, source.width.toDouble(), source.height.toDouble()),
    Rect.fromCenter(center: Offset.zero, width: placed.destWidth, height: placed.destHeight),
    Paint()..filterQuality = FilterQuality.medium,
  );
  canvas.restore();
}

Future<ui.Image> composeContain({
  required ui.Image source,
  required int width,
  required int height,
  FrameFit fit = FrameFit.contain,
  FrameTurn turn = FrameTurn.auto,
}) {
  return composeNup(sources: [source], width: width, height: height, columns: 1, rows: 1, fit: fit, turn: turn);
}

/// 2쪽은 세로 2단, 4쪽은 2×2. 칸이 비면 흰 종이로 남긴다. 원본 이미지는 여기서 버리지 않는다.
Future<ui.Image> composeNup({
  required List<ui.Image> sources,
  required int width,
  required int height,
  required int columns,
  required int rows,
  FrameFit fit = FrameFit.contain,
  FrameTurn turn = FrameTurn.auto,
}) async {
  final cols = columns < 1 ? 1 : columns;
  final rowCount = rows < 1 ? 1 : rows;
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  canvas.drawRect(Rect.fromLTWH(0, 0, width.toDouble(), height.toDouble()), Paint()..color = const Color(0xFFFFFFFF));
  final cellW = width / cols;
  final cellH = height / rowCount;
  final slots = cols * rowCount;
  for (var index = 0; index < sources.length && index < slots; index += 1) {
    final col = index % cols;
    final row = index ~/ cols;
    _paintFitted(
      canvas,
      sources[index],
      Rect.fromLTWH(col * cellW, row * cellH, cellW, cellH),
      fit,
      turn,
    );
  }
  final picture = recorder.endRecording();
  final image = await picture.toImage(width, height);
  picture.dispose();
  return image;
}

int channelOverWhite(int channel, int alpha) {
  return (channel * alpha + 255 * (255 - alpha) + 127) ~/ 255;
}

/// pdfrx BGRA를 흰 종이 위에 합성한다. 알파 0인 검정은 토너가 아니라 흰 종이여야 한다.
Uint8List compositeBgraOverWhite(Uint8List bgra, int width, int height) {
  final count = width * height * 4;
  if (width < 1 || height < 1 || bgra.length < count) {
    throw StateError('쪽 그림을 만들지 못했어요.');
  }
  final rgba = Uint8List(count);
  for (var index = 0; index < count; index += 4) {
    final alpha = bgra[index + 3];
    rgba[index] = channelOverWhite(bgra[index + 2], alpha);
    rgba[index + 1] = channelOverWhite(bgra[index + 1], alpha);
    rgba[index + 2] = channelOverWhite(bgra[index], alpha);
    rgba[index + 3] = 255;
  }
  return rgba;
}

Future<ui.Image> imageFromBgra(Uint8List bgra, int width, int height) {
  final rgba = compositeBgraOverWhite(bgra, width, height);
  final completer = Completer<ui.Image>();
  ui.decodeImageFromPixels(rgba, width, height, ui.PixelFormat.rgba8888, completer.complete);
  return completer.future;
}

Future<ui.Image> decodeBytes(Uint8List bytes, {int? targetWidth}) async {
  final codec = await ui.instantiateImageCodec(bytes, targetWidth: targetWidth);
  final frame = await codec.getNextFrame();
  codec.dispose();
  return frame.image;
}

List<String> memoChunksFor(String text, int width, int height) {
  final font = math.max(18.0, width / 28);
  final lines = wrapMeasuredLines(text, (value) {
    final painter = TextPainter(
      text: TextSpan(text: value, style: TextStyle(fontSize: font, color: const Color(0xFF1A2744))),
      textDirection: TextDirection.ltr,
    )..layout();
    final measured = painter.width;
    painter.dispose();
    return measured;
  }, math.max(40, width - font * 2));
  final perPage = math.max(1, ((height - font * 2) / (font * 1.4)).floor());
  return paginateLines(lines, perPage);
}

Future<ui.Image> paintTextSheet(String text, int width, int height) async {
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  canvas.drawRect(Rect.fromLTWH(0, 0, width.toDouble(), height.toDouble()), Paint()..color = const Color(0xFFFFFFFF));
  final font = math.max(18.0, width / 28);
  final painter = TextPainter(
    text: TextSpan(
      text: text,
      style: TextStyle(color: const Color(0xFF1A2744), fontSize: font, height: 1.4),
    ),
    textDirection: TextDirection.ltr,
  )..layout(maxWidth: width - font * 2);
  painter.paint(canvas, Offset(font, font * 2));
  painter.dispose();
  final picture = recorder.endRecording();
  final image = await picture.toImage(width, height);
  picture.dispose();
  return image;
}

Future<Uint8List> rasterize(
  ui.Image source,
  int width,
  int height, {
  FrameFit fit = FrameFit.contain,
  FrameTurn turn = FrameTurn.auto,
}) async {
  final ready = source.width == width && source.height == height && fit == FrameFit.contain && turn == FrameTurn.auto;
  final sheet = ready ? source : await composeContain(source: source, width: width, height: height, fit: fit, turn: turn);
  try {
    if (sheet.width != width || sheet.height != height) {
      throw StateError('래스터 크기와 헤더가 달라요.');
    }
    return await rgbaOf(sheet);
  } finally {
    if (!identical(sheet, source)) sheet.dispose();
  }
}
