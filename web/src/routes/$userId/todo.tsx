import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { createFileRoute } from '@tanstack/react-router';

import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/date-time-picker';

interface Todo {
  id: number;
  title: string;
  content: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  isAllDay: boolean;
}

interface TodoGroup {
  date: string;
  todos: Todo[];
}

// Mock data
const mockTodos: TodoGroup[] = [
  {
    date: '2024-03-20',
    todos: [
      {
        id: 1,
        title: '完成專案報告',
        content: '需要整理上週的進度並準備週會簡報',
        startTime: '09:00',
        endTime: '11:00',
        completed: false,
        isAllDay: false,
      },
      {
        id: 2,
        title: '團隊會議',
        content: '討論新功能開發進度',
        startTime: '14:00',
        endTime: '15:00',
        completed: true,
        isAllDay: false,
      },
    ],
  },
  {
    date: '2024-03-21',
    todos: [
      {
        id: 3,
        title: '程式碼審查',
        content: '審查團隊成員的 PR',
        startTime: '10:00',
        endTime: '12:00',
        completed: false,
        isAllDay: false,
      },
    ],
  },
];

export const Route = createFileRoute('/$userId/todo')({
  component: RouteComponent,
});

function RouteComponent() {
  const [todos, setTodos] = useState<TodoGroup[]>(mockTodos);
  const [editingTodo, setEditingTodo] = useState<{ id: number; field: keyof Todo } | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});

  const handleTodoToggle = (dateIndex: number, todoIndex: number) => {
    const newTodos = [...todos];
    newTodos[dateIndex].todos[todoIndex].completed =
      !newTodos[dateIndex].todos[todoIndex].completed;
    setTodos(newTodos);
  };

  const handleTimeChange = (
    dateIndex: number,
    todoIndex: number,
    startTime: string,
    endTime: string,
    isAllDay: boolean,
  ) => {
    const newTodos = [...todos];
    const todo = newTodos[dateIndex].todos[todoIndex];

    todo.startTime = startTime;
    todo.endTime = endTime;
    todo.isAllDay = isAllDay;

    setTodos(newTodos);
  };

  const startEditing = (dateIndex: number, todoIndex: number, field: keyof Todo) => {
    const todo = todos[dateIndex].todos[todoIndex];
    setEditingTodo({ id: todo.id, field });
    setEditValues({ [field]: todo[field] as string });
  };

  const saveEdit = (dateIndex: number, todoIndex: number) => {
    if (!editingTodo) return;

    const newTodos = [...todos];
    const todo = newTodos[dateIndex].todos[todoIndex];
    const field = editingTodo.field;
    const value = editValues[field];

    if (field === 'title' || field === 'content') {
      todo[field] = value;
    }

    setTodos(newTodos);
    setEditingTodo(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setEditValues({});
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {todos.map((dateGroup, dateIndex) => (
        <div key={dateGroup.date} className="space-y-4">
          <h2 className="text-2xl font-bold">
            {format(new Date(dateGroup.date), 'yyyy年MM月dd日')}
          </h2>
          <div className="grid gap-2">
            {dateGroup.todos.map((todo, todoIndex) => (
              <Card key={todo.id}>
                <CardHeader className="flex flex-row items-center space-y-0">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => handleTodoToggle(dateIndex, todoIndex)}
                    className="mr-2"
                  />
                  {editingTodo?.id === todo.id && editingTodo.field === 'title' ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editValues.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditValues({ ...editValues, title: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => saveEdit(dateIndex, todoIndex)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <CardTitle className="text-lg flex-1">
                      {todo.title}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => startEditing(dateIndex, todoIndex, 'title')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
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
                          <Button size="sm" onClick={() => saveEdit(dateIndex, todoIndex)}>
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
                          onClick={() => startEditing(dateIndex, todoIndex, 'content')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <DateTimePicker
                          initialStartTime={todo.startTime}
                          initialEndTime={todo.endTime}
                          initialIsAllDay={todo.isAllDay}
                          onDateTimeChange={(startTime, endTime, isAllDay) => {
                            handleTimeChange(dateIndex, todoIndex, startTime, endTime, isAllDay);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
