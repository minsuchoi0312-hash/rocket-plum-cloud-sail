import 'dart:io';

import 'package:flutter/services.dart';

/// 검색하는 동안만 멀티캐스트를 연다. iOS에서는 채널을 부르지 않는다.
class MulticastGate {
  static const _channel = MethodChannel('office_print/wifi');

  static Future<void> acquire() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod<void>('acquire');
    } catch (_) {}
  }

  static Future<void> release() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod<void>('release');
    } catch (_) {}
  }
}
