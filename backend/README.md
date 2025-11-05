# IdeaScout AI Backend API Server

## 설치 방법

```bash
cd backend
npm install
```

## 환경 변수 설정

`.env` 파일에 아래 값을 설정하세요 (예시 값):

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change_me_to_a_secure_random_string
JWT_EXPIRES_IN=7d

# Supabase Database URL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"

# OpenAI (필수 - AI 분석용)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Tavily API (필수 - RAG 웹 검색용)
TAVILY_API_KEY=tvly-dev-...
```

### Supabase Connection String 얻는 방법

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택 → **Settings** → **Database**
3. **Connection string** 섹션에서 **URI** 또는 **Transaction** 모드 선택
4. `postgresql://`로 시작하는 문자열 복사
5. `[YOUR-PASSWORD]` 부분을 실제 데이터베이스 비밀번호로 교체

> **주의**: 비밀번호는 프로젝트 생성 시 설정한 값이며, Supabase Dashboard → Settings → Database에서 확인하거나 재설정할 수 있습니다.

## 실행 방법

### 개발 모드
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm start
```

## 데이터베이스 설정 (Supabase + Prisma)

### Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 새 프로젝트 생성
2. 프로젝트 설정 → Database → Connection string에서 **Connection string** 복사
3. 형식: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 환경변수 설정

`.env` 파일에 Supabase Connection String 추가:

**Prisma 마이그레이션용 (Direct Connection):**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

> **중요**: 
> - Prisma 마이그레이션은 **Direct Connection** (포트 5432)을 사용해야 합니다
> - `?sslmode=require`를 추가하여 SSL 연결을 활성화하세요
> - `[YOUR-PASSWORD]`를 실제 데이터베이스 비밀번호로 교체하세요

### Prisma 설정

1) 의존성 설치는 `npm install`에 포함되어 있습니다 (`prisma`, `@prisma/client`, `pg`).

2) Prisma 클라이언트 생성
```bash
npm run prisma:generate
```

3) 마이그레이션 적용 (개발)
```bash
npm run prisma:migrate
```

4) 배포 환경에서는 마이그레이션 적용
```bash
npm run prisma:deploy
```

### Supabase 스키마 확인

마이그레이션 후 Supabase Dashboard → Table Editor에서 `User`와 `Report` 테이블이 생성되었는지 확인하세요.

## API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인

### 아이디어 검증 (인증 필요)
- `POST /api/validate` - 아이디어 검증 요청 (JWT 필요)

### 리포트 (인증 필요)
- `GET /api/report` - 내 리포트 목록 조회 (JWT 필요)
- `GET /api/report/:id` - 특정 리포트 조회 (JWT 필요)

### 헬스 체크
- `GET /health` - 서버 상태 확인

## 배포 옵션

- **Vercel**: `vercel deploy`
- **Railway**: `railway up`
- **Render**: GitHub 연동 후 자동 배포
- **Heroku**: `git push heroku main`

## TODO

- [ ] 입력 유효성 검증(Zod 스키마 고도화)
- [ ] 에러 핸들링/로깅 고도화
