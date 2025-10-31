import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { ideaValidateSchema } from '../schemas/validate.js';
import prisma from '../lib/prisma.js';
import { analyzeIdeaWithAI } from '../lib/ai.js';

const router = express.Router();

// 아이디어 검증 요청
// 아이디어 검증 요청
router.post('/', requireAuth, validateRequest(ideaValidateSchema), async (req, res) => {
  try {
    const { idea, description } = req.body;

    const userId = req.user.id;
    const ideaText = description || idea;
    
    console.log('Starting AI analysis...');
    const ai = await analyzeIdeaWithAI(ideaText);
    
    if (!ai) {
      console.warn('AI analysis returned null - using default values. Check OPENAI_API_KEY and API logs.');
    } else {
      console.log('AI analysis successful:', { 
        score: ai.score, 
        marketScore: ai.marketScore,
        hasAnalysis: !!ai.analysis 
      });
    }
    
    const report = await prisma.report.create({
      data: {
        userId,
        title: ai?.title || idea,
        score: clamp(ai?.score, 0, 100) ?? 80,
        status: 'completed',
        marketScore: clamp(ai?.marketScore, 0, 100) ?? 78,
        competitionScore: clamp(ai?.competitionScore, 0, 100) ?? 74,
        riskScore: clamp(ai?.riskScore, 0, 100) ?? 86,
        analysisJson: ai?.analysis || {
          strengths: ['명확한 페인포인트', '충분한 TAM'],
          weaknesses: ['데이터 수집 비용'],
          opportunities: ['규모의 경제', '네트워크 효과'],
          threats: ['빅테크 경쟁'],
          summary: 'AI 분석을 사용할 수 없어 기본 분석 결과를 제공합니다. OpenAI API 키를 확인해주세요.'
        }
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
