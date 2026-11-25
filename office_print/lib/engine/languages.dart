import 'route.dart';

class ServiceTxt {
  const ServiceTxt({required this.model, required this.pdl, required this.pdf, required this.pcl5});

  final String model;
  final String pdl;
  final bool pdf;
  final bool pcl5;

  bool get known => pdf || pcl5;
}

/// IPP TXT (`ty`, `pdl`)와 USB CMD를 같은 기준으로 본다.
/// `PCL6` / `PCLXL` / `UFR` / `URF`는 PCL5e로 치지 않는다.
/// `application/vnd.hp-PCL`만 PCL5로 인정하고 `application/vnd.hp-PCLXL`은 제외한다.
bool deviceSupportsPdf(String text) => commandHasPdf(text);

bool deviceSupportsPcl5(String text) {
  if (commandHasPcl5(text)) return true;
  return _hpPcl5Mime(text);
}

ServiceTxt parseServiceTxt(String text) {
  final pdls = <String>[];
  var model = '';
  for (final line in text.split(RegExp(r'[\r\n]+'))) {
    final trimmed = line.trim();
    if (trimmed.isEmpty) continue;
    final eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    final key = trimmed.substring(0, eq).trim().toLowerCase();
    final value = trimmed.substring(eq + 1).trim();
    if (value.isEmpty) continue;
    if (key == 'ty') model = value;
    if (key == 'product' && model.isEmpty) model = value.replaceAll(RegExp(r'[()]'), '').trim();
    if (key == 'pdl') pdls.add(value);
  }
  final pdl = pdls.join(',');
  return ServiceTxt(model: model, pdl: pdl, pdf: deviceSupportsPdf(pdl), pcl5: deviceSupportsPcl5(pdl));
}

bool _hpPcl5Mime(String text) {
  for (final raw in text.split(RegExp(r'[,;\n\r]+'))) {
    var token = raw.trim().toLowerCase();
    final eq = token.lastIndexOf('=');
    if (eq >= 0) token = token.substring(eq + 1).trim();
    if (token.isEmpty) continue;
    if (token.contains('pclxl') || token.contains('pcl-xl') || token.contains('pcl6') || token.contains('ufr')) continue;
    if (token == 'application/vnd.hp-pcl' || token.endsWith('/vnd.hp-pcl')) return true;
  }
  return false;
}
