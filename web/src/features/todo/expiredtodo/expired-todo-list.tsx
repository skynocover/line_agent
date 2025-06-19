import { useState, useMemo, useCallback } from 'react';
import { EventItem } from '@/components/event-calendar/event-item';
import type { CalendarEvent } from '@/components/event-calendar/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExpiredTodoListProps {
  expiredTodos: CalendarEvent[];
  isLoading: boolean;
  onToggleComplete: (eventId: number) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  itemsPerPage?: number;
  showDate?: boolean;
}

export function ExpiredTodoList({
  expiredTodos,
  isLoading,
  onToggleComplete,
  onEventEdit,
  itemsPerPage = 5,
  showDate = false,
}: ExpiredTodoListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination logic for expired todos
  const paginatedExpiredTodos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return expiredTodos.slice(startIndex, endIndex);
  }, [expiredTodos, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(expiredTodos.length / itemsPerPage);

  const handleToggleComplete = useCallback(
    async (eventId: number) => {
      onToggleComplete(eventId);
    },
    [onToggleComplete],
  );

  if (expiredTodos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-destructive">
          過期未完成項目 ({expiredTodos.length})
        </h2>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">載入中...</div>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedExpiredTodos.map((todo: CalendarEvent) => (
              <div
                key={todo.id}
                className="border rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onDoubleClick={() => onEventEdit?.(todo)}
                title="雙擊編輯"
              >
                <EventItem
                  event={todo}
                  view="agenda"
                  onToggleComplete={handleToggleComplete}
                  showDate={showDate}
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
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                上一頁
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-8 h-8 p-0',
                      page === currentPage && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                下一頁
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
