import { useCallback, useState, useMemo } from 'react';
import { createFileRoute, useParams } from '@tanstack/react-router';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addDays,
} from 'date-fns';

import { EventCalendar } from '@/components/event-calendar';
import { EventItem } from '@/components/event-calendar/event-item';
import { useCalendarContext } from '@/components/event-calendar/calendar-context';
import type { CalendarEvent } from '@/components/event-calendar/types';
import { useTodos } from '@/features/todo/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/$userId/todo')({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = useParams({ from: '/$userId/todo' });
  const { currentDate, view } = useCalendarContext();
  const [expiredCurrentPage, setExpiredCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  // Pagination logic for expired todos
  const paginatedExpiredTodos = useMemo(() => {
    const startIndex = (expiredCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return incompleteExpiredTodos.slice(startIndex, endIndex);
  }, [incompleteExpiredTodos, expiredCurrentPage, itemsPerPage]);

  const totalPages = Math.ceil(incompleteExpiredTodos.length / itemsPerPage);

  const handleToggleComplete = useCallback(
    async (eventId: number) => {
      const todo = incompleteExpiredTodos.find((t: CalendarEvent) => t.id === eventId);
      if (todo) {
        await handleEventUpdate({
          ...todo,
          completed: !todo.completed,
        });
      }
    },
    [incompleteExpiredTodos, handleEventUpdate],
  );

  return (
    <div className="container mx-auto py-4 space-y-6">
      {/* Expired Incomplete Todos Section */}
      {incompleteExpiredTodos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-destructive">
              過期未完成項目 ({incompleteExpiredTodos.length})
            </h2>
          </div>

          {isLoadingIncompleteExpiredTodos ? (
            <div className="text-center py-4 text-muted-foreground">載入中...</div>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedExpiredTodos.map((todo: CalendarEvent) => (
                  <div key={todo.id} className="border rounded-lg p-2">
                    <EventItem
                      event={todo}
                      view="agenda"
                      onToggleComplete={handleToggleComplete}
                      onClick={(e) => {
                        e.preventDefault();
                        // Handle edit event if needed
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpiredCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={expiredCurrentPage === 1}
                  >
                    上一頁
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === expiredCurrentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setExpiredCurrentPage(page)}
                        className={cn(
                          'w-8 h-8 p-0',
                          page === expiredCurrentPage && 'bg-primary text-primary-foreground',
                        )}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpiredCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={expiredCurrentPage === totalPages}
                  >
                    下一頁
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Calendar Section */}
      <EventCalendar
        events={todos}
        onEventAdd={handleEventAdd}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        loading={isLoading}
      />
    </div>
  );
}
