import { useState, useEffect } from 'react';
import {
  FileText,
  ImageIcon,
  Video,
  Music,
  Archive,
  File,
  Download,
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Copy,
} from 'lucide-react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getFiles, deleteFile, updateFileName } from '@/features/files/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// 根據檔案類型返回對應圖示
const getFileIcon = (category: string) => {
  switch (category) {
    case 'document':
      return <FileText className="w-5 h-5 text-blue-600" />;
    case 'image':
      return <ImageIcon className="w-5 h-5 text-green-600" />;
    case 'video':
      return <Video className="w-5 h-5 text-red-600" />;
    case 'audio':
      return <Music className="w-5 h-5 text-purple-600" />;
    case 'archive':
      return <Archive className="w-5 h-5 text-orange-600" />;
    default:
      return <File className="w-5 h-5 text-gray-600" />;
  }
};

// 根據檔案類型返回顏色
const getFileTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    pdf: 'bg-red-100 text-red-800',
    jpg: 'bg-green-100 text-green-800',
    jpeg: 'bg-green-100 text-green-800',
    png: 'bg-green-100 text-green-800',
    mp3: 'bg-purple-100 text-purple-800',
    mp4: 'bg-red-100 text-red-800',
    zip: 'bg-orange-100 text-orange-800',
    xlsx: 'bg-blue-100 text-blue-800',
    docx: 'bg-blue-100 text-blue-800',
  };
  return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

// 獲取檔案類型
const getFileType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension || 'unknown';
};

// 獲取檔案類別
const getFileCategory = (type: string): string => {
  const categories: Record<string, string> = {
    pdf: 'document',
    docx: 'document',
    xlsx: 'document',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    mp3: 'audio',
    wav: 'audio',
    mp4: 'video',
    mov: 'video',
    zip: 'archive',
    rar: 'archive',
  };
  return categories[type] || 'other';
};

// 格式化檔案大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// 定義搜索參數的驗證 schema
const searchSchema = z.object({
  sort: z.enum(['name', 'type', 'size', 'date']).optional().default('name'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().min(1).optional().default(1),
  filter: z.string().optional(),
});

// 定義路由參數的驗證 schema
const paramsSchema = z.object({ userId: z.string().min(1) });

const pageSize = 10;
const fileBaseURL = import.meta.env.VITE_FILE_BASE_URL;

const FilesPage = () => {
  const { userId } = Route.useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [sort, setSort] = useState<'name' | 'type' | 'size' | 'date'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [editingFile, setEditingFile] = useState<{ fileId: string; fileName: string } | null>(null);
  const [deletingFile, setDeletingFile] = useState<{ fileId: string; fileName: string } | null>(
    null,
  );
  const [newFileName, setNewFileName] = useState('');
  const queryClient = useQueryClient();

  // Add debounce effect
  useEffect(() => {
    if (isComposing) return;

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 增加延遲時間到 1000ms

    return () => clearTimeout(timer);
  }, [searchTerm, isComposing]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['files', userId, page, sort, order, debouncedSearchTerm],
    queryFn: () =>
      getFiles(userId, { page, limit: pageSize, sort, order, filter: debouncedSearchTerm }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: ({ fileId }: { fileId: string }) => deleteFile(userId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', userId] });
      setDeletingFile(null);
    },
  });

  const updateFileNameMutation = useMutation({
    mutationFn: ({ fileId, fileName }: { fileId: string; fileName: string }) =>
      updateFileName(userId, fileId, fileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', userId] });
      setEditingFile(null);
      setNewFileName('');
    },
  });

  const handleSortChange = (newSort: 'name' | 'type' | 'size' | 'date') => {
    if (sort === newSort) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(newSort);
      setOrder('asc');
    }
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleRename = (file: { fileId: string; fileName: string }) => {
    setEditingFile(file);
    setNewFileName(file.fileName);
  };

  const handleDelete = (file: { fileId: string; fileName: string }) => {
    setDeletingFile(file);
  };

  const handleRenameSubmit = () => {
    if (editingFile && newFileName.trim()) {
      updateFileNameMutation.mutate({
        fileId: editingFile.fileId,
        fileName: newFileName.trim(),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingFile) {
      deleteFileMutation.mutate({ fileId: deletingFile.fileId });
    }
  };

  const handleCopyLink = (fileId: string) => {
    const fileUrl = `${fileBaseURL}/${userId}/${fileId}`;
    navigator.clipboard.writeText(fileUrl).then(() => {
      toast.success('已複製檔案連結', {
        description: '檔案連結已複製到剪貼簿',
        duration: 2000,
      });
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">載入失敗：{error.message}</p>
        </div>
      </div>
    );
  }

  const files = data?.data ?? [];

  return (
    <div className="h-[calc(100vh-70px)] bg-gray-50">
      {/* 頂部導航 */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">我的雲端硬碟</h1>
        </div>
      </header>

      {/* 工具列 */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜尋檔案..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                className="pl-10 w-full sm:w-80"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <Upload className="w-4 h-4" />
              上傳檔案
            </Button>
          </div>
        </div>
      </div>

      {/* 檔案列表 */}
      <main className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow">
          {/* 桌面版表格 */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSortChange('name')}
                  >
                    <div className="flex items-center gap-2">
                      檔案名稱
                      {sort === 'name' && (
                        <span className="text-gray-400">{order === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSortChange('type')}
                  >
                    <div className="flex items-center gap-2">
                      類型
                      {sort === 'type' && (
                        <span className="text-gray-400">{order === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSortChange('size')}
                  >
                    <div className="flex items-center gap-2">
                      大小
                      {sort === 'size' && (
                        <span className="text-gray-400">{order === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSortChange('date')}
                  >
                    <div className="flex items-center gap-2">
                      上傳日期
                      {sort === 'date' && (
                        <span className="text-gray-400">{order === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map(({ fileId, fileName, fileSize, createdAt }) => (
                  <TableRow key={fileId} className="hover:bg-gray-50">
                    <TableCell>{getFileIcon(getFileCategory(getFileType(fileName)))}</TableCell>
                    <TableCell>
                      <a
                        href={`${fileBaseURL}/${userId}/${fileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {fileName}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getFileTypeColor(getFileType(fileName))}
                      >
                        {getFileType(fileName).toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{formatFileSize(fileSize)}</TableCell>
                    <TableCell className="text-gray-600">
                      {createdAt ? new Date(createdAt).toLocaleString() : ''}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(fileId)}
                          className="hover:bg-gray-100"
                          title="複製檔案連結"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {}}
                          className="hover:bg-gray-100"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRename({ fileId, fileName })}
                          className="hover:bg-gray-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete({ fileId, fileName })}
                          className="hover:bg-gray-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 手機版列表 */}
          <div className="sm:hidden">
            {files.map(({ fileId, fileName, fileSize, createdAt }) => (
              <div
                key={fileId}
                className="p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getFileIcon(getFileCategory(getFileType(fileName)))}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`${fileBaseURL}/${userId}/${fileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-medium truncate hover:text-blue-800 hover:underline"
                      >
                        {fileName}
                      </a>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(fileId)}
                          className="h-8 w-8 p-0"
                          title="複製檔案連結"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {}}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRename({ fileId, fileName })}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete({ fileId, fileName })}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                      <Badge
                        variant="secondary"
                        className={getFileTypeColor(getFileType(fileName))}
                      >
                        {getFileType(fileName).toUpperCase()}
                      </Badge>
                      <span>{formatFileSize(fileSize)}</span>
                      <span>{createdAt ? new Date(createdAt).toLocaleString() : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {files.length === 0 && (
            <div className="text-center py-12">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">找不到符合條件的檔案</p>
            </div>
          )}

          {/* 分頁組件 */}
          {files.length > 0 && data?.pagination && (
            <div className="flex items-center justify-end px-4 py-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm text-gray-600">
                  {page}/{data.pagination.totalPages}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pagination.totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 重新命名對話框 */}
      <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重新命名檔案</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="輸入新的檔案名稱"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFile(null)}>
              取消
            </Button>
            <Button onClick={handleRenameSubmit} disabled={!newFileName.trim()}>
              確認
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={!!deletingFile} onOpenChange={() => setDeletingFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除檔案 "{deletingFile?.fileName}" 嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const Route = createFileRoute('/$userId/files')({
  parseParams: (params) => paramsSchema.parse(params),
  validateSearch: searchSchema,
  beforeLoad: async () => {},
  loader: async () => {},
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      <h2>Error loading files</h2>
      <p>{error.message}</p>
    </div>
  ),
  pendingComponent: () => <div className="p-4">Loading files...</div>,
  component: FilesPage,
});
