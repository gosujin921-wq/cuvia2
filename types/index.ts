export type EventPriority = 'High' | 'Medium' | 'Low';
export type EventStatus = 'NEW' | 'MONITORING' | 'RESOLVED' | 'EVIDENCE';
export type EventType = '119-화재' | '112-미아' | '약자' | 'AI-배회' | 'NDMS' | '소방서';

export interface Event {
  id: string;
  eventId?: string; // 이벤트 ID: [도메인]-[연도월일]-[시퀀스]
  type: EventType;
  title: string;
  priority: EventPriority;
  status: EventStatus;
  timestamp: string;
  location: {
    name: string;
    coordinates: [number, number];
  };
  confidence?: number;
  description?: string;
  relatedEvents?: string[];
  isMain?: boolean;
  evidenceEvents?: string[];
  nearbyResources?: {
    fireStations?: Array<{
      id: string;
      name: string;
      distance: number;
      coordinates: [number, number];
    }>;
  };
}

export interface AgentMessage {
  id: string;
  timestamp: string;
  content: string;
  type: 'info' | 'warning' | 'suggestion' | 'analysis';
}

export interface EventSummary {
  total: number;
  inProgress: number;
  high: number;
  overlapped: number;
}

export interface BroadcastDraft {
  id: string;
  eventId: string;
  type: 'fire' | 'missing' | 'elderly';
  content: string;
  recipients: string[];
  status: 'draft' | 'sent';
}
