'use client';

import { Icon } from '@iconify/react';
import { cctvInfo, cctvThumbnailMap } from './constants';

interface SavedClip {
  id: string;
  cctvId: string;
  cctvName: string;
  timestamp: string;
  duration: string;
  frameTimestamp: string;
  thumbnail: string;
  status: 'saved' | 'ready';
}

interface CCTVMonitoringPopupProps {
  isOpen: boolean;
  selectedCCTV: string | null;
  cctvInfo: typeof cctvInfo;
  selectedCctvThumbnail: string;
  selectedCctvFov: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  savedClips: SavedClip[];
  showTrackingOverlay: boolean;
  monitoringCCTVs: string[];
  onClose: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setSavedClips: React.Dispatch<React.SetStateAction<SavedClip[]>>;
  setShowTrackingOverlay: (show: boolean) => void;
  handleActivateTracking: () => void;
  handleDeleteClip: (clipId: string) => void;
  handleAddToMonitoring: (cctvKey: string) => void;
  handleRemoveFromMonitoring: (cctvKey: string) => void;
  addClipsToBroadcastRef: React.MutableRefObject<((clips: SavedClip[]) => void) | null>;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
}

export const CCTVMonitoringPopup = ({
  isOpen,
  selectedCCTV,
  cctvInfo,
  selectedCctvThumbnail,
  selectedCctvFov,
  isPlaying,
  currentTime,
  duration,
  savedClips,
  showTrackingOverlay,
  monitoringCCTVs,
  onClose,
  setIsPlaying,
  setCurrentTime,
  setSavedClips,
  setShowTrackingOverlay,
  handleActivateTracking,
  handleDeleteClip,
  handleAddToMonitoring,
  handleRemoveFromMonitoring,
  addClipsToBroadcastRef,
  addMessage,
}: CCTVMonitoringPopupProps) => {
  if (!isOpen || !selectedCCTV || !cctvInfo[selectedCCTV]) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
      onClick={onClose}
    >
      <div
        className="bg-[#101013] border border-[#31353a] w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-lg p-6 text-sm text-gray-100 space-y-5"
        style={{ transform: 'scale(0.8)', transformOrigin: 'center center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 팝업 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <Icon icon="mdi:cctv" className="w-5 h-5 text-[#50A1FF]" />
            CCTV 모니터링
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
            aria-label="CCTV 모달 닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex overflow-hidden -mx-6">
          {/* 왼쪽: CCTV 영상 */}
          <div className="w-[60%] bg-black p-4 flex flex-col gap-4">
            <div className="w-full aspect-video relative overflow-hidden rounded bg-black">
              <img
                src={selectedCctvThumbnail}
                alt={`${cctvInfo[selectedCCTV].id} 라이브`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = cctvThumbnailMap[cctvInfo[selectedCCTV].id] || '/cctv_img/001.jpg';
                }}
              />
              {/* REC 오버레이 */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute top-4 left-4 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 rounded-full z-10"
              >
                <span className="w-2 h-2 bg-white rounded-full"></span>
                REC
              </button>
              {showTrackingOverlay && (
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className="absolute bg-yellow-400/80 text-black text-xs font-semibold px-2 py-1 rounded"
                    style={{
                      top: 'calc(35% - 80px)',
                      left: 'calc(45% - 70px)',
                    }}
                  >
                    추적 중
                  </div>
                  <div
                    className="absolute border-2 border-yellow-400 rounded-sm animate-pulse"
                    style={{
                      width: '140px',
                      height: '100px',
                      top: '35%',
                      left: '45%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  ></div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>{new Date().toISOString().slice(0, 19).replace('T', ' ')}</span>
              <span>{isPlaying ? 'LIVE' : 'PAUSED'}</span>
            </div>
          </div>

          {/* 오른쪽: 컨트롤 패널 */}
          <div className="flex-1 bg-[var(--color-black)] flex flex-col text-gray-100">
            <div className="p-6">
              <div className="space-y-2 mb-4">
                <p className="text-white font-semibold text-sm">관리번호 {cctvInfo[selectedCCTV].id}</p>
                <p className="text-gray-400 text-sm">위치 {cctvInfo[selectedCCTV].location}</p>
                <p className="text-gray-400 text-sm">화각 {selectedCctvFov}</p>
                <p className="text-gray-300 text-sm">{cctvInfo[selectedCCTV].name}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                    className="p-2 bg-[#0f0f0f] border border-[#31353a] text-white hover:bg-[#2a2a2a] transition-colors"
                    style={{ borderWidth: '1px' }}
                  >
                    <Icon icon="mdi:skip-backward" className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex-1 p-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white hover:bg-[#2a2a2a] transition-colors flex items-center justify-center"
                    style={{ borderWidth: '1px' }}
                  >
                    <Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                    className="p-2 bg-[#0f0f0f] border border-[#31353a] text-white hover:bg-[#2a2a2a] transition-colors"
                    style={{ borderWidth: '1px' }}
                  >
                    <Icon icon="mdi:skip-forward" className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="relative h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-blue-500"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    ></div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full"
                      style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translate(-50%, -50%)' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                    <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="w-full max-w-md flex gap-2">
                <button
                  onClick={handleActivateTracking}
                  className="flex-1 px-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
                  style={{ borderWidth: '1px' }}
                >
                  <Icon icon="mdi:target" className="w-4 h-4" />
                  추적 모드 활성화
                </button>
                <button
                  onClick={() => {
                    const clipId = `clip-${Date.now()}`;
                    const frameTime = new Date().toISOString().slice(11, 19);
                    const cctvId = cctvInfo[selectedCCTV].id;
                    const clip = {
                      id: clipId,
                      cctvId: cctvId,
                      cctvName: cctvInfo[selectedCCTV].name,
                      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
                      duration: `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')} - ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`,
                      frameTimestamp: frameTime,
                      thumbnail: cctvThumbnailMap[cctvId] || '/cctv_img/001.jpg',
                      status: 'ready' as const,
                    };
                    setSavedClips((prev) => [...prev, clip]);
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
                  style={{ borderWidth: '1px' }}
                >
                  <Icon icon="mdi:content-save" className="w-4 h-4" />
                  클립 저장
                </button>
              </div>
            </div>
          </div>
        </div>

        {savedClips.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-white">저장된 클립</div>
              <span className="text-xs text-gray-400">{savedClips.length}개</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {savedClips
                .filter((clip) => clip.cctvId === cctvInfo[selectedCCTV].id)
                .map((clip) => (
                  <div key={clip.id} className="min-w-[160px] bg-[#36383B] border border-[#2a2d36] shadow-sm relative">
                    <button
                      className="absolute top-2 right-2 z-10 text-white bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
                      onClick={() => handleDeleteClip(clip.id)}
                      aria-label="저장된 클립 삭제"
                    >
                      <Icon icon="mdi:close" className="w-4 h-4" />
                    </button>
                    <div className="relative h-24 bg-gray-200 overflow-hidden">
                      <img 
                        src={clip.thumbnail || cctvThumbnailMap[clip.cctvId] || '/cctv_img/001.jpg'} 
                        alt={`${clip.cctvId} 썸네일`} 
                        className="absolute inset-0 w-full h-full object-cover" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = cctvThumbnailMap[clip.cctvId] || '/cctv_img/001.jpg';
                        }}
                      />
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {clip.frameTimestamp}
                      </span>
                    </div>
                    <div className="px-3 py-2 space-y-1 text-xs bg-white">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-gray-900">{clip.cctvId}</span>
                        <span className="text-gray-500">{clip.status === 'ready' ? '전파 준비' : '저장'}</span>
                      </div>
                      <div className="text-gray-500">{clip.timestamp}</div>
                      <div className="text-gray-700">{clip.duration}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 -mx-6 px-6">
          <button
            type="button"
            onClick={() => {
              if (!selectedCCTV) return;
              if (monitoringCCTVs.includes(selectedCCTV)) {
                handleRemoveFromMonitoring(selectedCCTV);
              } else {
                handleAddToMonitoring(selectedCCTV);
              }
            }}
            className={`px-4 py-2 text-sm border border-[#31353a] transition-colors ${
              monitoringCCTVs.includes(selectedCCTV || '')
                ? 'text-red-300 hover:text-red-400 hover:border-red-400'
                : 'text-gray-300 hover:text-white hover:border-white'
            }`}
          >
            {monitoringCCTVs.includes(selectedCCTV || '') ? '모니터링 해제' : '모니터링 추가'}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (!selectedCCTV) return;
                const currentClips = savedClips.filter((clip) => clip.cctvId === cctvInfo[selectedCCTV].id);
                const clipCount = currentClips.length;
                if (clipCount > 0) {
                  // 전파 초안 작성 모달에 클립 추가
                  if (addClipsToBroadcastRef.current) {
                    addClipsToBroadcastRef.current(currentClips);
                  }
                  // CCTV 모달의 저장된 클립에서 제거
                  setSavedClips((prev) => prev.filter((clip) => !currentClips.some((c) => c.id === clip.id)));

                  const cctvLabel = `${cctvInfo[selectedCCTV].id} (${cctvInfo[selectedCCTV].location})`;
                  // 사용자 메시지
                  addMessage(
                    'user',
                    `${cctvLabel} ${clipCount}건 전파 초안 작성에 추가`
                  );
                  // AI 응답 메시지 (전파 초안 확인 질문)
                  addMessage(
                    'assistant',
                    `총 ${clipCount}건의 클립 영상이 전파 초안 클립영상에 추가되어 있습니다. 전파 초안을 작성할까요?`
                  );

                  onClose();
                } else {
                  alert('추가할 클립이 없습니다.');
                }
              }}
              className="px-4 py-2 text-sm border border-[#31353a] text-gray-300 hover:text-white hover:border-white"
            >
              전파 초안에 추가
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-[#31353a] text-gray-400 hover:text-white"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

