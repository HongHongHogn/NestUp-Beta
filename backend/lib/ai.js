import OpenAI from 'openai';

export async function analyzeIdeaWithAI(ideaText) {
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

	const client = new OpenAI({ apiKey });

	const systemPrompt = `You are an expert business analyst specializing in startup idea validation. 
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
  }
}`;

	const userPrompt = `Please analyze the following business idea in Korean:

${ideaText}

Provide a detailed analysis focusing on:
- Market attractiveness (marketScore): Market size, growth potential, customer demand
- Competitive advantage (competitionScore): Uniqueness, barriers to entry, defensibility
- Risk assessment (riskScore): Market risks, execution risks, regulatory risks
- Overall viability score (score): Weighted average considering all factors

Return ONLY the JSON object, no markdown, no code blocks, no explanations.`;

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
