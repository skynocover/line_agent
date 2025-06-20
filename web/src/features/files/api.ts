import type {
  File,
  GetUserFilesResponse,
  PaginationParams,
  ErrorResponse,
} from '../../../../app/types/api';
import axios from 'axios';
import { getAuthHeaders } from '../line/liff';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api';

export const getFiles = async (
  userId: string,
  params?: PaginationParams & {
    sort?: string;
    order?: 'asc' | 'desc';
    filter?: string;
  },
): Promise<GetUserFilesResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.sort) searchParams.append('sort', params.sort);
  if (params?.order) searchParams.append('order', params.order);
  if (params?.filter) searchParams.append('filter', params.filter);

  try {
    const response = await axios.get(`${API_BASE_URL}/${userId}/files`, {
      params: {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        order: params?.order,
        filter: params?.filter,
      },
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error((error.response.data as ErrorResponse).error);
    }
    throw error;
  }
};

export const getFile = async (userId: string, fileId: string): Promise<File> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${userId}/files/${fileId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error((error.response.data as ErrorResponse).error);
    }
    throw error;
  }
};

export const deleteFile = async (userId: string, fileId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${userId}/files/${fileId}`, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error((error.response.data as ErrorResponse).error);
    }
    throw error;
  }
};

export const uploadFile = async (userId: string, file: globalThis.File): Promise<File> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/${userId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error((error.response.data as ErrorResponse).error);
    }
    throw error;
  }
};

export const updateFileName = async (
  userId: string,
  fileId: string,
  fileName: string,
): Promise<File> => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/${userId}/files/${fileId}`,
      { fileName },
      {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error((error.response.data as ErrorResponse).error);
    }
    throw error;
  }
};
