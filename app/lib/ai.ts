import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import type { CalendarEventController } from '../src/calendar-events/controller';
import type { calendarEvents, NewCalendarEvent } from '../db/schema';
import { createEventPrompt } from './prompts';
import { parseError } from './error-handler';

const DEFAULT_TIMEZONE = 'Asia/Taipei';
const DEFAULT_EVENT_DURATION_HOURS = 1;
const AI_MODEL = 'gemini-2.0-flash-exp';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

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

export type CreateEventParams = z.infer<typeof createEventSchema>;

// 結果類型定義
interface ErrorResult {
  success: false;
  error: string;
}

interface SuccessResult {
  success: true;
  message: string;
  createdEvent: typeof calendarEvents.$inferSelect;
}

type EventResult = SuccessResult | ErrorResult;

// AI 處理上下文
interface AIContext {
  userId: string;
  messageId: string;
  controller: CalendarEventController;
  apiKey: string;
  timezone?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * 格式化成功訊息
 */
const formatSuccessMessage = (eventData: NewCalendarEvent, timezone: string): string => {
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };

  return `成功建立待辦事項
標題: ${eventData.title}
開始時間: ${eventData.start.toLocaleString('zh-TW', formatOptions)}
結束時間: ${eventData.end.toLocaleString('zh-TW', formatOptions)}`;
};

/**
 * 獲取用戶本地時間字串
 */
const getUserLocalDateString = (timezone: string): string => {
  const now = new Date();
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);
};

// ============================================================================
// EVENT CREATION LOGIC
// ============================================================================

/**
 * 執行事件創建的核心邏輯
 */
const executeCreateEvent = async (
  controller: CalendarEventController,
  eventData: NewCalendarEvent,
  timezone: string,
): Promise<EventResult> => {
  try {
    const createdEvent = await controller.createEvent(eventData);
    const resultMessage = formatSuccessMessage(eventData, timezone);

    return {
      success: true,
      message: resultMessage,
      createdEvent,
    };
  } catch (error) {
    const errorInfo = parseError(error, 'executeCreateEvent');
    console.error('🚀 ~ error:', errorInfo.message);
    return {
      success: false,
      error: errorInfo.userMessage,
    };
  }
};

/**
 * 創建直接事件（不使用AI工具時的默認行為）
 */
const createDirectEvent = async (
  controller: CalendarEventController,
  userMessage: string,
  userId: string,
  messageId: string,
  timezone: string,
): Promise<EventResult> => {
  const now = new Date();
  const endTime = new Date(now.getTime() + DEFAULT_EVENT_DURATION_HOURS * 60 * 60 * 1000);

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

  return await executeCreateEvent(controller, eventData, timezone);
};

// ============================================================================
// AI TOOLS
// ============================================================================

/**
 * 創建 AI 事件工具
 */
const createEventTool = (
  controller: CalendarEventController,
  userId: string,
  messageId: string,
  timezone: string,
) =>
  tool({
    description: '創建一個新的行事曆活動',
    parameters: createEventSchema,
    execute: async ({ title, description, start, end, allDay, color, label }) => {
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
      return await executeCreateEvent(controller, eventData, timezone);
    },
  });

// ============================================================================
// RESULT PROCESSING
// ============================================================================

/**
 * 處理工具調用結果
 */
const processToolResults = (
  toolCalls: any[],
  toolResults: any[] | undefined,
): { text: string; createdEvent: typeof calendarEvents.$inferSelect | null; success: boolean } => {
  let resultText = '';
  let createdEvent: typeof calendarEvents.$inferSelect | null = null;
  let success = false;

  if (toolCalls.length > 0 && toolResults) {
    for (const toolCall of toolCalls) {
      if (toolCall.toolName === 'createEvent') {
        const toolResult = toolResults.find((tr) => tr.toolCallId === toolCall.toolCallId);

        if (toolResult?.result) {
          const toolResultData = toolResult.result as EventResult;

          if (toolResultData.success) {
            createdEvent = toolResultData.createdEvent;
            resultText = toolResultData.message;
            success = true;
          } else {
            resultText = toolResultData.error;
            success = false;
          }
        }
        break; // 只處理第一個創建事件的工具調用
      }
    }
  }

  return { text: resultText, createdEvent, success };
};

// ============================================================================
// MAIN AI FUNCTION
// ============================================================================

// AI 函數返回類型
interface AIResult {
  success: boolean;
  text: string;
  toolCalls: any[];
  toolResults: any[];
  createdEvent: typeof calendarEvents.$inferSelect | null;
  error?: string;
}

/**
 * 使用 AI 創建事件的主要函數
 */
export const createEventWithAI = async (
  userMessage: string,
  context: AIContext,
): Promise<AIResult> => {
  const { userId, controller, apiKey, messageId } = context;
  const timezone = context.timezone || DEFAULT_TIMEZONE;

  try {
    const ai = createGoogleGenerativeAI({ apiKey });
    const userLocalDate = getUserLocalDateString(timezone);
    const eventTool = createEventTool(controller, userId, messageId, timezone);

    const result = await generateText({
      model: ai(AI_MODEL),
      messages: [
        {
          role: 'system',
          content: createEventPrompt({ timezone, userLocalDate }),
        },
        { role: 'user', content: userMessage },
      ],
      tools: { createEvent: eventTool },
      toolChoice: 'auto',
    });

    // 處理工具調用結果
    const {
      text: toolResultText,
      createdEvent,
      success: toolSuccess,
    } = processToolResults(result.toolCalls || [], result.toolResults);

    // 如果有工具結果，使用工具結果
    if (toolResultText) {
      return {
        success: toolSuccess,
        text: toolResultText,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
        createdEvent: createdEvent || null,
        error: toolSuccess ? undefined : toolResultText,
      };
    }

    // 沒有工具調用時，直接創建事件
    const directResult = await createDirectEvent(
      controller,
      userMessage,
      userId,
      messageId,
      timezone,
    );

    if (directResult.success) {
      return {
        success: true,
        text: directResult.message,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
        createdEvent: directResult.createdEvent,
        error: undefined,
      };
    } else {
      return {
        success: false,
        text: '',
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
        createdEvent: null,
        error: directResult.error,
      };
    }
  } catch (error) {
    const errorInfo = parseError(error, 'createEventWithAI');
    console.error('🚀 ~ error:', errorInfo.message);
    return {
      success: false,
      text: '',
      toolCalls: [],
      toolResults: [],
      createdEvent: null,
      error: errorInfo.userMessage,
    };
  }
};
