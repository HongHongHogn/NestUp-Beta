import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, MapPin, Briefcase, Plus, MessageCircle } from "lucide-react";
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

const Team = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");

  const teams = [
    {
      id: "1",
      name: "스타트업 개발 팀",
      category: "개발",
      location: "서울",
      lookingFor: ["프론트엔드 개발자", "백엔드 개발자"],
      description: "AI 기반 SaaS 플랫폼을 개발하는 팀입니다.",
      members: 3,
      maxMembers: 6,
      avatar: "S",
    },
    {
      id: "2",
      name: "디자인 스튜디오",
      category: "디자인",
      location: "부산",
      lookingFor: ["UI/UX 디자이너", "브랜드 디자이너"],
      description: "브랜드 아이덴티티와 사용자 경험을 설계합니다.",
      members: 2,
      maxMembers: 5,
      avatar: "D",
    },
    {
      id: "3",
      name: "마케팅 팀",
      category: "마케팅",
      location: "경기",
      lookingFor: ["디지털 마케터", "콘텐츠 기획자"],
      description: "성장하는 스타트업의 마케팅 전략을 수립합니다.",
      members: 4,
      maxMembers: 7,
      avatar: "M",
    },
    {
      id: "4",
      name: "비즈니스 개발",
      category: "비즈니스",
      location: "서울",
      lookingFor: ["비즈니스 개발 매니저", "파트너십 매니저"],
      description: "전략적 파트너십과 비즈니스 기회를 발굴합니다.",
      members: 2,
      maxMembers: 4,
      avatar: "B",
    },
    {
      id: "5",
      name: "데이터 분석 팀",
      category: "데이터",
      location: "서울",
      lookingFor: ["데이터 분석가", "ML 엔지니어"],
      description: "데이터 기반 의사결정을 지원하는 팀입니다.",
      members: 3,
      maxMembers: 5,
      avatar: "DA",
    },
    {
      id: "6",
      name: "제품 기획 팀",
      category: "기획",
      location: "인천",
      lookingFor: ["제품 매니저", "프로덕트 오너"],
      description: "사용자 중심의 제품을 기획하고 개발합니다.",
      members: 2,
      maxMembers: 5,
      avatar: "P",
    },
  ];

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.lookingFor.some((role) =>
        role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory = category === "all" || team.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "개발", "디자인", "마케팅", "비즈니스", "데이터", "기획"];

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      <main className="container mx-auto px-8 py-16 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              팀 찾기
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              함께 성장할 팀원을 찾거나 프로젝트에 합류하세요
            </p>

            {/* Search and Filter */}
            <div className="max-w-2xl mx-auto flex gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="팀 이름, 역할, 기술 스택으로 검색..."
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

            {/* Create Team Button */}
            <div className="flex justify-center mb-8">
              <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-md">
                <Plus className="w-4 h-4 mr-2" />
                새 팀 만들기
              </Button>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <Card
                key={team.id}
                className="border-border/40 hover:border-border hover-lift transition-all cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-muted text-foreground">
                          {team.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg mb-1">{team.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {team.location}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {team.category}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm mb-4">
                    {team.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>
                      {team.members}/{team.maxMembers} 명
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        모집 중:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {team.lookingFor.map((role, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-border/40"
                      onClick={() => {
                        // Handle contact
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      연락하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTeams.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Team;

