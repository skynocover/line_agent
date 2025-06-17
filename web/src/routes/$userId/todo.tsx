import { useState, useCallback, useEffect } from 'react';
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

import type { CalendarEvent } from '@/components/event-calendar/types';
import { EventCalendar } from '@/components/event-calendar';
import { useCalendarContext } from '@/components/event-calendar/calendar-context';
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/features/todo/api';

export const Route = createFileRoute('/$userId/todo')({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = useParams({ from: '/$userId/todo' });
  const [todos, setTodos] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
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

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { startTime, endTime } = getTimeRange();
      const response = await getEvents(userId, {
        page: 1,
        limit: 50,
        startTime,
        endTime,
      });
      setTodos(response.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [getTimeRange, userId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventAdd = useCallback(
    async (event: CalendarEvent) => {
      try {
        const newEvent = await createEvent(userId, event);
        setTodos((prevTodos) => [...prevTodos, newEvent]);
      } catch (error) {
        console.error('Error creating event:', error);
      }
    },
    [userId],
  );

  const handleEventUpdate = useCallback(
    async (event: CalendarEvent) => {
      try {
        const updatedEvent = await updateEvent(userId, event.id, event);
        setTodos((prevTodos) =>
          prevTodos.map((todo) => (todo.id === event.id ? updatedEvent : todo)),
        );
      } catch (error) {
        console.error('Error updating event:', error);
      }
    },
    [userId],
  );

  const handleEventDelete = useCallback(
    async (eventId: number) => {
      try {
        await deleteEvent(userId, eventId);
        setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== eventId));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    },
    [userId],
  );

  return (
    <div className="container mx-auto py-4 space-y-3">
      <EventCalendar
        events={todos}
        onEventAdd={handleEventAdd}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        loading={loading}
      />
    </div>
  );
}
