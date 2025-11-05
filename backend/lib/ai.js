import OpenAI from 'openai';
import { executeRAGPipeline } from './rag.js';

/**
 * RAG 기반 AI 분석
 * @param {string} ideaText - 사용자 아이디어 텍스트
 * @param {Object} options - 추가 옵션 (기존 호환성을 위해)
 * @returns {Promise<Object|null>} 분석 결과
 */
export async function analyzeIdeaWithAI(ideaText, options = {}) {
	let apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		console.log('OpenAI API key not found, skipping AI analysis');
		return null;
	}

	// API 키 앞뒤 공백 및 따옴표 제거
	apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
	
	if (!apiKey.startsWith('sk-')) {
		console.error('Invalid OpenAI API key format (should start with sk-)');
		return null;
	}

	console.log('OpenAI API key found, length:', apiKey.length, 'prefix:', apiKey.substring(0, 7) + '...');

	// RAG 파이프라인 실행
	console.log('[AI] Starting RAG pipeline for context augmentation...');
	const ragResult = await executeRAGPipeline(ideaText);
	const searchContext = ragResult.context || '';

	console.log(`[AI] RAG context length: ${searchContext.length} characters`);

	const client = new OpenAI({ apiKey });

	const systemPrompt = `You are an expert VC analyst with 20 years of experience in startup idea validation. 
You analyze business ideas using real-world data and market research to provide objective, data-driven assessments.

Analyze the given business idea and provide a comprehensive assessment in JSON format.

Respond ONLY with valid JSON, no additional text. The JSON must have this exact structure:
{
  "title": "Short descriptive title of the idea",
  "score": <number 0-100>,
  "marketScore": <number 0-100>,
  "competitionScore": <number 0-100>,
  "riskScore": <number 0-100>,
  "analysis": {
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "opportunities": ["opportunity1", "opportunity2", ...],
    "threats": ["threat1", "threat2", ...],
    "summary": "A comprehensive 2-3 sentence summary in Korean"
  },
  "precedents": [
    {
      "name": "Company or service name",
      "status": "성공" or "실패",
      "reason": "Brief explanation of success/failure reason in Korean"
    }
  ],
  "marketDemand": {
    "size": "Market size estimate (e.g., '10억 달러', '500억 원')",
    "growth": "CAGR estimate (e.g., '연평균 15%', '연평균 8% 성장')",
    "competitionLevel": "High" or "Mid" or "Low",
    "barriers": ["barrier1", "barrier2", ...]
  },
  "recommendations": [
    "Go-to-Market 전략 제안 1",
    "피벗 방향 제안 2",
    ...
  ],
  "targetCustomers": [
    {
      "segment": "1순위 타깃 고객 세그먼트",
      "description": "세그먼트 설명"
    },
    {
      "segment": "2순위 타깃 고객 세그먼트",
      "description": "세그먼트 설명"
    }
  ]
}`;

	// 사용자 프롬프트 구성
	let userPrompt = `다음 비즈니스 아이디어를 분석해주세요 (한국어로 응답):

${ideaText}

`;

	// RAG 검색 결과가 있으면 컨텍스트로 주입
	if (searchContext && searchContext.length > 0) {
		userPrompt += `\n다음은 웹 검색을 통해 수집한 최신 시장 정보와 유사 사례입니다. 이 정보를 활용하여 사실에 입각한 분석을 제공해주세요:

${searchContext}

위 검색 결과를 참고하여:
1. 유사한 스타트업이나 서비스의 성공/실패 사례를 precedents 배열에 포함
2. 시장 규모, 성장률, 경쟁 강도를 marketDemand 객체에 포함
3. 검색 결과에 기반한 구체적인 추천 전략 제시
4. 검색 결과에서 언급된 타깃 고객 세그먼트 제안
`;
	}

	userPrompt += `
다음 영역을 중점적으로 분석하세요:
- 시장 매력도 (marketScore): 시장 규모, 성장 잠재력, 고객 수요
- 경쟁 우위 (competitionScore): 차별화 포인트, 진입 장벽, 방어 가능성
- 리스크 평가 (riskScore): 시장 리스크, 실행 리스크, 규제 리스크
- 전체 실현 가능성 점수 (score): 모든 요소를 종합한 가중 평균

precedents 배열에는 최소 2개, 최대 5개의 유사 사례를 포함하세요.
marketDemand의 competitionLevel은 "High", "Mid", "Low" 중 하나로 평가하세요.

응답은 JSON 객체만 반환하세요. 마크다운, 코드 블록, 추가 설명 없이.`;

	try {
		const completion = await client.chat.completions.create({
			model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt },
			],
			temperature: 0.3,
			response_format: { type: 'json_object' },
		});

		const content = completion.choices?.[0]?.message?.content || '';
		
		if (!content) {
			console.error('Empty response from OpenAI');
			return null;
		}

		// JSON 추출 (마크다운 코드 블록 제거)
		let jsonText = content.trim();
		if (jsonText.startsWith('```json')) {
			jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
		} else if (jsonText.startsWith('```')) {
			jsonText = jsonText.replace(/```\n?/g, '');
		}

		// 첫 번째 '{'부터 마지막 '}'까지 추출
		const jsonStart = jsonText.indexOf('{');
		const jsonEnd = jsonText.lastIndexOf('}');
		
		if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
			console.error('Invalid JSON format in OpenAI response:', content.substring(0, 200));
			return null;
		}

		jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
		
		const parsed = JSON.parse(jsonText);
		
		// 기본 검증
		if (typeof parsed.score !== 'number' || !parsed.analysis) {
			console.error('Invalid JSON structure from OpenAI:', parsed);
			return null;
		}

		return parsed;
	} catch (error) {
		console.error('OpenAI API error details:', {
			status: error.status,
			statusText: error.statusText,
			message: error.message,
			type: error.type,
			code: error.code
		});

		if (error.status === 429) {
			console.error('⚠️ OpenAI API quota exceeded or rate limit reached');
			console.error('   Check: https://platform.openai.com/account/billing');
			console.error('   Error:', error.message);
		} else if (error.status === 401) {
			console.error('❌ OpenAI API authentication failed');
			console.error('   Check: API key is valid and active');
			console.error('   Error:', error.message);
		} else if (error.status === 403) {
			console.error('❌ OpenAI API access forbidden');
			console.error('   Check: Account activation and billing setup');
			console.error('   Error:', error.message);
		} else {
			console.error('❌ OpenAI API error:', error.message);
			if (error.response) {
				console.error('   Response:', JSON.stringify(error.response, null, 2));
			}
		}
		return null;
	}
}
