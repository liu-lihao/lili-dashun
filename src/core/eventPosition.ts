import type { LoanConfigWithMeta, LoanEvent, ScheduledEvent } from './types';
import { isSameDay, isBefore, compareAsc } from 'date-fns';

export function calculateEventPositions(
  loan: LoanConfigWithMeta,
  events: LoanEvent[],
  paymentDates: Date[]
): ScheduledEvent[] {
  if (paymentDates.length === 0) {
    return [];
  }

  const sortedDates = [...paymentDates].sort(compareAsc);

  return events.map((event) => {
    let position: ScheduledEvent['position'] = 'between';

    // 检查是否在首期之前
    if (isBefore(event.date, sortedDates[0])) {
      position = 'before';
    } else {
      // 检查是否在某一期的当天
      for (const date of sortedDates) {
        if (isSameDay(event.date, date)) {
          position = 'on';
          break;
        }
      }
    }

    return {
      loanId: loan.id,
      loanName: loan.name,
      loanColor: loan.color,
      event,
      position,
    };
  });
}
