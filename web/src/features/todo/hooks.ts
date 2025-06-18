import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CalendarEvent } from '@/components/event-calendar/types';
import { getEvents, createEvent, updateEvent, deleteEvent } from './api';

interface UseTodosOptions {
  userId: string;
  currentDate: Date;
  view: string;
  getTimeRange: () => { startTime: string; endTime: string };
}

export function useTodos({ userId, currentDate, view, getTimeRange }: UseTodosOptions) {
  const queryClient = useQueryClient();
  const queryKey = ['todos', userId, currentDate, view];

  // Query for fetching todos
  const {
    data: todos = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const { startTime, endTime } = getTimeRange();
      const response = await getEvents(userId, {
        page: 1,
        limit: 50,
        startTime,
        endTime,
      });
      return response.data || [];
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (event: CalendarEvent) =>
      createEvent(userId, {
        ...event,
        id: undefined,
        userId,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
      }),
    onSuccess: (newEvent) => {
      queryClient.setQueryData(queryKey, (old: CalendarEvent[] = []) => [...old, newEvent]);
    },
    onError: (error) => {
      console.error('Error creating event:', error);
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: (event: CalendarEvent) => updateEvent(userId, event.id || 0, event),
    onSuccess: (updatedEvent) => {
      queryClient.setQueryData(queryKey, (old: CalendarEvent[] = []) =>
        old.map((todo) => (todo.id === updatedEvent.id ? updatedEvent : todo)),
      );
    },
    onError: (error) => {
      console.error('Error updating event:', error);
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => deleteEvent(userId, eventId),
    onSuccess: (_, eventId) => {
      queryClient.setQueryData(queryKey, (old: CalendarEvent[] = []) =>
        old.filter((todo) => todo.id !== eventId),
      );
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
    },
  });

  // Event handlers
  const handleEventAdd = useCallback(
    async (event: CalendarEvent) => {
      try {
        await createEventMutation.mutateAsync(event);
      } catch (error) {
        console.error('Error creating event:', error);
        throw error; // Re-throw to let UI handle the error
      }
    },
    [createEventMutation],
  );

  const handleEventUpdate = useCallback(
    async (event: CalendarEvent) => {
      try {
        await updateEventMutation.mutateAsync(event);
      } catch (error) {
        console.error('Error updating event:', error);
        throw error; // Re-throw to let UI handle the error
      }
    },
    [updateEventMutation],
  );

  const handleEventDelete = useCallback(
    async (eventId: number) => {
      try {
        await deleteEventMutation.mutateAsync(eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
        throw error; // Re-throw to let UI handle the error
      }
    },
    [deleteEventMutation],
  );

  return {
    // Data
    todos,
    isLoading,
    error,

    // Mutations
    createEventMutation,
    updateEventMutation,
    deleteEventMutation,

    // Handlers
    handleEventAdd,
    handleEventUpdate,
    handleEventDelete,

    // Utilities
    refetch,
  };
}
