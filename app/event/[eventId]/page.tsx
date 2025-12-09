'use client';

import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Icon } from '@iconify/react';
import { useParams } from 'next/navigation';
import { getEventById, generateAIInsight, domainLabels, convertToDashboardEvent, formatEventDateTime } from '@/lib/events-data';
import { EventLeftPanel } from '@/components/event-detail/EventLeftPanel';
import { EventCenterPanel } from '@/components/event-detail/EventCenterPanel';
import { EventCenterColumn1 } from '@/components/event-detail/EventCenterColumn1';
import { EventCenterColumn2 } from '@/components/event-detail/EventCenterColumn2';
import { EventCenterColumn2Test } from '@/components/event-detail/EventCenterColumn2Test';
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
  const [showDetectedCCTVPopup, setShowDetectedCCTVPopup] = useState(false);
  const [selectedDetectedCCTV, setSelectedDetectedCCTV] = useState<string | null>(null);
  const [isClipPlaying, setIsClipPlaying] = useState(false);
  const [clipCurrentTime, setClipCurrentTime] = useState(0);
  const [clipDuration, setClipDuration] = useState(30);

  // 시간 포맷 함수
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 클립 재생 초기화
  useEffect(() => {
    if (showDetectedCCTVPopup && selectedDetectedCCTV) {
      setClipDuration(30); // 실제로는 비디오 메타데이터에서 가져와야 함
      setClipCurrentTime(0);
      setIsClipPlaying(false);
    }
  }, [showDetectedCCTVPopup, selectedDetectedCCTV]);

  // 재생 중 시간 업데이트
  useEffect(() => {
    if (!isClipPlaying) return;

    const interval = setInterval(() => {
      setClipCurrentTime((prev) => {
        if (prev >= clipDuration) {
          setIsClipPlaying(false);
          return clipDuration;
        }
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isClipPlaying, clipDuration]);
  const [showMapCCTVPopup, setShowMapCCTVPopup] = useState(false);
  const [selectedMapCCTV, setSelectedMapCCTV] = useState<string | null>(null);
  const [cctvClusterList, setCctvClusterList] = useState<string[]>([]);
  const [currentCctvIndex, setCurrentCctvIndex] = useState(0);

  // CCTV 위치 그룹 정보 - 같은 위치에 여러 CCTV가 있을 수 있음
  const cctvLocationGroups: Record<string, { position: { left: number; top: number }; cctvs: string[] }> = useMemo(() => ({
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
  }), []);

  // CCTV ID로 같은 위치의 CCTV 목록 가져오기
  const getCCTVsAtSameLocation = (cctvId: string): string[] => {
    for (const group of Object.values(cctvLocationGroups)) {
      if (group.cctvs.includes(cctvId)) {
        return group.cctvs;
      }
    }
    return [cctvId];
  };

  const currentCluster = useMemo(() => {
    if (!selectedMapCCTV) return [];
    return getCCTVsAtSameLocation(selectedMapCCTV);
  }, [selectedMapCCTV, cctvLocationGroups]);

  const currentIndex = useMemo(() => {
    if (!selectedMapCCTV) return 0;
    return currentCluster.indexOf(selectedMapCCTV);
  }, [selectedMapCCTV, currentCluster]);

  const hasMultiple = currentCluster.length > 1;

  const handlePrevCCTV = () => {
    if (!selectedMapCCTV || !hasMultiple) return;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentCluster.length - 1;
    setSelectedMapCCTV(currentCluster[prevIndex]);
    setCurrentCctvIndex(prevIndex);
  };

  const handleNextCCTV = () => {
    if (!selectedMapCCTV || !hasMultiple) return;
    const nextIndex = currentIndex < currentCluster.length - 1 ? currentIndex + 1 : 0;
    setSelectedMapCCTV(currentCluster[nextIndex]);
    setCurrentCctvIndex(nextIndex);
  };

  // PTZ 제어 핸들러
  const handlePTZUp = () => {
    console.log('PTZ: 위로 이동');
    // TODO: 실제 PTZ 제어 API 호출
  };

  const handlePTZDown = () => {
    console.log('PTZ: 아래로 이동');
    // TODO: 실제 PTZ 제어 API 호출
  };

  const handlePTZLeft = () => {
    console.log('PTZ: 왼쪽으로 이동');
    // TODO: 실제 PTZ 제어 API 호출
  };

  const handlePTZRight = () => {
    console.log('PTZ: 오른쪽으로 이동');
    // TODO: 실제 PTZ 제어 API 호출
  };

  const handlePTZCenter = () => {
    console.log('PTZ: 중앙');
    // TODO: 실제 PTZ 제어 API 호출
  };

  const handleZoomIn = () => {
    console.log('PTZ: 줌 인');
    // TODO: 실제 PTZ 제어 API 호출
  };

  const handleZoomOut = () => {
    console.log('PTZ: 줌 아웃');
    // TODO: 실제 PTZ 제어 API 호출
  };

  const handlePreset = (preset: number) => {
    console.log(`PTZ: 프리셋 ${preset}`);
    // TODO: 실제 PTZ 제어 API 호출
  };

  // PTZ 키보드 pressed 상태
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    if (!showMapCCTVPopup) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
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
  }, [showMapCCTVPopup]);
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
  const [cctvSectionHeight, setCctvSectionHeight] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);

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

  // 드래그 핸들러
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    const container = document.querySelector('[data-section-container]') as HTMLElement;
    if (container) {
      // 현재 높이를 px로 계산 (cctvSectionHeight가 %인 경우)
      const currentHeightPercent = cctvSectionHeight !== null 
        ? cctvSectionHeight 
        : 50;
      const currentHeightPx = (container.offsetHeight * currentHeightPercent) / 100;
      setDragStartHeight(currentHeightPx);
    }
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = e.clientY - dragStartY;
      const container = document.querySelector('[data-section-container]') as HTMLElement;
      if (!container) return;
      
      const containerHeight = container.offsetHeight;
      const newHeightPx = Math.max(200, Math.min(containerHeight - 200, dragStartHeight + deltaY));
      // px를 %로 변환하여 저장
      const newHeightPercent = (newHeightPx / containerHeight) * 100;
      setCctvSectionHeight(newHeightPercent);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStartY, dragStartHeight]);

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
        className="flex flex-col"
        style={{
          width: '125%',
          height: '125vh',
          minHeight: '125vh',
          transform: 'scale(0.8)',
          transformOrigin: 'top left',
        }}
      >
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0, height: '100%' }}>
        <div className="flex flex-1 overflow-hidden relative" style={{ minHeight: 0, height: '100%' }}>
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
        <main className="flex-1 bg-[#161719] flex flex-col overflow-hidden border-l border-r border-[#31353a]" style={{ borderLeftWidth: '1px', borderRightWidth: '1px', borderTopWidth: '0', borderBottomWidth: '0', minHeight: 0, width: '100%', height: '100%', alignSelf: 'stretch' }}>
          <div className="flex-1 overflow-hidden pl-7" style={{ minHeight: 0 }}>
            <div className="flex gap-6" style={{ minHeight: 0, width: '100%', height: '100%' }}>
              {/* 1열: 위치 및 동선 - 우측 패널이 펼쳐졌을 때 더 넓게 */}
              <EventCenterColumn1
                isRightPanelCollapsed={isRightPanelCollapsed}
                showCCTV={showCCTV}
                setShowCCTV={setShowCCTV}
                showCCTVViewAngle={showCCTVViewAngle}
                setShowCCTVViewAngle={setShowCCTVViewAngle}
                showCCTVName={showCCTVName}
                setShowCCTVName={setShowCCTVName}
                selectedMapCCTV={selectedMapCCTV}
                setSelectedMapCCTV={setSelectedMapCCTV}
                setShowMapCCTVPopup={setShowMapCCTVPopup}
                setShowDetectedCCTVPopup={setShowDetectedCCTVPopup}
                setSelectedDetectedCCTV={setSelectedDetectedCCTV}
                movementTimeline={movementTimeline}
              />

              {/* 2열: CCTV, 인물 분석, 행동 요약 */}
              <EventCenterColumn2Test
                isRightPanelCollapsed={isRightPanelCollapsed}
                cctvSectionHeight={cctvSectionHeight}
                handleDragStart={handleDragStart}
                monitoringCCTVs={monitoringCCTVs}
                handleRemoveFromMonitoring={handleRemoveFromMonitoring}
                setSelectedCCTV={setSelectedCCTV}
                setShowCCTVPopup={setShowCCTVPopup}
                setSelectedDetectedCCTV={setSelectedDetectedCCTV}
                setShowDetectedCCTVPopup={setShowDetectedCCTVPopup}
                detectedCCTVThumbnails={detectedCCTVThumbnails}
                showMapCCTVPopup={showMapCCTVPopup}
                cctvInfo={cctvInfo}
                cctvThumbnailMap={cctvThumbnailMap}
                behaviorHighlights={behaviorHighlights}
              />
            </div>
          </div>
        </main>
        </div>

        {/* Right Panel - AI Agent (채팅) */}
        <aside className={`bg-white border-l border-[#31353a] flex flex-col overflow-hidden relative transition-all duration-300 flex-shrink-0 ${isRightPanelCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-[30rem] opacity-100'}`} style={{ borderLeftWidth: isRightPanelCollapsed ? '0' : '1px', borderTopWidth: '0', borderBottomWidth: '0', minHeight: 0, height: '100%', alignSelf: 'stretch' }}>
          {!isRightPanelCollapsed && (
            <>
              {/* 우측 패널 토글 버튼 */}
              <button
                onClick={() => setIsRightPanelCollapsed(true)}
                className="absolute top-1/2 -translate-y-1/2 -left-2 w-8 h-14 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors focus:outline-none z-50 bg-[#161719] border border-[#31353a] rounded"
                style={{ borderWidth: '1px' }}
                aria-label="우측 패널 접기"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
              </button>
              <div className="flex-1 overflow-y-auto">
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
              </div>
            </>
          )}
        </aside>

        {/* 우측 패널 접힘 시 플로팅 버튼 */}
        {isRightPanelCollapsed && (
          <button
            onClick={() => setIsRightPanelCollapsed(false)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50"
            aria-label="우측 패널 펼치기"
          >
            <Icon icon="mdi:sparkles" className="w-6 h-6" />
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

      {/* 포착된 CCTV 상세 모달 */}
      {showDetectedCCTVPopup && selectedDetectedCCTV && (() => {
        const detected = detectedCCTVThumbnails.find(d => d.cctvId === selectedDetectedCCTV);
        if (!detected) return null;
        
        return (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
            onClick={() => {
              setShowDetectedCCTVPopup(false);
              setSelectedDetectedCCTV(null);
            }}
          >
            <div
              className="bg-[#101013] border border-[#31353a] w-full max-w-6xl max-h-[90vh] flex flex-col shadow-lg"
              style={{ transform: 'scale(0.8)', transformOrigin: 'center center' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-[#31353a] flex-shrink-0">
                <div className="flex items-center gap-2 text-base font-semibold text-white">
                  <Icon icon="mdi:video-stabilization" className="w-5 h-5 text-purple-400" />
                  포착된 CCTV 클립
                </div>
                <button
                  onClick={() => {
                    setShowDetectedCCTVPopup(false);
                    setSelectedDetectedCCTV(null);
                  }}
                  className="text-gray-400 hover:text-white focus:outline-none transition-colors"
                  aria-label="모달 닫기"
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>

              {/* 메인 콘텐츠 영역 */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* 왼쪽: CCTV 영상 */}
                <div className="flex-1 bg-black flex flex-col">
                  <div className="p-4 pb-3">
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
                      <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/70 rounded text-white text-xs font-semibold">
                        {detected.timestamp}
                      </div>
                      <div className="absolute top-3 right-3 px-3 py-1.5 bg-purple-600/80 rounded text-white text-xs font-semibold">
                        신뢰도 {detected.confidence}%
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                      <span>{detected.timestamp}</span>
                      <span className="text-purple-400 font-semibold">클립</span>
                    </div>
                  </div>
                </div>

                {/* 오른쪽: CCTV 정보 + 제어 */}
                <div className="w-[400px] bg-[#0f0f0f] border-l border-[#31353a] flex flex-col overflow-hidden">
                  {/* CCTV 정보 */}
                  <div className="p-6 border-b border-[#31353a] flex-shrink-0">
                    <div className="text-white font-semibold text-sm mb-4">CCTV 정보</div>
                    <div className="space-y-3">
                      {(() => {
                        const cctvKey = Object.keys(cctvInfo).find(key => cctvInfo[key].id === detected.cctvId);
                        const cctv = cctvKey ? cctvInfo[cctvKey] : null;
                        const fov = cctvFovMap[detected.cctvId] || '95°';
                        
                        // 방향 계산 (예시: location에서 추출)
                        const getDirection = (location: string) => {
                          if (location.includes('북동')) return '북동 45°';
                          if (location.includes('북서')) return '북서 315°';
                          if (location.includes('동남')) return '동남 135°';
                          if (location.includes('서남')) return '서남 225°';
                          if (location.includes('북')) return '북 0°';
                          if (location.includes('동')) return '동 90°';
                          if (location.includes('남')) return '남 180°';
                          if (location.includes('서')) return '서 270°';
                          return '알 수 없음';
                        };
                        
                        // 군집 정보 (예시)
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
                        
                        // 최근 포착 정보 (movementTimeline에서)
                        const getRecentCaptures = (cctvId: string) => {
                          const captures = movementTimeline
                            .filter(item => item.cctvId === cctvId)
                            .map(item => {
                              const time = item.time.split(':').slice(1).join(':');
                              return `${time} ${item.title}`;
                            });
                          return captures.length > 0 ? captures.join(' / ') : '없음';
                        };
                        
                        return (
                          <>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">CCTV</div>
                              <div className="text-white font-semibold text-sm">
                                {detected.cctvId}  (PTZ / 화각 {fov})
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">지점</div>
                              <div className="text-gray-300 text-sm">
                                {cctv?.name || detected.cctvName}{cctv?.location ? `(${cctv.location})` : detected.location ? `(${detected.location})` : ''}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">방향</div>
                              <div className="text-gray-300 text-sm">
                                {cctv?.location ? getDirection(cctv.location) : detected.location ? getDirection(detected.location) : '알 수 없음'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">군집</div>
                              <div className="text-gray-300 text-sm">
                                {getCluster(detected.cctvId)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">상태</div>
                              <div className="text-gray-300 text-sm flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                LIVE / 실시간 기록 중
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
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 클립 제어 */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="flex gap-4">
                      {/* 비디오 플레이어 컨트롤 - PTZ 버튼 위치와 동일한 스타일 */}
                      <div className="flex flex-col gap-4 flex-1">
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
                  </div>
                </div>
              </div>

              {/* 포착 이유 - 하단 */}
              <div className="border-t border-[#31353a] p-6 flex-shrink-0 overflow-y-auto">
                {/* AI 해석 */}
                {detected.aiAnalysis && (
                  <div className="bg-[#0f1723] border border-[#155DFC] p-4 rounded mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="mdi:sparkles" className="w-4 h-4 text-[#50A1FF]" />
                      <span className="text-[#50A1FF] font-semibold text-sm">AI 해석</span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{detected.aiAnalysis}</p>
                  </div>
                )}

                {/* 용의자 의심 이유 */}
                {detected.suspectReason && (
                  <div className="bg-[#1a1a1a] border border-[#31353a] p-4 rounded mb-4">
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

              {/* 하단 닫기 버튼 */}
              <div className="flex justify-end p-4 border-t border-[#31353a] flex-shrink-0">
                <button
                  onClick={() => {
                    setShowDetectedCCTVPopup(false);
                    setSelectedDetectedCCTV(null);
                  }}
                  className="px-4 py-2 text-sm border border-[#31353a] text-gray-400 hover:text-white hover:border-white transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 맵 CCTV 팝업 모달 */}
      {showMapCCTVPopup && selectedMapCCTV && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
          onClick={() => {
            setShowMapCCTVPopup(false);
            setSelectedMapCCTV(null);
            setCctvClusterList([]);
            setCurrentCctvIndex(0);
          }}
        >
            <div
              className="bg-[#101013] border border-[#31353a] w-full max-w-6xl max-h-[90vh] flex flex-col shadow-lg"
              style={{ transform: 'scale(0.8)', transformOrigin: 'center center' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 팝업 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-[#31353a] flex-shrink-0">
                <div className="flex items-center gap-2 text-base font-semibold text-white">
                  <Icon icon="mdi:cctv" className="w-5 h-5 text-[#50A1FF]" />
                  CCTV 팝업
                </div>
                <button
                  onClick={() => {
                    setShowMapCCTVPopup(false);
                    setSelectedMapCCTV(null);
                    setCctvClusterList([]);
                    setCurrentCctvIndex(0);
                  }}
                  className="text-gray-400 hover:text-white focus:outline-none transition-colors"
                  aria-label="CCTV 팝업 닫기"
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>

              {/* 메인 콘텐츠 영역 */}
              <div className="flex overflow-hidden">
                {/* 왼쪽: CCTV 영상 */}
                <div className="flex-1 bg-black flex flex-col flex-shrink-0">
                  <div className="p-4 pb-3">
                    <div className="w-full aspect-video relative overflow-hidden rounded bg-black">
                      <img
                        src={cctvThumbnailMap[selectedMapCCTV] || '/cctv_img/001.jpg'}
                        alt={`${selectedMapCCTV} 라이브`}
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
                      {/* AI 포착 이유 - 우측 하단 */}
                      {(() => {
                        const timelineEntry = movementTimeline.find(item => item.cctvId === selectedMapCCTV);
                        if (timelineEntry?.title) {
                          return (
                            <div className="absolute bottom-3 right-3 px-3 py-2 bg-black/80 backdrop-blur-sm text-white text-xs font-medium rounded-lg z-10 border border-white/20">
                              <div className="flex items-center gap-2">
                                <Icon icon="mdi:robot" className="w-4 h-4 text-purple-400" />
                                <span>{timelineEntry.title}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                      <span>{new Date().toISOString().slice(0, 19).replace('T', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* 오른쪽: CCTV 정보 + PTZ 제어 */}
                <div className="w-[400px] bg-[#0f0f0f] border-l border-[#31353a] flex flex-col overflow-hidden">
                  {/* CCTV 정보 */}
                  <div className="p-6 border-b border-[#31353a] flex-shrink-0">
                    <div className="text-white font-semibold text-sm mb-4">CCTV 정보</div>
                    <div className="space-y-3">
                      {(() => {
                        const cctvKey = Object.keys(cctvInfo).find(key => cctvInfo[key].id === selectedMapCCTV);
                        const cctv = cctvKey ? cctvInfo[cctvKey] : null;
                        const fov = cctvFovMap[selectedMapCCTV] || '95°';
                        
                        // 방향 계산 (예시: location에서 추출)
                        const getDirection = (location: string) => {
                          if (location.includes('북동')) return '북동 45°';
                          if (location.includes('북서')) return '북서 315°';
                          if (location.includes('동남')) return '동남 135°';
                          if (location.includes('서남')) return '서남 225°';
                          if (location.includes('북')) return '북 0°';
                          if (location.includes('동')) return '동 90°';
                          if (location.includes('남')) return '남 180°';
                          if (location.includes('서')) return '서 270°';
                          return '알 수 없음';
                        };
                        
                        // 군집 정보 (예시)
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
                        
                        // 최근 포착 정보 (movementTimeline에서)
                        const getRecentCaptures = (cctvId: string) => {
                          const captures = movementTimeline
                            .filter(item => item.cctvId === cctvId)
                            .map(item => {
                              const time = item.time.split(':').slice(1).join(':');
                              return `${time} ${item.title}`;
                            });
                          return captures.length > 0 ? captures.join(' / ') : '없음';
                        };
                        
                        return (
                          <>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">CCTV</div>
                              <div className="text-white font-semibold text-sm">
                                {selectedMapCCTV}  (PTZ / 화각 {fov})
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">지점</div>
                              <div className="text-gray-300 text-sm">
                                {cctv?.name || selectedMapCCTV}{cctv?.location ? `(${cctv.location})` : ''}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">방향</div>
                              <div className="text-gray-300 text-sm">
                                {cctv?.location ? getDirection(cctv.location) : '알 수 없음'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">군집</div>
                              <div className="text-gray-300 text-sm">
                                {getCluster(selectedMapCCTV)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">상태</div>
                              <div className="text-gray-300 text-sm flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                LIVE / 실시간 기록 중
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
                                {getRecentCaptures(selectedMapCCTV)}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* PTZ 제어 */}
                  <div className="flex-1 p-6 overflow-hidden min-h-0 flex flex-col">
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
              </div>

              {/* 썸네일 갤러리 */}
              {hasMultiple && (
                <div className="border-t border-[#31353a] p-4 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-gray-400 text-xs font-medium">클러스터 CCTV</div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handlePrevCCTV}
                        className="p-2 bg-[#1a1a1a] border border-[#31353a] text-white hover:bg-[#2a2a2a] transition-colors rounded"
                        aria-label="이전 CCTV"
                      >
                        <Icon icon="mdi:chevron-left" className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-400">
                        {currentIndex + 1}/{currentCluster.length}
                      </span>
                      <button
                        onClick={handleNextCCTV}
                        className="p-2 bg-[#1a1a1a] border border-[#31353a] text-white hover:bg-[#2a2a2a] transition-colors rounded"
                        aria-label="다음 CCTV"
                      >
                        <Icon icon="mdi:chevron-right" className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                    {currentCluster.map((cctvId: string, index: number) => {
                      const isActive = cctvId === selectedMapCCTV;
                      return (
                        <button
                          key={cctvId}
                          onClick={() => {
                            setSelectedMapCCTV(cctvId);
                            setCurrentCctvIndex(index);
                          }}
                          className={`flex-shrink-0 w-24 h-16 rounded overflow-hidden border-2 transition-all ${
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

              {/* 하단 닫기 버튼 */}
              <div className="flex justify-end p-4 border-t border-[#31353a] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowMapCCTVPopup(false);
                    setSelectedMapCCTV(null);
                    setCctvClusterList([]);
                    setCurrentCctvIndex(0);
                  }}
                  className="px-4 py-2 text-sm border border-[#31353a] text-gray-400 hover:text-white hover:border-white transition-colors"
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

