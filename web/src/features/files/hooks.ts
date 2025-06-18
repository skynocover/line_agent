import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFiles, deleteFile, updateFileName } from './api';

interface UseFilesOptions {
  userId: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: string;
}

export function useFiles({
  userId,
  page = 1,
  limit = 10,
  sort = 'name',
  order = 'asc',
  filter = '',
}: UseFilesOptions) {
  const queryClient = useQueryClient();
  const queryKey = ['files', userId, page, limit, sort, order, filter];

  // Query for fetching files
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getFiles(userId, {
        page,
        limit,
        sort,
        order,
        filter,
      });
      return response;
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => deleteFile(userId, fileId),
    onSuccess: () => {
      // Invalidate and refetch the files query
      queryClient.invalidateQueries({ queryKey: ['files', userId] });
    },
    onError: (error) => {
      console.error('Error deleting file:', error);
    },
  });

  // Update file name mutation
  const updateFileNameMutation = useMutation({
    mutationFn: ({ fileId, fileName }: { fileId: string; fileName: string }) =>
      updateFileName(userId, fileId, fileName),
    onSuccess: () => {
      // Invalidate and refetch the files query
      queryClient.invalidateQueries({ queryKey: ['files', userId] });
    },
    onError: (error) => {
      console.error('Error updating file name:', error);
    },
  });

  // Event handlers
  const handleFileDelete = useCallback(
    async (fileId: string) => {
      try {
        await deleteFileMutation.mutateAsync(fileId);
      } catch (error) {
        console.error('Error deleting file:', error);
        throw error; // Re-throw to let UI handle the error
      }
    },
    [deleteFileMutation],
  );

  const handleFileNameUpdate = useCallback(
    async ({ fileId, fileName }: { fileId: string; fileName: string }) => {
      try {
        await updateFileNameMutation.mutateAsync({ fileId, fileName });
      } catch (error) {
        console.error('Error updating file name:', error);
        throw error; // Re-throw to let UI handle the error
      }
    },
    [updateFileNameMutation],
  );

  return {
    // Data
    files: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,

    // Mutations
    deleteFileMutation,
    updateFileNameMutation,

    // Handlers
    handleFileDelete,
    handleFileNameUpdate,

    // Utilities
    refetch,
  };
}
