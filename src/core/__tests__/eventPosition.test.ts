import { describe, it, expect } from 'vitest';
import { calculateEventPositions } from '../eventPosition';
import type { LoanConfigWithMeta, LoanEvent, RepaymentMethod } from '../types';

describe('calculateEventPositions', () => {
  const mockLoan: LoanConfigWithMeta = {
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

  const paymentDates = [
    new Date('2024-01-01'),
    new Date('2024-02-01'),
    new Date('2024-03-01'),
  ];

  it('should return "on" for event on payment date', () => {
    const event: LoanEvent = {
      id: 'evt1',
      type: 'prepayment',
      date: new Date('2024-02-01'),
      amount: 100000,
      strategy: 'reduce_term',
    };

    const result = calculateEventPositions(mockLoan, [event], paymentDates);
    expect(result).toHaveLength(1);
    expect(result[0].position).toBe('on');
  });

  it('should return "between" for event between payment dates', () => {
    const event: LoanEvent = {
      id: 'evt1',
      type: 'prepayment',
      date: new Date('2024-02-15'),
      amount: 100000,
      strategy: 'reduce_term',
    };

    const result = calculateEventPositions(mockLoan, [event], paymentDates);
    expect(result[0].position).toBe('between');
  });

  it('should return "before" for event before first payment', () => {
    const event: LoanEvent = {
      id: 'evt1',
      type: 'prepayment',
      date: new Date('2023-12-15'),
      amount: 100000,
      strategy: 'reduce_term',
    };

    const result = calculateEventPositions(mockLoan, [event], paymentDates);
    expect(result[0].position).toBe('before');
  });
});
