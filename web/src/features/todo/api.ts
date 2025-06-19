import type { CalendarEvent } from '@/components/event-calendar/types';
import axios from 'axios';
import type { NewCalendarEvent } from '../../../../app/db/schema';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api';

export interface GetEventsParams {
  page?: number;
  limit?: number;
  startTime?: string;
  endTime?: string;
}

export interface GetEventsResponse {
  data: CalendarEvent[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

export const getEvents = async (
  userId: string,
  params?: GetEventsParams,
): Promise<GetEventsResponse> => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/${userId}/events`, {
      params: {
        page: params?.page,
        limit: params?.limit,
        startTime: params?.startTime,
        endTime: params?.endTime,
      },
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const createEvent = async (
  userId: string,
  event: NewCalendarEvent,
): Promise<CalendarEvent> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${userId}/events`, event, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const updateEvent = async (
  userId: string,
  eventId: number,
  event: CalendarEvent,
): Promise<CalendarEvent> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/${userId}/events/${eventId}`, event, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const deleteEvent = async (userId: string, eventId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${userId}/events/${eventId}`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export interface GetIncompleteExpiredEventsResponse {
  data: CalendarEvent[];
  count: number;
}

export const getIncompleteExpiredEvents = async (
  userId: string,
): Promise<GetIncompleteExpiredEventsResponse> => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/${userId}/events/incomplete-expired`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};
