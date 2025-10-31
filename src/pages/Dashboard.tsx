import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowRight, FileText, Plus, TrendingUp, Zap, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchReports = async () => {
      try {
        const data = await apiFetch<{ success: boolean; reports: any[] }>("/api/report");
        if (!data.success) throw new Error("리포트 목록 조회에 실패했습니다.");
        if (mounted) setReports((data.reports || []).map(mapReport));
      } catch (err: any) {
        toast({ variant: "destructive", title: "오류", description: err.message || "문제가 발생했습니다." });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchReports();
    return () => { mounted = false; };
  }, []);

  const avgScore = useMemo(() => {
    if (!reports.length) return 0;
    return Math.round(reports.reduce((s, r) => s + (r.score || 0), 0) / reports.length);
  }, [reports]);

  function mapReport(r: any) {
    return {
      id: r.id,
      title: r.title,
      score: r.score ?? 60,
      date: r.date ?? new Date().toISOString(),
      status: r.status ?? "completed",
    };
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return "높음";
    if (score >= 50) return "중간";
    return "낮음";
  };

  const handleDelete = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    try {
      await apiFetch(`/api/report/${reportId}`, { method: "DELETE" });
      toast({ title: "삭제 완료", description: "리포트가 삭제되었습니다." });
      // 목록 새로고침
      const data = await apiFetch<{ success: boolean; reports: any[] }>("/api/report");
      if (data.success) {
        setReports((data.reports || []).map(mapReport));
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "오류", description: err.message || "삭제에 실패했습니다." });
    }
  };

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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => navigate("/profile")}>내 계정</Button>
            <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={logout}>로그아웃</Button>
            <Button variant="ghost" size="sm" className="sm:hidden" onClick={logout} title="로그아웃">↗</Button>
            <Button size="sm" onClick={() => navigate("/validate")}>
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">새 검증</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">내 대시보드</h1>
            <p className="text-muted-foreground text-lg">
              검증한 아이디어를 관리하고 인사이트를 확인하세요
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-border/50 hover:border-primary/50 transition-all animate-fade-in">
              <CardHeader className="pb-3">
                <CardDescription>총 검증 수</CardDescription>
                <CardTitle className="text-3xl">{reports.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 mr-1" />
                  <span>아이디어</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-all animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader className="pb-3">
                <CardDescription>평균 검증 점수</CardDescription>
                <CardTitle className="text-3xl">{avgScore || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>중간 수준</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-all animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="pb-3">
                <CardDescription>무료 크레딧</CardDescription>
                <CardTitle className="text-3xl">1</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate("/pricing")}>
                  크레딧 충전하기 →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">검증 리포트</h2>
              <Button size="sm" onClick={() => navigate("/validate")}>
                <Plus className="w-4 h-4 mr-2" />
                새 검증 시작
              </Button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-10 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">아직 검증한 아이디어가 없습니다</h3>
                  <p className="text-muted-foreground mb-6 text-center max-w-md">
                    첫 번째 아이디어를 검증하고 AI 분석 리포트를 받아보세요
                  </p>
                  <Button onClick={() => navigate("/validate")}>
                    지금 시작하기
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report, index) => (
                  <Card 
                    key={report.id} 
                    className="border-border/50 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => navigate(`/report/${report.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold break-words">{report.title}</h3>
                            <Badge variant={report.score >= 70 ? "default" : report.score >= 50 ? "secondary" : "destructive"}>
                              {getScoreBadge(report.score)}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                            검증일: {new Date(report.date).toLocaleDateString("ko-KR")}
                          </p>
                          <div className="sm:hidden mb-3">
                            <div className={`text-2xl font-bold ${getScoreColor(report.score)}`}>
                              {report.score}점
                            </div>
                          </div>
                        </div>
                        <div className="hidden sm:block text-right flex-shrink-0">
                          <div className={`text-3xl font-bold ${getScoreColor(report.score)}`}>
                            {report.score}
                          </div>
                          <div className="text-xs text-muted-foreground">점수</div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              삭제
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>리포트 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                정말로 이 리포트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(report.id, e as any);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          리포트 보기
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
