# RAG 시스템 설정 가이드

## ✅ 구현 완료

Tavily API를 사용한 RAG 시스템이 성공적으로 구현되었습니다!

## 🔧 설정 필요 사항

### 1. 환경 변수 설정

`backend/.env` 파일에 다음 환경 변수를 추가하세요:

```env
TAVILY_API_KEY=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
```

### 2. 패키지 설치

Tavily는 REST API를 직접 호출하는 방식으로 구현되어 있어 추가 패키지 설치가 필요 없습니다.

```bash
cd backend
npm install
```

## 📋 구현된 기능

### ✅ RAG 파이프라인
1. **Query Generation**: 아이디어를 분석하여 5-8개의 검색 쿼리 자동 생성
2. **Retrieve**: Tavily API를 사용한 웹 검색 (병렬 처리)
3. **Augment**: 검색 결과를 컨텍스트로 변환하여 AI 프롬프트에 주입
4. **Generate**: RAG 기반 분석 리포트 생성

### ✅ M-3: 유사 사례 분석 (Precedents)
- 웹 검색을 통한 유사 스타트업/서비스 발견
- 성공/실패 사례 및 원인 분석
- 리포트에 자동 표시

### ✅ M-4: 시장 수요 분석 (Market Demand)
- 시장 규모 추정
- CAGR (연평균 성장률) 추정
- 경쟁 강도 평가 (High/Mid/Low)
- 주요 진입 장벽 도출

### ✅ 추가 기능
- **추천 전략** (S-2): Go-to-Market 전략 및 피벗 방향 제안
- **타깃 고객 세그먼트** (S-1): 1순위, 2순위 타깃 고객 제안

## 🚀 테스트 방법

1. 백엔드 서버 실행:
```bash
cd backend
npm run dev
```

2. 프론트엔드 실행:
```bash
npm run dev
```

3. 아이디어 검증 테스트:
   - 로그인 후 `/validate` 페이지 접속
   - 아이디어 입력 (100자 이상)
   - "검증하기" 클릭
   - RAG 파이프라인이 실행되며 웹 검색 수행
   - 리포트 페이지에서 precedents, marketDemand 확인

## 📊 예상 동작

1. **아이디어 입력** → AI가 검색 쿼리 생성
2. **웹 검색 실행** (5-8개 쿼리 병렬 처리) → 약 10-20초 소요
3. **검색 결과 수집** → 컨텍스트 구성
4. **AI 분석** → 검색 결과를 참고하여 리포트 생성
5. **리포트 표시** → precedents, marketDemand 등 표시

## ⚠️ 주의사항

1. **API 키 보안**: `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다.
2. **Tavily 무료 티어**: 일일 1,000회 검색 제한 (각 리포트당 5-8회 검색 소요)
3. **응답 시간**: RAG 파이프라인으로 인해 리포트 생성 시간이 늘어날 수 있습니다 (약 30초-1분)

## 🔍 로그 확인

백엔드 콘솔에서 다음 로그를 확인할 수 있습니다:

```
[RAG] Starting RAG pipeline...
[RAG] Step 1: Generating search queries...
[RAG] Step 2: Searching web with X queries...
[Tavily Search] Query: "..."
[Tavily Search] Found X results
[AI] Starting RAG pipeline for context augmentation...
[AI] RAG context length: X characters
```

## 📝 다음 단계 (선택사항)

- [x] 검색 결과 캐싱 (중복 검색 방지) ✅
- [x] 검색 쿼리 최적화 ✅
- [x] 검색 결과 품질 평가 ✅
- [x] 검색 실패 시 폴백 로직 개선 ✅

## 🎉 완료된 개선 사항

### 1. 검색 결과 캐싱 (`backend/lib/cache.js`)
- **LRU 캐시 구현**: 메모리 기반 캐시로 중복 검색 방지
- **TTL 지원**: 1시간 캐시 유지 (설정 가능)
- **자동 정리**: 만료된 항목 자동 제거
- **통계 조회**: 캐시 상태 확인 기능

### 2. 검색 쿼리 최적화 (`backend/lib/searchOptimizer.js`)
- **중복 제거**: 유사도 기반 중복 쿼리 제거 (Jaccard 유사도)
- **품질 평가**: 쿼리 품질 점수 계산 및 필터링
- **키워드 추출**: 아이디어 텍스트에서 핵심 키워드 자동 추출
- **자동 최적화**: 품질이 낮은 쿼리 자동 제거

### 3. 검색 결과 품질 평가 (`backend/lib/searchQuality.js`)
- **관련성 평가**: 쿼리와 결과의 관련성 점수 계산
- **신뢰성 평가**: 도메인 신뢰도, HTTPS 사용 여부 등 평가
- **완전성 평가**: 제목, URL, 내용의 완전성 확인
- **자동 필터링**: 품질이 낮은 결과 자동 제거 및 정렬

### 4. 검색 실패 시 폴백 로직 개선
- **재시도 로직**: 네트워크 오류 시 자동 재시도 (지수 백오프)
- **다중 폴백**: 검색 실패 시 대안 검색 방법 시도
- **오류 처리 강화**: 각 검색 단계별 개별 오류 처리
- **로깅 개선**: 상세한 오류 로그 및 디버깅 정보

## 📦 생성된 파일

1. `backend/lib/cache.js` - 검색 결과 캐싱 모듈
2. `backend/lib/searchOptimizer.js` - 쿼리 최적화 모듈
3. `backend/lib/searchQuality.js` - 검색 결과 품질 평가 모듈

## 🔧 수정된 파일

1. `backend/lib/search.js` - 캐싱, 품질 평가, 재시도 로직 추가
2. `backend/lib/startupSearch.js` - 캐싱, 품질 평가, 폴백 로직 개선
3. `backend/lib/rag.js` - 쿼리 최적화 및 품질 평가 통합

## 🚀 성능 개선 효과

- **API 비용 절감**: 캐싱으로 중복 검색 방지
- **응답 시간 단축**: 캐시 히트 시 즉시 응답
- **검색 품질 향상**: 품질 평가로 관련성 높은 결과만 사용
- **안정성 향상**: 재시도 및 폴백 로직으로 오류 복구
- **쿼리 효율성**: 중복 제거 및 최적화로 불필요한 검색 감소

