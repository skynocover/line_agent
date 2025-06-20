import { useCallback, useEffect } from 'react';
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addDays,
} from 'date-fns';
import { toast } from 'sonner';

import { useAuthStore } from '@/features/auth/authStore';

import { EventCalendar } from '@/components/event-calendar';
import { useCalendarContext } from '@/components/event-calendar/calendar-context';
import type { CalendarEvent } from '@/components/event-calendar/types';
import { useTodos } from '@/features/todo/hooks';
import { ExpiredTodoList } from '@/features/todo/expiredtodo';

export const Route = createFileRoute('/$userId/todo')({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = useParams({ from: '/$userId/todo' });
  const navigate = useNavigate();
  const { checkAuth, profile, isAuthenticated } = useAuthStore();
  const { currentDate, view } = useCalendarContext();

  // 認證檢查
  useEffect(() => {
    const handleAuth = async () => {
      const success = await checkAuth();
      if (!success || !profile) {
        // 如果認證失敗，導向首頁
        navigate({ to: '/' });
        toast.error('請先登入 LINE 帳號');
      } else if (profile.userId !== userId) {
        // 如果 userId 不匹配，導向正確的用戶頁面
        navigate({ to: `/${profile.userId}/todo` });
      }
    };

    if (!isAuthenticated) {
      handleAuth();
    } else if (profile && profile.userId !== userId) {
      navigate({ to: `/${profile.userId}/todo` });
    }
  }, [checkAuth, profile, isAuthenticated, userId, navigate]);

  const getTimeRange = useCallback(() => {
    let startTime: Date;
    let endTime: Date;

    switch (view) {
      case 'month':
        startTime = startOfMonth(currentDate);
        endTime = endOfMonth(currentDate);
        break;
      case 'week':
        startTime = startOfWeek(currentDate, { weekStartsOn: 0 });
        endTime = endOfWeek(currentDate, { weekStartsOn: 0 });
        break;
      case 'day':
        startTime = startOfDay(currentDate);
        endTime = endOfDay(currentDate);
        break;
      case 'agenda':
        startTime = startOfDay(currentDate);
        endTime = addDays(startTime, 30); // Show 30 days in agenda view
        break;
      default:
        startTime = startOfMonth(currentDate);
        endTime = endOfMonth(currentDate);
    }

    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
  }, [currentDate, view]);

  // TODO: 處理error
  const {
    todos,
    isLoading,
    handleEventAdd,
    handleEventUpdate,
    handleEventDelete,
    incompleteExpiredTodos,
    isLoadingIncompleteExpiredTodos,
  } = useTodos({
    userId,
    currentDate,
    view,
    getTimeRange,
  });

  const handleToggleComplete = useCallback(
    async (todo: CalendarEvent) => {
      await handleEventUpdate({ ...todo, completed: true });
    },
    [handleEventUpdate],
  );

  return (
    <div className="container mx-auto py-4 space-y-6">
      <div className="max-w-[1200px] mx-auto w-full space-y-6">
        {/* Expired Incomplete Todos Section */}
        <ExpiredTodoList
          expiredTodos={incompleteExpiredTodos}
          isLoading={isLoadingIncompleteExpiredTodos}
          onToggleComplete={handleToggleComplete}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
        />

        {/* Calendar Section */}
        <EventCalendar
          events={todos}
          onEventAdd={handleEventAdd}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
