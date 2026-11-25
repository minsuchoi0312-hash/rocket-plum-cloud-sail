import 'dart:typed_data';

enum PrintRoute { pdfDirect, pcl }

enum DocKind { pdf, photo, memo, test }

enum PageMode { all, span }

bool commandHasPcl5(String cmd) => RegExp(r'\bPCL\s*5\s*[ce]?\b', caseSensitive: false).hasMatch(cmd);

bool commandHasPdf(String cmd) => RegExp(r'\bPDF\b', caseSensitive: false).hasMatch(cmd);

bool pdfHasPages(int count) => count > 0;

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
}) {
  if (passwordUnlocked) return PrintRoute.pcl;
  if (docKind == DocKind.pdf && hasPdfBytes && pdfDirectAllowed && devicePdf && !gray && pageMode == PageMode.all) {
    return PrintRoute.pdfDirect;
  }
  return PrintRoute.pcl;
}
