'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { cctvInfo, cctvThumbnailMap, cctvFovMap, cctvCoordinatesMap, detectedCCTVThumbnails, movementTimeline, cctvLocationGroups } from './constants';
import { getTabButtonClassName, getSecondaryButtonClassName } from '@/components/shared/styles';

interface CombinedCCTVPopupProps {
  isOpen: boolean;
  selectedCCTV: string | null;
  currentCctvIndex: number;
  isClipPlaying: boolean;
  clipCurrentTime: number;
  clipDuration: number;
  popupTitle?: string; // 팝업 헤더 타이틀
  clipTabTitle?: string; // 포착된 클립 탭 타이틀
  liveTabTitle?: string; // 실시간 모니터링 탭 타이틀
  onClose: () => void;
  setSelectedCCTV: (cctvId: string) => void;
  setCurrentCctvIndex: (index: number) => void;
  setIsClipPlaying: (playing: boolean) => void;
  setClipCurrentTime: (time: number) => void;
  handlePTZUp: () => void;
  handlePTZDown: () => void;
  handlePTZLeft: () => void;
  handlePTZRight: () => void;
  handlePTZCenter: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handlePreset: (preset: number) => void;
  handlePrevCCTV: () => void;
  handleNextCCTV: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const CombinedCCTVPopup = ({
  isOpen,
  selectedCCTV,
  currentCctvIndex,
  isClipPlaying,
  clipCurrentTime,
  clipDuration,
  popupTitle = 'CCTV 팝업',
  clipTabTitle = '포착된 클립',
  liveTabTitle = '실시간 모니터링',
  onClose,
  setSelectedCCTV,
  setCurrentCctvIndex,
  setIsClipPlaying,
  setClipCurrentTime,
  handlePTZUp,
  handlePTZDown,
  handlePTZLeft,
  handlePTZRight,
  handlePTZCenter,
  handleZoomIn,
  handleZoomOut,
  handlePreset,
  handlePrevCCTV,
  handleNextCCTV,
}: CombinedCCTVPopupProps) => {
  const [activeTab, setActiveTab] = useState<'clip' | 'live'>('clip');
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [isTrackingBoxDraggable, setIsTrackingBoxDraggable] = useState(false);
  const [trackingBoxPosition, setTrackingBoxPosition] = useState({ top: 30, left: 40 }); // 퍼센트 기준
  const [isDragging, setIsDragging] = useState(false);

  // 탭 변경 시 키보드 이벤트 리셋
  useEffect(() => {
    if (activeTab === 'live') {
      // LIVE 탭일 때만 PTZ 키보드 이벤트 활성화
    } else {
      setPressedKey(null);
    }
  }, [activeTab]);

  // 키보드 이벤트 핸들러 (LIVE 탭일 때만)
  useEffect(() => {
    if (!isOpen || activeTab !== 'live') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      let key: string | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          key = 'up';
          handlePTZUp();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          key = 'down';
          handlePTZDown();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          key = 'left';
          handlePTZLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          key = 'right';
          handlePTZRight();
          break;
        case 'Home':
        case '0':
          e.preventDefault();
          key = 'center';
          handlePTZCenter();
          break;
        case '+':
        case '=':
        case 'PageUp':
          e.preventDefault();
          key = 'zoomIn';
          handleZoomIn();
          break;
        case '-':
        case '_':
        case 'PageDown':
          e.preventDefault();
          key = 'zoomOut';
          handleZoomOut();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          e.preventDefault();
          key = `preset-${e.key}`;
          handlePreset(parseInt(e.key));
          break;
      }

      if (key) {
        setPressedKey(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, activeTab, handlePTZUp, handlePTZDown, handlePTZLeft, handlePTZRight, handlePTZCenter, handleZoomIn, handleZoomOut, handlePreset]);

  if (!isOpen || !selectedCCTV) return null;

  const detected = detectedCCTVThumbnails.find(d => d.cctvId === selectedCCTV);
  const cctvKey = Object.keys(cctvInfo).find(key => cctvInfo[key].id === selectedCCTV);
  const cctv = cctvKey ? cctvInfo[cctvKey] : null;
  const fov = cctvFovMap[selectedCCTV] || '95°';

  // 방향 계산 (지역명으로 표시)
  const getDirection = (location: string, name?: string) => {
    const locationText = location || name || '';
    if (locationText.includes('평촌')) return '평촌 방향';
    if (locationText.includes('인덕원') || locationText.includes('인덕')) return '인덕원 방향';
    if (locationText.includes('비산')) return '비산 방향';
    if (locationText.includes('관양')) return '관양 방향';
    if (locationText.includes('호계')) return '호계 방향';
    if (locationText.includes('범계')) return '범계 방향';
    if (locationText.includes('동안')) return '동안 방향';
    if (locationText.includes('안양')) return '안양 방향';
    if (locationText.includes('금정')) return '금정 방향';
    // 기본값: 위치 정보가 없으면 인덕원 방향으로 설정
    return '인덕원 방향';
  };

  // 군집 정보
  const getCluster = (cctvId: string) => {
    for (const [locationId, group] of Object.entries(cctvLocationGroups)) {
      if (group.cctvs.includes(cctvId)) {
        const clusterMap: Record<string, string> = {
          'location-1': 'G-01 (남측 데크 라인)',
          'location-2': 'G-02 (중앙 데크 라인)',
          'location-3': 'G-03 (북측 데크 라인)',
          'location-4': 'G-04 (동측 데크 라인)',
          'location-5': 'G-03 (북측 데크 라인)',
        };
        return clusterMap[locationId] || 'G-00';
      }
    }
    return 'G-00';
  };

  // 최근 포착 정보
  const getRecentCaptures = (cctvId: string) => {
    const captures = movementTimeline
      .filter(item => item.cctvId === cctvId)
      .map(item => {
        const time = item.time.split(':').slice(1).join(':');
        return `${time} ${item.title}`;
      });
    return captures.length > 0 ? captures.join(' / ') : '없음';
  };

  // 클러스터 정보 확인
  let currentCluster: string[] = [];
  let hasMultiple = false;
  for (const [locationId, group] of Object.entries(cctvLocationGroups)) {
    if (group.cctvs.includes(selectedCCTV)) {
      currentCluster = group.cctvs;
      hasMultiple = currentCluster.length > 1;
      break;
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
      onClick={onClose}
    >
      <div
        className="bg-[#101013] border border-[#31353a] w-full max-w-6xl flex flex-col shadow-lg"
        style={{ transform: 'scale(0.8)', transformOrigin: 'center center', maxHeight: '120vh', height: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-[#31353a] flex-shrink-0">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <Icon icon="mdi:cctv" className="w-5 h-5 text-[#50A1FF]" />
            {popupTitle}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none transition-colors"
            aria-label="팝업 닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* 탭 버튼 */}
          <div className="flex gap-2 p-4 pb-3 flex-shrink-0">
            <button
              onClick={() => setActiveTab('clip')}
              className={`${getTabButtonClassName(activeTab === 'clip')} rounded`}
            >
              {clipTabTitle}
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`${getTabButtonClassName(activeTab === 'live')} rounded`}
            >
              {liveTabTitle}
            </button>
          </div>
          {activeTab === 'clip' && detected ? (
            // 포착된 CCTV 클립 탭
            <>
            {/* 영상 영역 - 2컬럼 */}
            <div className="flex p-4 flex-1 min-h-0">
              {/* 왼쪽: 영상 */}
              <div className="flex-1 pr-4">
                <div className="w-full aspect-video relative overflow-hidden rounded bg-black">
                  <img
                    src={detected.thumbnail}
                    alt={detected.cctvName}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = cctvThumbnailMap[detected.cctvId] || '/cctv_img/001.jpg';
                    }}
                  />
                  {/* 추적 영역 표시 */}
                  <div 
                    className="absolute inset-0"
                    style={{ pointerEvents: isTrackingBoxDraggable ? 'auto' : 'none' }}
                    onMouseMove={(e) => {
                      if (isDragging && isTrackingBoxDraggable) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const percentX = (x / rect.width) * 100;
                        const percentY = (y / rect.height) * 100;
                        setTrackingBoxPosition({
                          top: Math.max(0, Math.min(100, percentY)),
                          left: Math.max(0, Math.min(100, percentX)),
                        });
                      }
                    }}
                    onMouseUp={() => {
                      setIsDragging(false);
                    }}
                    onMouseLeave={() => {
                      setIsDragging(false);
                    }}
                  >
                    <div
                      className={`absolute border-2 border-red-500 bg-red-500/20 rounded ${isTrackingBoxDraggable ? 'cursor-move' : ''}`}
                      style={{
                        width: '200px',
                        height: '150px',
                        top: `${trackingBoxPosition.top}%`,
                        left: `${trackingBoxPosition.left}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: isTrackingBoxDraggable ? 'auto' : 'none',
                      }}
                      onMouseDown={(e) => {
                        if (isTrackingBoxDraggable) {
                          e.stopPropagation();
                          setIsDragging(true);
                        }
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        추적 대상
                      </div>
                    </div>
                  </div>
                  {/* Clip 상태 표시 - LIVE처럼 */}
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 rounded-full z-10">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <Icon icon="mdi:circle" className="w-2 h-2" />
                    Clip
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 rounded text-white text-xs font-semibold">
                    {detected.timestamp}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-[#31353a]"></div>

              {/* 오른쪽: AI요약 (스크롤) */}
              <div className="w-[400px] pl-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh * 0.8 * 0.8 - 200px)' }}>
                <div className="space-y-4">
                  {/* AI 해석 */}
                  {detected.aiAnalysis && (
                    <div className="bg-[#0f1723] border border-[#155DFC] p-4 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon="mdi:sparkles" className="w-4 h-4 text-[#50A1FF]" />
                        <span className="text-[#50A1FF] font-semibold text-sm">AI 해석</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{detected.aiAnalysis}</p>
                    </div>
                  )}

                  {/* 용의자 의심 이유 */}
                  {detected.suspectReason && (
                    <div className="bg-[#1a1a1a] border border-[#31353a] p-4 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon="mdi:alert-circle" className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold text-sm">용의자 의심 이유</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{detected.suspectReason}</p>
                    </div>
                  )}

                  {/* 상황 설명 */}
                  {detected.situation && (
                    <div className="bg-[#1a1a1a] border border-[#31353a] p-4 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon="mdi:information" className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-semibold text-sm">상황 설명</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{detected.situation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 하단 영역: CCTV 정보 (2컬럼) + 제어 버튼 */}
            <div className="flex border-t border-[#31353a] p-4 flex-shrink-0">
              {/* 왼쪽: CCTV 정보 (2컬럼) */}
              <div className="flex-1 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">CCTV 명칭</div>
                    <div className="text-white font-semibold text-sm">
                      {detected.cctvId}  (화각 {fov})
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">위치</div>
                    <div className="text-gray-300 text-sm">
                      {cctv?.name || detected.cctvName}{cctv?.location ? `(${cctv.location})` : detected.location ? `(${detected.location})` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">폴대 위/경도</div>
                    <div className="text-gray-300 text-sm">
                      {(() => {
                        const coords = cctvCoordinatesMap[detected.cctvId];
                        return coords ? `${coords.latitude}, ${coords.longitude}` : '알 수 없음';
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">방향</div>
                    <div className="text-gray-300 text-sm">
                      {cctv?.location ? getDirection(cctv.location, cctv.name) : detected.location ? getDirection(detected.location, detected.cctvName) : getDirection('', detected.cctvName)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">AI분석</div>
                    <div className="text-gray-300 text-sm">
                      객체·행동 감지 활성
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">최근포착</div>
                    <div className="text-gray-300 text-sm">
                      {getRecentCaptures(detected.cctvId)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-[#31353a]"></div>

              {/* 오른쪽: 클립 제어 (원래 CCTV 정보가 있던 공간) */}
              <div className="w-[400px] bg-[#0f0f0f] pl-4 flex flex-col gap-4 flex-shrink-0">
                {/* 재생 컨트롤 버튼 */}
                <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const newTime = Math.max(0, clipCurrentTime - 10);
                        setClipCurrentTime(newTime);
                      }}
                      className="p-2 bg-[#0f0f0f] border border-[#31353a] text-white hover:bg-[#2a2a2a] transition-colors rounded"
                      aria-label="10초 뒤로"
                    >
                      <Icon icon="mdi:rewind-10" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsClipPlaying(!isClipPlaying)}
                      className="p-3 bg-[#0f0f0f] border border-[#31353a] text-white hover:bg-[#2a2a2a] transition-colors rounded"
                      aria-label={isClipPlaying ? "일시정지" : "재생"}
                    >
                      <Icon icon={isClipPlaying ? "mdi:pause" : "mdi:play"} className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => {
                        const newTime = Math.min(clipDuration, clipCurrentTime + 10);
                        setClipCurrentTime(newTime);
                      }}
                      className="p-2 bg-[#0f0f0f] border border-[#31353a] text-white hover:bg-[#2a2a2a] transition-colors rounded"
                      aria-label="10초 앞으로"
                    >
                      <Icon icon="mdi:fast-forward-10" className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 재생 타임라인 */}
                <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatTime(clipCurrentTime)}</span>
                      <span>{formatTime(clipDuration)}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max={clipDuration || 100}
                        value={clipCurrentTime}
                        onChange={(e) => setClipCurrentTime(Number(e.target.value))}
                        className="w-full h-2 bg-[#0f0f0f] rounded-full appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(clipCurrentTime / (clipDuration || 1)) * 100}%, #0f0f0f ${(clipCurrentTime / (clipDuration || 1)) * 100}%, #0f0f0f 100%)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            </>
          ) : (
            // 실시간 모니터링 탭
            <>
            {/* 영상 영역 - 2컬럼 */}
            <div className="flex p-4 flex-1 min-h-0">
              {/* 왼쪽: 영상 */}
              <div className="flex-1 pr-4">
                <div className="w-full aspect-video relative overflow-hidden rounded bg-black">
                  <img
                    src={cctvThumbnailMap[selectedCCTV] || '/cctv_img/001.jpg'}
                    alt={`${selectedCCTV} 라이브`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/cctv_img/001.jpg';
                    }}
                  />
                  {/* LIVE 오버레이 */}
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 rounded-full z-10">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <Icon icon="mdi:circle" className="w-2 h-2" />
                    LIVE
                  </div>
                </div>
              </div>

              {/* Divider */}
              {hasMultiple && <div className="w-px bg-[#31353a]"></div>}

              {/* 오른쪽: 클러스터 CCTV (영상 높이에 맞춤, 2컬럼) */}
              {hasMultiple && (
                <div className="w-[400px] pl-4 overflow-hidden">
                  <div className="grid grid-cols-2 gap-2">
                    {currentCluster.map((cctvId: string, index: number) => {
                      const isActive = cctvId === selectedCCTV;
                      return (
                        <button
                          key={cctvId}
                          onClick={() => {
                            setSelectedCCTV(cctvId);
                            setCurrentCctvIndex(index);
                          }}
                          className={`aspect-video rounded overflow-hidden border-2 transition-all ${
                            isActive 
                              ? 'border-blue-500 ring-2 ring-blue-500/30' 
                              : 'border-[#31353a] hover:border-blue-500/50'
                          }`}
                        >
                          <img
                            src={cctvThumbnailMap[cctvId] || '/cctv_img/001.jpg'}
                            alt={cctvId}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/cctv_img/001.jpg';
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 영역: CCTV 정보 (2컬럼) + PTZ 제어 */}
            <div className="flex border-t border-[#31353a] p-4 flex-shrink-0">
              {/* 왼쪽: CCTV 정보 (2컬럼) */}
              <div className="flex-1 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">CCTV 명칭</div>
                    <div className="text-white font-semibold text-sm">
                      {selectedCCTV}  (화각 {fov})
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">위치</div>
                    <div className="text-gray-300 text-sm">
                      {cctv?.name || selectedCCTV}{cctv?.location ? `(${cctv.location})` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">폴대 위/경도</div>
                    <div className="text-gray-300 text-sm">
                      {(() => {
                        const coords = cctvCoordinatesMap[selectedCCTV];
                        return coords ? `${coords.latitude}, ${coords.longitude}` : '알 수 없음';
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">방향</div>
                    <div className="text-gray-300 text-sm">
                      {cctv?.location ? getDirection(cctv.location, cctv.name) : getDirection('', selectedCCTV)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">AI분석</div>
                    <div className="text-gray-300 text-sm">
                      객체·행동 감지 활성
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">최근포착</div>
                    <div className="text-gray-300 text-sm">
                      {getRecentCaptures(selectedCCTV)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-[#31353a]"></div>

              {/* 오른쪽: PTZ 제어 (원래 CCTV 정보가 있던 공간) */}
              <div className="w-[400px] bg-[#0f0f0f] pl-4 flex flex-col gap-4 flex-shrink-0">
                <div className="flex gap-4">
                  {/* Pan/Tilt + Zoom 세로 배치 */}
                  <div className="flex flex-col gap-4 flex-shrink-0">
                    {/* Pan/Tilt 조이스틱 영역 */}
                    <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div></div>
                        <button
                          onClick={handlePTZUp}
                          className={`p-2 border border-[#31353a] text-white transition-colors rounded ${
                            pressedKey === 'up' ? 'bg-blue-600' : 'bg-[#0f0f0f] hover:bg-[#2a2a2a]'
                          }`}
                          aria-label="위로 이동"
                        >
                          <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />
                        </button>
                        <div></div>
                        <button
                          onClick={handlePTZLeft}
                          className={`p-2 border border-[#31353a] text-white transition-colors rounded ${
                            pressedKey === 'left' ? 'bg-blue-600' : 'bg-[#0f0f0f] hover:bg-[#2a2a2a]'
                          }`}
                          aria-label="왼쪽으로 이동"
                        >
                          <Icon icon="mdi:chevron-left" className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={handlePTZCenter}
                          className={`p-2 border border-[#31353a] text-white transition-colors rounded ${
                            pressedKey === 'center' ? 'bg-blue-600' : 'bg-[#0f0f0f] hover:bg-[#2a2a2a]'
                          }`}
                          aria-label="중앙"
                        >
                          <Icon icon="mdi:target" className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={handlePTZRight}
                          className={`p-2 border border-[#31353a] text-white transition-colors rounded ${
                            pressedKey === 'right' ? 'bg-blue-600' : 'bg-[#0f0f0f] hover:bg-[#2a2a2a]'
                          }`}
                          aria-label="오른쪽으로 이동"
                        >
                          <Icon icon="mdi:chevron-right" className="w-5 h-5 mx-auto" />
                        </button>
                        <div></div>
                        <button
                          onClick={handlePTZDown}
                          className={`p-2 border border-[#31353a] text-white transition-colors rounded ${
                            pressedKey === 'down' ? 'bg-blue-600' : 'bg-[#0f0f0f] hover:bg-[#2a2a2a]'
                          }`}
                          aria-label="아래로 이동"
                        >
                          <Icon icon="mdi:chevron-down" className="w-5 h-5 mx-auto" />
                        </button>
                        <div></div>
                      </div>
                    </div>

                    {/* Zoom 제어 */}
                    <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleZoomOut}
                          className={`p-2 border border-[#31353a] text-white transition-colors rounded ${
                            pressedKey === 'zoomOut' ? 'bg-blue-600' : 'bg-[#0f0f0f] hover:bg-[#2a2a2a]'
                          }`}
                          aria-label="줌 아웃"
                        >
                          <Icon icon="mdi:minus" className="w-5 h-5" />
                        </button>
                        <div className="flex-1 h-2 bg-[#0f0f0f] rounded-full relative">
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full"></div>
                        </div>
                        <button
                          onClick={handleZoomIn}
                          className={`p-2 border border-[#31353a] text-white transition-colors rounded ${
                            pressedKey === 'zoomIn' ? 'bg-blue-600' : 'bg-[#0f0f0f] hover:bg-[#2a2a2a]'
                          }`}
                          aria-label="줌 인"
                        >
                          <Icon icon="mdi:plus" className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 프리셋 */}
                  <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4 flex-1">
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handlePreset(preset)}
                          className={`w-12 h-12 border border-[#31353a] text-white transition-colors rounded-full text-xs flex items-center justify-center ${
                            pressedKey === `preset-${preset}` ? 'bg-blue-600' : 'bg-[#0f0f0f] hover:bg-[#2a2a2a]'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-between items-center gap-2 p-4 border-t border-[#31353a] flex-shrink-0">
          <div className="flex gap-2">
            {activeTab === 'clip' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (isTrackingBoxDraggable) {
                      // 추적대상 재선택 완료
                      alert('추적대상 재선택이 완료되었습니다. AI가 추적대상을 재 분석합니다.');
                      setIsTrackingBoxDraggable(false);
                      onClose();
                    } else {
                      setIsTrackingBoxDraggable(true);
                    }
                  }}
                  className={`${getSecondaryButtonClassName()} ${isTrackingBoxDraggable ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                >
                  {isTrackingBoxDraggable ? '추적대상 재선택 완료' : '추적대상 재추적'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // TODO: 전파하기 기능 구현
                    console.log('전파하기');
                  }}
                  className={getSecondaryButtonClassName()}
                >
                  전파하기
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  // TODO: CCTV 모니터링 추가 기능 구현
                  console.log('CCTV 모니터링 추가');
                }}
                className={getSecondaryButtonClassName()}
              >
                CCTV 모니터링 추가
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={getSecondaryButtonClassName()}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

