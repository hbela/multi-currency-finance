import * as FileSystem from 'expo-file-system/legacy';
import { listTransactions } from '../db/transactions';
import { listAllAccounts } from '../db/accounts';
import { listCategories } from '../db/categories';
import { uploadToGoogleDrive } from '../lib/googleDriveService';

const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsvRow = (values: unknown[]): string =>
  values.map(escapeCsvCell).join(',');

const buildTransactionsCsv = async (): Promise<string> => {
  const rows = await listTransactions();
  const header = toCsvRow([
    'id', 'type', 'date', 'amount', 'currency',
    'amountBase', 'baseCurrency', 'exchangeRate',
    'accountId', 'categoryId', 'description', 'source',
    'tags', 'notes', 'status', 'isRecurring',
    'recurringParentId', 'createdAt', 'updatedAt',
  ]);
  const lines = rows.map((r) =>
    toCsvRow([
      r.id, r.type,
      new Date(r.date).toISOString(),
      r.amount, r.currency, r.amountBase, r.baseCurrency, r.exchangeRate,
      r.accountId, r.categoryId, r.description, r.source,
      r.tags, r.notes, r.status, r.isRecurring,
      r.recurringParentId,
      new Date(r.createdAt).toISOString(),
      new Date(r.updatedAt).toISOString(),
    ])
  );
  return [header, ...lines].join('\n');
};

const buildAccountsCsv = async (): Promise<string> => {
  const rows = await listAllAccounts();
  const header = toCsvRow(['id', 'name', 'type', 'currency', 'balance', 'isActive', 'notes', 'created_at']);
  const lines = rows.map((r) =>
    toCsvRow([
      r.id, r.name, r.type, r.currency, r.balance, r.isActive,
      r.notes, new Date(r.created_at).toISOString(),
    ])
  );
  return [header, ...lines].join('\n');
};

const buildCategoriesCsv = async (): Promise<string> => {
  const rows = await listCategories();
  const header = toCsvRow(['id', 'name', 'type', 'icon', 'isDefault', 'parentId', 'created_at']);
  const lines = rows.map((r) =>
    toCsvRow([
      r.id, r.name, r.type, r.icon, r.isDefault,
      r.parentId, new Date(r.created_at).toISOString(),
    ])
  );
  return [header, ...lines].join('\n');
};

export const exportDatabaseAsCsv = async (): Promise<void> => {
  const [txnCsv, accountsCsv, categoriesCsv] = await Promise.all([
    buildTransactionsCsv(),
    buildAccountsCsv(),
    buildCategoriesCsv(),
  ]);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = FileSystem.cacheDirectory!;

  const files = [
    { name: `flexfinance_transactions_${timestamp}.csv`, content: txnCsv },
    { name: `flexfinance_accounts_${timestamp}.csv`, content: accountsCsv },
    { name: `flexfinance_categories_${timestamp}.csv`, content: categoriesCsv },
  ];

  for (const file of files) {
    const uri = dir + file.name;
    await FileSystem.writeAsStringAsync(uri, file.content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await uploadToGoogleDrive(uri, file.name);
  }
};
