import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import type { CalendarEventController } from '../src/calendar-events/controller';
import type { calendarEvents, NewCalendarEvent } from '../db/schema';
import { createEventPrompt } from './prompts';

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

// AI 工具工廠函數：創建 calendar event tool
export const createEventToolFactory = (
  controller: CalendarEventController,
  userId: string,
  timezone: string = 'Asia/Taipei',
  messageId: string,
) =>
  tool({
    description: '創建一個新的行事曆活動',
    parameters: createEventSchema,
    execute: async ({ title, description, start, end, allDay, color, label }) => {
      try {
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
        };
      } catch (error) {
        console.error('創建活動失敗:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知錯誤',
        };
      }
    },
  });

// AI 助手函數，使用工具創建活動
export async function createEventWithAI(
  userMessage: string,
  context: {
    userId: string;
    messageId: string;
    controller: CalendarEventController;
    apiKey: string;
    timezone?: string; // 新增時區參數
  },
) {
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
            const toolResultData = toolResult.result as any;

            if (toolResultData.success && toolResultData.createdEvent) {
              createdEvent = toolResultData.createdEvent;
              const { title, start, end } = toolCall.args as CreateEventParams;

              console.log('🚀 ~ createEventWithAI ~ createdEvent:', createdEvent);

              resultText = `成功建立待辦事項
標題: ${title}
開始時間: ${new Date(start).toLocaleString('zh-TW', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
結束時間: ${new Date(end).toLocaleString('zh-TW', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}`;
            } else if (toolResultData.success === false) {
              resultText = `建立待辦事項失敗: ${toolResultData.error || '未知錯誤'}`;
            }
          }
        }
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
    console.log('🚀 ~ createEventWithAI ~ error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    };
  }
}

export type CreateEventParams = z.infer<typeof createEventSchema>;
