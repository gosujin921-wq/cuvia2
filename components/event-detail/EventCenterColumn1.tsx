'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface EventCenterColumn1Props {
  isRightPanelCollapsed: boolean;
  showCCTV: boolean;
  setShowCCTV: (value: boolean | ((prev: boolean) => boolean)) => void;
  showCCTVViewAngle: boolean;
  setShowCCTVViewAngle: (value: boolean | ((prev: boolean) => boolean)) => void;
  showCCTVName: boolean;
  setShowCCTVName: (value: boolean | ((prev: boolean) => boolean)) => void;
  selectedMapCCTV: string | null;
  setSelectedMapCCTV: (value: string | null) => void;
  setShowMapCCTVPopup: (value: boolean) => void;
  movementTimeline: Array<{
    time: string;
    title: string;
    subtitle: string;
    cctvName: string | null;
    color: string;
    cctvId: string | null;
  }>;
}

export const EventCenterColumn1: React.FC<EventCenterColumn1Props> = ({
  isRightPanelCollapsed,
  showCCTV,
  setShowCCTV,
  showCCTVViewAngle,
  setShowCCTVViewAngle,
  showCCTVName,
  setShowCCTVName,
  selectedMapCCTV,
  setSelectedMapCCTV,
  setShowMapCCTVPopup,
  movementTimeline,
}) => {
  // CCTV 위치 정보 (맵 좌표 기준) - 같은 위치에 여러 CCTV가 있을 수 있음
  const cctvLocationGroups: Record<string, { position: { left: number; top: number }; cctvs: string[] }> = {
    'location-1': {
      position: { left: 15, top: 80 },
      cctvs: ['CCTV-7', 'CCTV-8', 'CCTV-9'], // 같은 위치에 여러 CCTV
    },
    'location-2': {
      position: { left: 40, top: 60 },
      cctvs: ['CCTV-12', 'CCTV-11'], // 같은 위치에 여러 CCTV
    },
    'location-3': {
      position: { left: 70, top: 65 },
      cctvs: ['CCTV-15'], // 단독 CCTV
    },
    'location-4': {
      position: { left: 50, top: 40 },
      cctvs: ['CCTV-3', 'CCTV-5', 'CCTV-13'], // 같은 위치에 여러 CCTV
    },
    'location-5': {
      position: { left: 85, top: 45 },
      cctvs: ['CCTV-16'], // 현재 위치 주변 (용의자 추적중)
    },
  };

  // CCTV ID로 위치 그룹 찾기
  const getLocationGroupForCCTV = (cctvId: string) => {
    for (const [locationId, group] of Object.entries(cctvLocationGroups)) {
      if (group.cctvs.includes(cctvId)) {
        return group;
      }
    }
    return null;
  };

  // CCTV ID로 위치 그룹의 CCTV 목록 가져오기
  const getCCTVsAtSameLocation = (cctvId: string): string[] => {
    const group = getLocationGroupForCCTV(cctvId);
    return group ? group.cctvs : [cctvId];
  };

  // 타임라인에서 CCTV별 title (감지 이유) 찾기
  const getTimelineTitle = (cctvId: string) => {
    const entry = movementTimeline.find((item) => {
      if (cctvId === 'CCTV-7') return item.cctvId === 'CCTV-7';
      if (cctvId === 'CCTV-12') return item.cctvId === 'CCTV-12';
      if (cctvId === 'CCTV-15') return item.cctvId === 'CCTV-15';
      if (cctvId === 'CCTV-3') return item.cctvId === 'CCTV-3';
      if (cctvId === '현재 위치') return item.cctvId === null;
      return false;
    });
    return entry?.title || '';
  };

  // 각 위치의 CCTV 그룹 정보
  const location1CCTVs = getCCTVsAtSameLocation('CCTV-7');
  const location2CCTVs = getCCTVsAtSameLocation('CCTV-12');
  const location3CCTVs = getCCTVsAtSameLocation('CCTV-15');
  const location4CCTVs = getCCTVsAtSameLocation('CCTV-3');
  const location5CCTVs = getCCTVsAtSameLocation('CCTV-16'); // 현재 위치

  return (
    <div className="flex flex-col pt-4 overflow-y-auto pr-4 flex-shrink-0" style={{ width: isRightPanelCollapsed ? '50%' : '55%', minHeight: 0, height: '100%' }}>
      {/* 지도 - 박스 밖으로 */}
      <div
        className="relative border border-[#31353a] overflow-hidden bg-cover bg-center bg-no-repeat mb-6"
        style={{
          borderWidth: '1px',
          backgroundImage: 'url(/map_anyang.png)',
          height: 'calc(80vh)',
        }}
      >
        {/* CCTV 토글 버튼 */}
        <div 
          className="absolute top-4 right-4 flex flex-col gap-2" 
          style={{ zIndex: 250 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCCTV(prev => !prev);
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              showCCTV 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]'
            }`}
            style={{ borderWidth: '1px' }}
            aria-label="CCTV"
          >
            <Icon icon="mdi:cctv" className="w-5 h-5" />
          </button>
          
          {/* CCTV 서브 토글 버튼들 */}
          {showCCTV && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCCTVViewAngle(prev => !prev);
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  showCCTVViewAngle 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]'
                }`}
                style={{ borderWidth: '1px' }}
                aria-label="시야각 켜기"
              >
                <Icon icon="mdi:angle-acute" className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCCTVName(prev => !prev);
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  showCCTVName 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]'
                }`}
                style={{ borderWidth: '1px' }}
                aria-label="CCTV 명 켜기"
              >
                <Icon icon="mdi:label" className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* 지도 이미지 위에 SVG 오버레이 */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* 동선 경로 - 타임라인 순서대로: CCTV-7 → CCTV-12 → CCTV-15 → CCTV-3 → 현재 위치 */}
          <polyline 
            points="30,160 80,120 140,130 100,80 170,90" 
            fill="none" 
            stroke="#5390ff" 
            strokeWidth="1" 
            strokeDasharray="2 2"
            className="animate-dash"
          />
        </svg>

        {/* CCTV 아이콘들로 핀 대체 */}
        {/* 시작 지점 CCTV */}
        {showCCTV && (
          <div 
            className="absolute cursor-pointer" 
            style={{ left: '15%', top: '80%', transform: 'translate(-50%, -50%)', zIndex: 100 }}
            onClick={() => {
              setSelectedMapCCTV('CCTV-7');
              setShowMapCCTVPopup(true);
            }}
          >
            <div className="w-7 h-7 bg-[#1a1a1a] border-2 border-yellow-500 rounded-lg flex items-center justify-center shadow-xl relative hover:scale-110 transition-transform">
              <Icon 
                icon="mdi:cctv" 
                className="text-yellow-400" 
                width="16px" 
                height="16px"
              />
              {/* 클러스터 뱃지 - 같은 위치에 여러 CCTV가 있을 때 */}
              {location1CCTVs.length > 1 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500/90 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg border-2 border-blue-400 z-20">
                  {location1CCTVs.length}
                </div>
              )}
            </div>
              {showCCTVName && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#1a1a1a] border border-yellow-500 rounded text-white text-xs whitespace-nowrap shadow-lg z-10">
                  CCTV-7
                </div>
              )}
              {/* 타임라인 타이틀 */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'} px-2 py-0.5 bg-[#1a1a1a] border border-yellow-500 rounded text-yellow-400 text-xs whitespace-nowrap shadow-lg z-10`}>
                {getTimelineTitle('CCTV-7')}
              </div>
              {/* 시야각 표시 */}
              {showCCTVViewAngle && (
                <div 
                  className="absolute"
                  style={{
                    width: '120px',
                    height: '120px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                    zIndex: 90,
                  }}
                >
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <path
                      d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                      fill="rgba(59, 130, 246, 0.2)"
                      stroke="rgba(59, 130, 246, 0.6)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}
          </div>
        )}
        
        {/* 중간 지점 CCTV들 */}
        {showCCTV && (
          <>
            <div 
              className="absolute cursor-pointer" 
              style={{ left: '40%', top: '60%', transform: 'translate(-50%, -50%)', zIndex: 100 }}
              onClick={() => {
                setSelectedMapCCTV('CCTV-12');
                setShowMapCCTVPopup(true);
              }}
            >
              <div className="w-7 h-7 bg-[#1a1a1a] border-2 border-blue-500 rounded-lg flex items-center justify-center shadow-xl relative hover:scale-110 transition-transform">
                <Icon 
                  icon="mdi:cctv" 
                  className="text-blue-400" 
                  width="16px" 
                  height="16px"
                />
                {/* 클러스터 뱃지 */}
                {location2CCTVs.length > 1 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500/90 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg border-2 border-blue-400 z-20">
                    {location2CCTVs.length}
                  </div>
                )}
              </div>
              {showCCTVName && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#1a1a1a] border border-blue-500 rounded text-white text-xs whitespace-nowrap shadow-lg z-10">
                  CCTV-12
                </div>
              )}
              {/* 타임라인 타이틀 */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'} px-2 py-0.5 bg-[#1a1a1a] border border-blue-500 rounded text-blue-400 text-xs whitespace-nowrap shadow-lg z-10`}>
                {getTimelineTitle('CCTV-12')}
              </div>
              {/* 시야각 표시 */}
              {showCCTVViewAngle && (
                <div 
                  className="absolute"
                  style={{
                    width: '120px',
                    height: '120px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotate(90deg)',
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                    zIndex: 90,
                  }}
                >
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <path
                      d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                      fill="rgba(59, 130, 246, 0.2)"
                      stroke="rgba(59, 130, 246, 0.6)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}
            </div>
            
            <div 
              className="absolute cursor-pointer" 
              style={{ left: '70%', top: '65%', transform: 'translate(-50%, -50%)', zIndex: 100 }}
              onClick={() => {
                setSelectedMapCCTV('CCTV-15');
                setShowMapCCTVPopup(true);
              }}
            >
              <div className="w-7 h-7 bg-[#1a1a1a] border-2 border-blue-500 rounded-lg flex items-center justify-center shadow-xl relative hover:scale-110 transition-transform">
                <Icon 
                  icon="mdi:cctv" 
                  className="text-blue-400" 
                  width="16px" 
                  height="16px"
                />
                {/* 클러스터 뱃지 */}
                {location3CCTVs.length > 1 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500/90 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg border-2 border-blue-400 z-20">
                    {location3CCTVs.length}
                  </div>
                )}
              </div>
              {showCCTVName && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#1a1a1a] border border-blue-500 rounded text-white text-xs whitespace-nowrap shadow-lg z-10">
                  CCTV-15
                </div>
              )}
              {/* 타임라인 타이틀 */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'} px-2 py-0.5 bg-[#1a1a1a] border border-blue-500 rounded text-blue-400 text-xs whitespace-nowrap shadow-lg z-10`}>
                {getTimelineTitle('CCTV-15')}
              </div>
              {/* 시야각 표시 */}
              {showCCTVViewAngle && (
                <div 
                  className="absolute"
                  style={{
                    width: '120px',
                    height: '120px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotate(135deg)',
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                    zIndex: 90,
                  }}
                >
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <path
                      d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                      fill="rgba(59, 130, 246, 0.2)"
                      stroke="rgba(59, 130, 246, 0.6)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}
            </div>
            
            <div 
              className="absolute cursor-pointer" 
              style={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)', zIndex: 100 }}
              onClick={() => {
                setSelectedMapCCTV('CCTV-3');
                setShowMapCCTVPopup(true);
              }}
            >
              <div className="w-7 h-7 bg-[#1a1a1a] border-2 border-blue-500 rounded-lg flex items-center justify-center shadow-xl relative hover:scale-110 transition-transform">
                <Icon 
                  icon="mdi:cctv" 
                  className="text-blue-400" 
                  width="16px" 
                  height="16px"
                />
                {/* 클러스터 뱃지 */}
                {location4CCTVs.length > 1 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500/90 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg border-2 border-blue-400 z-20">
                    {location4CCTVs.length}
                  </div>
                )}
              </div>
              {showCCTVName && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#1a1a1a] border border-blue-500 rounded text-white text-xs whitespace-nowrap shadow-lg z-10">
                  CCTV-3
                </div>
              )}
              {/* 타임라인 타이틀 */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'} px-2 py-0.5 bg-[#1a1a1a] border border-blue-500 rounded text-blue-400 text-xs whitespace-nowrap shadow-lg z-10`}>
                {getTimelineTitle('CCTV-3')}
              </div>
              {/* 시야각 표시 */}
              {showCCTVViewAngle && (
                <div 
                  className="absolute"
                  style={{
                    width: '120px',
                    height: '120px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotate(180deg)',
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                    zIndex: 90,
                  }}
                >
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <path
                      d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                      fill="rgba(59, 130, 246, 0.2)"
                      stroke="rgba(59, 130, 246, 0.6)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* 현재 위치 CCTV - 모든 요소를 하나의 컨테이너에 중앙 정렬 */}
        {showCCTV && (
          <div 
            className="absolute flex items-center justify-center cursor-pointer" 
            style={{ left: '85%', top: '45%', transform: 'translate(-50%, -50%)', zIndex: 120, width: '80px', height: '80px' }}
            onClick={() => {
              setSelectedMapCCTV('현재 위치');
              setShowMapCCTVPopup(true);
            }}
          >
            {/* 대쉬 원 - 위험 상황 알람 펄스 애니메이션 (여러 레이어) */}
            <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 80, animationDelay: '0s' }}>
              <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.5)' }}></div>
            </div>
            <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 79, animationDelay: '0.3s' }}>
              <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)' }}></div>
            </div>
            <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 78, animationDelay: '0.6s' }}>
              <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)' }}></div>
            </div>
            {/* CCTV 아이콘 - 최상단 */}
            <div className="w-7 h-7 bg-[#1a1a1a] border-2 border-red-500 rounded-lg flex items-center justify-center shadow-xl relative hover:scale-110 transition-transform" style={{ zIndex: 130 }}>
              <Icon 
                icon="mdi:cctv" 
                className="text-red-400" 
                width="16px" 
                height="16px"
              />
              {/* 클러스터 뱃지 */}
              {location5CCTVs.length > 1 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500/90 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg border-2 border-blue-400 z-30">
                  {location5CCTVs.length}
                </div>
              )}
            </div>
            {showCCTVName && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#1a1a1a] border border-red-500 rounded text-white text-xs whitespace-nowrap shadow-lg" style={{ zIndex: 140 }}>
                현재 위치
              </div>
            )}
            {/* 타임라인 타이틀 */}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'} px-2 py-0.5 bg-[#1a1a1a] border border-red-500 rounded text-red-400 text-xs whitespace-nowrap shadow-lg`} style={{ zIndex: 140 }}>
              {getTimelineTitle('현재 위치')}
            </div>
            {/* 시야각 표시 */}
            {showCCTVViewAngle && (
              <div 
                className="absolute"
                style={{
                  width: '120px',
                  height: '120px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%) rotate(180deg)',
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                  zIndex: 90,
                }}
              >
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <path
                    d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="rgba(59, 130, 246, 0.6)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 위치 및 동선 - 타임라인만 */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3 flex-shrink-0">
          <Icon icon="mdi:map-marker" className="w-4 h-4 text-green-300" />
          위치 및 동선
        </div>
        <div className="space-y-2 text-sm overflow-y-auto flex-1 min-h-0">
          {[...movementTimeline].reverse().map((entry) => (
            <div key={entry.time} className="flex gap-3">
              <div className="text-xs text-gray-500 w-16 flex-shrink-0">{entry.time}</div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${entry.color} mb-0.5`}>{entry.title}</p>
                <p className="text-gray-400 text-xs mb-1">{entry.subtitle}</p>
                {entry.cctvName && (
                  <p className="text-gray-500 text-xs">{entry.cctvName}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

