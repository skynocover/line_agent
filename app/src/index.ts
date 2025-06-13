import { Hono } from 'hono';
import { R2Bucket, D1Database } from '@cloudflare/workers-types';
import { fileTypeFromBuffer } from 'file-type';

import { createDb } from '../db';
import { downloadFile, replyMessage } from '../lib/line';
import { files, type Newfile } from '../db/schema';
import type { Database } from '../db';

type Bindings = {
  APP_STORAGE: R2Bucket;
  LINE_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', async (c, next) => {
  // Attach db to context manually to avoid type error
  // @ts-ignore
  c.set('db', createDb(c.env.DB));
  await next();
});

app.get('/', (c) => {
  return c.text('Hello World!');
});

app.post('/api/webhook', async (c) => {
  const accessToken = c.env.LINE_ACCESS_TOKEN;
  const APP_STORAGE = c.env.APP_STORAGE;
  // @ts-ignore
  const db = c.get('db') as Database;

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
            return await handleGeneralFile(event, accessToken, APP_STORAGE, db);
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

const handleGeneralFile = async (
  event: any,
  accessToken: string,
  APP_STORAGE: R2Bucket,
  db: Database,
) => {
  const { source, message, replyToken } = event;
  const userId = source.userId;
  console.log('🚀 ~ handleGeneralFile ~ userId:', userId);

  try {
    const fileBuffer = await downloadFile({ messageId: message.id, accessToken });
    const fileType = await fileTypeFromBuffer(fileBuffer);
    // 檔案基本資訊
    const fileInfo: Newfile = {
      fileId: `${message.id}.${fileType?.ext || 'bin'}`,
      userId,
      fileName: message.fileName || `${message.id}.${fileType?.ext || 'bin'}`, // 使用檔案類型作為副檔名
      fileSize: fileBuffer.byteLength, // 從 buffer 獲取檔案大小
      mimeType: fileType?.mime || 'application/octet-stream',
    };

    await db.insert(files).values(fileInfo);

    await APP_STORAGE.put(`${fileInfo.userId}/${fileInfo.fileId}`, fileBuffer, {
      httpMetadata: {
        contentType: fileInfo.mimeType,
        contentDisposition: `inline; filename="${fileInfo.fileId}"`,
      },
    });

    await replyMessage({
      replyToken,
      message: `檔案「${fileInfo.fileName}」已成功備份！`,
      accessToken,
    });
  } catch (error) {
    console.error('🚀 ~ handleGeneralFile ~ error:', error);
    await replyMessage({
      replyToken,
      message: `備份失敗, 錯誤: ${error}`,
      accessToken,
    });
  }
};

export default app;
