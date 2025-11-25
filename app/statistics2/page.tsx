'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { allEvents, getEventsByDomain, getEventById, generateAIInsight, domainLabels } from '@/lib/events-data';

interface CrimeEvent {
  id: string;
  type: string;
  title: string;
  time: string;
  location: string;
  description: string;
  source: string;
  pScore: number;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'URGENT' | 'ACTIVE' | 'NEW';
}

// 공통 데이터에서 112 치안(A) 이벤트만 필터링
const getCrimeEvents = (): CrimeEvent[] => {
  return getEventsByDomain('A').map((event) => ({
    id: event.eventId,
    type: event.type,
    title: event.title,
    time: event.time,
    location: event.location,
    description: event.description || '',
    source: event.source || '112 신고',
    pScore: event.pScore || 0,
    risk: event.risk,
    status: event.status === 'URGENT' ? 'URGENT' : event.status === 'ACTIVE' ? 'ACTIVE' : 'NEW',
  }));
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

export default function Statistics2Page() {
  const searchParams = useSearchParams();
  const events = useMemo(() => getCrimeEvents(), []);
  const urgentCount = useMemo(() => events.filter((e) => e.status === 'URGENT').length, [events]);
  const activeCount = useMemo(() => events.filter((e) => e.status === 'ACTIVE').length, [events]);
  const totalCount = events.length;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'URGENT' | 'ACTIVE' | 'ALL'>('URGENT');
  const [selectedEvent, setSelectedEvent] = useState<CrimeEvent | null>(events[0] || null);

  // 쿼리 파라미터에서 eventId 받아서 해당 이벤트 자동 선택
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId) {
      const baseEvent = getEventById(eventId);
      if (baseEvent && baseEvent.domain === 'A') {
        // 도메인 A(112 치안) 이벤트인 경우에만 선택
        const crimeEvent = events.find((e) => e.id === eventId);
        if (crimeEvent) {
          setSelectedEvent(crimeEvent);
          setSelectedCategory(crimeEvent.status === 'URGENT' ? 'URGENT' : crimeEvent.status === 'ACTIVE' ? 'ACTIVE' : 'ALL');
        }
      }
    }
  }, [searchParams, events]);
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
  const [savedClips, setSavedClips] = useState<Array<{ id: string; cctvId: string; cctvName: string; timestamp: string; duration: string; status: 'saved' | 'ready' }>>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const filteredEvents = events.filter((event) => {
    if (selectedCategory === 'URGENT' && event.status !== 'URGENT') return false;
    if (selectedCategory === 'ACTIVE' && event.status !== 'ACTIVE') return false;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return (
        event.id.toLowerCase().includes(lowerSearch) ||
        event.title.toLowerCase().includes(lowerSearch) ||
        event.location.toLowerCase().includes(lowerSearch)
      );
    }
    return true;
  });

  const handleEventSelect = (event: CrimeEvent) => {
    setSelectedEvent(event);
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
    const title = selectedEvent?.title ?? '선택된 사건';
    const location = selectedEvent?.location ?? '현장';
    const pScore = selectedEvent?.pScore ?? 0;
    const eventType = selectedEvent?.type ?? '';
    const baseEvent = selectedEvent?.id ? getEventById(selectedEvent.id) : null;
    
    // 각 명령에 맞는 구체적인 답변 생성
    if (prompt.includes('분석') || prompt.includes('이 사건')) {
      // 이벤트 타입별 맞춤 분석
      let situationSummary = '';
      let keyFeatures = '';
      let recommendations = '';

      if (baseEvent) {
        const insight = generateAIInsight(baseEvent);
        situationSummary = insight;
      } else {
        // 타입별 기본 분석
        switch (eventType) {
          case '폭행':
            situationSummary = '112 신고 접수와 CCTV AI 감지가 동시에 이루어진 고신뢰도 사건입니다. 폭행 행위가 명확히 확인되었으며, 가해자는 현재 도주 중입니다.';
            keyFeatures = '• 피해자와 가해자 구분 명확\n• 폭행 지속 시간: 약 2분 15초\n• 도주 방향: 북쪽 골목길\n• CCTV 포착: CCTV-7, CCTV-12, CCTV-15';
            recommendations = '즉시 현장 출동이 필요하며, 북쪽 방향 CCTV 집중 모니터링을 권장합니다.';
            break;
          case '절도':
            situationSummary = 'CCTV AI에 의해 절도 의심 행위가 감지되었습니다. 현장 CCTV 분석 결과, 용의자 동선 반복 및 급가속 구간이 확인되었습니다.';
            keyFeatures = '• 현금 다발을 가방에 넣는 장면 포착\n• 용의자 동선 반복 패턴 확인\n• CCTV-7, CCTV-12에서 포착';
            recommendations = '즉시 경찰 출동 및 현장 보전이 필요합니다. CCTV 연속 추적 모드를 활성화하세요.';
            break;
          case '추격':
            situationSummary = '추격 행동이 CCTV AI에 의해 감지되었습니다. 도주 차량/인물과 추격자의 이동 경로가 실시간으로 추적 중입니다.';
            keyFeatures = '• 도주 방향: 북쪽 일대\n• 추격자와의 거리: 약 50m\n• CCTV-12, CCTV-15에서 연속 포착';
            recommendations = '즉시 경찰 출동 및 도로 차단이 필요할 수 있습니다. CCTV 추적 모드를 강화하세요.';
            break;
          default:
            situationSummary = '112 신고 접수와 CCTV AI 감지가 동시에 이루어진 고신뢰도 사건입니다.';
            keyFeatures = '• CCTV 포착: CCTV-7, CCTV-12, CCTV-15';
            recommendations = '즉시 현장 출동이 필요하며, CCTV 집중 모니터링을 권장합니다.';
        }
      }

      return `📊 ${title} 사건 종합 분석

**사건 개요**
• 발생 시간: ${selectedEvent?.time ?? '알 수 없음'}
• 발생 위치: ${location}
• 사건 유형: ${eventType}
• 현재 위험도: ${selectedEvent?.risk ?? '알 수 없음'} (P-Score: ${pScore}%)

**상황 요약**
${situationSummary || '112 신고 접수와 CCTV AI 감지가 동시에 이루어진 고신뢰도 사건입니다.'}

${keyFeatures ? `**주요 특징**\n${keyFeatures}\n\n` : ''}**대응 권고사항**
${recommendations || '즉시 현장 출동이 필요하며, CCTV 집중 모니터링을 권장합니다.'}`;
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
• 현재 상태: 추적 중

**최근 포착 위치**
• CCTV-7 (현장): 00:10:15
• CCTV-12 (북쪽 50m): 00:12:34
• CCTV-15 (골목길): 00:13:02

**추가 특징**
손에 긴 물체를 소지한 것으로 추정되며, 반복 배회 후 급이탈 행동이 관찰되었습니다.`;
    } else if (prompt.includes('추적') || prompt.includes('경로')) {
      return `🗺️ 추적 경로 및 동선 분석

**이동 타임라인**
• 00:10:15 - CCTV-7 현장에서 폭행 발생
• 00:12:34 - CCTV-12 포착 (북쪽으로 50m 이동)
• 00:13:02 - CCTV-15 포착 (골목길 진입)
• 00:13:30 - 현재 추적 위치 (반경 200m 내)

**예상 이동 경로**
현장(CCTV-7) → 북쪽 골목길(CCTV-12) → 골목길 내부(CCTV-15) → 현재 추적 중

**CCTV 추천 우선순위**
1. CCTV-7 (현장) - 사건 발생 지점
2. CCTV-12 (북쪽 50m) - 주요 이동 경로
3. CCTV-15 (골목길) - 최근 포착 지점

**출동 경로 추천**
최단 출동 경로: 중앙로 → 골목길 입구 (ETA 3분)

**추적 상태**
현재 실시간 추적이 진행 중이며, 반경 200m 내에서 지속 모니터링 중입니다.`;
    } else if (prompt.includes('전파문') || prompt.includes('초안')) {
      return `📄 전파문 초안

**사건 개요**
• 사건번호: ${selectedEvent?.id}
• 사건유형: ${selectedEvent?.type}
• 발생시간: ${selectedEvent?.time}
• 발생장소: ${location}
• 위험도: ${selectedEvent?.risk}

**사건 내용**
112 신고 접수 - 성인 남성 2명 간 폭행 발생. CCTV AI도 동시 감지하여 고신뢰도 사건으로 분류되었습니다.

**현황**
• 피해자와 가해자 구분 명확
• 가해자는 검은색 후드티, 청바지 착용
• 폭행 후 북쪽 골목길로 도주
• 현재 추적 중 (반경 200m 내)

**대응 조치**
• 즉시 현장 출동 필요
• CCTV-7, CCTV-12, CCTV-15 집중 모니터링
• 북쪽 방향 추적 강화

**추가 정보**
• ReID 신뢰도: 89%
• 관련 CCTV: CCTV-7 (현장), CCTV-12 (북쪽 50m), CCTV-15 (골목길)
• 출동 경로: 중앙로 → 골목길 입구 (ETA 3분)`;
    } else if (prompt.includes('위험도') || prompt.includes('재계산')) {
      return `⚠️ 위험도 재평가 결과

**기존 위험도**
• P-Score: ${pScore}%
• 위험도 등급: ${selectedEvent?.risk ?? '알 수 없음'}

**재계산 결과**
• 새로운 P-Score: ${pScore + 2}%
• 위험도 등급: ${selectedEvent?.risk} (유지)

**재평가 근거**
• 추가 신고 접수: +3점
• CCTV 연속 포착: +2점
• 도주 속도 증가: +1점
• 과거 유사 사건 패턴: +1점

**위험도 상승 요인**
1. 도주 중 추가 CCTV 포착 (CCTV-12, CCTV-15)
2. 이동 속도 증가 패턴 확인
3. 과거 동일 장소 유사 사건 2건 존재

**대응 권고**
현재 위험도가 높은 수준을 유지하고 있어 즉시 대응이 필요합니다. 추적 강화 및 현장 출동을 권장합니다.`;
    } else if (prompt.includes('유사') || prompt.includes('사건')) {
      return `🔍 유사 사건 검색 결과

**검색 기준**
• 사건 유형: ${selectedEvent?.type}
• 발생 장소: ${location} 인근
• 행동 패턴: 폭행 → 도주

**유사 사건 3건 발견**

**1. 사건번호: AN-112-1987**
• 발생일: 2024년 1월 15일
• 유사도: 87%
• 특징: 동일 장소, 폭행 후 북쪽 도주
• 대응 시간: 4분 30초

**2. 사건번호: AN-112-2012**
• 발생일: 2024년 2월 3일
• 유사도: 76%
• 특징: 유사 행동 패턴, CCTV 추적 경로 일치
• 대응 시간: 5분 12초

**3. 사건번호: AN-112-2031**
• 발생일: 2024년 2월 28일
• 유사도: 71%
• 특징: 동일 시간대, 유사 체격/착의
• 대응 시간: 3분 45초

**공통 패턴**
• 모두 북쪽 방향 도주
• CCTV-12, CCTV-15 경로 일치
• 평균 대응 시간: 4분 29초

**권고사항**
과거 유사 사건들의 대응 패턴을 참고하여 북쪽 방향 추적을 강화하는 것을 권장합니다.`;
    } else if (prompt.includes('cctv') || prompt.includes('CCTV') || prompt.includes('추천')) {
      return `📹 관련 CCTV 추가 추천

**현재 추천 CCTV**
1. **CCTV-7 (현장)**
   • 위치: 평촌대로 사거리
   • 신뢰도: 96%
   • 상태: 활성
   • 특징: 사건 발생 지점, 주요 증거 영상 확보 가능

2. **CCTV-12 (북쪽 50m)**
   • 위치: 비산동 주택가
   • 신뢰도: 88%
   • 상태: 추적중
   • 특징: 도주 경로 주요 지점, 이동 속도 증가 구간

3. **CCTV-15 (골목길)**
   • 위치: 안양중앙시장 입구
   • 신뢰도: 73%
   • 상태: 추적중
   • 특징: 최근 포착 지점, 현재 추적 중

**추가 추천 CCTV**
4. **CCTV-9 (동쪽 100m)**
   • 위치: 평촌동 주거지
   • 신뢰도: 65%
   • 상태: 대기
   • 특징: 예상 이동 경로, 예방적 모니터링 권장

5. **CCTV-11 (서쪽 80m)**
   • 위치: 비산2동 골목
   • 신뢰도: 58%
   • 상태: 대기
   • 특징: 대체 도주 경로 가능성, 보조 모니터링

**모니터링 우선순위**
1순위: CCTV-7, CCTV-12, CCTV-15 (현재 추적 중)
2순위: CCTV-9 (예방적 모니터링)
3순위: CCTV-11 (보조 모니터링)

**권고사항**
현재 3개 CCTV가 활발히 추적 중이며, 추가 2개 CCTV를 예방적으로 모니터링하는 것을 권장합니다.`;
    } else {
      return `"${prompt}" 요청에 대해 ${title} 사건 기준으로 정보를 정리했습니다. 필요한 세부 데이터가 있다면 추가로 지시해주세요.`;
    }
  };

  const handleSendMessage = (messageText?: string) => {
    const text = (messageText ?? chatInput).trim();
    if (!text || isResponding) return;
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

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] overflow-hidden">
      <header className="flex h-16 items-center justify-between bg-[#1a1a1a] border-b border-[#2a2a2a] px-6" style={{ borderWidth: '1px' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-24 h-5 flex items-center justify-center">
              <img src="/logo.svg" alt="CUVIA Logo" className="h-5 w-auto object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:shield-alert" className="w-6 h-6 text-white" />
            <span className="text-xl font-semibold text-white">112 치안 · 방범 Agent</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/agent-hub" className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm">
            Agent Hub
          </Link>
          <Link href="/" className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm">
            대시보드
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - 사건 목록 */}
        <aside className="w-80 flex-shrink-0 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#2a2a2a] flex flex-col gap-3" style={{ borderWidth: '1px', height: '156px' }}>
            <div className="relative">
              <Icon icon="mdi:magnify" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Q 사건 ID, 키워드 검색..."
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                style={{ borderWidth: '1px' }}
              />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-1.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-xs hover:bg-[#2a2a2a] transition-colors" style={{ borderWidth: '1px' }}>
                사건유형
              </button>
              <button className="flex-1 px-3 py-1.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-xs hover:bg-[#2a2a2a] transition-colors" style={{ borderWidth: '1px' }}>
                위험도
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('URGENT')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedCategory === 'URGENT'
                    ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                    : 'bg-[#0f0f0f] border border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a]'
                }`}
                style={{ borderWidth: '1px' }}
              >
                긴급 ({urgentCount})
              </button>
              <button
                onClick={() => setSelectedCategory('ACTIVE')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedCategory === 'ACTIVE'
                    ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                    : 'bg-[#0f0f0f] border border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a]'
                }`}
                style={{ borderWidth: '1px' }}
              >
                진행중 ({activeCount})
              </button>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                    : 'bg-[#0f0f0f] border border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a]'
                }`}
                style={{ borderWidth: '1px' }}
              >
                전체 ({totalCount})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-3">
              <h3 className="text-white font-semibold text-sm mb-2">실시간 사건 목록</h3>
            </div>
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventSelect(event)}
                  className={`w-full text-left border rounded-lg p-3 transition-all ${
                    selectedEvent?.id === event.id
                      ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/30'
                      : 'bg-[#1f1f1f] border-[#2a2a2a] hover:bg-[#2a2a2a]'
                  }`}
                  style={{ borderWidth: '1px' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">{event.time}</span>
                      <span className="text-gray-500 text-xs font-mono">{event.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      event.pScore >= 80 ? 'bg-red-500/20 text-red-400' :
                      event.pScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      P{event.pScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      event.type === '폭행' ? 'bg-red-500/20 text-red-400' :
                      event.type === '절도' ? 'bg-yellow-500/20 text-yellow-400' :
                      event.type === '추격' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {event.type}
                    </span>
                    <span className="text-blue-400 text-xs">{domainLabels.A}</span>
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">{event.title}</div>
                  <div className="text-gray-400 text-xs mb-1">{event.location}</div>
                  <div className="text-gray-500 text-xs">{event.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a]" style={{ borderWidth: '1px' }}>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>오늘 처리 사건</span>
              <span className="text-white font-semibold">23건</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>평균 응답시간</span>
              <span className="text-white font-semibold">1분 45초</span>
            </div>
          </div>
        </aside>

        {/* Center Panel - 사건 상세 */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0f0f0f]">
          {selectedEvent ? (
            <>
              <div className="border-b border-[#2a2a2a] px-6 py-4 flex-shrink-0" style={{ borderWidth: '1px', height: '156px' }}>
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                          selectedEvent.type === '폭행'
                            ? 'bg-red-500/20 text-red-400'
                            : selectedEvent.type === '절도'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {selectedEvent.type}
                      </span>
                      <span className="px-3 py-1 bg-white/10 text-white rounded-lg text-sm font-semibold">{selectedEvent.risk}</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold mb-2">{selectedEvent.title}</h1>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <span>◎ {selectedEvent.location}</span>
                      <span>{selectedEvent.time}</span>
                      <span>{selectedEvent.source}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                    112 신고 접수 - 성인 남성 2명 간 폭행 발생. CCTV AI도 동시 감지하여 고신뢰도 사건으로 분류.
                  </p>
                </div>
              </div>

              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* AI Chat Blocks */}
                <div className="space-y-4">
                  {chatBlocks.map((block) => (
                    <div key={block.title} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4" style={{ borderWidth: '1px' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon={block.icon} className="w-4 h-4 text-blue-300" />
                        <h4 className="text-white font-semibold text-sm">{block.title}</h4>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{block.content}</p>
                    </div>
                  ))}
                </div>

                {/* CCTV 추천 */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4" style={{ borderWidth: '1px' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="mdi:cctv" className="w-4 h-4 text-blue-300" />
                    <h4 className="text-white font-semibold text-sm">CCTV 추천</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['CCTV-7 (현장)', 'CCTV-12 (북쪽 50m)', 'CCTV-15 (골목길)'].map((cctv) => (
                      <button
                        key={cctv}
                        onClick={() => {
                          setSelectedCCTV(cctv);
                          setShowCCTVPopup(true);
                        }}
                        className="px-3 py-1.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm hover:border-blue-500/50 transition-colors"
                        style={{ borderWidth: '1px' }}
                      >
                        {cctv}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 저장된 클립 목록 */}
                {savedClips.length > 0 && (
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4" style={{ borderWidth: '1px' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:video-box" className="w-4 h-4 text-green-300" />
                        <h4 className="text-white font-semibold text-sm">저장된 클립 ({savedClips.length})</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                        전파 준비 완료
                      </span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {savedClips.map((clip) => (
                        <div
                          key={clip.id}
                          className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3 hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                          style={{ borderWidth: '1px' }}
                          onClick={() => {
                            setSelectedCCTV(Object.keys(cctvInfo).find((key) => cctvInfo[key].id === clip.cctvId) || null);
                            setShowCCTVPopup(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Icon icon="mdi:play-circle" className="w-4 h-4 text-blue-400" />
                              <span className="text-white text-sm font-semibold">{clip.cctvId}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                              전파 준비
                            </span>
                          </div>
                          <div className="text-gray-400 text-xs mb-1">{clip.cctvName}</div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{clip.timestamp}</span>
                            <span className="flex items-center gap-1">
                              <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                              {clip.duration}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-px bg-[#1f1f1f]"></div>

                {/* 대화 로그 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] flex items-center justify-center text-white">
                      <Icon icon="mdi:sparkles" className="w-4 h-4" />
                    </div>
                    <span>112 Agent</span>
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
                                : 'bg-[#0f0f0f] text-gray-200 border-[#2a2a2a]'
                            }`}
                            style={{ borderWidth: '1px' }}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
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
                                className="px-3 py-1.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm hover:border-blue-500/50 transition-colors"
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
                      <div className="flex items-center gap-1 text-xs text-gray-400">
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
              <div className="border-t border-[#2a2a2a] bg-[#1a1a1a] p-4 sticky bottom-0 left-0 right-0" style={{ borderWidth: '1px' }}>
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickCommands.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => handleSendMessage(cmd)}
                      className="px-3 py-1.5 rounded-full text-xs text-gray-300 transition-colors"
                      style={{
                        borderWidth: '1px',
                        borderColor: '#7C62F099',
                        backgroundColor: '#7C62F01A',
                      }}
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
                    className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-full px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    style={{ borderWidth: '1px' }}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isResponding}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      isResponding ? 'bg-blue-900 text-blue-200 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    전송
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              사건을 선택하세요
            </div>
          )}
        </main>

        {/* Right Panel - CCTV & 인물 분석 */}
        <aside className="w-80 flex-shrink-0 bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col overflow-y-auto" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
            <h3 className="text-white font-semibold text-sm">CCTV 모니터링</h3>
          </div>
          <div className="p-4 space-y-4">
            {/* CCTV-7 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold text-sm">CCTV-7</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">활성</span>
              </div>
              <div className="text-gray-400 text-xs mb-2">현장</div>
              <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg aspect-video flex items-center justify-center" style={{ borderWidth: '1px' }}>
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
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">추적중</span>
              </div>
              <div className="text-gray-400 text-xs mb-2">북쪽 50m</div>
              <div className="bg-[#0f0f0f] border-2 border-yellow-500/50 rounded-lg aspect-video flex items-center justify-center" style={{ borderWidth: '2px' }}>
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
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">추적중</span>
              </div>
              <div className="text-gray-400 text-xs mb-2">골목길</div>
              <div className="bg-[#0f0f0f] border-2 border-yellow-500/50 rounded-lg aspect-video flex items-center justify-center" style={{ borderWidth: '2px' }}>
                <div className="text-center">
                  <Icon icon="mdi:cctv" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">연결 중...</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#2a2a2a] space-y-4" style={{ borderWidth: '1px' }}>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-3" style={{ borderWidth: '1px' }}>
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

            <div className="bg-[#2a1313] border border-red-500/40 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-red-300 font-semibold">
                <Icon icon="mdi:alert" className="w-4 h-4" />
                행동 요약
              </div>
              <ul className="text-sm text-red-100 space-y-1">
                {behaviorHighlights.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-4" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-2 text-sm text-white font-semibold">
                <Icon icon="mdi:map-marker" className="w-4 h-4 text-green-300" />
                위치 및 동선
              </div>
              <div
                className="relative h-48 rounded-lg border border-[#2a2a2a] overflow-hidden"
                style={{
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

            <div className="bg-[#0f1f14] border border-green-500/40 rounded-lg p-4" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-2 text-sm text-green-300 font-semibold mb-2">
                <Icon icon="mdi:route" className="w-4 h-4" />
                출동 경로 추천
              </div>
              <p className="text-gray-200 text-sm">{routeRecommendation}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* CCTV 팝업 - 미디어 플레이어 */}
      {showCCTVPopup && selectedCCTV && cctvInfo[selectedCCTV] && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => {
            setShowCCTVPopup(false);
            setSelectedCCTV(null);
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        >
          <div
            className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
            style={{ borderWidth: '1px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    REC
                  </button>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">CCTV 빠른 보기</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCCTVPopup(false);
                  setSelectedCCTV(null);
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Icon icon="mdi:close" className="w-6 h-6" />
              </button>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 flex overflow-hidden">
              {/* 왼쪽: CCTV 영상 */}
              <div className="flex-1 bg-black relative">
                {/* CCTV 정보 */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="text-white font-semibold text-lg">{cctvInfo[selectedCCTV].id}</div>
                  <div className="text-gray-300 text-sm">{cctvInfo[selectedCCTV].name}</div>
                </div>

                {/* 배회 감지 오버레이 */}
                <div className="absolute top-20 left-20 z-10">
                  <div className="bg-yellow-500/90 text-black px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <span>배회 감지 87%</span>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-yellow-500/90"></div>
                  </div>
                  <div className="h-32 w-0.5 bg-yellow-500/50 ml-3"></div>
                </div>

                {/* 영상 영역 */}
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-400 text-sm mb-1">CCTV {cctvInfo[selectedCCTV].id.toLowerCase()} 연결 중...</p>
                    <p className="text-gray-500 text-xs">실시간 스트리밍</p>
                  </div>
                </div>

                {/* 타임스탬프 */}
                <div className="absolute bottom-4 left-4 text-white text-sm font-mono">
                  {new Date().toISOString().slice(0, 19).replace('T', ' ')}
                </div>
              </div>

              {/* 오른쪽: 컨트롤 패널 */}
              <div className="w-80 bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col" style={{ borderWidth: '1px' }}>
                <div className="p-4 border-b border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
                  <h4 className="text-white font-semibold text-sm mb-4">CCTV 빠른 보기</h4>
                  
                  {/* 미디어 컨트롤 */}
                  <div className="space-y-3">
                    {/* 재생 컨트롤 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                        className="p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors"
                        style={{ borderWidth: '1px' }}
                      >
                        <Icon icon="mdi:skip-backward" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex-1 p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors flex items-center justify-center"
                        style={{ borderWidth: '1px' }}
                      >
                        <Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                        className="p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors"
                        style={{ borderWidth: '1px' }}
                      >
                        <Icon icon="mdi:skip-forward" className="w-5 h-5" />
                      </button>
                    </div>

                    {/* 타임라인 */}
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

                {/* 감지 이벤트 */}
                <div className="flex-1 p-4 space-y-3">
                  <h4 className="text-white font-semibold text-sm mb-3">감지 이벤트</h4>
                  <div className="space-y-2">
                    <button
                      className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
                      style={{ borderWidth: '1px' }}
                    >
                      <Icon icon="mdi:target" className="w-4 h-4" />
                      추적 모드 활성화
                    </button>
                    <button
                      onClick={() => {
                        const clipId = `clip-${Date.now()}`;
                        const clip = {
                          id: clipId,
                          cctvId: cctvInfo[selectedCCTV].id,
                          cctvName: cctvInfo[selectedCCTV].name,
                          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
                          duration: `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')} - ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`,
                          status: 'ready' as const,
                        };
                        setSavedClips((prev) => [...prev, clip]);
                        alert(`${cctvInfo[selectedCCTV].id} 클립 저장 완료. 전파 준비됨.`);
                      }}
                      className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
                      style={{ borderWidth: '1px' }}
                    >
                      <Icon icon="mdi:content-save" className="w-4 h-4" />
                      클립 저장
                      <Icon icon="mdi:help-circle-outline" className="w-4 h-4 text-gray-400 ml-auto" />
                    </button>
                  </div>

                  {/* 저장된 클립 목록 */}
                  {savedClips.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
                      <h4 className="text-white font-semibold text-sm mb-3">저장된 클립 ({savedClips.length})</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {savedClips
                          .filter((clip) => clip.cctvId === cctvInfo[selectedCCTV].id)
                          .map((clip) => (
                            <div
                              key={clip.id}
                              className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3"
                              style={{ borderWidth: '1px' }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white text-xs font-semibold">{clip.cctvId}</span>
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                  전파 준비
                                </span>
                              </div>
                              <div className="text-gray-400 text-xs mb-1">{clip.cctvName}</div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{clip.timestamp}</span>
                                <span>{clip.duration}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
