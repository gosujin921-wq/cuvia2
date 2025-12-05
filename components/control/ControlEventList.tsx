 'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Event } from '@/types';
import {
  getEventById,
  getEventCategory,
  getAIInsightKeywords,
  formatEventDateTime,
} from '@/lib/events-data';

interface EventListProps {
  events: Event[];
  selectedEventId?: string;
  onEventSelect?: (eventId: string) => void;
  onEventHover?: (eventId: string | null) => void;
  showGeneralEvents?: boolean;
}

const ControlEventList = ({
  events,
  selectedEventId,
  onEventSelect,
  onEventHover,
  showGeneralEvents = false,
}: EventListProps) => {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const eventItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 일반 이벤트 ID 목록 (event-26부터 event-33)
  const generalEventIds = new Set([
    'event-26',
    'event-27',
    'event-28',
    'event-29',
    'event-30',
    'event-31',
    'event-32',
    'event-33',
  ]);

  // 간단 정렬: 긴급 > 경계 > 주의, 그 외
  const priorityOrder: Record<string, number> = {
    긴급: 3,
    경계: 2,
    주의: 1,
  };

  const sortedEvents = [...events].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 0;
    const pb = priorityOrder[b.priority] ?? 0;
    if (pa !== pb) {
      return pb - pa;
    }
    return (b.timestamp || '').localeCompare(a.timestamp || '');
  });

  useEffect(() => {
    if (selectedEventId) {
      onEventHover?.(selectedEventId);
      const eventElement = eventItemRefs.current[selectedEventId];
      const container = scrollContainerRef.current;
      if (eventElement && container) {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedEventId, onEventHover]);

  return (
    <div className="w-full bg-[#161719] flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
          <div className="space-y-1 px-2 py-2">
            {sortedEvents.map((event) => {
              const isSelected = selectedEventId === event.id;
              const isGeneral = generalEventIds.has(event.id);

              return (
                <div
                  key={event.id}
                  ref={(el) => {
                    eventItemRefs.current[event.id] = el;
                  }}
                  className={`w-full cursor-pointer border-b border-[#2f3136] px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'hover:bg-[#24272d]'
                  }`}
                  onClick={() => {
                    onEventSelect?.(event.id);
                  }}
                  onMouseEnter={() => onEventHover?.(event.id)}
                  onMouseLeave={() => onEventHover?.(null)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.7rem] text-gray-300">
                        {event.timestamp}
                      </span>
                      {isGeneral && (
                        <span className="px-1.5 py-0.5 rounded-full bg-gray-600 text-[0.6rem] text-white">
                          일반
                        </span>
                      )}
                    </div>
                    <span className="text-[0.7rem] text-gray-300">
                      {event.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      icon="mdi:alert-circle"
                      className="w-3.5 h-3.5 text-red-400"
                    />
                    <span className="text-xs font-semibold text-white">
                      {event.title}
                    </span>
                  </div>
                  <div className="text-[0.7rem] text-gray-400">
                    {event.location?.name}
                  </div>
                </div>
              );
            })}
            {sortedEvents.length === 0 && (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                표시할 이벤트가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlEventList;
