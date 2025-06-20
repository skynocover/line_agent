import { createFileRoute, Link } from '@tanstack/react-router';
import {
  FileText,
  CheckSquare,
  MessageSquare,
  ExternalLink,
  ArrowRight,
  Copy,
  Check,
  LogIn,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/features/auth';
import { useState } from 'react';
import { toast } from 'sonner';

const HomePage = () => {
  const { profile, login, isLoading, error, refreshAuthState } = useAuthStore();
  const lineOaId = import.meta.env.VITE_LINEOA_ID;
  const lineUrl = `https://line.me/R/ti/p/@${lineOaId || '640uxald'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    lineUrl,
  )}`;

  const [copiedUrl, setCopiedUrl] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(true);
      toast.success('連結已複製到剪貼簿');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast.error('複製失敗，請手動複製');
    }
  };

  const handleLogin = async () => {
    try {
      await login();
      if (profile) {
        toast.success(`歡迎回來，${profile.displayName}！`);
      }
    } catch (error) {
      console.error('Login failed:', error);
      // 如果不是重定向錯誤，顯示錯誤提示
      if (error instanceof Error && error.message !== 'Login redirect required') {
        toast.error('登入失敗，請稍後再試');
      }
    }
  };

  const handleRefreshAuth = async () => {
    try {
      await refreshAuthState();
      if (profile) {
        toast.success('認證狀態已更新');
      }
    } catch (error) {
      console.error('Refresh auth failed:', error);
      toast.error('更新認證狀態失敗');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🤖 數位管家
        </h1>
        <p className="text-xl text-muted-foreground mb-6">您的智能生活助手，讓日常管理更簡單！</p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefreshAuth} className="mt-2">
              重試
            </Button>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {profile ? (
          <Link to="/$userId/todo" params={{ userId: profile.userId }} className="no-underline">
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-purple-200 hover:border-purple-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-purple-600" />
                    文字 ➡️ 待辦事項
                  </div>
                </CardTitle>
                <CardDescription>只需要傳送文字訊息，AI 就會自動為您建立待辦事項</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">📝 自動解析任務內容</p>
                  <p className="text-sm text-muted-foreground">⏰ 智能設定提醒時間</p>
                  <p className="text-sm text-muted-foreground">🔄 即時同步更新</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-purple-600 font-medium">
                  <span>點擊進入管理</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="hover:shadow-lg transition-shadow border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-purple-600" />
                文字 ➡️ 待辦事項
              </CardTitle>
              <CardDescription>只需要傳送文字訊息，AI 就會自動為您建立待辦事項</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">📝 自動解析任務內容</p>
                <p className="text-sm text-muted-foreground">⏰ 智能設定提醒時間</p>
                <p className="text-sm text-muted-foreground">🔄 即時同步更新</p>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">💡 登入後即可使用</div>
            </CardContent>
          </Card>
        )}

        {profile ? (
          <Link to="/$userId/files" params={{ userId: profile.userId }} className="no-underline">
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-green-200 hover:border-green-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    檔案 ➡️ 永久備份
                  </div>
                </CardTitle>
                <CardDescription>上傳您的重要檔案，享受安全可靠的雲端儲存服務</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">☁️ 雲端安全儲存</p>
                  <p className="text-sm text-muted-foreground">🔒 加密保護隱私</p>
                  <p className="text-sm text-muted-foreground">📱 多裝置同步</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
                  <span>點擊進入管理</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="hover:shadow-lg transition-shadow border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                檔案 ➡️ 永久備份
              </CardTitle>
              <CardDescription>上傳您的重要檔案，享受安全可靠的雲端儲存服務</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">☁️ 雲端安全儲存</p>
                <p className="text-sm text-muted-foreground">🔒 加密保護隱私</p>
                <p className="text-sm text-muted-foreground">📱 多裝置同步</p>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">💡 登入後即可使用</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Welcome Section for authenticated users */}
      {profile && (
        <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-700">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-green-600" />
              </div>
              歡迎回來，{profile.displayName}！
            </CardTitle>
            <CardDescription className="text-green-600">
              您已成功登入，現在可以使用所有功能了
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center gap-4">
              <Link to="/$userId/todo" params={{ userId: profile.userId }}>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  待辦事項
                </Button>
              </Link>
              <Link to="/$userId/files" params={{ userId: profile.userId }}>
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  檔案管理
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login Section for non-authenticated users */}
      {!profile && (
        <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-blue-700">
              <LogIn className="w-6 h-6" />
              立即登入開始使用
            </CardTitle>
            <CardDescription className="text-blue-600">
              登入後即可享受完整的數位管家服務，包括待辦事項管理和檔案儲存
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              size="lg"
              onClick={handleLogin}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  登入中...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  登入帳號
                </>
              )}
            </Button>
            <p className="text-sm text-blue-500 mt-3">🔒 使用 LINE 帳號安全登入，無需額外註冊</p>
          </CardContent>
        </Card>
      )}

      {/* LINE Friend Section */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            加入 LINE 好友開始使用
          </CardTitle>
          <CardDescription>掃描 QR Code 或點擊連結，立即體驗數位管家服務</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="space-y-4">
              <img
                src={qrCodeUrl}
                alt="LINE 好友 QR Code"
                className="w-48 h-48 mx-auto border-2 border-gray-200 rounded-lg shadow-sm"
              />
              <p className="text-sm text-muted-foreground">掃描 QR Code 加好友</p>
            </div>
            <div className="space-y-4">
              <div className="text-left space-y-2">
                <h3 className="font-semibold">如何開始使用：</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>點擊下方按鈕或掃描 QR Code</li>
                  <li>加入 LINE 好友</li>
                  <li>傳送訊息開始對話</li>
                  <li>享受智能助手服務</li>
                </ol>
              </div>

              {/* LINE URL with copy function */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">LINE 連結：</p>
                <div className="flex items-center gap-2 bg-white rounded border p-2">
                  <code className="flex-1 text-xs text-gray-600 break-all">{lineUrl}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(lineUrl)}
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    {copiedUrl ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                <Button size="lg" className="bg-green-500 hover:bg-green-600">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  加入 LINE 好友
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        {profile ? (
          <p>🎉 您已成功登入！現在可使用所有功能</p>
        ) : (
          <p>💡 提示：登入後可使用完整功能，包括檔案管理和待辦事項同步</p>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute('/')({
  component: HomePage,
});
