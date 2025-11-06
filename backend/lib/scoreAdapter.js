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
  
  // 아이디어 텍스트 자체의 특징 분석 (기본값 대체용)
  const ideaCharacteristics = analyzeIdeaCharacteristics(ideaText);
  
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
  
  // RAG 검색 결과에서 신호 추출 (더 중요하게 사용)
  const ragSignals = extractSignalsFromRAG(searchResults, ideaText);
  
  // 시장 매력도 신호: RAG 결과와 AI 점수를 조합
  // RAG 결과가 있으면 이를 우선 사용, 없으면 AI 점수 사용
  const marketZ = ragSignals.newsGrowthZ !== undefined 
    ? ragSignals.newsGrowthZ 
    : (aiMarketScore ? scoreToZ(aiMarketScore) : undefined);
  
  // 자본 신호: RAG 결과 우선, 없으면 AI 분석 활용
  const roundCount24m = ragSignals.roundCount24m || extractInvestmentSignals(aiAnalysis, searchResults);
  
  // 경쟁 우위 신호: RAG 결과와 AI 점수 조합
  const execReadinessFromAI = ragSignals.execReadinessScore !== undefined
    ? ragSignals.execReadinessScore
    : (aiCompetitionScore ? scoreToRatio(aiCompetitionScore) : extractExecReadiness(aiAnalysis));
  
  // 리스크 신호: RAG 결과와 AI 분석 조합
  const copycatRiskValue = ragSignals.copycatRisk !== undefined 
    ? ragSignals.copycatRisk 
    : extractCopycatRisk(aiAnalysis, competitionScore);
  const giantEntryRiskValue = ragSignals.giantEntryRisk !== undefined
    ? ragSignals.giantEntryRisk
    : extractGiantEntryRisk(aiAnalysis, competitionScore);
  
  const signalInput = {
    // 공통 메타
    category: options.category || extractCategory(ideaText),
    region: options.region || 'KR',
    periodMonths: options.periodMonths || 12,
    distinctSourceDomains: distinctDomains.size || evidences.length,
    freshnessRatio: freshnessRatio,
    
    // ── A. 시장 매력도 신호 ──
    // RAG 결과 우선, 없으면 AI 점수 사용
    newsGrowthZ: ragSignals.newsGrowthZ !== undefined ? ragSignals.newsGrowthZ : marketZ,
    hiringGrowthZ: ragSignals.hiringGrowthZ !== undefined 
      ? ragSignals.hiringGrowthZ 
      : (marketZ ? marketZ * 0.8 : undefined),
    searchTrendZ: ragSignals.searchTrendZ !== undefined
      ? ragSignals.searchTrendZ
      : (marketZ ? marketZ * 0.9 : undefined),
    roundCount24m: roundCount24m?.count,
    roundAmount24m: roundCount24m?.amount,
    customerBuzzZ: ragSignals.customerBuzzZ !== undefined
      ? ragSignals.customerBuzzZ
      : (marketZ ? marketZ * 0.7 : undefined),
    regulatoryRiskScore: extractRegulatoryRisk(aiAnalysis, searchResults),
    sourceCoverage: distinctDomains.size || evidences.length,
    
    // ── B. 경쟁 우위(모트) 신호 ──
    uspDistance: ragSignals.uspDistance !== undefined 
      ? ragSignals.uspDistance 
      : extractUSPDistance(aiAnalysis),
    moatMentions: ragSignals.moatMentions !== undefined
      ? ragSignals.moatMentions
      : extractMoatMentions(aiAnalysis, searchResults),
    execReadinessScore: execReadinessFromAI,
    nicheFitScore: ragSignals.nicheFitScore !== undefined
      ? ragSignals.nicheFitScore
      : extractNicheFit(aiAnalysis),
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

/**
 * RAG 검색 결과에서 신호 추출 (아이디어별 차별화를 위해 중요)
 * @param {Array} searchResults - RAG 검색 결과 배열
 * @param {string} ideaText - 아이디어 텍스트
 * @returns {Object} 추출된 신호 객체
 */
function extractSignalsFromRAG(searchResults, ideaText) {
  const signals = {};
  
  if (!searchResults || searchResults.length === 0) {
    return signals;
  }
  
  // 검색 결과를 평탄화 (중첩 구조 지원)
  const flattenedResults = [];
  for (const searchResult of searchResults) {
    if (searchResult.results && Array.isArray(searchResult.results)) {
      // 중첩 구조인 경우
      flattenedResults.push(...searchResult.results);
    } else if (searchResult.title || searchResult.content || searchResult.snippet) {
      // 이미 평탄화된 구조인 경우
      flattenedResults.push(searchResult);
    }
  }
  
  if (flattenedResults.length === 0) {
    return signals;
  }
  
  // 모든 검색 결과의 텍스트를 합침
  const allText = flattenedResults
    .map(r => `${r.title || ''} ${r.content || ''} ${r.snippet || ''}`)
    .join(' ')
    .toLowerCase();
  
  const ideaTextLower = ideaText.toLowerCase();
  
  // 1. 성장 신호: 뉴스/기사에서 성장 관련 키워드 빈도
  const growthKeywords = ['성장', 'growth', '증가', 'increase', '상승', 'rise', '확대', 'expand'];
  const growthMentions = growthKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  // 0-10개 기준으로 z-score 변환 (-2 ~ +2)
  signals.newsGrowthZ = normalizeToZScore(growthMentions, 0, 10);
  
  // 2. 고용 성장: 채용/고용 관련 키워드
  const hiringKeywords = ['채용', 'hiring', '고용', 'employment', 'recruit', '인력', '직원'];
  const hiringMentions = hiringKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  signals.hiringGrowthZ = normalizeToZScore(hiringMentions, 0, 8);
  
  // 3. 검색 트렌드: 검색량/트렌드 관련 키워드
  const searchKeywords = ['검색', 'search', 'trend', '트렌드', '인기', 'popular', 'viral', '바이럴'];
  const searchMentions = searchKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  signals.searchTrendZ = normalizeToZScore(searchMentions, 0, 8);
  
  // 4. 고객 관심도: 사용자/고객 관련 키워드
  const customerKeywords = ['사용자', 'user', '고객', 'customer', '클라이언트', 'client', '리뷰', 'review'];
  const customerMentions = customerKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  signals.customerBuzzZ = normalizeToZScore(customerMentions, 0, 15);
  
  // 5. 투자 신호: 투자/펀딩 관련 정보 추출
  const investmentKeywords = ['투자', 'investment', '펀딩', 'funding', '라운드', 'round', '시리즈', 'series'];
  const investmentMentions = investmentKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  
  // 투자 금액 추출 시도 (억, 달러, million 등)
  const amountPatterns = [
    /(\d+)\s*억/g,
    /(\d+)\s*million/g,
    /(\d+)\s*billion/g,
    /\$(\d+)\s*m/g,
    /\$(\d+)\s*b/g,
  ];
  
  let maxAmount = 0;
  amountPatterns.forEach(pattern => {
    const matches = allText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const num = parseFloat(match.replace(/[^\d.]/g, ''));
        if (match.includes('billion') || match.includes('b')) {
          maxAmount = Math.max(maxAmount, num * 1000);
        } else if (match.includes('억')) {
          maxAmount = Math.max(maxAmount, num * 0.1); // 억 → 십억 단위로 변환
        } else {
          maxAmount = Math.max(maxAmount, num);
        }
      });
    }
  });
  
  if (investmentMentions > 0) {
    signals.roundCount24m = {
      count: Math.min(20, Math.max(1, Math.floor(investmentMentions / 2))),
      amount: maxAmount > 0 ? Math.min(10, maxAmount) : Math.min(5, investmentMentions)
    };
  }
  
  // 6. 차별화 신호: 고유성/차별화 관련 키워드
  const uspKeywords = ['차별화', 'differentiation', '고유', 'unique', '독특', '특별', '혁신', 'innovation'];
  const uspMentions = uspKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  signals.uspDistance = Math.min(1, uspMentions / 5); // 0-5개 기준 정규화
  
  // 7. 모트 언급: 방어/경쟁우위 관련 키워드
  const moatKeywords = ['방어', 'defense', '경쟁우위', 'competitive', '장벽', 'barrier', 'lock-in', '락인'];
  signals.moatMentions = moatKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  
  // 8. 틈새 포지션: 틈새/니치 관련 키워드
  const nicheKeywords = ['틈새', 'niche', '특화', 'specialized', '집중', 'focus', '타겟', 'target'];
  const nicheMentions = nicheKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  signals.nicheFitScore = Math.min(1, nicheMentions / 4); // 0-4개 기준 정규화
  
  // 9. 카피 리스크: 경쟁/모방 관련 키워드
  const copycatKeywords = ['경쟁', 'competition', '모방', 'copy', '복제', 'clone', '카피', '이미지'];
  const copycatMentions = copycatKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  signals.copycatRisk = Math.min(1, copycatMentions / 8); // 0-8개 기준 정규화
  
  // 10. 빅테크 진입 리스크: 대기업/빅테크 관련 키워드
  const giantKeywords = ['대기업', 'big tech', '기업', 'enterprise', '플랫폼', 'platform', '거대', 'giant'];
  const giantMentions = giantKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  signals.giantEntryRisk = Math.min(1, giantMentions / 6); // 0-6개 기준 정규화
  
  // 11. 실행 준비도: 기술/구현 관련 키워드
  const execKeywords = ['기술', 'technology', '구현', 'implementation', '개발', 'development', '준비', 'ready'];
  const execMentions = execKeywords.reduce((count, keyword) => {
    return count + (allText.split(keyword.toLowerCase()).length - 1);
  }, 0);
  signals.execReadinessScore = Math.min(1, execMentions / 6); // 0-6개 기준 정규화
  
  // 아이디어 텍스트 자체의 특성도 반영
  const ideaLength = ideaText.length;
  const ideaWordCount = ideaText.split(/\s+/).length;
  
  // 긴 아이디어는 더 구체적일 가능성이 높음
  if (ideaLength > 500) {
    signals.execReadinessScore = Math.max(signals.execReadinessScore || 0, 0.3);
  }
  
  // 아이디어에서 숫자/통계가 많으면 더 구체적
  const numberCount = (ideaText.match(/\d+/g) || []).length;
  if (numberCount > 3) {
    signals.execReadinessScore = Math.max(signals.execReadinessScore || 0, 0.4);
  }
  
  // 아이디어 고유성 점수 (텍스트 해시 기반으로 아이디어별 차별화)
  const ideaHash = simpleHash(ideaText);
  const uniquenessScore = (ideaHash % 100) / 100; // 0~1 범위
  
  // 신호가 없을 때 기본값으로 사용
  if (signals.newsGrowthZ === undefined) {
    signals.newsGrowthZ = (uniquenessScore - 0.5) * 2; // -1 ~ +1 범위로 변환
  }
  if (signals.uspDistance === undefined) {
    signals.uspDistance = uniquenessScore * 0.6 + 0.2; // 0.2 ~ 0.8 범위
  }
  if (signals.nicheFitScore === undefined) {
    signals.nicheFitScore = uniquenessScore * 0.5 + 0.3; // 0.3 ~ 0.8 범위
  }
  
  return signals;
}

/**
 * 아이디어 텍스트의 특징 분석
 * @param {string} ideaText - 아이디어 텍스트
 * @returns {Object} 특징 객체
 */
function analyzeIdeaCharacteristics(ideaText) {
  const characteristics = {
    length: ideaText.length,
    wordCount: ideaText.split(/\s+/).length,
    numberCount: (ideaText.match(/\d+/g) || []).length,
    hasQuestion: ideaText.includes('?'),
    hasExclamation: ideaText.includes('!'),
    hasTechnicalTerms: /(API|AI|ML|데이터|알고리즘|시스템|플랫폼|서비스|앱|애플리케이션)/i.test(ideaText),
    hasMarketTerms: /(시장|고객|사용자|비즈니스|수익|매출|고객|타겟)/i.test(ideaText),
    hasInnovationTerms: /(혁신|새로운|차별화|고유|독특|특별)/i.test(ideaText),
  };
  
  return characteristics;
}

/**
 * 간단한 해시 함수 (아이디어별 고유값 생성)
 * @param {string} text - 텍스트
 * @returns {number} 해시 값
 */
function simpleHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 값을 z-score로 변환 (-2 ~ +2 범위)
 * @param {number} value - 변환할 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {number} z-score (-2 ~ +2)
 */
function normalizeToZScore(value, min, max) {
  if (max === min) return 0;
  const normalized = (value - min) / (max - min); // 0~1
  return (normalized - 0.5) * 4; // -2 ~ +2
}

