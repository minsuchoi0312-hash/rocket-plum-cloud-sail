/**
 * 누구나프린트는 로그인을 쓰지 않는다.
 * vite.config.ts의 개발 서버 미들웨어가 /auth/popup 요청 때 이 모듈을 문자열 경로로 불러오므로
 * 파일만 남겨 두고, 404로 정중히 응답한다(인증 서버·DB 의존성은 모두 제거).
 */
export async function handleAuthPopupRequest(_request: Request): Promise<Response> {
  return new Response("Sign-in is not used in this app.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
}
