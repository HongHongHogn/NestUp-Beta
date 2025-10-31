# 배포 가이드

이 문서는 PRD Pathfinder Pro 프로젝트를 Vercel에 배포하는 방법을 안내합니다.

## 📋 사전 준비

### 1. GitHub 저장소 생성
- 프로젝트를 GitHub에 푸시합니다
- Private 또는 Public 저장소 모두 가능합니다

### 2. 백엔드 배포 준비
백엔드는 별도로 배포해야 합니다:
- **Render**: https://render.com (권장, 무료 플랜 제공)

## 🚀 프론트엔드 배포 (Vercel)

### 1. Vercel 계정 생성
1. https://vercel.com 접속
2. "Sign Up" 클릭하여 GitHub 계정으로 로그인

### 2. 프로젝트 연결
1. Vercel Dashboard에서 "Add New Project" 클릭
2. GitHub 저장소 선택
3. 프로젝트 설정:
   - **Framework Preset**: Vite (자동 감지됨)
   - **Root Directory**: `./` (루트)
   - **Build Command**: `npm run build` (자동 감지됨)
   - **Output Directory**: `dist` (자동 감지됨)
   - **Install Command**: `npm install` (자동 감지됨)

### 3. 환경변수 설정
Vercel Dashboard → 프로젝트 설정 → Environment Variables에 다음을 추가:

| 키 | 값 | 설명 |
|---|---|---|
| `VITE_API_BASE` | `https://your-backend-domain.com` | 백엔드 서버 URL |

**중요**: 
- Production, Preview, Development 환경 모두에 설정하세요
- 백엔드 서버가 배포된 후 실제 URL로 업데이트하세요
- 백엔드 URL에는 슬래시(`/`)를 포함하지 마세요 (예: `https://api.example.com`)

### 4. 배포 실행
- "Deploy" 버튼 클릭
- 빌드 로그를 확인하며 진행 상황을 모니터링
- 빌드가 완료되면 자동으로 배포됩니다
- 배포된 URL은 `https://your-project-name.vercel.app` 형태입니다

### 5. 자동 배포 설정
- GitHub 저장소에 푸시할 때마다 자동으로 배포됩니다
- 브랜치별 배포 설정은 프로젝트 설정에서 변경 가능합니다

### 6. 커스텀 도메인 (선택사항)
1. 프로젝트 설정 → Domains
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 도메인 연결
4. SSL 인증서는 자동으로 발급됩니다

## 🔧 백엔드 배포 (Render 예시)

### 1. Render 계정 생성
1. https://render.com 접속
2. GitHub 계정으로 로그인

### 2. 새 Web Service 생성
1. Dashboard → "New +" → "Web Service"
2. GitHub 저장소 연결
3. 설정:
   - **Name**: `prd-pathfinder-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: Free 또는 Paid

### 3. 환경변수 설정
Render Dashboard → Environment → Add Environment Variable:

| 키 | 값 | 설명 |
|---|---|---|
| `CORS_ORIGIN` | `https://your-frontend-domain.vercel.app` | 프론트엔드 URL |
| `JWT_SECRET` | `랜덤문자열32자이상` | JWT 암호화 키 |
| `JWT_EXPIRES_IN` | `7d` | 토큰 만료 시간 |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | 데이터베이스 URL |
| `DIRECT_URL` | PostgreSQL 연결 문자열 (동일) | 마이그레이션용 |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API 키 (선택사항) |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI 모델 (선택사항) |

**참고**: `PORT`는 Render가 자동으로 할당하므로 설정할 필요가 없습니다.

### 4. 데이터베이스 설정
1. Render Dashboard → "New +" → "PostgreSQL"
2. 데이터베이스 생성 후 Connection String 복사
3. `DATABASE_URL`과 `DIRECT_URL`에 입력
4. Environment Variables에 추가

### 5. 데이터베이스 마이그레이션
`backend/package.json`의 `start` 스크립트가 이미 설정되어 있어, 서버 시작 시 자동으로 마이그레이션이 실행됩니다:

```json
{
  "scripts": {
    "start": "npx prisma migrate deploy && node server.js",
    "postinstall": "prisma generate"
  }
}
```

배포 시 자동으로 마이그레이션이 실행되므로 별도 작업이 필요 없습니다.

### 6. 서비스 URL 확인
배포 완료 후 서비스 URL을 확인하고, 프론트엔드의 `VITE_API_BASE` 환경변수를 업데이트합니다.

예시: `https://prd-pathfinder-backend.onrender.com`

## 📝 환경변수 체크리스트

### 프론트엔드 (Vercel)
- [ ] `VITE_API_BASE`: 백엔드 서버 URL

### 백엔드 (Render)
- [ ] `PORT`: 서버 포트 (Render는 자동 할당, 설정 불필요)
- [ ] `CORS_ORIGIN`: 프론트엔드 URL
- [ ] `JWT_SECRET`: 임의의 랜덤 문자열
- [ ] `JWT_EXPIRES_IN`: 토큰 만료 시간 (예: 7d)
- [ ] `DATABASE_URL`: PostgreSQL 연결 문자열
- [ ] `DIRECT_URL`: 마이그레이션용 직접 연결 문자열
- [ ] `OPENAI_API_KEY`: OpenAI API 키 (선택사항)
- [ ] `OPENAI_MODEL`: OpenAI 모델명 (선택사항, 기본값: gpt-4o-mini)

## 🔍 배포 후 확인사항

1. **프론트엔드 확인**
   - Vercel 배포 URL 접속
   - 회원가입/로그인 기능 테스트
   - 리포트 생성 및 조회 테스트

2. **백엔드 확인**
   - API 엔드포인트 접근 가능 여부 확인
   - 데이터베이스 연결 확인
   - 로그 확인 (Render Dashboard → Logs)

3. **CORS 설정 확인**
   - 브라우저 콘솔에서 CORS 오류 확인
   - 백엔드 `CORS_ORIGIN` 환경변수가 프론트엔드 URL과 일치하는지 확인

## 🐛 문제 해결

### 빌드 오류
- Vercel 빌드 로그 확인
- 로컬에서 `npm run build` 실행하여 빌드 오류 확인

### API 연결 오류
- 프론트엔드 `VITE_API_BASE` 환경변수 확인
- 백엔드 서버가 실행 중인지 확인
- CORS 설정 확인

### 데이터베이스 연결 오류
- `DATABASE_URL` 형식 확인
- 데이터베이스 서버 접근 가능 여부 확인
- Prisma 마이그레이션 실행 여부 확인

## ✅ 배포 체크리스트

### 사전 준비
- [ ] GitHub 저장소에 프로젝트 푸시
- [ ] Render 계정 준비

### 프론트엔드 배포 (Vercel)
- [ ] Vercel 계정 생성 및 로그인
- [ ] GitHub 저장소 연결
- [ ] 프로젝트 설정 확인 (Vite 프레임워크 자동 감지)
- [ ] 환경변수 `VITE_API_BASE` 설정 (백엔드 배포 후 업데이트)
- [ ] 배포 실행 및 성공 확인
- [ ] 배포된 URL에서 기능 테스트

### 백엔드 배포 (Render 예시)
- [ ] Render 계정 생성 및 로그인
- [ ] PostgreSQL 데이터베이스 생성
- [ ] Web Service 생성 및 설정
- [ ] 환경변수 설정 (모든 항목 입력)
- [ ] 데이터베이스 마이그레이션 실행 확인
- [ ] 서비스 URL 확인 및 테스트
- [ ] 프론트엔드 `VITE_API_BASE` 업데이트

### 배포 후 확인
- [ ] 프론트엔드에서 회원가입/로그인 테스트
- [ ] 아이디어 검증 기능 테스트
- [ ] 리포트 생성 및 조회 테스트
- [ ] CORS 오류 확인 (없어야 함)
- [ ] 로그 확인 (에러 없어야 함)

## 📚 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Render 공식 문서](https://render.com/docs)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment)
- [Supabase 공식 문서](https://supabase.com/docs)

