'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { Event } from '@/types';
import { getEventById, generateSimpleAIInsight, getEventCategory } from '@/lib/events-data';

interface EventDetailProps {
  event: Event | null;
  onClose?: () => void;
  onSummaryRequest?: () => void;
  onLinkEvents?: () => void;
  onBroadcastDraft?: () => void;
  onBroadcastNow?: () => void;
}

const EventDetail = ({ event, onClose, onSummaryRequest, onLinkEvents, onBroadcastDraft, onBroadcastNow }: EventDetailProps) => {
  const router = useRouter();
  
  if (!event) return null;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return { label: 'High', color: 'bg-red-600 text-white' };
      case 'Medium':
        return { label: 'Medium', color: 'bg-yellow-600 text-white' };
      case 'Low':
        return { label: 'Low', color: 'bg-blue-600 text-white' };
      default:
        return { label: priority, color: 'bg-gray-600 text-white' };
    }
  };

  const priorityBadge = getPriorityBadge(event.priority);

  // statistics2 데이터 요약 생성
  const generateAIInsight = () => {
    const baseEvent = event.eventId ? getEventById(event.eventId) : null;
    
    if (baseEvent) {
      // 공통 함수 사용
      return generateSimpleAIInsight(baseEvent);
    }

    // 기본 인사이트 (eventId가 없는 경우)
    if (event.type.includes('화재')) {
      return '화재 이벤트 발생. 강풍 영향으로 확산 위험이 높으며, 접근 가능한 도로가 제한적입니다. 즉시 소방대 출동이 필요합니다.';
    } else if (event.type.includes('미아') || event.type.includes('배회')) {
      return '실종/배회 이벤트 발생. 마지막 목격 좌표 기준 반경 300m 내에서 배회 행동이 감지되었습니다. 즉시 수색대 출동이 필요합니다.';
    } else if (event.type.includes('약자')) {
      return '약자 쓰러짐 이벤트 발생. 강풍·조도·지형 영향으로 긴급도 High입니다. 즉시 구조대 출동이 필요합니다.';
    } else if (event.type.includes('치안') || event.type.includes('폭행') || event.type.includes('절도')) {
      return '치안 사건 발생. CCTV AI 감지 및 112 신고가 동시에 접수되어 고신뢰도 사건으로 분류되었습니다. 즉시 경찰 출동이 필요합니다.';
    }
    return `${event.title} 이벤트 발생. 현재 상황을 분석 중이며, 필요시 즉시 대응이 필요합니다.`;
  };

  const aiInsight = generateAIInsight();

  const handleDetailedAnalysis = () => {
    // statistics2 페이지로 이동 (이벤트 ID를 쿼리 파라미터로 전달)
    if (event.eventId) {
      router.push(`/statistics2?eventId=${event.eventId}`);
    } else {
      router.push('/statistics2');
    }
  };

  return (
    <>
      {/* 모달 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center"
        style={{ zIndex: 300 }}
        onClick={onClose}
      >
        {/* 모달 컨텐츠 */}
        <div 
          className="w-[90vw] max-w-2xl bg-[#161719] border border-[#31353a] flex flex-col max-h-[90vh]"
          style={{ borderWidth: '1px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-16 border-b border-[#31353a] flex items-center justify-between px-6 flex-shrink-0">
            <h2 className="text-white font-semibold">이벤트 상세</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-[#161719] transition-colors"
                aria-label="닫기"
              >
                <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* 기본 정보 */}
        <div>
          <h3 className="text-white font-medium mb-2">기본 정보</h3>
          <div className="bg-[#36383B] p-3 space-y-2 border border-[#31353a]" style={{ borderWidth: '1px' }}>
            {event.eventId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">사건번호</span>
                <span className="text-gray-300 text-sm font-mono">{event.eventId}</span>
              </div>
            )}
            {event.eventId && (() => {
              const baseEvent = getEventById(event.eventId);
              return baseEvent ? (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">카테고리</span>
                  <span className="text-blue-400 text-sm">{getEventCategory(baseEvent)}</span>
                </div>
              ) : null;
            })()}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">유형</span>
              <span className="text-white text-sm">{event.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">우선순위</span>
              <span className={`text-xs px-2 py-1 ${priorityBadge.color}`}>
                {priorityBadge.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">시간</span>
              <span className="text-white text-sm">{event.timestamp}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">위치</span>
              <span className="text-white text-sm">{event.location.name}</span>
            </div>
            {event.confidence && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">신뢰도</span>
                <span className="text-white text-sm">{event.confidence}%</span>
              </div>
            )}
          </div>
        </div>

        {/* 처리 현황 */}
        <div>
          <h3 className="text-white font-medium mb-2">처리 현황</h3>
          <div className="bg-[#36383B] p-3 border border-[#31353a] space-y-3" style={{ borderWidth: '1px' }}>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">이벤트 상태</span>
              <span className="px-3 py-1 border border-[#50545a] text-white text-sm tracking-tight" style={{ borderWidth: '1px' }}>
                {event.processingStage}
              </span>
            </div>
            {event.processingStage === '종결' ? (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">처리 결과 · {event.resolution.category}</span>
                  <span className="text-white text-sm font-semibold">{event.resolution.code}</span>
                </div>
                <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                  {event.resolution.description}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                처리 결과는 종결 단계에서 제공됩니다.
              </p>
            )}
          </div>
        </div>

        {/* AI 인사이트 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:sparkles" className="w-4 h-4 text-blue-300" />
              <h3 className="text-white font-medium">AI 인사이트</h3>
            </div>
            <button
              onClick={handleDetailedAnalysis}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              상세 분석
            </button>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 p-4" style={{ borderWidth: '1px' }}>
            <p className="text-white text-sm leading-relaxed">{aiInsight}</p>
          </div>
        </div>

        {/* 설명 */}
        {event.description && (
          <div>
            <h3 className="text-white font-medium mb-2">상황 설명</h3>
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <p className="text-white text-sm">{event.description}</p>
            </div>
          </div>
        )}

        {/* 주변 CCTV */}
        <div>
          <h3 className="text-white font-medium mb-2">주변 CCTV</h3>
          <div className="bg-[#36383B] p-3">
            <p className="text-gray-400 text-sm">CCTV 정보를 불러오는 중...</p>
          </div>
        </div>

        {/* 위험도 */}
        <div>
          <h3 className="text-white font-medium mb-2">위험도 분석</h3>
          <div className="bg-[#36383B] p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">위험도 점수</span>
                <span className="text-red-400 font-semibold">
                  {event.priority === 'High' ? '92점' : event.priority === 'Medium' ? '76점' : '45점'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 연관 이벤트 */}
        {event.relatedEvents && event.relatedEvents.length > 0 && (
          <div>
            <h3 className="text-white font-medium mb-2">연관 후보</h3>
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <p className="text-gray-400 text-sm mb-2">
                {event.relatedEvents.length}개의 이벤트가 연관 후보로 제안되었습니다.
              </p>
              {onLinkEvents && (
                <button
                  onClick={onLinkEvents}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  연관 묶기
                </button>
              )}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div>
          <h3 className="text-white font-medium mb-2">AI 인사이트</h3>
          <div className="bg-[#36383B] p-3">
            <p className="text-gray-400 text-sm mb-2">AI 분석 결과가 표시됩니다.</p>
            {onSummaryRequest && (
              <button
                onClick={onSummaryRequest}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors mb-2"
              >
                Agent에게 요약 요청
              </button>
            )}
          </div>
        </div>

        {/* 소방서 전파 (화재 이벤트만) */}
        {event.type === '119-화재' && event.nearbyResources?.fireStations && (
          <div>
            <h3 className="text-white font-medium mb-2">소방서 전파</h3>
            <div className="bg-[#36383B] p-3 space-y-2 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="space-y-2 mb-3">
                {event.nearbyResources.fireStations.map((station) => (
                  <div key={station.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-white">{station.name}</span>
                      <span className="text-gray-400 text-xs ml-2">({station.distance}km)</span>
                    </div>
                  </div>
                ))}
              </div>
              {onBroadcastDraft && (
                <button
                  onClick={onBroadcastDraft}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  전파 초안 생성
                </button>
              )}
              {onBroadcastNow && (
                <button
                  onClick={onBroadcastNow}
                  className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors"
                >
                  즉시 전파
                </button>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EventDetail;

