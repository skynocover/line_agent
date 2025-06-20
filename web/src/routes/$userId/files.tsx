import { useState, useEffect, useRef } from 'react';
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
  MoreVertical,
} from 'lucide-react';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { toast } from 'sonner';

import { ProtectedRoute } from '@/features/auth';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { useFiles } from '@/features/files/hooks';
import { getFileCategory, getFileType, formatFileSize } from '@/features/files/utils';

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

const pageSize = 10;
const fileBaseURL = import.meta.env.VITE_FILE_BASE_URL;

const FilesPageContent = () => {
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
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add debounce effect
  useEffect(() => {
    if (isComposing) return;

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, isComposing]);

  const {
    files,
    pagination,
    isLoading,
    error,
    handleFileDelete,
    handleFileNameUpdate,
    handleFileUpload,
    uploadFileMutation,
  } = useFiles({
    userId,
    page,
    limit: pageSize,
    sort,
    order,
    filter: debouncedSearchTerm,
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

  const handleRenameSubmit = async () => {
    if (!editingFile || !newFileName.trim()) return;

    try {
      await handleFileNameUpdate({ fileId: editingFile.fileId, fileName: newFileName.trim() });
      setEditingFile(null);
      setNewFileName('');
      toast.success('檔案名稱更新成功');
    } catch {
      toast.error('檔案名稱更新失敗');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFile) return;

    try {
      await handleFileDelete(deletingFile.fileId);
      setDeletingFile(null);
      toast.success('檔案刪除成功');
    } catch {
      toast.error('檔案刪除失敗');
    }
  };

  const handleCopyLink = (fileId: string) => {
    const link = `${fileBaseURL}/${userId}/${fileId}`;
    navigator.clipboard.writeText(link);
    toast.success('檔案連結已複製到剪貼簿');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      for (const file of Array.from(files)) {
        await handleFileUpload(file);
      }
      toast.success(`成功上傳 ${files.length} 個檔案`);
    } catch {
      toast.error('檔案上傳失敗');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    try {
      for (const file of Array.from(files)) {
        await handleFileUpload(file);
      }
      toast.success(`成功上傳 ${files.length} 個檔案`);
    } catch {
      toast.error('檔案上傳失敗');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  // Mobile File Card Component
  const MobileFileCard = ({ file }: { file: any }) => {
    const fileType = getFileType(file.fileName);
    const category = getFileCategory(fileType);

    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {getFileIcon(category)}
              <div className="flex-1 min-w-0">
                <button
                  className="font-medium text-gray-900 truncate mb-1 hover:text-blue-600 hover:underline cursor-pointer text-left w-full"
                  title={file.fileName}
                  onClick={() => window.open(`${fileBaseURL}/${userId}/${file.fileId}`, '_blank')}
                >
                  {file.fileName}
                </button>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <Badge variant="secondary" className={`${getFileTypeColor(fileType)} text-xs`}>
                    {fileType.toUpperCase()}
                  </Badge>
                  <span>{formatFileSize(file.fileSize)}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(file.createdAt || '').toLocaleString('zh-TW')}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => window.open(`${fileBaseURL}/${userId}/${file.fileId}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下載檔案
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCopyLink(file.fileId)}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  複製連結
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleRename({ fileId: file.fileId, fileName: file.fileName })}
                  className="flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  重新命名
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete({ fileId: file.fileId, fileName: file.fileName })}
                  className="flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  刪除檔案
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>載入檔案時發生錯誤：{typeof error === 'string' ? error : '未知錯誤'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div
        className={`max-w-7xl mx-auto transition-all duration-200 ${
          isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isDragOver && (
          <div className="text-center text-blue-600 mb-4">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <p className="text-lg font-medium">拖放檔案到這裡上傳</p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">檔案管理</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">管理您上傳的檔案</p>
            </div>

            <Button
              onClick={handleUploadClick}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Upload className="w-4 h-4" />
              上傳檔案
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜尋檔案名稱..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              className="pl-10 pr-10 h-12 sm:h-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Mobile Sort Options */}
          <div className="block sm:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { key: 'name', label: '名稱' },
                { key: 'type', label: '類型' },
                { key: 'size', label: '大小' },
                { key: 'date', label: '時間' },
              ].map((sortOption) => (
                <Button
                  key={sortOption.key}
                  variant={sort === sortOption.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange(sortOption.key as any)}
                  className="whitespace-nowrap flex items-center gap-1"
                >
                  {sortOption.label}
                  {sort === sortOption.key && (
                    <span className="text-xs">{order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Files Display */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">載入中...</span>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">
              {searchTerm ? '沒有找到符合條件的檔案' : '還沒有上傳任何檔案'}
            </p>
            <p className="text-sm">{!searchTerm && '點擊上方的「上傳檔案」按鈕開始使用'}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSortChange('name')}
                    >
                      <div className="flex items-center gap-1">
                        檔案名稱
                        {sort === 'name' && (
                          <span className="text-xs">{order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSortChange('type')}
                    >
                      <div className="flex items-center gap-1">
                        類型
                        {sort === 'type' && (
                          <span className="text-xs">{order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSortChange('size')}
                    >
                      <div className="flex items-center gap-1">
                        大小
                        {sort === 'size' && (
                          <span className="text-xs">{order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSortChange('date')}
                    >
                      <div className="flex items-center gap-1">
                        上傳時間
                        {sort === 'date' && (
                          <span className="text-xs">{order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-32">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => {
                    const fileType = getFileType(file.fileName);
                    const category = getFileCategory(fileType);

                    return (
                      <TableRow key={file.fileId} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {getFileIcon(category)}
                            <div className="min-w-0 flex-1">
                              <button
                                className="font-medium text-gray-900 max-w-xs truncate hover:text-blue-600 hover:underline cursor-pointer text-left"
                                title={file.fileName}
                                onClick={() =>
                                  window.open(`${fileBaseURL}/${userId}/${file.fileId}`, '_blank')
                                }
                              >
                                {file.fileName}
                              </button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getFileTypeColor(fileType)}>
                            {fileType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatFileSize(file.fileSize)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(file.createdAt || '').toLocaleString('zh-TW')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(`${fileBaseURL}/${userId}/${file.fileId}`, '_blank')
                              }
                              title="下載檔案"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(file.fileId)}
                              title="複製連結"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRename({ fileId: file.fileId, fileName: file.fileName })
                              }
                              title="重新命名"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete({ fileId: file.fileId, fileName: file.fileName })
                              }
                              title="刪除檔案"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {files.map((file) => (
                <MobileFileCard key={file.fileId} file={file} />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="h-10 px-3"
            >
              <ChevronLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">上一頁</span>
            </Button>

            <div className="flex items-center gap-1 sm:gap-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="h-10 w-10 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="h-10 px-3"
            >
              <span className="hidden sm:inline">下一頁</span>
              <ChevronRight className="w-4 h-4 sm:ml-1" />
            </Button>
          </div>
        )}

        {/* Upload Progress */}
        {uploadFileMutation.isPending && (
          <div className="fixed bottom-4 right-4 left-4 sm:left-auto bg-white border rounded-lg shadow-lg p-4 z-50">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">檔案上傳中...</span>
            </div>
          </div>
        )}

        {/* Rename Dialog */}
        <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
          <DialogContent className="mx-4 max-w-md">
            <DialogHeader>
              <DialogTitle>重新命名檔案</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">檔案名稱</label>
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="請輸入新的檔案名稱"
                  className="mt-1 h-12 sm:h-10"
                />
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingFile(null)}
                className="w-full sm:w-auto"
              >
                取消
              </Button>
              <Button
                onClick={handleRenameSubmit}
                disabled={!newFileName.trim()}
                className="w-full sm:w-auto"
              >
                確認
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingFile} onOpenChange={() => setDeletingFile(null)}>
          <AlertDialogContent className="mx-4 max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除檔案</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                您確定要刪除檔案「{deletingFile?.fileName}」嗎？此操作無法復原。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                刪除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

const FilesPage = () => {
  const { userId } = Route.useParams();

  return (
    <ProtectedRoute
      requiredUserId={userId}
      redirectTo="/files"
      showErrorToast={true}
      autoLogin={true}
    >
      <FilesPageContent />
    </ProtectedRoute>
  );
};

export const Route = createFileRoute('/$userId/files')({
  component: FilesPage,
  validateSearch: z.object({
    sort: z.enum(['name', 'type', 'size', 'date']).optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
    page: z.coerce.number().min(1).optional().default(1),
    filter: z.string().optional(),
  }),
});
