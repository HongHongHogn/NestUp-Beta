import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
		if (!token) {
			return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
		}

		const secret = process.env.JWT_SECRET;
		if (!secret) {
			return res.status(500).json({ success: false, message: '서버 설정 오류(JWT_SECRET 미설정).' });
		}

		const payload = jwt.verify(token, secret);
		req.user = { id: payload.sub, email: payload.email };
		next();
	} catch (error) {
		return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
	}
}
