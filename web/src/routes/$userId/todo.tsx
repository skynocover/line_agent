import { useCallback } from 'react';
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
import { useCalendarContext } from '@/components/event-calendar/calendar-context';
import type { CalendarEvent } from '@/components/event-calendar/types';
import { useTodos } from '@/features/todo/hooks';
import { ExpiredTodoList } from '@/features/todo/expiredtodo';

export const Route = createFileRoute('/$userId/todo')({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = useParams({ from: '/$userId/todo' });
  const { currentDate, view } = useCalendarContext();

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
      <ExpiredTodoList
        expiredTodos={incompleteExpiredTodos}
        isLoading={isLoadingIncompleteExpiredTodos}
        onToggleComplete={handleToggleComplete}
        onEventEdit={(event) => {
          // The EventCalendar component will handle the event dialog
          // We can use a ref or create an event to trigger the dialog
          const editEvent = new CustomEvent('edit-expired-todo', { detail: event });
          window.dispatchEvent(editEvent);
        }}
        showDate={true}
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
  );
}
