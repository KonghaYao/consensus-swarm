/**
 * LoadingIndicator - 加载指示器组件
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingIndicator() {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
      <div className="flex-1 pt-2">
        <div className="text-sm text-muted-foreground">Zen Worker 正在思考...</div>
      </div>
    </div>
  );
}
