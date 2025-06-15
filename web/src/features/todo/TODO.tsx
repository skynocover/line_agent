import { Pencil, Check, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/date-time-picker';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { type UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import type { CalendarEvent } from '@/components/event-calendar/types';

export type EditValues = {
  title: string;
  description: string;
  start: Date;
  end: Date;
  allDay: boolean;
};

export type EditingTodo = { id: number; field: keyof CalendarEvent };

export const TODO = ({
  todo,
  editingTodo,
  editValues,
  expandedTodos,
  handleTodoToggle,
  startEditing,
  saveEdit,
  cancelEdit,
  setEditValues,
  form,
}: {
  todo: CalendarEvent;
  editingTodo: EditingTodo | null;
  editValues: Partial<EditValues>;
  expandedTodos: Set<number>;
  handleTodoToggle: (todoId: number) => void;
  startEditing: (todoId: number) => void;
  saveEdit: (todoId: number) => void;
  cancelEdit: () => void;
  setEditValues: React.Dispatch<React.SetStateAction<Partial<EditValues>>>;
  form: UseFormReturn<{ isAllDay: boolean }, any, { isAllDay: boolean }>;
}) => {
  return (
    <>
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
                  {todo.allDay ? '全天' : `${todo.start} - ${todo.end}`}
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

        {!expandedTodos.has(todo.id) && todo.description && !todo.completed && (
          <div className="text-sm text-muted-foreground line-clamp-1 ml-6">{todo.description}</div>
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
                        ? format(new Date(editValues.start || ''), 'yyyy-MM-dd')
                        : format(new Date(todo.start), 'yyyy-MM-dd')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={
                        editingTodo?.id === todo.id
                          ? new Date(editValues.start || '')
                          : new Date(todo.start)
                      }
                      onSelect={(date) => {
                        if (date) {
                          const formattedDate = format(date, 'yyyy-MM-dd');
                          if (editingTodo?.id === todo.id) {
                            setEditValues({ ...editValues, start: new Date(formattedDate) });
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
                                ? (editValues.allDay as boolean)
                                : todo.allDay
                            }
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (editingTodo?.id === todo.id) {
                                setEditValues({ ...editValues, allDay: checked });
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

            {!(editingTodo?.id === todo.id ? editValues.allDay : todo.allDay) && (
              <DateTimePicker
                initialStartTime={(editingTodo?.id === todo.id
                  ? editValues.start
                  : todo.start
                )?.toString()}
                initialEndTime={(editingTodo?.id === todo.id
                  ? editValues.end
                  : todo.end
                )?.toString()}
                onDateTimeChange={(start, end) => {
                  if (editingTodo?.id === todo.id) {
                    setEditValues({ ...editValues, start: new Date(start), end: new Date(end) });
                  }
                }}
                className="flex-1"
              />
            )}

            {editingTodo?.id === todo.id ? (
              <div className="flex items-center gap-2">
                <Textarea
                  value={editValues.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditValues({ ...editValues, description: e.target.value })
                  }
                  className="flex-1"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{todo.description}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};
