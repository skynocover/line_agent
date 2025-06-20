import { useState, useEffect } from 'react';
import { Menu, Home, FileText, CheckSquare, ChevronRight, LogOut } from 'lucide-react';
import { Toaster } from 'sonner';

import { createRootRoute, Outlet, Link, useSearch, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import { useAuthStore } from '@/features/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CalendarProvider } from '@/components/event-calendar/calendar-provider';

const RootComponent = () => {
  const { profile, isAuthenticated, isLoading, logout, refreshAuthState } = useAuthStore();

  const search = useSearch({ from: '__root__' }) as { to?: string };
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // 處理帶有 'to' 參數的 URL 重定向
  useEffect(() => {
    if (search.to && profile?.userId) {
      const targetPath = `/${profile.userId}/${search.to}`;
      navigate({ to: targetPath });
    }
  }, [search.to, profile?.userId, navigate]);

  // 在應用程式載入時檢查認證狀態
  useEffect(() => {
    refreshAuthState();
  }, [refreshAuthState]);

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
  ];

  // 渲染導航項目
  const renderNavItem = (item: (typeof navigationItems)[0], isMobile = false) => {
    const IconComponent = item.icon;
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
      green: 'bg-green-100 text-green-600 group-hover:bg-green-200',
      amber: 'bg-amber-100 text-amber-700 group-hover:bg-amber-200',
      purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
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
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-2 ml-6">
            {navigationItems.map((item) => renderNavItem(item, false))}
          </nav>

          {/* User Profile */}
          {isAuthenticated && profile && (
            <div className="ml-auto flex items-center gap-4">
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
            </div>
          )}
        </div>
      </header>

      <main className="py-2">
        <CalendarProvider>
          <Outlet />
        </CalendarProvider>
      </main>

      <TanStackRouterDevtools />
    </div>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
