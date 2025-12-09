'use client';

import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Icon } from '@iconify/react';
import { useParams } from 'next/navigation';
import { getEventById, generateAIInsight, domainLabels, convertToDashboardEvent, formatEventDateTime } from '@/lib/events-data';
import { EventLeftPanel } from '@/components/event-detail/EventLeftPanel';
import { EventCenterPanel } from '@/components/event-detail/EventCenterPanel';
import { EventData, RiskFactor, ChatMessage, SavedClip } from '@/components/event-detail/types';
import { behaviorHighlights, movementTimeline, cctvInfo, cctvThumbnailMap, cctvFovMap, detectedCCTVThumbnails } from '@/components/event-detail/constants';


const EventDetailPageContent = () => {
  const params = useParams();
  const eventId = params.eventId as string;
  
  const baseEvent = useMemo(() => {
    if (!eventId) return null;
    return getEventById(eventId);
  }, [eventId]);

  const event: EventData | null = useMemo(() => {
    if (!baseEvent) return null;
    return {
      id: baseEvent.eventId,
      type: baseEvent.type,
      title: baseEvent.title,
      time: baseEvent.time,
      location: baseEvent.location,
      description: baseEvent.description || '',
      source: baseEvent.source || '112 신고',
      pScore: baseEvent.pScore || 0,
      risk: baseEvent.risk,
      status: baseEvent.status === 'URGENT' ? 'URGENT' : baseEvent.status === 'ACTIVE' ? 'ACTIVE' : baseEvent.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NEW',
      domain: baseEvent.domain,
    };
  }, [baseEvent]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'chat-1',
      role: 'assistant',
      content:
        '현재 사건 요약을 기반으로 즉시 대응 전략을 준비했습니다. 필요한 분석이나 정보가 있으면 자연어로 요청해주세요.',
      timestamp: '00:10:20',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [showCCTVPopup, setShowCCTVPopup] = useState(false);
  const [selectedCCTV, setSelectedCCTV] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(332); // 5분 32초
  const [savedClips, setSavedClips] = useState<Array<{ id: string; cctvId: string; cctvName: string; timestamp: string; duration: string; frameTimestamp: string; thumbnail: string; status: 'saved' | 'ready' }>>([]);
  const [showTrackingOverlay, setShowTrackingOverlay] = useState(false);
  const [monitoringCCTVs, setMonitoringCCTVs] = useState<string[]>([
    'CCTV-7 (현장)', 
    'CCTV-12 (북쪽 50m)', 
    'CCTV-15 (골목길)',
    'CCTV-9 (동쪽 100m)',
    'CCTV-11 (서쪽 80m)',
    'CCTV-3 (남쪽 120m)',
    'CCTV-5 (북동쪽 150m)',
    'CCTV-8 (서남쪽 90m)',
    'CCTV-13 (동남쪽 110m)',
    'CCTV-16 (북서쪽 130m)',
  ]); // 모니터링 중인 CCTV 리스트 (초기값: AI 추천 CCTV)
  const trackingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // CCTV 토글 상태 (localStorage로 공유) - Hydration 에러 방지를 위해 초기값은 항상 false
  const [showCCTV, setShowCCTV] = useState(false);
  const [showCCTVViewAngle, setShowCCTVViewAngle] = useState(false);
  const [showCCTVName, setShowCCTVName] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // 클라이언트 마운트 후 localStorage에서 값 읽기
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedCCTV = localStorage.getItem('cctv-show-cctv');
      const savedViewAngle = localStorage.getItem('cctv-show-view-angle');
      const savedName = localStorage.getItem('cctv-show-name');
      
      if (savedCCTV === 'true') setShowCCTV(true);
      if (savedViewAngle === 'true') setShowCCTVViewAngle(true);
      if (savedName === 'true') setShowCCTVName(true);
    }
  }, []);

  // localStorage 동기화
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      localStorage.setItem('cctv-show-cctv', showCCTV.toString());
    }
  }, [showCCTV, isMounted]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      localStorage.setItem('cctv-show-view-angle', showCCTVViewAngle.toString());
    }
  }, [showCCTVViewAngle, isMounted]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      localStorage.setItem('cctv-show-name', showCCTVName.toString());
    }
  }, [showCCTVName, isMounted]);

  // localStorage 변경 감지 (다른 탭/페이지에서 변경 시)
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cctv-show-cctv') {
        setShowCCTV(e.newValue === 'true');
      } else if (e.key === 'cctv-show-view-angle') {
        setShowCCTVViewAngle(e.newValue === 'true');
      } else if (e.key === 'cctv-show-name') {
        setShowCCTVName(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isMounted]);
  const addClipsToBroadcastRef = useRef<((clips: Array<{ id: string; cctvId: string; cctvName: string; timestamp: string; duration: string; frameTimestamp: string; thumbnail: string; status: 'saved' | 'ready' }>) => void) | null>(null);
  const openBroadcastModalRef = useRef<(() => void) | null>(null);
  const lastBroadcastConfirmHandledRef = useRef<number | null>(null);

  const handleDeleteClip = (clipId: string) => {
    setSavedClips((prev) => prev.filter((clip) => clip.id !== clipId));
  };

  const handleAddToMonitoring = (cctvKey: string) => {
    if (!monitoringCCTVs.includes(cctvKey)) {
      setMonitoringCCTVs((prev) => [...prev, cctvKey]);
    }
  };

  const handleRemoveFromMonitoring = (cctvKey: string) => {
    setMonitoringCCTVs((prev) => prev.filter((key) => key !== cctvKey));
  };

  const handleActivateTracking = () => {
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current);
    }
    setShowTrackingOverlay(true);
    trackingTimeoutRef.current = setTimeout(() => {
      setShowTrackingOverlay(false);
    }, 4000);
  };

  const addMessage = (role: 'assistant' | 'user', content: string, buttons?: string[], isCCTVRecommendation?: boolean) => {
    const timestamp = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setChatMessages((prev) => [...prev, { 
      id: `${role}-${Date.now()}`, 
      role, 
      content, 
      timestamp,
      buttons,
      isCCTVRecommendation
    }]);
  };

  const generateAssistantReply = (prompt: string) => {
    if (!event) return '이벤트 정보를 불러올 수 없습니다.';
    
    const title = event.title;
    const location = event.location;
    const pScore = event.pScore;
    const eventType = event.type;
    
    // 각 명령에 맞는 구체적인 답변 생성
    if (prompt.includes('분석') || prompt.includes('이 사건')) {
      const insight = generateAIInsight(baseEvent!);
      return `📊 ${title} 사건 종합 분석

**사건 개요**
• 발생 시간: ${event.time}
• 발생 위치: ${location}
• 사건 유형: ${eventType}
• 현재 위험도: ${event.risk} (위험도 수치: ${pScore}%)

**상황 요약**
${insight}`;
    } else if (prompt.includes('용의자') || prompt.includes('특징')) {
      return `👤 용의자 특징 상세 정보

**기본 정보**
• 성별/연령: 남성, 30대 초반 추정
• 체격: 170cm 추정, 중간 체격
• ReID 신뢰도: 89%

**착의 정보**
• 상의: 검은색 후드티
• 하의: 청바지
• 신발: 흰색 운동화

**행동 패턴**
• 폭행 지속 시간: 약 2분 15초
• 공격 유형: 주먹, 발차기
• 도주 방향: 북쪽 골목길로 이동
• 현재 상태: 추적 중`;
    } else if (prompt.includes('추적') || prompt.includes('경로')) {
      return `🗺️ 추적 경로 및 동선 분석

**이동 타임라인**
• 00:10:15 - CCTV-7 현장에서 폭행 발생
• 00:12:34 - CCTV-12 포착 (북쪽으로 50m 이동)
• 00:13:02 - CCTV-15 포착 (골목길 진입)
• 00:13:30 - 현재 추적 위치 (반경 200m 내)

**예상 이동 경로**
현장(CCTV-7) → 북쪽 골목길(CCTV-12) → 골목길 내부(CCTV-15) → 현재 추적 중`;
    } else if (prompt.includes('전파문') || prompt.includes('초안')) {
      return `📄 전파문 초안

**사건 개요**
• 사건번호: ${event.id}
• 사건유형: ${event.type}
• 발생시간: ${event.time}
• 발생장소: ${location}
• 위험도: ${event.risk}

**사건 내용**
${event.description || '112 신고 접수 - 사건 발생.'}

**현황**
• 현재 추적 중 (반경 200m 내)

**대응 조치**
• 즉시 현장 출동 필요
• CCTV 집중 모니터링`;
    } else if (prompt.includes('위험도') || prompt.includes('재계산')) {
      return `⚠️ 위험도 재평가 결과

**기존 위험도**
• 위험도 수치: ${pScore}%
• 위험도 등급: ${event.risk}

**재계산 결과**
• 새로운 위험도 수치: ${pScore + 2}%
• 위험도 등급: ${event.risk} (유지)`;
    } else if (prompt.includes('유사') || prompt.includes('사건')) {
      return `🔍 유사 사건 검색 결과

**검색 기준**
• 사건 유형: ${event.type}
• 발생 장소: ${location} 인근

**유사 사건 3건 발견**
과거 유사 사건들의 대응 패턴을 참고하여 즉시 대응을 권장합니다.`;
    } else if (prompt.includes('cctv') || prompt.includes('CCTV') || prompt.includes('추천')) {
      return `📹 관련 CCTV 추가 추천

**현재 추천 CCTV**
1. **CCTV-7 (현장)**
   • 위치: 평촌대로 사거리
   • 신뢰도: 96%
   • 상태: 활성

2. **CCTV-12 (북쪽 50m)**
   • 위치: 비산동 주택가
   • 신뢰도: 88%
   • 상태: 추적중

3. **CCTV-15 (골목길)**
   • 위치: 안양중앙시장 입구
   • 신뢰도: 73%
   • 상태: 추적중`;
    } else {
      return `"${prompt}" 요청에 대해 ${title} 사건 기준으로 정보를 정리했습니다. 필요한 세부 데이터가 있다면 추가로 지시해주세요.`;
    }
  };

  const handleSendMessage = (messageText?: string) => {
    const text = (messageText ?? chatInput).trim();
    if (!text || isResponding) return;
    // 전파 초안 확인 단계에서의 긍정 응답 처리 (메시지 버블/추가 답변 없이 모달만 오픈)
    const isPositive =
      text === '응' || text === '응.' || text === '네' || text === '네.' || text === '그래' || text === '좋아';
    const lastAssistant = [...chatMessages].reverse().find((msg) => msg.role === 'assistant');

    if (
      isPositive &&
      lastAssistant &&
      lastAssistant.content.includes('전파 초안 클립영상에 추가되어 있습니다. 전파 초안을 작성할까요?')
    ) {
      const now = Date.now();
      if (lastBroadcastConfirmHandledRef.current && now - lastBroadcastConfirmHandledRef.current < 1500) {
        // 직전에 이미 처리했으면 아무 것도 하지 않음
        setChatInput('');
        return;
      }

      setChatInput('');
      if (openBroadcastModalRef.current) {
        openBroadcastModalRef.current();
      }
      lastBroadcastConfirmHandledRef.current = now;
      return;
    }

    addMessage('user', text);
    setChatInput('');

    setIsResponding(true);
    setTimeout(() => {
      const reply = generateAssistantReply(text);
      const isCCTV = text.includes('cctv') || text.includes('CCTV') || text.includes('추천');
      const buttons = isCCTV ? ['CCTV-7 (현장)', 'CCTV-12 (북쪽 50m)', 'CCTV-15 (골목길)', 'CCTV-9 (동쪽 100m)', 'CCTV-11 (서쪽 80m)'] : undefined;
      addMessage('assistant', reply, buttons, isCCTV);
      setIsResponding(false);
    }, 700);
  };


  // 재생 중 타임라인 업데이트
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  useEffect(() => {
    return () => {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
    };
  }, []);

  if (!event || !baseEvent) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#161719]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">이벤트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const categoryLabel = domainLabels[event.domain];
  const aiSummary = generateAIInsight(baseEvent);
  
  // 대시보드 이벤트로 변환하여 processingStage와 priority 가져오기
  const dashboardEvent = useMemo(() => {
    if (!baseEvent) return null;
    return convertToDashboardEvent(baseEvent, 0);
  }, [baseEvent]);
  
  // 우선순위 매핑 (risk -> priority)
  const priorityMap: Record<string, '긴급' | '경계' | '주의'> = {
    HIGH: '긴급',
    MEDIUM: '경계',
    LOW: '주의',
  };
  const priority = priorityMap[event.risk] || '주의';
  const formattedDateTime = formatEventDateTime(event.id, event.time);
  const normalizedSource = useMemo(() => {
    if (!event) return '112 신고';
    if (!event.source) return '112 신고';
    return event.source.includes('AI') || event.source === 'AI' ? 'AI' : event.source;
  }, [event]);
  const aiSummaryCompact = useMemo(() => {
    if (!aiSummary) return '';
    const normalized = aiSummary.replace(/\s+/g, ' ').trim();
    const sentenceChunks = normalized.split(/(?<=[.!?]|니다\.)\s+/).filter(Boolean);
    const compact = sentenceChunks.slice(0, 2).join(' ');
    if (compact.length <= 220) return compact;
    return compact.slice(0, 220).trimEnd() + '…';
  }, [aiSummary]);
  
  const detailStats = [
    { label: '위험도', value: event.risk },
    { label: '위험도 수치', value: `${event.pScore}%` },
    { label: '진행 상태', value: event.status },
    { label: '신고 기관', value: event.source },
    { label: '발생 시간', value: event.time },
  ].filter((item) => item.value);

  const buildRiskFactors = (event: EventData, base: ReturnType<typeof getEventById>) => {
    const factors: RiskFactor[] = [];
    
    // 이벤트 ID 기반 구체적인 위험 요인 분석
    if (event.id.includes('003') || (event.type.includes('차량도주') || event.type.includes('용의차량'))) {
      factors.push(
        { label: '도주 속도', value: '85km/h', reason: '해당 구간 제한속도 초과, 고속 도주 패턴', level: 'high' },
        { label: '행동 패턴', value: '신호 위반 3회 / 급차선 변경 반복', reason: '추적 회피 패턴', level: 'high' },
        { label: '시간대', value: `야간(${event.time})`, reason: '시야 확보 어려움, 위험도 증가', level: 'medium' },
        { label: '연관 이벤트', value: '은행 강도 신고(5분 전)', reason: '동일 시간대 + 동일 도주 방향', level: 'strong' },
      );
    } else if (event.type.includes('폭행') || event.type.includes('상해') || event.id.includes('001')) {
      factors.push(
        { label: '행동 패턴', value: '폭행 지속 2분 15초', reason: '타격+발차기 반복, 피해자 방어 불가', level: 'high' },
        { label: '도주 방향', value: '북쪽 골목', reason: '출입 제한 구역으로 추적 난이도 상승', level: 'medium' },
        { label: '연관 CCTV', value: 'CCTV-7·12·15', reason: '연속 포착으로 확증 높음', level: 'medium' },
        { label: '피해자 상태', value: '부상 의심', reason: '피해자 쓰러짐 감지', level: 'high' },
      );
    } else {
      factors.push(
        { label: '위험도', value: event.risk, reason: '도메인 규정상 즉시 대응 등급', level: event.risk === 'HIGH' ? 'high' : 'medium' },
        { label: '위험도 수치', value: `${event.pScore}%`, reason: 'AI 추정 위험도 산식 결과', level: event.pScore >= 80 ? 'high' : 'medium' },
        { label: '시간대', value: event.time, reason: '야간/심야 여부 반영', level: 'medium' },
      );
    }
    return factors;
  };

  const riskFactors = useMemo(() => buildRiskFactors(event, baseEvent), [event, baseEvent]);
  const priorityScore = Math.round(event.pScore ?? 0);
  const confidenceScore = Math.round(dashboardEvent?.confidence ?? event.pScore ?? 0);
  const riskReasonSummary = riskFactors.length
    ? riskFactors.map((factor) => `${factor.label}: ${factor.reason}`).join(' · ')
    : '위험 요인 정보가 충분하지 않습니다.';
  const selectedCctvId = selectedCCTV && cctvInfo[selectedCCTV] ? cctvInfo[selectedCCTV].id : null;
  const selectedCctvThumbnail = selectedCctvId ? cctvThumbnailMap[selectedCctvId] || '/cctv_img/001.jpg' : '/cctv_img/001.jpg';
  const selectedCctvFov = selectedCctvId ? cctvFovMap[selectedCctvId] || '100°' : '100°';

  return (
    <div 
      className="flex flex-col bg-[#161719] overflow-hidden relative"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div 
        className="flex flex-col flex-1"
        style={{
          width: '125%',
          height: '125%',
          transform: 'scale(0.8)',
          transformOrigin: 'top left',
        }}
      >
        <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - 대시보드 스타일 적용 */}
        <EventLeftPanel
          event={event}
          baseEvent={baseEvent}
          priority={priority}
          aiSummary={aiSummary}
          riskFactors={riskFactors}
          priorityScore={priorityScore}
          confidenceScore={confidenceScore}
          riskReasonSummary={riskReasonSummary}
          formattedDateTime={formattedDateTime}
          normalizedSource={normalizedSource}
          dashboardEvent={dashboardEvent}
          onAddClipsRef={addClipsToBroadcastRef}
          onOpenModalRef={openBroadcastModalRef}
        />

        {/* Center Panel - 2컬럼 레이아웃 */}
        <main className="flex-1 bg-[#161719] flex flex-col h-full overflow-hidden border-l border-r border-[#31353a] relative" style={{ borderWidth: '1px', borderTop: 'none', borderBottom: 'none' }}>
          {/* 우측 패널 토글 버튼 */}
          {!isRightPanelCollapsed && (
            <button
              onClick={() => setIsRightPanelCollapsed(true)}
              className="absolute top-1/2 -translate-y-1/2 -right-2 w-8 h-14 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors focus:outline-none z-50 bg-[#161719] border border-[#31353a] rounded"
              style={{ borderWidth: '1px' }}
              aria-label="우측 패널 접기"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
            </button>
          )}
          <div className="flex-1 overflow-hidden pl-7 pb-4">
            <div className="flex gap-6 h-full">
              {/* 1열: 위치 및 동선 - 우측 패널이 펼쳐졌을 때 더 넓게 */}
              <div className="flex flex-col pt-4 h-full overflow-y-auto pr-4 flex-shrink-0" style={{ width: isRightPanelCollapsed ? '50%' : '55%' }}>
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
                        {/* 동선 경로 */}
                        <polyline 
                          points="30,160 80,120 140,130 170,90" 
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
                    <div className="absolute" style={{ left: '15%', top: '80%', transform: 'translate(-50%, -50%)', zIndex: 100 }}>
                      <div className="w-7 h-7 bg-[#1a1a1a] border-2 border-yellow-500 rounded-lg flex items-center justify-center shadow-xl relative">
                        <Icon 
                          icon="mdi:cctv" 
                          className="text-yellow-400" 
                          width="16px" 
                          height="16px"
                        />
                      </div>
                      {showCCTVName && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#1a1a1a] border border-yellow-500 rounded text-white text-xs whitespace-nowrap shadow-lg z-10">
                          CCTV-7
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
                      <div className="absolute" style={{ left: '40%', top: '60%', transform: 'translate(-50%, -50%)', zIndex: 100 }}>
                        <div className="w-7 h-7 bg-[#1a1a1a] border-2 border-blue-500 rounded-lg flex items-center justify-center shadow-xl relative">
                          <Icon 
                            icon="mdi:cctv" 
                            className="text-blue-400" 
                            width="16px" 
                            height="16px"
                          />
                        </div>
                        {showCCTVName && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#1a1a1a] border border-blue-500 rounded text-white text-xs whitespace-nowrap shadow-lg z-10">
                            CCTV-12
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
                      
                      <div className="absolute" style={{ left: '70%', top: '65%', transform: 'translate(-50%, -50%)', zIndex: 100 }}>
                        <div className="w-7 h-7 bg-[#1a1a1a] border-2 border-blue-500 rounded-lg flex items-center justify-center shadow-xl relative">
                          <Icon 
                            icon="mdi:cctv" 
                            className="text-blue-400" 
                            width="16px" 
                            height="16px"
                          />
                        </div>
                        {showCCTVName && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#1a1a1a] border border-blue-500 rounded text-white text-xs whitespace-nowrap shadow-lg z-10">
                            CCTV-15
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
                    </>
                  )}
                  
                  {/* 현재 위치 CCTV - 모든 요소를 하나의 컨테이너에 중앙 정렬 */}
                  {showCCTV && (
                    <div className="absolute flex items-center justify-center" style={{ left: '85%', top: '45%', transform: 'translate(-50%, -50%)', zIndex: 120, width: '80px', height: '80px' }}>
                      {/* 대쉬 원 - 가장 아래 레이어 (펄스 애니메이션) */}
                      <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 80 }}>
                        <div className="w-full h-full rounded-full border-2 border-red-400" style={{ borderColor: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.2)' }}></div>
                      </div>
                      {/* CCTV 아이콘 - 최상단 */}
                      <div className="w-7 h-7 bg-[#1a1a1a] border-2 border-red-500 rounded-lg flex items-center justify-center shadow-xl relative" style={{ zIndex: 130 }}>
                        <Icon 
                          icon="mdi:cctv" 
                          className="text-red-400" 
                          width="16px" 
                          height="16px"
                        />
                      </div>
                      {showCCTVName && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#1a1a1a] border border-red-500 rounded text-white text-xs whitespace-nowrap shadow-lg" style={{ zIndex: 140 }}>
                          현재 위치
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

                {/* 위치 및 동선 박스 - 타임라인만 감싸기 */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3">
                    <Icon icon="mdi:map-marker" className="w-4 h-4 text-green-300" />
                    위치 및 동선
                  </div>
                  <div className="bg-[#0f0f0f] border border-[#31353a] p-4 flex-1 flex flex-col min-h-0" style={{ borderWidth: '1px' }}>
                    <div className="space-y-2 text-sm overflow-y-auto flex-1">
                      {[...movementTimeline].reverse().map((entry) => (
                        <div key={entry.time} className="flex gap-3">
                          <div className="text-xs text-gray-500 w-16">{entry.time}</div>
                          <div>
                            <p className={`font-semibold ${entry.color}`}>{entry.label}</p>
                            <p className="text-gray-400 text-xs">{entry.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2열: CCTV, 인물 분석, 행동 요약 */}
              <div className="flex flex-col space-y-6 pt-4 overflow-y-auto h-full pr-4 flex-1 min-w-0">
                {/* 포착된 CCTV 썸네일 */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3">
                    <Icon icon="mdi:image-multiple" className="w-4 h-4 text-purple-300" />
                    포착된 CCTV 썸네일
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                    <div className={`grid gap-3`} style={{ 
                      gridTemplateColumns: `repeat(auto-fill, minmax(160px, 1fr))`,
                      gridTemplateRows: 'repeat(2, minmax(0, 1fr))', 
                      gridAutoRows: 'minmax(0, 1fr)' 
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
                        className="bg-[#0f0f0f] border border-[#31353a] rounded cursor-pointer hover:border-purple-500/50 transition-colors overflow-hidden group"
                        style={{ borderWidth: '1px' }}
                        onClick={() => {
                          setSelectedCCTV(detected.cctvName);
                          setShowCCTVPopup(true);
                        }}
                      >
                        <div className="relative aspect-video bg-black">
                          <img
                            src={detected.thumbnail}
                            alt={detected.cctvName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = cctvThumbnailMap[detected.cctvId] || '/cctv_img/001.jpg';
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
                          <div className="text-white text-[10px] font-semibold truncate">{detected.cctvId}</div>
                          <div className="text-gray-400 text-[10px] truncate">{detected.location}</div>
                          <div className="text-gray-400 text-[10px] truncate">{detected.description}</div>
                        </div>
                      </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CCTV 모니터링 */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3">
                    <Icon icon="mdi:cctv" className="w-4 h-4 text-blue-300" />
                    주변 cctv
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                    <div className={`grid gap-3`} style={{ 
                      gridTemplateColumns: `repeat(auto-fill, minmax(160px, 1fr))`,
                      gridTemplateRows: 'repeat(2, minmax(0, 1fr))', 
                      gridAutoRows: 'minmax(0, 1fr)' 
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
            </div>
          </div>
        </main>

        {/* Right Panel - AI Agent (채팅) */}
        {!isRightPanelCollapsed && (
          <aside className="w-[30rem] bg-white border-l border-[#31353a] flex flex-col h-full overflow-y-auto pl-4 pr-5 transition-all duration-300" style={{ borderWidth: '1px', borderTop: 'none', borderBottom: 'none' }}>
          <EventCenterPanel
            categoryLabel={categoryLabel}
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            isResponding={isResponding}
            savedClips={savedClips}
            setSelectedCCTV={setSelectedCCTV}
            setShowCCTVPopup={setShowCCTVPopup}
            handleSendMessage={handleSendMessage}
            handleDeleteClip={handleDeleteClip}
          />
        </aside>
        )}

        {/* 우측 패널 접힘 시 플로팅 버튼 */}
        {isRightPanelCollapsed && (
          <button
            onClick={() => setIsRightPanelCollapsed(false)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-50"
            aria-label="우측 패널 펼치기"
          >
            <Icon icon="mdi:chevron-right" className="w-6 h-6" />
          </button>
        )}

        </div>
      </div>

      {/* CCTV 팝업 - 미디어 플레이어 */}
      {showCCTVPopup && selectedCCTV && cctvInfo[selectedCCTV] && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
          onClick={() => {
            setShowCCTVPopup(false);
            setSelectedCCTV(null);
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        >
          <div
            className="bg-[#101013] border border-[#31353a] w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-lg p-6 text-sm text-gray-100 space-y-5"
            style={{ borderWidth: '1px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-semibold text-white">
                <Icon icon="mdi:cctv" className="w-5 h-5 text-[#50A1FF]" />
                CCTV 모니터링
              </div>
              <button
                onClick={() => {
                  setShowCCTVPopup(false);
                  setSelectedCCTV(null);
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
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

                      setShowCCTVPopup(false);
                      setSelectedCCTV(null);
                      setIsPlaying(false);
                      setCurrentTime(0);
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
                  onClick={() => {
                    setShowCCTVPopup(false);
                    setSelectedCCTV(null);
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                  className="px-4 py-2 text-sm border border-[#31353a] text-gray-400 hover:text-white"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function EventDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#161719]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">로딩 중...</p>
        </div>
      </div>
    }>
      <EventDetailPageContent />
    </Suspense>
  );
}

