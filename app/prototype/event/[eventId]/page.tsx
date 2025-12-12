'use client';

import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Icon } from '@iconify/react';
import { useParams } from 'next/navigation';
import { getEventById, generateAIInsight, generateEventCompletionMessage, domainLabels, convertToDashboardEvent, formatEventDateTime } from '@/lib/events-data';
import { EventLeftPanel } from '@/components/event-detail/EventLeftPanel';
import { EventCenterPanel } from '@/components/event-detail/EventCenterPanel';
import { EventCenterColumn1 } from '@/components/event-detail/EventCenterColumn1';
import { EventCenterColumn2 } from '@/components/event-detail/EventCenterColumn2';
import { DetectedCCTVClipPopup } from '@/components/event-detail/DetectedCCTVClipPopup';
import { MapCCTVPopup } from '@/components/event-detail/MapCCTVPopup';
import { CombinedCCTVPopup } from '@/components/event-detail/CombinedCCTVPopup';
import { EventCompletionNotificationPopup } from '@/components/event-detail/EventCompletionNotificationPopup';
import { EventData, RiskFactor, ChatMessage, SavedClip } from '@/components/event-detail/types';
import { behaviorHighlights, movementTimeline, cctvInfo, cctvThumbnailMap, cctvFovMap, detectedCCTVThumbnails } from '@/components/event-detail/constants';
import { ScaledLayout } from '@/components/layouts/ScaledLayout';


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
  const [showCombinedCCTVPopup, setShowCombinedCCTVPopup] = useState(false);
  const [selectedCombinedCCTV, setSelectedCombinedCCTV] = useState<string | null>(null);
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


  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(332); // 5분 32초
  const [savedClips, setSavedClips] = useState<Array<{ id: string; cctvId: string; cctvName: string; timestamp: string; duration: string; frameTimestamp: string; thumbnail: string; status: 'saved' | 'ready' }>>([]);
  const [showTrackingOverlay, setShowTrackingOverlay] = useState(false);
  const [monitoringCCTVs, setMonitoringCCTVs] = useState<string[]>([
    'CCTV-7 (현장)', 
    'CCTV-12 (산책로 방향)', 
    'CCTV-15 (차량 탑승 지점)',
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
  const [showAdditionalDataPopup, setShowAdditionalDataPopup] = useState(false);
  const [showBroadcastDraftPopup, setShowBroadcastDraftPopup] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string>('');
  
  // 맵 확대 상태
  const [zoomLevel, setZoomLevel] = useState(0); // 0: 축소(클러스터), 1: 확대(개별)

  // 프로토타입 초기 상태
  const [prototypePin1Visible, setPrototypePin1Visible] = useState(true);
  const [prototypePin2Visible, setPrototypePin2Visible] = useState(false);
  const [prototypePin3Visible, setPrototypePin3Visible] = useState(false);
  const [prototypeTrackingPinVisible, setPrototypeTrackingPinVisible] = useState(false);
  const [prototypeRouteVisible, setPrototypeRouteVisible] = useState(false);
  const [prototypePin1Label, setPrototypePin1Label] = useState('신고지역');
  const [prototypePin1Pulse, setPrototypePin1Pulse] = useState(true);
  const [prototypeShowDetectedClips, setPrototypeShowDetectedClips] = useState(false);
  const [prototypeMovementTimelineFilter, setPrototypeMovementTimelineFilter] = useState<string[]>(['유괴 의심 신고 접수']);
  const [prototypeBehaviorHighlightsFilter, setPrototypeBehaviorHighlightsFilter] = useState<string[]>(['놀이터']);
  const [prototypeShowSuspectInfo, setPrototypeShowSuspectInfo] = useState(true);
  const [prototypeShowChildInfo, setPrototypeShowChildInfo] = useState(true);
  const [prototypePin1Color, setPrototypePin1Color] = useState<'red' | 'yellow'>('red');
  const [prototypeStep, setPrototypeStep] = useState<'initial' | 'q' | 'w' | 'e' | 'r'>('initial');
  const [prototypeShowVehicleAnalysis, setPrototypeShowVehicleAnalysis] = useState(false);
  const [prototypePin2Pulse, setPrototypePin2Pulse] = useState(false);
  const [prototypeShowRoute1to2, setPrototypeShowRoute1to2] = useState(false);
  const [prototypePin3Pulse, setPrototypePin3Pulse] = useState(false);
  const [prototypeShowRoute2to3, setPrototypeShowRoute2to3] = useState(false);
  const [prototypeDetectedClipConfidence, setPrototypeDetectedClipConfidence] = useState<Record<string, number>>({});
  const [prototypePin3Color, setPrototypePin3Color] = useState<'blue' | 'red'>('blue');
  const [prototypePin4Visible, setPrototypePin4Visible] = useState(false);
  const [prototypeShowRoute3to4, setPrototypeShowRoute3to4] = useState(false);

  // 추적 핀 관련 상태
  const [isTrackingPinVisible, setIsTrackingPinVisible] = useState(false);
  const [isTrackingProgress, setIsTrackingProgress] = useState(false);
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [trackingPinPosition, setTrackingPinPosition] = useState({ left: 85, top: 45 }); // 기본 위치

  // 추적대상 재선택 완료 핸들러
  const handleTrackingReselectComplete = () => {
    const confirmed = window.confirm('추적대상 재선택이 완료되었습니다. AI가 추적대상을 재 분석합니다.');
    if (!confirmed) return;

    // 1. 추적 핀 숨기기
    setIsTrackingPinVisible(false);
    
    // 2. 프로그레스바 시작
    setIsTrackingProgress(true);
    setTrackingProgress(0);

    // 3. 프로그레스바 애니메이션 (2초)
    const duration = 2000; // 2초
    const interval = 50; // 50ms마다 업데이트
    const increment = 100 / (duration / interval);
    
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        setTrackingProgress(100);
        clearInterval(progressInterval);
        
        // 4. 프로그레스 완료 후 처리
        setTimeout(() => {
          // 프로토타입: 합본 모니터링 팝업에서 재추적 시 CCTV 클립 정확도 변경
          if (showCombinedCCTVPopup) {
            setPrototypeDetectedClipConfidence(prev => ({
              ...prev,
              'CCTV-12': 98 // 산책로 방향 이동 포착 정확도 98%
            }));
          }
          
          // 랜덤하게 약간 이동 (예: ±5% 범위 내)
          const offsetX = (Math.random() - 0.5) * 10; // -5 ~ +5
          const offsetY = (Math.random() - 0.5) * 10; // -5 ~ +5
          setTrackingPinPosition({
            left: Math.max(10, Math.min(90, trackingPinPosition.left + offsetX)),
            top: Math.max(10, Math.min(90, trackingPinPosition.top + offsetY))
          });
          
          // 5. 추적 핀 다시 표시
          setIsTrackingPinVisible(true);
          setIsTrackingProgress(false);
          setTrackingProgress(0);
        }, 300);
      } else {
        setTrackingProgress(currentProgress);
      }
    }, interval);
  };

  // 클라이언트 마운트 후 localStorage에서 값 읽기 (이벤트 상세 페이지에서는 초기값 false 유지)
  useEffect(() => {
    setIsMounted(true);
    // 이벤트 상세 페이지에서는 초기 진입시 항상 CCTV 토글이 꺼진 상태로 시작
    // localStorage에서 값을 읽어오지 않음
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

  // 프로토타입 키보드 이벤트 (q, w, e)
  useEffect(() => {
    // 팝업이 열려있으면 키보드 이벤트 무시
    if (showMapCCTVPopup || showDetectedCCTVPopup || showCombinedCCTVPopup || showAdditionalDataPopup || showBroadcastDraftPopup || showCompletionPopup) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        e.stopPropagation();
        setPrototypeStep('q');
        setPrototypePin1Color('yellow');
        setPrototypePin1Label('유괴범과 아동 함께 이동 포착');
        setPrototypeMovementTimelineFilter(['유괴 의심 신고 접수', '유괴범과 아동 함께 이동 포착']);
        setPrototypeShowDetectedClips(true);
        setPrototypeBehaviorHighlightsFilter(['유괴 의심', '놀이터']);
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        e.stopPropagation();
        setPrototypeStep('w');
        setShowAdditionalDataPopup(true);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        e.stopPropagation();
        setPrototypeStep('e');
        setPrototypePin3Visible(true);
        setPrototypePin3Pulse(true);
        setPrototypePin2Pulse(false);
        setPrototypeShowRoute2to3(true);
        setPrototypeMovementTimelineFilter(['유괴 의심 신고 접수', '유괴범과 아동 함께 이동 포착', '시민 신고: 산책로 쪽으로 뛰어감', '용의자가 차량에 아이 태우는 장면 포착', '차량 도주 추적 중']);
        setPrototypeShowDetectedClips(true);
        setPrototypePin3Color('red');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        e.stopPropagation();
        setPrototypeStep('r');
        setPrototypePin4Visible(true);
        setPrototypePin3Color('blue');
        setPrototypeShowRoute3to4(true);
        setPrototypeMovementTimelineFilter(['유괴 의심 신고 접수', '유괴범과 아동 함께 이동 포착', '시민 신고: 산책로 쪽으로 뛰어감', '용의자가 차량에 아이 태우는 장면 포착', '차량 도주 추적 중', '현재 위치 추적 중']);
      } else if (e.key === '0') {
        e.preventDefault();
        setShowAdditionalDataPopup(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [showMapCCTVPopup, showDetectedCCTVPopup, showCombinedCCTVPopup, showAdditionalDataPopup, showBroadcastDraftPopup, showCompletionPopup]);

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
• 성별/연령: 남성, 30대 추정
• 체격: 170cm 추정, 중간 체격
• ReID 신뢰도: 96%

**착의 정보**
• 상의: 검은색 후드티
• 특징: 파란 가방 멘 아이를 억지로 끌고 감

**행동 패턴**
• 유괴 의심 행위: 아이를 억지로 끌고 이동
• 이동 경로: 놀이터 → 산책로 → 차량 탑승
• 도주 수단: 차량 이용
• 현재 상태: 차량 도주 추적 중`;
    } else if (prompt.includes('추적') || prompt.includes('경로')) {
      return `🗺️ 추적 경로 및 동선 분석

**이동 타임라인**
• 15:20:00 - 유괴 의심 신고 접수 (관양초등학교 앞 놀이터)
• 15:20:15 - CCTV-7에서 유괴범과 아동 함께 이동 포착
• 15:21:30 - 시민 신고: 산책로 쪽으로 뛰어감
• 15:22:45 - CCTV-15에서 용의자가 차량에 아이 태우는 장면 포착
• 15:23:00 - 차량 도주 추적 중

**예상 이동 경로**
놀이터(CCTV-7) → 산책로 방향 → 차량 탑승(CCTV-15) → 차량 도주 추적 중`;
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
   • 위치: 관양초등학교 앞 놀이터
   • 신뢰도: 96%
   • 상태: 활성

2. **CCTV-12 (산책로 방향)**
   • 위치: 산책로 입구
   • 신뢰도: 88%
   • 상태: 추적중

3. **CCTV-15 (차량 탑승 지점)**
   • 위치: 산책로 인근
   • 신뢰도: 95%
   • 상태: 추적중`;
    } else {
      return `"${prompt}" 요청에 대해 ${title} 사건 기준으로 정보를 정리했습니다. 필요한 세부 데이터가 있다면 추가로 지시해주세요.`;
    }
  };

  const handleSendMessage = (messageText?: string) => {
    const text = (messageText ?? chatInput).trim();
    if (!text || isResponding) return;
    
    // 프로토타입: w 단계에서 "시민 신고: 산책로 쪽으로 뛰어감" 전송 시
    const isWStepMessage = prototypeStep === 'w' && text.includes('산책로');
    
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
      
      // 프로토타입: w 단계에서 메시지 전송 후 처리
      if (isWStepMessage) {
        // 재추적 프로그래스바 시작
        setIsTrackingProgress(true);
        setTrackingProgress(0);
        
        const duration = 2000; // 2초
        const interval = 50;
        const increment = 100 / (duration / interval);
        
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          currentProgress += increment;
          if (currentProgress >= 100) {
            setTrackingProgress(100);
            clearInterval(progressInterval);
            
            // 프로그래스 완료 후 핀2 표시 및 기타 상태 업데이트
            setTimeout(() => {
              setPrototypePin2Visible(true);
              setPrototypePin2Pulse(true);
              setPrototypePin1Pulse(false);
              setPrototypeShowRoute1to2(true);
              setPrototypeMovementTimelineFilter(['유괴 의심 신고 접수', '유괴범과 아동 함께 이동 포착', '시민 신고: 산책로 쪽으로 뛰어감', '용의자가 차량에 아이 태우는 장면 포착']);
              setPrototypeShowDetectedClips(true); // 3개 클립 표시
              setPrototypeShowVehicleAnalysis(true);
              setIsTrackingProgress(false);
              setTrackingProgress(0);
            }, 300);
          } else {
            setTrackingProgress(currentProgress);
          }
        }, interval);
      }
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

  // 사건 완료 시 팝업 표시
  useEffect(() => {
    if (dashboardEvent && dashboardEvent.processingStage === '종결' && !showCompletionPopup) {
      const message = generateEventCompletionMessage(baseEvent!, dashboardEvent);
      setCompletionMessage(message);
      setShowCompletionPopup(true);
    }
  }, [dashboardEvent, baseEvent, showCompletionPopup]);

  // 키보드 9 누르면 사건 완료 팝업 표시 (나중에 삭제할 기능 - 테스트용)
  useEffect(() => {
    // 팝업이 열려있으면 키보드 이벤트 무시
    if (showMapCCTVPopup || showDetectedCCTVPopup || showCombinedCCTVPopup || showAdditionalDataPopup || showBroadcastDraftPopup || showCompletionPopup) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '9') {
        e.preventDefault();
        e.stopPropagation();
        // 사건 완료 팝업 표시 (테스트용)
        if (baseEvent) {
          const message = generateEventCompletionMessage(baseEvent, dashboardEvent);
          setCompletionMessage(message);
          setShowCompletionPopup(true);
        } else {
          console.log('baseEvent가 없습니다.');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [showMapCCTVPopup, showDetectedCCTVPopup, showCombinedCCTVPopup, showAdditionalDataPopup, showBroadcastDraftPopup, showCompletionPopup, baseEvent, dashboardEvent]);
  
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
    if (event.id.includes('003') || (event.type.includes('유괴') || event.type.includes('납치'))) {
      factors.push(
        { label: '사건 성격', value: '아동 유괴 의심', reason: '아동 납치 가능성, 즉시 대응 필요', level: 'high' },
        { label: 'CCTV 포착', value: '유괴범과 아동 함께 이동 확인', reason: '인접 CCTV에서 유괴범과 아동이 함께 이동하는 장면 포착', level: 'strong' },
        { label: '도주 수단', value: '차량 이용', reason: '용의자가 차량에 아이를 태우는 장면 포착, 차량 도주 추적 중', level: 'high' },
        { label: '시민 신고', value: '산책로 쪽으로 뛰어감', reason: '다른 시민의 추가 신고로 이동 경로 확인', level: 'medium' },
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

  return (
    <ScaledLayout>
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0, height: '100%' }}>
        {/* 프로토타입 라벨 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-yellow-500/90 text-black text-sm font-semibold rounded-lg shadow-lg">
          프로토타입 이벤트 상세
        </div>
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
          onModalStateChange={setShowBroadcastDraftPopup}
        />

        {/* Center Panel - 2컬럼 레이아웃 */}
        <main className="flex-1 bg-[#161719] flex flex-col overflow-hidden border-l border-r border-[#31353a]" style={{ borderLeftWidth: '1px', borderRightWidth: '1px', borderTopWidth: '0', borderBottomWidth: '0', minHeight: 0, width: '100%', height: '100%', alignSelf: 'stretch' }}>
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
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
                setShowCombinedCCTVPopup={setShowCombinedCCTVPopup}
                setSelectedCombinedCCTV={setSelectedCombinedCCTV}
                zoomLevel={zoomLevel}
                setZoomLevel={setZoomLevel}
                isTrackingPinVisible={prototypePin4Visible ? true : prototypeTrackingPinVisible}
                isTrackingProgress={isTrackingProgress}
                trackingProgress={trackingProgress}
                trackingPinPosition={trackingPinPosition}
                prototypePin1Visible={prototypePin1Visible}
                prototypePin2Visible={prototypePin2Visible}
                prototypePin3Visible={prototypePin3Visible}
                prototypeRouteVisible={prototypeRouteVisible}
                prototypePin1Label={prototypePin1Label}
                prototypePin1Pulse={prototypePin1Pulse}
                prototypePin1Color={prototypePin1Color}
                prototypePin2Pulse={prototypePin2Pulse}
                prototypeShowRoute1to2={prototypeShowRoute1to2}
                prototypePin3Pulse={prototypePin3Pulse}
                prototypeShowRoute2to3={prototypeShowRoute2to3}
                prototypePin3Color={prototypePin3Color}
                prototypeShowRoute3to4={prototypeShowRoute3to4}
                additionalDataNotification={{
                  isOpen: showAdditionalDataPopup,
                  time: '2024-01-15 14:30:25',
                  sender: '경찰서',
                  content: '추가 자료를 보내드립니다.\n\n용의자 관련 추가 정보:\n- 차량번호: 경기 12가 3456\n- 최근 목격 시각: 14:25\n- 이동 방향: 동쪽',
                  onClose: () => setShowAdditionalDataPopup(false),
                  onSendToAgent: () => {
                    const popupContent = prototypeStep === 'w' 
                      ? `시민 신고: 산책로 쪽으로 뛰어감`
                      : `시간: 2024-01-15 14:30:25\n발신 기관: 경찰서\n내용: 추가 자료를 보내드립니다.\n\n용의자 관련 추가 정보:\n- 차량번호: 경기 12가 3456\n- 최근 목격 시각: 14:25\n- 이동 방향: 동쪽`;
                    setChatInput(popupContent);
                    // 우측 패널이 접혀있으면 열기
                    if (isRightPanelCollapsed) {
                      setIsRightPanelCollapsed(false);
                    }
                    setShowAdditionalDataPopup(false);
                    // w 키 이벤트인 경우 위치 및 동선에 추가
                    if (prototypeStep === 'w') {
                      setPrototypeMovementTimelineFilter(prev => [...prev, '시민 신고: 산책로 쪽으로 뛰어감']);
                    }
                  },
                }}
              />

              {/* 2열: CCTV, 인물 분석, 행동 요약 */}
              <EventCenterColumn2
                isRightPanelCollapsed={isRightPanelCollapsed}
                cctvSectionHeight={cctvSectionHeight}
                handleDragStart={handleDragStart}
                monitoringCCTVs={monitoringCCTVs}
                handleRemoveFromMonitoring={handleRemoveFromMonitoring}
                setSelectedDetectedCCTV={setSelectedDetectedCCTV}
                setShowDetectedCCTVPopup={setShowDetectedCCTVPopup}
                setSelectedMapCCTV={setSelectedMapCCTV}
                setShowMapCCTVPopup={setShowMapCCTVPopup}
                detectedCCTVThumbnails={prototypeShowDetectedClips 
                  ? (prototypeStep === 'q' 
                      ? detectedCCTVThumbnails.filter(d => d.cctvId === 'CCTV-7')
                      : detectedCCTVThumbnails.slice(0, 3)) // w 이후에는 3개
                  : []}
                showMapCCTVPopup={showMapCCTVPopup}
                showDetectedCCTVPopup={showDetectedCCTVPopup}
                showCombinedCCTVPopup={showCombinedCCTVPopup}
                showAdditionalDataPopup={showAdditionalDataPopup}
                showBroadcastDraftPopup={showBroadcastDraftPopup}
                cctvInfo={cctvInfo}
                cctvThumbnailMap={cctvThumbnailMap}
                behaviorHighlights={behaviorHighlights}
                movementTimeline={movementTimeline}
                zoomLevel={zoomLevel}
                prototypeShowDetectedClipsDefault={!prototypeShowDetectedClips}
                prototypeMovementTimelineFilter={prototypeMovementTimelineFilter}
                prototypeBehaviorHighlightsFilter={prototypeBehaviorHighlightsFilter}
                prototypeShowSuspectInfo={prototypeShowSuspectInfo}
                prototypeShowChildInfo={prototypeShowChildInfo}
                prototypeShowVehicleAnalysis={prototypeShowVehicleAnalysis}
                prototypeDetectedClipConfidence={prototypeDetectedClipConfidence}
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
                  handleSendMessage={handleSendMessage}
                  handleDeleteClip={handleDeleteClip}
                  setSelectedMapCCTV={setSelectedMapCCTV}
                  setShowMapCCTVPopup={setShowMapCCTVPopup}
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
      {/* 포착된 CCTV 상세 모달 */}
      <DetectedCCTVClipPopup
        isOpen={showDetectedCCTVPopup}
        selectedDetectedCCTV={selectedDetectedCCTV}
        isClipPlaying={isClipPlaying}
        clipCurrentTime={clipCurrentTime}
        clipDuration={clipDuration}
        onClose={() => {
          setShowDetectedCCTVPopup(false);
          setSelectedDetectedCCTV(null);
        }}
        setIsClipPlaying={setIsClipPlaying}
        setClipCurrentTime={setClipCurrentTime}
        onTrackingReselectComplete={handleTrackingReselectComplete}
      />

      {/* 통합 CCTV 팝업 (과거 포착 아이콘 클릭 시) */}
      <CombinedCCTVPopup
        isOpen={showCombinedCCTVPopup}
        selectedCCTV={selectedCombinedCCTV}
        currentCctvIndex={currentCctvIndex}
        isClipPlaying={isClipPlaying}
        clipCurrentTime={clipCurrentTime}
        clipDuration={clipDuration}
        popupTitle={(() => {
          if (!selectedCombinedCCTV) return 'CCTV 팝업';
          const timelineEntry = movementTimeline.find(item => item.cctvId === selectedCombinedCCTV);
          return timelineEntry?.title || 'CCTV 팝업';
        })()}
        onClose={() => {
          setShowCombinedCCTVPopup(false);
          setSelectedCombinedCCTV(null);
          setCctvClusterList([]);
          setCurrentCctvIndex(0);
        }}
        setSelectedCCTV={setSelectedCombinedCCTV}
        setCurrentCctvIndex={setCurrentCctvIndex}
        setIsClipPlaying={setIsClipPlaying}
        setClipCurrentTime={setClipCurrentTime}
        handlePTZUp={handlePTZUp}
        handlePTZDown={handlePTZDown}
        handlePTZLeft={handlePTZLeft}
        handlePTZRight={handlePTZRight}
        handlePTZCenter={handlePTZCenter}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handlePreset={handlePreset}
        handlePrevCCTV={handlePrevCCTV}
        handleNextCCTV={handleNextCCTV}
        onTrackingReselectComplete={handleTrackingReselectComplete}
        prototypeDetectedClipConfidence={prototypeDetectedClipConfidence}
      />

      {/* 사건 종료 알림 팝업 */}
      <EventCompletionNotificationPopup
        isOpen={showCompletionPopup}
        time={event?.time || new Date().toLocaleString('ko-KR')}
        eventTitle={event?.title || ''}
        content={completionMessage}
        onClose={() => setShowCompletionPopup(false)}
        onStopMonitoring={() => {
          // 모니터링 중단 처리
          console.log('모니터링 중단');
          setShowCompletionPopup(false);
          // TODO: 실제 모니터링 중단 로직 구현
        }}
        onCreateReport={() => {
          // 보고서 작성 - AI 에이전트에 전달
          const reportPrompt = `이 사건에 대한 보고서를 작성해주세요.\n\n${completionMessage}`;
          setChatInput(reportPrompt);
          // 우측 패널이 접혀있으면 열기
          if (isRightPanelCollapsed) {
            setIsRightPanelCollapsed(false);
          }
          setShowCompletionPopup(false);
        }}
      />

      {/* 맵 CCTV 팝업 모달 (추적 아이콘 클릭 시) */}
        <MapCCTVPopup
          isOpen={showMapCCTVPopup}
          selectedMapCCTV={selectedMapCCTV}
          currentCctvIndex={currentCctvIndex}
          monitoringCCTVs={monitoringCCTVs}
          handleAddToMonitoring={handleAddToMonitoring}
          handleRemoveFromMonitoring={handleRemoveFromMonitoring}
          popupTitle="CCTV 모니터링"
        onClose={() => {
          setShowMapCCTVPopup(false);
          setSelectedMapCCTV(null);
          setCctvClusterList([]);
          setCurrentCctvIndex(0);
        }}
        setSelectedMapCCTV={setSelectedMapCCTV}
        setCurrentCctvIndex={setCurrentCctvIndex}
        handlePTZUp={handlePTZUp}
        handlePTZDown={handlePTZDown}
        handlePTZLeft={handlePTZLeft}
        handlePTZRight={handlePTZRight}
        handlePTZCenter={handlePTZCenter}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handlePreset={handlePreset}
        handlePrevCCTV={handlePrevCCTV}
        handleNextCCTV={handleNextCCTV}
        onTrackingReselectComplete={handleTrackingReselectComplete}
      />
    </ScaledLayout>
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

