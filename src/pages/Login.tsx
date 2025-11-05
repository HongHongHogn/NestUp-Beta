import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { loginSchema } from "@/lib/validation";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "입력값을 확인해주세요.";
      toast({ variant: "destructive", title: "유효하지 않은 입력", description: msg });
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; token: string; user: { id: string; email: string; name?: string } }>(
        "/api/auth/login",
        { method: "POST", body: { email, password } }
      );
      if (!data.success) throw new Error("로그인에 실패했습니다.");
      login({ token: data.token, user: data.user });
      toast({ title: "로그인 성공", description: "아이디어 검증을 시작하세요." });
      navigate("/validate");
    } catch (err: any) {
      toast({ variant: "destructive", title: "오류", description: err.message || "문제가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
              <Zap className="w-6 h-6 text-background" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              IdeaScout AI
            </span>
          </div>
        </div>

        <Card className="border-white/20 hover:border-white/40">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">로그인</CardTitle>
            <CardDescription>
              아이디어 검증을 시작하려면 로그인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                로그인
              </Button>
            </form>

            <div className="mt-6">
              <Separator className="my-4" />
              <div className="text-center text-sm text-muted-foreground">
                계정이 없으신가요?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="text-foreground hover:underline font-medium"
                >
                  회원가입
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← 홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
