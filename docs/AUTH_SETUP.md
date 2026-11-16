# GitHub OAuth 로그인 설정

## 1. GitHub OAuth App 만들기
1. GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**
2. 입력값 (로컬 개발 기준)
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/github/callback`
3. 생성 후 **Client ID**를 복사하고, **Generate a new client secret**으로 secret을 발급받는다.

배포 환경에서는 위 두 URL의 `http://localhost:3000`을 실제 도메인으로 바꾼 OAuth App을 별도로 만든다.

## 2. 환경변수
`.env.example`을 참고해 `.env`(또는 `.env.local`)에 설정한다. 실제 값은 커밋하지 않는다.

```
GITHUB_CLIENT_ID=<발급받은 Client ID>
GITHUB_CLIENT_SECRET=<발급받은 Client secret>
```

설정 후 개발 서버를 재시작한다. 값이 없으면 `/auth/github`가 설정 안내 메시지와 함께 500을 반환한다.

## 3. 라우트
| 경로 | 동작 |
|------|------|
| `GET /auth/github` | state 쿠키 발급 후 GitHub 로그인 화면으로 리다이렉트 |
| `GET /auth/github/callback` | state 검증 → 토큰 교환 → username/avatar를 DB에 저장 → 세션 쿠키 발급 → `/` 이동 |
| `POST /auth/logout` | DB의 세션 문서 삭제 + 쿠키 만료 |
| `GET /auth/me` | 현재 로그인 사용자 (미로그인 시 401) |

## 4. 접근 제어
- 세션 쿠키(`sid`)가 없으면 페이지는 `/login`으로 리다이렉트, `/api/*`는 401.
- `/api/todos`는 서버에서 세션을 DB로 검증하고, 로그인한 사용자 본인의 할 일만 조회/수정/삭제한다.
  다른 사용자의 할 일 id는 404로 응답한다.
- 목표(goals)·주간 계획(weekly) API도 모든 핸들러가 서버에서 세션을 검증한다(미로그인·위조 쿠키는 401).
- 범위: 사용자별 데이터 분리는 **할 일(todos)** 에만 적용된다. 목표·주간 계획은 로그인한 사용자끼리 공유된다.
  목표를 삭제하면 삭제한 사용자 본인의 할 일에서만 연결이 해제되고, 다른 사용자의 할 일은 수정되지 않는다.

## 5. 기존 할 일 데이터 마이그레이션
이 변경 이전에 만든 할 일에는 `userId`가 없어서 누구에게도 보이지 않는다.
먼저 해당 계정으로 한 번 로그인해 User 문서를 만든 뒤 실행한다.

```bash
# 미리보기 (변경 없음)
node --env-file=.env scripts/migrate-todos-user.mjs <github-username> --dry-run

# 실제 적용
node --env-file=.env scripts/migrate-todos-user.mjs <github-username>
```

`userId`가 없는 할 일만 대상이며, 여러 번 실행해도 안전하다(멱등).
