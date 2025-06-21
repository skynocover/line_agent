import { Link } from '@tanstack/react-router';
import { FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FileFeatureCardProps {
  isAuthenticated: boolean;
  userId?: string;
}

export const FileFeatureCard = ({ isAuthenticated, userId }: FileFeatureCardProps) => {
  const cardContent = (
    <Card
      className={`hover:shadow-lg transition-shadow border-amber-200 gap-3 ${
        isAuthenticated
          ? 'hover:scale-[1.02] cursor-pointer hover:border-amber-300 transition-all duration-200'
          : ''
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-700" />
            檔案 ➡️ 永久備份
          </div>
        </CardTitle>
        <CardDescription>上傳您的重要檔案，享受安全可靠的雲端儲存服務</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-sm font-medium text-amber-800 mb-2">✨ 主要功能：</p>
          <div className="space-y-1 text-xs text-amber-700">
            <p>☁️ 雲端安全儲存</p>
            <p>🔒 加密保護隱私</p>
            <p>📱 多裝置同步</p>
          </div>
        </div>
        <div className="mt-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
              <span>點擊進入管理</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">💡 登入後即可使用</div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isAuthenticated && userId) {
    return (
      <Link to="/$userId/files" params={{ userId }} className="no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};
