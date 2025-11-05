import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="border-white/20 hover:border-white/40 max-w-md w-full animate-fade-in">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-foreground flex items-center justify-center mb-4">
              <Zap className="w-10 h-10 text-background" />
            </div>
            <div className="text-8xl font-bold text-foreground mb-2">404</div>
            <h1 className="text-2xl font-bold mb-2">페이지를 찾을 수 없습니다</h1>
            <p className="text-muted-foreground mb-6">
              요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지로
            </Button>
            <Button onClick={() => navigate("/")} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              문제가 계속되면 홈페이지에서 다시 시작해주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
