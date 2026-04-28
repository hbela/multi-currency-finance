import { db } from './db';
import { Loan, LoanType } from '../types';
import { generateId } from '../utils/id';

export const listLoans = (): Promise<Loan[]> =>
  db.getAllAsync<Loan>('SELECT * FROM loans ORDER BY created_at DESC');

export const listActiveLoans = (): Promise<Loan[]> =>
  db.getAllAsync<Loan>('SELECT * FROM loans WHERE isActive = 1 ORDER BY created_at DESC');

export const getLoan = (id: string): Promise<Loan | null> =>
  db
    .getFirstAsync<Loan>('SELECT * FROM loans WHERE id = ?', [id])
    .then((r) => r ?? null);

export interface CreateLoanInput {
  accountId: string;
  name: string;
  principalAmount: string;
  currency: string;
  interestRate: string;
  startDate: number;
  termMonths: number;
  loanType: LoanType;
  lender?: string | null;
  notes?: string | null;
}

export const createLoan = async (input: CreateLoanInput): Promise<Loan> => {
  const id = generateId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO loans
       (id, accountId, name, principalAmount, currency, interestRate,
        startDate, termMonths, loanType, lender, notes, isActive, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      input.accountId,
      input.name,
      input.principalAmount,
      input.currency,
      input.interestRate,
      input.startDate,
      input.termMonths,
      input.loanType,
      input.lender ?? null,
      input.notes ?? null,
      now,
      now,
    ]
  );
  return (await getLoan(id))!;
};

export const updateLoan = async (id: string, input: Partial<CreateLoanInput>): Promise<void> => {
  const now = Date.now();
  const fields: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [now];

  if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
  if (input.principalAmount !== undefined) { fields.push('principalAmount = ?'); values.push(input.principalAmount); }
  if (input.currency !== undefined) { fields.push('currency = ?'); values.push(input.currency); }
  if (input.interestRate !== undefined) { fields.push('interestRate = ?'); values.push(input.interestRate); }
  if (input.startDate !== undefined) { fields.push('startDate = ?'); values.push(input.startDate); }
  if (input.termMonths !== undefined) { fields.push('termMonths = ?'); values.push(input.termMonths); }
  if (input.loanType !== undefined) { fields.push('loanType = ?'); values.push(input.loanType); }
  if (input.lender !== undefined) { fields.push('lender = ?'); values.push(input.lender ?? null); }
  if (input.notes !== undefined) { fields.push('notes = ?'); values.push(input.notes ?? null); }
  if (input.accountId !== undefined) { fields.push('accountId = ?'); values.push(input.accountId); }

  await db.runAsync(`UPDATE loans SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
};

export const closeLoan = async (id: string): Promise<void> => {
  await db.runAsync(
    'UPDATE loans SET isActive = 0, updated_at = ? WHERE id = ?',
    [Date.now(), id]
  );
};

export const deleteLoan = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM loans WHERE id = ?', [id]);
};
