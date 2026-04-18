import React, { useState } from 'react';
import { useLoanStore } from '../../store/loanStore';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';
import { EventIndicator } from '../EventIndicator';

export const PaymentTable: React.FC = () => {
  const { mergedSchedule } = useLoanStore();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const tableRef = React.useRef<HTMLDivElement>(null);

  if (!mergedSchedule || mergedSchedule.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        暂无数据，请先添加贷款
      </div>
    );
  }

  return (
    <div ref={tableRef} className="overflow-x-auto">
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
            <tr
              key={index}
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
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

                {/* Hover 详情 - 智能定位：根据行位置决定向上或向下展开 */}
                {hoveredRow === index && (
                  <div
                    className={`absolute right-full z-50 w-80 max-h-[60vh] overflow-y-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mr-2 ${
                      index > (mergedSchedule.length / 2) ? 'bottom-0' : 'top-0'
                    }`}
                  >
                    {/* 各贷款详情 */}
                    {item.loans.map((loan) => {
                      // 计算该贷款从第0期到当前期的累计值
                      const cumulative = mergedSchedule.slice(0, index + 1).reduce(
                        (acc, scheduleItem) => {
                          const loanDetail = scheduleItem.loans.find(l => l.loanId === loan.loanId);
                          if (loanDetail) {
                            acc.totalPayment += loanDetail.totalPayment;
                            acc.principalPayment += loanDetail.principalPayment;
                            acc.interestPayment += loanDetail.interestPayment;
                          }
                          return acc;
                        },
                        { totalPayment: 0, principalPayment: 0, interestPayment: 0 }
                      );
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
                            <div>本期还款：{formatCurrency(loan.totalPayment)}</div>
                            <div className="text-gray-400">累计本金：{formatCurrency(cumulative.principalPayment)}</div>
                            <div className="text-gray-400">累计利息：{formatCurrency(cumulative.interestPayment)}</div>
                            <div className="text-gray-400">累计还款：{formatCurrency(cumulative.totalPayment)}</div>
                            <div>剩余本金：{formatCurrency(loan.remainingPrincipal)}</div>
                          </div>
                        </div>
                      );
                    })}

                    {/* 分隔线 */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

                    {/* 总计 */}
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      合计
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>本期总还款：{formatCurrency(item.totalPaymentSum)}</div>
                      <div className="text-gray-400">累计本金：{formatCurrency(mergedSchedule.slice(0, index + 1).reduce((sum, s) => sum + s.principalPaymentSum, 0))}</div>
                      <div className="text-gray-400">累计利息：{formatCurrency(mergedSchedule.slice(0, index + 1).reduce((sum, s) => sum + s.interestPaymentSum, 0))}</div>
                      <div className="text-gray-400">累计还款：{formatCurrency(mergedSchedule.slice(0, index + 1).reduce((sum, s) => sum + s.totalPaymentSum, 0))}</div>
                      <div>剩余本金：{formatCurrency(item.remainingPrincipalSum)}</div>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
