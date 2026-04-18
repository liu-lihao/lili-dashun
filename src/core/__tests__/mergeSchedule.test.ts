import { describe, it, expect } from 'vitest';
import { generateMergedSchedule } from '../mergeSchedule';
import type { LoanConfigWithMeta, RepaymentMethod } from '../types';

describe('generateMergedSchedule', () => {
  it('should merge two loans with same payment dates', () => {
    const loans: LoanConfigWithMeta[] = [
      {
        id: 'loan1',
        name: '房贷',
        color: '#3B82F6',
        principal: 1000000,
        annualRate: 0.0390,
        totalPeriods: 12,
        loanStartDate: new Date('2024-01-01'),
        paymentDay: 1,
        method: 'equal_payment' as RepaymentMethod,
        events: [],
      },
      {
        id: 'loan2',
        name: '车贷',
        color: '#10B981',
        principal: 200000,
        annualRate: 0.045,
        totalPeriods: 12,
        loanStartDate: new Date('2024-01-01'),
        paymentDay: 1,
        method: 'equal_payment' as RepaymentMethod,
        events: [],
      },
    ];

    const result = generateMergedSchedule(loans);

    expect(result).toHaveLength(12);
    expect(result[0].loans).toHaveLength(2);
    expect(result[0].totalPaymentSum).toBeGreaterThan(0);
    expect(result[0].loans[0].loanName).toBe('房贷');
    expect(result[0].loans[1].loanName).toBe('车贷');
  });

  it('should return empty array for empty loans', () => {
    const result = generateMergedSchedule([]);
    expect(result).toEqual([]);
  });

  it('should return empty array for single loan', () => {
    const loan: LoanConfigWithMeta = {
      id: 'loan1',
      name: '房贷',
      color: '#3B82F6',
      principal: 1000000,
      annualRate: 0.0390,
      totalPeriods: 12,
      loanStartDate: new Date('2024-01-01'),
      paymentDay: 1,
      method: 'equal_payment' as RepaymentMethod,
      events: [],
    };

    const result = generateMergedSchedule([loan]);
    expect(result).toHaveLength(12);
    expect(result[0].loans).toHaveLength(1);
  });

  it('should include events in merged schedule', () => {
    const loan: LoanConfigWithMeta = {
      id: 'loan1',
      name: '房贷',
      color: '#3B82F6',
      principal: 1000000,
      annualRate: 0.0390,
      totalPeriods: 12,
      loanStartDate: new Date('2024-01-01'),
      paymentDay: 1,
      method: 'equal_payment' as RepaymentMethod,
      events: [
        {
          id: 'event1',
          type: 'prepayment',
          date: new Date('2024-03-15'),
          amount: 100000,
          strategy: 'reduce_term'
        }
      ],
    };

    const result = generateMergedSchedule([loan]);
    // 找到3月份的还款期，应该包含事件
    const marchPayment = result.find(r => r.date.getMonth() === 2 && r.date.getFullYear() === 2024);
    expect(marchPayment).toBeDefined();
    expect(marchPayment!.events.length).toBe(1);
    expect(marchPayment!.events[0].event.type).toBe('prepayment');
    expect(marchPayment!.events[0].loanName).toBe('房贷');
  });
});
