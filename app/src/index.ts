import { Hono } from 'hono';
import { crypto, R2Bucket, TextEncoder } from '@cloudflare/workers-types';
import { fileTypeFromBuffer } from 'file-type';

import { downloadFile, replyMessage } from '../lib/line';

type Bindings = {
  APP_STORAGE: R2Bucket;
  LINE_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  return c.text('Hello World!');
});

interface IFileInfo {
  fileId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

app.post('/api/webhook', async (c) => {
  const accessToken = c.env.LINE_ACCESS_TOKEN;
  const APP_STORAGE = c.env.APP_STORAGE;

  const { events }: any = await c.req.json();

  try {
    // 收集所有需要處理的 Promise
    const promises = events.map(async (event: any) => {
      if (event.type === 'message') {
        const messageType = event.message.type;
        switch (messageType) {
          case 'image':
          case 'video':
          case 'audio':
          case 'file':
            return await handleGeneralFile(event, accessToken, APP_STORAGE);
        }
      }
    });

    // 等待所有處理完成
    await Promise.all(promises);
  } catch (error) {
    console.error('🚀 ~ handleGeneralFile ~ error:', error);
    return c.text('Error' + error, 500);
  }

  return c.text('Success');
});

const handleGeneralFile = async (event: any, accessToken: string, APP_STORAGE: R2Bucket) => {
  const { source, message, replyToken } = event;
  const userId = source.userId;
  console.log('🚀 ~ handleGeneralFile ~ userId:', userId);

  const fileBuffer = await downloadFile({ messageId: message.id, accessToken });
  const fileType = await fileTypeFromBuffer(fileBuffer);
  // 檔案基本資訊
  const fileInfo: IFileInfo = {
    fileId: `${message.id}.${fileType?.ext || 'bin'}`,
    userId,
    fileName: message.fileName || `${message.id}.${fileType?.ext || 'bin'}`, // 使用檔案類型作為副檔名
    fileSize: fileBuffer.length, // 從 buffer 獲取檔案大小
    mimeType: fileType?.mime || 'application/octet-stream',
  };

  console.log('fileInfo', fileInfo);

  await APP_STORAGE.put(`${fileInfo.userId}/${fileInfo.fileId}`, fileBuffer, {
    httpMetadata: {
      contentType: fileInfo.mimeType,
      contentDisposition: `inline; filename="${fileInfo.fileId}"`,
    },
    customMetadata: {
      userId: fileInfo.userId,
      fileName: fileInfo.fileName,
    },
  });

  await replyMessage({
    replyToken,
    message: `檔案「${fileInfo.fileName}」已成功備份到雲端！`,
    accessToken,
  });
};

export default app;
