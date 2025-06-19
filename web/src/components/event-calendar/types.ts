export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  label?: string;
  location?: string;
  completed?: boolean;
  createdAt?: Date;
}

export type EventColor = 'blue' | 'orange' | 'violet' | 'rose' | 'emerald';
