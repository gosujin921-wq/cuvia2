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
  { 
    time: '00:10:15', 
    title: '폭행 발생', 
    subtitle: '평촌대로 사거리',
    cctvName: 'CCTV-7',
    color: 'text-yellow-400',
    cctvId: 'CCTV-7'
  },
  { 
    time: '00:12:34', 
    title: '차량 도주', 
    subtitle: '비산동 주택가',
    cctvName: 'CCTV-12',
    color: 'text-blue-400',
    cctvId: 'CCTV-12'
  },
  { 
    time: '00:13:02', 
    title: '급차선 변경', 
    subtitle: '안양중앙시장 입구',
    cctvName: 'CCTV-15',
    color: 'text-blue-400',
    cctvId: 'CCTV-15'
  },
  { 
    time: '00:13:15', 
    title: '신호 위반', 
    subtitle: '관양동 교차로',
    cctvName: 'CCTV-3',
    color: 'text-blue-400',
    cctvId: 'CCTV-3'
  },
  { 
    time: '00:13:30', 
    title: '용의자 추적 중', 
    subtitle: '반경 200m 내',
    cctvName: null,
    color: 'text-red-400',
    cctvId: null
  },
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
  'CCTV-3 (남쪽 120m)': {
    id: 'CCTV-3',
    name: '관양동 교차로',
    location: '남쪽 120m',
    status: '추적중',
    confidence: 72,
  },
  'CCTV-5 (북동쪽 150m)': {
    id: 'CCTV-5',
    name: '호계동 상가',
    location: '북동쪽 150m',
    status: '추적중',
    confidence: 81,
  },
  'CCTV-8 (서남쪽 90m)': {
    id: 'CCTV-8',
    name: '인덕동 주택가',
    location: '서남쪽 90m',
    status: '대기',
    confidence: 67,
  },
  'CCTV-13 (동남쪽 110m)': {
    id: 'CCTV-13',
    name: '범계동 상권',
    location: '동남쪽 110m',
    status: '추적중',
    confidence: 75,
  },
  'CCTV-16 (북서쪽 130m)': {
    id: 'CCTV-16',
    name: '동안동 골목',
    location: '북서쪽 130m',
    status: '대기',
    confidence: 69,
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

// CCTV 위/경도 정보
export const cctvCoordinatesMap: Record<string, { latitude: string; longitude: string }> = {
  'CCTV-7': { latitude: '37.3925', longitude: '126.9567' },
  'CCTV-12': { latitude: '37.3930', longitude: '126.9570' },
  'CCTV-15': { latitude: '37.3920', longitude: '126.9560' },
  'CCTV-9': { latitude: '37.3935', longitude: '126.9575' },
  'CCTV-11': { latitude: '37.3928', longitude: '126.9565' },
  'CCTV-3': { latitude: '37.3922', longitude: '126.9562' },
  'CCTV-5': { latitude: '37.3932', longitude: '126.9572' },
  'CCTV-8': { latitude: '37.3927', longitude: '126.9567' },
  'CCTV-13': { latitude: '37.3930', longitude: '126.9568' },
  'CCTV-16': { latitude: '37.3925', longitude: '126.9570' },
  'CCTV-17': { latitude: '37.3926', longitude: '126.9571' },
  'CCTV-18': { latitude: '37.3927', longitude: '126.9572' },
  'CCTV-19': { latitude: '37.3928', longitude: '126.9573' },
  'CCTV-20': { latitude: '37.3929', longitude: '126.9574' },
};

// 포착된 CCTV 썸네일 데이터 (CCTV에서 감지되어 판단된 기준)
// 접수시간 직전이 처음 포착된 시간, 최신순으로 정렬
export const detectedCCTVThumbnails = [
  {
    id: 'detected-1',
    cctvId: 'CCTV-7',
    cctvName: 'CCTV-7',
    thumbnail: '/cctv_img/001.jpg',
    timestamp: '14:29:45',
    confidence: 96,
    description: '폭행 발생 감지',
    location: '평촌대로 사거리',
    aiAnalysis: '폭행 행위 명확히 확인, 피해자와 가해자 구분 가능',
    suspectReason: '검은색 후드티, 청바지 착용 남성이 주먹과 발차기로 공격하는 장면 포착',
    situation: '폭행 발생 후 가해자가 현장에서 즉시 도주',
  },
  {
    id: 'detected-2',
    cctvId: 'CCTV-12',
    cctvName: 'CCTV-12',
    thumbnail: '/cctv_img/002.jpg',
    timestamp: '14:27:30',
    confidence: 88,
    description: '용의자 포착',
    location: '비산동 주택가',
    aiAnalysis: '의복 일치, 체형 유사도 높음',
    suspectReason: 'CCTV-7에서 포착된 가해자와 동일한 의복 및 체형 특징 확인',
    situation: '북쪽 방향으로 빠르게 이동 중, 도주 경로로 판단',
  },
  {
    id: 'detected-3',
    cctvId: 'CCTV-15',
    cctvName: 'CCTV-15',
    thumbnail: '/cctv_img/003.jpg',
    timestamp: '14:25:15',
    confidence: 73,
    description: '도주 경로 확인',
    location: '안양중앙시장 입구',
    aiAnalysis: '급격한 방향 전환, 의심스러운 행동 패턴',
    suspectReason: '도주 중인 용의자와 유사한 외형, 급하게 골목길로 진입',
    situation: '골목길 진입 후 시야에서 벗어남',
  },
  {
    id: 'detected-4',
    cctvId: 'CCTV-9',
    cctvName: 'CCTV-9',
    thumbnail: '/cctv_img/004.jpg',
    timestamp: '14:23:58',
    confidence: 65,
    description: '용의자 추정 차량 포착',
    location: '평촌동 주거지',
    aiAnalysis: '의심 차량 감지, 탑승자 외형 일치',
    suspectReason: '용의자와 유사한 외형의 인물이 승용차에 탑승하여 이동',
    situation: '차량을 이용한 도주로 추정, 차량 번호 일부 확인',
  },
  {
    id: 'detected-5',
    cctvId: 'CCTV-11',
    cctvName: 'CCTV-11',
    thumbnail: '/cctv_img/005.jpg',
    timestamp: '14:22:42',
    confidence: 58,
    description: '의심 행동 감지',
    location: '비산2동 골목',
    aiAnalysis: '도주 경로상 위치, 행동 패턴 일치',
    suspectReason: '도주 경로상 위치에서 의심스러운 행동 포착',
    situation: '서쪽 방향으로 이동 중',
  },
  {
    id: 'detected-6',
    cctvId: 'CCTV-3',
    cctvName: 'CCTV-3',
    thumbnail: '/cctv_img/001.jpg',
    timestamp: '14:21:25',
    confidence: 72,
    description: '도주 경로 추정',
    location: '관양동 교차로',
    aiAnalysis: '신호 위반, 급가속 행동',
    suspectReason: '신호 위반 및 급가속으로 도주 중인 것으로 판단',
    situation: '교차로에서 신호 위반 후 남쪽 방향으로 급가속',
  },
  {
    id: 'detected-7',
    cctvId: 'CCTV-5',
    cctvName: 'CCTV-5',
    thumbnail: '/cctv_img/002.jpg',
    timestamp: '14:20:08',
    confidence: 81,
    description: '용의자 확인',
    location: '호계동 상가',
    aiAnalysis: '의복 및 체형 일치도 높음',
    suspectReason: 'CCTV-7 가해자와 의복, 체형, 행동 패턴 일치',
    situation: '북동쪽 방향으로 이동 중',
  },
  {
    id: 'detected-8',
    cctvId: 'CCTV-8',
    cctvName: 'CCTV-8 (서남쪽 90m)',
    thumbnail: '/cctv_img/003.jpg',
    timestamp: '14:18:52',
    confidence: 67,
    description: '추적 중',
    location: '인덕동 주택가',
  },
  {
    id: 'detected-9',
    cctvId: 'CCTV-13',
    cctvName: 'CCTV-13 (동남쪽 110m)',
    thumbnail: '/cctv_img/004.jpg',
    timestamp: '14:17:35',
    confidence: 75,
    description: '용의자 포착',
    location: '범계동 상권',
  },
  {
    id: 'detected-10',
    cctvId: 'CCTV-16',
    cctvName: 'CCTV-16 (북서쪽 130m)',
    thumbnail: '/cctv_img/005.jpg',
    timestamp: '14:16:20',
    confidence: 69,
    description: '도주 경로 확인',
    location: '동안동 골목',
  },
];

// CCTV 위치 그룹 정보 - 같은 위치에 여러 CCTV가 있을 수 있음
export const cctvLocationGroups: Record<string, { position: { left: number; top: number }; cctvs: string[] }> = {
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


