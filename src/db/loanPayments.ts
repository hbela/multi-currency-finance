import { db } from './db';
import { LoanPayment } from '../types';
import { generateId } from '../utils/id';

export const listPaymentsForLoan = (loanId: string): Promise<LoanPayment[]> =>
  db.getAllAsync<LoanPayment>(
    'SELECT * FROM loan_payments WHERE loanId = ? ORDER BY paymentDate DESC',
    [loanId]
  );

export const getPayment = (id: string): Promise<LoanPayment | null> =>
  db
    .getFirstAsync<LoanPayment>('SELECT * FROM loan_payments WHERE id = ?', [id])
    .then((r) => r ?? null);

export interface CreatePaymentInput {
  loanId: string;
  transactionId?: string | null;
  paymentDate: number;
  principalPaid: string;
  interestPaid: string;
  totalPaid: string;
  remainingBalance: string;
}

export const createPayment = async (input: CreatePaymentInput): Promise<LoanPayment> => {
  const id = generateId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO loan_payments
       (id, loanId, transactionId, paymentDate, principalPaid, interestPaid,
        totalPaid, remainingBalance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.loanId,
      input.transactionId ?? null,
      input.paymentDate,
      input.principalPaid,
      input.interestPaid,
      input.totalPaid,
      input.remainingBalance,
      now,
    ]
  );
  return (await getPayment(id))!;
};

export const deletePayment = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM loan_payments WHERE id = ?', [id]);
};

/** Amortisation helper — monthly payment (PMT formula). */
export const calcMonthlyPayment = (
  principal: number,
  annualRatePct: number,
  termMonths: number
): number => {
  if (annualRatePct === 0) return Math.round((principal / termMonths) * 100) / 100;
  const r = annualRatePct / 100 / 12;
  const pmt = (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
  return Math.round(pmt * 100) / 100;
};

/** Split a payment into principal + interest portions given current remaining balance. */
export const splitPayment = (
  totalPayment: number,
  remainingBalance: number,
  annualRatePct: number
): { principalPaid: number; interestPaid: number } => {
  const interestPaid = Math.round(remainingBalance * (annualRatePct / 100 / 12) * 100) / 100;
  const principalPaid = Math.round((totalPayment - interestPaid) * 100) / 100;
  return { principalPaid, interestPaid };
};
