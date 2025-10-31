import { z } from 'zod';

export const ideaValidateSchema = z.object({
	body: z.object({
		idea: z.string().min(100, '아이디어는 최소 100자 이상이어야 합니다.'),
		description: z.string().min(100, '설명은 최소 100자 이상이어야 합니다.'),
	}),
	params: z.object({}).optional(),
	query: z.object({}).optional(),
});
