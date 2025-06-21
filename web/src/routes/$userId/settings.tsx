import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Copy,
  Check,
  Settings,
  Users,
  Slack,
  FileText,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SettingsPage = () => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedLineUrl, setCopiedLineUrl] = useState(false);

  // 設定項目狀態
  const [slackNotifications, setSlackNotifications] = useState(false);
  const [notionSync, setNotionSync] = useState(false);

  const websiteUrl = window.location.origin;
  const lineOaId = import.meta.env.VITE_LINEOA_ID;
  const lineUrl = `https://line.me/R/ti/p/@${lineOaId || '640uxald'}`;

  const copyToClipboard = async (text: string, type: 'website' | 'line') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'website') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedLineUrl(true);
        setTimeout(() => setCopiedLineUrl(false), 2000);
      }
      toast.success('連結已複製到剪貼簿');
    } catch {
      toast.error('複製失敗，請手動複製');
    }
  };

  const handleSlackToggle = (checked: boolean) => {
    // 因為功能開發中，所以不允許開啟
    if (checked) {
      toast.info('Slack 通知功能開發中，敬請期待！');
      return;
    }
    setSlackNotifications(checked);
  };

  const handleNotionToggle = (checked: boolean) => {
    // 因為功能開發中，所以不允許開啟
    if (checked) {
      toast.info('Notion 同步功能開發中，敬請期待！');
      return;
    }
    setNotionSync(checked);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Settings className="w-8 h-8" />
          設定
        </h1>
        <p className="text-muted-foreground">管理您的數位管家設定和偏好</p>
      </div>

      <div className="space-y-6">
        {/* 邀請好友 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              邀請好友
            </CardTitle>
            <CardDescription>分享 LINE 官方帳號，讓朋友也能享受智能助手服務</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-green-700">LINE 官方帳號</span>
                <a href={lineUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 ml-2">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    開啟 LINE
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-2 bg-white rounded border p-3">
                <code className="flex-1 text-sm text-gray-600 break-all">{lineUrl}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(lineUrl, 'line')}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  {copiedLineUrl ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 官網網址 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              官網網址
            </CardTitle>
            <CardDescription>分享數位管家官網給朋友，讓他們也能使用這個便利的服務</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    開啟官網
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-2 bg-white rounded border p-3">
                <code className="flex-1 text-sm text-gray-600 break-all">{websiteUrl}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(websiteUrl, 'website')}
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
          </CardContent>
        </Card>

        {/* 通知設定 */}
        <Card>
          <CardHeader>
            <CardTitle>通知設定</CardTitle>
            <CardDescription>管理您的通知偏好和第三方服務整合</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Slack 通知 */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Slack className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Slack 通知</h4>
                    <Badge variant="secondary" className="text-xs">
                      開發中
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">將重要提醒發送到您的 Slack 頻道</p>
                </div>
              </div>
              <Switch
                checked={slackNotifications}
                onCheckedChange={handleSlackToggle}
                disabled={true}
              />
            </div>

            {/* Notion 同步 */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Notion 同步</h4>
                    <Badge variant="secondary" className="text-xs">
                      開發中
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    將待辦事項和檔案同步到您的 Notion 工作區
                  </p>
                </div>
              </div>
              <Switch checked={notionSync} onCheckedChange={handleNotionToggle} disabled={true} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/$userId/settings')({
  component: SettingsPage,
});
