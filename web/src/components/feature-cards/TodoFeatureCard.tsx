import { Link } from '@tanstack/react-router';
import { CheckSquare, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TodoFeatureCardProps {
  isAuthenticated: boolean;
  userId?: string;
}

export const TodoFeatureCard = ({ isAuthenticated, userId }: TodoFeatureCardProps) => {
  const cardContent = (
    <Card
      className={`hover:shadow-lg transition-shadow border-purple-200 gap-3 ${
        isAuthenticated
          ? 'hover:scale-[1.02] cursor-pointer hover:border-purple-300 transition-all duration-200'
          : ''
      }`}
    >
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
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-sm font-medium text-purple-700 mb-2">💡 使用範例：</p>
          <div className="space-y-1 text-xs text-purple-600">
            <p>「下週二早上十點會議」</p>
            <p>「明天下午2點和小明討論專案」</p>
            <p>「25號繳電費」</p>
          </div>
        </div>
        <div className="mt-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
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
      <Link to="/$userId/todo" params={{ userId }} className="no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};
