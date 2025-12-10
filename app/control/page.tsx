'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import ControlEventSummary from '@/components/control/ControlEventSummary';
import ControlEventList from '@/components/control/ControlEventList';
import MapView from '@/components/MapView';
import ControlRightPanel from '@/components/control/ControlRightPanel';
import CCTVQuickView from '@/components/CCTVQuickView';
import { ScaledLayout } from '@/components/layouts/ScaledLayout';
import { Event, EventSummary as EventSummaryType } from '@/types';
import { allEvents, convertToDashboardEvent } from '@/lib/events-data';

/**
 * 관제 페이지
 * 이벤트 모니터링 및 관제를 위한 메인 대시보드 페이지
 */
export default function ControlPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [showGeneralEvents, setShowGeneralEvents] = useState(false);

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

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    setHighlightedEventId(eventId);
  };

  const handleEventHover = (eventId: string | null) => {
    setHighlightedEventId(eventId);
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setHighlightedEventId(eventId);
  };

  // 주요 감시 지역 CCTV 리스트 생성
  const cctvList = useMemo(() => {
    const cctvLocalImages = [
      '/cctv_img/001.jpg',
      '/cctv_img/002.jpg',
      '/cctv_img/003.jpg',
      '/cctv_img/004.jpg',
      '/cctv_img/005.jpg',
    ];

    const buildThumbnails = (seed: string) => {
      const seededRandom = (s: string) => {
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
          hash = ((hash << 5) - hash) + s.charCodeAt(i);
          hash = hash & hash;
        }
        return Math.abs(hash) / 2147483647;
      };
      const baseIndex = Math.floor(seededRandom(seed) * cctvLocalImages.length);
      return Array.from({ length: 5 }, (_, i) => cctvLocalImages[(baseIndex + i) % cctvLocalImages.length]);
    };

    const monitoringSpots = [
      {
        spotId: '1',
        spotName: '중앙역 출입구 2번',
        fps: 29,
        status: 'delay',
        autoSequence: true,
        thumbnails: buildThumbnails('spot-1'),
        environment: 'normal',
      },
      {
        spotId: '2',
        spotName: '경찰서 앞',
        fps: 30,
        status: 'normal',
        autoSequence: true,
        thumbnails: buildThumbnails('spot-2'),
        environment: 'night',
      },
      {
        spotId: '3',
        spotName: '평촌대로 교차로',
        fps: 28,
        status: 'normal',
        autoSequence: true,
        thumbnails: buildThumbnails('spot-3'),
        environment: 'fog',
      },
      {
        spotId: '4',
        spotName: '터널 입구',
        fps: 30,
        status: 'normal',
        autoSequence: false,
        thumbnails: buildThumbnails('spot-4'),
        environment: 'normal',
      },
      {
        spotId: '5',
        spotName: '안양역 광장',
        fps: 27,
        status: 'delay',
        autoSequence: true,
        thumbnails: buildThumbnails('spot-5'),
        environment: 'rain',
      },
      {
        spotId: '6',
        spotName: '중앙시장 입구',
        fps: 30,
        status: 'normal',
        autoSequence: false,
        thumbnails: buildThumbnails('spot-6'),
        environment: 'normal',
      },
    ];

    // 모든 monitoringSpots를 표시하고, 추가 CCTV도 생성하여 빈 곳 없이 채움
    const baseList = monitoringSpots.map((spot) => ({
      id: spot.spotId,
      name: spot.spotName,
      location: `SPOT-${spot.spotId.padStart(3, '0')}`,
      thumbnail: spot.thumbnails[0],
    }));

    // 추가 CCTV 생성 (빈 곳 없이 채우기 위해)
    const additionalCCTVs = Array.from({ length: 10 }, (_, i) => {
      const spotId = String(7 + i);
      return {
        id: spotId,
        name: `감시 지점 ${spotId}`,
        location: `SPOT-${spotId.padStart(3, '0')}`,
        thumbnail: buildThumbnails(`spot-${spotId}`)[0],
      };
    });

    return [...baseList, ...additionalCCTVs];
  }, []);

  return (
    <ScaledLayout>
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0, height: '100%' }}>
        <div className="flex flex-1 overflow-hidden relative" style={{ minHeight: 0, height: '100%' }}>
            <div className="flex flex-col flex-shrink-0 border-r border-[#31353a] pl-4 pr-5" style={{ width: showGeneralEvents ? '1000px' : '900px' }}>
              <div className="py-4 px-3">
                <div className="flex items-center justify-between">
                  <div className="w-24 h-5 flex items-center justify-start">
                    <img 
                      src="/logo.svg" 
                      alt="CUVIA Logo" 
                      className="h-5 w-auto object-contain"
                    />
                  </div>
                  <button
                    onClick={() => setShowGeneralEvents(prev => !prev)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors flex items-center justify-center"
                    style={{
                      width: '32px',
                      height: '32px',
                    }}
                    aria-label="일반 이벤트 보기"
                  >
                    <Icon icon="mdi:view-grid" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="py-3">
                <ControlEventSummary summary={eventSummary} />
              </div>
              <div className="flex-1 overflow-hidden">
                <ControlEventList
                  events={events}
                  selectedEventId={selectedEventId || undefined}
                  onEventSelect={handleEventSelect}
                  onEventHover={handleEventHover}
                  showGeneralEvents={showGeneralEvents}
                />
              </div>
            </div>
            <div className="flex-1 relative" style={{ minHeight: 0, width: '100%', height: '100%' }}>
                <MapView
                  events={events}
                  highlightedEventId={highlightedEventId}
                  selectedEventId={selectedEventId}
                  onEventClick={handleEventClick}
                  onEventHover={handleEventHover}
                  onMapClick={() => {
                    setSelectedEventId(null);
                    setHighlightedEventId(null);
                  }}
                  onToggleGeneralEvents={() => setShowGeneralEvents(prev => !prev)}
                />
                <CCTVQuickView 
                  isVisible={true}
                  cctvList={cctvList}
                />
              </div>
              {/* 우측: ControlRightPanel */}
              <ControlRightPanel />
        </div>
      </div>
    </ScaledLayout>
  );
}

