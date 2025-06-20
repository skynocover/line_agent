import axios from 'axios';

// LIFF Access Token 驗證中間件
const verifyLiffAccessToken = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Access token is required' }, 401);
  }

  const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // 驗證 access token 的有效性
    const response = await axios.get('https://api.line.me/oauth2/v2.1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status !== 200) {
      return c.json({ error: 'Invalid access token' }, 401);
    }

    // 將使用者資訊附加到 context 中
    c.set('liffUser', {
      userId: response.data.sub,
      accessToken: accessToken,
    });

    await next();
  } catch (error) {
    console.error('LIFF token verification failed:', error);
    return c.json({ error: 'Invalid access token' }, 401);
  }
};

// 驗證路由參數中的userId與登入用戶userId是否相同
const verifyUserIdMatch = async (c: any, next: () => Promise<void>) => {
  const routeUserId = c.req.param('userId');
  // @ts-ignore
  const liffUser = c.get('liffUser');

  if (!liffUser || !liffUser.userId) {
    return c.json({ error: 'User not authenticated' }, 401);
  }

  if (routeUserId !== liffUser.userId) {
    return c.json({ error: 'Unauthorized: User ID mismatch' }, 403);
  }

  await next();
};

export { verifyLiffAccessToken, verifyUserIdMatch };
