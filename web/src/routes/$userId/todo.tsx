import { useState } from 'react';
import { format } from 'date-fns';
import { createFileRoute } from '@tanstack/react-router';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TODO } from '@/features/todo/TODO';
import type { EditValues } from '@/features/todo/TODO';
import type { CalendarEvent } from '@/components/event-calendar/types';

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

const FormSchema = z.object({
  isAllDay: z.boolean(),
});

type FormValues = z.infer<typeof FormSchema>;

function RouteComponent() {
  const [todos, setTodos] = useState<CalendarEvent[]>(mockTodos);
  const [editingTodo, setEditingTodo] = useState<{ id: number; field: keyof CalendarEvent } | null>(
    null,
  );
  const [editValues, setEditValues] = useState<Partial<EditValues>>({});
  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      isAllDay: false,
    },
  });

  // Group todos by date
  const groupedTodos = todos.reduce((groups, todo) => {
    const date = todo.start.toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(todo);
    return groups;
  }, {} as { [key: string]: CalendarEvent[] });

  // Sort dates
  const sortedDates = Object.keys(groupedTodos).sort();

  const handleTodoToggle = (todoId: number) => {
    setTodos(
      todos.map((todo) => (todo.id === todoId ? { ...todo, completed: !todo.completed } : todo)),
    );
  };

  const startEditing = (todoId: number) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    setEditingTodo({ id: todoId, field: 'title' });
    setEditValues({
      title: todo.title,
      description: todo.description,
      start: todo.start,
      end: todo.end,
      allDay: todo.allDay,
    });
    setExpandedTodos(new Set([...expandedTodos, todoId]));
  };

  const saveEdit = (todoId: number) => {
    if (!editingTodo) return;

    setTodos(
      todos.map((todo) => {
        if (todo.id === todoId) {
          return {
            ...todo,
            title: editValues.title as string,
            description: editValues.description as string,
            start: editValues.start as Date,
            end: editValues.end as Date,
            allDay: editValues.allDay as boolean,
          };
        }
        return todo;
      }),
    );

    setEditingTodo(null);
    setEditValues({});
    setExpandedTodos(new Set([...expandedTodos].filter((id) => id !== todoId)));
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setEditValues({});
    setExpandedTodos(new Set([...expandedTodos].filter((id) => id !== editingTodo?.id)));
  };

  return (
    <div className="container mx-auto py-4 space-y-3">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-2 border-b">
          <h2 className="text-lg font-semibold text-left ml-2">
            {format(new Date(date), 'yyyy年MM月dd日')}
          </h2>
          <div className="space-y-0">
            {groupedTodos[date].map((todo) => (
              <TODO
                key={todo.id}
                todo={todo}
                editingTodo={editingTodo}
                editValues={editValues}
                expandedTodos={expandedTodos}
                handleTodoToggle={handleTodoToggle}
                startEditing={startEditing}
                saveEdit={saveEdit}
                cancelEdit={cancelEdit}
                setEditValues={setEditValues}
                form={form}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
