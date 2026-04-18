import React from 'react';
import { useLoanStore } from '../../store/loanStore';
import { Plus, Trash2 } from 'lucide-react';

interface LoanSidebarProps {
  onAddLoan: () => void;
}

export const LoanSidebar: React.FC<LoanSidebarProps> = ({ onAddLoan }) => {
  const { loans, selectedLoanId, selectLoan, removeLoan } = useLoanStore();

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          贷款列表
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loans.map((loan) => (
          <div
            key={loan.id}
            onClick={() => selectLoan(loan.id)}
            className={`
              flex items-center gap-3 px-4 py-3 cursor-pointer
              hover:bg-gray-100 dark:hover:bg-gray-800
              ${selectedLoanId === loan.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''}
            `}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: loan.color }}
            />
            <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
              {loan.name || '未命名贷款'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeLoan(loan.id);
              }}
              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onAddLoan}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <Plus size={16} />
          添加贷款
        </button>
      </div>
    </div>
  );
};
