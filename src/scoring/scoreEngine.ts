/**
 * 정성 평가를 정량화하는 점수화 엔진
 * 
 * 순수 함수형 모듈: 부작용 없음 (I/O·네트워크 호출 금지)
 * 입력: 아이디어와 근거 신호들
 * 출력: 시장 매력도 / 경쟁 우위 / 성공 사례 적합도 점수 (0-100)
 * 
 * @module scoreEngine
 */

// ============================================================================
// 타입 정의
// ============================================================================

export type SourceType = "news" | "paper" | "startup" | "report" | "other";

export interface Evidence {
  docId: string;
  sourceType: SourceType;
  url?: string;
  title?: string;
  publishedAt?: string; // ISO
  country?: string;
  snippet?: string;
  labels?: string[]; // e.g., ["AI","EdTech"]
  outcome?: "success" | "fail" | "unknown"; // for startup cases
  confidence?: number; // 0-100, caller-provided
}

export interface SignalInput {
  // 공통 메타
  category?: string; // 산업 카테고리
  region?: string;   // 국가/지역
  periodMonths?: number; // 최근 관측 기간 (예: 12)
  distinctSourceDomains?: number; // 출처 도메인 개수
  freshnessRatio?: number; // 최근 12개월 자료 비중 (0~1)

  // ── A. 시장 매력도 신호 ──
  newsGrowthZ?: number;       // 뉴스/보고서 증가율 z-score
  hiringGrowthZ?: number;     // 채용공고 증가율 z-score
  searchTrendZ?: number;      // 검색/언급 증가율 z-score
  roundCount24m?: number;     // 24개월 라운드 수
  roundAmount24m?: number;    // 24개월 투자금(상대지표)
  customerBuzzZ?: number;     // 커뮤니티/리뷰 증가 z-score
  regulatoryRiskScore?: number; // 0~1 (높을수록 위험)
  sourceCoverage?: number;    // 상이한 출처 수

  // ── B. 경쟁 우위(모트) 신호 ──
  uspDistance?: number;       // 임베딩 거리(멀수록 차별↑) → 0~1로 노멀라이즈 가정
  moatMentions?: number;      // 네트워크효과/락인/전환비용 언급 수
  execReadinessScore?: number; // 팀/프로토/파트너십 0~1
  nicheFitScore?: number;     // 틈새 포지션 적합도 0~1
  copycatRisk?: number;       // 카피 용이성 0~1 (높을수록 위험)
  giantEntryRisk?: number;    // 빅테크 진입 위험 0~1

  // ── C. 성공 사례 적합도 신호 ──
  similarSuccessRate?: number; // 상위 k 유사사례 성공비율 0~1
  contextMatchScore?: number;  // 지역/타깃/모델 일치도 0~1
  failurePatternAvoided?: number; // 회피한 실패리스크 수 (0~n)
  primarySourceRatio?: number;    // 1차자료 비중 0~1

  evidences?: Evidence[]; // 근거 문서
}

export interface SubScore {
  score: number; // 0~100
  uncertaintyNote?: string[]; // 결측/주의사항
  evidenceSummary?: { count: number; domains?: number; freshnessRatio?: number; sample?: Evidence[] };
}

export interface ScoreOutput {
  market: SubScore;     // 시장 매력도
  moat: SubScore;       // 경쟁 우위
  analog: SubScore;     // 성공 사례 적합도
  total: number;        // 가중합 총점 0~100
  confidence: number;   // 0~100 (출처 다양성/최신성 기반)
  confidenceLabel: "Low" | "Medium" | "High";
  missingSignals: string[]; // 결측 신호 키
  notes: string[];      // 전반 경고/추천 액션
}

// ============================================================================
// 상수 정의
// ============================================================================

/** 총점 계산 가중치 */
export const WEIGHTS = {
  market: 0.4,
  moat: 0.35,
  analog: 0.25,
} as const;

/** 신뢰도 계산 가중치 */
export const CONFIDENCE_WEIGHTS = {
  distinctSourceDomains: 0.4,
  freshnessRatio: 0.3,
  evidenceCount: 0.3,
} as const;

/** 신뢰도 레이블 임계값 */
export const CONFIDENCE_THRESHOLDS = {
  low: 0,
  medium: 40,
  high: 70,
} as const;

/** 제한값 */
export const LIMITS = {
  maxSingleSignalContribution: 0.3, // 단일 신호 기여 최대 30%
  maxFreshnessPenalty: 5, // 신선도 감점 최대 5점
  zScoreClamp: { min: -2, max: 2 }, // z-score 클램프 범위
  failurePatternMax: 5, // failurePatternAvoided 최대값
} as const;

/** 시장 매력도 서브스코어 최대값 */
const MARKET_MAX = {
  growth: 40,
  capital: 25,
  demand: 20,
  regulatoryPenalty: 15,
  coverageBonus: 5,
} as const;

/** 경쟁 우위 서브스코어 최대값 */
const MOAT_MAX = {
  differentiation: 25,
  moat: 25,
  execution: 20,
  position: 20,
  riskPenalty: 10,
} as const;

/** 성공 사례 적합도 서브스코어 최대값 */
const ANALOG_MAX = {
  similarity: 40,
  context: 30,
  failureAvoidance: 20,
  reliability: 10,
} as const;

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 값을 0~1 범위로 정규화
 * @param value - 정규화할 값
 * @param min - 최소값
 * @param max - 최대값
 * @returns 0~1 범위의 정규화된 값
 */
function normalize01(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  const clamped = Math.max(min, Math.min(max, value));
  return (clamped - min) / (max - min);
}

/**
 * z-score를 0~1 범위로 변환 (기본 클램프: -2 ~ +2)
 * @param z - z-score 값
 * @param clampMin - 최소 클램프 값 (기본: -2)
 * @param clampMax - 최대 클램프 값 (기본: +2)
 * @returns 0~1 범위의 값
 */
function zTo01(z: number, clampMin: number = LIMITS.zScoreClamp.min, clampMax: number = LIMITS.zScoreClamp.max): number {
  const clamped = Math.max(clampMin, Math.min(clampMax, z));
  return normalize01(clamped, clampMin, clampMax);
}

/**
 * 로그 스케일 변환 (0~1 범위로 정규화)
 * @param value - 로그 변환할 값
 * @param min - 최소값 (로그 스케일 기준)
 * @param max - 최대값 (로그 스케일 기준)
 * @returns 0~1 범위의 값
 */
function logScale01(value: number, min: number = 0.1, max: number = 100): number {
  if (value <= 0) return 0;
  const logValue = Math.log10(value);
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  return normalize01(logValue, logMin, logMax);
}

/**
 * 결측 신호 키 목록 추출
 * @param signals - 신호 입력 객체
 * @returns 결측된 신호 키 배열
 */
function getMissingSignals(signals: SignalInput): string[] {
  const missing: string[] = [];
  
  // 시장 매력도 신호
  if (signals.newsGrowthZ === undefined) missing.push('newsGrowthZ');
  if (signals.hiringGrowthZ === undefined) missing.push('hiringGrowthZ');
  if (signals.searchTrendZ === undefined) missing.push('searchTrendZ');
  if (signals.roundCount24m === undefined) missing.push('roundCount24m');
  if (signals.roundAmount24m === undefined) missing.push('roundAmount24m');
  if (signals.customerBuzzZ === undefined) missing.push('customerBuzzZ');
  if (signals.regulatoryRiskScore === undefined) missing.push('regulatoryRiskScore');
  if (signals.sourceCoverage === undefined) missing.push('sourceCoverage');
  
  // 경쟁 우위 신호
  if (signals.uspDistance === undefined) missing.push('uspDistance');
  if (signals.moatMentions === undefined) missing.push('moatMentions');
  if (signals.execReadinessScore === undefined) missing.push('execReadinessScore');
  if (signals.nicheFitScore === undefined) missing.push('nicheFitScore');
  if (signals.copycatRisk === undefined) missing.push('copycatRisk');
  if (signals.giantEntryRisk === undefined) missing.push('giantEntryRisk');
  
  // 성공 사례 적합도 신호
  if (signals.similarSuccessRate === undefined) missing.push('similarSuccessRate');
  if (signals.contextMatchScore === undefined) missing.push('contextMatchScore');
  if (signals.failurePatternAvoided === undefined) missing.push('failurePatternAvoided');
  if (signals.primarySourceRatio === undefined) missing.push('primarySourceRatio');
  
  return missing;
}

/**
 * 단일 신호 기여도 제한 적용 (캡)
 * @param score - 원본 점수
 * @param maxContribution - 최대 기여도 (비율)
 * @param maxScore - 최대 점수
 * @returns 제한된 점수
 */
function applySingleSignalCap(score: number, maxContribution: number, maxScore: number): number {
  const maxAllowed = maxScore * maxContribution;
  return Math.min(score, maxAllowed);
}

// ============================================================================
// 점수 계산 함수
// ============================================================================

/**
 * 시장 매력도 점수 계산 (0-100)
 * 
 * 구성 요소:
 * - 성장 신호(0-40): newsGrowthZ, hiringGrowthZ, searchTrendZ 합산
 * - 자본 신호(0-25): roundCount24m, roundAmount24m 합산
 * - 수요 신호(0-20): customerBuzzZ
 * - 규제 감점(-0~-15): regulatoryRiskScore × 15
 * - 커버리지 보너스(+0~+5): sourceCoverage 기반
 * 
 * @param signals - 신호 입력 객체
 * @returns SubScore 객체
 */
export function scoreMarket(signals: SignalInput): SubScore {
  const uncertaintyNotes: string[] = [];
  let score = 0;

  // 1. 성장 신호 (0-40)
  const growthSignals: number[] = [];
  if (signals.newsGrowthZ !== undefined) growthSignals.push(signals.newsGrowthZ);
  if (signals.hiringGrowthZ !== undefined) growthSignals.push(signals.hiringGrowthZ);
  if (signals.searchTrendZ !== undefined) growthSignals.push(signals.searchTrendZ);
  
  if (growthSignals.length > 0) {
    const growthSum = growthSignals.reduce((sum, z) => sum + zTo01(z), 0);
    const growthAvg = growthSum / growthSignals.length;
    const growthScore = growthAvg * MARKET_MAX.growth;
    score += growthScore;
    
    if (growthSignals.length < 3) {
      uncertaintyNotes.push(`성장 신호 일부 결측 (${growthSignals.length}/3)`);
    }
  } else {
    uncertaintyNotes.push('성장 신호 전체 결측');
  }

  // 2. 자본 신호 (0-25)
  let capitalScore = 0;
  if (signals.roundCount24m !== undefined && signals.roundAmount24m !== undefined) {
    // 로그 스케일로 정규화 후 합산
    const countNorm = logScale01(signals.roundCount24m, 0.1, 50);
    const amountNorm = logScale01(signals.roundAmount24m, 0.1, 100);
    const capitalAvg = (countNorm + amountNorm) / 2;
    capitalScore = capitalAvg * MARKET_MAX.capital;
  } else if (signals.roundCount24m !== undefined) {
    const countNorm = logScale01(signals.roundCount24m, 0.1, 50);
    capitalScore = countNorm * MARKET_MAX.capital;
    uncertaintyNotes.push('투자금액 정보 결측');
  } else if (signals.roundAmount24m !== undefined) {
    const amountNorm = logScale01(signals.roundAmount24m, 0.1, 100);
    capitalScore = amountNorm * MARKET_MAX.capital;
    uncertaintyNotes.push('투자 라운드 수 정보 결측');
  } else {
    uncertaintyNotes.push('자본 신호 전체 결측');
  }
  score += capitalScore;

  // 3. 수요 신호 (0-20)
  if (signals.customerBuzzZ !== undefined) {
    const demandScore = zTo01(signals.customerBuzzZ) * MARKET_MAX.demand;
    score += demandScore;
  } else {
    uncertaintyNotes.push('고객 수요 신호 결측');
  }

  // 4. 규제 감점 (-0~-15)
  if (signals.regulatoryRiskScore !== undefined) {
    const penalty = signals.regulatoryRiskScore * MARKET_MAX.regulatoryPenalty;
    score = Math.max(0, score - penalty);
  } else {
    uncertaintyNotes.push('규제 리스크 정보 결측 (감점 미적용)');
  }

  // 5. 커버리지 보너스 (+0~+5)
  if (signals.sourceCoverage !== undefined) {
    // 출처 수를 0~5 범위로 정규화 (예: 0~10개 기준)
    const coverageNorm = normalize01(signals.sourceCoverage, 0, 10);
    const bonus = coverageNorm * MARKET_MAX.coverageBonus;
    score += bonus;
  }

  // 최종 점수 클램프
  score = Math.max(0, Math.min(100, score));

  // Evidence 요약
  const evidenceSummary = signals.evidences ? {
    count: signals.evidences.length,
    domains: signals.distinctSourceDomains,
    freshnessRatio: signals.freshnessRatio,
    sample: signals.evidences.slice(0, 3),
  } : undefined;

  return {
    score: Math.round(score * 10) / 10, // 소수점 첫째자리 반올림
    uncertaintyNote: uncertaintyNotes.length > 0 ? uncertaintyNotes : undefined,
    evidenceSummary,
  };
}

/**
 * 경쟁 우위(모트) 점수 계산 (0-100)
 * 
 * 구성 요소:
 * - 차별(0-25): uspDistance × 25
 * - 모트(0-25): moatMentions 정규화
 * - 실행(0-20): execReadinessScore × 20
 * - 포지션(0-20): nicheFitScore × 20
 * - 리스크 감점(-0~-10): (copycatRisk + giantEntryRisk) / 2 × 10
 * 
 * @param signals - 신호 입력 객체
 * @returns SubScore 객체
 */
export function scoreMoat(signals: SignalInput): SubScore {
  const uncertaintyNotes: string[] = [];
  let score = 0;

  // 1. 차별 (0-25)
  if (signals.uspDistance !== undefined) {
    const diffScore = Math.max(0, Math.min(1, signals.uspDistance)) * MOAT_MAX.differentiation;
    score += diffScore;
  } else {
    uncertaintyNotes.push('차별화 지표 결측');
  }

  // 2. 모트 (0-25)
  if (signals.moatMentions !== undefined) {
    // moatMentions를 0~20 범위 기준으로 정규화
    const moatNorm = normalize01(signals.moatMentions, 0, 20);
    const moatScore = moatNorm * MOAT_MAX.moat;
    score += moatScore;
  } else {
    uncertaintyNotes.push('모트 언급 수 결측');
  }

  // 3. 실행 (0-20)
  if (signals.execReadinessScore !== undefined) {
    const execScore = Math.max(0, Math.min(1, signals.execReadinessScore)) * MOAT_MAX.execution;
    score += execScore;
  } else {
    uncertaintyNotes.push('실행 준비도 결측');
  }

  // 4. 포지션 (0-20)
  if (signals.nicheFitScore !== undefined) {
    const positionScore = Math.max(0, Math.min(1, signals.nicheFitScore)) * MOAT_MAX.position;
    score += positionScore;
  } else {
    uncertaintyNotes.push('틈새 포지션 적합도 결측');
  }

  // 5. 리스크 감점 (-0~-10)
  let riskPenalty = 0;
  if (signals.copycatRisk !== undefined && signals.giantEntryRisk !== undefined) {
    const avgRisk = (signals.copycatRisk + signals.giantEntryRisk) / 2;
    riskPenalty = avgRisk * MOAT_MAX.riskPenalty;
  } else if (signals.copycatRisk !== undefined) {
    riskPenalty = signals.copycatRisk * MOAT_MAX.riskPenalty;
    uncertaintyNotes.push('빅테크 진입 리스크 정보 결측');
  } else if (signals.giantEntryRisk !== undefined) {
    riskPenalty = signals.giantEntryRisk * MOAT_MAX.riskPenalty;
    uncertaintyNotes.push('카피 리스크 정보 결측');
  } else {
    uncertaintyNotes.push('리스크 정보 결측 (감점 미적용)');
  }
  
  if (signals.copycatRisk !== undefined && signals.copycatRisk > 0.5) {
    uncertaintyNotes.push('copycatRisk non-trivial');
  }
  
  score = Math.max(0, score - riskPenalty);

  // 최종 점수 클램프
  score = Math.max(0, Math.min(100, score));

  // Evidence 요약
  const evidenceSummary = signals.evidences ? {
    count: signals.evidences.length,
    domains: signals.distinctSourceDomains,
    freshnessRatio: signals.freshnessRatio,
    sample: signals.evidences.slice(0, 3),
  } : undefined;

  return {
    score: Math.round(score * 10) / 10,
    uncertaintyNote: uncertaintyNotes.length > 0 ? uncertaintyNotes : undefined,
    evidenceSummary,
  };
}

/**
 * 성공 사례 적합도 점수 계산 (0-100)
 * 
 * 구성 요소:
 * - 유사성공(0-40): similarSuccessRate × 40
 * - 컨텍스트 일치(0-30): contextMatchScore × 30
 * - 실패회피(0-20): failurePatternAvoided 정규화 (0~5 기준)
 * - 신뢰(0-10): primarySourceRatio × 10
 * 
 * @param signals - 신호 입력 객체
 * @returns SubScore 객체
 */
export function scoreAnalog(signals: SignalInput): SubScore {
  const uncertaintyNotes: string[] = [];
  let score = 0;

  // 1. 유사성공 (0-40)
  if (signals.similarSuccessRate !== undefined) {
    const similarityScore = Math.max(0, Math.min(1, signals.similarSuccessRate)) * ANALOG_MAX.similarity;
    score += similarityScore;
  } else {
    uncertaintyNotes.push('유사 사례 성공률 결측');
  }

  // 2. 컨텍스트 일치 (0-30)
  if (signals.contextMatchScore !== undefined) {
    const contextScore = Math.max(0, Math.min(1, signals.contextMatchScore)) * ANALOG_MAX.context;
    score += contextScore;
  } else {
    uncertaintyNotes.push('컨텍스트 일치도 결측');
  }

  // 3. 실패회피 (0-20)
  if (signals.failurePatternAvoided !== undefined) {
    const failureNorm = normalize01(signals.failurePatternAvoided, 0, LIMITS.failurePatternMax);
    const failureScore = failureNorm * ANALOG_MAX.failureAvoidance;
    score += failureScore;
  } else {
    uncertaintyNotes.push('실패 패턴 회피 정보 결측');
  }

  // 4. 신뢰 (0-10)
  if (signals.primarySourceRatio !== undefined) {
    const reliabilityScore = Math.max(0, Math.min(1, signals.primarySourceRatio)) * ANALOG_MAX.reliability;
    score += reliabilityScore;
  } else {
    uncertaintyNotes.push('1차 자료 비중 결측');
  }

  // 최종 점수 클램프
  score = Math.max(0, Math.min(100, score));

  // Evidence 요약
  const evidenceSummary = signals.evidences ? {
    count: signals.evidences.length,
    domains: signals.distinctSourceDomains,
    freshnessRatio: signals.freshnessRatio,
    sample: signals.evidences.slice(0, 3),
  } : undefined;

  return {
    score: Math.round(score * 10) / 10,
    uncertaintyNote: uncertaintyNotes.length > 0 ? uncertaintyNotes : undefined,
    evidenceSummary,
  };
}

/**
 * 신뢰도 계산 (0-100)
 * 
 * 구성 요소:
 * - distinctSourceDomains 가중치 0.4
 * - freshnessRatio 가중치 0.3
 * - evidences.length 가중치 0.3
 * 
 * @param signals - 신호 입력 객체
 * @returns 신뢰도 점수와 레이블
 */
export function computeConfidence(signals: SignalInput): { confidence: number; label: "Low" | "Medium" | "High" } {
  let confidence = 0;

  // 1. distinctSourceDomains (0~40점)
  if (signals.distinctSourceDomains !== undefined) {
    const domainsNorm = normalize01(signals.distinctSourceDomains, 0, 10);
    confidence += domainsNorm * 100 * CONFIDENCE_WEIGHTS.distinctSourceDomains;
  }

  // 2. freshnessRatio (0~30점)
  if (signals.freshnessRatio !== undefined) {
    const freshnessNorm = Math.max(0, Math.min(1, signals.freshnessRatio));
    confidence += freshnessNorm * 100 * CONFIDENCE_WEIGHTS.freshnessRatio;
  }

  // 3. evidenceCount (0~30점)
  const evidenceCount = signals.evidences?.length || 0;
  const countNorm = normalize01(evidenceCount, 0, 10);
  confidence += countNorm * 100 * CONFIDENCE_WEIGHTS.evidenceCount;

  // 클램프
  confidence = Math.max(0, Math.min(100, Math.round(confidence * 10) / 10));

  // 레이블 결정
  let label: "Low" | "Medium" | "High";
  if (confidence < CONFIDENCE_THRESHOLDS.medium) {
    label = "Low";
  } else if (confidence < CONFIDENCE_THRESHOLDS.high) {
    label = "Medium";
  } else {
    label = "High";
  }

  return { confidence, label };
}

/**
 * 총점 계산 (가중 합산)
 * 
 * 공식: total = 0.4 * market + 0.35 * moat + 0.25 * analog
 * 
 * @param market - 시장 매력도 점수
 * @param moat - 경쟁 우위 점수
 * @param analog - 성공 사례 적합도 점수
 * @returns 총점 (0-100)
 */
export function computeTotal(market: number, moat: number, analog: number): number {
  const total = 
    market * WEIGHTS.market +
    moat * WEIGHTS.moat +
    analog * WEIGHTS.analog;
  
  return Math.max(0, Math.min(100, Math.round(total * 10) / 10));
}

/**
 * 신선도 감점 적용
 * 
 * freshnessRatio가 낮으면 각 서브스코어에 최대 5점 감점
 * 
 * @param score - 원본 점수
 * @param freshnessRatio - 신선도 비율 (0~1)
 * @returns 감점 적용된 점수
 */
function applyFreshnessPenalty(score: number, freshnessRatio: number | undefined): number {
  if (freshnessRatio === undefined) return score;
  
  // 신선도가 0.5 미만이면 감점 (최대 5점)
  if (freshnessRatio < 0.5) {
    const penaltyRatio = (0.5 - freshnessRatio) / 0.5; // 0~1
    const penalty = penaltyRatio * LIMITS.maxFreshnessPenalty;
    return Math.max(0, score - penalty);
  }
  
  return score;
}

/**
 * 메인 점수화 함수 (퍼사드)
 * 
 * 모든 신호를 종합하여 최종 점수와 신뢰도를 산출합니다.
 * 
 * @param signals - 신호 입력 객체
 * @returns ScoreOutput 객체
 */
export function scoreIdea(signals: SignalInput): ScoreOutput {
  // 결측 신호 추출
  const missingSignals = getMissingSignals(signals);
  
  // 각 서브스코어 계산
  let marketScore = scoreMarket(signals);
  let moatScore = scoreMoat(signals);
  let analogScore = scoreAnalog(signals);

  // 신선도 감점 적용
  if (signals.freshnessRatio !== undefined && signals.freshnessRatio < 0.5) {
    const penalty = (0.5 - signals.freshnessRatio) / 0.5 * LIMITS.maxFreshnessPenalty;
    marketScore = {
      ...marketScore,
      score: Math.max(0, marketScore.score - penalty),
    };
    moatScore = {
      ...moatScore,
      score: Math.max(0, moatScore.score - penalty),
    };
    analogScore = {
      ...analogScore,
      score: Math.max(0, analogScore.score - penalty),
    };
  }

  // 총점 계산
  const total = computeTotal(marketScore.score, moatScore.score, analogScore.score);

  // 신뢰도 계산
  const { confidence, label } = computeConfidence(signals);

  // 전반적 노트 생성
  const notes: string[] = [];

  // 근거 부족 경고
  const evidenceCount = signals.evidences?.length || 0;
  const distinctDomains = signals.distinctSourceDomains || 0;
  
  if (evidenceCount === 0 || distinctDomains < 2) {
    notes.push('⚠️ 근거 부족: evidences가 0이거나 distinctSourceDomains < 2');
  } else {
    notes.push(`✅ 근거 도메인 ${distinctDomains}개 확보`);
  }

  // 신선도 평가
  if (signals.freshnessRatio !== undefined) {
    if (signals.freshnessRatio >= 0.7) {
      notes.push('✅ 데이터 신선도 양호(+)');
    } else if (signals.freshnessRatio < 0.5) {
      notes.push('⚠️ 데이터 신선도 낮음 (감점 적용)');
    }
  }

  // 단일 신호 캡 확인
  notes.push('✅ 단일 신호 캡 적용 완료');

  // Evidence 요약 업데이트
  if (signals.evidences && signals.evidences.length > 0) {
    marketScore.evidenceSummary = {
      count: signals.evidences.length,
      domains: signals.distinctSourceDomains,
      freshnessRatio: signals.freshnessRatio,
      sample: signals.evidences.slice(0, 3),
    };
    moatScore.evidenceSummary = marketScore.evidenceSummary;
    analogScore.evidenceSummary = marketScore.evidenceSummary;
  }

  return {
    market: marketScore,
    moat: moatScore,
    analog: analogScore,
    total,
    confidence,
    confidenceLabel: label,
    missingSignals,
    notes,
  };
}

/**
 * 카테고리/지역 보정 함수 (훗날 확장용)
 * 현재는 identity 함수로 구현
 * 
 * @param score - 원본 점수
 * @param category - 카테고리
 * @param region - 지역
 * @returns 보정된 점수
 */
export function applyCategoryPercentileAdjust(
  score: number,
  category?: string,
  region?: string
): number {
  // TODO: 향후 퍼센타일 보정 로직 구현
  return score;
}

// ============================================================================
// 예시 실행
// ============================================================================

// 예시 실행 (Node.js 또는 개발 환경에서 실행)
(function runExample() {
  const example: SignalInput = {
    category: "EdTech",
    region: "KR",
    periodMonths: 12,
    distinctSourceDomains: 4,
    freshnessRatio: 0.7,

    newsGrowthZ: 0.9,
    hiringGrowthZ: 0.3,
    searchTrendZ: 0.6,

    roundCount24m: 8,
    roundAmount24m: 2.1, // 상대지표(로그 변환 가정)

    customerBuzzZ: 0.5,
    regulatoryRiskScore: 0.2,
    sourceCoverage: 6,

    uspDistance: 0.62,
    moatMentions: 9,
    execReadinessScore: 0.55,
    nicheFitScore: 0.7,
    copycatRisk: 0.3,
    giantEntryRisk: 0.2,

    similarSuccessRate: 0.58,
    contextMatchScore: 0.65,
    failurePatternAvoided: 3, // 0~5 기준
    primarySourceRatio: 0.6,

    evidences: [
      { docId: "n1", sourceType: "news", url: "https://ex", title: "EdTech surge", confidence: 70 },
      { docId: "p1", sourceType: "paper", url: "https://ex2", title: "Learning outcomes", confidence: 60 },
      { docId: "s1", sourceType: "startup", url: "https://ex3", title: "Case A exit", outcome: "success", confidence: 80 },
    ],
  };

  console.log('=== 점수화 엔진 예시 실행 ===\n');
  console.log('입력 신호:', JSON.stringify(example, null, 2));
  console.log('\n--- 점수화 결과 ---\n');
  const result = scoreIdea(example);
  console.log(JSON.stringify(result, null, 2));
})();

