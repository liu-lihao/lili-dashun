import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoanForm } from '../LoanForm'
import { useLoanStore } from '../../../store/loanStore'

describe('LoanForm', () => {
  beforeEach(() => {
    // Reset store before each test
    useLoanStore.setState({
      loans: [],
      selectedLoanId: null,
      mergedSchedule: null,
    })
  })

  it('should render form fields', () => {
    render(<LoanForm loanId={null} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/贷款名称/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/本金/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/年利率/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/期数/i)).toBeInTheDocument()
  })

  it('should show "添加贷款" button when creating new loan', () => {
    render(<LoanForm loanId={null} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /添加贷款/i })).toBeInTheDocument()
  })

  it('should show "保存修改" button when editing existing loan', () => {
    // Add a loan first
    const loanId = useLoanStore.getState().addLoan({
      name: 'Test Loan',
      principal: 100000,
      annualRate: 0.043,
      totalPeriods: 120,
      loanStartDate: new Date('2025-01-01'),
      paymentDay: 1,
      method: 'equal_payment',
    })

    render(<LoanForm loanId={loanId} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /保存修改/i })).toBeInTheDocument()
  })

  it('should add new loan when submitting with loanId=null', () => {
    const onSubmit = vi.fn()
    render(<LoanForm loanId={null} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/贷款名称/i), { target: { value: 'New Loan' } })
    fireEvent.change(screen.getByLabelText(/本金/i), { target: { value: '10000' } })
    fireEvent.change(screen.getByLabelText(/年利率/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/期数/i), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: /添加贷款/i }))

    // Check that the loan was added to the store
    const loans = useLoanStore.getState().loans
    expect(loans).toHaveLength(1)
    expect(loans[0].name).toBe('New Loan')
    expect(loans[0].principal).toBe(10000)
    expect(loans[0].annualRate).toBe(0.10)
    expect(loans[0].totalPeriods).toBe(12)

    // onSubmit callback should be called
    expect(onSubmit).toHaveBeenCalled()
  })

  it('should include payment day when adding loan', () => {
    render(<LoanForm loanId={null} onSubmit={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/贷款名称/i), { target: { value: 'Test Loan' } })
    fireEvent.change(screen.getByLabelText(/本金/i), { target: { value: '100000' } })
    fireEvent.change(screen.getByLabelText(/年利率/i), { target: { value: '4.3' } })
    fireEvent.change(screen.getByLabelText(/期数/i), { target: { value: '120' } })
    fireEvent.change(screen.getByLabelText(/还款日（1-31号）/i), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: /添加贷款/i }))

    const loans = useLoanStore.getState().loans
    expect(loans[0].paymentDay).toBe(15)
  })

  it('should default payment day to 1', () => {
    render(<LoanForm loanId={null} onSubmit={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/贷款名称/i), { target: { value: 'Test Loan' } })
    fireEvent.change(screen.getByLabelText(/本金/i), { target: { value: '100000' } })
    fireEvent.change(screen.getByLabelText(/年利率/i), { target: { value: '4.3' } })
    fireEvent.change(screen.getByLabelText(/期数/i), { target: { value: '120' } })
    fireEvent.click(screen.getByRole('button', { name: /添加贷款/i }))

    const loans = useLoanStore.getState().loans
    expect(loans[0].paymentDay).toBe(1)
  })

  it('should update existing loan when submitting with loanId', () => {
    // Add a loan first
    const loanId = useLoanStore.getState().addLoan({
      name: 'Original Name',
      principal: 100000,
      annualRate: 0.043,
      totalPeriods: 120,
      loanStartDate: new Date('2025-01-01'),
      paymentDay: 1,
      method: 'equal_payment',
    })

    const onSubmit = vi.fn()
    render(<LoanForm loanId={loanId} onSubmit={onSubmit} />)

    // Change the name
    fireEvent.change(screen.getByLabelText(/贷款名称/i), { target: { value: 'Updated Name' } })
    fireEvent.click(screen.getByRole('button', { name: /保存修改/i }))

    // Check that the loan was updated
    const loans = useLoanStore.getState().loans
    expect(loans[0].name).toBe('Updated Name')
    expect(onSubmit).toHaveBeenCalled()
  })
})
