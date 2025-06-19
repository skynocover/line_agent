import { Hono } from 'hono';
import { R2Bucket, D1Database } from '@cloudflare/workers-types';
import { fileTypeFromBuffer } from 'file-type';
import { cors } from 'hono/cors';

import { createDb } from '../db';
import { downloadFile, replyMessage } from '../lib/line';
import { type Newfile } from '../db/schema';
import type { Database } from '../db';
import filesRoutes from './files/routes';
import { FileController } from './files/controller';
import calendarEvents from './calendar-events/routes';

export type Bindings = {
  APP_STORAGE: R2Bucket;
  LINE_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
  DB: D1Database;
  ENV: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.use('*', async (c, next) => {
  // Attach db to context manually to avoid type error
  // @ts-ignore
  c.set('db', createDb(c.env.DB));
  await next();
});

app.get('/', (c) => {
  return c.text('Hello World!');
});

// Mount file routes
app.route('/api', filesRoutes);
app.route('/api', calendarEvents);

app.get('/:userId/:fileId', async (c) => {
  if (c.env.ENV !== 'local') {
    return c.json({ error: 'File not found' }, 404);
  }

  const fileId = c.req.param('fileId');
  const userId = c.req.param('userId');

  // @ts-ignore
  const db = c.get('db') as Database;
  const controller = new FileController(db, c.env.APP_STORAGE);

  try {
    const file = await controller.getFile(fileId);
    if (!file || file.userId !== userId) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Get file content from R2
    const fileContent = await controller.getFileContent(userId, fileId);
    if (!fileContent) {
      return c.json({ error: 'File content not found' }, 404);
    }

    // Set appropriate headers
    c.header('Content-Type', file.mimeType);
    c.header('Content-Disposition', `inline; filename="${file.fileName}"`);

    return c.body(fileContent);
  } catch (error) {
    console.error('Error fetching file:', error);
    return c.json({ error: 'Failed to fetch file' }, 500);
  }
});

app.post('/api/webhook', async (c) => {
  const accessToken = c.env.LINE_ACCESS_TOKEN;
  const APP_STORAGE = c.env.APP_STORAGE;
  // @ts-ignore
  const db = c.get('db') as Database;

  const controller = new FileController(db, APP_STORAGE);

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
            return await handleGeneralFile(event, accessToken, controller);

          case 'text':
            return await handleTextMessage(event, accessToken, controller);
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

const handleTextMessage = async (event: any, accessToken: string, controller: FileController) => {
  const { source, message, replyToken } = event;
  const userId = source.userId;
  console.log('🚀 ~ handleTextMessage ~ userId:', userId);

  return await replyMessage({
    replyToken,
    message: 'Hello',
    accessToken,
    quoteToken: message.quoteToken,
  });
};

const handleGeneralFile = async (event: any, accessToken: string, controller: FileController) => {
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

    await controller.createFile(fileInfo, fileBuffer);

    await replyMessage({
      replyToken,
      message: `檔案「${fileInfo.fileName}」已成功備份！`,
      accessToken,
      quoteToken: message.quoteToken,
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
