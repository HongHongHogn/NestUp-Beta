import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import NavigationBar from "@/components/NavigationBar";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "필수 항목을 모두 입력해주세요.",
      });
      return;
    }
    toast({
      title: "문의 전송됨",
      description: "곧 답변드리겠습니다.",
    });
    // Reset form
    setFormData({
      name: "",
      email: "",
      subject: "",
      category: "",
      message: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "이메일",
      content: "NestUp@gmail.com",
      description: "이메일로 문의사항을 보내주세요",
    },
    {
      icon: Phone,
      title: "전화",
      content: "02-7399-9023",
      description: "평일 09:00 - 18:00",
    },
    {
      icon: MapPin,
      title: "주소",
      content: "서울특별시 성북구",
      description: "방문은 사전 예약 필수",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      <main className="container mx-auto px-8 py-16 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Contact
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              문의사항이나 피드백을 남겨주세요. 빠르게 답변드리겠습니다.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-4">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <Card
                    key={index}
                    className="border-border/40 hover:border-border hover-lift transition-all"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="w-5 h-5 text-foreground" />
                        </div>
                        <CardTitle className="text-lg">{info.title}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {info.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-base font-medium">{info.content}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle>문의하기</CardTitle>
                  <CardDescription>
                    아래 양식을 작성해주시면 최대한 빠르게 답변드리겠습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          이름 <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="홍길동"
                          className="bg-background border-border/40"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          이메일 <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="example@email.com"
                          className="bg-background border-border/40"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="category" className="text-sm font-medium">
                          문의 분야
                        </label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger className="bg-background border-border/40">
                            <SelectValue placeholder="선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">일반 문의</SelectItem>
                            <SelectItem value="technical">기술 지원</SelectItem>
                            <SelectItem value="business">비즈니스 문의</SelectItem>
                            <SelectItem value="feedback">피드백</SelectItem>
                            <SelectItem value="other">기타</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="subject" className="text-sm font-medium">
                          제목
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="문의 제목"
                          className="bg-background border-border/40"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        메시지 <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="문의 내용을 입력해주세요..."
                        rows={6}
                        className="bg-background border-border/40 resize-none"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-md"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      전송하기
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;

