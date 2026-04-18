import { LoanEvent, PrepaymentStrategy, RepaymentMethod } from '../../core/types'
import { useLoanStore } from '../../store/loanStore'

interface EventListProps {
  loanId: string
}

const eventTypeLabels: Record<LoanEvent['type'], string> = {
  prepayment: '提前还款',
  rate_change: '利率变更',
  method_change: '切换还款方式',
  stop_loan: '停贷',
  term_extension: '贷款延期',
  loan_increase: '增加贷款',
  full_settlement: '全额结清',
}

const strategyLabels: Record<PrepaymentStrategy, string> = {
  reduce_term: '缩短期限',
  reduce_payment: '减少月供',
}

const methodLabels: Record<RepaymentMethod, string> = {
  equal_payment: '等额本息',
  equal_principal: '等额本金',
}

function formatEventDetails(event: LoanEvent): string {
  switch (event.type) {
    case 'prepayment':
      return `${event.amount.toLocaleString()} 元 (${strategyLabels[event.strategy]})`
    case 'rate_change':
      return `${(event.newRate * 100).toFixed(2)}%`
    case 'method_change':
      return methodLabels[event.newMethod]
    case 'stop_loan':
      return `${event.periods} 个月`
    case 'term_extension':
      return `${event.additionalPeriods} 个月`
    case 'loan_increase':
      return `${event.amount.toLocaleString()} 元`
    case 'full_settlement':
      return '结清全部剩余贷款'
    default:
      return ''
  }
}

export function EventList({ loanId }: EventListProps) {
  const loans = useLoanStore((state) => state.loans)
  const removeEvent = useLoanStore((state) => state.removeEvent)

  const loan = loans.find((l) => l.id === loanId)
  const events = loan?.events ?? []

  if (events.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        暂无事件，请添加贷款事件（如提前还款、利率调整等）
      </p>
    )
  }

  // 按日期排序
  const sortedEvents = [...events].sort((a, b) =>
    a.date.getTime() - b.date.getTime()
  )

  return (
    <div className="space-y-2">
      {sortedEvents.map((event, index) => (
        <div
          key={event.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {index + 1}.
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {eventTypeLabels[event.type]}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              <span className="font-medium">
                {event.date.toLocaleDateString('zh-CN')}
              </span>
              <span className="mx-2">·</span>
              <span>{formatEventDetails(event)}</span>
            </div>
          </div>
          <button
            onClick={() => removeEvent(loanId, event.id)}
            className="ml-3 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="删除事件"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
