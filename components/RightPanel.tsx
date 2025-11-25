'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { EventSummary as EventSummaryType } from '@/types';
import { Event } from '@/types';

interface RightPanelProps {
  summary: EventSummaryType;
  events?: Event[];
  onEventClick?: (eventId: string) => void;
}

const RightPanel = ({ summary, events = [], onEventClick }: RightPanelProps) => {
  const [expanded, setExpanded] = useState(true);

  if (!expanded) {
    return (
      <div className="w-12 bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col">
        <button
          onClick={() => setExpanded(true)}
          className="h-16 flex items-center justify-center border-b border-[#2a2a2a] hover:bg-[#2a2a2a]"
        >
          <Icon icon="mdi:chevron-left" className="w-6 h-6 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-96 bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">TOTAL</h2>
        <button
          onClick={() => setExpanded(false)}
          className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
        >
          <Icon icon="mdi:chevron-right" className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* 요약 지표 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#242424] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-gray-400 text-xs">Error</span>
            </div>
            <span className="text-white text-lg font-semibold">{summary.total}</span>
          </div>
          <div className="bg-[#242424] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-gray-400 text-xs">Warning</span>
            </div>
            <span className="text-white text-lg font-semibold">{summary.inProgress}</span>
          </div>
          <div className="bg-[#242424] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="text-gray-400 text-xs">Energy Loss</span>
            </div>
            <span className="text-white text-lg font-semibold">{summary.high}</span>
          </div>
          <div className="bg-[#242424] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-gray-400 text-xs">Maintenance</span>
            </div>
            <span className="text-white text-lg font-semibold">{summary.overlapped}</span>
          </div>
        </div>

        {/* 주요 지표 */}
        <div className="bg-[#242424] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Utilization Rate (Air conditioner & Display)</span>
            <span className="text-white font-semibold">38.9 %</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Monthly Cumulative consumption</span>
            <span className="text-white font-semibold">1,000 kWh</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Indoor Air Quality</span>
            <span className="text-green-400 font-semibold">Normal</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Indoor Comfort Level</span>
            <span className="text-green-400 font-semibold">Comfortable</span>
          </div>
        </div>

        {/* 개별 이벤트 카드 그리드 */}
        {events.length > 0 && (
          <div>
            <h3 className="text-white font-medium text-sm mb-3">이벤트 상세</h3>
            <div className="grid grid-cols-1 gap-3">
              {events.slice(0, 6).map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event.id)}
                  className="bg-[#242424] rounded-lg p-3 border border-[#2a2a2a] hover:border-blue-500 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{event.location.name}</span>
                    <Icon icon="mdi:chevron-right" className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Operation Rate</span>
                      <span className="text-white">Air conditioner {event.priority === 'High' ? '100%' : '80%'}, Display {event.priority === 'High' ? '90%' : '70%'}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400">
                      <span>ON/OFF</span>
                      <span className="text-white">AC ON {event.priority === 'High' ? '10' : '8'} | OFF {event.priority === 'High' ? '0' : '2'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                      <span>Error {event.status === 'MONITORING' ? '2' : '0'}</span>
                      <span>Energy Loss {event.status === 'MONITORING' ? '0' : '1'}</span>
                      <span>Warning {event.status === 'MONITORING' ? '1' : '0'}</span>
                      <span>Maintenance 0</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;

