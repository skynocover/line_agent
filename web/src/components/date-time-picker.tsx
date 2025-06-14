import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';

const FormSchema = z.object({
  startDate: z.date({
    required_error: 'Start date is required.',
  }),
  endDate: z.date({
    required_error: 'End date is required.',
  }),
  startTime: z.string({
    required_error: 'Start time is required.',
  }),
  endTime: z.string({
    required_error: 'End time is required.',
  }),
  isAllDay: z.boolean(),
});

type FormValues = z.infer<typeof FormSchema>;

export interface DateTimePickerProps {
  onDateTimeChange?: (startDateTime: Date, endDateTime: Date, isAllDay: boolean) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
  initialStartTime?: string;
  initialEndTime?: string;
  initialIsAllDay?: boolean;
}

export function DateTimePicker({
  onDateTimeChange,
  initialStartDate,
  initialEndDate,
  initialStartTime = '09:00',
  initialEndTime = '10:00',
  initialIsAllDay = false,
}: DateTimePickerProps) {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate || null);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate || null);
  const [startTime, setStartTime] = useState<string>(initialStartTime);
  const [endTime, setEndTime] = useState<string>(initialEndTime);
  const [isAllDay, setIsAllDay] = useState<boolean>(initialIsAllDay);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      startDate: initialStartDate,
      endDate: initialEndDate,
      startTime: initialStartTime,
      endTime: initialEndTime,
      isAllDay: initialIsAllDay,
    },
  });

  const handleDateTimeChange = () => {
    if (startDate && endDate) {
      const [startHours, startMinutes] = startTime.split(':');
      const [endHours, endMinutes] = endTime.split(':');

      const startDateTime = new Date(startDate);
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endDateTime = new Date(endDate);
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      onDateTimeChange?.(startDateTime, endDateTime, isAllDay);
    }
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
                    handleDateTimeChange();
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="space-y-2">
            <div className="flex flex-row gap-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[140px] font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? format(field.value, 'MM/dd') : <span>Pick date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate || field.value}
                          onSelect={(selectedDate) => {
                            setStartDate(selectedDate!);
                            field.onChange(selectedDate);
                            handleDateTimeChange();
                          }}
                          onDayClick={() => setIsStartOpen(false)}
                          fromYear={2000}
                          toYear={new Date().getFullYear() + 10}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
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
                          handleDateTimeChange();
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

          <div className="flex items-center justify-center">~</div>

          <div className="space-y-2">
            <div className="flex flex-row gap-2">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[140px] font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? format(field.value, 'MM/dd') : <span>Pick date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate || field.value}
                          onSelect={(selectedDate) => {
                            setEndDate(selectedDate!);
                            field.onChange(selectedDate);
                            handleDateTimeChange();
                          }}
                          onDayClick={() => setIsEndOpen(false)}
                          fromYear={2000}
                          toYear={new Date().getFullYear() + 10}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
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
                          handleDateTimeChange();
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
        </div>
      </form>
    </Form>
  );
}
