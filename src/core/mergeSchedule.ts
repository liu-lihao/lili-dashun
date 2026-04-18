import { generateSchedule } from './calculator';
import type {
  LoanConfigWithMeta,
  MergedPaymentItem,
  LoanPaymentDetail,
  ScheduledEvent,
} from './types';
import { isSameMonth, compareAsc, format } from 'date-fns';

export function generateMergedSchedule(
  loans: LoanConfigWithMeta[]
): MergedPaymentItem[] {
  if (loans.length === 0) {
    return [];
  }

  // 1. 生成每个贷款的独立计划
  const schedules = loans.map((loan) => ({
    loanId: loan.id,
    loanName: loan.name,
    loanColor: loan.color,
    schedule: generateSchedule(loan, loan.events),
  }));

  // 2. 收集所有唯一的日期
  const dateMap = new Map<string, Date>();
  schedules.forEach(({ schedule }) => {
    schedule.forEach((item) => {
      const key = item.date.toISOString().split('T')[0];
      dateMap.set(key, item.date);
    });
  });

  // 3. 按日期排序
  const sortedDates = Array.from(dateMap.values()).sort(compareAsc);

  // 4. 收集所有事件并按月份分组（使用本地时间的年月）
  const eventsByMonth = new Map<string, ScheduledEvent[]>();
  loans.forEach((loan) => {
    loan.events.forEach((event) => {
      // 使用本地时间的年月作为键
      const monthKey = format(event.date, 'yyyy-MM');
      if (!eventsByMonth.has(monthKey)) {
        eventsByMonth.set(monthKey, []);
      }
      eventsByMonth.get(monthKey)!.push({
        loanId: loan.id,
        loanName: loan.name,
        loanColor: loan.color,
        event,
        position: 'on',
      });
    });
  });

  // 5. 生成合并计划
  return sortedDates.map((date, index) => {
    const loansData: LoanPaymentDetail[] = [];

    schedules.forEach(({ loanId, loanName, loanColor, schedule }) => {
      const item = schedule.find((s) => isSameMonth(s.date, date));
      if (item) {
        loansData.push({
          loanId,
          loanName,
          loanColor,
          totalPayment: item.totalPayment,
          principalPayment: item.principalPayment,
          interestPayment: item.interestPayment,
          remainingPrincipal: item.remainingPrincipal,
        });
      }
    });

    const totalPaymentSum = loansData.reduce((sum, l) => sum + l.totalPayment, 0);
    const principalPaymentSum = loansData.reduce((sum, l) => sum + l.principalPayment, 0);
    const interestPaymentSum = loansData.reduce((sum, l) => sum + l.interestPayment, 0);
    const remainingPrincipalSum = loansData.reduce((sum, l) => sum + l.remainingPrincipal, 0);

    // 获取该月份的事件（使用本地时间的年月）
    const monthKey = format(date, 'yyyy-MM');
    const eventsForDate = eventsByMonth.get(monthKey) ?? [];

    return {
      date,
      period: index + 1,
      loans: loansData,
      events: eventsForDate,
      totalPaymentSum,
      principalPaymentSum,
      interestPaymentSum,
      remainingPrincipalSum,
    };
  });
}
