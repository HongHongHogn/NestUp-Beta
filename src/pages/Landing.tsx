import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, TrendingUp, Users, Zap, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "@/components/NavigationBar";
import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";

const Landing = () => {
  const navigate = useNavigate();
  const [featuredIdeas, setFeaturedIdeas] = useState<any[]>([]);
  
  // Intersection Observer for scroll reveal
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Observe all scroll-reveal elements
    const scrollRevealElements = document.querySelectorAll(".scroll-reveal");
    scrollRevealElements.forEach((el) => {
      observer.observe(el);
    });

    sectionRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      scrollRevealElements.forEach((el) => {
        observer.unobserve(el);
      });
      sectionRefs.current.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, [featuredIdeas]);

  useEffect(() => {
    // 샘플 검증된 아이디어들 (실제로는 공개 API에서 가져올 수 있음)
    const sampleIdeas = [
      {
        id: "1",
        title: "AI 기반 시니어 일자리 매칭 플랫폼",
        score: 85,
        category: "B2B 서비스",
        description: "시니어 인력과 기업의 단기 프로젝트를 AI로 매칭하는 플랫폼",
      },
      {
        id: "2",
        title: "개인 맞춤형 건강 관리 앱",
        score: 78,
        category: "헬스케어",
        description: "웨어러블 기기 데이터를 활용한 개인별 건강 코칭 서비스",
      },
      {
        id: "3",
        title: "지속가능한 패션 중고거래 플랫폼",
        score: 82,
        category: "이커머스",
        description: "친환경 패션 아이템의 검증된 중고거래를 위한 전용 마켓플레이스",
      },
      {
        id: "4",
        title: "원격 근무자를 위한 협업 도구",
        score: 75,
        category: "SaaS",
        description: "비동기 협업에 최적화된 프로젝트 관리 및 커뮤니케이션 툴",
      },
    ];
    setFeaturedIdeas(sampleIdeas);
  }, []);

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

  const getScoreColor = (score: number) => {
    return "text-foreground";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return "default";
    if (score >= 50) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-32">
        <div className="max-w-5xl mx-auto text-left animate-linear-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight">
            10분 만에 아이디어를
            <br />
            <span className="block mt-4">검증하세요</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl leading-relaxed">
            AI가 전 세계 시장 데이터를 분석하여 당신의 비즈니스 아이디어가<br />
            성공할 수 있는지 데이터 기반으로 검증해드립니다.
          </p>

          <div className="flex items-center gap-6 mb-16">
            <Button 
              size="lg" 
              onClick={() => navigate("/signup")}
              className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90 rounded-md button-interactive"
            >
              시작하기
            </Button>
            <button
              onClick={() => navigate("/validate")}
              className="text-base font-medium text-foreground hover:text-muted-foreground transition-all duration-200 flex items-center gap-1 button-interactive group"
            >
              새 기능 보기
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Validated Ideas */}
      <section 
        id="ideas" 
        className="container mx-auto px-4 py-20 border-t border-border/40"
        ref={(el) => {
          if (el) sectionRefs.current[0] = el;
        }}
      >
        <div className="max-w-6xl mx-auto scroll-reveal">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">검증된 아이디어들</h2>
            <p className="text-muted-foreground text-lg">
              실제 검증을 통해 시장 가능성이 확인된 비즈니스 아이디어들
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {featuredIdeas.map((idea, index) => (
              <Card 
                key={idea.id}
                className="border-white/20 hover:border-white/40 hover-lift cursor-pointer group scroll-reveal"
                style={{ transitionDelay: `${index * 0.08}s` }}
                onClick={() => navigate("/signup")}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2 text-xs">
                        {idea.category}
                      </Badge>
                      <h3 className="font-semibold text-lg mb-2 transition-colors">
                        {idea.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {idea.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-3xl font-bold ${getScoreColor(idea.score)}`}>
                        {idea.score}
                      </div>
                      <Badge variant={getScoreBadge(idea.score) as any} className="text-xs mt-1">
                        검증 완료
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center scroll-reveal">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/signup")}
              className="button-interactive group"
            >
              더 많은 아이디어 보기
              <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section 
        id="features" 
        className="container mx-auto px-4 py-20 border-t border-border/40"
        ref={(el) => {
          if (el) sectionRefs.current[1] = el;
        }}
      >
        <div className="max-w-6xl mx-auto scroll-reveal">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">왜 NestUp AI인가요?</h2>
            <p className="text-muted-foreground text-lg">
              전문가 수준의 시장 검증을 누구나 쉽게
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-white/20 hover:border-white/40 hover-lift scroll-reveal"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section 
        className="container mx-auto px-4 py-20 border-t border-border/40"
        ref={(el) => {
          if (el) sectionRefs.current[2] = el;
        }}
      >
        <div className="max-w-4xl mx-auto scroll-reveal">
          <Card className="border-white/20 hover:border-white/40 bg-card/50 hover-lift">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
                AI 검증 리포트에 포함된 내용
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "실시간 시장 동향 분석",
                  "경쟁 강도 및 진입 장벽 평가",
                  "타깃 고객 세그먼트 추천",
                  "핵심 리스크 3가지 도출",
                  "전문가 수준의 검증 리포트",
                  "유사 성공/실패 사례 분석",
                ].map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-base">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section 
        className="container mx-auto px-4 py-20 border-t border-border/40"
        ref={(el) => {
          if (el) sectionRefs.current[3] = el;
        }}
      >
        <div className="max-w-4xl mx-auto text-center scroll-reveal">
          <div className="bg-muted/50 p-12 rounded-lg border border-border scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              첫 검증 리포트는 무료입니다
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              지금 바로 시작하고 데이터 기반 의사결정을 경험하세요
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/signup")}
              className="h-12 px-8 button-interactive"
            >
              무료로 시작하기
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 NestUp AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
