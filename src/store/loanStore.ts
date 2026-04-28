import { create } from 'zustand';
import { Loan, LoanPayment } from '../types';
import {
  listActiveLoans,
  createLoan,
  updateLoan,
  closeLoan,
  deleteLoan,
  CreateLoanInput,
} from '../db/loans';
import {
  listPaymentsForLoan,
  createPayment,
  deletePayment,
  CreatePaymentInput,
} from '../db/loanPayments';

interface LoanStore {
  items: Loan[];
  payments: Record<string, LoanPayment[]>;
  loading: boolean;

  load: () => Promise<void>;
  loadPayments: (loanId: string) => Promise<void>;

  add: (input: CreateLoanInput) => Promise<Loan>;
  update: (id: string, input: Partial<CreateLoanInput>) => Promise<void>;
  close: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;

  addPayment: (input: CreatePaymentInput) => Promise<LoanPayment>;
  removePayment: (loanId: string, paymentId: string) => Promise<void>;

  getById: (id: string) => Loan | undefined;
}

export const useLoanStore = create<LoanStore>((set, get) => ({
  items: [],
  payments: {},
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const items = await listActiveLoans();
      set({ items, loading: false });
    } catch (e) {
      set({ loading: false });
      console.error('[loanStore] load failed:', e);
    }
  },

  loadPayments: async (loanId) => {
    const list = await listPaymentsForLoan(loanId);
    set((s) => ({ payments: { ...s.payments, [loanId]: list } }));
  },

  add: async (input) => {
    const loan = await createLoan(input);
    set((s) => ({ items: [loan, ...s.items] }));
    return loan;
  },

  update: async (id, input) => {
    await updateLoan(id, input);
    const items = await listActiveLoans();
    set({ items });
  },

  close: async (id) => {
    await closeLoan(id);
    set((s) => ({ items: s.items.filter((l) => l.id !== id) }));
  },

  remove: async (id) => {
    await deleteLoan(id);
    set((s) => ({ items: s.items.filter((l) => l.id !== id) }));
  },

  addPayment: async (input) => {
    const payment = await createPayment(input);
    const existing = get().payments[input.loanId] ?? [];
    set((s) => ({
      payments: { ...s.payments, [input.loanId]: [payment, ...existing] },
    }));
    return payment;
  },

  removePayment: async (loanId, paymentId) => {
    await deletePayment(paymentId);
    set((s) => ({
      payments: {
        ...s.payments,
        [loanId]: (s.payments[loanId] ?? []).filter((p) => p.id !== paymentId),
      },
    }));
  },

  getById: (id) => get().items.find((l) => l.id === id),
}));
