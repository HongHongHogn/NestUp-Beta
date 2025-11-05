# 스타트업 플랫폼 검색 설정 가이드

## ✅ 구현 완료

Crunchbase와 The VC 같은 스타트업 전용 데이터 플랫폼 검색 기능이 추가되었습니다!

## 📋 추가된 기능

### ✅ 스타트업 플랫폼 검색

1. **Crunchbase 검색**
   - Crunchbase API를 통한 직접 검색 (API 키 필요)
   - API 키가 없을 경우 Tavily를 통한 웹 검색으로 대체

2. **The VC 검색**
   - Tavily API를 사용하여 The VC 웹사이트에서 검색
   - 한국 스타트업 뉴스 및 정보 수집

3. **RAG 파이프라인 통합**
   - 일반 웹 검색과 스타트업 플랫폼 검색을 병렬로 실행
   - 검색 결과를 자동으로 병합하여 AI 분석에 활용

## 🔧 환경 변수 설정

`backend/.env` 파일에 다음 환경 변수를 추가하세요:

### 필수 환경 변수 (이미 설정되어 있을 수 있음)

```env
# Tavily API (일반 웹 검색 및 The VC 검색에 사용)
TAVILY_API_KEY=your_tavily_api_key_here
```

### 선택적 환경 변수

```env
# Crunchbase API (유료, API 키가 있으면 더 정확한 데이터 제공)
# API 키가 없어도 Tavily를 통한 웹 검색으로 대체됩니다
CRUNCHBASE_API_KEY=your_crunchbase_api_key_here
```

## 📝 Crunchbase API 키 얻는 방법

1. [Crunchbase Basic](https://www.crunchbase.com/basic) 플랜 가입 (유료)
2. [Crunchbase API 문서](https://data.crunchbase.com/docs) 참고
3. API 키 발급

**참고**: Crunchbase API는 유료 서비스입니다. API 키가 없어도 시스템은 Tavily를 통해 Crunchbase 웹사이트에서 검색을 수행하므로, API 키 없이도 기본 기능은 작동합니다.

## 🚀 사용 방법

특별한 설정 없이 바로 사용할 수 있습니다!

1. **자동 통합**: RAG 파이프라인이 실행될 때 자동으로 스타트업 플랫폼 검색이 포함됩니다.

2. **검색 흐름**:
   ```
   아이디어 입력
   ↓
   검색 쿼리 생성 (5-8개)
   ↓
   병렬 검색 실행:
   - 일반 웹 검색 (Tavily)
   - Crunchbase 검색 (API 또는 웹)
   - The VC 검색 (웹)
   ↓
   검색 결과 병합
   ↓
   AI 분석에 컨텍스트로 주입
   ```

## 📊 검색 결과 예시

스타트업 플랫폼 검색을 통해 다음과 같은 정보를 수집합니다:

- **Crunchbase에서**:
  - 회사 정보 (펀딩 이력, 투자 라운드, 카테고리 등)
  - 유사한 스타트업의 펀딩 현황
  - 시장 내 경쟁사 데이터

- **The VC에서**:
  - 한국 스타트업 뉴스 및 동향
  - 최신 투자 소식
  - 시장 분석 기사

## ⚙️ 동작 방식

### Crunchbase 검색

1. **API 키가 있는 경우**:
   - Crunchbase API v4를 직접 호출
   - 정확한 회사 데이터와 펀딩 정보 수집
   - 구조화된 데이터 제공

2. **API 키가 없는 경우**:
   - Tavily API를 사용하여 `site:crunchbase.com` 검색
   - 웹 크롤링을 통한 정보 수집
   - 기본 기능은 유지

### The VC 검색

- Tavily API를 사용하여 `site:thevc.kr` 또는 `site:thevc.co.kr` 검색
- 한국 스타트업 뉴스 및 정보 수집

## 🔍 로그 확인

백엔드 콘솔에서 다음 로그를 확인할 수 있습니다:

```
[RAG] Step 2: Searching web with 6 queries...
[Crunchbase Search] Query: "..."
[Crunchbase Search] Found X results
[The VC Search] Query: "..."
[The VC Search] Found X results
[RAG] Found X general search results and Y startup platform results
```

## ⚠️ 주의사항

1. **Crunchbase API**: 유료 서비스이므로 API 키가 없어도 시스템은 정상 작동합니다 (웹 검색으로 대체).

2. **Tavily API 제한**: 
   - 무료 티어: 일일 1,000회 검색
   - 스타트업 플랫폼 검색도 Tavily 할당량을 사용합니다
   - 각 리포트당 약 5-8회 추가 검색 소요

3. **검색 시간**: 스타트업 플랫폼 검색 추가로 인해 리포트 생성 시간이 약간 늘어날 수 있습니다 (약 5-10초 추가).

## 📈 성능 최적화

- 일반 웹 검색과 스타트업 플랫폼 검색을 병렬로 실행하여 시간 최적화
- 검색 결과는 자동으로 병합되어 중복 제거
- 컨텍스트 길이 제한 (8,000자)으로 효율성 유지

## 🔄 업데이트 이력

- **2024-12-XX**: 스타트업 플랫폼 검색 기능 추가
  - Crunchbase 검색 (API + 웹)
  - The VC 검색
  - RAG 파이프라인 통합

