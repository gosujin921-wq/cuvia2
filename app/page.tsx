'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import EventSummary from '@/components/EventSummary';
import EventList from '@/components/EventList';
import MapView from '@/components/MapView';
import EventDetail from '@/components/EventDetail';
import CCTVQuickView from '@/components/CCTVQuickView';
import RightPanel2 from '@/components/RightPanel2';
import { Event, EventSummary as EventSummaryType } from '@/types';
import { allEvents, convertToDashboardEvent, getEventsByStatus, getEventsByRisk } from '@/lib/events-data';

export default function Home() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showCCTVView, setShowCCTVView] = useState(false);

  // 공통 데이터 사용
  const events: Event[] = useMemo(() => {
    return allEvents.map((event, index) => convertToDashboardEvent(event, index));
  }, []);

  // 이벤트 요약 계산
  const eventSummary: EventSummaryType = useMemo(() => {
    const inProgress = getEventsByStatus('IN_PROGRESS').length + getEventsByStatus('ACTIVE').length;
    const high = getEventsByRisk('HIGH').length;
    return {
      total: allEvents.length,
      inProgress,
      high,
      overlapped: 1, // 스레드 연결된 이벤트 수
    };
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowEventDetail(true);
    setHighlightedEventId(eventId);
  };

  const handleEventHover = (eventId: string | null) => {
    setHighlightedEventId(eventId);
  };

  const handleEventClick = (eventId: string) => {
    handleEventSelect(eventId);
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
          <div className="flex flex-col flex-shrink-0 w-80 border-r border-[#31353a]" style={{ borderWidth: '1px' }}>
            <div className="px-6 py-4">
              <div className="w-24 h-5 flex items-center justify-start">
                <img 
                  src="/logo.svg" 
                  alt="CUVIA Logo" 
                  className="h-5 w-auto object-contain"
                />
              </div>
            </div>
            <div className="px-4">
              <div className="h-px bg-[#31353a]" />
            </div>
            <div className="px-4 py-3">
              <EventSummary summary={eventSummary} />
            </div>
            <div className="px-4">
              <div className="h-px bg-[#31353a]" />
            </div>
            <div className="flex-1 overflow-hidden px-4 py-3">
              <EventList
                events={events}
                selectedEventId={selectedEventId || undefined}
                onEventSelect={handleEventSelect}
                onEventHover={handleEventHover}
              />
            </div>
          </div>
          <div className="flex-1 relative" style={{ minHeight: 0, width: '100%', height: '100%' }}>
            {/* Agent Hub 임시 버튼 */}
            <Link
              href="/agent-hub"
              className="absolute top-4 left-4 z-40 flex items-center gap-2 px-4 py-2 border border-blue-500 bg-blue-600/20 text-white text-sm font-medium hover:bg-blue-500/30 transition-colors"
              aria-label="Agent Hub"
            >
              <Icon icon="mdi:robot" className="w-4 h-4" />
              <span>Agent Hub</span>
            </Link>
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
