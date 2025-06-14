import { useState } from 'react';
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
} from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

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
import { getFiles } from '@/features/files/api';

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
  sort: z.enum(['name', 'size', 'date']).optional().default('name'),
  page: z.coerce.number().min(1).optional().default(1),
  filter: z.string().optional(),
});

// 定義路由參數的驗證 schema
const paramsSchema = z.object({
  userId: z.string().min(1),
});

const pageSize = 10;

const FilesPage = () => {
  const navigate = useNavigate();
  const { userId } = Route.useParams();
  const { sort, page, filter } = Route.useSearch();

  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['files', userId, page],
    queryFn: () => getFiles(userId, { page, limit: pageSize }),
  });

  const handleSortChange = (newSort: 'name' | 'size' | 'date') => {
    navigate({
      to: '/files/$userId',
      params: { userId },
      search: { sort: newSort, page, filter },
    });
  };

  const handleFilterChange = (newFilter: string) => {
    navigate({
      to: '/files/$userId',
      params: { userId },
      search: { sort, page: 1, filter: newFilter },
    });
  };

  const filteredFiles =
    data?.data.filter((file) => file.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ??
    [];

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">我的雲端硬碟</h1>
        </div>
      </header>

      {/* 工具列 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜尋檔案..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              上傳檔案
            </Button>
          </div>
        </div>
      </div>

      {/* 檔案列表 */}
      <main className="px-6 py-6">
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>檔案名稱</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>上傳日期</TableHead>
                <TableHead className="w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map(({ fileId, fileName, fileSize, createdAt }) => (
                <TableRow key={fileId} className="hover:bg-gray-50">
                  <TableCell>{getFileIcon(getFileCategory(getFileType(fileName)))}</TableCell>
                  <TableCell>
                    <span className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                      {fileName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getFileTypeColor(getFileType(fileName))}>
                      {getFileType(fileName).toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{formatFileSize(fileSize)}</TableCell>
                  <TableCell className="text-gray-600">
                    {createdAt ? new Date(createdAt).toLocaleString() : ''}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                      className="hover:bg-gray-100"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">找不到符合條件的檔案</p>
            </div>
          )}

          {/* 分頁組件 */}
          {filteredFiles.length > 0 && data?.pagination && (
            <div className="flex items-center justify-end px-4 py-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (data.pagination.page > 1) {
                      navigate({
                        to: '/files/$userId',
                        params: { userId },
                        search: { sort, page: data.pagination.page - 1, filter },
                      });
                    }
                  }}
                  disabled={data.pagination.page === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm text-gray-600">
                  {data.pagination.page}/{data.pagination.totalPages}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (data.pagination.page < data.pagination.totalPages) {
                      navigate({
                        to: '/files/$userId',
                        params: { userId },
                        search: { sort, page: data.pagination.page + 1, filter },
                      });
                    }
                  }}
                  disabled={data.pagination.page === data.pagination.totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export const Route = createFileRoute('/files/$userId')({
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
