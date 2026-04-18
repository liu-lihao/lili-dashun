import { LoanConfig, LoanEvent, PaymentItem, type LoanState } from './types'
import { createInitialState, applyEvent } from './events'

// 月利率
export const monthlyRate = (annualRate: number): number => annualRate / 12

// 计算两个日期之间的天数
function daysBetween(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay)
}

// 计算按天比例计算的利息
function calculateDailyInterest(
  principal: number,
  annualRate: number,
  days: number
): number {
  return principal * annualRate * (days / 365)
}

// 计算首次还款日（根据贷款起始日和还款日）
function calculateFirstPaymentDate(loanStartDate: Date, paymentDay: number): Date {
  const year = loanStartDate.getFullYear()
  const month = loanStartDate.getMonth()
  const day = loanStartDate.getDate()

  let firstPaymentYear = year
  let firstPaymentMonth = month

  // 如果贷款发放日已经过了还款日，则首次还款日为下个月的还款日
  if (day > paymentDay) {
    firstPaymentMonth++
    if (firstPaymentMonth > 11) {
      firstPaymentMonth = 0
      firstPaymentYear++
    }
  }

  // 获取目标月份的最大天数
  const maxDay = new Date(firstPaymentYear, firstPaymentMonth + 1, 0).getDate()
  const actualPaymentDay = Math.min(paymentDay, maxDay)

  return new Date(firstPaymentYear, firstPaymentMonth, actualPaymentDay)
}

// 计算第 N 期的还款日
function calculatePaymentDate(firstPaymentDate: Date, periodOffset: number): Date {
  const date = new Date(firstPaymentDate)
  date.setMonth(date.getMonth() + periodOffset)
  return date
}

// 等额本息月供计算
export function calculateEqualPayment(
  principal: number,
  annualRate: number,
  periods: number
): number {
  const rate = monthlyRate(annualRate)
  if (rate === 0) return principal / periods
  return (principal * rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1)
}

// 生成等额本息还款计划
export function generateEqualPaymentSchedule(
  config: LoanConfig,
  startPeriod = 1
): PaymentItem[] {
  const schedule: PaymentItem[] = []
  const firstPaymentDate = calculateFirstPaymentDate(config.loanStartDate, config.paymentDay)

  // 计算首期实际天数
  const daysInFirstPeriod = daysBetween(config.loanStartDate, firstPaymentDate)
  const hasProportionalFirstPeriod = daysInFirstPeriod > 0 && daysInFirstPeriod < 31

  let remaining = config.principal
  const totalPeriods = config.totalPeriods

  if (hasProportionalFirstPeriod) {
    // 首期按实际天数计算利息
    const firstPeriodInterest = calculateDailyInterest(remaining, config.annualRate, daysInFirstPeriod)

    // 计算标准月供（基于剩余期数）
    const monthlyPayment = calculateEqualPayment(remaining, config.annualRate, totalPeriods)

    // 首期还款：本金 = 月供 - 首期利息（利息按天计算）
    const firstPeriodPrincipal = monthlyPayment - firstPeriodInterest
    remaining -= firstPeriodPrincipal

    schedule.push({
      period: startPeriod,
      date: firstPaymentDate,
      totalPayment: monthlyPayment,
      principalPayment: firstPeriodPrincipal,
      interestPayment: firstPeriodInterest,
      remainingPrincipal: Math.max(0, remaining),
    })

    // 剩余期数按标准等额本息计算
    const remainingPeriods = totalPeriods - 1
    if (remainingPeriods > 0) {
      const rate = monthlyRate(config.annualRate)
      const remainingMonthlyPayment = calculateEqualPayment(remaining, config.annualRate, remainingPeriods)

      for (let i = 0; i < remainingPeriods; i++) {
        const interest = remaining * rate
        const principalPaid = remainingMonthlyPayment - interest
        remaining -= principalPaid

        if (i === remainingPeriods - 1) {
          remaining = 0
        }

        schedule.push({
          period: startPeriod + 1 + i,
          date: calculatePaymentDate(firstPaymentDate, 1 + i),
          totalPayment: remainingMonthlyPayment,
          principalPayment: principalPaid,
          interestPayment: interest,
          remainingPrincipal: Math.max(0, remaining),
        })
      }
    }
  } else {
    // 标准等额本息计算
    const rate = monthlyRate(config.annualRate)
    const monthlyPayment = calculateEqualPayment(config.principal, config.annualRate, totalPeriods)

    for (let i = 0; i < totalPeriods; i++) {
      const interest = remaining * rate
      const principalPaid = monthlyPayment - interest
      remaining -= principalPaid

      if (i === totalPeriods - 1) {
        remaining = 0
      }

      schedule.push({
        period: startPeriod + i,
        date: calculatePaymentDate(firstPaymentDate, i),
        totalPayment: monthlyPayment,
        principalPayment: principalPaid,
        interestPayment: interest,
        remainingPrincipal: Math.max(0, remaining),
      })
    }
  }

  return schedule
}

// 生成等额本金还款计划
export function generateEqualPrincipalSchedule(
  config: LoanConfig,
  startPeriod = 1
): PaymentItem[] {
  const schedule: PaymentItem[] = []
  const firstPaymentDate = calculateFirstPaymentDate(config.loanStartDate, config.paymentDay)

  // 计算首期实际天数
  const daysInFirstPeriod = daysBetween(config.loanStartDate, firstPaymentDate)
  const hasProportionalFirstPeriod = daysInFirstPeriod > 0 && daysInFirstPeriod < 31

  let remaining = config.principal
  const totalPeriods = config.totalPeriods
  const rate = monthlyRate(config.annualRate)

  if (hasProportionalFirstPeriod) {
    // 首期按实际天数计算利息
    const firstPeriodInterest = calculateDailyInterest(remaining, config.annualRate, daysInFirstPeriod)

    // 等额本金：每期本金相同
    const principalPerPeriod = config.principal / totalPeriods
    const firstPeriodTotal = principalPerPeriod + firstPeriodInterest
    remaining -= principalPerPeriod

    schedule.push({
      period: startPeriod,
      date: firstPaymentDate,
      totalPayment: firstPeriodTotal,
      principalPayment: principalPerPeriod,
      interestPayment: firstPeriodInterest,
      remainingPrincipal: Math.max(0, remaining),
    })

    // 剩余期数按标准等额本金计算
    const remainingPeriods = totalPeriods - 1
    for (let i = 0; i < remainingPeriods; i++) {
      const interest = remaining * rate
      const totalPayment = principalPerPeriod + interest
      remaining -= principalPerPeriod

      if (i === remainingPeriods - 1) {
        remaining = 0
      }

      schedule.push({
        period: startPeriod + 1 + i,
        date: calculatePaymentDate(firstPaymentDate, 1 + i),
        totalPayment,
        principalPayment: principalPerPeriod,
        interestPayment: interest,
        remainingPrincipal: Math.max(0, remaining),
      })
    }
  } else {
    // 标准等额本金计算
    const principalPerPeriod = config.principal / totalPeriods

    for (let i = 0; i < totalPeriods; i++) {
      const interest = remaining * rate
      const totalPayment = principalPerPeriod + interest
      remaining -= principalPerPeriod

      if (i === totalPeriods - 1) {
        remaining = 0
      }

      schedule.push({
        period: startPeriod + i,
        date: calculatePaymentDate(firstPaymentDate, i),
        totalPayment,
        principalPayment: principalPerPeriod,
        interestPayment: interest,
        remainingPrincipal: Math.max(0, remaining),
      })
    }
  }

  return schedule
}

// ==================== 分段计算引擎 ====================

export interface PlanSegment {
  startPeriod: number
  payments: PaymentItem[]
}

export function generateSchedule(
  config: LoanConfig,
  events: LoanEvent[]
): PaymentItem[] {
  const sortedEvents = [...events].sort((a, b) =>
    a.date.getTime() - b.date.getTime()
  )

  const segments: PlanSegment[] = []
  let currentState = createInitialState(config)
  let currentPeriod = 1

  // 计算首次还款日
  const firstPaymentDate = calculateFirstPaymentDate(config.loanStartDate, config.paymentDay)

  // 计算首期是否需要按比例计算（仅第一期）
  const daysInFirstPeriod = daysBetween(config.loanStartDate, firstPaymentDate)
  const hasProportionalFirstPeriod = daysInFirstPeriod > 0 && daysInFirstPeriod < 31

  // 用于计算事件发生在第几期的基准
  const baseDate = firstPaymentDate

  for (const event of sortedEvents) {
    const periodsToEvent = calculatePeriodsToDate(baseDate, event.date)
    // periodsToEvent 是事件应该生效的期数，事件前的期数是 periodsToEvent - 1
    const periodsForSegment = Math.max(0, periodsToEvent - currentPeriod)

    if (periodsForSegment > 0) {
      // 仅在第一期且需要时传递 proportional first period 信息
      const isFirstSegment = currentPeriod === 1
      const segment = calculateSegment(
        currentState,
        periodsForSegment,
        currentPeriod,
        baseDate,
        isFirstSegment && hasProportionalFirstPeriod ? daysInFirstPeriod : undefined
      )
      segments.push(segment)
      currentPeriod += segment.payments.length

      const lastPayment = segment.payments[segment.payments.length - 1]
      currentState = updateStateFromPayment(currentState, lastPayment, segment.payments.length)
    }

    currentState = applyEvent(currentState, event)
  }

  // 处理最终段（只有剩余期数大于0时才生成）
  if (currentState.remainingPeriods > 0) {
    const isFirstSegment = currentPeriod === 1
    const finalSegment = calculateSegment(
      currentState,
      currentState.remainingPeriods,
      currentPeriod,
      baseDate,
      isFirstSegment && hasProportionalFirstPeriod ? daysInFirstPeriod : undefined
    )
    segments.push(finalSegment)
  }

  return mergeSegments(segments)
}

function calculateSegment(
  state: LoanState,
  periods: number,
  startPeriod: number,
  baseDate: Date,
  proportionalDays?: number
): PlanSegment {
  const payments: PaymentItem[] = []
  const rate = state.annualRate / 12
  let remaining = state.principal

  for (let i = 0; i < periods; i++) {
    let totalPayment: number
    let principalPayment: number
    let interestPayment: number
    let isStopped = false

    // 首期按比例计算（仅当指定了 proportionalDays 且是第一期）
    const isFirstPeriodWithProportionalDays = i === 0 && proportionalDays !== undefined

    if (state.stoppedPeriods && state.stoppedPeriods > 0) {
      isStopped = true
      if (isFirstPeriodWithProportionalDays) {
        interestPayment = calculateDailyInterest(remaining, state.annualRate, proportionalDays)
      } else {
        interestPayment = remaining * rate
      }
      principalPayment = 0
      totalPayment = interestPayment
      state.stoppedPeriods--
    } else if (state.method === 'equal_payment') {
      totalPayment = state.monthlyPayment!
      if (isFirstPeriodWithProportionalDays) {
        interestPayment = calculateDailyInterest(remaining, state.annualRate, proportionalDays)
        principalPayment = totalPayment - interestPayment
      } else {
        interestPayment = remaining * rate
        principalPayment = totalPayment - interestPayment
      }
      remaining -= principalPayment
    } else {
      // 等额本金：每期本金固定（基于原始本金和原始期数）
      principalPayment = state.principalPerPeriod!
      if (isFirstPeriodWithProportionalDays) {
        interestPayment = calculateDailyInterest(remaining, state.annualRate, proportionalDays)
      } else {
        interestPayment = remaining * rate
      }
      totalPayment = principalPayment + interestPayment
      remaining -= principalPayment
    }

    payments.push({
      period: startPeriod + i,
      date: calculatePaymentDate(baseDate, startPeriod + i - 1),
      totalPayment,
      principalPayment,
      interestPayment,
      remainingPrincipal: Math.max(0, remaining),
      isStopped: isStopped || undefined,
    })
  }

  return { startPeriod, payments }
}

function mergeSegments(segments: PlanSegment[]): PaymentItem[] {
  return segments.flatMap(s => s.payments)
}

function calculatePeriodsToDate(baseDate: Date, targetDate: Date): number {
  const months = (targetDate.getFullYear() - baseDate.getFullYear()) * 12 +
    (targetDate.getMonth() - baseDate.getMonth())

  // 如果目标日期小于等于还款日，事件应该在这一期之前应用
  // 例如：还款日是16号，事件是1号，事件应该在当期生效
  const targetDay = targetDate.getDate()
  const baseDay = baseDate.getDate()

  if (targetDay <= baseDay) {
    return months + 1  // 事件发生在当期或之前，包含这一期
  } else {
    return months + 2  // 事件发生在当期之后，从下期开始
  }
}

function updateStateFromPayment(state: LoanState, payment: PaymentItem, periodsPaid: number = 1): LoanState {
  return {
    ...state,
    principal: payment.remainingPrincipal,
    remainingPeriods: Math.max(0, state.remainingPeriods - periodsPaid),
  }
}
