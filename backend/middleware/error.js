export function notFound(req, res, next) {
	res.status(404).json({ success: false, message: '존재하지 않는 경로입니다.' });
}

export function errorHandler(err, req, res, next) {
	const status = err.status || 500;
	const message = err.message || '서버 오류가 발생했습니다.';
	res.status(status).json({ success: false, message });
}
