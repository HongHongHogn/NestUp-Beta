import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { ideaValidateSchema } from '../schemas/validate.js';
import prisma from '../lib/prisma.js';
import { analyzeIdeaWithAI } from '../lib/ai.js';
import { executeRAGPipeline } from '../lib/rag.js';
import { convertToSignalInput } from '../lib/scoreAdapter.js';
import { scoreIdea } from '../lib/scoreEngine.js';

const router = express.Router();

// 아이디어 검증 요청
router.post('/', requireAuth, validateRequest(ideaValidateSchema), async (req, res) => {
  try {
    const { idea, description } = req.body;

    const userId = req.user.id;
    const ideaText = description || idea;
    
    console.log('Starting AI analysis with RAG and scoring engine...');
    
    // 1. RAG 파이프라인 실행
    console.log('[Validate] Running RAG pipeline...');
    const ragResult = await executeRAGPipeline(ideaText);
    
    // 2. AI 분석 실행 (RAG 컨텍스트 포함)
    console.log('[Validate] Running AI analysis...');
    const ai = await analyzeIdeaWithAI(ideaText);
    
    if (!ai) {
      console.warn('AI analysis returned null - using default values. Check OPENAI_API_KEY and API logs.');
    } else {
      console.log('AI analysis successful:', { 
        score: ai.score, 
        marketScore: ai.marketScore,
        hasAnalysis: !!ai.analysis,
        hasPrecedents: !!ai.precedents,
        hasMarketDemand: !!ai.marketDemand
      });
    }
    
    // 3. 스코어링 엔진 실행
    console.log('[Validate] Running scoring engine...');
    let scoringResult = null;
    try {
      const signalInput = convertToSignalInput({
        ideaText,
        ragResult,
        aiAnalysis: ai,
        options: {
          region: 'KR',
          periodMonths: 12,
        },
      });
      
      scoringResult = scoreIdea(signalInput);
      console.log('[Validate] Scoring engine result:', {
        total: scoringResult.total,
        market: scoringResult.market.score,
        moat: scoringResult.moat.score,
        analog: scoringResult.analog.score,
        confidence: scoringResult.confidence,
        confidenceLabel: scoringResult.confidenceLabel,
      });
    } catch (scoringError) {
      console.error('[Validate] Scoring engine error:', scoringError);
      // 스코어링 엔진 실패해도 계속 진행
    }
    
    // analysisJson에 모든 분석 데이터 포함
    const analysisJson = {
      ...(ai?.analysis || {
        strengths: ['명확한 페인포인트', '충분한 TAM'],
        weaknesses: ['데이터 수집 비용'],
        opportunities: ['규모의 경제', '네트워크 효과'],
        threats: ['빅테크 경쟁'],
        summary: 'AI 분석을 사용할 수 없어 기본 분석 결과를 제공합니다. OpenAI API 키를 확인해주세요.'
      }),
      // RAG 기반 추가 데이터
      precedents: ai?.precedents || [],
      marketDemand: ai?.marketDemand || {
        size: '-',
        growth: '-',
        competitionLevel: '-',
        barriers: []
      },
      recommendations: ai?.recommendations || [],
      targetCustomers: ai?.targetCustomers || [],
      // 스코어링 엔진 결과 추가
      scoringEngine: scoringResult ? {
        market: scoringResult.market.score,
        moat: scoringResult.moat.score,
        analog: scoringResult.analog.score,
        total: scoringResult.total,
        confidence: scoringResult.confidence,
        confidenceLabel: scoringResult.confidenceLabel,
        missingSignals: scoringResult.missingSignals,
        notes: scoringResult.notes,
      } : null,
    };

    // 시장 데이터 추출 (analysisJson과 별도로 저장 가능)
    const marketSize = ai?.marketDemand?.size || '-';
    const marketGrowth = ai?.marketDemand?.growth || '-';
    const competitionLevel = ai?.marketDemand?.competitionLevel || '-';
    
    // 점수 병합: AI 점수와 스코어링 엔진 점수를 신뢰도 기반 가중 평균
    // 기본값: AI 점수 사용
    let finalScore = clamp(ai?.score, 0, 100) ?? 80;
    let finalMarketScore = clamp(ai?.marketScore, 0, 100) ?? 78;
    let finalCompetitionScore = clamp(ai?.competitionScore, 0, 100) ?? 74;
    let finalRiskScore = clamp(ai?.riskScore, 0, 100) ?? 86;
    
    if (scoringResult) {
      // 신뢰도 기반 가중치 계산
      // confidence가 높을수록 스코어링 엔진에 더 의존
      // confidence가 낮을수록 AI 점수에 더 의존
      const confidence = scoringResult.confidence || 0;
      const confidenceNorm = confidence / 100; // 0~1 정규화
      
      // 스코어링 엔진 가중치: confidence에 비례 (최소 0.3, 최대 0.7)
      // confidence가 낮으면(0-40): 0.3 (AI에 더 의존)
      // confidence가 중간(40-70): 0.5 (균형)
      // confidence가 높으면(70-100): 0.7 (스코어링 엔진에 더 의존)
      let scoringWeight;
      if (confidence < 40) {
        scoringWeight = 0.3; // AI 70%, 스코어링 엔진 30%
      } else if (confidence < 70) {
        // 40~70 사이에서 선형 보간
        scoringWeight = 0.3 + (confidence - 40) / 30 * 0.2; // 0.3 ~ 0.5
      } else {
        scoringWeight = 0.5 + (confidence - 70) / 30 * 0.2; // 0.5 ~ 0.7
      }
      
      const aiWeight = 1 - scoringWeight;
      
      // AI 점수 추출
      const aiScore = clamp(ai?.score, 0, 100) ?? 80;
      const aiMarket = clamp(ai?.marketScore, 0, 100) ?? 78;
      const aiCompetition = clamp(ai?.competitionScore, 0, 100) ?? 74;
      const aiRisk = clamp(ai?.riskScore, 0, 100) ?? 86;
      
      // 스코어링 엔진 점수 추출
      const scoringScore = scoringResult.total;
      const scoringMarket = scoringResult.market.score;
      const scoringCompetition = scoringResult.moat.score;
      // 성공 사례 적합도를 리스크 점수로 변환 (역변환)
      const scoringRisk = Math.max(0, 100 - scoringResult.analog.score);
      
      // 가중 평균 계산
      finalScore = Math.round(aiScore * aiWeight + scoringScore * scoringWeight);
      finalMarketScore = Math.round(aiMarket * aiWeight + scoringMarket * scoringWeight);
      finalCompetitionScore = Math.round(aiCompetition * aiWeight + scoringCompetition * scoringWeight);
      finalRiskScore = Math.round(aiRisk * aiWeight + scoringRisk * scoringWeight);
      
      console.log('[Validate] Score merge (confidence-based):', {
        confidence: confidence,
        confidenceLabel: scoringResult.confidenceLabel,
        scoringWeight: scoringWeight.toFixed(2),
        aiWeight: aiWeight.toFixed(2),
        ai: { score: aiScore, market: aiMarket, competition: aiCompetition, risk: aiRisk },
        scoring: { score: scoringScore, market: scoringMarket, competition: scoringCompetition, risk: scoringRisk },
        final: { score: finalScore, market: finalMarketScore, competition: finalCompetitionScore, risk: finalRiskScore },
      });
    }
    
    const report = await prisma.report.create({
      data: {
        userId,
        title: ai?.title || idea,
        score: finalScore,
        status: 'completed',
        marketScore: finalMarketScore,
        competitionScore: finalCompetitionScore,
        riskScore: finalRiskScore,
        analysisJson: analysisJson
      }
    });

    res.json({
      success: true,
      message: '아이디어 검증이 완료되었습니다.',
      reportId: report.id,
      report
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      message: '검증 요청 중 오류가 발생했습니다.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

function clamp(value, min, max) {
  if (typeof value !== 'number') return undefined;
  return Math.max(min, Math.min(max, value));
}

export default router;
