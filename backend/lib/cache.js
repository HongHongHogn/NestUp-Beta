/**
 * 검색 결과 캐싱 모듈
 * 중복 검색을 방지하여 API 비용을 절감하고 응답 시간을 개선
 */

// 간단한 메모리 기반 LRU 캐시 구현
class LRUCache {
  constructor(maxSize = 100, ttl = 3600000) {
    // maxSize: 최대 캐시 항목 수 (기본 100개)
    // ttl: Time To Live (기본 1시간 = 3600000ms)
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.accessOrder = new Map();
    this.accessCounter = 0;
  }

  /**
   * 캐시 키 생성 (쿼리 문자열을 정규화하여 생성)
   */
  generateKey(query) {
    if (!query || typeof query !== 'string') {
      return null;
    }
    // 공백 제거, 소문자 변환, 특수문자 정규화
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s가-힣]/g, '');
  }

  /**
   * 캐시에서 값 가져오기
   */
  get(query) {
    const key = this.generateKey(query);
    if (!key) return null;

    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // TTL 확인
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // 접근 순서 업데이트 (LRU)
    this.accessCounter++;
    this.accessOrder.set(key, this.accessCounter);

    return item.value;
  }

  /**
   * 캐시에 값 저장
   */
  set(query, value) {
    const key = this.generateKey(query);
    if (!key) return;

    // 캐시 크기 제한 확인 및 LRU 항목 제거
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.accessCounter++;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    });
    this.accessOrder.set(key, this.accessCounter);
  }

  /**
   * LRU 항목 제거 (가장 오래 전에 접근된 항목)
   */
  evictLRU() {
    if (this.accessOrder.size === 0) return;

    let oldestKey = null;
    let oldestAccess = Infinity;

    for (const [key, access] of this.accessOrder.entries()) {
      if (access < oldestAccess) {
        oldestAccess = access;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  /**
   * 캐시 비우기
   */
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  /**
   * 만료된 항목 정리
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
      }
    }
  }

  /**
   * 캐시 통계
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}

// 전역 캐시 인스턴스 생성
// 검색 결과 캐시 (TTL: 1시간)
const searchCache = new LRUCache(100, 3600000);

// 주기적으로 만료된 항목 정리 (10분마다)
// Node.js 환경에서만 실행되도록 확인
let cleanupInterval = null;

function startCleanupInterval() {
  if (cleanupInterval) return; // 이미 시작됨
  
  // 서버 시작 후 첫 정리는 1분 후, 이후 10분마다
  setTimeout(() => {
    cleanupInterval = setInterval(() => {
      searchCache.cleanup();
    }, 600000); // 10분
    
    // 프로세스 종료 시 인터벌 정리
    if (typeof process !== 'undefined' && process.on) {
      const cleanup = () => {
        if (cleanupInterval) {
          clearInterval(cleanupInterval);
          cleanupInterval = null;
        }
      };
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    }
  }, 60000); // 1분 후 시작
}

// Node.js 환경인지 확인 후 시작
if (typeof global !== 'undefined' && typeof setInterval !== 'undefined' && typeof process !== 'undefined') {
  startCleanupInterval();
}

/**
 * 검색 결과 캐싱 래퍼
 * @param {string} query - 검색 쿼리
 * @param {Function} searchFn - 검색 함수
 * @returns {Promise<Object|null>} 검색 결과
 */
export async function cachedSearch(query, searchFn) {
  if (!query || typeof searchFn !== 'function') {
    return null;
  }

  // 캐시 확인
  const cached = searchCache.get(query);
  if (cached !== null) {
    console.log(`[Cache] Hit for query: "${query}"`);
    return cached;
  }

  // 캐시 미스 - 검색 실행
  console.log(`[Cache] Miss for query: "${query}"`);
  try {
    const result = await searchFn(query);
    if (result !== null) {
      searchCache.set(query, result);
    }
    return result;
  } catch (error) {
    console.error('[Cache] Search error:', error.message);
    return null;
  }
}

/**
 * 여러 쿼리 검색 결과 캐싱
 * @param {string[]} queries - 검색 쿼리 배열
 * @param {Function} searchFn - 검색 함수
 * @returns {Promise<Object[]>} 검색 결과 배열
 */
export async function cachedSearchMultiple(queries, searchFn) {
  if (!queries || queries.length === 0) {
    return [];
  }

  const results = await Promise.all(
    queries.map(query => cachedSearch(query, searchFn))
  );

  return results.filter(result => result !== null);
}

/**
 * 캐시 통계 조회
 */
export function getCacheStats() {
  return searchCache.getStats();
}

/**
 * 캐시 비우기 (테스트/디버깅용)
 */
export function clearCache() {
  searchCache.clear();
  console.log('[Cache] Cache cleared');
}

export default {
  cachedSearch,
  cachedSearchMultiple,
  getCacheStats,
  clearCache,
};
