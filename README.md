# PRD Pathfinder Pro

AI 기반 아이디어 검증 플랫폼

## 🚀 빠른 시작

### 프론트엔드 (개발 모드)
```bash
npm install
npm run dev
```
프론트엔드는 `http://localhost:5173`에서 실행됩니다.

### 백엔드 (개발 모드)
```bash
cd backend
npm install
npm run dev
```
백엔드는 `http://localhost:3001`에서 실행됩니다.

## 📦 프로젝트 구조

```
prd-pathfinder-pro-main/
├── src/                    # 프론트엔드 소스 코드
│   ├── components/         # React 컴포넌트
│   ├── pages/             # 페이지 컴포넌트
│   ├── lib/               # 유틸리티 함수
│   └── context/           # React Context
├── backend/               # 백엔드 서버
│   ├── routes/           # API 라우트
│   ├── middleware/       # Express 미들웨어
│   ├── lib/              # 라이브러리
│   └── prisma/           # Prisma 스키마 및 마이그레이션
└── public/               # 정적 파일
```

## 🔧 환경변수 설정

### 프론트엔드
프로젝트 루트에 `.env` 파일을 생성하고:

```env
VITE_API_BASE=http://localhost:3001
```

### 백엔드
`backend/.env` 파일을 생성하고:

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_random_secret_key_here
JWT_EXPIRES_IN=7d

# Supabase Database URLs
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# OpenAI (선택사항)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## 📚 데이터베이스 설정

### Prisma 마이그레이션
```bash
cd backend
npm run prisma:migrate
```

### Prisma Client 생성
```bash
cd backend
npm run prisma:generate
```

## 🚢 배포

배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

### 프론트엔드 배포 (Vercel)
1. GitHub 저장소에 푸시
2. Vercel에 프로젝트 연결
3. 환경변수 설정 (`VITE_API_BASE`)
4. 배포

### 백엔드 배포 (Render/Railway)
1. `backend` 디렉토리 배포
2. 데이터베이스 설정
3. 환경변수 설정
4. 마이그레이션 실행

## 🔑 주요 기능

- ✅ 사용자 인증 (회원가입/로그인)
- ✅ 아이디어 검증 및 AI 분석
- ✅ 리포트 생성 및 관리
- ✅ 리포트 삭제
- ✅ 사용자 프로필 관리
- ✅ 반응형 디자인

## 🛠️ 기술 스택

### 프론트엔드
- React 18
- TypeScript
- Vite
- React Router DOM
- Tailwind CSS
- shadcn/ui
- Zod

### 백엔드
- Node.js
- Express
- Prisma ORM
- PostgreSQL (Supabase)
- JWT 인증
- OpenAI API

## 📝 라이선스

MIT
