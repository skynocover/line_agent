import { useState } from 'react';
import { Pencil, Check, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { createFileRoute } from '@tanstack/react-router';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/date-time-picker';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';

interface Todo {
  id: number;
  title: string;
  content: string;
  date: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  isAllDay: boolean;
}

type EditValues = {
  title: string;
  content: string;
  date: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
};

// Mock data
const mockTodos: Todo[] = [
  {
    id: 1,
    title: '完成專案報告',
    content: '需要整理上週的進度並準備週會簡報',
    date: '2024-03-20',
    startTime: '09:00',
    endTime: '11:00',
    completed: false,
    isAllDay: false,
  },
  {
    id: 2,
    title: '團隊會議',
    content: '討論新功能開發進度',
    date: '2024-03-20',
    startTime: '14:00',
    endTime: '15:00',
    completed: true,
    isAllDay: false,
  },
  {
    id: 3,
    title: '程式碼審查',
    content: '審查團隊成員的 PR',
    date: '2024-03-21',
    startTime: '10:00',
    endTime: '12:00',
    completed: false,
    isAllDay: false,
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
  const [todos, setTodos] = useState<Todo[]>(mockTodos);
  const [editingTodo, setEditingTodo] = useState<{ id: number; field: keyof Todo } | null>(null);
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
    const date = todo.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(todo);
    return groups;
  }, {} as { [key: string]: Todo[] });

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
      content: todo.content,
      date: todo.date,
      startTime: todo.startTime,
      endTime: todo.endTime,
      isAllDay: todo.isAllDay,
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
            content: editValues.content as string,
            date: editValues.date as string,
            startTime: editValues.startTime as string,
            endTime: editValues.endTime as string,
            isAllDay: editValues.isAllDay as boolean,
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
              <div key={todo.id} className="px-3 pb-2">
                <div className="flex flex-row items-center space-y-0">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => handleTodoToggle(todo.id)}
                    className="mr-2"
                  />
                  {editingTodo?.id === todo.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editValues.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditValues({ ...editValues, title: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => saveEdit(todo.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`text-lg ${todo.completed ? 'line-through' : ''}`}>
                          {todo.title}
                        </div>
                        <div
                          className={`text-sm text-muted-foreground ${
                            todo.completed ? 'line-through' : ''
                          }`}
                        >
                          {todo.isAllDay ? '全天' : `${todo.startTime} - ${todo.endTime}`}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={() => startEditing(todo.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {!expandedTodos.has(todo.id) && todo.content && !todo.completed && (
                  <div className="text-sm text-muted-foreground line-clamp-1 ml-6">
                    {todo.content}
                  </div>
                )}
                {!todo.completed && expandedTodos.has(todo.id) && (
                  <div className="mt-2 space-y-1 ml-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Calendar className="mr-2 h-4 w-4" />
                              {editingTodo?.id === todo.id
                                ? format(new Date(editValues.date as string), 'yyyy-MM-dd')
                                : format(new Date(todo.date), 'yyyy-MM-dd')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={
                                editingTodo?.id === todo.id
                                  ? new Date(editValues.date as string)
                                  : new Date(todo.date)
                              }
                              onSelect={(date) => {
                                if (date) {
                                  const formattedDate = format(date, 'yyyy-MM-dd');
                                  if (editingTodo?.id === todo.id) {
                                    setEditValues({ ...editValues, date: formattedDate });
                                  }
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Form {...form}>
                          <FormField
                            control={form.control}
                            name="isAllDay"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-y-0">
                                <FormLabel>全天</FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={
                                      editingTodo?.id === todo.id
                                        ? (editValues.isAllDay as boolean)
                                        : todo.isAllDay
                                    }
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked);
                                      if (editingTodo?.id === todo.id) {
                                        setEditValues({ ...editValues, isAllDay: checked });
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </Form>
                      </div>
                    </div>

                    {!(editingTodo?.id === todo.id ? editValues.isAllDay : todo.isAllDay) && (
                      <DateTimePicker
                        initialStartTime={
                          editingTodo?.id === todo.id
                            ? (editValues.startTime as string)
                            : todo.startTime
                        }
                        initialEndTime={
                          editingTodo?.id === todo.id
                            ? (editValues.endTime as string)
                            : todo.endTime
                        }
                        onDateTimeChange={(startTime, endTime) => {
                          if (editingTodo?.id === todo.id) {
                            setEditValues({ ...editValues, startTime, endTime });
                          }
                        }}
                        className="flex-1"
                      />
                    )}

                    {editingTodo?.id === todo.id ? (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={editValues.content}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setEditValues({ ...editValues, content: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{todo.content}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
