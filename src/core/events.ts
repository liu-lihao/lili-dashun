import { LoanConfig, type LoanState, LoanEvent } from './types'
import { calculateEqualPayment } from './calculator'

export function createInitialState(config: LoanConfig): LoanState {
  const monthlyPayment = config.method === 'equal_payment'
    ? calculateEqualPayment(config.principal, config.annualRate, config.totalPeriods)
    : undefined

  const principalPerPeriod = config.method === 'equal_principal'
    ? config.principal / config.totalPeriods
    : undefined

  return {
    principal: config.principal,
    annualRate: config.annualRate,
    remainingPeriods: config.totalPeriods,
    originalTotalPeriods: config.totalPeriods,
    method: config.method,
    monthlyPayment,
    principalPerPeriod,
  }
}

export function applyEvent(state: LoanState, event: LoanEvent): LoanState {
  switch (event.type) {
    case 'prepayment':
      return applyPrepayment(state, event)
    case 'rate_change':
      return applyRateChange(state, event)
    case 'method_change':
      return applyMethodChange(state, event)
    case 'stop_loan':
      return applyStopLoan(state, event)
    case 'term_extension':
      return applyTermExtension(state, event)
    case 'loan_increase':
      return applyLoanIncrease(state, event)
    case 'full_settlement':
      return applyFullSettlement(state)
    default:
      return state
  }
}

export function applyPrepayment(
  state: LoanState,
  event: Extract<LoanEvent, { type: 'prepayment' }>
): LoanState {
  const newPrincipal = state.principal - event.amount
  const newMethod = event.newMethod ?? state.method

  // 如果提前还款已还清全部本金，直接结束贷款
  if (newPrincipal <= 0) {
    return {
      ...state,
      principal: 0,
      remainingPeriods: 0,
      monthlyPayment: 0,
    }
  }

  if (event.strategy === 'reduce_term') {
    // 缩短期限：保持月供大致不变，计算新的期数
    const currentMonthlyPayment = state.monthlyPayment ??
      calculateEqualPayment(newPrincipal, state.annualRate, state.remainingPeriods)
    const newPeriods = calculatePeriodsForTargetPayment(
      newPrincipal,
      state.annualRate,
      currentMonthlyPayment
    )

    return {
      ...state,
      principal: newPrincipal,
      remainingPeriods: newPeriods,
      method: newMethod,
      monthlyPayment: newMethod === 'equal_payment' ? currentMonthlyPayment : undefined,
    }
  } else {
    // 减少月供：保持期数，重新计算月供
    const newState: LoanState = {
      ...state,
      principal: newPrincipal,
      method: newMethod,
      monthlyPayment: newMethod === 'equal_payment'
        ? calculateEqualPayment(newPrincipal, state.annualRate, state.remainingPeriods)
        : undefined,
    }

    // 等额本金时需要重新计算每期本金
    if (newMethod === 'equal_principal') {
      newState.principalPerPeriod = newPrincipal / state.remainingPeriods
    }

    return newState
  }
}

// 根据目标月供计算所需期数
function calculatePeriodsForTargetPayment(
  principal: number,
  annualRate: number,
  targetPayment: number
): number {
  const rate = annualRate / 12
  if (rate === 0) return Math.ceil(principal / targetPayment)

  // n = -log(1 - P*r/PMT) / log(1+r)
  const periods = -Math.log(1 - (principal * rate) / targetPayment) / Math.log(1 + rate)
  return Math.ceil(periods)
}

export function applyRateChange(state: LoanState, event: Extract<LoanEvent, { type: 'rate_change' }>): LoanState {
  const newState: LoanState = {
    ...state,
    annualRate: event.newRate,
  }

  if (newState.method === 'equal_payment') {
    newState.monthlyPayment = calculateEqualPayment(
      newState.principal,
      newState.annualRate,
      newState.remainingPeriods
    )
  }

  return newState
}

export function applyMethodChange(state: LoanState, event: Extract<LoanEvent, { type: 'method_change' }>): LoanState {
  const newState: LoanState = {
    ...state,
    method: event.newMethod,
  }

  if (event.newMethod === 'equal_payment') {
    newState.monthlyPayment = calculateEqualPayment(
      state.principal,
      state.annualRate,
      state.remainingPeriods
    )
    newState.principalPerPeriod = undefined
  } else {
    newState.monthlyPayment = undefined
    // 切换到等额本金时，基于当前剩余本金和剩余期数计算每期本金
    newState.principalPerPeriod = state.principal / state.remainingPeriods
  }

  return newState
}

export function applyStopLoan(state: LoanState, event: Extract<LoanEvent, { type: 'stop_loan' }>): LoanState {
  return {
    ...state,
    stoppedPeriods: (state.stoppedPeriods ?? 0) + event.periods,
  }
}

export function applyTermExtension(state: LoanState, event: Extract<LoanEvent, { type: 'term_extension' }>): LoanState {
  const newPeriods = state.remainingPeriods + event.additionalPeriods
  const newState: LoanState = {
    ...state,
    remainingPeriods: newPeriods,
  }

  if (newState.method === 'equal_payment') {
    newState.monthlyPayment = calculateEqualPayment(
      newState.principal,
      newState.annualRate,
      newPeriods
    )
  }

  return newState
}

export function applyLoanIncrease(state: LoanState, event: Extract<LoanEvent, { type: 'loan_increase' }>): LoanState {
  const newPrincipal = state.principal + event.amount
  const newState: LoanState = {
    ...state,
    principal: newPrincipal,
  }

  if (newState.method === 'equal_payment') {
    newState.monthlyPayment = calculateEqualPayment(
      newPrincipal,
      state.annualRate,
      state.remainingPeriods
    )
  }

  return newState
}

export function applyFullSettlement(state: LoanState): LoanState {
  return {
    ...state,
    principal: 0,
    remainingPeriods: 0,
    monthlyPayment: 0,
  }
}
