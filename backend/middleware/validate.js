import { ZodError } from 'zod';

export function validateRequest(schema) {
	return (req, res, next) => {
		try {
			schema.parse({ body: req.body, params: req.params, query: req.query });
			next();
		} catch (err) {
			if (err instanceof ZodError) {
				const first = err.issues?.[0];
				return res.status(400).json({ success: false, message: first?.message || '요청이 유효하지 않습니다.' });
			}
			next(err);
		}
	};
}
