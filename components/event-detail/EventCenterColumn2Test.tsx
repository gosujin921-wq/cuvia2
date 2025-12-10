'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getTabButtonClassName } from '@/components/shared/styles';

interface EventCenterColumn2TestProps {
  isRightPanelCollapsed: boolean;
  cctvSectionHeight: number | null;
  handleDragStart: (e: React.MouseEvent) => void;
  monitoringCCTVs: string[];
  handleRemoveFromMonitoring: (cctvKey: string) => void;
  setSelectedCCTV: (cctv: string | null) => void;
  setShowCCTVPopup: (show: boolean) => void;
  setSelectedDetectedCCTV: (id: string | null) => void;
  setShowDetectedCCTVPopup: (show: boolean) => void;
  detectedCCTVThumbnails: Array<{
    id: string;
    cctvId: string;
    cctvName: string;
    timestamp: string;
    confidence: number;
    thumbnail: string;
    location: string;
    description: string;
    aiAnalysis?: string;
    suspectReason?: string;
    situation?: string;
  }>;
  cctvInfo: Record<string, {
    id: string;
    name: string;
    location: string;
    status: string;
  }>;
  cctvThumbnailMap: Record<string, string>;
  behaviorHighlights: string[];
  showMapCCTVPopup?: boolean;
  movementTimeline: Array<{
    time: string;
    title: string;
    subtitle: string;
    cctvName: string | null;
    color: string;
    cctvId: string | null;
  }>;
}

export const EventCenterColumn2Test: React.FC<EventCenterColumn2TestProps> = ({
  isRightPanelCollapsed,
  cctvSectionHeight,
  handleDragStart,
  monitoringCCTVs,
  handleRemoveFromMonitoring,
  setSelectedCCTV,
  setShowCCTVPopup,
  setSelectedDetectedCCTV,
  setShowDetectedCCTVPopup,
  detectedCCTVThumbnails,
  cctvInfo,
  cctvThumbnailMap,
  behaviorHighlights,
  showMapCCTVPopup = false,
  movementTimeline,
}) => {
  const [activeTab, setActiveTab] = useState<'cctv' | 'movement' | 'analysis'>('cctv');

  // 키보드 단축키 (1: CCTV, 2: 위치 및 동선, 3: 분석 요약) - 팝업이 열려있으면 동작하지 않음
  useEffect(() => {
    if (showMapCCTVPopup) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        setActiveTab('cctv');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveTab('movement');
      } else if (e.key === '3') {
        e.preventDefault();
        setActiveTab('analysis');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMapCCTVPopup]);
  return (
    <div className="flex flex-col pt-4 pr-4 flex-1 min-w-0 min-h-0 overflow-hidden" data-section-container style={{ minHeight: 0, height: '100%' }}>
      {/* 탭 버튼 */}
      <div className="flex gap-2 mb-4 flex-shrink-0">
        <button
          onClick={() => setActiveTab('cctv')}
          className={getTabButtonClassName(activeTab === 'cctv')}
          style={{ borderWidth: activeTab === 'cctv' ? '0' : '1px' }}
        >
          CCTV
        </button>
        <button
          onClick={() => setActiveTab('movement')}
          className={getTabButtonClassName(activeTab === 'movement')}
          style={{ borderWidth: activeTab === 'movement' ? '0' : '1px' }}
        >
          위치 및 동선
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={getTabButtonClassName(activeTab === 'analysis')}
          style={{ borderWidth: activeTab === 'analysis' ? '0' : '1px' }}
        >
          분석 요약
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {activeTab === 'cctv' && (
          <div className="flex flex-col flex-1 min-h-0">
          {/* 포착된 CCTV 클립 */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ flexBasis: '50%', flexGrow: 1, flexShrink: 1 }}>
            <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3">
              <Icon icon="mdi:video-stabilization" className="w-4 h-4 text-purple-300" />
              포착된 CCTV 클립
            </div>
            <div className="overflow-y-auto flex-1">
              <div className={`grid gap-3`} style={{ 
                gridTemplateColumns: isRightPanelCollapsed ? `repeat(auto-fill, minmax(160px, 1fr))` : `repeat(4, minmax(0, 1fr))`,
                gridTemplateRows: 'repeat(2, minmax(0, 1fr))', 
                gridAutoRows: 'minmax(0, 1fr)',
                minHeight: 'fit-content'
              }}>
                {[...detectedCCTVThumbnails].sort((a, b) => {
                  // 시간을 비교하여 최신순으로 정렬 (내림차순)
                  const timeA = a.timestamp.split(':').map(Number);
                  const timeB = b.timestamp.split(':').map(Number);
                  const secondsA = timeA[0] * 3600 + timeA[1] * 60 + timeA[2];
                  const secondsB = timeB[0] * 3600 + timeB[1] * 60 + timeB[2];
                  return secondsB - secondsA; // 최신순 (내림차순)
                }).map((detected) => (
                  <div
                    key={detected.id}
                    className="bg-[#0f0f0f] border border-[#31353a] rounded cursor-pointer hover:border-purple-500/50 transition-colors overflow-hidden group relative"
                    style={{ borderWidth: '1px' }}
                    onClick={() => {
                      setSelectedDetectedCCTV(detected.cctvId);
                      setShowDetectedCCTVPopup(true);
                    }}
                  >
                    <div className="relative aspect-video bg-black">
                      <video
                        src={detected.thumbnail}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        muted
                        loop
                        playsInline
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement;
                          // 동영상 로드 실패 시 썸네일 이미지로 대체
                          const img = document.createElement('img');
                          img.src = cctvThumbnailMap[detected.cctvId] || '/cctv_img/001.jpg';
                          img.className = 'w-full h-full object-cover';
                          target.parentElement?.replaceChild(img, target);
                        }}
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-white text-[10px] font-semibold">
                        {detected.timestamp}
                      </div>
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-purple-600/80 rounded text-white text-[10px] font-semibold">
                        {detected.confidence}%
                      </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-[10px] font-semibold truncate">{detected.cctvId}</span>
                        <span className="px-1 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] flex-shrink-0">
                          클립
                        </span>
                      </div>
                      <div className="text-gray-400 text-[10px] truncate">{detected.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CCTV 모니터링 */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ flexBasis: '50%', flexGrow: 1, flexShrink: 1 }}>
            <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3">
              <Icon icon="mdi:cctv" className="w-4 h-4 text-blue-300" />
              주변 cctv
            </div>
            <div className="overflow-y-auto flex-1">
              <div className={`grid gap-3`} style={{ 
                gridTemplateColumns: isRightPanelCollapsed ? `repeat(auto-fill, minmax(160px, 1fr))` : `repeat(4, minmax(0, 1fr))`,
                gridTemplateRows: 'repeat(2, minmax(0, 1fr))', 
                gridAutoRows: 'minmax(0, 1fr)',
                minHeight: 'fit-content'
              }}>
                {monitoringCCTVs.length === 0 ? (
                  <div className="col-span-4 text-center py-8">
                    <Icon icon="mdi:cctv-off" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">모니터링 중인 CCTV가 없습니다</p>
                  </div>
                ) : (
                  [...monitoringCCTVs].sort((a, b) => {
                    const cctvA = cctvInfo[a];
                    const cctvB = cctvInfo[b];
                    if (!cctvA || !cctvB) return 0;
                    // 추적중이 먼저 오도록 정렬
                    if (cctvA.status === '추적중' && cctvB.status !== '추적중') return -1;
                    if (cctvA.status !== '추적중' && cctvB.status === '추적중') return 1;
                    return 0;
                  }).map((cctvKey) => {
                    const cctv = cctvInfo[cctvKey];
                    if (!cctv) return null;
                    const isTracking = cctv.status === '추적중';
                    return (
                      <div
                        key={cctvKey}
                        className="bg-[#0f0f0f] border border-[#31353a] rounded cursor-pointer hover:border-blue-500/50 transition-colors overflow-hidden group relative"
                        style={{ borderWidth: isTracking ? '2px' : '1px', borderColor: isTracking ? 'rgba(234, 179, 8, 0.5)' : undefined }}
                        onClick={() => {
                          setSelectedCCTV(cctvKey);
                          setShowCCTVPopup(true);
                        }}
                      >
                        <div className="relative aspect-video bg-black">
                          <img
                            src={cctvThumbnailMap[cctv.id] || '/cctv_img/001.jpg'}
                            alt={`${cctv.id} 썸네일`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/cctv_img/001.jpg';
                            }}
                          />
                          <div className="absolute top-1 right-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromMonitoring(cctvKey);
                              }}
                              className="text-white bg-black/70 hover:bg-red-600/80 rounded-full p-1 transition-colors"
                              aria-label="모니터링에서 제거"
                            >
                              <Icon icon="mdi:close" className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white text-[10px] font-semibold truncate">{cctv.id}</span>
                            <span className={`px-1 py-0.5 text-[10px] flex-shrink-0 ${
                              cctv.status === '활성' 
                                ? 'bg-green-500/20 text-green-400'
                                : cctv.status === '추적중'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {cctv.status}
                            </span>
                          </div>
                          <div className="text-gray-400 text-[10px] truncate">{cctv.location}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'movement' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3 flex-shrink-0">
              <Icon icon="mdi:map-marker" className="w-4 h-4 text-green-300" />
              위치 및 동선
            </div>
            <div className="space-y-2 text-sm overflow-y-auto flex-1 min-h-0">
              {[...movementTimeline].reverse().map((entry, index) => (
                <div key={index} className="flex gap-3">
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
        )}

        {activeTab === 'analysis' && (
          <div className="flex flex-col space-y-6 pt-4 flex-1 min-h-0 overflow-y-auto">
          {/* 인물 분석 & 차량 분석 */}
          <div className="grid grid-cols-2 gap-6">
            {/* 인물 분석 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-white font-semibold">
                  <Icon icon="mdi:account-search" className="w-4 h-4 text-blue-300" />
                  인물 분석
                </div>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs">추적중</span>
              </div>
              <div className="bg-[#0f0f0f] border border-[#31353a] p-4 space-y-3" style={{ borderWidth: '1px' }}>
                <div className="grid gap-3 text-sm text-gray-300 grid-cols-1">
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">성별/연령</p>
                    <p>남성, 30대 초반 추정</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">상의</p>
                    <p>검은색 후드티</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">하의</p>
                    <p>청바지</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">신발</p>
                    <p>흰색 운동화</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">체격</p>
                    <p>170cm 추정, 중간 체격</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">ReID 신뢰도</p>
                    <p className="text-green-400 font-semibold">89%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 차량 분석 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-white font-semibold">
                  <Icon icon="mdi:car" className="w-4 h-4 text-blue-300" />
                  차량 분석
                </div>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs">추적중</span>
              </div>
              <div className="bg-[#0f0f0f] border border-[#31353a] p-4 space-y-3" style={{ borderWidth: '1px' }}>
                <div className="grid gap-3 text-sm text-gray-300 grid-cols-1">
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">차종</p>
                    <p>소형 승용차</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">색상</p>
                    <p>흰색</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">번호판</p>
                    <p>12가3456</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">방향</p>
                    <p>북쪽으로 이동</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">속도</p>
                    <p>약 60km/h</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">인식 신뢰도</p>
                    <p className="text-green-400 font-semibold">92%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 행동 요약 */}
          <div>
            <div className="flex items-center gap-2 text-sm text-red-300 font-semibold mb-3">
              <Icon icon="mdi:alert" className="w-4 h-4" />
              행동 요약
            </div>
            <div className="bg-[#2a1313] border border-red-500/40 p-4 space-y-2" style={{ borderWidth: '1px' }}>
              <ul className="text-sm text-red-100 space-y-1">
                {behaviorHighlights.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

