import React from 'react';
import { useLoanStore } from '../../store/loanStore';
import { Plus, Trash2 } from 'lucide-react';

interface LoanSidebarProps {
  onAddLoan: () => void;
  onLoanSelect?: () => void;
  isMobile?: boolean;
}

export const LoanSidebar: React.FC<LoanSidebarProps> = ({ onAddLoan, onLoanSelect, isMobile }) => {
  const { loans, selectedLoanId, selectLoan, removeLoan } = useLoanStore();

  const handleLoanClick = (loanId: string) => {
    selectLoan(loanId);
    onLoanSelect?.();
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* 添加贷款按钮 */}
        <button
          onClick={onAddLoan}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <Plus size={18} />
          添加新贷款
        </button>

        {/* 贷款列表 */}
        {loans.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-4 opacity-30">🏦</div>
            <p className="text-sm">还没有贷款</p>
            <p className="text-xs mt-1 opacity-70">点击上方按钮添加</p>
          </div>
        ) : (
          <div className="space-y-2">
            {loans.map((loan) => (
              <div
                key={loan.id}
                onClick={() => handleLoanClick(loan.id)}
                className={`
                  flex items-center gap-3 p-4 rounded-xl cursor-pointer
                  border transition-all
                  ${selectedLoanId === loan.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }
                `}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: loan.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {loan.name || '未命名贷款'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ¥{loan.principal.toLocaleString()} · {(loan.annualRate * 100).toFixed(2)}%
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLoan(loan.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop layout (original)
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
            onClick={() => handleLoanClick(loan.id)}
            className={`
              group flex items-center gap-3 px-4 py-3 cursor-pointer
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
              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer"
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
