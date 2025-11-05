import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Zap, User, Mail, Shield, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import NavigationBar from "@/components/NavigationBar";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (!name.trim()) {
      toast({ variant: "destructive", title: "오류", description: "이름을 입력해주세요." });
      return;
    }

    setLoading(true);
    try {
      // TODO: 프로필 업데이트 API 호출 (백엔드에 아직 없음)
      toast({ title: "프로필 업데이트", description: "프로필이 업데이트되었습니다." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "오류", description: err.message || "업데이트에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // TODO: 계정 삭제 API 호출 (백엔드에 아직 없음)
      toast({ title: "계정 삭제", description: "계정이 삭제되었습니다." });
      logout();
      navigate("/");
    } catch (err: any) {
      toast({ variant: "destructive", title: "오류", description: err.message || "계정 삭제에 실패했습니다." });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 border-t border-border/40">
        <div className="max-w-2xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">내 프로필</h1>
            <p className="text-muted-foreground">
              계정 정보를 관리하세요
            </p>
          </div>

          {/* Profile Information */}
          <Card className="mb-6 border-white/20 hover:border-white/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-foreground" />
                계정 정보
              </CardTitle>
              <CardDescription>
                개인 정보를 확인하고 수정할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    이메일은 변경할 수 없습니다
                  </p>
                </div>
                <Button type="submit" disabled={loading}>
                  정보 업데이트
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="mb-6 border-white/20 hover:border-white/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-foreground" />
                보안
              </CardTitle>
              <CardDescription>
                비밀번호 변경 등 보안 설정
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                비밀번호 변경 기능은 곧 추가될 예정입니다.
              </p>
              <Button variant="outline" disabled>
                비밀번호 변경
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-white/20 hover:border-white/40 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">위험한 작업</CardTitle>
              <CardDescription>
                계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    계정 삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>계정 삭제 확인</AlertDialogTitle>
                    <AlertDialogDescription>
                      정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 리포트와 데이터가 영구적으로 삭제됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;

