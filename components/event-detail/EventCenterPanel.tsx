'use client';

import React, { useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ChatMessage, SavedClip } from './types';
import { chatBlocks, quickCommands, cctvInfo } from './constants';

interface EventCenterPanelProps {
  categoryLabel: string;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  isResponding: boolean;
  savedClips: SavedClip[];
  setSelectedCCTV: (cctv: string | null) => void;
  setShowCCTVPopup: (show: boolean) => void;
  handleSendMessage: (messageText?: string) => void;
  handleDeleteClip: (clipId: string) => void;
}

export const EventCenterPanel: React.FC<EventCenterPanelProps> = ({
  categoryLabel,
  chatMessages,
  chatInput,
  setChatInput,
  isResponding,
  savedClips,
  setSelectedCCTV,
  setShowCCTVPopup,
  handleSendMessage,
  handleDeleteClip,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, isResponding]);

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 pl-10 pr-9 space-y-8">
        {/* AI Chat Blocks */}
        <div className="space-y-4">
          {chatBlocks.map((block) => (
            <div key={block.title} className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon icon={block.icon} className="w-4 h-4 text-blue-600" />
                <h4 className="text-gray-900 font-semibold text-sm">{block.title}</h4>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{block.content}</p>
            </div>
          ))}
        </div>

        {/* CCTV 추천 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:cctv" className="w-4 h-4 text-blue-600" />
            <h4 className="text-gray-900 font-semibold text-sm">CCTV 추천</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {['CCTV-7 (현장)', 'CCTV-12 (북쪽 50m)', 'CCTV-15 (골목길)'].map((cctv) => (
              <button
                key={cctv}
                onClick={() => {
                  setSelectedCCTV(cctv);
                  setShowCCTVPopup(true);
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                style={{ borderWidth: '1px' }}
              >
                {cctv}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-200"></div>

        {/* 대화 로그 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700 text-sm">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] flex items-center justify-center text-white">
              <Icon icon="mdi:sparkles" className="w-4 h-4" />
            </div>
            <span className="text-gray-900">{categoryLabel} Agent</span>
          </div>
          <div className="space-y-3">
            {chatMessages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl border text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-100 text-gray-900 border-gray-200'
                    }`}
                    style={{ borderWidth: '1px' }}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {message.timestamp}
                    </div>
                  </div>
                </div>
                {message.role === 'assistant' && message.buttons && message.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {message.buttons.map((button) => (
                      <button
                        key={button}
                        onClick={() => {
                          setSelectedCCTV(button);
                          setShowCCTVPopup(true);
                        }}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        style={{ borderWidth: '1px' }}
                      >
                        {button}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isResponding && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>
        </div>

        {/* 스크롤 앵커 - 항상 하단에 고정 */}
        <div ref={bottomRef} style={{ height: '150px' }} />
      </div>

      {/* 빠른 명령 + 자연어 입력 */}
      <div className="border-t border-gray-200 bg-white p-4 sticky bottom-0 left-0 right-0" style={{ borderWidth: '1px' }}>
        <div className="flex flex-wrap gap-2 mb-3">
          {quickCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleSendMessage(cmd)}
              className="px-3 py-1.5 rounded-full text-xs text-gray-700 transition-colors border border-gray-300 bg-gray-50 hover:bg-gray-100"
              style={{ borderWidth: '1px' }}
            >
              {cmd}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="자연어로 질문하세요... (예: '이 사람 다시 보여줘', '관련 CCTV 더 추천해줘')"
            className="flex-1 bg-gray-50 border border-gray-300 rounded-full px-4 py-3 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white"
            style={{ borderWidth: '1px' }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isResponding}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              isResponding ? 'bg-blue-300 text-blue-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            전송
          </button>
        </div>
      </div>
    </main>
  );
};

