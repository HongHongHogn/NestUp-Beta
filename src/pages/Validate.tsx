import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowUp
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";
import NavigationBar from "@/components/NavigationBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Validate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const [idea, setIdea] = useState("");
  const [purpose, setPurpose] = useState("비즈니스 아이디어 검증");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 로그인하지 않은 경우 로그인 페이지로 리디렉션
  if (!token) {
    navigate("/login");
    return null;
  }

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

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      {/* Main Content - Centered */}
      <main className="container mx-auto px-8 py-16 lg:px-16">
        <div className="max-w-4xl mx-auto">
          {/* Top Heading */}
          <div className="text-center mb-16 animate-linear-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              어떻게 도와드릴까요?
            </h1>
            <p className="text-base text-muted-foreground">
              100자 이상 당신의 아이디어에 대해 입력해주세요. AI가 검증해드립니다.
            </p>
          </div>

          {/* Purpose Dropdown */}
          <div className="mb-6">
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="w-48 border-border/40 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="비즈니스 아이디어 검증">비즈니스 아이디어 검증</SelectItem>
                <SelectItem value="시장 분석">시장 분석</SelectItem>
                <SelectItem value="경쟁 분석">경쟁 분석</SelectItem>
                <SelectItem value="수익 모델 검증">수익 모델 검증</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Input Area */}
          <form onSubmit={handleSubmit} className="space-y-6 mb-12">
            <div className="relative">
              <Textarea
                id="idea"
                placeholder="예시: AI 기반 시니어 일자리 매칭 플랫폼입니다. 시니어들은 은퇴 후에도 일하고 싶어 하지만, 적합한 일자리를 찾기 어렵습니다..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={8}
                className="resize-none bg-background border-border/40 focus:border-border text-base placeholder:text-muted-foreground/60 min-h-[160px]"
                disabled={isAnalyzing}
              />
              {/* Character Counter */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span
                  className={`text-xs ${
                    idea.length < 100
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {idea.length} / 100자
                </span>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-end pt-4 border-t border-border/40">
              <Button
                type="submit"
                disabled={idea.length < 100 || isAnalyzing}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-md px-6"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    검증하기
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Validate;
