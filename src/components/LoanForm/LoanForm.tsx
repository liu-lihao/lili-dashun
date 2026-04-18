import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { RepaymentMethod } from '../../core/types'
import { useLoanStore } from '../../store/loanStore'
import { CheckCircle } from 'lucide-react'
import { Confetti } from '../Confetti'

interface LoanFormProps {
  loanId: string | null
  onSubmit?: () => void
}

export function LoanForm({ loanId, onSubmit }: LoanFormProps) {
  const { loans, addLoan, updateLoan } = useLoanStore()

  const existingLoan = loanId ? loans.find((l) => l.id === loanId) : null

  const [name, setName] = useState('')
  const [principal, setPrincipal] = useState('')
  const [annualRate, setAnnualRate] = useState('')
  const [totalPeriods, setTotalPeriods] = useState('')
  const [paymentDay, setPaymentDay] = useState('1')
  const [method, setMethod] = useState<RepaymentMethod>('equal_payment')
  const [loanStartDate, setLoanStartDate] = useState(new Date().toISOString().split('T')[0])

  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([])
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [confettiPos, setConfettiPos] = useState({ x: 0, y: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  const toastIdRef = useRef(0)

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
      setName('')
      setPrincipal('')
      setAnnualRate('')
      setTotalPeriods('')
      setPaymentDay('1')
      setMethod('equal_payment')
      setLoanStartDate(new Date().toISOString().split('T')[0])
    }
  }, [existingLoan, loanId])

  const addToast = useCallback((message: string) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2000)
  }, [])

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
      updateLoan(loanId, config)
    } else {
      addLoan(config)
    }

    addToast(loanId ? '保存成功' : '添加成功')

    onSubmit?.()
  }

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setConfettiPos({ x: e.clientX, y: e.clientY })
    setConfettiBurst(prev => prev + 1)
    setShowConfetti(true)
  }

  return (
    <>
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
            placeholder="例如：房贷、车贷、商业贷、公积金贷"
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
            className="mt-1 block w-full min-w-0 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
            style={{ maxWidth: '100%', appearance: "none" }}
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
          onClick={handleButtonClick}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 cursor-pointer"
        >
          {loanId ? '保存修改' : '添加贷款'}
        </button>
      </form>

      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} />
      ))}

      {showConfetti && (
        <Confetti
          key={confettiBurst}
          x={confettiPos.x}
          y={confettiPos.y}
        />
      )}
    </>
  )
}

function Toast({ message }: { message: string }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => setIsVisible(false), 1700)
    return () => clearTimeout(timer)
  }, [])

  return createPortal(
    <div
      className={`fixed top-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
      style={{ maxWidth: '200px' }}
    >
      <CheckCircle size={18} />
      <span className="text-sm font-medium">{message}</span>
    </div>,
    document.body
  )
}
