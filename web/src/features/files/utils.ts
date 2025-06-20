// 獲取檔案類型
export const getFileType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension || 'unknown';
};

// 獲取檔案類別
export const getFileCategory = (type: string): string => {
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
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
