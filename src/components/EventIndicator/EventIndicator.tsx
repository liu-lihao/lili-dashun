import React, { useState } from 'react';
import type { ScheduledEvent } from '../../core/types';
import { format } from 'date-fns';

interface EventIndicatorProps {
  events: ScheduledEvent[];
}

const eventTypeLabels: Record<string, string> = {
  prepayment: '提前还款',
  rate_change: '利率变更',
  method_change: '切换还款方式',
  stop_loan: '停贷',
  term_extension: '贷款延期',
  loan_increase: '增加贷款',
  full_settlement: '全额结清',
};

export const EventIndicator: React.FC<EventIndicatorProps> = ({ events }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (events.length === 0) return null;

  const color = events[0].loanColor;

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        className="cursor-pointer"
        style={{ color }}
      >
        <polygon
          points="0,0 12,6 0,12"
          fill="currentColor"
        />
      </svg>

      {isHovered && (
        <div className="absolute left-6 z-50 w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {events.map((evt, idx) => (
            <div key={idx} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: evt.loanColor }}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {evt.loanName}
                </span>
              </div>
              <div className="ml-4 text-xs text-gray-500 dark:text-gray-400">
                <div>{eventTypeLabels[evt.event.type] || evt.event.type}</div>
                <div>{format(evt.event.date, 'yyyy-MM-dd')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
