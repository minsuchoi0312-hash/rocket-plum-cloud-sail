int? pickPrinterProtocol(List<({int interfaceClass, int protocol, bool hasOut})> candidates) {
  final found = candidates.where((item) => item.interfaceClass == 7 && item.hasOut && (item.protocol == 2 || item.protocol == 1));
  for (final item in found) {
    if (item.protocol == 2) return 2;
  }
  for (final item in found) {
    if (item.protocol == 1) return 1;
  }
  return null;
}
