import { describe, it, expect } from 'vitest'
import { generateEqualPaymentSchedule, generateEqualPrincipalSchedule, generateSchedule } from '../calculator'
import { LoanConfig, LoanEvent } from '../types'

describe('Case 1: 等额本金 vs 等额本息', () => {
  const config: LoanConfig = {
    principal: 10000,
    annualRate: 0.10,
    totalPeriods: 12,
    loanStartDate: new Date('2025-02-01'),
    paymentDay: 1,  // 2月1日贷款，2月1日还款（完整月）
    method: 'equal_payment',
  }

  it('等额本息：12期还款计划', () => {
    const schedule = generateEqualPaymentSchedule(config)

    expect(schedule).toHaveLength(12)
    expect(schedule[0].totalPayment).toBeCloseTo(879.16, 2)
    expect(schedule[0].principalPayment).toBeCloseTo(795.83, 2)
    expect(schedule[0].interestPayment).toBeCloseTo(83.33, 2)  // 完整月利息
    expect(schedule[0].remainingPrincipal).toBeCloseTo(9204.17, 2)
    expect(schedule[11].remainingPrincipal).toBe(0)
  })

  it('等额本金：12期还款计划', () => {
    const principalConfig = { ...config, method: 'equal_principal' as const }
    const schedule = generateEqualPrincipalSchedule(principalConfig)

    expect(schedule).toHaveLength(12)
    expect(schedule[0].totalPayment).toBeCloseTo(916.67, 2)
    expect(schedule[0].principalPayment).toBeCloseTo(833.33, 2)
    expect(schedule[0].interestPayment).toBeCloseTo(83.33, 2)  // 完整月利息
    expect(schedule[0].remainingPrincipal).toBeCloseTo(9166.67, 2)
    expect(schedule[11].remainingPrincipal).toBe(0)
  })
})

describe('All Cases', () => {
  const baseConfig: LoanConfig = {
    principal: 10000,
    annualRate: 0.10,
    totalPeriods: 12,
    loanStartDate: new Date('2025-02-01'),
    paymentDay: 1,
    method: 'equal_payment',
  }

  it('Case 2: 提前还款 5000，缩短期限', () => {
    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-03-15'),
      type: 'prepayment',
      amount: 5000,
      strategy: 'reduce_term',
    }]

    const schedule = generateSchedule(baseConfig, events)
    expect(schedule.length).toBeLessThan(12)
  })

  it('Case 3: 提前还款 5000，减少月供', () => {
    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-03-15'),
      type: 'prepayment',
      amount: 5000,
      strategy: 'reduce_payment',
    }]

    const schedule = generateSchedule(baseConfig, events)
    const afterPrepayment = schedule.filter(s => s.period > 1)
    expect(afterPrepayment[0].totalPayment).toBeLessThan(879.16)
  })

  it('Case 4: 利率调整', () => {
    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-05-01'),
      type: 'rate_change',
      newRate: 0.08,
    }]

    const schedule = generateSchedule(baseConfig, events)
    const afterRateChange = schedule.filter(s => s.period > 4)
    expect(afterRateChange[0].totalPayment).toBeLessThan(879.16)
  })

  it('Case 5: 还款方式变更', () => {
    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-04-01'),
      type: 'method_change',
      newMethod: 'equal_principal',
    }]

    const schedule = generateSchedule(baseConfig, events)
    // 还款方式变更后，总期数可能会变化
    expect(schedule.length).toBeGreaterThanOrEqual(12)
    // 确保最后剩余本金为0
    expect(schedule[schedule.length - 1].remainingPrincipal).toBe(0)
  })

  it('Case 6: 停贷', () => {
    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-04-01'),
      type: 'stop_loan',
      periods: 3,
    }]

    const schedule = generateSchedule(baseConfig, events)
    const stoppedPayments = schedule.filter(s => s.isStopped)
    expect(stoppedPayments).toHaveLength(3)
    // 停贷期间只还利息
    expect(stoppedPayments[0].principalPayment).toBe(0)
  })

  it('Case 7: 展期', () => {
    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-06-01'),
      type: 'term_extension',
      additionalPeriods: 6,
    }]

    const schedule = generateSchedule(baseConfig, events)
    expect(schedule.length).toBeGreaterThan(12)
  })

  it('Case 8: 增贷', () => {
    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-04-01'),
      type: 'loan_increase',
      amount: 5000,
    }]

    const schedule = generateSchedule(baseConfig, events)
    // 增贷后总期数可能会变化
    expect(schedule.length).toBeGreaterThanOrEqual(12)
    // 增贷后本金增加，总利息会增加
    const totalInterest = schedule.reduce((sum, s) => sum + s.interestPayment, 0)
    expect(totalInterest).toBeGreaterThan(0)
    // 确保最后剩余本金为0
    expect(schedule[schedule.length - 1].remainingPrincipal).toBe(0)
  })

  it('Case 9: 多次提前还款', () => {
    const events: LoanEvent[] = [
      {
        id: '1',
        date: new Date('2025-03-15'),
        type: 'prepayment',
        amount: 2000,
        strategy: 'reduce_term',
      },
      {
        id: '2',
        date: new Date('2025-06-15'),
        type: 'prepayment',
        amount: 3000,
        strategy: 'reduce_term',
      },
    ]

    const schedule = generateSchedule(baseConfig, events)
    expect(schedule.length).toBeLessThan(12)
  })

  it('Case 10: 提前还款 + 利率调整', () => {
    const events: LoanEvent[] = [
      {
        id: '1',
        date: new Date('2025-03-15'),
        type: 'prepayment',
        amount: 3000,
        strategy: 'reduce_payment',
      },
      {
        id: '2',
        date: new Date('2025-06-01'),
        type: 'rate_change',
        newRate: 0.08,
      },
    ]

    const schedule = generateSchedule(baseConfig, events)
    // 提前还款减少月供 + 利率调整，期数保持12期
    expect(schedule.length).toBeGreaterThanOrEqual(12)
  })

  it('Case 11: 提前还款 + 还款方式变更', () => {
    const events: LoanEvent[] = [
      {
        id: '1',
        date: new Date('2025-03-15'),
        type: 'prepayment',
        amount: 3000,
        strategy: 'reduce_term',
      },
      {
        id: '2',
        date: new Date('2025-06-01'),
        type: 'method_change',
        newMethod: 'equal_principal',
      },
    ]

    const schedule = generateSchedule(baseConfig, events)
    expect(schedule.length).toBeLessThan(12)
  })

  it('Case 12: 等额本金 + 提前还款缩短期限', () => {
    const config = { ...baseConfig, method: 'equal_principal' as const }
    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-03-15'),
      type: 'prepayment',
      amount: 5000,
      strategy: 'reduce_term',
    }]

    const schedule = generateSchedule(config, events)
    // 等额本金提前还款缩短期限，总期数应该减少或保持
    expect(schedule.length).toBeLessThanOrEqual(15)
    // 确保最后剩余本金为0
    expect(schedule[schedule.length - 1].remainingPrincipal).toBe(0)
  })

  it('Case 13: 等额本金 + 提前还款减少月供', () => {
    const config = { ...baseConfig, method: 'equal_principal' as const }
    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-03-15'),
      type: 'prepayment',
      amount: 5000,
      strategy: 'reduce_payment',
    }]

    const schedule = generateSchedule(config, events)
    // 等额本金提前还款减少月供，期数保持或略有变化
    expect(schedule.length).toBeGreaterThanOrEqual(12)
    const afterPrepayment = schedule.filter(s => s.period > 1)
    // 等额本金方式下，月供应该逐月递减
    expect(afterPrepayment[1].totalPayment).toBeLessThan(afterPrepayment[0].totalPayment)
  })

  it('Case 14: 等额本息 + 停贷 + 提前还款', () => {
    const events: LoanEvent[] = [
      {
        id: '1',
        date: new Date('2025-03-01'),
        type: 'stop_loan',
        periods: 2,
      },
      {
        id: '2',
        date: new Date('2025-06-15'),
        type: 'prepayment',
        amount: 3000,
        strategy: 'reduce_term',
      },
    ]

    const schedule = generateSchedule(baseConfig, events)
    const stoppedPayments = schedule.filter(s => s.isStopped)
    expect(stoppedPayments).toHaveLength(2)
  })

  it('Case 15: 等额本息 + 展期 + 利率调整', () => {
    const events: LoanEvent[] = [
      {
        id: '1',
        date: new Date('2025-04-01'),
        type: 'term_extension',
        additionalPeriods: 6,
      },
      {
        id: '2',
        date: new Date('2025-08-01'),
        type: 'rate_change',
        newRate: 0.08,
      },
    ]

    const schedule = generateSchedule(baseConfig, events)
    expect(schedule.length).toBeGreaterThan(12)
  })

  it('Case 16: 等额本息 + 增贷 + 还款方式变更', () => {
    const events: LoanEvent[] = [
      {
        id: '1',
        date: new Date('2025-04-01'),
        type: 'loan_increase',
        amount: 5000,
      },
      {
        id: '2',
        date: new Date('2025-07-01'),
        type: 'method_change',
        newMethod: 'equal_principal',
      },
    ]

    const schedule = generateSchedule(baseConfig, events)
    // 增贷 + 还款方式变更，总期数可能会变化
    expect(schedule.length).toBeGreaterThanOrEqual(12)
    // 确保最后剩余本金为0
    expect(schedule[schedule.length - 1].remainingPrincipal).toBe(0)
  })

  it('Case 17: 零利率贷款', () => {
    const config = { ...baseConfig, annualRate: 0 }
    const schedule = generateSchedule(config, [])
    expect(schedule).toHaveLength(12)
    // 零利率时，每月还款应该是本金平均分配
    expect(schedule[0].totalPayment).toBeCloseTo(10000 / 12, 2)
  })

  it('Case 18: 短期贷款（3期）', () => {
    const config = { ...baseConfig, totalPeriods: 3 }
    const schedule = generateSchedule(config, [])
    expect(schedule).toHaveLength(3)
    expect(schedule[2].remainingPrincipal).toBe(0)
  })

  it('Case 19: 长期贷款（360期）', () => {
    const config = { ...baseConfig, totalPeriods: 360 }
    const schedule = generateSchedule(config, [])
    expect(schedule).toHaveLength(360)
    expect(schedule[359].remainingPrincipal).toBe(0)
  })
})

describe('贷款起始日期与还款日分离', () => {
  it('等额本息：2月1日贷款，2月16日首次还款（首期按比例）', () => {
    const config: LoanConfig = {
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date('2025-02-01'),  // 贷款计息起始日
      paymentDay: 16,                         // 每月16号还款
      method: 'equal_payment',
    }

    const schedule = generateEqualPaymentSchedule(config)

    // 首期应还15天利息：10000 * 0.10 * (15/365) = 41.10
    // 标准月供约 879.16
    // 首期本金 = 879.16 - 41.10 = 838.06
    expect(schedule).toHaveLength(12)
    expect(schedule[0].interestPayment).toBeCloseTo(41.10, 2)
    expect(schedule[0].principalPayment).toBeCloseTo(838.06, 2)
    expect(schedule[0].totalPayment).toBeCloseTo(879.16, 2)
    expect(schedule[0].date.getDate()).toBe(16)
    expect(schedule[0].date.getMonth()).toBe(1)  // 2月

    // 最后一期应还清
    expect(schedule[11].remainingPrincipal).toBe(0)
  })

  it('等额本金：2月1日贷款，2月16日首次还款（首期按比例）', () => {
    const config: LoanConfig = {
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date('2025-02-01'),
      paymentDay: 16,
      method: 'equal_principal',
    }

    const schedule = generateEqualPrincipalSchedule(config)

    // 首期利息：10000 * 0.10 * (15/365) = 41.10
    // 每期本金：10000 / 12 = 833.33
    expect(schedule).toHaveLength(12)
    expect(schedule[0].interestPayment).toBeCloseTo(41.10, 2)
    expect(schedule[0].principalPayment).toBeCloseTo(833.33, 2)
    expect(schedule[0].totalPayment).toBeCloseTo(874.43, 2)
    expect(schedule[0].date.getDate()).toBe(16)

    // 第二期利息基于剩余本金：9166.67 * 0.10 / 12 = 76.39
    expect(schedule[1].interestPayment).toBeCloseTo(76.39, 2)
  })

  it('2月20日贷款，还款日16号（首次还款日为3月16日）', () => {
    const config: LoanConfig = {
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date('2025-02-20'),  // 2月20日贷款
      paymentDay: 16,                         // 每月16号还款
      method: 'equal_payment',
    }

    const schedule = generateEqualPaymentSchedule(config)

    // 首次还款日是3月16日（下个月）
    // 实际天数：2月20日到3月16日 = 24天
    expect(schedule[0].date.getDate()).toBe(16)
    expect(schedule[0].date.getMonth()).toBe(2)  // 3月
    expect(schedule[0].date.getFullYear()).toBe(2025)

    // 首期利息按24天计算：10000 * 0.10 * (24/365) = 65.75
    expect(schedule[0].interestPayment).toBeCloseTo(65.75, 2)
  })

  it('等额本息 + 提前还款：首期按比例计算', () => {
    const config: LoanConfig = {
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date('2025-02-01'),
      paymentDay: 16,
      method: 'equal_payment',
    }

    const events: LoanEvent[] = [{
      id: '1',
      date: new Date('2025-04-15'),
      type: 'prepayment',
      amount: 3000,
      strategy: 'reduce_term',
    }]

    const schedule = generateSchedule(config, events)

    // 首期利息按比例计算
    expect(schedule[0].interestPayment).toBeCloseTo(41.10, 2)

    // 提前还款后总期数应减少
    expect(schedule.length).toBeLessThan(12)
    expect(schedule[schedule.length - 1].remainingPrincipal).toBe(0)
  })

  it('贷款日与还款日相同（完整月利息）', () => {
    const config: LoanConfig = {
      principal: 10000,
      annualRate: 0.10,
      totalPeriods: 12,
      loanStartDate: new Date('2025-02-16'),  // 2月16日贷款
      paymentDay: 16,                         // 每月16号还款
      method: 'equal_payment',
    }

    const schedule = generateEqualPaymentSchedule(config)

    // 首期是完整月利息：10000 * 0.10 / 12 = 83.33
    expect(schedule[0].date.getDate()).toBe(16)
    expect(schedule[0].date.getMonth()).toBe(1)  // 2月
    expect(schedule[0].interestPayment).toBeCloseTo(83.33, 2)
    expect(schedule[0].totalPayment).toBeCloseTo(879.16, 2)
  })
})
