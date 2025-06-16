import { useState, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import type { CalendarEvent } from '@/components/event-calendar/types';
import { EventCalendar } from '@/components/event-calendar';
import { CalendarProvider } from '@/components/event-calendar/calendar-provider';

// Mock data
const mockTodos: CalendarEvent[] = [
  {
    id: 1,
    title: '完成專案報告',
    description: '需要整理上週的進度並準備週會簡報',
    start: new Date('2025-06-15 09:00'),
    end: new Date('2025-06-15 11:00'),
    completed: false,
    allDay: false,
  },
  {
    id: 2,
    title: '團隊會議',
    description: '討論新功能開發進度',
    start: new Date('2025-06-20 10:00'),
    end: new Date('2025-06-22 14:00'),
    completed: true,
    allDay: false,
  },
  {
    id: 3,
    title: '程式碼審查',
    description: '審查團隊成員的 PR',
    start: new Date('2025-06-05 10:00'),
    end: new Date('2025-06-05 12:00'),
    completed: false,
    allDay: false,
  },
];

export const Route = createFileRoute('/$userId/todo')({
  component: RouteComponent,
});

function RouteComponent() {
  const [todos, setTodos] = useState<CalendarEvent[]>(mockTodos);

  const handleEventAdd = useCallback((event: CalendarEvent) => {
    setTodos((prevTodos) => [...prevTodos, event]);
  }, []);

  const handleEventUpdate = useCallback((event: CalendarEvent) => {
    setTodos((prevTodos) => prevTodos.map((todo) => (todo.id === event.id ? event : todo)));
  }, []);

  const handleEventDelete = useCallback((eventId: number) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== eventId));
  }, []);

  return (
    <div className="container mx-auto py-4 space-y-3">
      <CalendarProvider>
        <EventCalendar
          events={todos}
          onEventAdd={handleEventAdd}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
        />
      </CalendarProvider>
    </div>
  );
}
