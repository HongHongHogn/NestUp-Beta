/**
 * AI 기반 BM(Business Model) 캔버스 생성
 * PRD S-1 요구사항: 검증 리포트를 기반으로 9-Blocks BM 캔버스 초안 생성
 */

import OpenAI from 'openai';

/**
 * 리포트 데이터를 기반으로 BM 캔버스 생성
 * @param {Object} reportData - 리포트 데이터 (analysisJson 포함)
 * @returns {Promise<Object|null>} BM 캔버스 데이터
 */
export async function generateBMCanvas(reportData) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('OpenAI API key not found, skipping BM canvas generation');
    return null;
  }

  const client = new OpenAI({ apiKey: apiKey.trim().replace(/^["']|["']$/g, '') });

  // 리포트에서 분석 데이터 추출
  const analysis = reportData.analysisJson || {};
  const title = reportData.title || '비즈니스 아이디어';
  const summary = analysis.summary || '';
  const strengths = analysis.strengths || [];
  const opportunities = analysis.opportunities || [];
  const targetCustomers = analysis.targetCustomers || [];
  const marketDemand = analysis.marketDemand || {};
  const precedents = analysis.precedents || [];
  const recommendations = analysis.recommendations || [];

  const systemPrompt = `You are a business model expert with 20 years of experience helping startups create business model canvases.
You analyze business ideas and create comprehensive 9-Blocks Business Model Canvas based on the validation report.

Create a Business Model Canvas in JSON format with the following structure:
{
  "keyPartners": {
    "description": "주요 파트너 설명",
    "items": ["파트너 1", "파트너 2", ...]
  },
  "keyActivities": {
    "description": "주요 활동 설명",
    "items": ["활동 1", "활동 2", ...]
  },
  "keyResources": {
    "description": "핵심 자원 설명",
    "items": ["자원 1", "자원 2", ...]
  },
  "valuePropositions": {
    "description": "가치 제안 설명",
    "items": ["가치 제안 1", "가치 제안 2", ...]
  },
  "customerRelationships": {
    "description": "고객 관계 설명",
    "items": ["관계 유형 1", "관계 유형 2", ...]
  },
  "channels": {
    "description": "채널 설명",
    "items": ["채널 1", "채널 2", ...]
  },
  "customerSegments": {
    "description": "고객 세그먼트 설명",
    "items": ["세그먼트 1", "세그먼트 2", ...]
  },
  "costStructure": {
    "description": "비용 구조 설명",
    "items": ["비용 항목 1", "비용 항목 2", ...]
  },
  "revenueStreams": {
    "description": "수익원 설명",
    "items": ["수익원 1", "수익원 2", ...]
  }
}

Respond ONLY with valid JSON, no additional text.`;

  const userPrompt = `다음 비즈니스 아이디어 검증 리포트를 바탕으로 9-Blocks 비즈니스 모델 캔버스를 생성해주세요 (한국어로 응답):

**아이디어 제목**: ${title}

**요약**: ${summary}

**강점**: ${strengths.join(', ')}

**기회**: ${opportunities.join(', ')}

**타깃 고객**: ${targetCustomers.map((tc) => `${tc.segment}: ${tc.description}`).join('\n')}

**시장 정보**: 
- 시장 규모: ${marketDemand.size || '미확인'}
- 성장률: ${marketDemand.growth || '미확인'}
- 경쟁 강도: ${marketDemand.competitionLevel || '미확인'}

**유사 사례**: ${precedents.map((p) => `${p.name} (${p.status}): ${p.reason}`).join('\n')}

**추천 전략**: ${recommendations.join('\n')}

위 정보를 바탕으로 다음을 포함한 BM 캔버스를 생성해주세요:

1. **고객 세그먼트 (Customer Segments)**: 타깃 고객을 명확히 정의
2. **가치 제안 (Value Propositions)**: 고객에게 제공하는 핵심 가치
3. **채널 (Channels)**: 고객에게 도달하는 방법
4. **고객 관계 (Customer Relationships)**: 고객과의 관계 유형
5. **수익원 (Revenue Streams)**: 수익을 창출하는 방법
6. **핵심 자원 (Key Resources)**: 비즈니스를 운영하기 위한 핵심 자원
7. **주요 활동 (Key Activities)**: 가치를 창출하기 위한 주요 활동
8. **주요 파트너 (Key Partners)**: 비즈니스에 필요한 파트너
9. **비용 구조 (Cost Structure)**: 주요 비용 항목

각 블록은 구체적이고 실행 가능한 내용으로 작성해주세요.`;

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices?.[0]?.message?.content || '';
    
    if (!content) {
      console.error('Empty response from OpenAI for BM canvas');
      return null;
    }

    // JSON 추출
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.error('Invalid JSON format in BM canvas response:', content.substring(0, 200));
      return null;
    }

    jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonText);

    // 기본 검증 - 9개 블록 모두 있는지 확인
    const requiredBlocks = [
      'keyPartners', 'keyActivities', 'keyResources',
      'valuePropositions', 'customerRelationships', 'channels',
      'customerSegments', 'costStructure', 'revenueStreams'
    ];

    const missingBlocks = requiredBlocks.filter(block => !parsed[block]);
    if (missingBlocks.length > 0) {
      console.error('Missing BM canvas blocks:', missingBlocks);
      // 누락된 블록은 기본값으로 채움
      missingBlocks.forEach(block => {
        parsed[block] = { description: '', items: [] };
      });
    }

    // Prisma 스키마에 맞게 변환 (각 필드를 개별적으로 저장)
    return {
      keyPartners: parsed.keyPartners || { description: '', items: [] },
      keyActivities: parsed.keyActivities || { description: '', items: [] },
      keyResources: parsed.keyResources || { description: '', items: [] },
      valuePropositions: parsed.valuePropositions || { description: '', items: [] },
      customerRelationships: parsed.customerRelationships || { description: '', items: [] },
      channels: parsed.channels || { description: '', items: [] },
      customerSegments: parsed.customerSegments || { description: '', items: [] },
      costStructure: parsed.costStructure || { description: '', items: [] },
      revenueStreams: parsed.revenueStreams || { description: '', items: [] },
    };
  } catch (error) {
    console.error('BM Canvas generation error:', error.message);
    return null;
  }
}

