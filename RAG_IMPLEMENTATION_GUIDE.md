# RAG 시스템 구현 가이드

## 🎯 RAG 구현을 위해 필요한 것들

### 1. **웹 검색 API 키** (필수)

PRD에 따르면 Google Search grounding을 사용해야 하지만, 몇 가지 옵션이 있습니다:

---

## 📋 옵션별 비교 및 필요 정보

### **옵션 1: SerpAPI** (추천 - 가장 쉽고 빠름) ⭐

**장점**:
- 구현이 가장 쉽고 빠름
- 무료 티어 제공 (월 100회 검색)
- 안정적인 API
- 한국어 검색 지원 우수

**필요한 것**:
- SerpAPI 키
- [SerpAPI](https://serpapi.com/) 가입 후 API 키 발급

**제공하실 정보**:
```
SERPAPI_KEY=your_serpapi_key_here
```

**비용**:
- Free Tier: 월 100회 검색 무료
- Paid: $50/월 (5,000회), $100/월 (12,000회)

---

### **옵션 2: Google Custom Search API** (무료 티어 존재)

**장점**:
- Google의 공식 API
- 무료 티어: 일일 100회 검색 무료
- 커스텀 검색 엔진 구성 가능

**단점**:
- 설정이 약간 복잡함 (Custom Search Engine 생성 필요)

**필요한 것**:
1. Google Cloud Console에서 프로젝트 생성
2. Custom Search API 활성화
3. Custom Search Engine 생성 (Programmable Search Engine)
4. API 키 발급
5. Search Engine ID

**제공하실 정보**:
```
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

**설정 방법**:
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. "Custom Search API" 활성화
4. [Programmable Search Engine](https://programmablesearchengine.google.com/)에서 검색 엔진 생성
5. API 키 및 Search Engine ID 발급

---

### **옵션 3: Gemini API with Grounding** (PRD 명시된 방법)

**장점**:
- PRD에 명시된 방법
- Google 검색 결과 자동 통합
- 가장 정확한 최신 정보

**단점**:
- 현재 베타 단계 (Grounding 기능)
- 설정 복잡

**필요한 것**:
- Google AI Studio 또는 Vertex AI API 키
- Grounding 기능 활성화

**제공하실 정보**:
```
GEMINI_API_KEY=your_gemini_api_key
```

**참고**: Gemini Grounding은 현재 베타이며, 한국어 검색 지원이 제한적일 수 있습니다.

---

### **옵션 4: Tavily AI** (AI 기반 검색 특화) ⭐

**장점**:
- AI 검색에 특화된 API
- 무료 티어 제공
- 검색 결과가 이미 요약되어 있어 RAG에 적합
- 한국어 검색 지원

**필요한 것**:
- [Tavily](https://tavily.com/) 가입 후 API 키 발급

**제공하실 정보**:
```
TAVILY_API_KEY=your_tavily_api_key
```

**비용**:
- Free Tier: 일일 1,000회 검색 무료
- Paid: $99/월 (무제한)

---

## 🔧 구현을 위해 필요한 것들

### **최소 제공 항목** (RAG 구현을 위해)

1. **웹 검색 API 키** (위 옵션 중 하나 선택)
   - 추천: SerpAPI 또는 Tavily (가장 빠르고 쉽게 구현 가능)

2. **현재 `.env` 파일 구조** (선택사항)
   - 이미 어떤 환경 변수를 사용하는지 확인하기 위해
   - 제공하지 않아도 됨 (코드를 보면 알 수 있음)

### **선택 제공 항목** (더 나은 구현을 위해)

3. **예산 제약 사항**
   - 무료 티어만 사용? 유료 플랜 가능?
   - 이에 따라 최적의 API 선택 가능

4. **프리퍼런스**
   - Google 공식 API 선호? (옵션 2)
   - 최신 베타 기능 사용 선호? (옵션 3)
   - 빠른 구현 선호? (옵션 1, 4)

---

## 💡 추천 사항

**빠른 MVP 완성을 위해서는**:
1. **SerpAPI** 또는 **Tavily** 추천
   - 설정이 가장 간단
   - 무료 티어로 시작 가능
   - 구현 시간 최소화

**PRD 요구사항을 정확히 따르려면**:
2. **Gemini API with Grounding** 또는 **Google Custom Search API**
   - PRD에 명시된 방법
   - 향후 확장성 좋음

**예산이 제한적이라면**:
3. **Google Custom Search API** (일일 100회 무료) 또는 **SerpAPI** (월 100회 무료)

---

## 📝 구현 시 진행 순서

제공해주신 API 키를 받으면 다음과 같이 진행합니다:

1. **웹 검색 모듈 구현** (`backend/lib/search.js`)
   - 선택한 API에 맞는 검색 함수 구현
   - Query Generation → Search → 결과 파싱

2. **RAG 파이프라인 구현** (`backend/lib/rag.js`)
   - 아이디어 분석 → 쿼리 생성 → 웹 검색 → 컨텍스트 구성 → AI 분석

3. **AI 분석 로직 개선** (`backend/lib/ai.js`)
   - 검색 결과를 컨텍스트로 주입
   - 유사 사례, 시장 데이터 추출 로직 추가

4. **데이터 저장 로직 개선** (`backend/routes/validate.js`)
   - precedents, market data 저장

5. **환경 변수 추가** (`.env.example` 업데이트)

---

## ✅ 지금 해주시면 될 것

**최소 필요 항목**:
```
[선택한 API 이름]_API_KEY=your_api_key_here
```

예시:
- SerpAPI를 선택한다면: `SERPAPI_KEY=abc123...`
- Tavily를 선택한다면: `TAVILY_API_KEY=abc123...`
- Google Custom Search를 선택한다면:
  ```
  GOOGLE_SEARCH_API_KEY=abc123...
  GOOGLE_SEARCH_ENGINE_ID=xyz789...
  ```

**추가 정보** (선택사항):
- 예산 제약 사항
- API 선호도
- 무료 티어로 시작 가능 여부

---

## 🚀 다음 단계

API 키를 제공해주시면:
1. 즉시 RAG 시스템 구현 시작
2. 테스트 및 검증
3. 기존 AI 분석 로직과 통합
4. M-3, M-4 기능 완전 구현

**어떤 API를 선택하시겠습니까?** 
추천: **SerpAPI** 또는 **Tavily** (빠른 구현을 위해)

