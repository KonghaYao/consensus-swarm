/**
 * ErrorMessage - 错误消息组件
 */

import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="my-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}
