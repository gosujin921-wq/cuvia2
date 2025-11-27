'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Event } from '@/types';
import { getEventById, getEventCategory, getAIInsightKeywords, formatEventDateTime } from '@/lib/events-data';

interface GeneralEventModalProps {
  events: Event[];
  selectedEventId?: string;
  onEventSelect?: (eventId: string) => void;
  onEventHover?: (eventId: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

const GeneralEventModal = ({ events, selectedEventId, onEventSelect, onEventHover, isOpen, onClose }: GeneralEventModalProps) => {
  const router = useRouter();
  
  // 일반 이벤트 ID 목록 (event-26부터 event-33)
  const generalEventIds = new Set([
    'event-26', 'event-27', 'event-28', 'event-29',
    'event-30', 'event-31', 'event-32', 'event-33',
  ]);

  // 일반 이벤트 필터링
  const generalEvents = events.filter((event) => generalEventIds.has(event.id));

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#161719] border border-[#31353a] rounded-lg shadow-xl w-[90vw] h-[90vh] max-w-[1200px] max-h-[800px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#31353a]">
          <h2 className="text-white text-lg font-semibold">일반 이벤트</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon="mdi:close" className="w-6 h-6" />
          </button>
        </div>

        {/* 4x4 그리드 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 grid-rows-4 gap-4">
            {generalEvents.map((event) => {
              const isSelected = selectedEventId === event.id;
              const baseEvent = event.eventId ? getEventById(event.eventId) : null;

              return (
                <div
                  key={event.id}
                  onClick={() => {
                    if (event.eventId) {
                      router.push(`/event/${event.eventId}`);
                      return;
                    }
                    onEventSelect?.(event.id);
                  }}
                  onMouseEnter={() => onEventHover?.(event.id)}
                  onMouseLeave={() => onEventHover?.(null)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/30'
                      : 'bg-[#1a1a1a] border-[#31353a] hover:bg-[#24272d] hover:border-[#4f7cff]'
                  }`}
                >
                  {/* 시간 */}
                  <div className="text-gray-400 text-xs mb-2">
                    {formatEventDateTime(event.eventId ?? '', event.timestamp)}
                  </div>

                  {/* 우선순위 뷸렛 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-2 h-2 rounded-full border-2 border-gray-400 inline-block" style={{ borderWidth: '3px' }} />
                  </div>

                  {/* 유형 */}
                  {baseEvent && (
                    <div className="mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        baseEvent.domain === 'A'
                          ? baseEvent.type.includes('폭행') || baseEvent.type.includes('상해')
                            ? 'bg-red-500/20 text-red-400'
                            : baseEvent.type.includes('절도') || baseEvent.type.includes('강도')
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : baseEvent.type.includes('차량도주') || baseEvent.type.includes('추적')
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-blue-500/20 text-blue-400'
                          : baseEvent.domain === 'B'
                            ? 'bg-red-500/20 text-red-400'
                            : baseEvent.domain === 'C'
                              ? 'bg-purple-500/20 text-purple-400'
                              : baseEvent.domain === 'D'
                                ? 'bg-green-500/20 text-green-400'
                                : baseEvent.domain === 'E'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {baseEvent.type}
                      </span>
                    </div>
                  )}

                  {/* 제목 */}
                  <div className="text-white text-sm font-semibold mb-2 line-clamp-2">
                    {event.title}
                  </div>

                  {/* 장소 */}
                  <div className="text-gray-300 text-xs mb-2 line-clamp-1">
                    {event.location.name}
                  </div>

                  {/* 이벤트 상태 */}
                  <div className="text-gray-400 text-xs">
                    {event.processingStage}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralEventModal;

