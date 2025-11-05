/**
 * Tavily API를 사용한 웹 검색 모듈
 * RAG 파이프라인의 웹 검색 부분을 담당
 * Tavily REST API 직접 호출 방식
 */

import { cachedSearch } from './cache.js';
import { evaluateAndFilterResults } from './searchQuality.js';

const TAVILY_API_URL = 'https://api.tavily.com/search';

/**
 * 단일 검색 쿼리 실행 (내부 함수, 캐싱 없음)
 * @param {string} query - 검색 쿼리
 * @param {number} maxResults - 최대 결과 수 (기본값 5)
 * @param {number} retryCount - 재시도 횟수 (기본값 2)
 * @returns {Promise<Object|null>} 검색 결과 또는 null
 */
async function searchWebInternal(query, maxResults = 5, retryCount = 2) {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      console.warn('TAVILY_API_KEY not found in environment variables');
      return null;
    }

    console.log(`[Tavily Search] Query: "${query}"`);

    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        max_results: maxResults,
        include_answer: true, // AI 요약 포함
        include_images: false, // 이미지 제외
        include_raw_content: false,
        search_depth: 'advanced', // 고급 검색
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Tavily Search Error] HTTP ${response.status}:`, errorText);

      // 재시도 로직 (429, 503 등 일시적 오류)
      if ((response.status === 429 || response.status === 503) && retryCount > 0) {
        console.log(`[Tavily Search] Retrying... (${retryCount} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retryCount))); // 지수 백오프
        return searchWebInternal(query, maxResults, retryCount - 1);
      }

      return null;
    }

    const data = await response.json();

    if (!data || !data.results) {
      console.warn('Tavily search returned empty results');
      return null;
    }

    console.log(`[Tavily Search] Found ${data.results.length} results`);

    // 품질 평가 및 필터링
    const qualityFilter = evaluateAndFilterResults(
      data.results || [],
      query,
      { minScore: 25, maxResults, sortByScore: true }
    );

    return {
      query,
      results: qualityFilter.filtered,
      answer: data.answer || null, // Tavily의 AI 요약 (있는 경우)
      qualityStats: qualityFilter.qualityStats,
    };
  } catch (error) {
    console.error('[Tavily Search Error]:', error.message);

    // 네트워크 오류 시 재시도
    if (retryCount > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      console.log(`[Tavily Search] Retrying due to network error... (${retryCount} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retryCount)));
      return searchWebInternal(query, maxResults, retryCount - 1);
    }

    return null;
  }
}

/**
 * 단일 검색 쿼리 실행 (캐싱 포함)
 * @param {string} query - 검색 쿼리
 * @param {number} maxResults - 최대 결과 수 (기본값 5)
 * @returns {Promise<Object|null>} 검색 결과 또는 null
 */
export async function searchWeb(query, maxResults = 5) {
  return cachedSearch(query, (q) => searchWebInternal(q, maxResults));
}

/**
 * 여러 검색 쿼리를 병렬로 실행
 * @param {string[]} queries - 검색 쿼리 배열
 * @param {number} maxResultsPerQuery - 쿼리당 최대 결과 수
 * @returns {Promise<Object[]>} 검색 결과 배열
 */
export async function searchMultiple(queries, maxResultsPerQuery = 5) {
  if (!queries || queries.length === 0) {
    return [];
  }

  // 병렬 검색 (모든 쿼리를 동시에 실행)
  const searchPromises = queries.map(query =>
    searchWeb(query, maxResultsPerQuery).catch(error => {
      console.error(`[Tavily Multiple Search] Error for query "${query}":`, error.message);
      return null;
    })
  );

  try {
    const results = await Promise.all(searchPromises);
    // null 결과 및 빈 결과 필터링
    const validResults = results.filter(result => result !== null && result.results && result.results.length > 0);

    // 결과가 없을 때 폴백 로직
    if (validResults.length === 0 && queries.length > 0) {
      console.warn('[Tavily Multiple Search] All searches failed, trying fallback...');
      // 가장 긴 쿼리로 재시도 (일반적으로 더 구체적)
      const longestQuery = queries.reduce((a, b) => a.length > b.length ? a : b);
      const fallbackResult = await searchWeb(longestQuery, maxResultsPerQuery * 2);
      if (fallbackResult && fallbackResult.results && fallbackResult.results.length > 0) {
        return [fallbackResult];
      }
    }

    return validResults;
  } catch (error) {
    console.error('[Tavily Multiple Search Error]:', error.message);
    return [];
  }
}

/**
 * 검색 결과를 컨텍스트 텍스트로 변환
 * RAG의 Augment 단계에서 사용
 * @param {Object[]} searchResults - searchMultiple의 결과 배열
 * @param {number} maxContextLength - 최대 컨텍스트 길이 (문자 수)
 * @returns {string} 컨텍스트 텍스트
 */
export function formatSearchResultsAsContext(searchResults, maxContextLength = 8000) {
  if (!searchResults || searchResults.length === 0) {
    return '';
  }

  let context = '';
  const sections = [];

  for (const searchResult of searchResults) {
    if (!searchResult.results || searchResult.results.length === 0) {
      continue;
    }

    // 쿼리별로 섹션 시작
    sections.push(`\n## 검색 쿼리: "${searchResult.query}"\n`);

    // 각 검색 결과 추가
    for (const result of searchResult.results) {
      const title = result.title || '제목 없음';
      const url = result.url || '';
      const content = result.content || '';

      // 내용이 너무 길면 잘라내기
      const truncatedContent = content.length > 500
        ? content.substring(0, 500) + '...'
        : content;

      sections.push(`### ${title}`);
      if (url) sections.push(`URL: ${url}`);
      sections.push(`내용: ${truncatedContent}\n`);
    }

    // Tavily AI 요약이 있으면 추가
    if (searchResult.answer) {
      sections.push(`**AI 요약**: ${searchResult.answer}\n`);
    }
  }

  context = sections.join('\n');

  // 컨텍스트가 너무 길면 잘라내기
  if (context.length > maxContextLength) {
    context = context.substring(0, maxContextLength) + '\n\n[...내용 일부 생략...]';
  }

  return context;
}

