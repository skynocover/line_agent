import { useEffect, useState } from 'react';
import { Menu, Home, FileText, CheckSquare, ChevronRight, LogOut } from 'lucide-react';
import { Toaster } from 'sonner';

import { createRootRoute, Outlet, Link, useSearch, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import { useAuthStore } from '@/features/auth/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CalendarProvider } from '@/components/event-calendar/calendar-provider';

const RootComponent = () => {
  const { checkAuth, profile, isAuthenticated, logout } = useAuthStore();
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const search = useSearch({ from: '__root__' }) as { to?: string };
  const navigate = useNavigate();

  if (search.to) {
    navigate({ to: `/${profile?.userId}/${search.to}` });
  }

  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
                <Link
                  to="/"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                  onClick={() => setIsSheetOpen(false)}
                >
                  <div className="p-2 rounded-md bg-blue-100 text-blue-600 group-hover:bg-blue-200">
                    <Home className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">首頁</div>
                    <div className="text-sm text-muted-foreground">回到主頁面</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/$userId/files"
                  params={{ userId: profile?.userId || '' }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                  onClick={() => setIsSheetOpen(false)}
                >
                  <div className="p-2 rounded-md bg-green-100 text-green-600 group-hover:bg-green-200">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">檔案管理</div>
                    <div className="text-sm text-muted-foreground">管理您的檔案</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/$userId/todo"
                  params={{ userId: profile?.userId || '' }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                  onClick={() => setIsSheetOpen(false)}
                >
                  <div className="p-2 rounded-md bg-purple-100 text-purple-600 group-hover:bg-purple-200">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">待辦清單</div>
                    <div className="text-sm text-muted-foreground">管理您的任務</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-2 ml-6">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground"
            >
              <Home className="h-4 w-4" />
              首頁
            </Link>
            <Link
              to="/$userId/files"
              params={{ userId: profile?.userId || '' }}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground"
            >
              <FileText className="h-4 w-4" />
              檔案管理
            </Link>
            <Link
              to="/$userId/todo"
              params={{ userId: profile?.userId || '' }}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground"
            >
              <CheckSquare className="h-4 w-4" />
              待辦清單
            </Link>
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
              <Button variant="ghost" size="icon" onClick={logout} title="Logout">
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
