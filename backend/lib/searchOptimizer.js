/**
 * 검색 쿼리 최적화 모듈
 * 쿼리 품질 향상, 중복 제거, 관련성 개선
 */

/**
 * 쿼리 정규화 (공백, 대소문자, 특수문자 처리)
 */
function normalizeQuery(query) {
  if (!query || typeof query !== 'string') {
    return '';
  }
  return query
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s가-힣]/g, '')
    .toLowerCase();
}

/**
 * 두 쿼리의 유사도 계산 (간단한 Jaccard 유사도)
 */
function calculateSimilarity(query1, query2) {
  const norm1 = normalizeQuery(query1);
  const norm2 = normalizeQuery(query2);

  if (norm1 === norm2) return 1.0;

  const words1 = new Set(norm1.split(/\s+/).filter(w => w.length > 1));
  const words2 = new Set(norm2.split(/\s+/).filter(w => w.length > 1));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * 중복 쿼리 제거 (유사도 임계값 기준)
 * @param {string[]} queries - 검색 쿼리 배열
 * @param {number} similarityThreshold - 유사도 임계값 (0.0-1.0, 기본 0.7)
 * @returns {string[]} 중복이 제거된 쿼리 배열
 */
export function removeDuplicateQueries(queries, similarityThreshold = 0.7) {
  if (!queries || queries.length === 0) {
    return [];
  }

  const uniqueQueries = [];
  const normalizedQueries = queries.map(q => normalizeQuery(q));

  for (let i = 0; i < queries.length; i++) {
    const currentQuery = queries[i];
    let isDuplicate = false;

    // 이미 추가된 쿼리와 비교
    for (const uniqueQuery of uniqueQueries) {
      const similarity = calculateSimilarity(currentQuery, uniqueQuery);
      if (similarity >= similarityThreshold) {
        isDuplicate = true;
        // 더 긴 쿼리를 유지 (일반적으로 더 구체적)
        if (currentQuery.length > uniqueQuery.length) {
          const index = uniqueQueries.indexOf(uniqueQuery);
          uniqueQueries[index] = currentQuery;
        }
        break;
      }
    }

    if (!isDuplicate) {
      uniqueQueries.push(currentQuery);
    }
  }

  console.log(`[Query Optimizer] Removed ${queries.length - uniqueQueries.length} duplicate queries`);
  return uniqueQueries;
}

/**
 * 쿼리 품질 평가
 * @param {string} query - 검색 쿼리
 * @returns {Object} 품질 점수 및 피드백
 */
export function evaluateQueryQuality(query) {
  if (!query || typeof query !== 'string') {
    return {
      score: 0,
      issues: ['쿼리가 비어있습니다'],
      suggestions: ['검색어를 입력하세요'],
    };
  }

  const trimmed = query.trim();
  const issues = [];
  const suggestions = [];
  let score = 100;

  // 길이 체크
  if (trimmed.length < 3) {
    score -= 30;
    issues.push('쿼리가 너무 짧습니다');
    suggestions.push('더 구체적인 검색어를 추가하세요');
  } else if (trimmed.length > 200) {
    score -= 20;
    issues.push('쿼리가 너무 깁니다');
    suggestions.push('핵심 키워드만 포함하세요');
  }

  // 키워드 개수 체크
  const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 2) {
    score -= 20;
    issues.push('키워드가 부족합니다');
    suggestions.push('관련 키워드를 추가하세요');
  } else if (wordCount > 10) {
    score -= 10;
    issues.push('키워드가 너무 많습니다');
    suggestions.push('핵심 키워드만 선택하세요');
  }

  // 특수문자 체크 (일부 특수문자는 유용할 수 있음)
  const specialCharCount = (trimmed.match(/[^\w\s가-힣]/g) || []).length;
  if (specialCharCount > 5) {
    score -= 10;
    issues.push('특수문자가 너무 많습니다');
  }

  // 검색에 유용한 키워드 포함 여부
  const usefulKeywords = ['시장', '경쟁', '사례', '성공', '실패', '트렌드', '성장', '기업', '스타트업'];
  const hasUsefulKeyword = usefulKeywords.some(keyword => trimmed.includes(keyword));
  if (hasUsefulKeyword) {
    score += 10;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions,
    wordCount,
    length: trimmed.length,
  };
}

/**
 * 쿼리 배열 품질 평가 및 필터링
 * @param {string[]} queries - 검색 쿼리 배열
 * @param {number} minQualityScore - 최소 품질 점수 (기본 40)
 * @returns {Object} 필터링된 쿼리와 평가 결과
 */
export function filterQueriesByQuality(queries, minQualityScore = 40) {
  if (!queries || queries.length === 0) {
    return {
      filtered: [],
      evaluations: [],
      removedCount: 0,
    };
  }

  const evaluations = queries.map(query => ({
    query,
    quality: evaluateQueryQuality(query),
  }));

  const filtered = evaluations
    .filter(item => item.quality.score >= minQualityScore)
    .map(item => item.query);

  const removedCount = queries.length - filtered.length;

  if (removedCount > 0) {
    console.log(`[Query Optimizer] Removed ${removedCount} low-quality queries (score < ${minQualityScore})`);
  }

  return {
    filtered,
    evaluations,
    removedCount,
  };
}

/**
 * 쿼리 최적화 (전체 파이프라인)
 * @param {string[]} queries - 검색 쿼리 배열
 * @param {Object} options - 최적화 옵션
 * @returns {string[]} 최적화된 쿼리 배열
 */
export function optimizeQueries(queries, options = {}) {
  if (!queries || queries.length === 0) {
    return [];
  }

  const {
    removeDuplicates = true,
    similarityThreshold = 0.7,
    filterByQuality = true,
    minQualityScore = 40,
    maxQueries = 8,
  } = options;

  let optimized = [...queries];

  // 1. 중복 제거
  if (removeDuplicates) {
    optimized = removeDuplicateQueries(optimized, similarityThreshold);
  }

  // 2. 품질 필터링
  if (filterByQuality) {
    const qualityFilter = filterQueriesByQuality(optimized, minQualityScore);
    optimized = qualityFilter.filtered;
  }

  // 3. 최대 개수 제한
  if (optimized.length > maxQueries) {
    optimized = optimized.slice(0, maxQueries);
    console.log(`[Query Optimizer] Limited to ${maxQueries} queries`);
  }

  console.log(`[Query Optimizer] Optimized ${queries.length} queries to ${optimized.length}`);
  return optimized;
}

/**
 * 아이디어 텍스트에서 핵심 키워드 추출 (간단한 버전)
 * @param {string} ideaText - 아이디어 텍스트
 * @returns {string[]} 핵심 키워드 배열
 */
export function extractKeywords(ideaText) {
  if (!ideaText || typeof ideaText !== 'string') {
    return [];
  }

  // 간단한 키워드 추출 (실제로는 더 정교한 NLP가 필요할 수 있음)
  const stopWords = new Set([
    '이', '그', '저', '것', '수', '등', '및', '또는', '그리고', '에서', '으로', '를', '을', '의', '가', '이', '은', '는',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  ]);

  const words = ideaText
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word));

  // 빈도 기반으로 상위 키워드 추출
  const wordFreq = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

export default {
  removeDuplicateQueries,
  evaluateQueryQuality,
  filterQueriesByQuality,
  optimizeQueries,
  extractKeywords,
};
