import { Hono } from 'hono';
import { R2Bucket, D1Database, ExportedHandlerScheduledHandler } from '@cloudflare/workers-types';
import { fileTypeFromBuffer } from 'file-type';
import { cors } from 'hono/cors';

import { createDb } from '../db';
import { downloadFile, replyMessage } from '../lib/line';
import { type Newfile, type NewMessage } from '../db/schema';
import type { Database } from '../db';
import filesRoutes from './files/routes';
import { FileController } from './files/controller';
import calendarEvents from './calendar-events/routes';
import { CalendarEventController } from './calendar-events/controller';
import { MessageController } from './messages/controller';
import { createEventWithAI } from '../lib/ai';
import { verifyLiffAccessToken, verifyUserIdMatch } from './middlewares/verify';
import { parseError } from '../lib/error-handler';

export type Bindings = {
  APP_STORAGE: R2Bucket;
  LINE_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
  DB: D1Database;
  ENV: string;
  GOOGLE_AI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.use('*', async (c, next) => {
  // Attach db to context manually to avoid type error
  // @ts-ignore
  c.set('db', createDb(c.env.DB));
  await next();
});

app.get('/echo', (c) => {
  const { name } = c.req.query();
  return c.text(`Hello ${name}`);
});

// Apply LIFF verification to API routes
// Apply user ID verification to routes with userId parameter
app.use('/api/:userId/*', verifyLiffAccessToken, verifyUserIdMatch);

// Mount file routes
app.route('/api', filesRoutes);
app.route('/api', calendarEvents);

// TODO: log製作

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

app.post('/webhook', async (c) => {
  const accessToken = c.env.LINE_ACCESS_TOKEN;
  const APP_STORAGE = c.env.APP_STORAGE;
  const googleApiKey = c.env.GOOGLE_AI_API_KEY;
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
            // @ts-ignore
            const db = c.get('db') as Database;
            const calendarEventController = new CalendarEventController(db);
            const messageController = new MessageController(db);
            return await handleTextMessage(
              event,
              accessToken,
              calendarEventController,
              messageController,
              googleApiKey,
            );
        }
      }
    });

    // 等待所有處理完成
    await Promise.all(promises);
  } catch (error: any) {
    console.error('🚀 ~ handleWebhook ~ error:', error);
    if (error?.response?.data?.message?.includes('Invalid reply token')) {
      return c.text('success');
    }
    return c.text('Error' + error, 500);
  }

  return c.text('Success');
});

const handleTextMessage = async (
  event: any,
  accessToken: string,
  calendarEventController: CalendarEventController,
  messageController: MessageController,
  googleApiKey: string,
) => {
  const { source, message, replyToken } = event;
  const userId = source.userId;
  console.log('🚀 ~ handleTextMessage ~ userId:', userId);

  // 首先記錄訊息到資料庫
  const messageData: NewMessage = {
    messageId: message.id,
    userId,
    content: message.text,
    // eventId 會在創建事件後更新
  };

  try {
    const savedMessageId = await messageController.createMessage(messageData);

    // 使用 AI 創建事件
    const aiResult = await createEventWithAI(message.text, {
      userId,
      controller: calendarEventController,
      apiKey: googleApiKey,
      messageId: message.id,
    });
    console.log('CCCCC');

    // 處理 AI 結果
    if (aiResult.success) {
      // 更新訊息關聯的事件ID
      if (aiResult.createdEvent) {
        await messageController.updateMessageEventId(savedMessageId, aiResult.createdEvent.id);
      }

      // 回覆成功訊息
      return await replyMessage({
        replyToken,
        message: aiResult.text || '操作完成',
        accessToken,
        quoteToken: message.quoteToken,
      });
    } else {
      if (aiResult.error?.includes('此訊息已經處理過，請勿重複提交')) {
        return;
      }
      // AI 處理失敗，回覆錯誤訊息（錯誤已在 AI 層級記錄）
      return await replyMessage({
        replyToken,
        message: aiResult.error || '處理失敗',
        accessToken,
        quoteToken: message.quoteToken,
      });
    }
  } catch (error) {
    const errorInfo = parseError(error, 'handleTextMessage');
    console.error('🚀 ~ error:', errorInfo.message);

    if (errorInfo.shouldReply) {
      return await replyMessage({
        replyToken,
        message: errorInfo.userMessage,
        accessToken,
        quoteToken: message.quoteToken,
      });
    }
  }
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
    const errorInfo = parseError(error, 'handleGeneralFile');
    console.error('🚀 ~ error:', errorInfo.message);

    if (errorInfo.shouldReply) {
      await replyMessage({
        replyToken,
        message: errorInfo.userMessage,
        accessToken,
      });
    }
  }
};

export const scheduled: ExportedHandlerScheduledHandler<Bindings> = async () => {
  console.log('🔥 Worker warmup triggered at:', new Date().toISOString());
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  fetch: app.fetch,
  scheduled,
};
