import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { signupSchema } from "@/lib/validation";
import { apiFetch } from "@/lib/api";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    // client-side validation
    const parsed = signupSchema.safeParse({ email, password, name });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "입력값을 확인해주세요.";
      toast({ variant: "destructive", title: "유효하지 않은 입력", description: msg });
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; message?: string; user?: any }>(
        "/api/auth/signup",
        { method: "POST", body: { email, password, name } }
      );
      if (!data.success) {
        throw new Error(data.message || "회원가입에 실패했습니다.");
      }
      toast({ title: "회원가입 완료", description: "로그인 화면으로 이동합니다." });
      navigate("/login");
    } catch (err: any) {
      const message = err.message || "서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.";
      toast({ variant: "destructive", title: "오류", description: message });
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
            <img src="/logo.svg" alt="NestUp AI" className="w-10 h-10" />
            <span className="text-2xl font-bold text-foreground">
              NestUp AI
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            첫 검증 리포트 <span className="text-foreground font-semibold">무료</span> 제공
          </p>
        </div>

        <Card className="border-white/20 hover:border-white/40">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">회원가입</CardTitle>
            <CardDescription>
              10초면 시작할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                무료로 시작하기
              </Button>
            </form>

            <div className="mt-6">
              <Separator className="my-4" />
              <div className="text-center text-sm text-muted-foreground">
                이미 계정이 있으신가요?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-foreground hover:underline font-medium"
                >
                  로그인
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

export default Signup;
