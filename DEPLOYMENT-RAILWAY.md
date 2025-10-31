# Railway 백엔드 배포 가이드

이 문서는 PRD Pathfinder Pro 백엔드를 Railway에 배포하는 방법을 안내합니다.

## 📋 사전 준비

### 1. Railway 계정 생성
1. https://railway.app 접속
2. "Start a New Project" 클릭
3. GitHub 계정으로 로그인 또는 이메일로 회원가입
4. Free plan으로 시작 가능 (월 $5 크레딧 제공)

### 2. 프로젝트 준비
- 백엔드 코드가 `backend/` 디렉토리에 있는지 확인
- GitHub 저장소에 푸시되어 있는지 확인

## 🚀 Railway 배포 단계

### 1. 새 프로젝트 생성
1. Railway Dashboard에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. GitHub 저장소 선택
4. "Deploy Now" 클릭

### 2. 서비스 설정

#### 2-1. 루트 디렉토리 설정
1. 생성된 서비스에서 "Settings" 탭 클릭
2. "Source" 섹션에서:
   - **Root Directory**: `backend` 입력
   - 변경사항 저장

#### 2-2. 빌드 설정
Railway가 자동으로 감지하지만, 확인:
- **Start Command**: `npm start`
- **Build Command**: 자동 (없어도 됨)

### 3. PostgreSQL 데이터베이스 추가

#### 3-1. 데이터베이스 생성
1. 프로젝트 페이지에서 "+ New" 버튼 클릭
2. "Database" → "Add PostgreSQL" 선택
3. 데이터베이스가 자동으로 생성됩니다

#### 3-2. 데이터베이스 URL 확인
1. PostgreSQL 서비스 클릭
2. "Variables" 탭에서:
   - `DATABASE_URL` 복사
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` 확인

### 4. 환경변수 설정

웹 서비스의 "Variables" 탭에서 다음 환경변수를 추가:

#### 필수 환경변수

| 키 | 값 | 설명 |
|---|---|---|
| `PORT` | (자동 설정됨) | Railway가 자동으로 할당 |
| `CORS_ORIGIN` | `https://your-frontend-domain.vercel.app` | 프론트엔드 URL |
| `JWT_SECRET` | `랜덤문자열32자이상` | JWT 토큰 암호화 키 |
| `JWT_EXPIRES_IN` | `7d` | 토큰 만료 시간 |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway 변수 참조 (자동 연결) |
| `DIRECT_URL` | `${{Postgres.DATABASE_URL}}` | 직접 연결 URL (동일) |

**Railway 변수 참조 방법:**
- PostgreSQL 서비스의 Variables 탭에서 `DATABASE_URL`을 찾아서
- `${{Postgres.DATABASE_URL}}` 형식으로 입력하거나
- 직접 연결 문자열을 복사해서 입력

#### 선택적 환경변수

| 키 | 값 | 설명 |
|---|---|---|
| `OPENAI_API_KEY` | `sk-...` | OpenAI API 키 |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI 모델명 |

### 5. 환경변수 추가 방법

1. 웹 서비스 → "Variables" 탭 클릭
2. "+ New Variable" 클릭
3. Key와 Value 입력
4. "Add" 클릭
5. 모든 환경변수 추가 후 재배포 자동 실행

### 6. 데이터베이스 마이그레이션

#### 방법 1: 자동 마이그레이션 (권장)
`backend/package.json`의 `start` 스크립트 확인:
```json
{
  "scripts": {
    "start": "node server.js",
    "postinstall": "prisma generate"
  }
}
```

마이그레이션을 자동 실행하려면 `package.json` 수정:
```json
{
  "scripts": {
    "start": "npx prisma migrate deploy && node server.js",
    "postinstall": "prisma generate"
  }
}
```

#### 방법 2: Railway CLI 사용
1. Railway CLI 설치:
   ```bash
   npm i -g @railway/cli
   ```

2. 로그인:
   ```bash
   railway login
   ```

3. 프로젝트 연결:
   ```bash
   railway link
   ```

4. 마이그레이션 실행:
   ```bash
   cd backend
   railway run npm run prisma:deploy
   ```

### 7. 배포 확인

1. **배포 상태 확인**
   - 서비스 페이지에서 배포 로그 확인
   - "Deployments" 탭에서 배포 히스토리 확인

2. **서비스 URL 확인**
   - 서비스 → "Settings" → "Generate Domain" 클릭
   - 또는 "Settings" → "Networking"에서 커스텀 도메인 설정
   - 생성된 URL 예: `https://your-service.up.railway.app`

3. **API 테스트**
   ```bash
   curl https://your-service.up.railway.app/api/health
   ```
   또는 브라우저에서 접속하여 확인

### 8. 프론트엔드 연동

백엔드 배포 완료 후:
1. 백엔드 서비스 URL 확인 (예: `https://your-service.up.railway.app`)
2. Vercel 환경변수에 추가:
   - `VITE_API_BASE=https://your-service.up.railway.app`

## 🔧 문제 해결

### 빌드 실패
- 배포 로그 확인: "Deployments" 탭에서 로그 확인
- `backend/package.json`의 `scripts` 확인
- Node.js 버전 확인 (Railway가 자동 감지)

### 데이터베이스 연결 오류
- `DATABASE_URL` 형식 확인
- PostgreSQL 서비스가 실행 중인지 확인
- 마이그레이션 실행 여부 확인

### CORS 오류
- `CORS_ORIGIN` 환경변수가 프론트엔드 URL과 정확히 일치하는지 확인
- URL에 슬래시(`/`)가 없는지 확인

### Prisma 오류
- `postinstall` 스크립트가 `prisma generate`를 실행하는지 확인
- 마이그레이션이 실행되었는지 확인

## 📝 Railway 체크리스트

### 배포 전
- [ ] Railway 계정 생성 및 로그인
- [ ] GitHub 저장소 연결
- [ ] 프로젝트 생성 및 서비스 추가
- [ ] Root Directory를 `backend`로 설정

### 데이터베이스 설정
- [ ] PostgreSQL 데이터베이스 추가
- [ ] `DATABASE_URL` 확인 및 복사

### 환경변수 설정
- [ ] `CORS_ORIGIN` 설정 (프론트엔드 URL)
- [ ] `JWT_SECRET` 설정 (랜덤 문자열)
- [ ] `JWT_EXPIRES_IN` 설정 (`7d`)
- [ ] `DATABASE_URL` 설정 (Railway 변수 참조)
- [ ] `DIRECT_URL` 설정 (동일하게)
- [ ] `OPENAI_API_KEY` 설정 (선택사항)

### 배포 후
- [ ] 배포 로그에서 에러 확인
- [ ] 서비스 URL 확인
- [ ] API 엔드포인트 테스트
- [ ] 데이터베이스 마이그레이션 확인
- [ ] 프론트엔드 `VITE_API_BASE` 업데이트

## 💡 Railway 팁

### 무료 플랜 제한
- 월 $5 크레딧 제공
- 사용하지 않으면 자동으로 일시중지
- 데이터베이스는 지속적으로 실행됨

### 도메인 설정
- Railway가 자동으로 `.up.railway.app` 도메인 제공
- 커스텀 도메인도 설정 가능 (Settings → Networking)

### 환경변수 관리
- 프로젝트 단위와 서비스 단위로 환경변수 설정 가능
- 민감한 정보는 Variables에서 관리 (Git에 커밋하지 않음)

## 📚 추가 리소스

- [Railway 공식 문서](https://docs.railway.app)
- [Railway CLI 문서](https://docs.railway.app/develop/cli)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment)

