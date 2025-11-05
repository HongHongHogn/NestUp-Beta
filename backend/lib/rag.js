/**
 * RAG (Retrieval-Augmented Generation) 파이프라인
 * PRD에 따라 최신 정보를 검색하고 AI 컨텍스트에 포함
 *
 * 주요 과정:
 * 1. Query Generation: 아이디어를 검색 쿼리로 변환
 * 2. Retrieve: Tavily API로 웹 검색
 * 3. Augment: 검색 결과를 컨텍스트로 구성
 * 4. Generate: 컨텍스트를 AI 프롬프트에 포함하여 결과 생성
 */

import OpenAI from 'openai';
import { searchMultiple, formatSearchResultsAsContext } from './search.js';
import { searchStartupPlatformsMultiple } from './startupSearch.js';
import { optimizeQueries } from './searchOptimizer.js';
import { evaluateSearchResultSets } from './searchQuality.js';

/**
 * 아이디어를 분석하여 검색 쿼리 생성
 * @param {string} ideaText - 사용자의 아이디어 텍스트
 * @returns {Promise<string[]>} 검색 쿼리 배열
 */
async function generateSearchQueries(ideaText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not found, using simple query generation');
    // OpenAI가 없으면 기본 쿼리 생성
    return generateSimpleQueries(ideaText);
  }

  const client = new OpenAI({ apiKey: apiKey.trim().replace(/^["']|["']$/g, '') });

  try {
    const prompt = `다음과 같은 비즈니스 아이디어를 바탕으로 시장을 검색할 검색 쿼리 5~8개를 생성해주세요.

아이디어:
${ideaText}

각 쿼리는 다음과 같은 목적을 가져야 합니다:
1. 유사한 스타트업/기업이나 경쟁사(예: "[아이디어] 유사 기업", "[아이디어] 경쟁사")
2. 시장 규모 정보 및 성장률(예: "[아이디어] 시장 규모", "[아이디어] 시장 성장률")
3. 경쟁자 분석 (예: "[아이디어] 경쟁사", "[아이디어] 경쟁 시장 분석")
4. 실패 사례 (예: "[유사 아이디어] 실패", "[유사 아이디어] 파산")
5. 기술적 또는 제도적 장벽 (해당하는 경우)
6. 트렌드 및 인사이트
7. Crunchbase, The VC 등 스타트업 플랫폼에서 검색할 쿼리 (회사명, 산업 분야 등 필요)

응답은 JSON 배열 형식으로만 반환해주세요:
["쿼리1", "쿼리2", "쿼리3", ...]

검색엔진에서 효율적으로 검색할 수 있는 검색어만 포함해주세요.`;

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a search query generator. Return ONLY a JSON array of search queries, no additional text.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices?.[0]?.message?.content || '';

    // JSON 파싱
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      return generateSimpleQueries(ideaText);
    }

    jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonText);

    // queries 키가 있으면 사용, 없으면 전체를 배열로 변환
    let queries = parsed.queries || parsed;
    if (!Array.isArray(queries)) {
      queries = Object.values(parsed);
    }

    // 배열이 아니거나 비어있으면 기본 쿼리 생성
    if (!Array.isArray(queries) || queries.length === 0) {
      return generateSimpleQueries(ideaText);
    }

    // 쿼리 정리 (null, 빈 문자열 제거, 중복 제거)
    queries = queries
      .filter(q => q && typeof q === 'string' && q.trim().length > 0)
      .map(q => q.trim())
      .filter((q, index, self) => self.indexOf(q) === index) // 중복 제거
      .slice(0, 8); // 최대 8개

    console.log(`[RAG] Generated ${queries.length} search queries`);

    // 쿼리 최적화 적용
    const optimizedQueries = optimizeQueries(queries, {
      removeDuplicates: true,
      similarityThreshold: 0.7,
      filterByQuality: true,
      minQualityScore: 40,
      maxQueries: 8,
    });

    console.log(`[RAG] Optimized to ${optimizedQueries.length} queries`);
    return optimizedQueries;
  } catch (error) {
    console.error('[RAG Query Generation Error]:', error.message);
    return generateSimpleQueries(ideaText);
  }
}

/**
 * OpenAI 없이 기본 쿼리 생성
 * @param {string} ideaText - 사용자의 아이디어
 * @returns {string[]} 기본 검색 쿼리 배열
 */
function generateSimpleQueries(ideaText) {
  // 아이디어에서 핵심 키워드 추출 (간단한 방법)
  const keywords = ideaText
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 5);

  const queries = [
    `${keywords.join(' ')} 유사 기업`,
    `${keywords.join(' ')} 시장 규모`,
    `${keywords.join(' ')} 경쟁사`,
    `${keywords.join(' ')} 실패 사례`,
    `${keywords.join(' ')} 성장률`,
  ];

  console.log(`[RAG] Using simple query generation: ${queries.length} queries`);
  return queries;
}

/**
 * RAG 파이프라인 실행
 * @param {string} ideaText - 사용자의 아이디어 텍스트
 * @returns {Promise<{queries: string[], searchResults: Object[], context: string}>}
 */
export async function executeRAGPipeline(ideaText) {
  console.log('[RAG] Starting RAG pipeline...');

  // Step 1: Query Generation
  console.log('[RAG] Step 1: Generating search queries...');
  const queries = await generateSearchQueries(ideaText);

  if (!queries || queries.length === 0) {
    console.warn('[RAG] No queries generated, skipping search');
    return {
      queries: [],
      searchResults: [],
      context: '',
    };
  }

  // Step 2: Retrieve - 웹 검색 실행 (일반 웹 검색 + 스타트업 플랫폼 검색)
  console.log(`[RAG] Step 2: Searching web with ${queries.length} queries...`);

  // 일반 웹 검색과 스타트업 플랫폼 검색을 병렬로 실행
  const [generalSearchResults, startupSearchResults] = await Promise.all([
    searchMultiple(queries, 5), // 쿼리당 최대 5개 결과
    searchStartupPlatformsMultiple(queries, 5), // 스타트업 플랫폼 검색
  ]);

  // 검색 결과 세트 병합 (평탄화 전)
  const allSearchResultSets = [
    ...(generalSearchResults || []),
    ...(startupSearchResults || []),
  ];

  console.log(`[RAG] Found ${generalSearchResults?.length || 0} general search result sets and ${startupSearchResults?.length || 0} startup platform result sets`);

  // 검색 결과 품질 평가 (세트 단위로 평가)
  let qualityStats = {};
  try {
    qualityStats = evaluateSearchResultSets(allSearchResultSets);
    console.log(`[RAG] Search quality stats:`, qualityStats);
  } catch (error) {
    console.error('[RAG] Search quality evaluation error:', error.message);
    // 품질 평가 실패해도 계속 진행
  }

  // 검색 결과 평탄화 (컨텍스트 생성용)
  const allSearchResults = allSearchResultSets.flatMap(resultSet => {
    if (resultSet && resultSet.results && Array.isArray(resultSet.results)) {
      return resultSet.results;
    }
    return [];
  });

  // Step 3: Augment - 검색 결과를 컨텍스트로 변환
  console.log('[RAG] Step 3: Formatting search results as context...');
  const context = formatSearchResultsAsContext(allSearchResults, 8000);

  console.log(`[RAG] Pipeline complete. Context length: ${context.length} characters`);

  return {
    queries,
    searchResults: allSearchResults,
    context,
    qualityStats,
  };
}

