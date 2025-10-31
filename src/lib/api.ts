const base = (import.meta as any).env?.VITE_API_BASE || "";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiFetch<T>(path: string, options: { method?: HttpMethod; body?: any; headers?: Record<string, string> } = {}): Promise<T> {
	const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
	const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers || {}) };
	if (token) headers["Authorization"] = `Bearer ${token}`;
	
	let res: Response;
	try {
		res = await fetch(`${base}${path}`, {
			method: options.method || "GET",
			headers,
			body: options.body ? JSON.stringify(options.body) : undefined,
		});
	} catch (err: any) {
		throw new Error("서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
	}
	
	let data: any = {};
	const contentType = res.headers.get("content-type");
	if (contentType && contentType.includes("application/json")) {
		const text = await res.text();
		if (text.trim()) {
			try {
				data = JSON.parse(text);
			} catch {
				throw new Error("서버 응답을 파싱할 수 없습니다.");
			}
		}
	}
	
	if (res.status === 401) {
		try {
			window.localStorage.removeItem("token");
			window.localStorage.removeItem("user");
		} catch {}
		if (typeof window !== "undefined") {
			window.location.href = "/login";
		}
		throw new Error("인증이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.");
	}
	if (!res.ok) {
		throw new Error((data && (data.message || data.error)) || `요청에 실패했습니다. (${res.status})`);
	}
	return data as T;
}
