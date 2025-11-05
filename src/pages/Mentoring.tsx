import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, Search, Star, Calendar, MessageCircle, Award } from "lucide-react";
import NavigationBar from "@/components/NavigationBar";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Mentoring = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");

  const mentors = [
    {
      id: "1",
      name: "김창민",
      title: "시리즈 A 투자 CEO",
      category: "비즈니스",
      rating: 4.9,
      sessions: 120,
      expertise: ["비즈니스 모델", "투자 유치", "성장 전략"],
      description: "10년 이상의 스타트업 경험과 시리즈 A 투자 유치 경험이 있습니다.",
      avatar: "김",
      price: "50,000원/시간",
    },
    {
      id: "2",
      name: "이수진",
      title: "전 구글 프로덕트 매니저",
      category: "제품",
      rating: 4.8,
      sessions: 95,
      expertise: ["제품 기획", "사용자 경험", "데이터 분석"],
      description: "대형 기술 회사의 제품 개발 및 성장 경험이 풍부합니다.",
      avatar: "이",
      price: "60,000원/시간",
    },
    {
      id: "3",
      name: "박민호",
      title: "테크 스타트업 CTO",
      category: "기술",
      rating: 4.9,
      sessions: 150,
      expertise: ["아키텍처 설계", "팀 빌딩", "스케일링"],
      description: "스타트업부터 유니콘까지의 기술 리더십 경험이 있습니다.",
      avatar: "박",
      price: "55,000원/시간",
    },
    {
      id: "4",
      name: "최영희",
      title: "마케팅 디렉터",
      category: "마케팅",
      rating: 4.7,
      sessions: 80,
      expertise: ["성장 마케팅", "브랜딩", "콘텐츠 전략"],
      description: "SaaS 비즈니스의 성장 마케팅과 브랜딩 전문가입니다.",
      avatar: "최",
      price: "45,000원/시간",
    },
    {
      id: "5",
      name: "정태영",
      title: "법무 변호사",
      category: "법무",
      rating: 4.8,
      sessions: 60,
      expertise: ["스타트업 법무", "계약 검토", "지식재산권"],
      description: "스타트업의 법무 이슈와 계약 검토를 도와드립니다.",
      avatar: "정",
      price: "70,000원/시간",
    },
    {
      id: "6",
      name: "한소연",
      title: "데이터 사이언티스트",
      category: "데이터",
      rating: 4.9,
      sessions: 110,
      expertise: ["데이터 분석", "ML 모델링", "A/B 테스트"],
      description: "데이터 기반 의사결정과 머신러닝 모델 개발을 지원합니다.",
      avatar: "한",
      price: "50,000원/시간",
    },
  ];

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise.some((exp) =>
        exp.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory = category === "all" || mentor.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "비즈니스", "제품", "기술", "마케팅", "법무", "데이터"];

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      <main className="container mx-auto px-8 py-16 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              멘토링
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              경험 많은 전문가들의 조언과 멘토링을 받아보세요
            </p>

            {/* Search and Filter */}
            <div className="max-w-2xl mx-auto flex gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="멘토 이름, 전문분야로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border/40"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40 border-border/40 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {categories
                    .filter((cat) => cat !== "all")
                    .map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mentors Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor) => (
              <Card
                key={mentor.id}
                className="border-border/40 hover:border-border hover-lift transition-all cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-muted text-foreground text-lg">
                          {mentor.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{mentor.name}</CardTitle>
                        <CardDescription className="text-xs mb-2">
                          {mentor.title}
                        </CardDescription>
                        <div className="flex items-center gap-2">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm font-medium">{mentor.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({mentor.sessions}회)
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {mentor.category}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm mb-4">
                    {mentor.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Award className="w-3 h-3" />
                    <span className="font-medium">{mentor.price}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        전문 분야:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {mentor.expertise.map((exp, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-border/40"
                        onClick={() => {
                          // Handle schedule
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        일정 보기
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-border/40"
                        onClick={() => {
                          // Handle message
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        문의하기
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMentors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Mentoring;

