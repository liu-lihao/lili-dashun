import React, { useRef, useEffect, useState } from 'react';
import { useLoanStore } from '../store/loanStore';
import { LoanSidebar } from '../components/LoanSidebar';
import { LoanForm } from '../components/LoanForm';
import { PaymentTable } from '../components/PaymentTable';
import { EventEditor } from '../components/EventEditor';
import { EventList } from '../components/EventList';
import { Menu, ChevronLeft, List, Settings, Table } from 'lucide-react';

// Tailwind md breakpoint is 768px
const MD_BREAKPOINT = 768;

export const LoanCalculator: React.FC = () => {
  const { loans, selectedLoanId, addLoan, selectLoan, mobileView, setMobileView, isSidebarOpen, toggleSidebar, closeSidebar } = useLoanStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loanButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Use state to track if we're on desktop (md and up)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= MD_BREAKPOINT;
  });

  // Listen for viewport changes to conditionally render desktop/mobile
  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    // Set initial value
    setIsDesktop(mediaQuery.matches);

    // Use addEventListener for modern browsers, fallback to addListener for older ones
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const handleAddLoan = () => {
    addLoan({
      name: `贷款 ${loans.length + 1}`,
      principal: 1000000,
      annualRate: 0.039,
      totalPeriods: 360,
      loanStartDate: new Date(),
      paymentDay: 1,
      method: 'equal_payment',
    });
    setMobileView('config');
  };

  const handleLoanSelect = () => {
    setMobileView('config');
    closeSidebar();
  };

  // 当切换到 config 视图时，滚动选中的贷款到可视区域
  useEffect(() => {
    if (mobileView === 'config' && selectedLoanId) {
      const selectedButton = loanButtonRefs.current.get(selectedLoanId);
      const scrollContainer = scrollContainerRef.current;
      if (selectedButton && scrollContainer) {
        const buttonRect = selectedButton.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();

        // 计算按钮相对于容器的偏移位置
        const buttonLeft = selectedButton.offsetLeft;
        const buttonWidth = buttonRect.width;
        const containerWidth = containerRect.width;

        // 滚动到居中位置
        const scrollPosition = buttonLeft - containerWidth / 2 + buttonWidth / 2;
        scrollContainer.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [mobileView, selectedLoanId]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Desktop: show on md and up */}
      {isDesktop && (
        <div className="flex flex-1 flex-col min-h-0">
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
      )}

      {/* Mobile: show below md */}
      {!isDesktop && (
        <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-gray-900 z-50">
          {/* 顶部标题栏 */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mobileView !== 'loans' && (
              <button
                onClick={() => setMobileView('loans')}
                className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {mobileView === 'loans' && '贷款列表'}
              {mobileView === 'config' && (selectedLoanId ? '贷款配置' : '选择贷款')}
              {mobileView === 'schedule' && '还款计划'}
            </h1>
          </div>
          {mobileView === 'loans' && (
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Menu size={20} />
            </button>
          )}
        </header>

        {/* 主内容区 */}
        <div className="flex-1 overflow-hidden relative">
          {/* 贷款列表视图 */}
          {mobileView === 'loans' && (
            <div className="h-full overflow-y-auto p-4">
              <LoanSidebar onAddLoan={handleAddLoan} onLoanSelect={handleLoanSelect} isMobile />
            </div>
          )}

          {/* 配置视图 */}
          {mobileView === 'config' && (
            <div className="h-full overflow-y-auto">
              {selectedLoanId ? (
                <div className="space-y-4 pb-4">
                  {/* 贷款切换器 */}
                  <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div ref={scrollContainerRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                      {loans.map((loan) => (
                        <button
                          key={loan.id}
                          ref={(el) => {
                            if (el) {
                              loanButtonRefs.current.set(loan.id, el);
                            }
                          }}
                          onClick={() => selectLoan(loan.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                            selectedLoanId === loan.id
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: loan.color }}
                          />
                          <span className="text-sm font-medium truncate max-w-[100px]">
                            {loan.name || '未命名'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 space-y-6 overflow-x-hidden">
                    <LoanForm loanId={selectedLoanId} />
                    <EventEditor loanId={selectedLoanId} />
                    <EventList loanId={selectedLoanId} />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 space-y-4">
                  <div className="text-6xl opacity-30">💰</div>
                  <p>请先选择或添加一个贷款</p>
                  <button
                    onClick={() => setMobileView('loans')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
                  >
                    去添加贷款
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 还款计划视图 */}
          {mobileView === 'schedule' && (
            <div className="h-full overflow-auto">
              <PaymentTable isMobile />
            </div>
          )}

          {/* 侧边栏抽屉（移动端） */}
          {isSidebarOpen && (
            <>
              <div
                className="absolute inset-0 bg-black/50 z-40"
                onClick={closeSidebar}
              />
              <div className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl z-50 p-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">关于</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  多贷款计算器是一个纯浏览器端运行的贷款还款计划计算器，支持同时管理多笔贷款，并可模拟提前还款、利率调整等事件对还款计划的影响。
                </p>
                <button
                  onClick={closeSidebar}
                  className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  关闭
                </button>
              </div>
            </>
          )}
        </div>

        {/* 底部导航栏 */}
        <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setMobileView('loans')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                mobileView === 'loans'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <List size={20} />
              <span className="text-xs">贷款</span>
            </button>
            <button
              onClick={() => setMobileView('config')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                mobileView === 'config'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Settings size={20} />
              <span className="text-xs">配置</span>
            </button>
            <button
              onClick={() => setMobileView('schedule')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                mobileView === 'schedule'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Table size={20} />
              <span className="text-xs">计划</span>
            </button>
          </div>
        </nav>
      </div>
      )}
    </div>
  );
};
