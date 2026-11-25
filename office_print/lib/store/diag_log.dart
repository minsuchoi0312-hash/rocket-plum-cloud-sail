/// 첫 실기기 테스트용 통신 기록. PDF 본문과 비밀번호는 넣지 않는다.
class DiagLog {
  static const maxLines = 50;
  final List<String> _lines = [];

  static String redact(String line) {
    final flat = line.replaceAll('\x1B', r'\x1B').replaceAll(RegExp(r'[\r\n\u0000]'), ' ').trim();
    final hidden = flat
        .replaceAll(
          RegExp(r'(비밀번호|password)\s*[:=]\s*\S+', caseSensitive: false),
          '비밀번호=***',
        )
        .replaceAll(
          RegExp(r'(HOLDKEY|PIN|핀)\s*[:=]\s*"?[A-Za-z0-9]+"?', caseSensitive: false),
          'PIN=****',
        );
    if (hidden.length <= 240) return hidden;
    return '${hidden.substring(0, 240)}…';
  }

  void add(String line) {
    final clean = redact(line);
    if (clean.isEmpty) return;
    final now = DateTime.now();
    final stamp = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
    _lines.add('$stamp $clean');
    if (_lines.length > maxLines) {
      _lines.removeRange(0, _lines.length - maxLines);
    }
  }

  String dump() => _lines.isEmpty ? '기록이 아직 없어요.' : _lines.join('\n');

  int get length => _lines.length;
}
