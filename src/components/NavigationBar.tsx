import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Zap, History, User, LogOut, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface NavigationBarProps {
  showLogo?: boolean;
}

const NavigationBar = ({ showLogo = true }: NavigationBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const userInitials = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  const navItems = user
    ? [
        { label: "검증하기", path: "/validate", icon: null },
        { label: "대시보드", path: "/dashboard", icon: null },
        { label: "템플릿", path: "/templates", icon: null },
        { label: "팀 찾기", path: "/team", icon: null },
        { label: "멘토링", path: "/mentoring", icon: null },
        { label: "Contact", path: "/contact", icon: null },
      ]
    : [
        { label: "검증하기", path: "/validate", icon: null },
        { label: "대시보드", path: "/dashboard", icon: null },
        { label: "템플릿", path: "/templates", icon: null },
        { label: "팀 찾기", path: "/team", icon: null },
        { label: "멘토링", path: "/mentoring", icon: null },
        { label: "Contact", path: "/contact", icon: null },
      ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path.startsWith("/#")) {
      const hash = path.replace("/#", "");
      return location.hash === `#${hash}` || (location.pathname === "/" && !location.hash && hash === "features");
    }
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background transition-linear">
      <div className="relative flex h-16 items-center px-16 lg:px-28 xl:px-32 max-w-[1200px] mx-auto">
        {/* Left: Logo */}
        {showLogo && (
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            onClick={() => navigate("/")}
          >
            <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
              <Zap className="w-4 h-4 text-background" />
            </div>
            <span className="text-sm font-semibold text-foreground">IdeaScout</span>
          </div>
        )}

        {/* Center: Navigation Menu */}
        <nav className="flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            return (
              <button
                key={item.path}
                onClick={() => {
                  if (item.path.startsWith("/#")) {
                    const hash = item.path.replace("/#", "");
                    if (location.pathname === "/") {
                      const element = document.getElementById(hash);
                      element?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      navigate(`/#${hash}`);
                    }
                  } else {
                    navigate(item.path);
                  }
                }}
                className={cn(
                  "text-sm font-medium transition-colors whitespace-nowrap",
                  isActive(item.path)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: User Actions */}
        <div className="ml-auto flex items-center gap-4 flex-shrink-0">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("/dashboard")}
                title="히스토리"
              >
                <History className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-foreground text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || "사용자"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>프로필</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <History className="mr-2 h-4 w-4" />
                    <span>히스토리</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                로그인
              </button>
              <Button 
                size="sm" 
                onClick={() => navigate("/signup")}
                className="bg-foreground text-background hover:bg-foreground/90 h-8 px-4 rounded-md"
              >
                시작하기
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavigationBar;

