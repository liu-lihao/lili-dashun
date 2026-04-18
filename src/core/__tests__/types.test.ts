import { describe, it, expect } from 'vitest'
import {
  LoanConfig,
  LoanEvent,
} from '../types'

describe('LoanConfig schema', () => {
  it('should validate valid config', () => {
    const config = {
      principal: 100000,
      annualRate: 0.043,
      totalPeriods: 120,
      loanStartDate: new Date(),
      paymentDay: 15,
      method: 'equal_payment' as const,
    }

    expect(() => LoanConfig.parse(config)).not.toThrow()
  })

  it('should reject missing paymentDay', () => {
    const config = {
      principal: 100000,
      annualRate: 0.043,
      totalPeriods: 120,
      loanStartDate: new Date(),
      method: 'equal_payment' as const,
    }

    expect(() => LoanConfig.parse(config)).toThrow()
  })

  it('should reject paymentDay less than 1', () => {
    const config = {
      principal: 100000,
      annualRate: 0.043,
      totalPeriods: 120,
      loanStartDate: new Date(),
      method: 'equal_payment' as const,
      paymentDay: 0,
    }

    expect(() => LoanConfig.parse(config)).toThrow()
  })

  it('should reject paymentDay greater than 31', () => {
    const config = {
      principal: 100000,
      annualRate: 0.043,
      totalPeriods: 120,
      loanStartDate: new Date(),
      method: 'equal_payment' as const,
      paymentDay: 32,
    }

    expect(() => LoanConfig.parse(config)).toThrow()
  })
})

describe('LoanEvent schemas', () => {
  const baseEvent = { date: new Date(), id: '550e8400-e29b-41d4-a716-446655440000' }

  it('should validate prepayment event', () => {
    const event = { ...baseEvent, type: 'prepayment' as const, amount: 50000, strategy: 'reduce_term' as const }
    expect(() => LoanEvent.parse(event)).not.toThrow()
  })

  it('should validate rate_change event', () => {
    const event = { ...baseEvent, type: 'rate_change' as const, newRate: 0.05 }
    expect(() => LoanEvent.parse(event)).not.toThrow()
  })

  it('should validate method_change event', () => {
    const event = { ...baseEvent, type: 'method_change' as const, newMethod: 'equal_principal' as const }
    expect(() => LoanEvent.parse(event)).not.toThrow()
  })

  it('should validate stop_loan event', () => {
    const event = { ...baseEvent, type: 'stop_loan' as const, periods: 6 }
    expect(() => LoanEvent.parse(event)).not.toThrow()
  })

  it('should validate term_extension event', () => {
    const event = { ...baseEvent, type: 'term_extension' as const, additionalPeriods: 24 }
    expect(() => LoanEvent.parse(event)).not.toThrow()
  })

  it('should validate loan_increase event', () => {
    const event = { ...baseEvent, type: 'loan_increase' as const, amount: 50000 }
    expect(() => LoanEvent.parse(event)).not.toThrow()
  })

  it('should validate full_settlement event', () => {
    const event = { ...baseEvent, type: 'full_settlement' as const }
    expect(() => LoanEvent.parse(event)).not.toThrow()
  })
})
