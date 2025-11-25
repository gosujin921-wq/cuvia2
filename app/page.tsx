'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import EventSummary from '@/components/EventSummary';
import EventList from '@/components/EventList';
import MapView from '@/components/MapView';
import AgentPanel from '@/components/AgentPanel';
import EventDetail from '@/components/EventDetail';
import CCTVQuickView from '@/components/CCTVQuickView';
import { Event, AgentMessage, EventSummary as EventSummaryType } from '@/types';
import { allEvents, convertToDashboardEvent, getEventsByStatus, getEventsByRisk } from '@/lib/events-data';

export default function Home() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      id: '1',
      timestamp: '00:00',
      content: '현재 지역에 강풍주의보가 발령되었습니다.\n\n산림·비포장도로·야간 환경에서 발생하는 화재·약자·미아 사건의 위험도를 상향 적용하겠습니다.',
      type: 'warning',
    },
  ]);
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

  // CCTV 샘플 데이터
  const cctvList = [
    { id: '1', name: 'CCTV-001', location: 'N Jones Blvd 근처' },
    { id: '2', name: 'CCTV-002', location: 'Rancho Dr 교차로' },
    { id: '3', name: 'CCTV-003', location: 'Fremont St 북쪽' },
    { id: '4', name: 'CCTV-004', location: 'Bonanza Rd 서쪽' },
  ];

  const handleSummaryRequest = () => {
    const newMessage: AgentMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      content: `산림 인접(40m), 조도 낮음, 강풍 경보 활성화, 주거지까지 120m 거리입니다.\n\n접근로 단일. 우선 대응을 권장합니다.`,
      type: 'analysis',
    };
    setAgentMessages([...agentMessages, newMessage]);
  };

  const handleLinkEvents = () => {
    const newMessage: AgentMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      content: '연관 스레드를 구성했습니다.',
      type: 'info',
    };
    setAgentMessages([...agentMessages, newMessage]);
  };

  const handleBroadcastDraft = () => {
    if (!selectedEvent || selectedEvent.type !== '119-화재') return;
    
    const newMessage: AgentMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      content: `119·112 전파 초안을 생성했습니다.\n\n위치: ${selectedEvent.location.name}\n상황: ${selectedEvent.title}\n\n확인 후 전송하실 수 있습니다.`,
      type: 'suggestion',
    };
    setAgentMessages([...agentMessages, newMessage]);
  };

  const handleBroadcastNow = () => {
    if (!selectedEvent || selectedEvent.type !== '119-화재') return;
    
    const newMessage: AgentMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      content: `소방서에 전파를 전송했습니다.\n\n전송 대상: ${selectedEvent.nearbyResources?.fireStations?.map(s => s.name).join(', ') || '인근 소방서'}`,
      type: 'info',
    };
    setAgentMessages([...agentMessages, newMessage]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <EventSummary summary={eventSummary} />
          <div className="flex flex-1 overflow-hidden relative">
            <EventList
              events={events}
              selectedEventId={selectedEventId || undefined}
              onEventSelect={handleEventSelect}
              onEventHover={handleEventHover}
            />
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
            {/* 우측: AI Agent 패널 (기획서 기준) */}
            {showEventDetail && selectedEvent ? (
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
            ) : (
              <AgentPanel
                messages={agentMessages}
                isCollapsed={true}
                onToggle={() => {}}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
