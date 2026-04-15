import { db } from './db';
import { Category, TxnType } from '../types';
import { newId } from '../utils/id';

export const listCategories = (): Promise<Category[]> =>
  db.getAllAsync<Category>('SELECT * FROM categories ORDER BY type ASC, name ASC');

export const createCategory = async (input: {
  name: string;
  icon: string | null;
  type: TxnType;
}): Promise<Category> => {
  const row: Category = {
    id: newId(),
    name: input.name,
    icon: input.icon,
    type: input.type,
    created_at: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO categories (id, name, icon, type, created_at) VALUES (?, ?, ?, ?, ?)',
    [row.id, row.name, row.icon, row.type, row.created_at]
  );
  return row;
};

export const updateCategory = async (row: Category): Promise<void> => {
  await db.runAsync(
    'UPDATE categories SET name = ?, icon = ?, type = ? WHERE id = ?',
    [row.name, row.icon, row.type, row.id]
  );
};

export const deleteCategory = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
};
