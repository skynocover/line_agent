import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CalendarEvent } from '@/components/event-calendar/types';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getIncompleteExpiredEvents,
} from './api';

interface UseTodosOptions {
  userId: string;
  currentDate: Date;
  view: string;
  getTimeRange: () => { startTime: string; endTime: string };
}

// 独立的 hook 来获取过期未完成的待办事项
export function useIncompleteExpiredTodos(userId: string) {
  return useQuery({
    queryKey: ['incomplete-expired-todos', userId],
    queryFn: async () => {
      const response = await getIncompleteExpiredEvents(userId);
      return response.data || [];
    },
    enabled: !!userId,
  });
}

export function useTodos({ userId, currentDate, view, getTimeRange }: UseTodosOptions) {
  const queryClient = useQueryClient();
  const queryKey = ['todos', userId, currentDate, view];
  const incompleteExpiredQueryKey = ['incomplete-expired-todos', userId];

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
        start: event.start,
        end: event.end,
      }),
    onMutate: async (newEvent) => {
      // 取消相關的查詢以避免衝突
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: incompleteExpiredQueryKey });

      // 保存目前的狀態以便錯誤時回滾
      const previousTodos = queryClient.getQueryData<CalendarEvent[]>(queryKey);
      const previousExpiredTodos =
        queryClient.getQueryData<CalendarEvent[]>(incompleteExpiredQueryKey);

      // 為新事件生成臨時 ID（負數以避免與真實 ID 衝突）
      const tempEvent = { ...newEvent, id: Date.now() * -1 };

      // 樂觀更新主要待辦事項列表
      queryClient.setQueryData(queryKey, (old: CalendarEvent[] = []) => [...old, tempEvent]);

      // 樂觀更新過期未完成的待辦事項
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (!tempEvent.completed && new Date(tempEvent.end) < now) {
        queryClient.setQueryData(incompleteExpiredQueryKey, (old: CalendarEvent[] = []) =>
          [...old, tempEvent].sort((a, b) => new Date(a.end).getTime() - new Date(b.end).getTime()),
        );
      }

      return { previousTodos, previousExpiredTodos, tempEvent };
    },
    onSuccess: (newEvent, _, context) => {
      // 用真實的事件替換臨時事件
      queryClient.setQueryData(queryKey, (old: CalendarEvent[] = []) =>
        old.map((event) => (event.id === context?.tempEvent.id ? newEvent : event)),
      );

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (!newEvent.completed && new Date(newEvent.end) < now) {
        queryClient.setQueryData(incompleteExpiredQueryKey, (old: CalendarEvent[] = []) =>
          old.map((event) => (event.id === context?.tempEvent.id ? newEvent : event)),
        );
      }
    },
    onError: (error, newEvent, context) => {
      // 錯誤時回滾到之前的狀態
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
      if (context?.previousExpiredTodos) {
        queryClient.setQueryData(incompleteExpiredQueryKey, context.previousExpiredTodos);
      }
      console.error('Error creating event:', error);
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: (event: CalendarEvent) => updateEvent(userId, event.id || 0, event),
    onMutate: async (newEvent) => {
      // 取消相關的查詢以避免衝突
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: incompleteExpiredQueryKey });

      // 保存目前的狀態以便錯誤時回滾
      const previousTodos = queryClient.getQueryData<CalendarEvent[]>(queryKey);
      const previousExpiredTodos =
        queryClient.getQueryData<CalendarEvent[]>(incompleteExpiredQueryKey);

      // 樂觀更新主要待辦事項列表
      queryClient.setQueryData(queryKey, (old: CalendarEvent[] = []) =>
        old.map((todo) => (todo.id === newEvent.id ? newEvent : todo)),
      );

      // 樂觀更新過期未完成的待辦事項
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      queryClient.setQueryData(incompleteExpiredQueryKey, (old: CalendarEvent[] = []) => {
        const isEventExpiredAndIncomplete = !newEvent.completed && new Date(newEvent.end) < now;
        const eventExistsInExpiredList = old.some((event) => event.id === newEvent.id);

        if (isEventExpiredAndIncomplete && !eventExistsInExpiredList) {
          return [...old, newEvent].sort(
            (a, b) => new Date(a.end).getTime() - new Date(b.end).getTime(),
          );
        } else if (isEventExpiredAndIncomplete && eventExistsInExpiredList) {
          return old.map((event) => (event.id === newEvent.id ? newEvent : event));
        } else if (!isEventExpiredAndIncomplete && eventExistsInExpiredList) {
          return old.filter((event) => event.id !== newEvent.id);
        }

        return old;
      });

      return { previousTodos, previousExpiredTodos };
    },
    onError: (error, newEvent, context) => {
      // 錯誤時回滾到之前的狀態
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
      if (context?.previousExpiredTodos) {
        queryClient.setQueryData(incompleteExpiredQueryKey, context.previousExpiredTodos);
      }
      console.error('Error updating event:', error);
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => deleteEvent(userId, eventId),
    onMutate: async (eventId) => {
      // 取消相關的查詢以避免衝突
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: incompleteExpiredQueryKey });

      // 保存目前的狀態以便錯誤時回滾
      const previousTodos = queryClient.getQueryData<CalendarEvent[]>(queryKey);
      const previousExpiredTodos =
        queryClient.getQueryData<CalendarEvent[]>(incompleteExpiredQueryKey);

      // 樂觀更新主要待辦事項列表
      queryClient.setQueryData(queryKey, (old: CalendarEvent[] = []) =>
        old.filter((todo) => todo.id !== eventId),
      );

      // 樂觀更新過期未完成的待辦事項
      queryClient.setQueryData(incompleteExpiredQueryKey, (old: CalendarEvent[] = []) =>
        old.filter((event) => event.id !== eventId),
      );

      return { previousTodos, previousExpiredTodos };
    },
    onError: (error, eventId, context) => {
      // 錯誤時回滾到之前的狀態
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
      if (context?.previousExpiredTodos) {
        queryClient.setQueryData(incompleteExpiredQueryKey, context.previousExpiredTodos);
      }
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

  const {
    data: incompleteExpiredTodos = [],
    isLoading: isLoadingIncompleteExpiredTodos,
    error: errorIncompleteExpiredTodos,
    refetch: refetchIncompleteExpiredTodos,
  } = useQuery({
    queryKey: incompleteExpiredQueryKey,
    queryFn: async () => {
      const response = await getIncompleteExpiredEvents(userId);
      return response.data || [];
    },
    enabled: !!userId,
  });

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
    incompleteExpiredTodos,
    isLoadingIncompleteExpiredTodos,
    errorIncompleteExpiredTodos,
    refetchIncompleteExpiredTodos,
  };
}
