import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthUser = { id: string; email: string; name?: string } | null;

type AuthContextValue = {
	user: AuthUser;
	token: string | null;
	login: (payload: { token: string; user: { id: string; email: string; name?: string } }) => void;
	logout: () => void;
	ready: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser>(null);
	const [token, setToken] = useState<string | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const savedToken = window.localStorage.getItem("token");
		const savedUser = window.localStorage.getItem("user");
		if (savedToken) setToken(savedToken);
		if (savedUser) {
			try { setUser(JSON.parse(savedUser)); } catch {}
		}
		setReady(true);
	}, []);

	const login = (payload: { token: string; user: { id: string; email: string; name?: string } }) => {
		setToken(payload.token);
		setUser(payload.user);
		window.localStorage.setItem("token", payload.token);
		window.localStorage.setItem("user", JSON.stringify(payload.user));
	};

	const logout = () => {
		setToken(null);
		setUser(null);
		window.localStorage.removeItem("token");
		window.localStorage.removeItem("user");
	};

	const value = useMemo(() => ({ user, token, login, logout, ready }), [user, token, ready]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
