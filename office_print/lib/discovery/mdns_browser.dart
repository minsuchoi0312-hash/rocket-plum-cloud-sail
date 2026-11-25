import 'dart:async';
import 'dart:io';

import 'package:multicast_dns/multicast_dns.dart';

import '../engine/languages.dart';
import '../transport/multicast_gate.dart';

class FoundPrinter {
  const FoundPrinter({
    required this.name,
    required this.host,
    required this.port,
    required this.service,
    this.languages = '',
    this.model = '',
  });
  final String name;
  final String host;
  final int port;
  final String service;
  final String languages;
  final String model;
}

/// `client.stop()` 이후의 lookup 호출을 막는다.
class ScanGate {
  bool stopped = false;
  void stop() => stopped = true;
}

/// 게이트가 닫혔거나 lookup이 `StateError`를 던지면 null. 예외를 밖으로 올리지 않는다.
Future<T?> lookupIfActive<T>(ScanGate gate, Future<T?> Function() query) async {
  if (gate.stopped) return null;
  try {
    return await query();
  } on StateError {
    return null;
  } catch (_) {
    return null;
  }
}

/// 링크 로컬 IPv6(`fe80::`)와 IPv4가 아닌 주소는 복사기 연결에 쓰지 않는다.
bool usablePrinterHost(InternetAddress address) {
  if (address.type != InternetAddressType.IPv4) return false;
  final host = address.address.toLowerCase();
  if (host.contains(':') || host.startsWith('fe80')) return false;
  if (host == '0.0.0.0' || host.isEmpty) return false;
  return true;
}

/// 같은 IP:포트에 나중에 도착한 빈 TXT가 먼저 읽은 모델명·언어를 지우지 않는다.
FoundPrinter mergePrinter({
  FoundPrinter? existing,
  required String service,
  required String host,
  required int port,
  required String instanceName,
  required String model,
  required String languages,
}) {
  final nextModel = model.trim();
  final nextLanguages = languages.trim();
  final keptModel = nextModel.isNotEmpty ? nextModel : (existing?.model ?? '');
  final keptLanguages = nextLanguages.isNotEmpty ? nextLanguages : (existing?.languages ?? '');
  final fallback = instanceName.split('.').first.replaceAll(r'\', '');
  final name = keptModel.isNotEmpty ? keptModel : (existing != null && existing.name.isNotEmpty ? existing.name : fallback);
  final keepPrevious = existing != null && nextLanguages.isEmpty && (existing.languages.isNotEmpty || existing.model.isNotEmpty);
  return FoundPrinter(
    name: name,
    host: host,
    port: port,
    service: keepPrevious ? existing.service : service,
    languages: keptLanguages,
    model: keptModel,
  );
}

class MdnsBrowser {
  Future<List<FoundPrinter>> scan({Duration timeout = const Duration(seconds: 6)}) async {
    final client = MDnsClient();
    final found = <String, FoundPrinter>{};
    final gate = ScanGate();
    await MulticastGate.acquire();
    try {
      await client.start();
      final pending = <Future<void>>[
        _collect(client, gate, '_pdl-datastream._tcp', found),
        _collect(client, gate, '_ipp._tcp', found),
      ];
      try {
        await Future.wait(pending).timeout(timeout);
      } on TimeoutException {
        // 대기만 끊는다. _collect는 스스로 예외를 삼킨 뒤 끝난다.
      }
    } finally {
      gate.stop();
      client.stop();
      await MulticastGate.release();
    }
    return found.values.toList();
  }

  /// PTR은 첫 대가 아니라 2초 안에 도착한 서비스 이름을 모두 모은 뒤 SRV·A·TXT를 본다.
  Future<void> _collect(MDnsClient client, ScanGate gate, String service, Map<String, FoundPrinter> found) async {
    try {
      if (gate.stopped) return;
      const ptrWindow = Duration(milliseconds: 2000);
      final pending = <Future<void>>[];
      final seen = <String>{};
      final stream = client.lookup<PtrResourceRecord>(ResourceRecordQuery.serverPointer('$service.local'), timeout: ptrWindow);
      try {
        await for (final PtrResourceRecord ptr in stream) {
          if (gate.stopped) break;
          final name = ptr.domainName;
          if (name.isEmpty || !seen.add(name)) continue;
          pending.add(_addInstance(client, gate, service, name, found));
        }
      } catch (_) {}
      if (pending.isNotEmpty) await Future.wait(pending);
    } catch (_) {}
  }

  Future<void> _addInstance(
    MDnsClient client,
    ScanGate gate,
    String service,
    String domainName,
    Map<String, FoundPrinter> found,
  ) async {
    const limit = Duration(milliseconds: 1200);
    final srv = await _first<SrvResourceRecord>(client, gate, ResourceRecordQuery.service(domainName), limit);
    if (srv == null || gate.stopped) return;
    final ip = await _firstIpv4(client, gate, srv.target, limit);
    if (ip == null || gate.stopped) return;
    final txt = await _first<TxtResourceRecord>(client, gate, ResourceRecordQuery.text(domainName), limit);
    if (gate.stopped) return;
    final parsed = parseServiceTxt(txt?.text ?? '');
    final host = ip.address;
    final rawPort = service == '_ipp._tcp' ? 9100 : srv.port;
    final key = '$host:$rawPort';
    found[key] = mergePrinter(
      existing: found[key],
      service: service,
      host: host,
      port: rawPort,
      instanceName: domainName,
      model: parsed.model,
      languages: parsed.pdl,
    );
  }

  /// A 레코드만 본다. `fe80::` 같은 링크 로컬 IPv6는 후보에 넣지 않는다.
  Future<InternetAddress?> _firstIpv4(MDnsClient client, ScanGate gate, String target, Duration limit) {
    return lookupIfActive(gate, () async {
      if (gate.stopped) return null;
      try {
        await for (final IPAddressResourceRecord record in client.lookup<IPAddressResourceRecord>(ResourceRecordQuery.addressIPv4(target), timeout: limit).timeout(limit)) {
          if (usablePrinterHost(record.address)) return record.address;
        }
      } catch (_) {}
      return null;
    });
  }

  Future<T?> _first<T extends ResourceRecord>(MDnsClient client, ScanGate gate, ResourceRecordQuery query, Duration limit) {
    return lookupIfActive(gate, () async {
      if (gate.stopped) return null;
      try {
        await for (final T record in client.lookup<T>(query, timeout: limit).timeout(limit)) {
          return record;
        }
      } catch (_) {}
      return null;
    });
  }
}
