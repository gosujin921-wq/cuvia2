'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Event } from '@/types';
import { getEventById, getEventCategory, getAIInsightKeywords } from '@/lib/events-data';

interface EventListProps {
  events: Event[];
  selectedEventId?: string;
  onEventSelect?: (eventId: string) => void;
  onEventHover?: (eventId: string | null) => void;
}

const EventList = ({ events, selectedEventId, onEventSelect, onEventHover }: EventListProps) => {
  // 이벤트 정렬: 우선순위 > 경보 수준 > 최신순
  const sortedEvents = [...events].sort((a, b) => {
    // Evidence는 가장 아래로
    if (a.status === 'EVIDENCE' && b.status !== 'EVIDENCE') return 1;
    if (b.status === 'EVIDENCE' && a.status !== 'EVIDENCE') return -1;
    
    // 우선순위 순서
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // 최신순 (timestamp 숫자로 변환)
    return parseInt(b.timestamp.replace(':', '')) - parseInt(a.timestamp.replace(':', ''));
  });

  // 메인 이벤트와 증거 이벤트 그룹화
  const groupedEvents: Array<{ main: Event; evidence?: Event[] }> = [];
  const processedEventIds = new Set<string>();
  
  sortedEvents.forEach((event) => {
    // 이미 처리된 이벤트는 스킵
    if (processedEventIds.has(event.id)) return;
    
    if (event.status === 'EVIDENCE') {
      // 증거 이벤트는 해당 메인 이벤트에 연결
      const mainEvent = sortedEvents.find((e) => 
        e.id !== event.id && 
        !processedEventIds.has(e.id) &&
        e.evidenceEvents?.includes(event.id)
      );
      if (mainEvent) {
        processedEventIds.add(event.id);
        processedEventIds.add(mainEvent.id);
        
        // 해당 메인 이벤트의 모든 증거 이벤트 수집
        const allEvidence = sortedEvents.filter((e) => 
          e.status === 'EVIDENCE' && 
          e.id !== event.id &&
          mainEvent.evidenceEvents?.includes(e.id)
        );
        groupedEvents.push({ 
          main: mainEvent, 
          evidence: [event, ...allEvidence].filter((e, idx, arr) => 
            arr.findIndex(a => a.id === e.id) === idx // 중복 제거
          )
        });
      }
    } else {
      // 메인 이벤트
      processedEventIds.add(event.id);
      
      // 해당 메인 이벤트의 모든 증거 이벤트 수집
      const evidence = sortedEvents.filter((e) => 
        e.status === 'EVIDENCE' && 
        !processedEventIds.has(e.id) &&
        event.evidenceEvents?.includes(e.id)
      );
      
      // 증거 이벤트도 처리됨으로 표시
      evidence.forEach(evt => processedEventIds.add(evt.id));
      
      groupedEvents.push({ 
        main: event, 
        evidence: evidence.length > 0 ? evidence : undefined 
      });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'border-red-500 bg-red-500/10';
      case 'Medium':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'Low':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return { label: 'NEW', color: 'bg-blue-600 text-white' };
      case 'MONITORING':
        return { label: '모니터링', color: 'bg-yellow-600 text-white' };
      case 'EVIDENCE':
        return { label: '증거', color: 'bg-gray-600 text-white' };
      default:
        return { label: status, color: 'bg-gray-600 text-white' };
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case '119-화재':
        return 'mdi:fire';
      case '112-미아':
        return 'mdi:account-child';
      case '약자':
        return 'mdi:account-alert';
      case 'AI-배회':
        return 'mdi:walk';
      case 'NDMS':
        return 'mdi:alert';
      default:
        return 'mdi:alert-circle';
    }
  };

  return (
    <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-[#2a2a2a]">
        <h2 className="text-white font-semibold text-sm">이벤트 리스트</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {groupedEvents.map((group) => {
          const { main, evidence } = group;
          const isSelected = selectedEventId === main.id;
          const statusBadge = getStatusBadge(main.status);
          const priorityColor = getPriorityColor(main.priority);

          return (
            <div key={main.id} className="space-y-1">
              {/* 메인 이벤트 */}
              <div
                onClick={() => onEventSelect?.(main.id)}
                onMouseEnter={() => onEventHover?.(main.id)}
                onMouseLeave={() => onEventHover?.(null)}
                className={`w-full text-left border rounded-lg p-3 transition-all ${
                  isSelected
                    ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/30'
                    : 'bg-[#1f1f1f] border-[#2a2a2a] hover:bg-[#2a2a2a]'
                }`}
                style={{ borderWidth: '1px' }}
              >
                {/* 1. 시간 / 신고기관 / 순위(위험도) */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{main.timestamp}</span>
                    {main.eventId && (() => {
                      const baseEvent = getEventById(main.eventId);
                      const source = baseEvent?.source || '';
                      const isAI = source.includes('AI') || source === 'AI';
                      return (
                        <span className="text-gray-400 text-xs">
                          {isAI ? 'AI' : source}
                        </span>
                      );
                    })()}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    main.priority === 'High'
                      ? 'bg-red-500/20 text-red-400'
                      : main.priority === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {main.priority}
                  </span>
                </div>

                {/* 2. 유형 / 카테고리 */}
                <div className="flex items-center gap-2 mb-2">
                  {main.eventId && (() => {
                    const baseEvent = getEventById(main.eventId);
                    if (!baseEvent) return null;
                    return (
                      <>
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
                        <span className="text-blue-400 text-xs">{getEventCategory(baseEvent)}</span>
                      </>
                    );
                  })()}
                </div>

                {/* 3. 제목 (AI가 축약한 핵심 문장) */}
                <div className="text-white text-sm font-semibold mb-2">{main.title}</div>

                {/* 4. 장소 (정확한 주소) */}
                <div className="text-gray-300 text-xs mb-2">{main.location.name}</div>

                {/* 5. AI 핵심 키워드 */}
                {main.eventId && (() => {
                  const baseEvent = getEventById(main.eventId);
                  if (!baseEvent) return null;
                  
                  const keywords = getAIInsightKeywords(baseEvent);
                  if (keywords.length === 0) return null;

                  return (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-xs text-gray-300"
                          style={{ borderWidth: '1px' }}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  );
                })()}

              </div>

              {/* 증거 이벤트 (들여쓰기) */}
              {evidence && evidence.length > 0 && (
                <div className="ml-4 space-y-1">
                  {evidence.map((evt, evtIndex) => (
                    <div
                      key={`${main.id}-evidence-${evt.id}-${evtIndex}`}
                      onClick={() => onEventSelect?.(evt.id)}
                      onMouseEnter={() => onEventHover?.(evt.id)}
                      onMouseLeave={() => onEventHover?.(null)}
                      className="p-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] cursor-pointer hover:bg-[#242424] transition-colors"
                      style={{ borderWidth: '1px' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        <span className="text-gray-400 text-xs">{evt.type}</span>
                        <span className="text-gray-500 text-xs">(Evidence)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventList;

