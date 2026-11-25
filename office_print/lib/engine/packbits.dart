import 'dart:typed_data';

Uint8List packBits(Uint8List row) {
  final out = BytesBuilder(copy: false);
  var index = 0;
  while (index < row.length) {
    var run = 1;
    while (index + run < row.length && row[index + run] == row[index] && run < 128) {
      run += 1;
    }
    if (run >= 2) {
      out.addByte((1 - run) & 0xff);
      out.addByte(row[index]);
      index += run;
      continue;
    }
    final start = index;
    index += 1;
    while (index < row.length && index - start < 128) {
      if (index + 1 < row.length && row[index] == row[index + 1]) break;
      index += 1;
    }
    final length = index - start;
    out.addByte(length - 1);
    out.add(row.sublist(start, start + length));
  }
  return out.toBytes();
}
