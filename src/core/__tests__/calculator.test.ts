import { describe, it, expect } from 'vitest'
import { calculateEqualPayment, generateEqualPaymentSchedule, generateSchedule } from '../calculator'
import { LoanConfig, LoanEvent } from '../types'

describe('calculator', () => {
  const baseConfig: LoanConfig = {
    principal: 10000,
    annualRate: 0.10,
    totalPeriods: 12,
    loanStartDate: new Date('2025-02-01'),
    paymentDay: 1,
    method: 'equal_payment',
  }

  describe('calculateEqualPayment', () => {
    it('should calculate correct monthly payment for case 1', () => {
      const payment = calculateEqualPayment(10000, 0.10, 12)
      expect(payment).toBeCloseTo(879.16, 2)
    })
  })

  describe('generateEqualPaymentSchedule', () => {
    it('should generate 12 periods schedule', () => {
      const schedule = generateEqualPaymentSchedule(baseConfig)
      expect(schedule).toHaveLength(12)
    })

    it('first period should have correct values', () => {
      const schedule = generateEqualPaymentSchedule(baseConfig)
      expect(schedule[0].period).toBe(1)
      expect(schedule[0].totalPayment).toBeCloseTo(879.16, 2)
      expect(schedule[0].interestPayment).toBeCloseTo(83.33, 2)
      expect(schedule[0].principalPayment).toBeCloseTo(795.83, 2)
    })

    it('last period should have zero remaining principal', () => {
      const schedule = generateEqualPaymentSchedule(baseConfig)
      expect(schedule[11].remainingPrincipal).toBe(0)
    })
  })
})

describe('generateSchedule', () => {
  const baseConfig: LoanConfig = {
    principal: 10000,
    annualRate: 0.10,
    totalPeriods: 12,
    loanStartDate: new Date('2025-02-01'),
    paymentDay: 1,
    method: 'equal_payment',
  }

  it('should generate schedule without events', () => {
    const schedule = generateSchedule(baseConfig, [])
    expect(schedule).toHaveLength(12)
  })

  it('Case 2: 提前还款 + 缩短期限', () => {
    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-03-15'),
      type: 'prepayment',
      amount: 5000,
      strategy: 'reduce_term',
    }]

    const schedule = generateSchedule(baseConfig, events)
    expect(schedule.length).toBeLessThan(12)

    const afterPrepayment = schedule.find(s => s.period === 2)
    expect(afterPrepayment).toBeDefined()
  })
})
