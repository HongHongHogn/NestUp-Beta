import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, TrendingUp, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: "10분 만에 검증",
      description: "AI가 수천 개의 데이터를 분석하여 즉시 인사이트 제공",
    },
    {
      icon: TrendingUp,
      title: "시장성 점수",
      description: "0-100점의 명확한 점수로 아이디어의 시장 가능성 평가",
    },
    {
      icon: Users,
      title: "유사 사례 분석",
      description: "성공·실패 사례를 통해 핵심 리스크와 기회 발견",
    },
  ];

  const benefits = [
    "실시간 시장 동향 분석",
    "경쟁 강도 및 진입 장벽 평가",
    "타깃 고객 세그먼트 추천",
    "핵심 리스크 3가지 도출",
    "전문가 수준의 검증 리포트",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">
              IdeaScout AI
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              로그인
            </Button>
            <Button onClick={() => navigate("/signup")} className="shadow-lg">
              무료 시작하기
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in-up">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-sm font-medium text-primary">🚀 AI 스타트업 인텔리전스 엔진</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-relaxed">
            <span className="text-primary">
              10분 만에
            </span>
            <br />
            아이디어를 검증하세요
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            AI가 전 세계 시장 데이터를 분석하여 당신의 비즈니스 아이디어가 
            성공할 수 있는지 데이터 기반으로 검증해드립니다.
          </p>

          <div className="flex gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={() => navigate("/validate")}
              className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
            >
              지금 검증 시작하기
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="text-lg px-8 py-6"
            >
              예시 리포트 보기
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 justify-center text-sm text-muted-foreground">
            <div>
              <span className="text-2xl font-bold text-foreground block">1,200+</span>
              검증된 아이디어
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground block">10분</span>
              평균 분석 시간
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground block">87%</span>
              사용자 만족도
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            왜 IdeaScout AI인가요?
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            전문가 수준의 시장 검증을 누구나 쉽게
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border/50 hover:border-primary/50 transition-all hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
                AI 검증 리포트에 포함된 내용
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary via-primary-glow to-accent p-12 rounded-2xl shadow-2xl text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              첫 검증 리포트는 무료입니다
            </h2>
            <p className="text-lg mb-8 opacity-90">
              지금 바로 시작하고 데이터 기반 의사결정을 경험하세요
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/signup")}
              className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl"
            >
              무료로 시작하기
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 IdeaScout AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
