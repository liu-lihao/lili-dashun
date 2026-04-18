import React, { useState, useMemo, memo } from 'react';
import { useLoanStore } from '../../store/loanStore';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';
import { EventIndicator } from '../EventIndicator';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MergedPaymentItem } from '../../core/types';

interface PaymentTableProps {
  isMobile?: boolean;
}

// 累计值计算缓存
interface CumulativeCache {
  totalPayment: number;
  principalPayment: number;
  interestPayment: number;
}

// 计算单个贷款累计值
function calculateLoanCumulative(
  mergedSchedule: MergedPaymentItem[],
  loanId: string,
  upToIndex: number
): CumulativeCache {
  return mergedSchedule.slice(0, upToIndex + 1).reduce(
    (acc, scheduleItem) => {
      const loanDetail = scheduleItem.loans.find(l => l.loanId === loanId);
      if (loanDetail) {
        acc.totalPayment += loanDetail.totalPayment;
        acc.principalPayment += loanDetail.principalPayment;
        acc.interestPayment += loanDetail.interestPayment;
      }
      return acc;
    },
    { totalPayment: 0, principalPayment: 0, interestPayment: 0 }
  );
}

// 计算总计累计值
function calculateTotalCumulative(
  mergedSchedule: MergedPaymentItem[],
  upToIndex: number
): CumulativeCache {
  return mergedSchedule.slice(0, upToIndex + 1).reduce(
    (acc, scheduleItem) => {
      acc.totalPayment += scheduleItem.totalPaymentSum;
      acc.principalPayment += scheduleItem.principalPaymentSum;
      acc.interestPayment += scheduleItem.interestPaymentSum;
      return acc;
    },
    { totalPayment: 0, principalPayment: 0, interestPayment: 0 }
  );
}

// 桌面端行组件 - 使用 memo 避免不必要的重渲染
interface DesktopTableRowProps {
  item: MergedPaymentItem;
  index: number;
  totalCount: number;
  cumulative: CumulativeCache;
  mergedSchedule: MergedPaymentItem[];
}

const DesktopTableRow = memo<DesktopTableRowProps>(function DesktopTableRow({
  item,
  index,
  totalCount,
  cumulative,
  mergedSchedule,
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr
      className="hover:bg-gray-50 dark:hover:bg-gray-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td className="px-2 py-3">
        <EventIndicator events={item.events} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
        {item.period}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
        {format(item.date, 'yyyy-MM-dd')}
      </td>
      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
        {formatCurrency(item.totalPaymentSum)}
      </td>
      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 relative">
        {formatCurrency(item.remainingPrincipalSum)}

        {isHovered && (
          <DesktopHoverTooltip
            item={item}
            index={index}
            totalCount={totalCount}
            cumulative={cumulative}
            mergedSchedule={mergedSchedule}
          />
        )}
      </td>
    </tr>
  );
});

// 桌面端 Hover 提示组件
interface DesktopHoverTooltipProps {
  item: MergedPaymentItem;
  index: number;
  totalCount: number;
  cumulative: CumulativeCache;
  mergedSchedule: MergedPaymentItem[];
}

const DesktopHoverTooltip = memo<DesktopHoverTooltipProps>(function DesktopHoverTooltip({
  item,
  index,
  totalCount,
  cumulative,
  mergedSchedule,
}) {
  return (
    <div
      className={`absolute right-full z-50 w-80 max-h-[60vh] overflow-y-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mr-2 ${
        index > (totalCount / 2) ? 'bottom-0' : 'top-0'
      }`}
    >
      {item.loans.map((loan) => {
        const loanCumulative = calculateLoanCumulative(mergedSchedule, loan.loanId, index);
        return (
          <div key={loan.loanId} className="mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: loan.loanColor }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {loan.loanName}
              </span>
            </div>
            <div className="ml-5 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div className="font-medium text-gray-700 dark:text-gray-300">本期还款：{formatCurrency(loan.totalPayment)}</div>
              <div className="text-gray-400">├─ 本金：{formatCurrency(loan.principalPayment)}</div>
              <div className="text-gray-400">└─ 利息：{formatCurrency(loan.interestPayment)}</div>
              <div className="font-medium text-gray-700 dark:text-gray-300">剩余本金：{formatCurrency(loan.remainingPrincipal)}</div>
              <div className="text-gray-400">├─ 累计已还本金：{formatCurrency(loanCumulative.principalPayment)}</div>
              <div className="text-gray-400">└─ 累计已付利息：{formatCurrency(loanCumulative.interestPayment)}</div>
              <div className="text-gray-400">累计还款：{formatCurrency(loanCumulative.totalPayment)}</div>
            </div>
          </div>
        );
      })}

      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        合计
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div className="font-medium text-gray-700 dark:text-gray-300">本期总还款：{formatCurrency(item.totalPaymentSum)}</div>
        <div className="text-gray-400">├─ 本金：{formatCurrency(item.principalPaymentSum)}</div>
        <div className="text-gray-400">└─ 利息：{formatCurrency(item.interestPaymentSum)}</div>
        <div className="font-medium text-gray-700 dark:text-gray-300">剩余本金：{formatCurrency(item.remainingPrincipalSum)}</div>
        <div className="text-gray-400">├─ 累计已还本金：{formatCurrency(cumulative.principalPayment)}</div>
        <div className="text-gray-400">└─ 累计已付利息：{formatCurrency(cumulative.interestPayment)}</div>
        <div className="text-gray-400">累计还款：{formatCurrency(cumulative.totalPayment)}</div>
      </div>
    </div>
  );
});

// 移动端卡片行组件
interface MobileCardRowProps {
  item: MergedPaymentItem;
  index: number;
  cumulative: CumulativeCache;
  mergedSchedule: MergedPaymentItem[];
}

const MobileCardRow = memo<MobileCardRowProps>(function MobileCardRow({
  item,
  index,
  cumulative,
  mergedSchedule,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800">
      <div
        className="p-4 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <EventIndicator events={item.events} />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              第 {item.period} 期
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(item.date, 'yyyy-MM-dd')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(item.totalPaymentSum)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              余 {formatCurrency(item.remainingPrincipalSum)}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <MobileExpandedDetails
          item={item}
          index={index}
          cumulative={cumulative}
          mergedSchedule={mergedSchedule}
        />
      )}
    </div>
  );
});

// 移动端展开详情组件
interface MobileExpandedDetailsProps {
  item: MergedPaymentItem;
  index: number;
  cumulative: CumulativeCache;
  mergedSchedule: MergedPaymentItem[];
}

const MobileExpandedDetails = memo<MobileExpandedDetailsProps>(function MobileExpandedDetails({
  item,
  index,
  cumulative,
  mergedSchedule,
}) {
  return (
    <div className="px-4 pb-4 space-y-4 bg-gray-50 dark:bg-gray-700/30">
      {item.loans.map((loan) => {
        const loanCumulative = calculateLoanCumulative(mergedSchedule, loan.loanId, index);

        return (
          <div key={loan.loanId} className="pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: loan.loanColor }}
              />
              <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                {loan.loanName}
              </span>
            </div>
            <div className="ml-5 space-y-1 text-xs">
              <div className="font-medium text-gray-700 dark:text-gray-200">
                本期还款：{formatCurrency(loan.totalPayment)}
              </div>
              <div className="text-gray-500 dark:text-gray-400 pl-2">
                ├─ 本金：{formatCurrency(loan.principalPayment)}
              </div>
              <div className="text-gray-500 dark:text-gray-400 pl-2">
                └─ 利息：{formatCurrency(loan.interestPayment)}
              </div>
              <div className="text-gray-700 dark:text-gray-200">
                剩余本金：{formatCurrency(loan.remainingPrincipal)}
              </div>
              <div className="text-gray-500 dark:text-gray-400 pl-2">
                ├─ 累计已还本金：{formatCurrency(loanCumulative.principalPayment)}
              </div>
              <div className="text-gray-500 dark:text-gray-400 pl-2">
                └─ 累计已付利息：{formatCurrency(loanCumulative.interestPayment)}
              </div>
            </div>
          </div>
        );
      })}

      <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
          累计合计
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-medium text-gray-700 dark:text-gray-200">
            本期总还款：{formatCurrency(item.totalPaymentSum)}
          </div>
          <div className="text-gray-500 dark:text-gray-400 pl-2">
            ├─ 本金：{formatCurrency(item.principalPaymentSum)}
          </div>
          <div className="text-gray-500 dark:text-gray-400 pl-2">
            └─ 利息：{formatCurrency(item.interestPaymentSum)}
          </div>
          <div className="text-gray-700 dark:text-gray-200">
            剩余本金：{formatCurrency(item.remainingPrincipalSum)}
          </div>
          <div className="text-gray-500 dark:text-gray-400 pl-2">
            ├─ 累计已还本金：{formatCurrency(cumulative.principalPayment)}
          </div>
          <div className="text-gray-500 dark:text-gray-400 pl-2">
            └─ 累计已付利息：{formatCurrency(cumulative.interestPayment)}
          </div>
        </div>
      </div>
    </div>
  );
});

export const PaymentTable: React.FC<PaymentTableProps> = ({ isMobile }) => {
  const { mergedSchedule } = useLoanStore();

  // 预计算所有累计值，避免每行重复计算
  const cumulativeCache = useMemo(() => {
    if (!mergedSchedule) return [];
    return mergedSchedule.map((_, index) =>
      calculateTotalCumulative(mergedSchedule, index)
    );
  }, [mergedSchedule]);

  if (!mergedSchedule || mergedSchedule.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        暂无数据，请先添加贷款
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {mergedSchedule.map((item, index) => (
          <MobileCardRow
            key={item.period}
            item={item}
            index={index}
            cumulative={cumulativeCache[index]}
            mergedSchedule={mergedSchedule}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="w-8"></th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              期数
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              日期
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              总还款
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              剩余本金
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {mergedSchedule.map((item, index) => (
            <DesktopTableRow
              key={item.period}
              item={item}
              index={index}
              totalCount={mergedSchedule.length}
              cumulative={cumulativeCache[index]}
              mergedSchedule={mergedSchedule}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
