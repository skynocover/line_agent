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
import { useTodos } from '@/features/todo/hooks';

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

  const { todos, isLoading, handleEventAdd, handleEventUpdate, handleEventDelete } = useTodos({
    userId,
    currentDate,
    view,
    getTimeRange,
  });

  return (
    <div className="container mx-auto py-4 space-y-3">
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
