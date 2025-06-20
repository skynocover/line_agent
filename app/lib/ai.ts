import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { format } from 'date-fns';
import type { CalendarEventController } from '../src/calendar-events/controller';
import type { calendarEvents, NewCalendarEvent } from '../db/schema';

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
          content: `你是一個專門處理 LINE 或通訊軟體訊息的 AI 助手。你的主要任務是從用戶轉傳的訊息中提取時間、活動資訊，並使用 createEvent 工具創建行事曆活動。

核心功能
- 分析用戶轉傳的 LINE 或其他通訊軟體訊息
- 從訊息中提取時間、地點、活動內容等資訊
- 使用 createEvent 工具創建對應的行事曆活動

時區資訊:
- 用戶時區: ${timezone}
- 今天日期: ${userLocalDate}
- 當前時間: ${now.toLocaleString('zh-TW', { timeZone: timezone })}

處理規則
1. 時間處理 (重要)

時區處理：
- 用戶提及的時間都是基於 ${timezone} 時區
- 生成的 ISO 8601 時間字符串應該包含正確的時區偏移
- 不要使用 Z (UTC) 結尾，而是使用用戶時區的正確偏移量
- 例如：台北時間下午2點應該是 "2024-01-15T14:00:00+08:00"

相對時間轉換：將「下週四」、「明天」、「後天」等相對時間轉換為具體日期
基準日期：以用戶時區的當前日期為基準進行計算
時間格式：轉換為包含時區偏移的 ISO 8601 格式
預設時間：如果沒有指定具體時間，使用合理的預設時間 (例如：上午9:00)
結束時間：如果沒有明確結束時間，預設為開始時間後1小時

2. 活動標題 (必填)

優先使用訊息中的具體活動描述
如果訊息模糊或沒有明確活動內容，使用「待辦事項」作為標題
保持簡潔明瞭，避免過長的標題

3. 資訊提取原則

有資訊才填入：只有在訊息中明確提到的資訊才填入對應欄位
沒有資訊留空：不要憑空猜測或添加訊息中沒有的資訊
保持原意：忠實反映原始訊息的內容和語調

4. 欄位處理指南

title: 必填，從訊息提取或使用「待辦事項」
description: 可選，提取訊息中的詳細描述
start: 必填，轉換為包含時區偏移的 ISO 8601 格式
end: 必填，如無明確時間則預設為開始時間後1小時
allDay: 可選，根據訊息判斷是否為全天活動
color: 可選，只有訊息明確提到顏色才填入
label: 可選，可用於分類 (工作、個人、會議等)

常見情境範例 (基於 ${timezone} 時區)
情境1：完整資訊
用戶訊息：「明天下午2點在咖啡廳和小明開會討論專案」

title: "和小明開會討論專案"
start: "2024-01-16T14:00:00+08:00" (明天下午2點，台北時間)
end: "2024-01-16T15:00:00+08:00"
description: "在咖啡廳和小明開會討論專案"

情境2：模糊時間
用戶訊息：「下週四要交報告」

title: "交報告"
start: "2024-01-25T09:00:00+08:00" (下週四上午9點預設時間)
end: "2024-01-25T10:00:00+08:00"

情境3：全天活動
用戶訊息：「明天放假」

title: "放假"
start: "2024-01-16T00:00:00+08:00"
end: "2024-01-16T23:59:59+08:00"
allDay: true

情境4：只有文字
用戶訊息：「開會」
title: "開會"
start: (當前時間)
end: (當前時間+1小時)

情境5：只有日子 沒有時間
用戶訊息：「25號繳電費」
title: "25號繳電費"
start: "2024-01-25T00:00:00+08:00"
end: "2024-01-25T23:59:59+08:00"
allDay: true

情境6：只有時間 沒有日子
用戶訊息：「下午2點開會」
title: "下午2點開會"
start: "2024-01-16T14:00:00+08:00"
end: "2024-01-16T15:00:00+08:00"

情境7：跨天
用戶訊息：「出差時間」
title: "下週一到下週三"
start: "2024-01-21T00:00:00+08:00"
end: "2024-01-23T23:59:59+08:00"
allDay: true

重要提醒
- 必須使用 createEvent 工具來創建活動
- 時間計算要準確，特別注意時區偏移
- 不要使用 UTC 時間 (Z 結尾)，要使用用戶所在時區
- 標題是唯一必填且不能為空的欄位
- 如果沒有足夠資訊 就將使用者的文字設定成標題 開始時間為當前時間 結束時間為當前時間+1小時`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      tools: {
        createEvent: createEventTool,
      },
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
