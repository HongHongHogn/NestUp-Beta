import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Copy, Grid3x3, Search } from "lucide-react";
import NavigationBar from "@/components/NavigationBar";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

const Templates = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const templates = [
    {
      id: "1",
      title: "비즈니스 아이디어 검증 템플릿",
      category: "검증",
      description: "아이디어의 시장 가능성을 체계적으로 분석하기 위한 템플릿",
      icon: FileText,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      id: "2",
      title: "시장 분석 템플릿",
      category: "분석",
      description: "타겟 시장의 규모, 성장성, 트렌드를 분석하는 템플릿",
      icon: Grid3x3,
      color: "bg-green-500/10 text-green-500",
    },
    {
      id: "3",
      title: "경쟁사 분석 템플릿",
      category: "분석",
      description: "경쟁사의 강점과 약점을 비교 분석하는 템플릿",
      icon: Search,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      id: "4",
      title: "수익 모델 검증 템플릿",
      category: "검증",
      description: "수익 구조와 수익성을 검증하는 템플릿",
      icon: FileText,
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      id: "5",
      title: "사용자 페르소나 템플릿",
      category: "연구",
      description: "타겟 고객의 특성과 니즈를 정의하는 템플릿",
      icon: Grid3x3,
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      id: "6",
      title: "프로덕트 로드맵 템플릿",
      category: "기획",
      description: "제품 개발 단계와 우선순위를 계획하는 템플릿",
      icon: FileText,
      color: "bg-indigo-500/10 text-indigo-500",
    },
  ];

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (templateId: string) => {
    navigator.clipboard.writeText(`템플릿 ID: ${templateId}`);
    toast({
      title: "복사됨",
      description: "템플릿 ID가 클립보드에 복사되었습니다.",
    });
  };

  const handleDownload = (templateId: string) => {
    toast({
      title: "다운로드",
      description: "템플릿 다운로드를 준비 중입니다.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      <main className="container mx-auto px-8 py-16 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              템플릿
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              비즈니스 아이디어 검증과 분석을 위한 다양한 템플릿을 활용하세요
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="템플릿 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border/40"
                />
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="border-border/40 hover:border-border hover-lift transition-all cursor-pointer group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mb-2">{template.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-border/40"
                        onClick={() => handleCopy(template.id)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        복사
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-border/40"
                        onClick={() => handleDownload(template.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        다운로드
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Templates;

