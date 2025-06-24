export interface ErrorInfo {
  type: 'db' | 'axios' | 'ai' | 'file' | 'unknown';
  code?: string;
  message: string;
  shouldLog: boolean;
  shouldReply: boolean;
  userMessage: string; // 用戶可見的錯誤訊息
}

// 資料庫錯誤類型
export const DB_ERROR_TYPES = {
  UNIQUE_CONSTRAINT: 'UNIQUE constraint failed',
  FOREIGN_KEY_CONSTRAINT: 'FOREIGN KEY constraint failed',
  NOT_NULL_CONSTRAINT: 'NOT NULL constraint failed',
  CHECK_CONSTRAINT: 'CHECK constraint failed',
} as const;

// LINE API 錯誤類型
export const LINE_ERROR_TYPES = {
  INVALID_REPLY_TOKEN: 'Invalid reply token',
  RATE_LIMIT: 'Too Many Requests',
  INVALID_ACCESS_TOKEN: 'Invalid access token',
} as const;

// D1 資料庫錯誤類型 (新增)
export const D1_ERROR_TYPES = {
  UNIQUE_CONSTRAINT: 'UNIQUE constraint failed',
  FOREIGN_KEY_CONSTRAINT: 'FOREIGN KEY constraint failed',
  NOT_NULL_CONSTRAINT: 'NOT NULL constraint failed',
  CHECK_CONSTRAINT: 'CHECK constraint failed',
} as const;

/**
 * 深度解析錯誤信息，包括嵌套的 cause
 */
function extractErrorDetails(error: unknown): {
  message: string;
  cause?: string;
  fullStack?: string;
} {
  if (!error) {
    return { message: '未知錯誤' };
  }

  let currentError = error as any;
  let messages: string[] = [];
  let deepestCause = '';

  // 遍歷錯誤鏈，收集所有錯誤信息
  while (currentError) {
    if (currentError.message) {
      messages.push(currentError.message);
    }

    // 如果有 cause，繼續深入
    if (currentError.cause) {
      currentError = currentError.cause;
    } else {
      break;
    }
  }

  // 最深層的錯誤作為根本原因
  if (currentError && currentError.message) {
    deepestCause = currentError.message;
  }

  return {
    message: messages[0] || String(error),
    cause: deepestCause || messages[messages.length - 1],
    fullStack: messages.join(' -> '),
  };
}

/**
 * 檢查是否為 D1 資料庫錯誤
 */
function isD1DatabaseError(error: unknown): boolean {
  const errorDetails = extractErrorDetails(error);

  // 檢查錯誤信息中是否包含 D1_ERROR 或資料庫約束錯誤
  const errorText = `${errorDetails.message} ${errorDetails.cause} ${errorDetails.fullStack}`;

  return (
    errorText.includes('D1_ERROR') ||
    errorText.includes('DrizzleQueryError') ||
    Object.values(D1_ERROR_TYPES).some((type) => errorText.includes(type))
  );
}

/**
 * 解析 D1 資料庫錯誤
 */
function parseD1DatabaseError(error: unknown): ErrorInfo {
  const errorDetails = extractErrorDetails(error);
  const fullErrorText = `${errorDetails.message} ${errorDetails.cause} ${errorDetails.fullStack}`;

  console.log('🔍 D1 錯誤詳細信息:');
  console.log('  主要錯誤:', errorDetails.message);
  console.log('  根本原因:', errorDetails.cause);
  console.log('  完整鏈路:', errorDetails.fullStack);

  // UNIQUE constraint 錯誤 - message_id 重複
  if (fullErrorText.includes(D1_ERROR_TYPES.UNIQUE_CONSTRAINT)) {
    // 提取具體的約束失敗字段
    let constraintDetail = '';
    if (fullErrorText.includes('message_id')) {
      constraintDetail = '訊息ID重複';
    } else if (fullErrorText.includes('user_id')) {
      constraintDetail = '用戶ID重複';
    } else {
      constraintDetail = '資料重複';
    }

    return {
      type: 'db',
      code: 'UNIQUE_CONSTRAINT',
      message: `D1 唯一約束錯誤: ${constraintDetail} - ${errorDetails.cause}`,
      userMessage: '此訊息已經處理過，請勿重複提交',
      shouldLog: false, // message_id 重複是正常情況，不需要記錄
      shouldReply: false, // 不需要回覆用戶
    };
  }

  // FOREIGN KEY constraint 錯誤
  if (fullErrorText.includes(D1_ERROR_TYPES.FOREIGN_KEY_CONSTRAINT)) {
    return {
      type: 'db',
      code: 'FOREIGN_KEY_CONSTRAINT',
      message: `D1 外鍵約束錯誤: ${errorDetails.cause}`,
      userMessage: '資料關聯錯誤',
      shouldLog: true,
      shouldReply: true,
    };
  }

  // NOT NULL constraint 錯誤
  if (fullErrorText.includes(D1_ERROR_TYPES.NOT_NULL_CONSTRAINT)) {
    return {
      type: 'db',
      code: 'NOT_NULL_CONSTRAINT',
      message: `D1 非空約束錯誤: ${errorDetails.cause}`,
      userMessage: '必要資料缺失',
      shouldLog: true,
      shouldReply: true,
    };
  }

  // CHECK constraint 錯誤
  if (fullErrorText.includes(D1_ERROR_TYPES.CHECK_CONSTRAINT)) {
    return {
      type: 'db',
      code: 'CHECK_CONSTRAINT',
      message: `D1 檢查約束錯誤: ${errorDetails.cause}`,
      userMessage: '資料格式錯誤',
      shouldLog: true,
      shouldReply: true,
    };
  }

  // 其他 D1 資料庫錯誤
  return {
    type: 'db',
    message: `D1 資料庫錯誤: ${errorDetails.cause || errorDetails.message}`,
    userMessage: '資料處理失敗',
    shouldLog: true,
    shouldReply: true,
  };
}

/**
 * 解析並分類錯誤
 */
export function parseError(error: unknown, context?: string): ErrorInfo {
  // 處理 null 或 undefined
  if (!error) {
    return {
      type: 'unknown',
      message: '未知錯誤',
      userMessage: '處理時發生未知錯誤',
      shouldLog: true,
      shouldReply: true,
    };
  }

  // 優先檢查 D1 資料庫錯誤
  if (isD1DatabaseError(error)) {
    return parseD1DatabaseError(error);
  }

  // 轉換為字串以便檢查
  const errorString = String(error);
  const errorMessage = error instanceof Error ? error.message : errorString;

  // 資料庫錯誤檢查
  if (isDatabaseError(errorString)) {
    return parseDatabaseError(errorString);
  }

  // Axios/LINE API 錯誤檢查
  if (isAxiosError(error)) {
    return parseAxiosError(error);
  }

  // AI 相關錯誤
  if (context && context.includes('AI')) {
    return {
      type: 'ai',
      message: errorMessage,
      userMessage: 'AI 處理失敗，請稍後再試',
      shouldLog: true,
      shouldReply: true,
    };
  }

  // 檔案相關錯誤
  if (context && context.includes('file')) {
    return {
      type: 'file',
      message: errorMessage,
      userMessage: '檔案處理失敗',
      shouldLog: true,
      shouldReply: true,
    };
  }

  // 一般錯誤
  return {
    type: 'unknown',
    message: errorMessage,
    userMessage: '處理時發生錯誤',
    shouldLog: true,
    shouldReply: true,
  };
}

/**
 * 檢查是否為資料庫錯誤
 */
function isDatabaseError(errorString: string): boolean {
  return Object.values(DB_ERROR_TYPES).some((type) => errorString.includes(type));
}

/**
 * 解析資料庫錯誤
 */
function parseDatabaseError(errorString: string): ErrorInfo {
  // UNIQUE constraint 錯誤 - 通常是重複提交
  if (errorString.includes(DB_ERROR_TYPES.UNIQUE_CONSTRAINT)) {
    return {
      type: 'db',
      code: 'UNIQUE_CONSTRAINT',
      message: '資料重複約束錯誤',
      userMessage: '資料重複，請勿重複提交',
      shouldLog: false, // 這種錯誤不需要記錄
      shouldReply: false, // 不需要回覆用戶
    };
  }

  // FOREIGN KEY constraint 錯誤
  if (errorString.includes(DB_ERROR_TYPES.FOREIGN_KEY_CONSTRAINT)) {
    return {
      type: 'db',
      code: 'FOREIGN_KEY_CONSTRAINT',
      message: '外鍵約束錯誤',
      userMessage: '資料關聯錯誤',
      shouldLog: true,
      shouldReply: true,
    };
  }

  // NOT NULL constraint 錯誤
  if (errorString.includes(DB_ERROR_TYPES.NOT_NULL_CONSTRAINT)) {
    return {
      type: 'db',
      code: 'NOT_NULL_CONSTRAINT',
      message: '非空約束錯誤',
      userMessage: '必要資料缺失',
      shouldLog: true,
      shouldReply: true,
    };
  }

  // CHECK constraint 錯誤
  if (errorString.includes(DB_ERROR_TYPES.CHECK_CONSTRAINT)) {
    return {
      type: 'db',
      code: 'CHECK_CONSTRAINT',
      message: '檢查約束錯誤',
      userMessage: '資料格式錯誤',
      shouldLog: true,
      shouldReply: true,
    };
  }

  // 其他資料庫錯誤
  return {
    type: 'db',
    message: '資料庫操作失敗',
    userMessage: '資料處理失敗',
    shouldLog: true,
    shouldReply: true,
  };
}

/**
 * 檢查是否為 Axios 錯誤
 */
function isAxiosError(error: unknown): boolean {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'response' in error &&
    (error as any).response !== null
  );
}

/**
 * 解析 Axios 錯誤
 */
function parseAxiosError(error: any): ErrorInfo {
  const responseData = error.response?.data;
  const statusCode = error.response?.status;
  const errorMessage = responseData?.message || responseData?.error || error.message;

  // LINE API 特定錯誤
  if (typeof errorMessage === 'string') {
    // Invalid reply token - 通常是訊息過期
    if (errorMessage.includes(LINE_ERROR_TYPES.INVALID_REPLY_TOKEN)) {
      return {
        type: 'axios',
        code: 'INVALID_REPLY_TOKEN',
        message: 'Reply token 已過期',
        userMessage: '訊息已過期，無法回覆',
        shouldLog: false, // 這是正常情況，不需要記錄
        shouldReply: false, // 不能回覆
      };
    }

    // Rate limit
    if (errorMessage.includes(LINE_ERROR_TYPES.RATE_LIMIT)) {
      return {
        type: 'axios',
        code: 'RATE_LIMIT',
        message: 'API 請求頻率過高',
        userMessage: '請求過於頻繁，請稍後再試',
        shouldLog: true,
        shouldReply: false,
      };
    }

    // Invalid access token
    if (errorMessage.includes(LINE_ERROR_TYPES.INVALID_ACCESS_TOKEN)) {
      return {
        type: 'axios',
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Access token 無效',
        userMessage: '認證失敗',
        shouldLog: true,
        shouldReply: false,
      };
    }
  }

  // HTTP 狀態碼分類
  if (statusCode) {
    if (statusCode >= 400 && statusCode < 500) {
      return {
        type: 'axios',
        code: `HTTP_${statusCode}`,
        message: `客戶端錯誤 (${statusCode}): ${errorMessage}`,
        userMessage: '請求格式錯誤',
        shouldLog: true,
        shouldReply: statusCode !== 429, // 429 是 rate limit，不回覆
      };
    }

    if (statusCode >= 500) {
      return {
        type: 'axios',
        code: `HTTP_${statusCode}`,
        message: `伺服器錯誤 (${statusCode})`,
        userMessage: '服務暫時不可用，請稍後再試',
        shouldLog: true,
        shouldReply: true,
      };
    }
  }

  // 其他 Axios 錯誤
  return {
    type: 'axios',
    message: `網路請求失敗: ${errorMessage}`,
    userMessage: '網路連線失敗',
    shouldLog: true,
    shouldReply: true,
  };
}

/**
 * 統一的錯誤處理函數
 */
export function handleError(error: unknown, context?: string): ErrorInfo {
  const errorInfo = parseError(error, context);

  if (errorInfo.shouldLog) {
    const logMessage = context
      ? `🚀 ~ ${context} ~ error: ${errorInfo.message}`
      : `🚀 ~ error: ${errorInfo.message}`;

    console.error(logMessage, error);
  }

  return errorInfo;
}

/**
 * 檢查錯誤是否應該被忽略（不記錄，不回覆）
 */
export function shouldIgnoreError(error: unknown): boolean {
  const errorInfo = parseError(error);
  return !errorInfo.shouldLog && !errorInfo.shouldReply;
}

/**
 * 格式化用戶錯誤訊息
 */
export function formatUserErrorMessage(error: unknown, context?: string): string {
  const errorInfo = parseError(error, context);
  return errorInfo.userMessage;
}
