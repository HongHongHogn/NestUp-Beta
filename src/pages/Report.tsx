import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Users,
  DollarSign,
  BarChart3,
  Download,
  Share2,
  Trash2
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";

const Report = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { reportId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchReport = async () => {
      try {
        if (!reportId) return;
        const data = await apiFetch<{ success: boolean; report: any }>(`/api/report/${reportId}`);
        if (!data.success) throw new Error("리포트 조회에 실패했습니다.");
        if (mounted) setReport(transformReport(data.report));
      } catch (err: any) {
        toast({ variant: "destructive", title: "오류", description: err.message || "문제가 발생했습니다." });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchReport();
    return () => { mounted = false; };
  }, [reportId]);

  function transformReport(r: any) {
    const analysis = r.analysisJson || {};
    return {
      id: r.id,
      title: r.title,
      validationScore: r.score ?? 60,
      date: r.date,
      summary: analysis.summary || "요약 정보가 제공되지 않았습니다.",
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      opportunities: analysis.opportunities || [],
      marketDemand: {
        size: r.marketSize || "-",
        growth: r.marketGrowth || "-",
        competition: r.competitionLevel || "-",
        barriers: analysis.threats || [],
      },
      precedents: (r.precedents || []).map((p: any) => ({
        name: p.name,
        status: p.status,
        reason: p.reason,
        icon: p.status === "성공" ? CheckCircle2 : XCircle,
        color: p.status === "성공" ? "text-green-600 dark:text-green-400" : "text-destructive",
      })),
      risks: (analysis.threats || []).map((t: string) => ({ title: t, description: t, severity: "medium" })),
      recommendations: r.recommendations || [],
      scoreBreakdown: {
        marketAttractiveness: r.marketScore ?? 60,
        competitiveAdvantage: r.competitionScore ?? 50,
        successPrecedent: r.riskScore ? Math.max(0, 100 - r.riskScore) : 40,
      },
    };
  }

  const handleDelete = async () => {
    if (!reportId) return;
    try {
      await apiFetch(`/api/report/${reportId}`, { method: "DELETE" });
      toast({ title: "삭제 완료", description: "리포트가 삭제되었습니다." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "오류", description: err.message || "삭제에 실패했습니다." });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "높은 시장성";
    if (score >= 50) return "중간 시장성";
    return "낮은 시장성";
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === "high") return <Badge variant="destructive">높음</Badge>;
    if (severity === "medium") return <Badge variant="secondary">중간</Badge>;
    return <Badge variant="default">낮음</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
        <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-8">
            <Skeleton className="h-10 w-64" />
            <Card>
              <CardContent className="p-8 space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">리포트를 불러올 수 없습니다.</div>
      </div>
    );
  }

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
          <div className="flex flex-wrap gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">삭제</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>리포트 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    정말로 이 리포트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              PDF 저장
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Share2 className="w-4 h-4 mr-2" />
              공유
            </Button>
            <Button size="sm" onClick={() => navigate("/dashboard")}>
              <span className="hidden sm:inline">대시보드로</span>
              <span className="sm:hidden">대시보드</span>
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={logout}>로그아웃</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Title & Meta */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <span>검증 완료</span>
              <span>•</span>
              <span>{report.date}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{report.title}</h1>
          </div>

          {/* Validation Score - Hero */}
          <Card className="mb-8 border-2 border-primary/20 shadow-xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-4 sm:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left flex-1">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">AI Validation Score</div>
                  <div className={`text-5xl sm:text-6xl md:text-7xl font-bold ${getScoreColor(report.validationScore)} mb-2`}>
                    {report.validationScore}
                  </div>
                  <div className="text-base sm:text-lg font-medium">{getScoreLabel(report.validationScore)}</div>
                </div>
                
                <Separator orientation="vertical" className="hidden md:block h-32" />
                <Separator className="md:hidden my-4" />
                
                <div className="flex-1 w-full space-y-4">
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>시장 매력도</span>
                      <span className="font-medium">{report.scoreBreakdown.marketAttractiveness}</span>
                    </div>
                    <Progress value={report.scoreBreakdown.marketAttractiveness} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>경쟁 우위</span>
                      <span className="font-medium">{report.scoreBreakdown.competitiveAdvantage}</span>
                    </div>
                    <Progress value={report.scoreBreakdown.competitiveAdvantage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>성공 사례</span>
                      <span className="font-medium">{report.scoreBreakdown.successPrecedent}</span>
                    </div>
                    <Progress value={report.scoreBreakdown.successPrecedent} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                핵심 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{report.summary}</p>
            </CardContent>
          </Card>

          {/* SWOT Analysis */}
          {(report.strengths?.length > 0 || report.weaknesses?.length > 0 || report.opportunities?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: "0.25s" }}>
              {report.strengths?.length > 0 && (
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      강점
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {report.weaknesses?.length > 0 && (
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      약점
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.weaknesses.map((weakness: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {report.opportunities?.length > 0 && (
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      기회
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.opportunities.map((opportunity: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                          <span>{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Market Demand */}
          <Card className="mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                시장 수요 분석
              </CardTitle>
              <CardDescription>AI가 분석한 시장 규모 및 성장성</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    시장 규모
                  </div>
                  <div className="text-2xl font-bold">{report.marketDemand.size}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    연평균 성장률
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{report.marketDemand.growth}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    경쟁 강도
                  </div>
                  <div className="text-2xl font-bold">{report.marketDemand.competition}</div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h4 className="font-semibold mb-3">주요 진입 장벽</h4>
                <ul className="space-y-2">
                  {report.marketDemand.barriers.map((barrier, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>{barrier}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Precedents */}
          <Card className="mb-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                유사 사례 분석
              </CardTitle>
              <CardDescription>과거 성공/실패 사례로부터 배우는 인사이트</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.precedents.map((precedent, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 ${precedent.color}`}>
                          <precedent.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{precedent.name}</h4>
                            <Badge variant={precedent.status === "성공" ? "default" : "destructive"}>
                              {precedent.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{precedent.reason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risks */}
          <Card className="mb-8 border-destructive/20 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                핵심 리스크
              </CardTitle>
              <CardDescription>AI가 판단한 가장 치명적인 리스크 요소</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.risks.map((risk, index) => (
                  <div key={index} className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{risk.title}</h4>
                      {getSeverityBadge(risk.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground">{risk.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="mb-8 border-primary/20 bg-gradient-to-br from-card to-primary/5 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                AI 추천 전략
              </CardTitle>
              <CardDescription>시장 진입 및 피벗 방향 제안</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <span className="flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center animate-fade-in" style={{ animationDelay: "0.7s" }}>
            <Button size="lg" onClick={() => navigate("/validate")}>
              다른 아이디어 검증하기
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Report;
