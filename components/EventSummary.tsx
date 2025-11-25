'use client';

import { EventSummary as EventSummaryType } from '@/types';

interface EventSummaryProps {
  summary: EventSummaryType;
}

const EventSummary = ({ summary }: EventSummaryProps) => {
  return (
    <div className="flex items-center gap-6 bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">전체</span>
          <span className="text-white font-semibold">{summary.total}</span>
        </div>
        <div className="w-px h-6 bg-[#2a2a2a]" />
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">진행중</span>
          <span className="text-blue-400 font-semibold">{summary.inProgress}</span>
        </div>
        <div className="w-px h-6 bg-[#2a2a2a]" />
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">High</span>
          <span className="text-red-400 font-semibold">{summary.high}</span>
        </div>
        <div className="w-px h-6 bg-[#2a2a2a]" />
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">중첩 이벤트</span>
          <span className="text-yellow-400 font-semibold">{summary.overlapped}</span>
        </div>
      </div>
    </div>
  );
};

export default EventSummary;

