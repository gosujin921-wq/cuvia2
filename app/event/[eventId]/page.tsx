'use client';

import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getEventById, generateAIInsight, domainLabels, getEventCategory, getAIInsightKeywords, convertToDashboardEvent, formatEventDateTime } from '@/lib/events-data';
import BroadcastControls from '@/components/BroadcastControls';

interface EventData {
  id: string;
  type: string;
  title: string;
  time: string;
  location: string;
  description: string;
  source: string;
  pScore: number;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'URGENT' | 'ACTIVE' | 'NEW' | 'IN_PROGRESS';
  domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

type RiskLevel = 'high' | 'medium' | 'low' | 'strong';

interface RiskFactor {
  label: string;
  value: string;
  reason: string;
  level: RiskLevel;
}

const riskLevelMeta: Record<RiskLevel, { icon: string; color: string }> = {
  strong: { icon: 'mdi:alert', color: 'text-red-400' },
  high: { icon: 'mdi:alert', color: 'text-orange-400' },
  medium: { icon: 'mdi:alert', color: 'text-yellow-400' },
  low: { icon: 'mdi:alert', color: 'text-yellow-300' },
};

const chatBlocks = [
  {
    title: '사건 해석',
    icon: 'mdi:lightbulb-on',
    content:
      '명확한 폭행 행위가 확인되었습니다. 피해자와 가해자 구분이 명확하며, 가해자는 현재 도주 중입니다.',
  },
  {
    title: '관련 행동 분석',
    icon: 'mdi:run-fast',
    content:
      '폭행 지속 시간 약 2분 15초. 주먹과 발차기가 모두 관찰되었으며, 피해자는 방어만 하는 상태였습니다.',
  },
  {
    title: '인물 추정',
    icon: 'mdi:account-badge',
    content: '가해자(용의자)는 검은색 후드티, 청바지 착용. 폭행 후 북쪽 골목길로 도주.',
  },
  {
    title: '대응 추천',
    icon: 'mdi:shield-check',
    content: '즉시 현장 출동이 필요합니다. 용의자 추적을 위해 북쪽 방향 CCTV 집중 모니터링을 권장합니다.',
  },
];

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  buttons?: string[];
  isCCTVRecommendation?: boolean;
}

const quickCommands = [
  '이 사건 분석해줘',
  '용의자 특징 알려줘',
  '추적 경로 보여줘',
  '전파문 초안 작성해줘',
  '위험도 재계산해줘',
  '유사 사건 찾아줘',
];

const behaviorHighlights = [
  '폭행 지속: 약 2분 15초',
  '공격 유형: 주먹, 발차기',
  '도주 방향: 북쪽 골목길',
  '현재 상태: 추적 중',
];

const movementTimeline = [
  { time: '00:10:15', label: 'CCTV-7 현장', desc: '폭행 발생', color: 'text-blue-400' },
  { time: '00:12:34', label: 'CCTV-12 포착', desc: '북쪽으로 이동 (50m)', color: 'text-yellow-400' },
  { time: '00:13:02', label: 'CCTV-15 포착', desc: '골목길 진입', color: 'text-yellow-400' },
  { time: '00:13:30', label: '추적 위치', desc: '반경 200m 내', color: 'text-green-400' },
];

const routeRecommendation = '최단 출동 경로: 중앙로 → 골목길 입구 (ETA 3분)';

const cctvInfo: Record<string, { id: string; name: string; location: string; status: string; confidence: number }> = {
  'CCTV-7 (현장)': {
    id: 'CCTV-7',
    name: '평촌대로 사거리',
    location: '현장',
    status: '활성',
    confidence: 96,
  },
  'CCTV-12 (북쪽 50m)': {
    id: 'CCTV-12',
    name: '비산동 주택가',
    location: '북쪽 50m',
    status: '추적중',
    confidence: 88,
  },
  'CCTV-15 (골목길)': {
    id: 'CCTV-15',
    name: '안양중앙시장 입구',
    location: '골목길',
    status: '추적중',
    confidence: 73,
  },
  'CCTV-9 (동쪽 100m)': {
    id: 'CCTV-9',
    name: '평촌동 주거지',
    location: '동쪽 100m',
    status: '대기',
    confidence: 65,
  },
  'CCTV-11 (서쪽 80m)': {
    id: 'CCTV-11',
    name: '비산2동 골목',
    location: '서쪽 80m',
    status: '대기',
    confidence: 58,
  },
};

const cctvThumbnailMap: Record<string, string> = {
  'CCTV-7': '/cctv_img/001.jpg',
  'CCTV-12': '/cctv_img/002.jpg',
  'CCTV-15': '/cctv_img/003.jpg',
  'CCTV-9': '/cctv_img/004.jpg',
  'CCTV-11': '/cctv_img/005.jpg',
};

const cctvFovMap: Record<string, string> = {
  'CCTV-7': '110°',
  'CCTV-12': '95°',
  'CCTV-15': '120°',
  'CCTV-9': '100°',
  'CCTV-11': '105°',
};

const agentRouteByDomain: Record<string, string> = {
  A: '/agent-112',
  B: '/agent-119',
  C: '/agent-vulnerable',
  D: '/agent-ai-behavior',
  E: '/agent-disaster',
  F: '/agent-city',
};

const EventDetailPageContent = () => {
  const params = useParams();
  const router = useRouter();
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
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false); // 그리드 확장 상태
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const trackingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addClipsToBroadcastRef = useRef<((clips: Array<{ id: string; cctvId: string; cctvName: string; timestamp: string; duration: string; frameTimestamp: string; thumbnail: string; status: 'saved' | 'ready' }>) => void) | null>(null);
  const openBroadcastModalRef = useRef<(() => void) | null>(null);
  const lastBroadcastConfirmHandledRef = useRef<number | null>(null);

  const handleDeleteClip = (clipId: string) => {
    setSavedClips((prev) => prev.filter((clip) => clip.id !== clipId));
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

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, isResponding]);

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

  const agentRoute = agentRouteByDomain[event.domain];
  const selectedCctvId = selectedCCTV && cctvInfo[selectedCCTV] ? cctvInfo[selectedCCTV].id : null;
  const selectedCctvThumbnail = selectedCctvId ? cctvThumbnailMap[selectedCctvId] || '/cctv_img/001.jpg' : '/cctv_img/001.jpg';
  const selectedCctvFov = selectedCctvId ? cctvFovMap[selectedCctvId] || '100°' : '100°';

  const rightPanelBlocks = [
    {
      title: '전파 상태',
      content: savedClips.length
        ? `전파 준비 클립 ${savedClips.length}건이 저장되어 있습니다. 필요 시 전파 초안으로 바로 활용 가능합니다.`
        : '현재 전파 준비 클립이 없습니다. CCTV 모달에서 클립을 저장하면 이 영역에 요약이 표시됩니다.',
    },
    {
      title: '위험 요인 요약',
      content: riskReasonSummary,
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#161719] overflow-hidden relative">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - 대시보드 스타일 적용 */}
        <aside className="flex flex-col flex-shrink-0 w-[370px] pl-6 pr-5">
          <div className="py-4">
            <div className="w-24 h-5 flex items-center justify-start">
              <img 
                src="/logo.svg" 
                alt="CUVIA Logo" 
                className="h-5 w-auto object-contain"
              />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="w-full bg-[#161719] flex flex-col h-full overflow-y-auto">
              {/* 이벤트 헤더 정보 - 대시보드 이벤트 카드 스타일 */}
              <div className="px-3 pt-3 pb-4 border-b border-[#31353a]" style={{ paddingLeft: '14px' }}>
                {/* 2. 유형 / 카테고리 */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    baseEvent.domain === 'A'
                      ? baseEvent.type.includes('폭행') || baseEvent.type.includes('상해')
                        ? 'bg-red-500/20 text-red-400'
                        : baseEvent.type.includes('절도') || baseEvent.type.includes('강도')
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : baseEvent.type.includes('차량도주') || baseEvent.type.includes('추적')
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-blue-500/20 text-blue-400'
                      : baseEvent.domain === 'B'
                        ? 'bg-red-500/20 text-red-400'
                        : baseEvent.domain === 'C'
                          ? 'bg-purple-500/20 text-purple-400'
                          : baseEvent.domain === 'D'
                            ? 'bg-green-500/20 text-green-400'
                            : baseEvent.domain === 'E'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {event.type}
                  </span>
                  <span className="text-blue-300 text-[0.75rem] font-medium">{getEventCategory(baseEvent)}</span>
                </div>

                {/* 3. 제목 (AI가 축약한 핵심 문장) */}
                <div className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                  <span>{event.title}</span>
                  {priority === '긴급' && (
                    <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">긴급</span>
                  )}
                  {priority === '경계' && (
                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">경계</span>
                  )}
                  {priority === '주의' && (
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">주의</span>
                  )}
                </div>

              </div>

              {/* 스크롤 가능한 컨텐츠 영역 */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {/* AI 인사이트 */}
            <div className="px-3 pt-4 pb-6">
              <div className="flex items-center gap-2 text-sm tracking-tight text-[#50A1FF] mb-2">
                <Icon icon="mdi:sparkles" className="w-5 h-5 text-[#50A1FF]" />
                <span className="text-[#50A1FF] font-semibold">AI 인사이트</span>
              </div>
              <div className="text-white text-sm leading-relaxed whitespace-pre-wrap px-3 py-2 bg-[#0f1723] border border-[#155DFC]">
                {aiSummary}
              </div>
            </div>
            <div className="px-3 pb-6">
              <BroadcastControls
                eventId={event.id}
                eventTitle={event.title}
                source={normalizedSource || '112 신고'}
                location={event.location}
                receivedAt={formattedDateTime}
                priority={priority}
                aiSummary={aiSummary}
                riskSummary={riskReasonSummary}
                onAddClipsRef={addClipsToBroadcastRef}
                onOpenModalRef={openBroadcastModalRef}
              />
            </div>
                {/* 기본 정보 */}
                <div className="px-3 space-y-2 text-sm text-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">접수 시간</span>
                    <span className="font-semibold">{formattedDateTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">신고 기관</span>
                    <span className="font-semibold">{normalizedSource}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">위치</span>
                    <span className="text-right ml-4 font-semibold">{event.location}</span>
                  </div>
                  {dashboardEvent && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">이벤트 상태</span>
                      <span className="font-semibold">{dashboardEvent.processingStage}</span>
                    </div>
                  )}
                </div>
                {/* 위험 요인 분석 */}
                {riskFactors.length > 0 && (
                  <div className="px-3 space-y-3 mt-6 pb-6">
                    <div className="flex items-center gap-2 text-sm text-white font-semibold">
                      <Icon icon="mdi:alert" className="w-4 h-4 text-red-300" />
                      위험 요인 분석
                    </div>
                    <div className="space-y-2">
                      {riskFactors.map((factor) => (
                        <div
                          key={factor.label}
                          className="flex items-center justify-between px-4 py-4 border-b border-[#2a2d36] last:border-b-0 bg-[#36383B] text-sm"
                        >
                          <div className="text-white font-semibold">{factor.label}</div>
                          <div className="flex items-center gap-3 justify-end text-right text-sm">
                            <span className="text-white font-semibold">{factor.value}</span>
                            <Icon
                              icon={riskLevelMeta[factor.level].icon}
                              className={`w-5 h-5 ${riskLevelMeta[factor.level].color}`}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 space-y-2 text-sm text-gray-100 bg-[#36383B] px-3 py-3">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-gray-300">우선순위 점수</span>
                          <span className="text-white font-semibold">{priorityScore}점</span>
                        </div>
                        <div className="flex items-center justify-between px-1">
                          <span className="text-gray-300">신뢰도</span>
                          <span className="text-white font-semibold">{confidenceScore}%</span>
                        </div>
                        <div className="px-1">
                          <span className="text-gray-300 text-xs">이유</span>
                          <p className="text-gray-100 text-sm leading-relaxed mt-1">
                            {riskReasonSummary}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Center Panel - 사건 상세 */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6" style={{ paddingTop: '52px' }}>
            {/* AI Chat Blocks */}
            <div className="space-y-4">
              {chatBlocks.map((block) => (
                <div key={block.title} className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon={block.icon} className="w-4 h-4 text-blue-600" />
                    <h4 className="text-gray-900 font-semibold text-sm">{block.title}</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{block.content}</p>
                </div>
              ))}
            </div>

            {/* CCTV 추천 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="mdi:cctv" className="w-4 h-4 text-blue-600" />
                <h4 className="text-gray-900 font-semibold text-sm">CCTV 추천</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {['CCTV-7 (현장)', 'CCTV-12 (북쪽 50m)', 'CCTV-15 (골목길)'].map((cctv) => (
                  <button
                    key={cctv}
                    onClick={() => {
                      setSelectedCCTV(cctv);
                      setShowCCTVPopup(true);
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    style={{ borderWidth: '1px' }}
                  >
                    {cctv}
                  </button>
                ))}
              </div>
            </div>

            {/* 저장된 클립 목록 */}
            {savedClips.length > 0 && (
              <div className="bg-[#1f1f22] border border-[#2a2d36] rounded-lg p-4" style={{ borderWidth: '1px' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:video-box" className="w-4 h-4 text-blue-300" />
                    <h4 className="text-white font-semibold text-sm">저장된 클립 ({savedClips.length})</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                    전파 준비 완료
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedClips.map((clip) => (
                    <div
                      key={clip.id}
                      className="bg-[#36383B] border border-[#2a2d36] rounded-lg p-3 hover:bg-[#3f3f46] transition-colors cursor-pointer text-gray-100"
                      style={{ borderWidth: '1px' }}
                      onClick={() => {
                        setSelectedCCTV(Object.keys(cctvInfo).find((key) => cctvInfo[key].id === clip.cctvId) || null);
                        setShowCCTVPopup(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon icon="mdi:play-circle" className="w-4 h-4 text-blue-300" />
                          <span className="text-sm font-semibold">{clip.cctvId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                            전파 준비
                          </span>
                          <button
                            className="text-gray-400 hover:text-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClip(clip.id);
                            }}
                            aria-label="클립 삭제"
                          >
                            <Icon icon="mdi:close" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-300 text-xs mb-1">{clip.cctvName}</div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{clip.timestamp}</span>
                        <span className="flex items-center gap-1">
                          <Icon icon="mdi:clock-outline" className="w-3 h-3 text-gray-400" />
                          {clip.duration}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-gray-200"></div>

            {/* 대화 로그 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] flex items-center justify-center text-white">
                  <Icon icon="mdi:sparkles" className="w-4 h-4" />
                </div>
                <span className="text-gray-900">{categoryLabel} Agent</span>
              </div>
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <div
                      className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}
                    >
                      <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl border text-sm ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-gray-100 text-gray-900 border-gray-200'
                            }`}
                        style={{ borderWidth: '1px' }}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                          {message.timestamp}
                        </div>
                      </div>
                    </div>
                    {message.role === 'assistant' && message.buttons && message.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.buttons.map((button) => (
                          <button
                            key={button}
                            onClick={() => {
                              setSelectedCCTV(button);
                              setShowCCTVPopup(true);
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            style={{ borderWidth: '1px' }}
                          >
                            {button}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isResponding && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
            </div>

            {/* 스크롤 앵커 - 항상 하단에 고정 */}
            <div ref={bottomRef} className="h-1" />
          </div>

          {/* 빠른 명령 + 자연어 입력 */}
          <div className="border-t border-gray-200 bg-white p-4 sticky bottom-0 left-0 right-0" style={{ borderWidth: '1px' }}>
            <div className="flex flex-wrap gap-2 mb-3">
              {quickCommands.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleSendMessage(cmd)}
                  className="px-3 py-1.5 rounded-full text-xs text-gray-700 transition-colors border border-gray-300 bg-gray-50 hover:bg-gray-100"
                  style={{ borderWidth: '1px' }}
                >
                  {cmd}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="자연어로 질문하세요... (예: '이 사람 다시 보여줘', '관련 CCTV 더 추천해줘')"
                className="flex-1 bg-gray-50 border border-gray-300 rounded-full px-4 py-3 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white"
                style={{ borderWidth: '1px' }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isResponding}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  isResponding ? 'bg-blue-300 text-blue-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                전송
              </button>
            </div>
          </div>
        </main>

        {/* Right Panel - CCTV & 인물 분석 (폴딩 패널) */}
        <aside
          className={`${
            isRightPanelCollapsed ? 'w-20' : isRightPanelExpanded ? 'w-[37rem]' : 'w-[21rem]'
          } bg-[#161719] border-l border-[#31353a] flex flex-col h-full overflow-hidden relative transition-all duration-300`}
          style={{ borderWidth: '1px' }}
        >
          {/* 폴딩 토글 버튼 - 대시보드 우측 패널 스타일 차용 */}
          <button
            onClick={() => {
              if (isRightPanelCollapsed) {
                setIsRightPanelCollapsed(false);
              } else {
                setIsRightPanelExpanded((prev) => !prev);
              }
            }}
            className="absolute top-1/2 -translate-y-1/2 -left-2 w-8 h-14 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors focus:outline-none"
            aria-label={isRightPanelCollapsed ? '우측 패널 펼치기' : '그리드 전환'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
          </button>

          {isRightPanelCollapsed ? (
            <div className="flex-1 flex flex-col items-center justify-between py-8 pl-4 pr-2 gap-6 text-[0.65rem] text-gray-300">
              <div className="flex flex-col items-center gap-2 text-[10.4px]">
                <span className="text-white font-semibold tracking-tight text-center leading-tight">
                  CCTV<br />모니터링
                </span>
                <div className="flex flex-col items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-white">활성</span>
                  <span className="text-green-400 text-sm font-semibold">3</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 text-[10.4px]">
                <span className="text-white font-semibold tracking-tight text-center leading-tight">
                  인물<br />분석
                </span>
                <div className="flex flex-col items-center gap-1">
                  <Icon icon="mdi:account-search" className="w-4 h-4 text-blue-300" />
                  <span className="text-white">추적중</span>
                  <span className="text-red-400 text-sm font-semibold">89%</span>
                </div>
              </div>
            </div>
          ) : (
            isRightPanelExpanded ? (
              /* 2컬럼일 때: 각 컬럼마다 스크롤 */
              <div className="flex-1 flex gap-8 p-3 pl-10 pr-9 overflow-hidden">
                {/* 블록 A: CCTV 모니터링 */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <h3 className="text-white font-semibold text-sm mb-3">CCTV 모니터링</h3>
                  <div className="flex-1 overflow-y-auto space-y-4">
                    {/* CCTV-7 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold text-sm">CCTV-7</span>
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs">활성</span>
                      </div>
                      <div className="text-gray-400 text-xs mb-2">현장</div>
                      <div className="bg-[#0f0f0f] border border-[#31353a] aspect-video flex items-center justify-center" style={{ borderWidth: '1px' }}>
                        <div className="text-center">
                          <Icon icon="mdi:cctv" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">연결 중...</p>
                        </div>
                      </div>
                    </div>

                    {/* CCTV-12 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold text-sm">CCTV-12</span>
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs">추적중</span>
                      </div>
                      <div className="text-gray-400 text-xs mb-2">북쪽 50m</div>
                      <div className="bg-[#0f0f0f] border-2 border-yellow-500/50 aspect-video flex items-center justify-center" style={{ borderWidth: '2px' }}>
                        <div className="text-center">
                          <Icon icon="mdi:cctv" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">연결 중...</p>
                        </div>
                      </div>
                    </div>

                    {/* CCTV-15 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold text-sm">CCTV-15</span>
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs">추적중</span>
                      </div>
                      <div className="text-gray-400 text-xs mb-2">골목길</div>
                      <div className="bg-[#0f0f0f] border-2 border-yellow-500/50 aspect-video flex items-center justify-center" style={{ borderWidth: '2px' }}>
                        <div className="text-center">
                          <Icon icon="mdi:cctv" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">연결 중...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 블록 B: 인물 분석 + 행동 요약 + 위치 및 동선 + 출동 경로 추천 */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <h3 className="text-white font-semibold text-sm mb-3">인물 분석</h3>
                  <div className="flex-1 overflow-y-auto space-y-4">
                    {/* 인물 분석 */}
                    <div className="bg-[#0f0f0f] border border-[#31353a] rounded-lg p-4 space-y-3" style={{ borderWidth: '1px' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-white font-semibold">
                          <Icon icon="mdi:account-search" className="w-4 h-4 text-blue-300" />
                          인물 분석
                        </div>
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">추적중</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
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
                      <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                        실시간 추적 계속
                      </button>
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

                    {/* 위치 및 동선 */}
                    <div>
                      <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3">
                        <Icon icon="mdi:map-marker" className="w-4 h-4 text-green-300" />
                        위치 및 동선
                      </div>
                      <div className="bg-[#0f0f0f] border border-[#31353a] p-4 space-y-4" style={{ borderWidth: '1px' }}>
                        <div
                          className="relative h-48 border border-[#31353a] overflow-hidden"
                          style={{
                            borderWidth: '1px',
                            backgroundImage:
                              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                          }}
                        >
                          <svg viewBox="0 0 200 200" className="absolute inset-0">
                            <polyline points="30,160 80,120 140,130 170,90" fill="none" stroke="#5390ff" strokeWidth="2" strokeDasharray="4 4" />
                            <circle cx="30" cy="160" r="6" fill="#ff4d4f" />
                            <circle cx="80" cy="120" r="6" fill="#5dade2" />
                            <circle cx="140" cy="130" r="6" fill="#f1c40f" />
                            <circle cx="170" cy="90" r="6" fill="#f1c40f" />
                            <circle cx="170" cy="90" r="30" fill="rgba(241,196,15,0.15)" stroke="#f1c40f" strokeDasharray="6 6" />
                          </svg>
                          <div className="absolute top-12 right-8 flex h-6 w-6">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-50"></span>
                            <span className="relative inline-flex rounded-full h-6 w-6 bg-yellow-400"></span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {movementTimeline.map((entry) => (
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

                    {/* 출동 경로 추천 */}
                    <div>
                      <div className="flex items-center gap-2 text-sm text-green-300 font-semibold mb-3">
                        <Icon icon="mdi:route" className="w-4 h-4" />
                        출동 경로 추천
                      </div>
                      <div className="bg-[#0f1f14] border border-green-500/40 p-4" style={{ borderWidth: '1px' }}>
                        <p className="text-gray-200 text-sm">{routeRecommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 1컬럼일 때: 전체 패널 스크롤 */
              <div className="flex-1 overflow-y-auto p-3 pl-10 pr-9 space-y-8">
                {/* 두 블록을 그리드로 배치: 디폴트 1×2 (세로) */}
                <div className="grid gap-8 grid-cols-1">
                  {/* 블록 A: CCTV 모니터링 */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold text-sm">CCTV 모니터링</h3>
                    <div className="space-y-4">
                      {/* CCTV-7 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold text-sm">CCTV-7</span>
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs">활성</span>
                        </div>
                        <div className="text-gray-400 text-xs mb-2">현장</div>
                        <div className="bg-[#0f0f0f] border border-[#31353a] aspect-video flex items-center justify-center" style={{ borderWidth: '1px' }}>
                          <div className="text-center">
                            <Icon icon="mdi:cctv" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-xs">연결 중...</p>
                          </div>
                        </div>
                      </div>

                      {/* CCTV-12 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold text-sm">CCTV-12</span>
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs">추적중</span>
                        </div>
                        <div className="text-gray-400 text-xs mb-2">북쪽 50m</div>
                        <div className="bg-[#0f0f0f] border-2 border-yellow-500/50 aspect-video flex items-center justify-center" style={{ borderWidth: '2px' }}>
                          <div className="text-center">
                            <Icon icon="mdi:cctv" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-xs">연결 중...</p>
                          </div>
                        </div>
                      </div>

                      {/* CCTV-15 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold text-sm">CCTV-15</span>
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs">추적중</span>
                        </div>
                        <div className="text-gray-400 text-xs mb-2">골목길</div>
                        <div className="bg-[#0f0f0f] border-2 border-yellow-500/50 aspect-video flex items-center justify-center" style={{ borderWidth: '2px' }}>
                          <div className="text-center">
                            <Icon icon="mdi:cctv" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-xs">연결 중...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 블록 B: 인물 분석 + 행동 요약 + 위치 및 동선 + 출동 경로 추천 */}
                  <div className="space-y-3">
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
                        <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors">
                          실시간 추적 계속
                        </button>
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

                    {/* 위치 및 동선 */}
                    <div>
                      <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3">
                        <Icon icon="mdi:map-marker" className="w-4 h-4 text-green-300" />
                        위치 및 동선
                      </div>
                      <div className="bg-[#0f0f0f] border border-[#31353a] p-4 space-y-4" style={{ borderWidth: '1px' }}>
                        <div
                          className="relative h-48 border border-[#31353a] overflow-hidden"
                          style={{
                            borderWidth: '1px',
                            backgroundImage:
                              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                          }}
                        >
                          <svg viewBox="0 0 200 200" className="absolute inset-0">
                            <polyline points="30,160 80,120 140,130 170,90" fill="none" stroke="#5390ff" strokeWidth="2" strokeDasharray="4 4" />
                            <circle cx="30" cy="160" r="6" fill="#ff4d4f" />
                            <circle cx="80" cy="120" r="6" fill="#5dade2" />
                            <circle cx="140" cy="130" r="6" fill="#f1c40f" />
                            <circle cx="170" cy="90" r="6" fill="#f1c40f" />
                            <circle cx="170" cy="90" r="30" fill="rgba(241,196,15,0.15)" stroke="#f1c40f" strokeDasharray="6 6" />
                          </svg>
                          <div className="absolute top-12 right-8 flex h-6 w-6">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-50"></span>
                            <span className="relative inline-flex rounded-full h-6 w-6 bg-yellow-400"></span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {movementTimeline.map((entry) => (
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

                    {/* 출동 경로 추천 */}
                    <div>
                      <div className="flex items-center gap-2 text-sm text-green-300 font-semibold mb-3">
                        <Icon icon="mdi:route" className="w-4 h-4" />
                        출동 경로 추천
                      </div>
                      <div className="bg-[#0f1f14] border border-green-500/40 p-4" style={{ borderWidth: '1px' }}>
                        <p className="text-gray-200 text-sm">{routeRecommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </aside>

        {/* 플로팅 배너 - 우측 하단 */}
        {agentRoute && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
            <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg px-4 py-2 flex items-center gap-2" style={{ borderWidth: '1px' }}>
              <Icon icon="mdi:shield-alert" className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">{categoryLabel} Agent</span>
            </div>
            <Link 
              href={agentRoute} 
              className="px-4 py-2 bg-[#36383B] hover:bg-[#2a2a2a] text-white rounded-full transition-colors text-sm border border-[#31353a] flex items-center gap-2" 
              style={{ borderWidth: '1px' }}
            >
              <Icon icon="mdi:view-grid" className="w-4 h-4" />
              그룹 보기
            </Link>
          </div>
        )}
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
                        alert(`${cctvId} 클립 저장 완료. 전파 준비됨.`);
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 -mx-6 px-6">
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

