List<String> wrapMeasuredLines(String text, double Function(String value) measure, double maxWidth) {
  final lines = <String>[];
  for (final paragraph in text.split('\n')) {
    var line = '';
    if (paragraph.isEmpty) {
      lines.add('');
      continue;
    }
    for (final rune in paragraph.runes) {
      final char = String.fromCharCode(rune);
      final next = line + char;
      if (line.isNotEmpty && measure(next) > maxWidth) {
        lines.add(line);
        line = char.trim().isEmpty ? '' : char;
      } else {
        line = next;
      }
    }
    lines.add(line);
  }
  return lines.isEmpty ? [''] : lines;
}

List<String> paginateLines(List<String> lines, int linesPerPage) {
  final size = linesPerPage < 1 ? 1 : linesPerPage;
  final pages = <String>[];
  final source = lines.isEmpty ? [''] : lines;
  for (var index = 0; index < source.length; index += size) {
    final end = index + size > source.length ? source.length : index + size;
    pages.add(source.sublist(index, end).join('\n'));
  }
  return pages.isEmpty ? [''] : pages;
}
