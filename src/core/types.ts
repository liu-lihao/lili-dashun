import { z } from 'zod'

// ==================== 枚举类型 ====================

export const RepaymentMethod = z.enum(['equal_payment', 'equal_principal'])
export type RepaymentMethod = z.infer<typeof RepaymentMethod>

export const PrepaymentStrategy = z.enum(['reduce_term', 'reduce_payment'])
export type PrepaymentStrategy = z.infer<typeof PrepaymentStrategy>

// ==================== 贷款配置 ====================

export const LoanConfig = z.object({
  principal: z.number().positive('本金必须大于0'),
  annualRate: z.number().positive('年利率必须大于0'),
  totalPeriods: z.number().int().positive('期数必须为正整数'),
  loanStartDate: z.date(), // 贷款计息起始日
  paymentDay: z.number().int().min(1).max(31), // 每月还款日（1-31）
  method: RepaymentMethod,
})

export type LoanConfig = z.infer<typeof LoanConfig>

// ==================== 事件类型 ====================

const BaseEvent = z.object({
  id: z.string().uuid(),
  date: z.date(),
})

export const PrepaymentEvent = BaseEvent.extend({
  type: z.literal('prepayment'),
  amount: z.number().positive('还款金额必须大于0'),
  strategy: PrepaymentStrategy,
  newMethod: RepaymentMethod.optional(),
})
export type PrepaymentEvent = z.infer<typeof PrepaymentEvent>

export const RateChangeEvent = BaseEvent.extend({
  type: z.literal('rate_change'),
  newRate: z.number().positive('新利率必须大于0'),
})
export type RateChangeEvent = z.infer<typeof RateChangeEvent>

export const MethodChangeEvent = BaseEvent.extend({
  type: z.literal('method_change'),
  newMethod: RepaymentMethod,
})
export type MethodChangeEvent = z.infer<typeof MethodChangeEvent>

export const StopLoanEvent = BaseEvent.extend({
  type: z.literal('stop_loan'),
  periods: z.number().int().positive('停贷期数必须为正整数'),
})
export type StopLoanEvent = z.infer<typeof StopLoanEvent>

export const TermExtensionEvent = BaseEvent.extend({
  type: z.literal('term_extension'),
  additionalPeriods: z.number().int().positive('展期月数必须为正整数'),
})
export type TermExtensionEvent = z.infer<typeof TermExtensionEvent>

export const LoanIncreaseEvent = BaseEvent.extend({
  type: z.literal('loan_increase'),
  amount: z.number().positive('增贷金额必须大于0'),
})
export type LoanIncreaseEvent = z.infer<typeof LoanIncreaseEvent>

export const FullSettlementEvent = BaseEvent.extend({
  type: z.literal('full_settlement'),
})
export type FullSettlementEvent = z.infer<typeof FullSettlementEvent>

export const LoanEvent = z.discriminatedUnion('type', [
  PrepaymentEvent,
  RateChangeEvent,
  MethodChangeEvent,
  StopLoanEvent,
  TermExtensionEvent,
  LoanIncreaseEvent,
  FullSettlementEvent,
])
export type LoanEvent = z.infer<typeof LoanEvent>

// ==================== 还款计划项 ====================

export const PaymentItem = z.object({
  period: z.number().int().positive(),
  date: z.date(),
  totalPayment: z.number(),
  principalPayment: z.number(),
  interestPayment: z.number(),
  remainingPrincipal: z.number(),
  isStopped: z.boolean().optional(),
})
export type PaymentItem = z.infer<typeof PaymentItem>

// ==================== 内部状态 ====================

export interface LoanState {
  principal: number
  annualRate: number
  remainingPeriods: number
  method: RepaymentMethod
  monthlyPayment?: number  // 等额本息时的月供
  stoppedPeriods?: number  // 剩余停贷期数
  principalPerPeriod?: number  // 等额本金时的每期本金（固定不变）
  originalTotalPeriods: number  // 原始总期数，用于计算等额本金每期本金
}

// ==================== 多贷款支持 ====================

// 多贷款支持：带元数据的贷款配置
export interface LoanConfigWithMeta extends LoanConfig {
  id: string;
  name: string;
  color: string;
  events: LoanEvent[];
}

// 合并后的还款计划项
export interface MergedPaymentItem {
  date: Date;
  period: number;
  loans: LoanPaymentDetail[];
  events: ScheduledEvent[];
  totalPaymentSum: number;
  principalPaymentSum: number;
  interestPaymentSum: number;
  remainingPrincipalSum: number;
}

export interface LoanPaymentDetail {
  loanId: string;
  loanName: string;
  loanColor: string;
  totalPayment: number;
  principalPayment: number;
  interestPayment: number;
  remainingPrincipal: number;
}

export interface ScheduledEvent {
  loanId: string;
  loanName: string;
  loanColor: string;
  event: LoanEvent;
  position: 'before' | 'on' | 'between';
}

// 预设颜色列表
export const LOAN_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#F59E0B', // amber-500
  '#06B6D4', // cyan-500
  '#EC4899', // pink-500
  '#EAB308', // yellow-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
];
