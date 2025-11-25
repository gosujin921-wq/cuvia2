'use client';

import { Event } from '@/types';
import { Icon } from '@iconify/react';

interface MapViewProps {
  events: Event[];
  highlightedEventId?: string | null;
  onEventClick?: (eventId: string) => void;
  selectedEventId?: string | null;
}

const MapView = ({ events, highlightedEventId, onEventClick, selectedEventId }: MapViewProps) => {
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
      case '소방서':
        return 'mdi:fire-truck';
      default:
        return 'mdi:map-marker';
    }
  };

  const getEventPosition = (event: Event) => {
    switch (event.id) {
      case '1': // 화재
        return { left: 25, top: 30 };
      case '2': // 미아
        return { left: 45, top: 40 };
      case '3': // 배회 (증거)
        return { left: 47, top: 42 };
      case '4': // 약자
        return { left: 35, top: 55 };
      case '5': // NDMS
        return { left: 50, top: 50 };
      default:
        return { left: 30, top: 35 };
    }
  };

  return (
    <div 
      className="relative bg-[#0f0f0f] overflow-hidden" 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
      }}
    >
      {/* 지도 배경 이미지 */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <img 
          src="/map.png" 
          alt="Map" 
          className="w-full h-full object-cover"
          style={{ opacity: 0.8 }}
        />
      </div>

      {/* 이벤트 핀들 */}
      <div className="absolute inset-0" style={{ zIndex: 100, width: '100%', height: '100%' }}>
        {(events || []).map((event) => {
          const position = getEventPosition(event);
          const isHighlighted = highlightedEventId === event.id;

          return (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event.id)}
              className="absolute cursor-pointer group"
              style={{
                position: 'absolute',
                left: `${position.left}%`,
                top: `${position.top}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {event.status === 'EVIDENCE' ? (
                // 증거 이벤트: 작은 흰색 점
                <div className="w-3 h-3 bg-white rounded-full shadow-lg border border-gray-400 relative">
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                </div>
              ) : (
                // 일반 이벤트: 우선순위별 크기와 색상
                <div className="relative">
                  <div 
                    className={`rounded-full flex items-center justify-center shadow-2xl ${
                      event.priority === 'High' 
                        ? 'w-16 h-16 bg-red-600 border-4 border-red-400' 
                        : event.priority === 'Medium'
                        ? 'w-12 h-12 bg-yellow-600 border-4 border-yellow-400'
                        : 'w-10 h-10 bg-blue-600 border-4 border-blue-400 opacity-80'
                    }`}
                  >
                    <Icon
                      icon={getEventIcon(event.type)}
                      className="text-white"
                      width={event.priority === 'High' ? '32px' : event.priority === 'Medium' ? '24px' : '20px'}
                      height={event.priority === 'High' ? '32px' : event.priority === 'Medium' ? '24px' : '20px'}
                      style={{ 
                        filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
                      }}
                    />
                  </div>
                  
                  {/* 강조 표시 */}
                  {isHighlighted && (
                    <div className="absolute -inset-4 border-4 border-blue-500 rounded-full animate-pulse" />
                  )}
                  
                  {/* 호버 툴팁 */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                      isHighlighted ? 'opacity-100' : ''
                    }`}
                  >
                    <div className="font-semibold">{event.location.name}</div>
                    <div className="text-gray-400 text-[10px]">{event.type}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 소방서 핀들 - 화재 이벤트 선택 시 */}
      {selectedEventId && (() => {
        const selectedEvent = events.find(e => e.id === selectedEventId);
        if (selectedEvent?.type === '119-화재' && selectedEvent.nearbyResources?.fireStations) {
          return (
            <div className="absolute inset-0" style={{ zIndex: 90 }}>
              {selectedEvent.nearbyResources.fireStations.map((station, idx) => {
                const firePosition = getEventPosition(selectedEvent);
                const stationLeft = firePosition.left + 10 + (idx * 12);
                const stationTop = firePosition.top - 8 - (idx * 5);
                
                return (
                  <div
                    key={station.id}
                    className="absolute cursor-pointer group"
                    style={{
                      left: `${stationLeft}%`,
                      top: `${stationTop}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center border-4 border-blue-400 shadow-2xl">
                      <Icon
                        icon="mdi:fire-truck"
                        className="text-white"
                        width="32px"
                        height="32px"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))' }}
                      />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-blue-500 text-white text-xs whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="font-semibold">{station.name}</div>
                      <div className="text-blue-400 text-[10px]">{station.distance}km</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        return null;
      })()}

      {/* NDMS 경보 */}
      <div 
        className="absolute bg-red-600/30 border-2 border-red-500 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg"
        style={{
          top: '10px',
          left: '10px',
          zIndex: 200,
        }}
      >
        <Icon icon="mdi:alert" className="w-6 h-6 text-red-400" />
        <span className="text-white text-sm font-semibold">강풍주의보</span>
        <div className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

export default MapView;
