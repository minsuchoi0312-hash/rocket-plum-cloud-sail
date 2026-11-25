import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import '../engine/pjl_id.dart';

class RawLink {
  Socket? _socket;

  Future<void> open(String host, int port) async {
    _socket = await Socket.connect(host, port, timeout: const Duration(seconds: 5));
  }

  Future<void> write(Uint8List bytes) async {
    final socket = _socket;
    if (socket == null) throw StateError('복사기와 연결이 없어요.');
    socket.add(bytes);
    await socket.flush().timeout(const Duration(seconds: 15));
  }

  Future<void> close() async {
    _socket?.destroy();
    _socket = null;
  }
}

class PrinterProbe {
  const PrinterProbe({required this.connectMs, required this.raw, this.model});
  final int connectMs;
  final String raw;
  final String? model;
}

/// TCP로 붙고 `@PJL INFO ID`를 보낸 뒤 2초 안에 모델명을 읽는다.
/// 연결 자체에 실패하면 던지고, 응답이 없으면 raw는 빈 문자열이다.
Future<PrinterProbe> queryPrinterId(String host, int port) async {
  final started = DateTime.now();
  final socket = await Socket.connect(host, port, timeout: const Duration(seconds: 5));
  final connectMs = DateTime.now().difference(started).inMilliseconds;
  final buffer = BytesBuilder(copy: false);
  try {
    socket.add(Uint8List.fromList('\x1B%-12345X@PJL INFO ID\r\n\x1B%-12345X'.codeUnits));
    try {
      await socket.flush().timeout(const Duration(seconds: 2));
    } catch (_) {}
    final done = Completer<void>();
    final sub = socket.listen(
      (chunk) {
        buffer.add(chunk);
        if (buffer.length >= 2048 && !done.isCompleted) done.complete();
      },
      onError: (_) {
        if (!done.isCompleted) done.complete();
      },
      onDone: () {
        if (!done.isCompleted) done.complete();
      },
      cancelOnError: true,
    );
    await done.future.timeout(const Duration(seconds: 2), onTimeout: () {});
    await sub.cancel();
  } finally {
    socket.destroy();
  }
  final raw = buffer.isEmpty ? '' : String.fromCharCodes(buffer.toBytes());
  return PrinterProbe(connectMs: connectMs, raw: raw, model: raw.isEmpty ? null : parsePjlId(raw));
}
