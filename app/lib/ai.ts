import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { z } from 'zod';
import { format } from 'date-fns';
import type { CalendarEventController } from '../src/calendar-events/controller';
import type { NewCalendarEvent } from '../db/schema';

export const createGoogleAI = ({ apiKey }: { apiKey: string }) => {
  return createGoogleGenerativeAI({
    apiKey,
  });
};

// Calendar Event 工具的參數 schema
export const createEventSchema = z.object({
  title: z.string().describe('活動標題'),
  description: z.string().optional().describe('活動描述'),
  start: z.string().describe('開始時間 (ISO 8601 格式，例如: 2024-01-15T10:00:00Z)'),
  end: z.string().describe('結束時間 (ISO 8601 格式，例如: 2024-01-15T11:00:00Z)'),
  allDay: z.boolean().optional().default(false).describe('是否為全天活動'),
  color: z.string().optional().describe('活動顏色'),
  label: z.string().optional().describe('活動標籤'),
});

// AI 工具定義：創建 calendar event
export const createEventTool = {
  description: '創建一個新的行事曆活動',
  parameters: createEventSchema,
};

// AI 助手函數，使用工具創建活動
export async function createEventWithAI(
  userMessage: string,
  context: { userId: string; controller: CalendarEventController; apiKey: string },
) {
  const { userId, controller, apiKey } = context;

  try {
    const ai = createGoogleAI({ apiKey });
    const result = await generateText({
      model: ai('gemini-2.0-flash-exp'),
      messages: [
        {
          role: 'system',
          content: `你是一個專門處理 LINE 或通訊軟體訊息的 AI 助手。你的主要任務是從用戶轉傳的訊息中提取時間、活動資訊，並使用 createEventTool 工具創建行事曆活動。
核心功能

分析用戶轉傳的 LINE 或其他通訊軟體訊息
從訊息中提取時間、地點、活動內容等資訊
使用 createEventTool 創建對應的行事曆活動
今天日期: ${format(new Date(), 'yyyy-MM-dd')}

處理規則
1. 時間處理

相對時間轉換：將「下週四」、「明天」、「後天」等相對時間轉換為具體日期
基準日期：以當前日期為基準進行計算
時間格式：統一轉換為 ISO 8601 格式 (例如: 2024-01-15T10:00:00Z)
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
start: 必填，轉換為 ISO 8601 格式
end: 必填，如無明確時間則預設為開始時間後1小時
allDay: 可選，根據訊息判斷是否為全天活動
color: 可選，只有訊息明確提到顏色才填入
label: 可選，可用於分類 (工作、個人、會議等)
location: 可選，只有訊息中提到地點才填入

常見情境範例
情境1：完整資訊
用戶訊息：「明天下午2點在咖啡廳和小明開會討論專案」

title: "和小明開會討論專案"
start: "2024-01-16T14:00:00Z" (假設今天是1/15)
end: "2024-01-16T15:00:00Z"
location: "咖啡廳"

情境2：模糊時間
用戶訊息：「下週四要交報告」

title: "交報告"
start: "2024-01-25T09:00:00Z" (計算下週四，使用預設時間)
end: "2024-01-25T10:00:00Z"

情境3：最簡資訊
用戶訊息：「記得買牛奶」

title: "買牛奶"
start: (使用當前時間或合理預設時間)
end: (開始時間+1小時)

重要提醒

必須使用 createEventTool 來創建活動
時間計算要準確，特別注意週期性時間詞彙
不要添加訊息中沒有的資訊
標題是唯一必填且不能為空的欄位
如果無法從訊息中提取任何有用資訊，詢問用戶提供更多詳細資料`,
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

    // 如果 AI 調用了 createEvent 工具，直接使用 controller 創建活動
    let resultText = '';
    let createdEvent = null;
    if (result.toolCalls && result.toolCalls.length > 0) {
      for (const toolCall of result.toolCalls) {
        if (toolCall.toolName === 'createEvent') {
          const eventParams = toolCall.args as CreateEventParams;

          // 構建 NewCalendarEvent 物件
          const eventData: NewCalendarEvent = {
            title: eventParams.title,
            description: eventParams.description,
            start: new Date(eventParams.start),
            end: new Date(eventParams.end),
            allDay: eventParams.allDay || false,
            color: eventParams.color,
            label: eventParams.label,
            userId: userId,
            completed: false,
          };

          console.log('🚀 ~ createEventWithAI ~ eventData:', eventData);
          resultText = `成功建立待辦事項
標題: ${eventData.title}
開始時間: ${format(eventData.start, 'yyyy/MM/dd HH:mm')}
結束時間: ${format(eventData.end, 'yyyy/MM/dd HH:mm')}
`;

          // 使用 controller 直接創建活動
          //   createdEvent = await controller.createEvent(eventData);
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
