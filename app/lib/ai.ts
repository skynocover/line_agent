import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import type { CalendarEventController } from '../src/calendar-events/controller';
import type { calendarEvents, NewCalendarEvent } from '../db/schema';
import { createEventPrompt } from './prompts';
import { handleError } from './error-handler';

export const createGoogleAI = ({ apiKey }: { apiKey: string }) => {
  return createGoogleGenerativeAI({
    apiKey,
  });
};

// Calendar Event 工具的參數 schema
export const createEventSchema = z.object({
  title: z.string().describe('活動標題'),
  description: z.string().optional().describe('活動描述'),
  start: z
    .string()
    .describe('開始時間 (ISO 8601 格式，包含時區偏移，例如: 2024-01-15T10:00:00+08:00)'),
  end: z
    .string()
    .describe('結束時間 (ISO 8601 格式，包含時區偏移，例如: 2024-01-15T11:00:00+08:00)'),
  allDay: z.boolean().optional().default(false).describe('是否為全天活動'),
  color: z.string().optional().describe('活動顏色'),
  label: z.string().optional().describe('活動標籤'),
});

// 錯誤結果類型
interface ErrorResult {
  success: false;
  error: string;
}

// 成功結果類型
interface SuccessResult {
  success: true;
  message: string;
  createdEvent: typeof calendarEvents.$inferSelect;
}

// AI 工具工廠函數：創建 calendar event tool
const createEventToolFactory = (
  controller: CalendarEventController,
  userId: string,
  timezone: string = 'Asia/Taipei',
  messageId: string,
) =>
  tool({
    description: '創建一個新的行事曆活動',
    parameters: createEventSchema,
    execute: async ({ title, description, start, end, allDay, color, label }) => {
      // 構建 NewCalendarEvent 物件
      const eventData: NewCalendarEvent = {
        title,
        description,
        start: new Date(start),
        end: new Date(end),
        allDay: allDay || false,
        color,
        label,
        userId,
        completed: false,
        messageId,
      };

      console.log('🚀 ~ createEventTool ~ eventData:', eventData);

      try {
        // 使用 controller 創建活動
        const createdEvent = await controller.createEvent(eventData);

        const resultMessage = `成功建立待辦事項
標題: ${eventData.title}
開始時間: ${eventData.start.toLocaleString('zh-TW', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
結束時間: ${eventData.end.toLocaleString('zh-TW', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}`;

        return {
          success: true,
          message: resultMessage,
          createdEvent,
        } as SuccessResult;
      } catch (error) {
        // 使用統一錯誤處理來解析詳細的 D1 錯誤信息
        const errorInfo = handleError(error, 'createEventTool');

        return {
          success: false,
          error: errorInfo.userMessage,
        } as ErrorResult;
      }
    },
  });

// 創建事件的通用邏輯
const createDirectEvent = async (
  controller: CalendarEventController,
  userMessage: string,
  userId: string,
  messageId: string,
  timezone: string,
): Promise<SuccessResult | ErrorResult> => {
  const now = new Date();
  const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 往後一小時

  const eventData: NewCalendarEvent = {
    title: userMessage,
    description: undefined,
    start: now,
    end: endTime,
    allDay: false,
    color: undefined,
    label: undefined,
    userId,
    completed: false,
    messageId,
  };

  try {
    const createdEvent = await controller.createEvent(eventData);

    const resultMessage = `成功建立待辦事項
標題: ${eventData.title}
開始時間: ${eventData.start.toLocaleString('zh-TW', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })}
結束時間: ${eventData.end.toLocaleString('zh-TW', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    return {
      success: true,
      message: resultMessage,
      createdEvent,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return {
      success: false,
      error: `建立待辦事項失敗: ${errorMessage}`,
    };
  }
};

// AI 助手函數，使用工具創建活動
export const createEventWithAI = async (
  userMessage: string,
  context: {
    userId: string;
    messageId: string;
    controller: CalendarEventController;
    apiKey: string;
    timezone?: string; // 新增時區參數
  },
) => {
  const { userId, controller, apiKey, timezone = 'Asia/Taipei', messageId } = context;

  try {
    const ai = createGoogleAI({ apiKey });

    // 獲取用戶時區的當前時間
    const now = new Date();
    const userLocalDate = new Intl.DateTimeFormat('zh-TW', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);

    // 創建 tool 實例
    const createEventTool = createEventToolFactory(controller, userId, timezone, messageId);

    const result = await generateText({
      model: ai('gemini-2.0-flash-exp'),
      messages: [
        {
          role: 'system',
          content: createEventPrompt({ timezone, userLocalDate }),
        },
        { role: 'user', content: userMessage },
      ],
      tools: { createEvent: createEventTool },
      toolChoice: 'auto',
    });

    let resultText = '';
    let createdEvent: typeof calendarEvents.$inferSelect | null = null;

    if (result.toolCalls && result.toolCalls.length > 0) {
      for (const toolCall of result.toolCalls) {
        if (toolCall.toolName === 'createEvent' && result.toolResults) {
          // 找到對應的 tool result
          const toolResult = result.toolResults.find((tr) => tr.toolCallId === toolCall.toolCallId);

          if (toolResult && toolResult.result) {
            const toolResultData = toolResult.result as SuccessResult | ErrorResult;

            if (toolResultData.success) {
              createdEvent = toolResultData.createdEvent;
              resultText = toolResultData.message;
            } else {
              resultText = toolResultData.error;
            }
          }
        }
      }
    } else {
      // 沒有 tool call 時，直接創建事件
      const directResult = await createDirectEvent(
        controller,
        userMessage,
        userId,
        messageId,
        timezone,
      );

      if (directResult.success) {
        createdEvent = directResult.createdEvent;
        resultText = directResult.message;
      } else {
        resultText = directResult.error;
      }
    }

    return {
      success: true,
      text: resultText,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      createdEvent, // 返回創建的活動
    };
  } catch (error) {
    // 頂層錯誤處理 - 只在這裡記錄錯誤
    console.error('🚀 ~ createEventWithAI ~ error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return {
      success: false,
      error: `AI 處理失敗: ${errorMessage}`,
    };
  }
};

export type CreateEventParams = z.infer<typeof createEventSchema>;
