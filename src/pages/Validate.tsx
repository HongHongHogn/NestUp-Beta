import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Zap, 
  ArrowUp, 
  ChevronDown, 
  ChevronUp,
  Paperclip,
  Grid3x3,
  Search,
  Globe,
  FileText
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
import { Card } from "@/components/ui/card";

const Validate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const [idea, setIdea] = useState("");
  const [purpose, setPurpose] = useState("비즈니스 아이디어 검증");
  const [slideCount, setSlideCount] = useState(5);
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
            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="첨부"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="템플릿"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1 border border-border/40 rounded-md">
                  <button
                    type="button"
                    onClick={() => setSlideCount(Math.max(1, slideCount - 1))}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <Input
                    type="number"
                    value={slideCount}
                    onChange={(e) => setSlideCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 h-8 text-center border-0 bg-transparent p-0"
                    min={1}
                  />
                  <button
                    type="button"
                    onClick={() => setSlideCount(slideCount + 1)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
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

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="outline"
              className="border-white/20 hover:border-white/40 bg-card hover:bg-card/80 rounded-md"
            >
              <Search className="w-4 h-4 mr-2" />
              웹 리서치
            </Button>
            <Button
              variant="outline"
              className="border-white/20 hover:border-white/40 bg-card hover:bg-card/80 rounded-md"
            >
              <Globe className="w-4 h-4 mr-2" />
              웹 스크랩
            </Button>
            <Button
              variant="outline"
              className="border-white/20 hover:border-white/40 bg-card hover:bg-card/80 rounded-md"
            >
              <FileText className="w-4 h-4 mr-2" />
              노션 가져오기
            </Button>
            <Button
              variant="outline"
              className="border-white/20 hover:border-white/40 bg-card hover:bg-card/80 rounded-md"
            >
              <Zap className="w-4 h-4 mr-2" />
              전문가 모드
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Validate;
