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

Future<ui.Image> composeContain({
  required ui.Image source,
  required int width,
  required int height,
}) async {
  final turn = source.width > source.height;
  final srcW = turn ? source.height.toDouble() : source.width.toDouble();
  final srcH = turn ? source.width.toDouble() : source.height.toDouble();
  final scale = math.min(width / srcW, height / srcH);
  final drawW = srcW * scale;
  final drawH = srcH * scale;
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  canvas.drawRect(Rect.fromLTWH(0, 0, width.toDouble(), height.toDouble()), Paint()..color = const Color(0xFFFFFFFF));
  canvas.save();
  canvas.translate(width / 2, height / 2);
  if (turn) canvas.rotate(math.pi / 2);
  final destW = turn ? drawH : drawW;
  final destH = turn ? drawW : drawH;
  canvas.drawImageRect(
    source,
    Rect.fromLTWH(0, 0, source.width.toDouble(), source.height.toDouble()),
    Rect.fromCenter(center: Offset.zero, width: destW, height: destH),
    Paint()..filterQuality = FilterQuality.medium,
  );
  canvas.restore();
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

Future<Uint8List> rasterize(ui.Image source, int width, int height) async {
  final sheet = await composeContain(source: source, width: width, height: height);
  try {
    if (sheet.width != width || sheet.height != height) {
      throw StateError('래스터 크기와 헤더가 달라요.');
    }
    return await rgbaOf(sheet);
  } finally {
    sheet.dispose();
  }
}
