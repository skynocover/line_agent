import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { useState } from 'react';

const FormSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isAllDay: z.boolean(),
});

type FormValues = z.infer<typeof FormSchema>;

export interface DateTimePickerProps {
  onDateTimeChange?: (startTime: string, endTime: string, isAllDay: boolean) => void;
  initialStartTime?: string;
  initialEndTime?: string;
  initialIsAllDay?: boolean;
}

export function DateTimePicker({
  onDateTimeChange,
  initialStartTime = '09:00',
  initialEndTime = '10:00',
  initialIsAllDay = false,
}: DateTimePickerProps) {
  const [startTime, setStartTime] = useState<string>(initialStartTime);
  const [endTime, setEndTime] = useState<string>(initialEndTime);
  const [isAllDay, setIsAllDay] = useState<boolean>(initialIsAllDay);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      startTime: initialStartTime,
      endTime: initialEndTime,
      isAllDay: initialIsAllDay,
    },
  });

  const handleTimeChange = () => {
    onDateTimeChange?.(startTime, endTime, isAllDay);
  };

  return (
    <Form {...form}>
      <form className="space-y-2">
        <FormField
          control={form.control}
          name="isAllDay"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between space-y-0">
              <FormLabel>全天</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    setIsAllDay(checked);
                    handleTimeChange();
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {!isAllDay && (
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      defaultValue={startTime}
                      onValueChange={(value) => {
                        setStartTime(value);
                        field.onChange(value);
                        handleTimeChange();
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {Array.from({ length: 96 }).map((_, i) => {
                            const hour = Math.floor(i / 4)
                              .toString()
                              .padStart(2, '0');
                            const minute = ((i % 4) * 15).toString().padStart(2, '0');
                            return (
                              <SelectItem key={i} value={`${hour}:${minute}`}>
                                {hour}:{minute}
                              </SelectItem>
                            );
                          })}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}
          </div>

          {!isAllDay && <div className="flex items-center justify-center">~</div>}

          <div className="flex items-center gap-2">
            {!isAllDay && (
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      defaultValue={endTime}
                      onValueChange={(value) => {
                        setEndTime(value);
                        field.onChange(value);
                        handleTimeChange();
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {Array.from({ length: 96 }).map((_, i) => {
                            const hour = Math.floor(i / 4)
                              .toString()
                              .padStart(2, '0');
                            const minute = ((i % 4) * 15).toString().padStart(2, '0');
                            return (
                              <SelectItem key={i} value={`${hour}:${minute}`}>
                                {hour}:{minute}
                              </SelectItem>
                            );
                          })}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
