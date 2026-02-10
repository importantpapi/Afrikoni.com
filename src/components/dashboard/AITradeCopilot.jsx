import React from 'react';
import KoniAIChat from '@/components/ai/KoniAIChat';

export default function AITradeCopilot({ mode = 'floating' }) {
  return <KoniAIChat mode={mode} />;
}
