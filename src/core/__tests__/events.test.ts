import { describe, it, expect } from 'vitest'
import { createInitialState, applyPrepayment, applyRateChange, applyMethodChange, applyStopLoan, applyTermExtension, applyLoanIncrease, applyFullSettlement } from '../events'
import { LoanConfig, PrepaymentEvent, type LoanState } from '../types'

describe('events', () => {
  const baseConfig: LoanConfig = {
    principal: 10000,
    annualRate: 0.10,
    totalPeriods: 12,
    loanStartDate: new Date('2025-02-01'),
    paymentDay: 1,
    method: 'equal_payment',
  }

  describe('createInitialState', () => {
    it('should create correct initial state', () => {
      const state = createInitialState(baseConfig)
      expect(state.principal).toBe(10000)
      expect(state.annualRate).toBe(0.10)
      expect(state.remainingPeriods).toBe(12)
      expect(state.method).toBe('equal_payment')
    })
  })

  describe('applyPrepayment', () => {
    it('Case 2: 提前还款 5000，缩短期限', () => {
      const state = createInitialState(baseConfig)
      const event: PrepaymentEvent = {
        id: '1',
        date: new Date('2025-03-15'),
        type: 'prepayment',
        amount: 5000,
        strategy: 'reduce_term',
      }

      const newState = applyPrepayment(state, event)

      expect(newState.principal).toBe(5000)
      expect(newState.remainingPeriods).toBeLessThan(12)
      expect(newState.annualRate).toBe(0.10)
    })

    it('Case 3: 提前还款 5000，减少月供', () => {
      const state = createInitialState(baseConfig)
      const event: PrepaymentEvent = {
        id: '1',
        date: new Date('2025-03-15'),
        type: 'prepayment',
        amount: 5000,
        strategy: 'reduce_payment',
      }

      const newState = applyPrepayment(state, event)

      expect(newState.principal).toBe(5000)
      expect(newState.remainingPeriods).toBe(12)
    })
  })

  describe('applyRateChange', () => {
    it('Case 11: 利率下调到 5%', () => {
      const state = createInitialState(baseConfig)
      const newState = applyRateChange(state, { type: 'rate_change', newRate: 0.05, id: '1', date: new Date() })
      expect(newState.annualRate).toBe(0.05)
    })

    it('should update annual rate and recalculate monthly payment', () => {
      const state: LoanState = {
        principal: 100000,
        annualRate: 0.043,
        remainingPeriods: 120,
        method: 'equal_payment',
        monthlyPayment: 1020,
        originalTotalPeriods: 120,
      }

      const result = applyRateChange(state, { type: 'rate_change', newRate: 0.05, date: new Date(), id: '1' })

      expect(result.annualRate).toBe(0.05)
      expect(result.monthlyPayment).not.toBe(state.monthlyPayment)
    })
  })

  describe('applyMethodChange', () => {
    it('Case 4: 等额本息转等额本金', () => {
      const state = createInitialState(baseConfig)
      const newState = applyMethodChange(state, { type: 'method_change', newMethod: 'equal_principal', id: '1', date: new Date() })
      expect(newState.method).toBe('equal_principal')
      expect(newState.monthlyPayment).toBeUndefined()
    })

    it('should switch to equal_payment and calculate monthly payment', () => {
      const state: LoanState = {
        principal: 100000,
        annualRate: 0.043,
        remainingPeriods: 120,
        method: 'equal_principal',
        originalTotalPeriods: 120,
      }

      const result = applyMethodChange(state, { type: 'method_change', newMethod: 'equal_payment', date: new Date(), id: '1' })

      expect(result.method).toBe('equal_payment')
      expect(result.monthlyPayment).toBeDefined()
    })

    it('should switch to equal_principal and clear monthly payment', () => {
      const state: LoanState = {
        principal: 100000,
        annualRate: 0.043,
        remainingPeriods: 120,
        method: 'equal_payment',
        monthlyPayment: 1020,
        originalTotalPeriods: 120,
      }

      const result = applyMethodChange(state, { type: 'method_change', newMethod: 'equal_principal', date: new Date(), id: '1' })

      expect(result.method).toBe('equal_principal')
      expect(result.monthlyPayment).toBeUndefined()
    })
  })

  describe('applyStopLoan', () => {
    it('Case 10: 停贷3期', () => {
      const state = createInitialState(baseConfig)
      const newState = applyStopLoan(state, { type: 'stop_loan', periods: 3, id: '1', date: new Date() })
      expect(newState.stoppedPeriods).toBe(3)
    })

    it('should add stopped periods', () => {
      const state: LoanState = {
        principal: 100000,
        annualRate: 0.043,
        remainingPeriods: 120,
        method: 'equal_payment',
        originalTotalPeriods: 120,
      }

      const result = applyStopLoan(state, { type: 'stop_loan', periods: 6, date: new Date(), id: '1' })

      expect(result.stoppedPeriods).toBe(6)
    })

    it('should accumulate stopped periods', () => {
      const state: LoanState = {
        principal: 100000,
        annualRate: 0.043,
        remainingPeriods: 120,
        method: 'equal_payment',
        stoppedPeriods: 3,
        originalTotalPeriods: 120,
      }

      const result = applyStopLoan(state, { type: 'stop_loan', periods: 6, date: new Date(), id: '1' })

      expect(result.stoppedPeriods).toBe(9)
    })
  })

  describe('applyTermExtension', () => {
    it('Case 17: 展期6个月', () => {
      const state = createInitialState(baseConfig)
      state.remainingPeriods = 9  // 已还3期
      const newState = applyTermExtension(state, { type: 'term_extension', additionalPeriods: 6, id: '1', date: new Date() })
      expect(newState.remainingPeriods).toBe(15)
    })

    it('should add periods to remaining', () => {
      const state: LoanState = {
        principal: 100000,
        annualRate: 0.043,
        remainingPeriods: 120,
        method: 'equal_payment',
        monthlyPayment: 1020,
        originalTotalPeriods: 120,
      }

      const result = applyTermExtension(state, { type: 'term_extension', additionalPeriods: 24, date: new Date(), id: '1' })

      expect(result.remainingPeriods).toBe(144)
    })
  })

  describe('applyLoanIncrease', () => {
    it('Case 18: 增贷5000', () => {
      const state = createInitialState(baseConfig)
      state.remainingPeriods = 10  // 剩余期数
      const newState = applyLoanIncrease(state, { type: 'loan_increase', amount: 5000, id: '1', date: new Date() })
      expect(newState.principal).toBe(15000)
    })

    it('should add amount to principal', () => {
      const state: LoanState = {
        principal: 100000,
        annualRate: 0.043,
        remainingPeriods: 120,
        method: 'equal_payment',
        monthlyPayment: 1020,
        originalTotalPeriods: 120,
      }

      const result = applyLoanIncrease(state, { type: 'loan_increase', amount: 50000, date: new Date(), id: '1' })

      expect(result.principal).toBe(150000)
    })
  })

  describe('applyFullSettlement', () => {
    it('should reset principal and periods to zero', () => {
      const state: LoanState = {
        principal: 100000,
        annualRate: 0.043,
        remainingPeriods: 120,
        method: 'equal_payment',
        monthlyPayment: 1020,
        originalTotalPeriods: 120,
      }

      const result = applyFullSettlement(state)

      expect(result.principal).toBe(0)
      expect(result.remainingPeriods).toBe(0)
      expect(result.monthlyPayment).toBe(0)
      expect(result.annualRate).toBe(state.annualRate)
      expect(result.method).toBe(state.method)
    })
  })
})
