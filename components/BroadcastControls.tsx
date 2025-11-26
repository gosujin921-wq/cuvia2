'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';

type PriorityLabel = '긴급' | '경계' | '주의';

export type ClipData = {
  id: string;
  cctvId: string;
  cctvName: string;
  timestamp: string;
  duration: string;
  frameTimestamp: string;
  thumbnail: string;
  status: 'saved' | 'ready';
};

export type BroadcastControlsProps = {
  eventId: string;
  eventTitle: string;
  source: string;
  location: string;
  receivedAt: string;
  priority: PriorityLabel;
  aiSummary: string;
  riskSummary: string;
  onAddClipsRef?: React.MutableRefObject<((clips: ClipData[]) => void) | null>;
  onOpenModalRef?: React.MutableRefObject<(() => void) | null>;
};

type AttachmentStatus = 'ready' | 'saved';

type Attachment = {
  id: string;
  cctvId: string;
  thumbnail: string;
  frameTimestamp: string;
  timestamp: string;
  duration: string;
  status: AttachmentStatus;
};

const defaultAttachments: Attachment[] = [];

const availableRecipients = ['경찰', '소방', '재난안전', '지자체'];

const BroadcastControls: React.FC<BroadcastControlsProps> = ({
  eventId,
  eventTitle,
  source,
  location,
  receivedAt,
  priority,
  aiSummary,
  riskSummary,
  onAddClipsRef,
  onOpenModalRef,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultMessage = useMemo(() => {
    const safeSummary = aiSummary?.trim() || '';
    const safeRisk = riskSummary?.trim() || '';

    return [
      '【이벤트 기본 정보】',
      `- 이벤트명: ${eventTitle}`,
      `- 우선순위: ${priority}`,
      `- 접수시간: ${receivedAt}`,
      `- 위치: ${location}`,
      `- 신고기관: ${source}`,
      '',
      '【위험 요인 분석】',
      safeRisk ? `- ${safeRisk}` : '- 현재 이벤트의 위험 요인과 위험도, 우선 대응 우선순위를 요약합니다.',
      '',
      '【인물/행동 분석】',
      safeSummary
        ? `- ${safeSummary}`
        : '- 관련 인물(용의자/피해자)의 특징, 현재 상태, 도주/이동 패턴을 요약합니다.',
      '',
      '【위치 및 동선 요약】',
      `- 주요 발생 지점과 인근 동선(진입·이탈 방향, 인접 CCTV 포인트)을 요약해 전파 대상이 현장 위치를 빠르게 파악할 수 있도록 합니다.`,
      '',
      '【출동 및 통제 권고】',
      '- 우선 출동 대상(경찰·교통·순찰·기동대 등)과 권장 병력 규모를 제안합니다.',
      '- 도로 차단이 필요한 경우, 차단 지점(주요 교차로·램프·골목 입구 등)을 명시합니다.',
      '- 2차 피해(추가 범행, 2차 사고, 군중 밀집 등) 방지를 위한 관제실–현장 간 공조 포인트를 정리합니다.',
    ]
      .filter(Boolean)
      .join('\n');
  }, [aiSummary, riskSummary, eventTitle, priority, receivedAt, location, source]);
  const [message, setMessage] = useState(defaultMessage);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['경찰', '소방']);
  const [attachments, setAttachments] = useState<Attachment[]>(defaultAttachments);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'drafting'>('idle');
  const [broadcastCount, setBroadcastCount] = useState(0);
  
  // 외부에서 클립 추가 함수 노출
  React.useEffect(() => {
    if (onAddClipsRef) {
      onAddClipsRef.current = (clips: ClipData[]) => {
        const newAttachments: Attachment[] = clips.map((clip) => ({
          id: clip.id,
          cctvId: clip.cctvId,
          thumbnail: clip.thumbnail,
          frameTimestamp: clip.frameTimestamp,
          timestamp: clip.timestamp,
          duration: clip.duration,
          status: clip.status,
        }));
        setAttachments((prev) => [...prev, ...newAttachments]);
        // CCTV 모달에서 클립이 추가되면 전파 초안 작성 상태로 전환
        setDraftStatus('drafting');
      };
    }
    return () => {
      if (onAddClipsRef) {
        onAddClipsRef.current = null;
      }
    };
  }, [onAddClipsRef]);

  // 외부에서 모달 열기 함수 노출
  React.useEffect(() => {
    if (onOpenModalRef) {
      onOpenModalRef.current = () => {
        setIsModalOpen(true);
      };
    }
    return () => {
      if (onOpenModalRef) {
        onOpenModalRef.current = null;
      }
    };
  }, [onOpenModalRef]);

  useEffect(() => {
    if (!isModalOpen) {
      setMessage(defaultMessage);
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, defaultMessage]);

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleBroadcast = () => {
    console.info('Broadcast request:', { eventId, message, recipients: selectedRecipients, attachments });
    setDraftStatus('idle');
    handleClose();
    // 전파 성공 알림 표시
    setBroadcastCount((prev) => prev + 1);
    
    const { date, time } = getFormattedDateTime();
    const recipientLabels = selectedRecipients.map(getRecipientLabel).join(', ');
    const alertMessage = `전파가 성공적으로 전송되었습니다.\n\n전파 일자: ${date}\n전파 시각: ${time}\n해당 이벤트 전파 횟수: ${broadcastCount + 1}회\n전파 수신: ${recipientLabels}`;
    
    alert(alertMessage);
  };

  const handleSaveDraft = () => {
    console.info('Broadcast draft saved:', { eventId, message, recipients: selectedRecipients, attachments });
    setDraftStatus('drafting');
    handleClose();
  };

  const toggleRecipient = (recipient: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipient) ? prev.filter((item) => item !== recipient) : [...prev, recipient]
    );
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
  };

  // 전파 대상 매핑
  const getRecipientLabel = (recipient: string): string => {
    const mapping: Record<string, string> = {
      '경찰': '112 상황실',
      '소방': '119 상황실',
      '재난안전': '재난안전',
      '지자체': '도시안전과',
    };
    return mapping[recipient] || recipient;
  };

  // 날짜/시간 포맷팅
  const getFormattedDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return {
      date: `${year}.${month}.${day}`,
      time: `${hours}:${minutes}:${seconds}`,
    };
  };

  const priorityBadgeClass =
    priority === '긴급'
      ? 'bg-red-500/20 text-red-400'
      : priority === '경계'
        ? 'bg-yellow-500/20 text-yellow-400'
        : 'bg-blue-500/20 text-blue-400';

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="전파 모달 열기"
        className="w-full bg-[#155DFC] text-white py-2 text-sm font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-[#1f6dff] focus:outline-none focus:ring-2 focus:ring-[#50A1FF] rounded-none transition-colors"
      >
        <Icon icon="mdi:send" className="w-4 h-4" />
        {draftStatus === 'drafting' || attachments.length > 0 ? '전파 초안 작성 중' : '전파 초안 작성'}
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6"
          role="dialog"
          aria-modal="true"
          aria-label="전파 모달"
          onClick={handleOverlayClick}
        >
          <div className="w-full max-w-2xl bg-[#101013] border border-[#31353a] p-6 text-sm text-gray-100 space-y-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-semibold text-white">
                <Icon icon="mdi:send" className="w-5 h-5 text-[#50A1FF]" />
                전파 초안 작성
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="전파 모달 닫기"
                className="text-gray-400 hover:text-white focus:outline-none"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-300">
              <div>
                <p className="text-white font-semibold">이벤트명</p>
                <p className="text-gray-300 text-sm">{eventTitle}</p>
              </div>
              <div>
                <p className="text-white font-semibold">우선순위</p>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold ${priorityBadgeClass}`}>
                  {priority}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold">접수 시간</p>
                <p className="text-gray-300 text-sm">{receivedAt}</p>
              </div>
              <div>
                <p className="text-white font-semibold">위치</p>
                <p className="text-gray-300 text-sm">{location}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white font-semibold">전파 대상</span>
                <span className="text-gray-400 font-medium">수정 가능</span>
                <span className="text-gray-500 font-medium text-xs sm:text-sm">(다중 선택)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableRecipients.map((recipient) => {
                  const isSelected = selectedRecipients.includes(recipient);
                  return (
                    <button
                      key={recipient}
                      type="button"
                      onClick={() => toggleRecipient(recipient)}
                      className={`px-3 py-1 text-xs border ${
                        isSelected ? 'bg-[#155DFC] text-white border-[#155DFC]' : 'border-[#2a2d36] text-gray-300'
                      }`}
                    >
                      {recipient}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white font-semibold">전파 메시지</span>
                <span className="text-gray-400 font-medium">수정 가능</span>
                <span className="text-gray-500 font-medium text-xs sm:text-sm">AI 요약 기반</span>
              </div>
              <textarea
                id="broadcast-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="w-full h-40 bg-white text-gray-900 border border-[#31353a] text-sm p-3 focus:outline-none focus:ring-2 focus:ring-[#50A1FF] resize-none placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white font-semibold">이벤트 클립</span>
                <span className="text-gray-400 font-medium">수정 가능</span>
              </div>
              {attachments.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="min-w-[160px] bg-[#36383B] border border-[#2a2d36] shadow-sm relative">
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute top-2 right-2 z-10 text-white bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
                        aria-label="첨부 삭제"
                      >
                        <Icon icon="mdi:close" className="w-4 h-4" />
                      </button>
                      <div className="relative h-24 bg-gray-200 overflow-hidden">
                        <img 
                          src={attachment.thumbnail} 
                          alt={`${attachment.cctvId} 썸네일`} 
                          className="absolute inset-0 w-full h-full object-cover" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/cctv_img/001.jpg';
                          }}
                        />
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                          {attachment.frameTimestamp}
                        </span>
                      </div>
                      <div className="px-3 py-2 space-y-1 text-xs bg-white">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-gray-900">{attachment.cctvId}</span>
                          <span className="text-gray-500">{attachment.status === 'ready' ? '전파 준비' : '저장'}</span>
                        </div>
                        <div className="text-gray-500">{attachment.timestamp}</div>
                        <div className="text-gray-700">{attachment.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-[#2a2d36] text-xs text-gray-300 p-4 text-center">
                  첨부된 정보가 없습니다.
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              <button
                type="button"
                onClick={handleBroadcast}
                className="px-4 py-2 text-sm font-semibold bg-[#155DFC] text-white hover:bg-[#1f6dff]"
              >
                즉시 전파
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 text-sm border border-[#31353a] text-gray-300 hover:text-white hover:border-white"
              >
                초안 저장
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm border border-[#31353a] text-gray-400 hover:text-white"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default BroadcastControls;

