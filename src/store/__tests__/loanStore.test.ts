import { describe, it, expect, beforeEach } from 'vitest'
import { useLoanStore } from '../loanStore'
import type { LoanConfigWithMeta, PrepaymentEvent } from '../../core/types'

describe('loanStore', () => {
  beforeEach(() => {
    useLoanStore.setState({
      loans: [],
      selectedLoanId: null,
      mergedSchedule: null,
    })
  })

  it('should add loan', () => {
    const loan: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Test Loan',
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    }

    const id = useLoanStore.getState().addLoan(loan)
    expect(useLoanStore.getState().loans).toHaveLength(1)
    expect(useLoanStore.getState().loans[0].id).toBe(id)
    expect(useLoanStore.getState().loans[0].name).toBe('Test Loan')
    expect(useLoanStore.getState().selectedLoanId).toBe(id)
  })

  it('should remove loan', () => {
    const loan: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Test Loan',
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    }

    const id = useLoanStore.getState().addLoan(loan)
    expect(useLoanStore.getState().loans).toHaveLength(1)

    useLoanStore.getState().removeLoan(id)
    expect(useLoanStore.getState().loans).toHaveLength(0)
    expect(useLoanStore.getState().selectedLoanId).toBeNull()
  })

  it('should update loan', () => {
    const loan: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Test Loan',
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    }

    const id = useLoanStore.getState().addLoan(loan)
    useLoanStore.getState().updateLoan(id, { principal: 20000 })

    expect(useLoanStore.getState().loans[0].principal).toBe(20000)
  })

  it('should select loan', () => {
    const loan: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Test Loan',
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    }

    const id = useLoanStore.getState().addLoan(loan)
    useLoanStore.getState().selectLoan(null)
    expect(useLoanStore.getState().selectedLoanId).toBeNull()

    useLoanStore.getState().selectLoan(id)
    expect(useLoanStore.getState().selectedLoanId).toBe(id)
  })

  it('should add event and recalculate schedule', () => {
    const loan: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Test Loan',
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    }

    const loanId = useLoanStore.getState().addLoan(loan)
    const prepaymentEvent: Omit<PrepaymentEvent, 'id'> = {
      date: new Date(),
      type: 'prepayment',
      amount: 5000,
      strategy: 'reduce_term',
    }
    useLoanStore.getState().addEvent(loanId, prepaymentEvent)

    expect(useLoanStore.getState().loans[0].events).toHaveLength(1)
    expect(useLoanStore.getState().mergedSchedule).not.toBeNull()
  })

  it('should remove event', () => {
    const loan: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Test Loan',
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    }

    const loanId = useLoanStore.getState().addLoan(loan)
    const prepaymentEvent: Omit<PrepaymentEvent, 'id'> = {
      date: new Date(),
      type: 'prepayment',
      amount: 5000,
      strategy: 'reduce_term',
    }
    useLoanStore.getState().addEvent(loanId, prepaymentEvent)

    const eventId = useLoanStore.getState().loans[0].events[0].id
    useLoanStore.getState().removeEvent(loanId, eventId)

    expect(useLoanStore.getState().loans[0].events).toHaveLength(0)
  })

  it('should update event', () => {
    const loan: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Test Loan',
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    }

    const loanId = useLoanStore.getState().addLoan(loan)
    const prepaymentEvent: Omit<PrepaymentEvent, 'id'> = {
      date: new Date(),
      type: 'prepayment',
      amount: 5000,
      strategy: 'reduce_term',
    }
    useLoanStore.getState().addEvent(loanId, prepaymentEvent)

    const eventId = useLoanStore.getState().loans[0].events[0].id
    useLoanStore.getState().updateEvent(loanId, eventId, { amount: 8000 })

    const updatedEvent = useLoanStore.getState().loans[0].events[0] as PrepaymentEvent
    expect(updatedEvent.amount).toBe(8000)
  })

  it('should reorder loans', () => {
    const loan1: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Loan 1',
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    }

    const loan2: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Loan 2',
      principal: 20000,
      annualRate: 0.08,
      totalPeriods: 24,
      loanStartDate: new Date(),
      paymentDay: 5,
      method: 'equal_principal',
    }

    useLoanStore.getState().addLoan(loan1)
    useLoanStore.getState().addLoan(loan2)

    expect(useLoanStore.getState().loans[0].name).toBe('Loan 1')
    expect(useLoanStore.getState().loans[1].name).toBe('Loan 2')

    useLoanStore.getState().reorderLoans(0, 1)

    expect(useLoanStore.getState().loans[0].name).toBe('Loan 2')
    expect(useLoanStore.getState().loans[1].name).toBe('Loan 1')
  })

  it('should assign different colors to loans', () => {
    const loan1: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Loan 1',
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    }

    const loan2: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'> = {
      name: 'Loan 2',
      principal: 20000,
      annualRate: 0.08,
      totalPeriods: 24,
      loanStartDate: new Date(),
      paymentDay: 5,
      method: 'equal_principal',
    }

    useLoanStore.getState().addLoan(loan1)
    useLoanStore.getState().addLoan(loan2)

    const color1 = useLoanStore.getState().loans[0].color
    const color2 = useLoanStore.getState().loans[1].color

    expect(color1).toBeDefined()
    expect(color2).toBeDefined()
    expect(color1).not.toBe(color2)
  })
})
