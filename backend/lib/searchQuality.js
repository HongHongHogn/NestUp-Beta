/**
 * 검색 결과 품질 평가 모듈
 * 관련성, 신뢰성, 완전성을 평가하여 검색 결과의 품질을 개선
 */

/**
 * 검색 결과의 관련성 평가
 * @param {Object} result - 검색 결과 항목
 * @param {string} originalQuery - 원본 검색 쿼리
 * @returns {number} 관련성 점수 (0-100)
 */
function evaluateRelevance(result, originalQuery) {
  if (!result || !originalQuery) {
    return 0;
  }

  const queryLower = originalQuery.toLowerCase();
  const title = (result.title || '').toLowerCase();
  const content = (result.content || '').toLowerCase();
  const url = (result.url || '').toLowerCase();

  let score = 0;

  // 제목에 쿼리 키워드 포함 여부 (가중치 높음)
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);
  const titleMatches = queryWords.filter(word => title.includes(word)).length;
  const titleScore = (titleMatches / queryWords.length) * 50;
  score += titleScore;

  // 내용에 쿼리 키워드 포함 여부
  const contentMatches = queryWords.filter(word => content.includes(word)).length;
  const contentScore = (contentMatches / queryWords.length) * 30;
  score += contentScore;

  // URL에 관련 키워드 포함 여부
  const urlMatches = queryWords.filter(word => url.includes(word)).length;
  const urlScore = (urlMatches / queryWords.length) * 20;
  score += urlScore;

  return Math.min(100, Math.round(score));
}

/**
 * 검색 결과의 신뢰성 평가
 * @param {Object} result - 검색 결과 항목
 * @returns {number} 신뢰성 점수 (0-100)
 */
function evaluateCredibility(result) {
  if (!result) {
    return 0;
  }

  let score = 50; // 기본 점수

  const url = (result.url || '').toLowerCase();

  // 신뢰할 수 있는 도메인 체크
  const trustedDomains = [
    'crunchbase.com',
    'thevc.kr',
    'thevc.co.kr',
    'techcrunch.com',
    'wikipedia.org',
    'github.com',
    'stackoverflow.com',
    '.edu',
    '.gov',
    '.ac.kr',
  ];

  const isTrustedDomain = trustedDomains.some(domain => url.includes(domain));
  if (isTrustedDomain) {
    score += 30;
  }

  // HTTPS 사용 여부
  if (url.startsWith('https://')) {
    score += 10;
  } else if (url.startsWith('http://')) {
    score -= 10;
  }

  // URL 구조 평가 (짧고 깔끔한 URL이 더 신뢰할 수 있음)
  try {
    const urlObj = new URL(result.url || '');
    if (urlObj.hostname.length < 30 && urlObj.pathname.length < 100) {
      score += 10;
    }
  } catch (e) {
    score -= 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * 검색 결과의 완전성 평가
 * @param {Object} result - 검색 결과 항목
 * @returns {number} 완전성 점수 (0-100)
 */
function evaluateCompleteness(result) {
  if (!result) {
    return 0;
  }

  let score = 0;

  // 제목 존재 여부
  if (result.title && result.title.trim().length > 0) {
    score += 20;
  }

  // URL 존재 여부
  if (result.url && result.url.trim().length > 0) {
    score += 20;
  }

  // 내용 존재 여부 및 길이
  if (result.content && result.content.trim().length > 0) {
    score += 30;
    const contentLength = result.content.trim().length;

    // 내용이 너무 짧으면 감점
    if (contentLength < 50) {
      score -= 10;
    } else if (contentLength > 200) {
      score += 20; // 충분한 내용
    } else if (contentLength > 100) {
      score += 10;
    }
  }

  // 메타데이터 존재 여부
  if (result.metadata) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * 검색 결과 항목의 전체 품질 평가
 * @param {Object} result - 검색 결과 항목
 * @param {string} originalQuery - 원본 검색 쿼리
 * @returns {Object} 품질 평가 결과
 */
export function evaluateSearchResult(result, originalQuery) {
  if (!result) {
    return {
      overallScore: 0,
      relevance: 0,
      credibility: 0,
      completeness: 0,
      issues: ['검색 결과가 없습니다'],
    };
  }

  const relevance = evaluateRelevance(result, originalQuery);
  const credibility = evaluateCredibility(result);
  const completeness = evaluateCompleteness(result);

  // 가중 평균 (관련성 50%, 신뢰성 30%, 완전성 20%)
  const overallScore = Math.round(
    relevance * 0.5 + credibility * 0.3 + completeness * 0.2
  );

  const issues = [];
  if (relevance < 30) {
    issues.push('관련성이 낮습니다');
  }
  if (credibility < 40) {
    issues.push('신뢰성 확인이 필요합니다');
  }
  if (completeness < 50) {
    issues.push('정보가 불완전합니다');
  }

  return {
    overallScore,
    relevance,
    credibility,
    completeness,
    issues,
  };
}

/**
 * 검색 결과 배열의 품질 평가 및 필터링
 * @param {Object[]} results - 검색 결과 배열
 * @param {string} originalQuery - 원본 검색 쿼리
 * @param {Object} options - 필터링 옵션
 * @returns {Object} 평가 및 필터링된 결과
 */
export function evaluateAndFilterResults(results, originalQuery, options = {}) {
  if (!results || results.length === 0) {
    return {
      filtered: [],
      evaluations: [],
      averageScore: 0,
      removedCount: 0,
    };
  }

  const {
    minScore = 30, // 최소 품질 점수
    maxResults = 10, // 최대 결과 수
    sortByScore = true, // 점수 기준 정렬
  } = options;

  // 각 결과 평가
  const evaluations = results.map(result => ({
    result,
    quality: evaluateSearchResult(result, originalQuery),
  }));

  // 최소 점수 이상만 필터링
  let filtered = evaluations.filter(item => item.quality.overallScore >= minScore);

  // 점수 기준 정렬
  if (sortByScore) {
    filtered.sort((a, b) => b.quality.overallScore - a.quality.overallScore);
  }

  // 최대 결과 수 제한
  if (filtered.length > maxResults) {
    filtered = filtered.slice(0, maxResults);
  }

  // 원본 결과 형식으로 변환
  const filteredResults = filtered.map(item => item.result);

  // 평균 점수 계산
  const averageScore = filtered.length > 0
    ? Math.round(
        filtered.reduce((sum, item) => sum + item.quality.overallScore, 0) /
          filtered.length
      )
    : 0;

  const removedCount = results.length - filteredResults.length;

  if (removedCount > 0) {
    console.log(
      `[Search Quality] Filtered ${removedCount} low-quality results (avg score: ${averageScore})`
    );
  }

  return {
    filtered: filteredResults,
    evaluations,
    averageScore,
    removedCount,
    qualityStats: {
      min: filtered.length > 0 ? Math.min(...filtered.map(item => item.quality.overallScore)) : 0,
      max: filtered.length > 0 ? Math.max(...filtered.map(item => item.quality.overallScore)) : 0,
      avg: averageScore,
    },
  };
}

/**
 * 검색 결과 세트의 전체 품질 평가
 * @param {Object[]} searchResultSets - 검색 결과 세트 배열 (각 쿼리별 결과)
 * @returns {Object} 전체 품질 통계
 */
export function evaluateSearchResultSets(searchResultSets) {
  if (!searchResultSets || searchResultSets.length === 0) {
    return {
      totalResults: 0,
      averageQuality: 0,
      highQualityCount: 0,
      lowQualityCount: 0,
    };
  }

  let totalResults = 0;
  let totalScore = 0;
  let highQualityCount = 0;
  let lowQualityCount = 0;

  for (const resultSet of searchResultSets) {
    if (!resultSet.results || resultSet.results.length === 0) {
      continue;
    }

    for (const result of resultSet.results) {
      const quality = evaluateSearchResult(result, resultSet.query || '');
      totalResults++;
      totalScore += quality.overallScore;

      if (quality.overallScore >= 70) {
        highQualityCount++;
      } else if (quality.overallScore < 40) {
        lowQualityCount++;
      }
    }
  }

  const averageQuality = totalResults > 0 ? Math.round(totalScore / totalResults) : 0;

  return {
    totalResults,
    averageQuality,
    highQualityCount,
    lowQualityCount,
    highQualityRatio: totalResults > 0 ? (highQualityCount / totalResults) * 100 : 0,
  };
}

export default {
  evaluateSearchResult,
  evaluateAndFilterResults,
  evaluateSearchResultSets,
};
