import { useState, useEffect } from 'react'
import { RepaymentMethod } from '../../core/types'
import { useLoanStore } from '../../store/loanStore'

interface LoanFormProps {
  loanId: string | null  // null means create new
  onSubmit?: () => void  // callback after submit
}

export function LoanForm({ loanId, onSubmit }: LoanFormProps) {
  const { loans, addLoan, updateLoan } = useLoanStore()

  // Find existing loan by loanId
  const existingLoan = loanId ? loans.find((l) => l.id === loanId) : null

  // Form state
  const [name, setName] = useState('')
  const [principal, setPrincipal] = useState('')
  const [annualRate, setAnnualRate] = useState('')
  const [totalPeriods, setTotalPeriods] = useState('')
  const [paymentDay, setPaymentDay] = useState('1')
  const [method, setMethod] = useState<RepaymentMethod>('equal_payment')
  const [loanStartDate, setLoanStartDate] = useState(new Date().toISOString().split('T')[0])

  // Initialize form state from existing loan data when loanId changes
  useEffect(() => {
    if (existingLoan) {
      setName(existingLoan.name)
      setPrincipal(String(existingLoan.principal))
      setAnnualRate(String(existingLoan.annualRate * 100))
      setTotalPeriods(String(existingLoan.totalPeriods))
      setPaymentDay(String(existingLoan.paymentDay))
      setMethod(existingLoan.method)
      setLoanStartDate(existingLoan.loanStartDate.toISOString().split('T')[0])
    } else {
      // Reset form for new loan
      setName('')
      setPrincipal('')
      setAnnualRate('')
      setTotalPeriods('')
      setPaymentDay('1')
      setMethod('equal_payment')
      setLoanStartDate(new Date().toISOString().split('T')[0])
    }
  }, [existingLoan, loanId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const config = {
      name: name.trim() || '未命名贷款',
      principal: Number(principal),
      annualRate: Number(annualRate) / 100,
      totalPeriods: Number(totalPeriods),
      loanStartDate: new Date(loanStartDate),
      paymentDay: Number(paymentDay) || 1,
      method,
    }

    if (loanId) {
      // Update existing loan
      updateLoan(loanId, config)
    } else {
      // Create new loan
      addLoan(config)
    }

    onSubmit?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          贷款名称
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：房贷、车贷"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="principal" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          贷款本金（元）
        </label>
        <input
          id="principal"
          type="number"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="annualRate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          年利率（%）
        </label>
        <input
          id="annualRate"
          type="number"
          step="0.01"
          value={annualRate}
          onChange={(e) => setAnnualRate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="totalPeriods" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          还款期数（月）
        </label>
        <input
          id="totalPeriods"
          type="number"
          value={totalPeriods}
          onChange={(e) => setTotalPeriods(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="loanStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          贷款起始日期（计息开始日）
        </label>
        <input
          id="loanStartDate"
          type="date"
          value={loanStartDate}
          onChange={(e) => setLoanStartDate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="paymentDay" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          每月还款日（1-31号）
        </label>
        <input
          id="paymentDay"
          type="number"
          min="1"
          max="31"
          value={paymentDay}
          onChange={(e) => setPaymentDay(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
          required
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          如果贷款起始日期与还款日不同，首期还款金额将按实际天数比例计算
        </p>
      </div>

      <div>
        <label htmlFor="method" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          还款方式
        </label>
        <select
          id="method"
          value={method}
          onChange={(e) => setMethod(e.target.value as RepaymentMethod)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
        >
          <option value="equal_payment">等额本息</option>
          <option value="equal_principal">等额本金</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        {loanId ? '保存修改' : '添加贷款'}
      </button>
    </form>
  )
}
