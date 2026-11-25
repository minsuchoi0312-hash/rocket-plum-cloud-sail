import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class RememberedPrinter {
  const RememberedPrinter({required this.name, required this.host, required this.port, required this.languages});
  final String name;
  final String host;
  final int port;
  final String languages;

  Map<String, dynamic> toJson() => {'name': name, 'host': host, 'port': port, 'languages': languages};

  static RememberedPrinter fromJson(Map<String, dynamic> json) {
    return RememberedPrinter(
      name: '${json['name'] ?? '복사기'}',
      host: '${json['host'] ?? ''}',
      port: json['port'] is int ? json['port'] as int : int.tryParse('${json['port']}') ?? 9100,
      languages: '${json['languages'] ?? ''}',
    );
  }
}

class PrinterMemory {
  static const _key = 'recent-copiers';

  Future<List<RememberedPrinter>> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null || raw.isEmpty) return const [];
      final list = jsonDecode(raw);
      if (list is! List) return const [];
      return list.whereType<Map>().map((item) => RememberedPrinter.fromJson(Map<String, dynamic>.from(item))).toList();
    } catch (_) {
      return const [];
    }
  }

  Future<void> remember(RememberedPrinter printer) async {
    final current = await load();
    final next = [
      printer,
      ...current.where((item) => item.host != printer.host || item.port != printer.port),
    ].take(20);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, jsonEncode(next.map((item) => item.toJson()).toList()));
    } catch (_) {}
  }

  Future<void> forget(String host, int port) async {
    final current = await load();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _key,
        jsonEncode(current.where((item) => item.host != host || item.port != port).map((item) => item.toJson()).toList()),
      );
    } catch (_) {}
  }
}
