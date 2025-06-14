import { useEffect } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { Toaster } from 'sonner';

import { createRootRoute, Outlet, Link, useSearch, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import { useAuthStore } from '@/features/auth/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                <Link to="/" className="text-lg font-medium hover:text-primary">
                  Home
                </Link>
                <Link
                  to="/$userId/files"
                  params={{ userId: profile?.userId || '' }}
                  className="text-lg font-medium hover:text-primary"
                >
                  Files
                </Link>

                <Link
                  to="/$userId/todo"
                  params={{ userId: profile?.userId || '' }}
                  className="text-lg font-medium hover:text-primary"
                >
                  Todo list
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 ml-6">
            <Link to="/" className="text-sm font-medium hover:text-primary [&.active]:text-primary">
              Home
            </Link>
            <Link
              to="/$userId/files"
              params={{ userId: profile?.userId || '' }}
              className="text-sm font-medium hover:text-primary [&.active]:text-primary"
            >
              Files
            </Link>
            <Link
              to="/$userId/todo"
              params={{ userId: profile?.userId || '' }}
              className="text-sm font-medium hover:text-primary [&.active]:text-primary"
            >
              Todo list
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
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
