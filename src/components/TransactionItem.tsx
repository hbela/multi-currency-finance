import React from 'react';
import { List } from 'react-native-paper';
import { Transaction } from '../types';
import { useCategoryStore } from '../store/categoryStore';
import { useAccountStore } from '../store/accountStore';
import { formatSigned } from '../utils/format';
import { useAppTheme } from '../theme';

interface Props {
  transaction: Transaction;
  onPress?: (t: Transaction) => void;
}

export const TransactionItem: React.FC<Props> = ({ transaction, onPress }) => {
  const theme = useAppTheme();
  const category = useCategoryStore((s) => s.byId(transaction.category_id));
  const account = useAccountStore((s) =>
    transaction.account_id ? s.items.find((a) => a.id === transaction.account_id) : undefined
  );
  const currency = account?.currency ?? 'USD';
  const color =
    transaction.type === 'income'
      ? theme.colors.income
      : transaction.type === 'expense'
      ? theme.colors.expense
      : theme.colors.onSurface;

  return (
    <List.Item
      title={category?.name ?? 'Uncategorized'}
      description={transaction.note ?? account?.name ?? ''}
      left={(props) => <List.Icon {...props} icon={category?.icon ?? 'cash'} />}
      right={() => (
        <List.Subheader style={{ color, fontWeight: '600' }}>
          {formatSigned(transaction.amount, transaction.type, currency)}
        </List.Subheader>
      )}
      onPress={onPress ? () => onPress(transaction) : undefined}
    />
  );
};
