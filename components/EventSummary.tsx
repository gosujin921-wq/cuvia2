'use client';

import { EventSummary as EventSummaryType } from '@/types';

interface EventSummaryProps {
  summary: EventSummaryType;
}

const EventSummary = ({ summary }: EventSummaryProps) => {
  const inProgressRate = summary.total > 0 ? (summary.inProgress / summary.total) * 100 : 0;
  const closedRate = summary.total > 0 ? (summary.closed / summary.total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 bg-[#161719] pl-[14px] pr-6 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">전체</span>
          <span className="text-white font-semibold">{summary.total}</span>
        </div>
        <div className="w-px h-6 bg-[#31353a]" />
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">진행중</span>
          <span className="text-blue-400 font-semibold">{summary.inProgress}</span>
        </div>
        <div className="w-px h-6 bg-[#31353a]" />
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">종결</span>
          <span className="text-white font-semibold">{summary.closed}</span>
        </div>
      </div>
      <div className="w-full">
        <div className="w-full h-1.5 bg-[#31353a] flex overflow-hidden">
          <div className="h-full bg-blue-400" style={{ width: `${inProgressRate}%` }} />
          <div className="h-full bg-white" style={{ width: `${closedRate}%` }} />
        </div>
      </div>
      <div className="text-gray-500 text-[0.65rem]">
        최근 24시간 기준
      </div>
    </div>
  );
};

export default EventSummary;

