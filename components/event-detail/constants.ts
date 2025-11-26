import { RiskLevel } from './types';

export const riskLevelMeta: Record<RiskLevel, { icon: string; color: string }> = {
  strong: { icon: 'mdi:alert', color: 'text-red-400' },
  high: { icon: 'mdi:alert', color: 'text-orange-400' },
  medium: { icon: 'mdi:alert', color: 'text-yellow-400' },
  low: { icon: 'mdi:alert', color: 'text-yellow-300' },
};

export const chatBlocks = [
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

export const quickCommands = [
  '이 사건 분석해줘',
  '용의자 특징 알려줘',
  '추적 경로 보여줘',
  '전파문 초안 작성해줘',
  '위험도 재계산해줘',
  '유사 사건 찾아줘',
];

export const behaviorHighlights = [
  '폭행 지속: 약 2분 15초',
  '공격 유형: 주먹, 발차기',
  '도주 방향: 북쪽 골목길',
  '현재 상태: 추적 중',
];

export const movementTimeline = [
  { time: '00:10:15', label: 'CCTV-7 현장', desc: '폭행 발생', color: 'text-blue-400' },
  { time: '00:12:34', label: 'CCTV-12 포착', desc: '북쪽으로 이동 (50m)', color: 'text-yellow-400' },
  { time: '00:13:02', label: 'CCTV-15 포착', desc: '골목길 진입', color: 'text-yellow-400' },
  { time: '00:13:30', label: '추적 위치', desc: '반경 200m 내', color: 'text-green-400' },
];

export const routeRecommendation = '최단 출동 경로: 중앙로 → 골목길 입구 (ETA 3분)';

export const cctvInfo: Record<string, { id: string; name: string; location: string; status: string; confidence: number }> = {
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

export const cctvThumbnailMap: Record<string, string> = {
  'CCTV-7': '/cctv_img/001.jpg',
  'CCTV-12': '/cctv_img/002.jpg',
  'CCTV-15': '/cctv_img/003.jpg',
  'CCTV-9': '/cctv_img/004.jpg',
  'CCTV-11': '/cctv_img/005.jpg',
};

export const cctvFovMap: Record<string, string> = {
  'CCTV-7': '110°',
  'CCTV-12': '95°',
  'CCTV-15': '120°',
  'CCTV-9': '100°',
  'CCTV-11': '105°',
};


