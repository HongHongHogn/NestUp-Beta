/**
 * 스타트업 플랫폼 검색 모듈
 * Crunchbase, The VC 등의 스타트업 정보 플랫폼 검색
 */

import { cachedSearch } from './cache.js';
import { evaluateAndFilterResults } from './searchQuality.js';

/**
 * Crunchbase API를 사용한 스타트업 검색 (내부 함수)
 * @param {string} query - 검색 쿼리 (회사명 또는 관련 키워드 필요)
 * @param {number} maxResults - 최대 결과 수 (기본값 5)
 * @param {number} retryCount - 재시도 횟수
 * @returns {Promise<Object|null>} 검색 결과 또는 null
 */
async function searchCrunchbaseInternal(query, maxResults = 5, retryCount = 1) {
  try {
    const apiKey = process.env.CRUNCHBASE_API_KEY;
    if (!apiKey) {
      console.warn('[Crunchbase] CRUNCHBASE_API_KEY not found, skipping Crunchbase search');
      return null;
    }

    console.log(`[Crunchbase Search] Query: "${query}"`);

    // Crunchbase API v4 베타 버전을 사용
    // 참고: Crunchbase API는 제한적이며, API 키 형식에 따라 베타 버전일 수 있습니다
    const apiUrl = `https://api.crunchbase.com/v4/searches/organizations`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-cb-user-key': apiKey,
      },
      body: JSON.stringify({
        query: [
          {
            type: 'predicate',
            field_id: 'name',
            operator_id: 'contains',
            values: [query]
          }
        ],
        limit: maxResults,
        field_ids: ['name', 'short_description', 'website', 'categories', 'funding_total', 'num_funding_rounds']
      }),
    });

    if (!response.ok) {
      // API 키 오류나 할당량 초과인 경우 일반 웹 검색으로 폴백
      if (response.status === 401 || response.status === 403) {
        console.warn('[Crunchbase] API authentication failed, using web search fallback');
        return await searchCrunchbaseWeb(query, maxResults);
      }

      // 일시적 오류 시 재시도
      if ((response.status === 429 || response.status === 503) && retryCount > 0) {
        console.log(`[Crunchbase] Retrying... (${retryCount} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (2 - retryCount)));
        return searchCrunchbaseInternal(query, maxResults, retryCount - 1);
      }

      const errorText = await response.text();
      console.error(`[Crunchbase Search Error] HTTP ${response.status}:`, errorText);
      return await searchCrunchbaseWeb(query, maxResults);
    }

    const data = await response.json();

    if (!data || !data.entities || data.entities.length === 0) {
      console.log('[Crunchbase] No results found, trying web search fallback');
      return await searchCrunchbaseWeb(query, maxResults);
    }

    console.log(`[Crunchbase Search] Found ${data.entities.length} results`);

    // Crunchbase API 결과를 일반 형식으로 변환
    const rawResults = data.entities.slice(0, maxResults).map(entity => ({
      title: entity.properties?.name || 'Unknown',
      url: `https://www.crunchbase.com/organization/${entity.properties?.permalink || ''}`,
      content: entity.properties?.short_description || '',
      metadata: {
        categories: entity.properties?.categories || [],
        fundingTotal: entity.properties?.funding_total?.value || null,
        numFundingRounds: entity.properties?.num_funding_rounds || 0,
        website: entity.properties?.website || null,
      }
    }));

    // 품질 평가 및 필터링
    const qualityFilter = evaluateAndFilterResults(
      rawResults,
      query,
      { minScore: 30, maxResults, sortByScore: true }
    );

    return {
      query,
      source: 'crunchbase-api',
      results: qualityFilter.filtered,
      qualityStats: qualityFilter.qualityStats,
    };
  } catch (error) {
    console.error('[Crunchbase Search Error]:', error.message);

    // 네트워크 오류 시 재시도
    if (retryCount > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      console.log(`[Crunchbase] Retrying due to network error... (${retryCount} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (2 - retryCount)));
      return searchCrunchbaseInternal(query, maxResults, retryCount - 1);
    }

    // 오류 발생 시 웹 검색으로 폴백
    return await searchCrunchbaseWeb(query, maxResults);
  }
}

/**
 * Crunchbase API를 사용한 스타트업 검색 (캐싱 포함)
 * @param {string} query - 검색 쿼리
 * @param {number} maxResults - 최대 결과 수
 * @returns {Promise<Object|null>} 검색 결과 또는 null
 */
export async function searchCrunchbase(query, maxResults = 5) {
  return cachedSearch(query, (q) => searchCrunchbaseInternal(q, maxResults));
}

/**
 * Crunchbase 웹 검색 (API 키가 없을 때 사용)
 * Tavily API를 사용하여 Crunchbase 웹사이트에서 검색
 * @param {string} query - 검색 쿼리
 * @param {number} maxResults - 최대 결과 수
 * @returns {Promise<Object|null>} 검색 결과
 */
async function searchCrunchbaseWeb(query, maxResults = 5) {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      return null;
    }

    // Crunchbase 웹사이트에서 검색
    const searchQuery = `site:crunchbase.com ${query} startup company`;

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: searchQuery,
        max_results: maxResults,
        include_answer: true,
        search_depth: 'advanced',
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data || !data.results || data.results.length === 0) {
      return null;
    }

    console.log(`[Crunchbase Web Search] Found ${data.results.length} results via Tavily`);

    const rawResults = data.results.map(result => ({
      title: result.title || '',
      url: result.url || '',
      content: result.content || '',
    }));

    // 품질 평가 및 필터링
    const qualityFilter = evaluateAndFilterResults(
      rawResults,
      query,
      { minScore: 30, maxResults, sortByScore: true }
    );

    return {
      query,
      source: 'crunchbase-web',
      results: qualityFilter.filtered,
      answer: data.answer || null,
      qualityStats: qualityFilter.qualityStats,
    };
  } catch (error) {
    console.error('[Crunchbase Web Search Error]:', error.message);
    return null;
  }
}

/**
 * The VC 웹 검색
 * Tavily API를 사용하여 The VC 웹사이트에서 검색
 * @param {string} query - 검색 쿼리
 * @param {number} maxResults - 최대 결과 수 (기본값 5)
 * @returns {Promise<Object|null>} 검색 결과 또는 null
 */
export async function searchTheVC(query, maxResults = 5) {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      console.warn('[The VC] TAVILY_API_KEY not found, skipping The VC search');
      return null;
    }

    console.log(`[The VC Search] Query: "${query}"`);

    // The VC 웹사이트에서 검색
    // The VC는 여러 도메인을 사용할 수 있습니다 (thevc.kr, thevc.co.kr 등 여러 웹사이트 검색)
    const searchQuery = `site:thevc.kr OR site:thevc.co.kr ${query} 스타트업`;

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: searchQuery,
        max_results: maxResults,
        include_answer: true,
        search_depth: 'advanced',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[The VC Search Error] HTTP ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();

    if (!data || !data.results || data.results.length === 0) {
      console.log('[The VC] No results found');
      return null;
    }

    console.log(`[The VC Search] Found ${data.results.length} results`);

    const rawResults = data.results.map(result => ({
      title: result.title || '',
      url: result.url || '',
      content: result.content || '',
    }));

    // 품질 평가 및 필터링
    const qualityFilter = evaluateAndFilterResults(
      rawResults,
      query,
      { minScore: 30, maxResults, sortByScore: true }
    );

    return {
      query,
      source: 'thevc',
      results: qualityFilter.filtered,
      answer: data.answer || null,
      qualityStats: qualityFilter.qualityStats,
    };
  } catch (error) {
    console.error('[The VC Search Error]:', error.message);
    return null;
  }
}

/**
 * 스타트업 플랫폼 검색 (Crunchbase, The VC 등) 통합 검색
 * Crunchbase, The VC 등 여러 플랫폼에서 병렬 검색
 * @param {string} query - 검색 쿼리
 * @param {number} maxResultsPerSource - 소스당 최대 결과 수
 * @returns {Promise<Object[]>} 검색 결과 배열
 */
export async function searchStartupPlatforms(query, maxResultsPerSource = 5) {
  const searchPromises = [
    searchCrunchbase(query, maxResultsPerSource).catch(error => {
      console.error(`[Startup Platforms] Crunchbase error for "${query}":`, error.message);
      return null;
    }),
    searchTheVC(query, maxResultsPerSource).catch(error => {
      console.error(`[Startup Platforms] The VC error for "${query}":`, error.message);
      return null;
    }),
  ];

  try {
    const results = await Promise.all(searchPromises);
    // null 결과 및 빈 결과 필터링
    const validResults = results.filter(
      result => result !== null && result.results && result.results.length > 0
    );

    // 결과가 없을 때 폴백: The VC만 재시도 (일반적으로 더 안정적)
    if (validResults.length === 0) {
      console.warn('[Startup Platforms] All searches failed, trying The VC fallback...');
      const fallbackResult = await searchTheVC(query, maxResultsPerSource * 2).catch(() => null);
      if (fallbackResult && fallbackResult.results && fallbackResult.results.length > 0) {
        return [fallbackResult];
      }
    }

    return validResults;
  } catch (error) {
    console.error('[Startup Platforms Search Error]:', error.message);
    return [];
  }
}

/**
 * 여러 쿼리에 대해 스타트업 플랫폼 검색 실행
 * @param {string[]} queries - 검색 쿼리 배열
 * @param {number} maxResultsPerQuery - 쿼리당 최대 결과 수
 * @returns {Promise<Object[]>} 검색 결과 배열
 */
export async function searchStartupPlatformsMultiple(queries, maxResultsPerQuery = 5) {
  if (!queries || queries.length === 0) {
    return [];
  }

  // 모든 쿼리를 병렬로 검색
  const searchPromises = queries.map(query =>
    searchStartupPlatforms(query, maxResultsPerQuery).catch(error => {
      console.error(`[Startup Platforms Multiple] Error for "${query}":`, error.message);
      return [];
    })
  );

  try {
    const results = await Promise.all(searchPromises);
    // 결과를 평탄화 (배열의 배열을 단일 배열로)
    return results.flat().filter(result => result !== null && result.results && result.results.length > 0);
  } catch (error) {
    console.error('[Startup Platforms Multiple Search Error]:', error.message);
    return [];
  }
}

