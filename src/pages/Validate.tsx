import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Zap, Lightbulb, Target, Users, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";

const Validate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [idea, setIdea] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.length < 100) {
      toast({ variant: "destructive", title: "입력 부족", description: "아이디어를 최소 100자 이상 입력해주세요." });
      return;
    }
    setIsAnalyzing(true);
    try {
      const data = await apiFetch<{ success: boolean; reportId: string; report?: any }>(
        "/api/validate",
        { method: "POST", body: { idea, description: idea } }
      );
      if (!data.success) throw new Error("검증 요청에 실패했습니다.");
      toast({ title: "검증 완료", description: "리포트 페이지로 이동합니다." });
      navigate(`/report/${data.reportId}`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "오류", description: err.message || "문제가 발생했습니다." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const examplePrompts = [
    {
      icon: Lightbulb,
      title: "문제 설명",
      description: "어떤 문제를 해결하려고 하나요?",
    },
    {
      icon: Target,
      title: "타깃 고객",
      description: "누구를 위한 서비스인가요?",
    },
    {
      icon: TrendingUp,
      title: "수익 모델",
      description: "어떻게 수익을 창출할 계획인가요?",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">
              IdeaScout AI
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <span className="hidden sm:inline">대시보드로</span>
              <span className="sm:hidden">대시</span>
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={logout}>로그아웃</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              아이디어를 <span className="text-primary">검증</span>하세요
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI가 아이디어의 시장성과 핵심 리스크를 분석합니다
            </p>
          </div>

          {/* Guide Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {examplePrompts.map((prompt, index) => (
              <Card 
                key={index} 
                className="border-border/50 hover:border-primary/50 transition-all animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <prompt.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{prompt.title}</h3>
                  <p className="text-sm text-muted-foreground">{prompt.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Input Form */}
          <Card className="border-border/50 shadow-xl animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle>아이디어 상세 설명</CardTitle>
              <CardDescription>
                최소 100자 이상 상세하게 작성해주세요. 더 자세할수록 정확한 분석이 가능합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="idea">비즈니스 아이디어</Label>
                  <Textarea
                    id="idea"
                    placeholder="예시: AI 기반 시니어 일자리 매칭 플랫폼입니다. 시니어들은 은퇴 후에도 일하고 싶어 하지만, 적합한 일자리를 찾기 어렵습니다. 저희 플랫폼은 시니어의 경력과 관심사를 분석하여 적합한 단기 프로젝트를 매칭해주고, 기업에게는 경험 많은 시니어 인력을 제공합니다. 수익 모델은 기업으로부터 받는 매칭 수수료(15%)입니다..."
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    rows={12}
                    className="resize-none"
                    disabled={isAnalyzing}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{idea.length}자</span>
                    <span className={idea.length < 100 ? "text-destructive" : "text-primary"}>
                      최소 100자 {idea.length < 100 && `(${100 - idea.length}자 남음)`}
                    </span>
                  </div>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg border border-border/50">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">💡 작성 팁</p>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• 해결하려는 구체적인 문제</li>
                        <li>• 타깃 고객과 그들의 니즈</li>
                        <li>• 제품/서비스의 핵심 기능</li>
                        <li>• 예상 수익 모델</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={idea.length < 100 || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      AI 분석 중...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      AI 검증 시작하기
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  분석에는 약 5-10분이 소요됩니다. 완료되면 이메일로 알림을 드립니다.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Validate;
