# Vercel 배포 가이드

이 문서는 프론트엔드를 Vercel에 배포하는 방법을 설명합니다.

## 사전 준비

1. **GitHub 저장소 준비**
   - 코드가 GitHub에 푸시되어 있어야 합니다
   - 만약 아직 없다면:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin <your-github-repo-url>
     git push -u origin main
     ```

2. **Vercel 계정 생성**
   - [vercel.com](https://vercel.com)에 가입합니다
   - GitHub 계정으로 연동하는 것을 권장합니다

## 배포 단계

### 방법 1: Vercel 웹 대시보드 사용 (권장)

1. **프로젝트 가져오기**
   - Vercel 대시보드에서 "Add New Project" 클릭
   - GitHub 저장소를 선택하고 Import

2. **프로젝트 설정**
   - **Framework Preset**: Vite (자동 감지됨)
   - **Root Directory**: `.` (루트 디렉토리)
   - **Build Command**: `npm run build` (자동 설정됨)
   - **Output Directory**: `dist` (자동 설정됨)
   - **Install Command**: `npm install` (자동 설정됨)

3. **환경 변수 설정**
   - "Environment Variables" 섹션에서 다음 변수를 추가:
     ```
     VITE_API_BASE=https://your-backend-url.com
     ```
   - 백엔드가 다른 곳에 배포되어 있다면 해당 URL을 입력
   - 예시:
     - Render: `https://your-app.onrender.com`
     - Railway: `https://your-app.railway.app`
     - 다른 서버: `https://your-api-domain.com`

4. **배포**
   - "Deploy" 버튼 클릭
   - 배포가 완료되면 자동으로 URL이 생성됩니다

### 방법 2: Vercel CLI 사용

1. **Vercel CLI 설치**
   ```bash
   npm install -g vercel
   ```

2. **로그인**
   ```bash
   vercel login
   ```

3. **배포**
   ```bash
   vercel
   ```
   - 첫 배포 시 질문에 답변:
     - "Set up and deploy?": Yes
     - "Which scope?": 본인의 계정 선택
     - "Link to existing project?": No (처음 배포)
     - "Project name?": 원하는 프로젝트 이름 입력
     - "Directory?": `.` (루트 디렉토리)
     - "Override settings?": No

4. **환경 변수 설정**
   ```bash
   vercel env add VITE_API_BASE
   ```
   - 프롬프트에 백엔드 URL 입력
   - Environment 선택: Production, Preview, Development 모두 선택 권장

5. **프로덕션 배포**
   ```bash
   vercel --prod
   ```

## 환경 변수 관리

### 환경별 변수 설정

Vercel에서는 환경별로 다른 환경 변수를 설정할 수 있습니다:

- **Production**: 프로덕션 배포에 사용
- **Preview**: Pull Request 배포에 사용
- **Development**: `vercel dev` 로컬 개발에 사용

### 필수 환경 변수

- `VITE_API_BASE`: 백엔드 API의 기본 URL
  - 예: `https://your-backend.onrender.com`
  - 또는: `https://api.yourdomain.com`

## 자동 배포 설정

Vercel은 기본적으로 다음을 자동 배포합니다:

- **프로덕션**: `main` 또는 `master` 브랜치에 푸시 시
- **Preview**: 다른 브랜치나 Pull Request 생성 시

### 자동 배포 비활성화

`vercel.json`에 다음을 추가:
```json
{
  "git": {
    "deploymentEnabled": {
      "production": false
    }
  }
}
```

## 배포 후 확인 사항

1. **빌드 로그 확인**
   - Vercel 대시보드의 "Deployments" 탭에서 빌드 로그 확인
   - 에러가 있다면 로그를 확인하여 수정

2. **환경 변수 확인**
   - 배포된 사이트에서 네트워크 탭 확인
   - API 요청이 올바른 백엔드 URL로 가는지 확인

3. **라우팅 확인**
   - React Router를 사용하므로 모든 경로가 올바르게 작동하는지 확인
   - `/login`, `/dashboard` 등의 직접 접근 테스트

## 커스텀 도메인 설정

1. Vercel 대시보드에서 프로젝트 선택
2. "Settings" → "Domains" 이동
3. 원하는 도메인 입력
4. DNS 설정 가이드에 따라 DNS 레코드 추가

## 트러블슈팅

### 빌드 실패

- **Node 버전**: Vercel은 기본적으로 Node 18을 사용합니다
  - `.nvmrc` 파일을 생성하여 Node 버전 지정 가능:
    ```
    18
    ```

- **의존성 설치 실패**: 
  - `package-lock.json`이 최신인지 확인
  - `npm ci`로 깨끗한 설치 테스트

### API 연결 실패

- **CORS 문제**: 백엔드에서 Vercel 도메인을 허용 목록에 추가
- **환경 변수**: Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
- **HTTPS**: 프로덕션에서는 HTTPS만 사용하므로 백엔드도 HTTPS여야 함

### 라우팅 문제

- `vercel.json`의 `rewrites` 설정이 올바른지 확인
- 모든 경로가 `/index.html`로 리다이렉트되는지 확인

## 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vite + Vercel 가이드](https://vercel.com/guides/deploying-vite)
- [Vercel CLI 문서](https://vercel.com/docs/cli)

