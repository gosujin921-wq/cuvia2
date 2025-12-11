'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { movementTimeline } from './constants';
import { 
  getCCTVIconClassName, 
  getCCTVLabelClassName, 
  getCCTVBadgeClassName 
} from '@/components/shared/styles';
import { AdditionalDataNotificationPopup } from './AdditionalDataNotificationPopup';

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
  setShowDetectedCCTVPopup: (value: boolean) => void;
  setSelectedDetectedCCTV: (value: string | null) => void;
  setShowCombinedCCTVPopup: (value: boolean) => void;
  setSelectedCombinedCCTV: (value: string | null) => void;
  additionalDataNotification?: {
    isOpen: boolean;
    time: string;
    sender: string;
    content: string;
    onClose: () => void;
    onSendToAgent: () => void;
  };
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
  setShowDetectedCCTVPopup,
  setSelectedDetectedCCTV,
  setShowCombinedCCTVPopup,
  setSelectedCombinedCCTV,
  additionalDataNotification,
}) => {
  const [zoomLevel, setZoomLevel] = React.useState(0); // 0: 축소(클러스터), 1: 확대(개별)
  
  // 줌 레벨에 따른 지도 스케일 계산
  const mapScale = zoomLevel === 0 ? 1 : 1.5; // 확대 시 1.5배
  const mapTransformOrigin = 'center center'; // 확대 기준점
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
      cctvs: ['CCTV-16', 'CCTV-17', 'CCTV-18', 'CCTV-19', 'CCTV-20'], // 현재 위치 주변 (용의자 추적중) - 5개 클러스터
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

  // CCTV 클릭 핸들러 - 색상에 따라 다른 팝업 열기
  const handleCCTVClick = (cctvId: string, borderColor: string) => {
    // red (추적중) → CCTV 팝업만
    if (borderColor === 'border-red-500') {
      setSelectedMapCCTV(cctvId);
      setShowMapCCTVPopup(true);
    } else {
      // yellow 또는 blue (과거 동선) → 통합 팝업 (탭 전환)
      setSelectedCombinedCCTV(cctvId);
      setShowCombinedCCTVPopup(true);
    }
  };

  // borderColor를 CCTV 아이콘 variant로 변환
  const getCCTVVariant = (borderColor: string): 'default' | 'active' | 'tracking' | 'warning' => {
    if (borderColor === 'border-red-500') return 'tracking';
    if (borderColor === 'border-blue-500') return 'active';
    if (borderColor === 'border-yellow-500') return 'warning';
    return 'default';
  };

  // borderColor를 뱃지 variant로 변환
  const getBadgeVariant = (borderColor: string): 'default' | 'tracking' => {
    if (borderColor === 'border-red-500') return 'tracking';
    return 'default';
  };

  // CCTV 아이콘 렌더링 헬퍼 함수
  const renderCCTVIcons = (
    cctvIds: string[],
    basePosition: { left: number; top: number },
    borderColor: string,
    iconColor: string,
    timelineTitle: string,
    viewAngleRotation: number = 0
  ) => {
    if (zoomLevel === 0) {
      // 축소 모드: 클러스터 뱃지만 표시
      return (
        <div 
          className="absolute cursor-pointer" 
          style={{ left: `${basePosition.left}%`, top: `${basePosition.top}%`, transform: 'translate(-50%, -50%)', zIndex: 100 }}
          onClick={() => {
            handleCCTVClick(cctvIds[0], borderColor);
          }}
        >
          <div className={getCCTVIconClassName(getCCTVVariant(borderColor))} style={{ zIndex: 110, position: 'relative' }}>
            <Icon 
              icon="mdi:cctv" 
              className={iconColor}
              width="16px" 
              height="16px"
            />
            {/* 클러스터 뱃지 - 같은 위치에 여러 CCTV가 있을 때 */}
            {cctvIds.length > 1 && (
              <div className={`${getCCTVBadgeClassName(getBadgeVariant(borderColor))} absolute -top-[18px] -right-[18px]`}>
                {cctvIds.length}
              </div>
            )}
          </div>
          {showCCTVName && (
            <div className={`${getCCTVLabelClassName(getCCTVVariant(borderColor))} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
              {cctvIds[0]}
            </div>
          )}
          {/* 타임라인 타이틀 */}
          <div className={`${getCCTVLabelClassName(getCCTVVariant(borderColor))} absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'} ${iconColor}`}>
            {timelineTitle}
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
                transform: `translate(-50%, -50%) rotate(${viewAngleRotation}deg)`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                zIndex: 50,
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
      );
    } else {
      // 확대 모드: 개별 CCTV 아이콘 표시
      return cctvIds.map((cctvId, index) => {
        // 개별 아이콘들을 약간씩 다른 위치에 배치 (원형으로 배치)
        const angle = (index / cctvIds.length) * 2 * Math.PI;
        const radius = 2; // 퍼센트 단위
        const offsetLeft = Math.cos(angle) * radius;
        const offsetTop = Math.sin(angle) * radius;
        
        return (
          <div
            key={cctvId}
            className="absolute cursor-pointer" 
            style={{ 
              left: `${basePosition.left + offsetLeft}%`, 
              top: `${basePosition.top + offsetTop}%`, 
              transform: 'translate(-50%, -50%)', 
              zIndex: 100 
            }}
            onClick={() => {
              handleCCTVClick(cctvId, borderColor);
            }}
          >
            <div className={getCCTVIconClassName(getCCTVVariant(borderColor))} style={{ zIndex: 110, position: 'relative' }}>
              <Icon 
                icon="mdi:cctv" 
                className={iconColor}
                width="16px" 
                height="16px"
              />
            </div>
            {showCCTVName && (
              <div className={`${getCCTVLabelClassName(getCCTVVariant(borderColor))} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                {cctvIds.length > 1 ? `${cctvId}-${index + 1}` : cctvId}
              </div>
            )}
            {/* 타임라인 타이틀 */}
            <div className={`${getCCTVLabelClassName(getCCTVVariant(borderColor))} absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'} ${iconColor}`}>
              {timelineTitle}
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
                  transform: `translate(-50%, -50%) rotate(${viewAngleRotation}deg)`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                  zIndex: 50,
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
        );
      });
    }
  };

  return (
    <div className="flex flex-col pr-4 flex-shrink-0" style={{ width: isRightPanelCollapsed ? '50%' : '55%', minHeight: 0, height: '100%' }}>
      {/* 지도 컨테이너 wrapper */}
      <div className="relative overflow-hidden" style={{ height: '100%' }}>
        {/* 줌 컨트롤 버튼 - 지도 확대와 무관하게 고정 위치 */}
        <div 
          className="absolute top-4 left-4 flex flex-col gap-2" 
          style={{ zIndex: 250 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoomLevel(prev => Math.min(prev + 1, 1));
            }}
            disabled={zoomLevel >= 1}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderWidth: '1px' }}
            aria-label="확대"
          >
            <Icon icon="mdi:plus" className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoomLevel(prev => Math.max(prev - 1, 0));
            }}
            disabled={zoomLevel <= 0}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderWidth: '1px' }}
            aria-label="축소"
          >
            <Icon icon="mdi:minus" className="w-5 h-5" />
          </button>
        </div>

        {/* CCTV 토글 버튼 - +/- 버튼 아래에 그룹핑 */}
        <div 
          className="absolute top-4 left-4 flex flex-col gap-2" 
          style={{ zIndex: 250, marginTop: '100px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newShowCCTV = !showCCTV;
              setShowCCTV(newShowCCTV);
              // CCTV 토글을 켜면 라벨과 화각도 함께 켜짐
              if (newShowCCTV) {
                setShowCCTVViewAngle(true);
                setShowCCTVName(true);
              } else {
                // CCTV 토글을 끄면 라벨과 화각도 함께 꺼짐
                setShowCCTVViewAngle(false);
                setShowCCTVName(false);
              }
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
          
          {/* CCTV 서브 토글 버튼들 - CCTV 온오프와 상관없이 항상 표시 */}
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
        </div>

        {/* 지도 - 박스 밖으로 */}
        {/* TODO: 지도 이미지 200% 확대 - 나중에 제거 필요 */}
        <div
          className="relative border border-[#31353a] bg-cover bg-center bg-no-repeat transition-transform duration-300"
          style={{
            borderWidth: '1px',
            backgroundImage: 'url(/map_anyang.png)',
            backgroundSize: '500%', // TODO: 지도 이미지 500% 확대 - 나중에 제거 필요 (원래: 'cover')
            height: '100%',
            width: '100%',
            transform: `scale(${mapScale})`,
            transformOrigin: mapTransformOrigin,
          }}
        >


        {/* 가상 CCTV 아이콘들 - 그레이 컬러 */}
        {showCCTV && [
          { left: 10, top: 20, count: 1, viewAngle: 45 },
          { left: 25, top: 15, count: 3, viewAngle: 90 },
          { left: 35, top: 30, count: 1, viewAngle: 135 },
          { left: 55, top: 25, count: 2, viewAngle: 180 },
          { left: 70, top: 20, count: 1, viewAngle: 225 },
          { left: 85, top: 30, count: 4, viewAngle: 270 },
          { left: 20, top: 50, count: 2, viewAngle: 45 },
          { left: 40, top: 55, count: 1, viewAngle: 90 },
          { left: 60, top: 50, count: 3, viewAngle: 135 },
          { left: 80, top: 55, count: 1, viewAngle: 180 },
          { left: 15, top: 75, count: 2, viewAngle: 225 },
          { left: 30, top: 70, count: 1, viewAngle: 270 },
          { left: 50, top: 75, count: 5, viewAngle: 45 },
          { left: 70, top: 70, count: 2, viewAngle: 90 },
          { left: 90, top: 75, count: 1, viewAngle: 135 },
          { left: 10, top: 90, count: 1, viewAngle: 180 },
          { left: 25, top: 95, count: 3, viewAngle: 225 },
          { left: 45, top: 90, count: 2, viewAngle: 270 },
          { left: 65, top: 95, count: 1, viewAngle: 45 },
          { left: 85, top: 90, count: 4, viewAngle: 90 },
        ].map((item, index) => {
          const cctvName = `CCTV-V-${index + 1}`;
          if (zoomLevel === 0) {
            // 축소 모드: 클러스터 뱃지만 표시
            return (
              <div
                key={`virtual-cctv-${index}`}
                className="absolute cursor-pointer"
                style={{ 
                  left: `${item.left}%`, 
                  top: `${item.top}%`, 
                  transform: 'translate(-50%, -50%)', 
                  zIndex: 50 
                }}
                onClick={() => {
                  // 나중에 모달 띄울 예정
                }}
              >
                <div className={getCCTVIconClassName('default')} style={{ zIndex: 60, position: 'relative' }}>
                  <Icon 
                    icon="mdi:cctv" 
                    className="text-gray-400"
                    width="16px" 
                    height="16px"
                  />
                  {/* 클러스터 뱃지 - 여러 CCTV가 있을 때 */}
                  {item.count > 1 && (
                    <div className={`${getCCTVBadgeClassName('default')} absolute -top-[18px] -right-[18px]`}>
                      {item.count}
                    </div>
                  )}
                </div>
                {/* CCTV 이름 라벨 */}
                {showCCTVName && (
                  <div className={`${getCCTVLabelClassName('default')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                    {cctvName}
                  </div>
                )}
                {/* 시야각 표시 */}
                {showCCTVViewAngle && (
                  <div 
                    className="absolute"
                    style={{
                      width: '120px',
                      height: '120px',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) rotate(${item.viewAngle}deg)`,
                      transformOrigin: 'center center',
                      pointerEvents: 'none',
                      zIndex: 30,
                    }}
                  >
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <path
                        d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                        fill="rgba(156, 163, 175, 0.2)"
                        stroke="rgba(156, 163, 175, 0.6)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          } else {
            // 확대 모드: 개별 CCTV 아이콘 표시
            return Array.from({ length: item.count }, (_, i) => {
              const angle = (i / item.count) * 2 * Math.PI;
              const radius = 2;
              const offsetLeft = Math.cos(angle) * radius;
              const offsetTop = Math.sin(angle) * radius;
              
              return (
                <div
                  key={`virtual-cctv-${index}-${i}`}
                  className="absolute cursor-pointer"
                  style={{ 
                    left: `${item.left + offsetLeft}%`, 
                    top: `${item.top + offsetTop}%`, 
                    transform: 'translate(-50%, -50%)', 
                    zIndex: 50 
                  }}
                  onClick={() => {
                    // 나중에 모달 띄울 예정
                  }}
                >
                  <div className={getCCTVIconClassName('default')} style={{ zIndex: 60, position: 'relative' }}>
                    <Icon 
                      icon="mdi:cctv" 
                      className="text-gray-400"
                      width="16px" 
                      height="16px"
                    />
                  </div>
                  {/* CCTV 이름 라벨 */}
                  {showCCTVName && (
                    <div className={`${getCCTVLabelClassName('default')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                      CCTV-V-{index + 1}-{i + 1}
                    </div>
                  )}
                  {/* 시야각 표시 */}
                  {showCCTVViewAngle && (
                    <div 
                      className="absolute"
                      style={{
                        width: '120px',
                        height: '120px',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${item.viewAngle}deg)`,
                        transformOrigin: 'center center',
                        pointerEvents: 'none',
                        zIndex: 30,
                      }}
                    >
                      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <path
                          d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                          fill="rgba(156, 163, 175, 0.2)"
                          stroke="rgba(156, 163, 175, 0.6)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            });
          }
        })}

        {/* 지도 이미지 위에 SVG 오버레이 - 동선은 항상 표시 */}
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

        {/* CCTV 아이콘들로 핀 대체 - 컬러 CCTV는 항상 표시 */}
        {/* 시작 지점 CCTV */}
        {renderCCTVIcons(
          location1CCTVs,
          { left: 15, top: 80 },
          'border-yellow-500',
          'text-yellow-400',
          getTimelineTitle('CCTV-7'),
          45
        )}
        
        {/* 중간 지점 CCTV들 */}
        <>
          {renderCCTVIcons(
            location2CCTVs,
            { left: 40, top: 60 },
            'border-blue-500',
            'text-blue-400',
            getTimelineTitle('CCTV-12'),
            90
          )}
          {renderCCTVIcons(
            location3CCTVs,
            { left: 70, top: 65 },
            'border-blue-500',
            'text-blue-400',
            getTimelineTitle('CCTV-15'),
            135
          )}
          {renderCCTVIcons(
            location4CCTVs,
            { left: 50, top: 40 },
            'border-blue-500',
            'text-blue-400',
            getTimelineTitle('CCTV-3'),
            180
          )}
        </>
        
        {/* 현재 위치 CCTV - 모든 요소를 하나의 컨테이너에 중앙 정렬 */}
        <div 
          className="absolute flex items-center justify-center" 
          style={{ left: '85%', top: '45%', transform: 'translate(-50%, -50%)', zIndex: 120, width: '80px', height: '80px' }}
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
            {/* CCTV 아이콘들 */}
            {zoomLevel === 0 ? (
              // 축소 모드: 클러스터 뱃지만 표시
              <div 
                className="absolute cursor-pointer" 
                style={{ zIndex: 130 }}
                onClick={() => {
                  handleCCTVClick(location5CCTVs[0] || 'CCTV-16', 'border-red-500');
                }}
              >
                <div className={getCCTVIconClassName('tracking')} style={{ zIndex: 110, position: 'relative' }}>
                  <Icon 
                    icon="mdi:cctv" 
                    className="text-red-400" 
                    width="16px" 
                    height="16px"
                  />
                  {/* 클러스터 뱃지 */}
                  {location5CCTVs.length > 1 && (
                    <div className={`${getCCTVBadgeClassName('tracking')} absolute -top-[18px] -right-[18px]`} style={{ zIndex: 30 }}>
                      {location5CCTVs.length}
                    </div>
                  )}
                </div>
                {showCCTVName && (
                  <div className={`${getCCTVLabelClassName('tracking')} absolute top-full left-1/2 -translate-x-1/2 mt-1`} style={{ zIndex: 140 }}>
                    현재 위치
                  </div>
                )}
                {/* 타임라인 타이틀 */}
                <div className={`${getCCTVLabelClassName('tracking')} absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'} text-red-400`} style={{ zIndex: 140 }}>
                  {getTimelineTitle('현재 위치')}
                </div>
              </div>
            ) : (
              // 확대 모드: 개별 CCTV 아이콘 표시
              location5CCTVs.map((cctvId, index) => {
                const angle = (index / location5CCTVs.length) * 2 * Math.PI;
                const radius = 2;
                const offsetLeft = Math.cos(angle) * radius;
                const offsetTop = Math.sin(angle) * radius;
                
                return (
                  <div
                    key={cctvId}
                    className="absolute cursor-pointer" 
                    style={{ 
                      left: `${offsetLeft * 10}px`, 
                      top: `${offsetTop * 10}px`, 
                      transform: 'translate(-50%, -50%)', 
                      zIndex: 130 
                    }}
                    onClick={() => {
                      handleCCTVClick(cctvId, 'border-red-500');
                    }}
                  >
                    <div className={getCCTVIconClassName('tracking')} style={{ zIndex: 110, position: 'relative' }}>
                      <Icon 
                        icon="mdi:cctv" 
                        className="text-red-400" 
                        width="16px" 
                        height="16px"
                      />
                    </div>
                    {showCCTVName && (
                      <div className={`${getCCTVLabelClassName('tracking')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                        {location5CCTVs.length > 1 ? `${cctvId}-${index + 1}` : cctvId}
                      </div>
                    )}
                    {/* 타임라인 타이틀 */}
                    <div className={`${getCCTVLabelClassName('tracking')} absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'} text-red-400`}>
                      {getTimelineTitle('현재 위치')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 추가 자료 알림 팝업 - 맵 우측 하단 */}
        {additionalDataNotification && (
          <AdditionalDataNotificationPopup
            isOpen={additionalDataNotification.isOpen}
            time={additionalDataNotification.time}
            sender={additionalDataNotification.sender}
            content={additionalDataNotification.content}
            onClose={additionalDataNotification.onClose}
            onSendToAgent={additionalDataNotification.onSendToAgent}
          />
        )}
      </div>

    </div>
  );
};

