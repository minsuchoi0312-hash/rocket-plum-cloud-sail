import 'dart:io';

import 'package:flutter/services.dart';

class SharedFile {
  const SharedFile({required this.path, required this.kind, this.error = ''});
  final String path;
  final String kind;
  final String error;
  bool get failed => error.isNotEmpty;
}

/// 안드로이드 `ACTION_SEND`로 들어온 파일을 받는다. iOS에서는 아무것도 하지 않는다.
class ShareInbox {
  static const _channel = MethodChannel('office_print/share');

  static void listen(Future<void> Function(SharedFile file) onShare) {
    if (!Platform.isAndroid) return;
    _channel.setMethodCallHandler((call) async {
      if (call.method != 'shared') return;
      final file = _parse(call.arguments);
      if (file != null) await onShare(file);
    });
  }

  static Future<SharedFile?> take() async {
    if (!Platform.isAndroid) return null;
    final raw = await _channel.invokeMethod<Map<dynamic, dynamic>>('take');
    return _parse(raw);
  }

  static SharedFile? _parse(Object? raw) {
    if (raw is! Map) return null;
    final error = '${raw['error'] ?? ''}';
    if (error.isNotEmpty) return SharedFile(path: '', kind: '', error: error);
    final path = '${raw['path'] ?? ''}';
    final kind = '${raw['kind'] ?? ''}';
    if (path.isEmpty || (kind != 'pdf' && kind != 'photo')) return null;
    return SharedFile(path: path, kind: kind);
  }
}
