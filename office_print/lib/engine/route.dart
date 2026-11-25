import 'dart:typed_data';

enum PrintRoute { pdfDirect, pcl }

enum DocKind { pdf, photo, memo, test }

enum PageMode { all, span }

bool commandHasPcl5(String cmd) => RegExp(r'\bPCL\s*5\s*[ce]?\b', caseSensitive: false).hasMatch(cmd);

bool commandHasPdf(String cmd) => RegExp(r'\bPDF\b', caseSensitive: false).hasMatch(cmd);

bool pdfHasPages(int count) => count > 0;

/// `1, 3-5, 8`. 입력 순서를 유지하고 중복은 한 번만 남긴다. 틀리면 null.
List<int>? parsePageRange(String input, int totalPages) {
  if (totalPages < 1) return null;
  final text = input.trim();
  if (text.isEmpty) return null;
  final pages = <int>[];
  final seen = <int>{};
  for (final raw in text.split(',')) {
    final part = raw.trim();
    if (part.isEmpty) return null;
    final dash = part.split('-');
    if (dash.length == 1) {
      final page = int.tryParse(dash[0].trim());
      if (page == null || page < 1 || page > totalPages) return null;
      if (seen.add(page)) pages.add(page);
      continue;
    }
    if (dash.length != 2) return null;
    final start = int.tryParse(dash[0].trim());
    final end = int.tryParse(dash[1].trim());
    if (start == null || end == null || start < 1 || end < 1 || start > totalPages || end > totalPages || start > end) {
      return null;
    }
    for (var page = start; page <= end; page += 1) {
      if (seen.add(page)) pages.add(page);
    }
  }
  if (pages.isEmpty) return null;
  return pages;
}

bool pdfLooksEncrypted(Uint8List data) {
  const needle = [47, 69, 110, 99, 114, 121, 112, 116];
  bool find(int start, int end) {
    for (var index = start; index <= end - needle.length; index += 1) {
      var same = true;
      for (var offset = 0; offset < needle.length; offset += 1) {
        if (data[index + offset] != needle[offset]) {
          same = false;
          break;
        }
      }
      if (same) return true;
    }
    return false;
  }

  final head = data.length < 65536 ? data.length : 65536;
  if (find(0, head)) return true;
  final tail = data.length > 262144 ? data.length - 262144 : 0;
  return tail > 0 && find(tail, data.length);
}

bool canPdfDirectBytes(Uint8List? data) {
  if (data == null || data.isEmpty) return false;
  return data.length <= 25 * 1024 * 1024 && !pdfLooksEncrypted(data);
}

/// PDF Direct만 예외이고, 나머지는 전부 PCL5e 래스터로 보낸다.
/// 암호를 풀어 연 PDF는 원본 바이트가 여전히 암호화돼 있으므로 Direct로 보내지 않는다.
PrintRoute resolvePrintRoute({
  required DocKind docKind,
  required bool hasPdfBytes,
  required bool pdfDirectAllowed,
  required bool devicePdf,
  required PageMode pageMode,
  required bool gray,
  bool passwordUnlocked = false,
  bool reverse = false,
  int pagesPerSheet = 1,
  bool manualOrientation = false,
}) {
  if (passwordUnlocked || reverse || pagesPerSheet > 1 || manualOrientation) return PrintRoute.pcl;
  if (docKind == DocKind.pdf && hasPdfBytes && pdfDirectAllowed && devicePdf && !gray && pageMode == PageMode.all) {
    return PrintRoute.pdfDirect;
  }
  return PrintRoute.pcl;
}
