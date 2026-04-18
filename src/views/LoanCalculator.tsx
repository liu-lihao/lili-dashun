import React from 'react';
import { useLoanStore } from '../store/loanStore';
import { LoanSidebar } from '../components/LoanSidebar';
import { LoanForm } from '../components/LoanForm';
import { PaymentTable } from '../components/PaymentTable';
import { EventEditor } from '../components/EventEditor';
import { EventList } from '../components/EventList';

export const LoanCalculator: React.FC = () => {
  const { loans, selectedLoanId, addLoan } = useLoanStore();

  const handleAddLoan = () => {
    // 添加默认贷款并选中
    addLoan({
      name: `贷款 ${loans.length + 1}`,
      principal: 1000000,
      annualRate: 0.039,
      totalPeriods: 360,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部标题栏 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          多贷款计算（纯本地计算和缓存，无任何请求）
        </h1>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 - 贷款列表 */}
        <LoanSidebar onAddLoan={handleAddLoan} />

        {/* 中间配置区 - 贷款详情 */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {selectedLoanId ? (
            <div className="p-4 space-y-6">
              <LoanForm loanId={selectedLoanId} />
              <EventEditor loanId={selectedLoanId} />
              <EventList loanId={selectedLoanId} />
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              请选择一个贷款或添加新贷款
            </div>
          )}
        </div>

        {/* 右侧表格区 - 还款计划 */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          <PaymentTable />
        </div>
      </div>
    </div>
  );
};
