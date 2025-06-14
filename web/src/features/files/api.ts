import type {
  File,
  GetUserFilesResponse,
  PaginationParams,
  ErrorResponse,
} from '../../../../app/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api';

export const getFiles = async (
  userId: string,
  params?: PaginationParams,
): Promise<GetUserFilesResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const response = await fetch(`${API_BASE_URL}/${userId}/files?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error);
  }

  return response.json();
};

export const getFile = async (userId: string, fileId: string): Promise<File> => {
  const response = await fetch(`${API_BASE_URL}/${userId}/files/${fileId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error);
  }

  return response.json();
};

export const deleteFile = async (userId: string, fileId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${userId}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error);
  }
};

export const updateFileName = async (
  userId: string,
  fileId: string,
  fileName: string,
): Promise<File> => {
  const response = await fetch(`${API_BASE_URL}/${userId}/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileName }),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error);
  }

  return response.json();
};
