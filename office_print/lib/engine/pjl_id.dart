/// `@PJL INFO ID` 응답에서 모델명만 꺼낸다. 없으면 null.
String? parsePjlId(String raw) {
  final cleaned = raw.replaceAll('\u0000', '').replaceAll('\x1B%-12345X', '');
  final quoted = RegExp(r'"([^"\r\n]{1,80})"').firstMatch(cleaned);
  final quotedValue = quoted?.group(1)?.trim();
  if (quotedValue != null && quotedValue.isNotEmpty) return quotedValue;
  for (final line in cleaned.split(RegExp(r'\r\n|\n|\r'))) {
    var text = line.trim();
    if (text.isEmpty || text.toUpperCase().startsWith('@PJL')) continue;
    final id = RegExp(r'^ID\s*=\s*(.+)$', caseSensitive: false).firstMatch(text);
    if (id != null) text = id.group(1)!.trim();
    text = text.replaceAll('"', '').trim();
    if (text.isEmpty || text.length > 80) continue;
    return text;
  }
  return null;
}
