import 'dart:async';

bool isPrivateIpv4(String host) {
  final parts = host.split('.');
  if (parts.length != 4) return false;
  final numbers = <int>[];
  for (final part in parts) {
    final value = int.tryParse(part);
    if (value == null || value < 0 || value > 255) return false;
    numbers.add(value);
  }
  final a = numbers[0];
  final b = numbers[1];
  if (a == 10 || a == 127) return true;
  if (a == 192 && b == 168) return true;
  if (a == 169 && b == 254) return true;
  if (a == 172 && b >= 16 && b <= 31) return true;
  return false;
}

const iosLocalNetworkHint = '아이폰 설정 > 바로 인쇄 > 로컬 네트워크 권한이 켜져 있는지 확인해 주세요.';

const ippRawPortHint = '복사기의 9100(RAW) 포트가 닫혀 있을 수 있어요. 복사기 네트워크 설정을 확인해 주세요.';

const usbDroppedHint = '복사기와 연결이 끊어졌어요. 다시 연결해 주세요.';

String friendlyPrintError(Object error) {
  final text = '$error';
  if (error is TimeoutException || text.contains('TimeoutException')) {
    return '복사기 응답이 15초 넘게 없어요. 용지 없음·걸림이나 와이파이 연결을 확인해 주세요.';
  }
  if (text.contains('권한')) return 'USB 권한을 허용하지 않았어요.';
  if (text.contains('15초') || text.contains('용지')) return '복사기가 15초 안에 받지 않았어요. 용지가 없거나 걸린 것 같아요.';
  if (text.contains('다른 앱')) return '다른 앱이 USB를 사용 중이라 이 앱에서 바로 보낼 수 없어요.';
  if (text.contains('HEIC')) return 'HEIC 사진은 지원하지 않아요. JPG/PNG로 바꿔서 골라 주세요.';
  if (text.contains('불러오지')) return '파일을 불러오지 못했어요. 기기에 저장된 파일인지 확인해 주세요.';
  return '연결하지 못했어요. 선이나 주소를 다시 확인해 주세요.';
}

String connectFailureMessage({required String host, required String service, required bool ios}) {
  final ipp = service == '_ipp._tcp';
  final local = ios && (isPrivateIpv4(host) || host.isEmpty);
  if (ipp && local) return '$ippRawPortHint $iosLocalNetworkHint';
  if (ipp) return ippRawPortHint;
  if (local) return '이 주소로 연결되지 않아요. $iosLocalNetworkHint';
  return '이 주소로 연결되지 않아요. 복사기 IP와 포트를 다시 확인해 주세요.';
}

String scanFailureMessage({required bool ios, required bool empty}) {
  if (ios && empty) return '자동으로 안 보여요. $iosLocalNetworkHint';
  if (ios) return '자동 검색이 막혀 있어요. $iosLocalNetworkHint';
  if (empty) return '자동으로 안 보이면 IP 주소를 입력해 주세요.';
  return '자동 검색이 막혀 있어요. IP 주소를 입력해 주세요.';
}

String shareFailureMessage(String code) {
  return switch (code) {
    'too_large' => '파일이 너무 커요. PDF는 80MB, 사진은 40MB 이하만 받을 수 있어요.',
    'empty' => '빈 파일은 인쇄할 수 없어요.',
    'unsupported' => '이 파일 형식은 지원하지 않아요. PDF나 JPG, PNG로 보내 주세요.',
    _ => '공유한 파일을 읽지 못했어요.',
  };
}

String errorSummary(Object error) {
  final text = '$error'.replaceAll(RegExp(r'\s+'), ' ').trim();
  final brief = text.length > 180 ? '${text.substring(0, 180)}…' : text;
  return '${error.runtimeType} $brief';
}

bool usbPipeStalled(Object error) {
  if (error is TimeoutException) return true;
  final text = '$error';
  return text.contains('TimeoutException') || text.contains('15초') || text.contains('용지') || text.contains('closed') || text.contains('끊어');
}
