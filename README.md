# 누구나프린트

드라이버 설치 없이 폰이나 PC 브라우저에서 바로 복사기·프린터로 인쇄하는 웹앱이에요.

- 안드로이드 앱: [nuguna-print-android](https://github.com/minsuchoi0312-hash/nuguna-print-android) (이 저장소의 화면 코드를 앱으로 감싼 사본)
- 이용약관 · 개인정보처리방침: [nuguna-print-legal](https://minsuchoi0312-hash.github.io/nuguna-print-legal/privacy.html)

## 할 수 있는 것

- **와이파이 인쇄**: 같은 망의 프린터를 찾아서 IPP(631) · Raw(9100)로 보내요
- **PDF · 사진 · 글 인쇄**: 쪽 고르기, 양면, 부수, 용지, 흑백·컬러
- **프린터 언어 팩**: PCL · PostScript · 엡손 ESC/P-R · 삼성 SPL · 캐논 · 잉크젯 PCL3
- **복사기 상태**: 토너 · 용지 · 오류 사유를 한국어로 보여 줘요
- **내 프린터**: 이름 + IP로 등록, QR로 다른 폰과 연결 공유
- **다국어**: 한국어 · 영어 · 일본어 · 중국어

## 시작하기

준비물: Node.js 20 이상

```bash
npm install
npm run dev        # http://localhost:8080
```

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 (포트 8080) |
| `npm run build` | 배포용 빌드 |
| `npm test` | 테스트 |
| `npm run lint` | 린트 |
| `npm run typecheck` | 타입 검사 |

## PC 도우미

브라우저는 복사기의 9100 포트를 직접 열 수 없어서, 같은 망의 PC에서 도우미를 켜 두면 대신 보내 줘요.

```bash
node public/raw-print-helper.mjs   # Node 18 이상, 설치할 것 없음
```

켜면 연결 코드와 QR이 나와요. 사설 IP(같은 망)의 프린터로만 보내요.

## 폴더 구조

| 위치 | 내용 |
|---|---|
| `src/components/` | 화면 (프린터 카드, 인쇄 옵션, 상태 카드, 지원 센터 등) |
| `src/lib/` | 인쇄 엔진 (IPP 전송, 프린터 언어 변환, PDF 처리, 프린터 찾기) |
| `src/lib/i18n/` | 화면 문구 사전 (`ko.ts` 등). 화면 글자는 모두 여기서 나와요 |
| `src/styles.css` | 디자인 |
| `public/` | 아이콘, PDF.js, PC 도우미, 약관 페이지 |
| `scripts/` | 빌드 · 테스트 보조 스크립트 |
| `DESIGN.md` | 디자인 원칙 |

## 같이 개발할 때

- 화면 문구는 해요체로 짧게 써요. 문구를 바꿀 때는 `src/lib/i18n/ko.ts`를 고쳐요.
- 올리기 전에 `npm test`와 `npm run lint`를 돌려 주세요.
- 안드로이드 앱은 이 저장소의 `src`, `public`을 가져가서 빌드해요. 여기서 고친 화면은 다음 앱 빌드에 들어가요.

## 한계

- 브라우저에서는 9100 포트를 못 열어서 PC 도우미나 안드로이드 앱이 필요해요.
- 프린터 언어 팩 일부는 에뮬레이터와 가짜 프린터로만 확인했어요.
