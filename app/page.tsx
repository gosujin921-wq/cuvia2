'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import EventSummary from '@/components/EventSummary';
import EventList from '@/components/EventList';
import MapView from '@/components/MapView';
import EventDetail from '@/components/EventDetail';
import CCTVQuickView from '@/components/CCTVQuickView';
import RightPanel2 from '@/components/RightPanel2';
import { Event, EventSummary as EventSummaryType } from '@/types';
import { allEvents, convertToDashboardEvent, getEventsByStatus, getEventsByRisk } from '@/lib/events-data';

export default function Home() {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showCCTVView, setShowCCTVView] = useState(false);

  // 공통 데이터 사용
  const events: Event[] = useMemo(() => {
    return allEvents
      .map((event, index) => convertToDashboardEvent(event, index))
      .filter((event) => event.processingStage !== '종결');
  }, []);

  // 이벤트 요약 계산 (처리결과 기준)
  const eventSummary: EventSummaryType = useMemo(() => {
    // 모든 이벤트를 변환 (종결 포함)
    const allConvertedEvents = allEvents.map((event, index) => convertToDashboardEvent(event, index));
    
    // 진행중: 생성, 선별, 착수, 사실 검증, 추적 · 지원, 전파
    const inProgressStages: Array<'생성' | '선별' | '착수' | '사실 검증' | '추적 · 지원' | '전파'> = [
      '생성',
      '선별',
      '착수',
      '사실 검증',
      '추적 · 지원',
      '전파',
    ];
    const inProgress = allConvertedEvents.filter((event) =>
      inProgressStages.includes(event.processingStage as any)
    ).length;
    
    // 종결: 종결 상태만
    const closed = allConvertedEvents.filter((event) => event.processingStage === '종결').length;
    
    return {
      total: allConvertedEvents.length,
      inProgress,
      closed,
    };
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  const agentRouteByDomain: Record<string, string> = {
    A: '/112-agent',
    B: '/119-agent',
    C: '/vulnerable-agent',
    D: '/ai-behavior-agent',
    E: '/disaster-agent',
    F: '/city-operations-agent',
  };

  const shouldRedirectToAgent = (eventId: string) => {
    const targetEvent = events.find((event) => event.id === eventId);
    const domainCode = targetEvent?.eventId?.split('-')[0];
    const route = domainCode ? agentRouteByDomain[domainCode] : undefined;
    if (route && targetEvent?.eventId) {
      router.push(`${route}?eventId=${targetEvent.eventId}`);
      return true;
    }
    return false;
  };

  const openEventDetail = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowEventDetail(true);
    setHighlightedEventId(eventId);
  };

  const handleEventSelect = (eventId: string) => {
    if (shouldRedirectToAgent(eventId)) {
      return;
    }
    openEventDetail(eventId);
  };

  const handleEventHover = (eventId: string | null) => {
    setHighlightedEventId(eventId);
  };

  const handleEventClick = (eventId: string) => {
    if (shouldRedirectToAgent(eventId)) {
      return;
    }
    openEventDetail(eventId);
    setShowCCTVView(true);
  };

  const cctvThumbnails = [
    '/cctv_img/001.jpg',
    '/cctv_img/002.jpg',
    '/cctv_img/003.jpg',
    '/cctv_img/004.jpg',
    '/cctv_img/005.jpg',
  ];

  // CCTV 샘플 데이터 (deterministic thumbnails)
  const baseCctvList = [
    { id: '1', name: 'CCTV-001', location: '비산동 주민센터 앞' },
    { id: '2', name: 'CCTV-002', location: '안양역 광장' },
    { id: '3', name: 'CCTV-003', location: '평촌대로 사거리' },
    { id: '4', name: 'CCTV-004', location: '관악산로 입구' },
  ];

  const cctvList = baseCctvList.map((item, index) => ({
    ...item,
    thumbnail: cctvThumbnails[index % cctvThumbnails.length],
  }));

  const handleSummaryRequest = () => {
    // TODO: Agent에게 요약 요청 기능 구현
  };

  const handleLinkEvents = () => {
    // TODO: 연관 이벤트 묶기 기능 구현
  };

  const handleBroadcastDraft = () => {
    // TODO: 전파 초안 생성 기능 구현
  };

  const handleBroadcastNow = () => {
    // TODO: 즉시 전파 기능 구현
  };

  return (
    <div className="flex flex-col h-screen bg-[#161719] overflow-hidden relative">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden relative">
          <div className="flex flex-col flex-shrink-0 w-80 border-r border-[#31353a] pl-6 pr-5">
            <div className="py-4">
              <div className="w-24 h-5 flex items-center justify-start">
                <img 
                  src="/logo.svg" 
                  alt="CUVIA Logo" 
                  className="h-5 w-auto object-contain"
                />
              </div>
            </div>
            <div className="py-3">
              <EventSummary summary={eventSummary} />
            </div>
            <div className="flex-1 overflow-hidden">
              <EventList
                events={events}
                selectedEventId={selectedEventId || undefined}
                onEventSelect={handleEventSelect}
                onEventHover={handleEventHover}
              />
            </div>
          </div>
          <div className="flex-1 relative" style={{ minHeight: 0, width: '100%', height: '100%' }}>
              <MapView
                events={events}
                highlightedEventId={highlightedEventId}
                selectedEventId={selectedEventId}
                onEventClick={handleEventClick}
              />
              <CCTVQuickView
                isVisible={showCCTVView}
                cctvList={cctvList}
                onClose={() => setShowCCTVView(false)}
              />
            </div>
            {/* 우측: RightPanel */}
            <RightPanel2 />
          </div>
      </div>

      {/* 이벤트 상세 모달 */}
      {showEventDetail && selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => {
            setShowEventDetail(false);
            setSelectedEventId(null);
          }}
          onSummaryRequest={handleSummaryRequest}
          onLinkEvents={handleLinkEvents}
          onBroadcastDraft={handleBroadcastDraft}
          onBroadcastNow={handleBroadcastNow}
        />
      )}
    </div>
  );
}
