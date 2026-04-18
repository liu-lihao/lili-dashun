import { useState } from 'react'
import { LoanEvent, PrepaymentStrategy, RepaymentMethod } from '../../core/types'
import { useLoanStore } from '../../store/loanStore'

interface EventEditorProps {
  loanId: string
}

export function EventEditor({ loanId }: EventEditorProps) {
  const addEvent = useLoanStore((state) => state.addEvent)
  const [eventType, setEventType] = useState<LoanEvent['type']>('prepayment')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [strategy, setStrategy] = useState<PrepaymentStrategy>('reduce_term')
  const [newRate, setNewRate] = useState('')
  const [newMethod, setNewMethod] = useState<RepaymentMethod>('equal_payment')
  const [stopPeriods, setStopPeriods] = useState('')
  const [extensionPeriods, setExtensionPeriods] = useState('')
  const [increaseAmount, setIncreaseAmount] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const baseEvent = { date: new Date(date) }

    switch (eventType) {
      case 'prepayment':
        addEvent(loanId, {
          ...baseEvent,
          type: 'prepayment',
          amount: Number(amount),
          strategy,
        } as Omit<LoanEvent, 'id'>)
        break
      case 'rate_change':
        addEvent(loanId, {
          ...baseEvent,
          type: 'rate_change',
          newRate: Number(newRate) / 100,
        } as Omit<LoanEvent, 'id'>)
        break
      case 'method_change':
        addEvent(loanId, {
          ...baseEvent,
          type: 'method_change',
          newMethod,
        } as Omit<LoanEvent, 'id'>)
        break
      case 'stop_loan':
        addEvent(loanId, {
          ...baseEvent,
          type: 'stop_loan',
          periods: Number(stopPeriods),
        } as Omit<LoanEvent, 'id'>)
        break
      case 'term_extension':
        addEvent(loanId, {
          ...baseEvent,
          type: 'term_extension',
          additionalPeriods: Number(extensionPeriods),
        } as Omit<LoanEvent, 'id'>)
        break
      case 'loan_increase':
        addEvent(loanId, {
          ...baseEvent,
          type: 'loan_increase',
          amount: Number(increaseAmount),
        } as Omit<LoanEvent, 'id'>)
        break
      case 'full_settlement':
        addEvent(loanId, {
          ...baseEvent,
          type: 'full_settlement',
        } as Omit<LoanEvent, 'id'>)
        break
    }

    setAmount('')
    setDate('')
    setNewRate('')
    setNewMethod('equal_payment')
    setStopPeriods('')
    setExtensionPeriods('')
    setIncreaseAmount('')
    setStrategy('reduce_term')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-200">事件类型</label>
        <select
          id="eventType"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as LoanEvent['type'])}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
        >
          <option value="prepayment">提前还款</option>
          <option value="rate_change">利率变更</option>
          <option value="method_change">切换还款方式</option>
          <option value="stop_loan">停贷</option>
          <option value="term_extension">贷款延期</option>
          <option value="loan_increase">增加贷款</option>
          <option value="full_settlement">全额结清</option>
        </select>
      </div>

      <div>
        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">日期</label>
        <input
          id="eventDate"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
          required
        />
      </div>

      {eventType === 'prepayment' && (
        <>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-200">金额</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
              required
            />
          </div>
          <div>
            <label htmlFor="strategy" className="block text-sm font-medium text-gray-700 dark:text-gray-200">策略</label>
            <select
              id="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as PrepaymentStrategy)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
            >
              <option value="reduce_term">缩短期限</option>
              <option value="reduce_payment">减少月供</option>
            </select>
          </div>
        </>
      )}

      {eventType === 'rate_change' && (
        <div>
          <label htmlFor="newRate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">新年利率（%）</label>
          <input
            id="newRate"
            type="number"
            step="0.01"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
            required
          />
        </div>
      )}

      {eventType === 'method_change' && (
        <div>
          <label htmlFor="newMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-200">新还款方式</label>
          <select
            id="newMethod"
            value={newMethod}
            onChange={(e) => setNewMethod(e.target.value as RepaymentMethod)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
          >
            <option value="equal_payment">等额本息</option>
            <option value="equal_principal">等额本金</option>
          </select>
        </div>
      )}

      {eventType === 'stop_loan' && (
        <div>
          <label htmlFor="stopPeriods" className="block text-sm font-medium text-gray-700 dark:text-gray-200">停贷期数（月）</label>
          <input
            id="stopPeriods"
            type="number"
            min="1"
            value={stopPeriods}
            onChange={(e) => setStopPeriods(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
            required
          />
        </div>
      )}

      {eventType === 'term_extension' && (
        <div>
          <label htmlFor="extensionPeriods" className="block text-sm font-medium text-gray-700 dark:text-gray-200">延长期数（月）</label>
          <input
            id="extensionPeriods"
            type="number"
            min="1"
            value={extensionPeriods}
            onChange={(e) => setExtensionPeriods(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
            required
          />
        </div>
      )}

      {eventType === 'loan_increase' && (
        <div>
          <label htmlFor="increaseAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-200">增贷金额（元）</label>
          <input
            id="increaseAmount"
            type="number"
            min="1"
            value={increaseAmount}
            onChange={(e) => setIncreaseAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
            required
          />
        </div>
      )}

      {eventType === 'full_settlement' && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">此操作将结清全部剩余贷款，请确认日期正确。</p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
      >
        添加事件
      </button>
    </form>
  )
}
