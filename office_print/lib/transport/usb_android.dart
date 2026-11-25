import 'dart:io';

import 'package:flutter/services.dart';

class UsbPrinterInfo {
  const UsbPrinterInfo({required this.deviceId, required this.name});
  final int deviceId;
  final String name;
}

class UsbIdentity {
  const UsbIdentity({required this.deviceId, required this.query, required this.cmd, required this.title, this.raw = ''});
  final int deviceId;
  final String query;
  final String cmd;
  final String title;
  final String raw;
}

class UsbAndroid {
  static const _channel = MethodChannel('office_print/usb');

  Future<List<UsbPrinterInfo>> list() async {
    if (!Platform.isAndroid) return const [];
    final raw = await _channel.invokeMethod<List<dynamic>>('list');
    return (raw ?? const []).map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return UsbPrinterInfo(deviceId: map['deviceId'] as int, name: '${map['name'] ?? 'USB 복사기'}');
    }).toList();
  }

  Future<UsbIdentity> open(int deviceId) async {
    if (!Platform.isAndroid) {
      throw StateError('USB는 안드로이드에서만 쓸 수 있어요.');
    }
    final raw = await _channel.invokeMethod<Map<dynamic, dynamic>>('open', {'deviceId': deviceId});
    final map = Map<String, dynamic>.from(raw ?? const {});
    return UsbIdentity(
      deviceId: deviceId,
      query: '${map['query'] ?? ''}',
      cmd: '${map['cmd'] ?? ''}',
      title: '${map['title'] ?? 'USB 복사기'}',
      raw: '${map['raw'] ?? ''}',
    );
  }

  /// 케이블이 빠지면 네이티브가 `detached`를 보낸다.
  /// 이 핸들러는 네이티브→Dart 수신만 바꾼다. `invokeMethod`로 나가는 쓰기와는 덮어쓰지 않는다.
  void listenDetached(void Function() onDetached) {
    if (!Platform.isAndroid) return;
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'detached') onDetached();
    });
  }

  Future<void> write(Uint8List bytes) async {
    if (!Platform.isAndroid) {
      throw StateError('USB는 안드로이드에서만 쓸 수 있어요.');
    }
    await _channel.invokeMethod<void>('write', {'bytes': bytes});
  }

  /// 진행 중인 bulk 쓰기만 끊는다. 인터페이스는 닫지 않아서 종료 PJL을 이어서 보낼 수 있다.
  Future<void> stopWrite() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod<void>('stop');
    } catch (_) {}
  }

  Future<void> cancel() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod<void>('cancel');
    } catch (_) {}
  }

  Future<void> close() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod<void>('close');
    } catch (_) {}
  }

  /// 인쇄 중 화면이 꺼져도 프로세스를 붙잡는다. 알림 권한이 없어도 예외를 삼킨다.
  Future<void> startGuard() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod<void>('guardStart');
    } catch (_) {}
  }

  Future<void> stopGuard() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod<void>('guardStop');
    } catch (_) {}
  }

  Future<void> openSettings() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod<void>('openSettings');
    } catch (_) {}
  }
}
