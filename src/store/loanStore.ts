import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  LoanConfig,
  LoanEvent,
  LoanConfigWithMeta,
  MergedPaymentItem,
} from '../core/types';
import { LOAN_COLORS } from '../core/types';
import { generateMergedSchedule } from '../core/mergeSchedule';

interface LoanStore {
  loans: LoanConfigWithMeta[];
  selectedLoanId: string | null;
  mergedSchedule: MergedPaymentItem[] | null;

  // Actions
  addLoan: (loan: Omit<LoanConfigWithMeta, 'id' | 'color' | 'events'>) => string;
  removeLoan: (id: string) => void;
  updateLoan: (id: string, updates: Partial<LoanConfig>) => void;
  selectLoan: (id: string | null) => void;
  addEvent: (loanId: string, event: Omit<LoanEvent, 'id'>) => void;
  removeEvent: (loanId: string, eventId: string) => void;
  updateEvent: (loanId: string, eventId: string, updates: Partial<LoanEvent>) => void;
  calculate: () => void;
  reorderLoans: (fromIndex: number, toIndex: number) => void;
}

// 获取下一个可用颜色
function getNextColor(existingLoans: LoanConfigWithMeta[]): string {
  const usedColors = new Set(existingLoans.map((l) => l.color));
  for (const color of LOAN_COLORS) {
    if (!usedColors.has(color)) {
      return color;
    }
  }
  // 如果所有颜色都用过了，循环使用
  return LOAN_COLORS[existingLoans.length % LOAN_COLORS.length];
}

export const useLoanStore = create<LoanStore>()(
  immer(
    persist(
      (set, get) => ({
        loans: [],
        selectedLoanId: null,
        mergedSchedule: null,

        addLoan: (loan) => {
          const id = uuidv4();
          const color = getNextColor(get().loans);

          set((state) => {
            state.loans.push({
              ...loan,
              id,
              color,
              events: [],
            });
            state.selectedLoanId = id;
          });

          get().calculate();
          return id;
        },

        removeLoan: (id) => {
          set((state) => {
            state.loans = state.loans.filter((l) => l.id !== id);
            if (state.selectedLoanId === id) {
              state.selectedLoanId = state.loans[0]?.id ?? null;
            }
          });
          get().calculate();
        },

        updateLoan: (id, updates) => {
          set((state) => {
            const loan = state.loans.find((l) => l.id === id);
            if (loan) {
              Object.assign(loan, updates);
            }
          });
          get().calculate();
        },

        selectLoan: (id) => {
          set((state) => {
            state.selectedLoanId = id;
          });
        },

        addEvent: (loanId, event) => {
          const fullEvent = { ...event, id: uuidv4() } as LoanEvent;
          set((state) => {
            const loan = state.loans.find((l) => l.id === loanId);
            if (loan) {
              loan.events.push(fullEvent);
            }
          });
          get().calculate();
        },

        removeEvent: (loanId, eventId) => {
          set((state) => {
            const loan = state.loans.find((l) => l.id === loanId);
            if (loan) {
              loan.events = loan.events.filter((e) => e.id !== eventId);
            }
          });
          get().calculate();
        },

        updateEvent: (loanId, eventId, updates) => {
          set((state) => {
            const loan = state.loans.find((l) => l.id === loanId);
            if (loan) {
              const event = loan.events.find((e) => e.id === eventId);
              if (event) {
                Object.assign(event, updates);
              }
            }
          });
          get().calculate();
        },

        calculate: () => {
          const { loans } = get();
          if (loans.length === 0) {
            set((state) => {
              state.mergedSchedule = null;
            });
            return;
          }
          const schedule = generateMergedSchedule(loans);
          set((state) => {
            state.mergedSchedule = schedule;
          });
        },

        reorderLoans: (fromIndex, toIndex) => {
          set((state) => {
            const [moved] = state.loans.splice(fromIndex, 1);
            state.loans.splice(toIndex, 0, moved);
          });
        },
      }),
      {
        name: 'loan-calculator-data',
        version: 1,
        onRehydrateStorage: () => (state) => {
          // Date 对象在序列化后变成字符串，需要恢复为 Date
          if (state) {
            state.loans.forEach((loan) => {
              loan.loanStartDate = new Date(loan.loanStartDate);
              loan.events.forEach((event) => {
                event.date = new Date(event.date);
              });
            });
          }
        },
      }
    )
  )
);
