import type {
  File,
  GetUserFilesResponse,
  PaginationParams,
  ErrorResponse,
} from '../../../../app/types/api';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api';

export const getFiles = async (
  userId: string,
  params?: PaginationParams,
): Promise<GetUserFilesResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  try {
    const response = await axios.get(`${API_BASE_URL}/${userId}/files`, {
      params: {
        page: params?.page,
        limit: params?.limit,
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

export const getFile = async (userId: string, fileId: string): Promise<File> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${userId}/files/${fileId}`);
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
    await axios.delete(`${API_BASE_URL}/${userId}/files/${fileId}`);
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
