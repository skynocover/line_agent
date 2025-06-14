import { useState } from 'react';
import { Pencil, Check, X, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
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

  const handleTimeChange = (todoId: number, startTime: string, endTime: string) => {
    setTodos(todos.map((todo) => (todo.id === todoId ? { ...todo, startTime, endTime } : todo)));
  };

  const handleAllDayChange = (todoId: number, isAllDay: boolean) => {
    setTodos(todos.map((todo) => (todo.id === todoId ? { ...todo, isAllDay } : todo)));
  };

  const startEditing = (todoId: number, field: keyof Todo) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    setEditingTodo({ id: todoId, field });
    setEditValues({ [field]: todo[field] as string });
  };

  const saveEdit = (todoId: number) => {
    if (!editingTodo) return;

    setTodos(
      todos.map((todo) => {
        if (todo.id === todoId) {
          const field = editingTodo.field;
          const value = editValues[field];
          return { ...todo, [field]: value };
        }
        return todo;
      }),
    );

    setEditingTodo(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setEditValues({});
  };

  const toggleTodoExpand = (todoId: number) => {
    setExpandedTodos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(todoId)) {
        newSet.delete(todoId);
      } else {
        newSet.add(todoId);
      }
      return newSet;
    });
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-6 w-6 mr-1"
                    onClick={() => toggleTodoExpand(todo.id)}
                  >
                    {expandedTodos.has(todo.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  {editingTodo?.id === todo.id && editingTodo.field === 'title' ? (
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
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`text-lg ${todo.completed ? 'line-through' : ''}`}>
                        {todo.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {todo.isAllDay ? '全天' : `${todo.startTime} - ${todo.endTime}`}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => startEditing(todo.id, 'title')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {!todo.completed && expandedTodos.has(todo.id) && (
                  <div className="mt-2 space-y-1 ml-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Calendar className="mr-2 h-4 w-4" />
                              {format(new Date(todo.date), 'yyyy-MM-dd')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={new Date(todo.date)}
                              onSelect={(date) => {
                                if (date) {
                                  const formattedDate = format(date, 'yyyy-MM-dd');
                                  setTodos(
                                    todos.map((t) =>
                                      t.id === todo.id ? { ...t, date: formattedDate } : t,
                                    ),
                                  );
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
                                    checked={todo.isAllDay}
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked);
                                      handleAllDayChange(todo.id, checked);
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </Form>
                      </div>
                    </div>

                    {!todo.isAllDay && (
                      <DateTimePicker
                        initialStartTime={todo.startTime}
                        initialEndTime={todo.endTime}
                        onDateTimeChange={(startTime, endTime) => {
                          handleTimeChange(todo.id, startTime, endTime);
                        }}
                        className="flex-1"
                      />
                    )}

                    {editingTodo?.id === todo.id && editingTodo.field === 'content' ? (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={editValues.content}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setEditValues({ ...editValues, content: e.target.value })
                          }
                          className="flex-1"
                        />
                        <div className="flex flex-col gap-2">
                          <Button size="sm" onClick={() => saveEdit(todo.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {todo.content}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={() => startEditing(todo.id, 'content')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </p>
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
