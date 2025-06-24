import { useState, useEffect } from 'react';
import {
  Menu,
  Home,
  FileText,
  CheckSquare,
  ChevronRight,
  LogOut,
  LogIn,
  Settings,
  MessageSquareMore,
} from 'lucide-react';
import { Toaster } from 'sonner';

import { createRootRoute, Outlet, Link, useSearch, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import { useAuthStore } from '@/features/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CalendarProvider } from '@/components/event-calendar/calendar-provider';
import { isInLineApp } from '@/features/line/liff';

const RootComponent = () => {
  const { profile, isAuthenticated, isLoading, logout, refreshAuthState, autoLoginInLineApp } =
    useAuthStore();

  const search = useSearch({ from: '__root__' }) as { to?: string };
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // 回報表單網址
  const reportFormUrl = import.meta.env.VITE_REPORT_FORM;

  const handleReportClick = () => {
    if (reportFormUrl) {
      window.open(reportFormUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // 處理帶有 'to' 參數的 URL 重定向
  useEffect(() => {
    if (search.to && profile?.userId) {
      const targetPath = `/${profile.userId}/${search.to}`;
      navigate({ to: targetPath });
    }
  }, [search.to, profile?.userId, navigate]);

  // 在應用程式載入時檢查認證狀態
  useEffect(() => {
    // 根據是否在 LINE 內決定認證策略
    if (isInLineApp()) {
      // 在 LINE 內建瀏覽器中，執行自動登入
      autoLoginInLineApp();
    } else {
      // 在外部瀏覽器中，僅刷新認證狀態，不自動登入
      refreshAuthState();
    }
  }, [refreshAuthState, autoLoginInLineApp]);

  // 處理登出
  const handleLogout = async () => {
    await logout();
    setIsSheetOpen(false);
    navigate({ to: '/' });
  };

  // 導航項目配置
  const navigationItems = [
    {
      to: '/' as const,
      icon: Home,
      label: '首頁',
      description: '回到主頁面',
      color: 'blue',
      requireAuth: false,
    },
    {
      to: '/$userId/files' as const,
      icon: FileText,
      label: '檔案管理',
      description: '管理您的檔案',
      color: 'amber',
      requireAuth: true,
    },
    {
      to: '/$userId/todo' as const,
      icon: CheckSquare,
      label: '待辦清單',
      description: '管理您的任務',
      color: 'purple',
      requireAuth: true,
    },
    {
      to: '/$userId/settings' as const,
      icon: Settings,
      label: '設定',
      description: '管理系統設定',
      color: 'gray',
      requireAuth: true,
    },
  ];

  // 渲染導航項目
  const renderNavItem = (item: (typeof navigationItems)[0], isMobile = false) => {
    const IconComponent = item.icon;
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
      green: 'bg-green-100 text-green-600 group-hover:bg-green-200',
      amber: 'bg-amber-100 text-amber-700 group-hover:bg-amber-200',
      purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
      gray: 'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
    };

    // 如果需要認證但用戶未登入，不顯示該項目
    if (item.requireAuth && !isAuthenticated) {
      return null;
    }

    const linkProps =
      item.to === '/'
        ? { to: item.to }
        : {
            to: item.to,
            params: { userId: profile?.userId || '' },
          };

    if (isMobile) {
      return (
        <Link
          key={item.label}
          {...linkProps}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
          onClick={() => setIsSheetOpen(false)}
        >
          <div
            className={`p-2 rounded-md ${colorClasses[item.color as keyof typeof colorClasses]}`}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium">{item.label}</div>
            <div className="text-sm text-muted-foreground">{item.description}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      );
    }

    return (
      <Link
        key={item.label}
        {...linkProps}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground"
      >
        <IconComponent className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-2 mt-4">
                {navigationItems.map((item) => renderNavItem(item, true))}

                {/* 回報表單選項 */}
                {reportFormUrl && (
                  <button
                    onClick={() => {
                      handleReportClick();
                      setIsSheetOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group text-left"
                  >
                    <div className="p-2 rounded-md bg-orange-100 text-orange-600 group-hover:bg-orange-200">
                      <MessageSquareMore className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">問題回報</div>
                      <div className="text-sm text-muted-foreground">回報問題或提供建議</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-2 ml-6">
            {navigationItems.map((item) => renderNavItem(item, false))}
          </nav>

          {/* User Profile */}
          <div className="ml-auto flex items-center gap-4 mr-4">
            {/* 回報表單按鈕 */}
            {reportFormUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReportClick}
                title="問題回報與建議"
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageSquareMore className="h-4 w-4 mr-1" />
                回報
              </Button>
            )}

            {isAuthenticated && profile ? (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium">{profile.displayName}</span>
                  <span className="text-xs text-muted-foreground">ID: {profile.userId}</span>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.pictureUrl} alt={profile.displayName} />
                  <AvatarFallback>{profile.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Logout"
                  disabled={isLoading}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    try {
                      await useAuthStore.getState().login();
                    } catch (error) {
                      console.error('Login failed:', error);
                    }
                  }}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      登入中...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      LINE 登入
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="py-2">
        <CalendarProvider>
          <Outlet />
        </CalendarProvider>
      </main>

      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
