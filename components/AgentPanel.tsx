'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AgentMessage } from '@/types';

interface AgentPanelProps {
  messages?: AgentMessage[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const AgentPanel = ({
  messages = [],
  isCollapsed = true,
  onToggle,
}: AgentPanelProps) => {
  const [isMinimized, setIsMinimized] = useState(isCollapsed);

  const handleToggle = () => {
    setIsMinimized(!isMinimized);
    onToggle?.();
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return 'mdi:alert';
      case 'suggestion':
        return 'mdi:lightbulb-outline';
      case 'analysis':
        return 'mdi:chart-line';
      default:
        return 'mdi:information-outline';
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-600/20 border-yellow-600/50';
      case 'suggestion':
        return 'bg-blue-600/20 border-blue-600/50';
      case 'analysis':
        return 'bg-purple-600/20 border-purple-600/50';
      default:
        return 'bg-gray-700/20 border-gray-600/50';
    }
  };

  return (
    <div
      className={`w-12 bg-[#161719] border-l border-[#31353a] flex flex-col h-full transition-all duration-300 ${
        isMinimized ? '' : 'w-80'
      }`}
    >
      {isMinimized ? (
        <button
          onClick={handleToggle}
          className="w-full h-16 flex items-center justify-center border-b border-[#31353a] hover:bg-[#36383B] transition-colors"
          aria-label="Agent 패널 열기"
        >
          <Icon icon="mdi:robot-outline" className="w-6 h-6 text-blue-400" />
        </button>
      ) : (
        <>
          <div className="h-16 border-b border-[#31353a] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:robot" className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold text-sm">AI Agent</span>
            </div>
            <button
              onClick={handleToggle}
              className="p-1 hover:bg-[#36383B] transition-colors"
              aria-label="Agent 패널 접기"
            >
              <Icon icon="mdi:chevron-right" className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">
                <Icon icon="mdi:robot-outline" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>AI Agent가 대기 중입니다.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 border ${getMessageColor(message.type)}`}
                  style={{ borderWidth: '1px' }}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <Icon
                      icon={getMessageIcon(message.type)}
                      className={`w-4 h-4 mt-0.5 ${
                        message.type === 'warning'
                          ? 'text-yellow-400'
                          : message.type === 'suggestion'
                            ? 'text-blue-400'
                            : message.type === 'analysis'
                              ? 'text-purple-400'
                              : 'text-gray-400'
                      }`}
                    />
                    <span className="text-xs text-gray-400">{message.timestamp}</span>
                  </div>
                  <p className="text-white text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[#31353a] p-4 space-y-2">
            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
              Agent에게 요약 요청
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => {
                  // 메시지 초기화 기능 추가 가능
                }}
                className="w-full py-2 px-4 bg-[#36383B] hover:bg-[#161719] text-gray-300 text-sm font-medium transition-colors"
              >
                대화 초기화
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AgentPanel;

