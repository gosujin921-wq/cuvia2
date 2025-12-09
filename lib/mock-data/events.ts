// 가상 이벤트 데이터 전용 설정
const today = '20241124'; // 2024년 11월 24일
let sequence = 1;

const generateEventId = (domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'): string => {
  return `${domain}-${today}-${String(sequence++).padStart(3, '0')}`;
};

// events-data에서 사용하는 BaseEvent 구조를 이 파일에서도 그대로 정의
interface BaseEvent {
  eventId: string;
  id: string;
  type: string;
  title: string;
  time: string;
  location: string;
  description?: string;
  source?: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'URGENT' | 'ACTIVE' | 'NEW' | 'IN_PROGRESS' | 'CLOSED';
  pScore?: number;
  domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

// 기존 allEvents 배열을 그대로 옮긴 가상 이벤트 데이터
export const MOCK_EVENTS: BaseEvent[] = [
  // A - 112 치안 · 방범
  {
    eventId: generateEventId('A'),
    id: 'event-1',
    type: '폭행 · 상해',
    title: '흉기 소지 남성 위협 행동',
    time: '18:42',
    location: '안양시 동안구 비산동 123-7',
    description: '112 신고자 "흉기 든 남성이 위협 중"',
    source: '안양112센터',
    risk: 'HIGH',
    status: 'URGENT',
    pScore: 92,
    domain: 'A',
  },
  {
    eventId: generateEventId('A'),
    id: 'event-2',
    type: '절도 · 강도',
    title: '상가 절도 의심, 현금 절취 포착',
    time: '18:33',
    location: '안양시 만안구 안양동 674',
    description: 'AI 감지: 가방에서 현금 다발을 넣는 장면 포착',
    source: 'AI',
    risk: 'MEDIUM',
    status: 'ACTIVE',
    pScore: 78,
    domain: 'A',
  },
  {
    eventId: generateEventId('A'),
    id: 'event-3',
    type: '차량도주 · 용의차량 추적',
    title: '오토바이 도주, 은행 강도 연관 의심',
    time: '18:21',
    location: '안양시 동안구 평촌대로 456',
    description: '도주 오토바이, 은행 강도와 연관 가능성',
    source: '안양112센터',
    risk: 'HIGH',
    status: 'ACTIVE',
    pScore: 85,
    domain: 'A',
  },
];


