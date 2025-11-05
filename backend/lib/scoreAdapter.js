/**
 * RAG 검색 결과와 AI 분석 결과를 SignalInput 형식으로 변환하는 어댑터
 * 
 * 이 모듈은 RAG 파이프라인과 AI 분석 결과를 받아서
 * 스코어링 엔진이 요구하는 SignalInput 형식으로 변환합니다.
 */

/**
 * RAG 검색 결과와 AI 분석 결과를 SignalInput으로 변환
 * 
 * @param {Object} params - 변환 파라미터
 * @param {string} params.ideaText - 아이디어 텍스트
 * @param {Object} params.ragResult - RAG 파이프라인 결과 {queries, searchResults, context}
 * @param {Object} params.aiAnalysis - AI 분석 결과 {score, marketScore, competitionScore, riskScore, analysis, precedents, marketDemand, ...}
 * @param {Object} params.options - 추가 옵션 {category, region, periodMonths}
 * @returns {Object} SignalInput 형식의 객체
 */
export function convertToSignalInput({ ideaText, ragResult, aiAnalysis, options = {} }) {
  const { searchResults = [] } = ragResult || {};
  const { precedents = [], marketDemand = {} } = aiAnalysis || {};
  
  // 검색 결과에서 Evidence 추출
  const evidences = extractEvidences(searchResults);
  
  // 도메인 추출 (중복 제거)
  const distinctDomains = new Set();
  evidences.forEach(ev => {
    if (ev.url) {
      try {
        const urlObj = new URL(ev.url);
        distinctDomains.add(urlObj.hostname);
      } catch (e) {
        // URL 파싱 실패 시 무시
      }
    }
  });
  
  // 신선도 계산 (최근 12개월 자료 비중)
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
  const recentEvidences = evidences.filter(ev => {
    if (!ev.publishedAt) return false;
    try {
      const pubDate = new Date(ev.publishedAt);
      return pubDate >= twelveMonthsAgo;
    } catch {
      return false;
    }
  });
  const freshnessRatio = evidences.length > 0 ? recentEvidences.length / evidences.length : 0;
  
  // Precedents에서 성공률 계산
  const successCount = (precedents || []).filter(p => p.status === '성공').length;
  const similarSuccessRate = precedents.length > 0 ? successCount / precedents.length : undefined;
  
  // 실패 패턴 회피 수 계산
  const failurePatternAvoided = (precedents || []).filter(p => p.status === '실패').length;
  
  // 경쟁 수준을 숫자로 변환
  const competitionLevel = marketDemand.competitionLevel || '';
  const competitionScore = competitionLevel === 'High' ? 0.8 : 
                          competitionLevel === 'Mid' ? 0.5 : 
                          competitionLevel === 'Low' ? 0.2 : undefined;
  
  // AI 점수를 신호로 변환하는 헬퍼 함수들
  /**
   * AI 점수(0-100)를 z-score(-2~+2)로 변환
   * 50점 = 0 (평균), 100점 = +2, 0점 = -2
   */
  const scoreToZ = (score) => {
    if (score === undefined || score === null) return undefined;
    return (score / 100 - 0.5) * 4; // 0-100 → -2~+2
  };
  
  /**
   * AI 점수(0-100)를 비율(0-1)로 변환
   */
  const scoreToRatio = (score) => {
    if (score === undefined || score === null) return undefined;
    return Math.max(0, Math.min(1, score / 100));
  };
  
  // AI 점수에서 신호 추출
  const aiMarketScore = aiAnalysis?.marketScore;
  const aiCompetitionScore = aiAnalysis?.competitionScore;
  const aiRiskScore = aiAnalysis?.riskScore;
  const aiTotalScore = aiAnalysis?.score;
  
  // 시장 매력도 신호: AI의 marketScore를 활용
  // marketScore가 높으면 성장 신호도 양수로 추정
  const marketZ = aiMarketScore ? scoreToZ(aiMarketScore) : undefined;
  
  // 자본 신호: AI 분석에서 시장 규모/성장률 언급 여부로 추정
  const roundCount24m = extractInvestmentSignals(aiAnalysis, searchResults);
  
  // 경쟁 우위 신호: AI의 competitionScore 활용
  const execReadinessFromAI = aiCompetitionScore ? scoreToRatio(aiCompetitionScore) : extractExecReadiness(aiAnalysis);
  
  // 리스크 신호: AI의 riskScore와 경쟁 수준을 분리
  const copycatRiskValue = extractCopycatRisk(aiAnalysis, competitionScore);
  const giantEntryRiskValue = extractGiantEntryRisk(aiAnalysis, competitionScore);
  
  const signalInput = {
    // 공통 메타
    category: options.category || extractCategory(ideaText),
    region: options.region || 'KR',
    periodMonths: options.periodMonths || 12,
    distinctSourceDomains: distinctDomains.size || evidences.length,
    freshnessRatio: freshnessRatio,
    
    // ── A. 시장 매력도 신호 ──
    // AI의 marketScore를 성장 신호로 변환
    newsGrowthZ: marketZ, // AI marketScore → z-score
    hiringGrowthZ: marketZ ? marketZ * 0.8 : undefined, // 시장 성장과 연관
    searchTrendZ: marketZ ? marketZ * 0.9 : undefined, // 시장 성장과 연관
    roundCount24m: roundCount24m?.count,
    roundAmount24m: roundCount24m?.amount,
    customerBuzzZ: marketZ ? marketZ * 0.7 : undefined, // 고객 관심도는 시장 성장과 연관
    regulatoryRiskScore: extractRegulatoryRisk(aiAnalysis, searchResults),
    sourceCoverage: distinctDomains.size || evidences.length,
    
    // ── B. 경쟁 우위(모트) 신호 ──
    uspDistance: extractUSPDistance(aiAnalysis),
    moatMentions: extractMoatMentions(aiAnalysis, searchResults),
    execReadinessScore: execReadinessFromAI, // AI competitionScore 우선 사용
    nicheFitScore: extractNicheFit(aiAnalysis),
    copycatRisk: copycatRiskValue, // 카피 리스크와 빅테크 진입 리스크 분리
    giantEntryRisk: giantEntryRiskValue,
    
    // ── C. 성공 사례 적합도 신호 ──
    similarSuccessRate: similarSuccessRate,
    contextMatchScore: extractContextMatch(precedents, options),
    failurePatternAvoided: failurePatternAvoided,
    primarySourceRatio: calculatePrimarySourceRatio(evidences),
    
    evidences: evidences,
  };
  
  return signalInput;
}

/**
 * 검색 결과에서 Evidence 배열 추출
 * @param {Array} searchResults - RAG 검색 결과 배열
 * @returns {Array} Evidence 배열
 */
function extractEvidences(searchResults) {
  const evidences = [];
  let docIdCounter = 1;
  
  for (const searchResult of searchResults) {
    if (!searchResult.results || !Array.isArray(searchResult.results)) continue;
    
    for (const result of searchResult.results) {
      // SourceType 추정
      const sourceType = inferSourceType(result.url || '', result.title || '');
      
      evidences.push({
        docId: `doc_${docIdCounter++}`,
        sourceType: sourceType,
        url: result.url,
        title: result.title,
        publishedAt: result.published_date || result.publishedAt,
        snippet: result.content?.substring(0, 200) || result.snippet,
        confidence: 70, // 기본 신뢰도
      });
    }
  }
  
  return evidences;
}

/**
 * URL과 제목에서 SourceType 추정
 * @param {string} url - URL
 * @param {string} title - 제목
 * @returns {string} SourceType
 */
function inferSourceType(url, title) {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  
  if (urlLower.includes('arxiv') || urlLower.includes('.edu') || titleLower.includes('논문') || titleLower.includes('paper')) {
    return 'paper';
  }
  if (urlLower.includes('startup') || urlLower.includes('crunchbase') || urlLower.includes('techcrunch')) {
    return 'startup';
  }
  if (urlLower.includes('report') || urlLower.includes('research') || urlLower.includes('analysis')) {
    return 'report';
  }
  if (urlLower.includes('news') || urlLower.includes('뉴스') || urlLower.includes('news')) {
    return 'news';
  }
  
  return 'other';
}

/**
 * 규제 리스크 점수 추출 (0-1)
 * @param {Object} aiAnalysis - AI 분석 결과
 * @param {Array} searchResults - 검색 결과
 * @returns {number|undefined} 규제 리스크 점수
 */
function extractRegulatoryRisk(aiAnalysis, searchResults) {
  // AI 분석에서 threats에 규제 관련 키워드가 있으면 리스크 증가
  const threats = aiAnalysis?.analysis?.threats || [];
  const regulatoryKeywords = ['규제', '법', '법률', '인허가', 'regulatory', 'regulation', 'compliance'];
  
  const hasRegulatoryThreat = threats.some(threat => 
    regulatoryKeywords.some(keyword => threat.toLowerCase().includes(keyword))
  );
  
  if (hasRegulatoryThreat) {
    return 0.6; // 중간 정도 리스크
  }
  
  return 0.2; // 기본 낮은 리스크
}

/**
 * USP 차별화 거리 추출 (0-1)
 * @param {Object} aiAnalysis - AI 분석 결과
 * @returns {number|undefined} USP 거리
 */
function extractUSPDistance(aiAnalysis) {
  // strengths가 많을수록 차별화 가능성 높음
  const strengths = aiAnalysis?.analysis?.strengths || [];
  // 0-5개 기준으로 정규화
  return Math.min(1, strengths.length / 5);
}

/**
 * 모트 언급 수 추출
 * @param {Object} aiAnalysis - AI 분석 결과
 * @param {Array} searchResults - 검색 결과
 * @returns {number|undefined} 모트 언급 수
 */
function extractMoatMentions(aiAnalysis, searchResults) {
  const moatKeywords = ['네트워크', 'network', '전환비용', 'switching', 'lock-in', '락인', '방어', 'defense'];
  
  let mentions = 0;
  
  // AI 분석에서 언급 찾기
  const analysis = aiAnalysis?.analysis || {};
  const allText = [
    ...(analysis.strengths || []),
    ...(analysis.opportunities || []),
    ...JSON.stringify(analysis).toLowerCase(),
  ].join(' ');
  
  moatKeywords.forEach(keyword => {
    if (allText.toLowerCase().includes(keyword.toLowerCase())) {
      mentions++;
    }
  });
  
  return mentions;
}

/**
 * 실행 준비도 추출 (0-1)
 * @param {Object} aiAnalysis - AI 분석 결과
 * @returns {number|undefined} 실행 준비도
 */
function extractExecReadiness(aiAnalysis) {
  // strengths가 많고 weaknesses가 적을수록 준비도 높음
  const strengths = aiAnalysis?.analysis?.strengths || [];
  const weaknesses = aiAnalysis?.analysis?.weaknesses || [];
  
  if (strengths.length === 0 && weaknesses.length === 0) {
    return undefined;
  }
  
  const total = strengths.length + weaknesses.length;
  return strengths.length / total;
}

/**
 * 틈새 포지션 적합도 추출 (0-1)
 * @param {Object} aiAnalysis - AI 분석 결과
 * @returns {number|undefined} 틈새 적합도
 */
function extractNicheFit(aiAnalysis) {
  // opportunities가 많을수록 틈새 시장 가능성 높음
  const opportunities = aiAnalysis?.analysis?.opportunities || [];
  // 0-5개 기준으로 정규화
  return Math.min(1, opportunities.length / 5);
}

/**
 * 컨텍스트 일치도 추출 (0-1)
 * @param {Array} precedents - 유사 사례 배열
 * @param {Object} options - 옵션 {region}
 * @returns {number|undefined} 컨텍스트 일치도
 */
function extractContextMatch(precedents, options) {
  if (!precedents || precedents.length === 0) {
    return undefined;
  }
  
  // 지역이 일치하는 사례 비율
  const region = options.region || 'KR';
  const regionMatches = precedents.filter(p => 
    p.reason?.includes(region) || p.name?.includes(region)
  ).length;
  
  return regionMatches / precedents.length;
}

/**
 * 1차 자료 비중 계산 (0-1)
 * @param {Array} evidences - Evidence 배열
 * @returns {number|undefined} 1차 자료 비중
 */
function calculatePrimarySourceRatio(evidences) {
  if (evidences.length === 0) {
    return undefined;
  }
  
  // paper, report를 1차 자료로 간주
  const primarySources = evidences.filter(ev => 
    ev.sourceType === 'paper' || ev.sourceType === 'report'
  );
  
  return primarySources.length / evidences.length;
}

/**
 * 투자 신호 추출 (라운드 수, 투자금)
 * @param {Object} aiAnalysis - AI 분석 결과
 * @param {Array} searchResults - 검색 결과
 * @returns {Object|undefined} {count, amount}
 */
function extractInvestmentSignals(aiAnalysis, searchResults) {
  // AI 분석이나 검색 결과에서 투자 관련 언급 찾기
  const analysis = aiAnalysis?.analysis || {};
  const allText = [
    ...(analysis.opportunities || []),
    ...(analysis.strengths || []),
    JSON.stringify(aiAnalysis?.marketDemand || {}),
  ].join(' ').toLowerCase();
  
  // 투자 관련 키워드: 투자, 펀딩, 라운드, 시리즈, 억, 달러, funding, round, series
  const investmentKeywords = ['투자', '펀딩', '라운드', '시리즈', '억', '달러', 'funding', 'round', 'series', 'million'];
  const hasInvestmentMention = investmentKeywords.some(keyword => allText.includes(keyword));
  
  if (!hasInvestmentMention) {
    return undefined;
  }
  
  // 시장 규모/성장률 언급이 있으면 투자 활발도가 높다고 추정
  const marketSize = aiAnalysis?.marketDemand?.size || '';
  const marketGrowth = aiAnalysis?.marketDemand?.growth || '';
  
  // 시장 규모가 크면 투자 라운드 수가 많을 것으로 추정
  let count = 5; // 기본값
  let amount = 1.0; // 기본값 (상대 지표)
  
  if (marketSize.includes('억') || marketSize.includes('million') || marketSize.includes('billion')) {
    count = 8; // 시장 규모가 크면 투자 활발
    amount = 2.5;
  } else if (marketSize.includes('천만') || marketSize.includes('million')) {
    count = 6;
    amount = 1.5;
  }
  
  // 성장률이 높으면 투자금 증가
  if (marketGrowth.includes('15%') || marketGrowth.includes('20%') || marketGrowth.includes('30%')) {
    amount *= 1.5;
  }
  
  return { count, amount };
}

/**
 * 카피 리스크 추출 (0-1)
 * @param {Object} aiAnalysis - AI 분석 결과
 * @param {number|undefined} competitionScore - 경쟁 수준 점수
 * @returns {number|undefined} 카피 리스크
 */
function extractCopycatRisk(aiAnalysis, competitionScore) {
  // weaknesses에 '차별화', '차별' 관련 언급이 있으면 카피 리스크 높음
  const weaknesses = aiAnalysis?.analysis?.weaknesses || [];
  const copycatKeywords = ['차별화', '차별', '모방', '카피', '복제', 'differentiation', 'copycat'];
  
  const hasCopycatWeakness = weaknesses.some(w => 
    copycatKeywords.some(keyword => w.toLowerCase().includes(keyword))
  );
  
  if (hasCopycatWeakness) {
    return 0.7; // 카피 리스크 높음
  }
  
  // 경쟁 수준이 높으면 카피 리스크도 높음
  if (competitionScore !== undefined) {
    return competitionScore * 0.8; // 경쟁 수준의 80%
  }
  
  return 0.3; // 기본 중간 리스크
}

/**
 * 빅테크 진입 리스크 추출 (0-1)
 * @param {Object} aiAnalysis - AI 분석 결과
 * @param {number|undefined} competitionScore - 경쟁 수준 점수
 * @returns {number|undefined} 빅테크 진입 리스크
 */
function extractGiantEntryRisk(aiAnalysis, competitionScore) {
  // threats에 '빅테크', '대기업', '기존 플레이어' 언급이 있으면 리스크 높음
  const threats = aiAnalysis?.analysis?.threats || [];
  const giantKeywords = ['빅테크', '대기업', '기존', '플레이어', 'big tech', 'giant', 'incumbent', '기업'];
  
  const hasGiantThreat = threats.some(t => 
    giantKeywords.some(keyword => t.toLowerCase().includes(keyword))
  );
  
  if (hasGiantThreat) {
    return 0.8; // 빅테크 진입 리스크 높음
  }
  
  // 경쟁 수준이 높으면 빅테크 진입 가능성도 높음
  if (competitionScore !== undefined) {
    return competitionScore * 0.9; // 경쟁 수준의 90%
  }
  
  return 0.2; // 기본 낮은 리스크
}

/**
 * 아이디어 텍스트에서 카테고리 추출
 * @param {string} ideaText - 아이디어 텍스트
 * @returns {string|undefined} 카테고리
 */
function extractCategory(ideaText) {
  const categories = {
    'EdTech': ['교육', '학습', '학생', '교사', 'education', 'learning'],
    'FinTech': ['금융', '은행', '결제', 'finance', 'payment', 'banking'],
    'HealthTech': ['의료', '건강', '병원', 'health', 'medical', 'hospital'],
    'FoodTech': ['음식', '식품', '배달', 'food', 'delivery', 'restaurant'],
    'PropTech': ['부동산', '임대', 'real estate', 'property'],
    'E-commerce': ['쇼핑', '온라인', 'ecommerce', 'shopping', 'online'],
  };
  
  const textLower = ideaText.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => textLower.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  
  return undefined;
}

