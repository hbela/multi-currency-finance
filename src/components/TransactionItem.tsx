import React from 'react';
import { List } from 'react-native-paper';
import { Transaction, TransactionType } from '../types';
import { useCategoryStore } from '../store/categoryStore';
import { useAccountStore } from '../store/accountStore';
import { useLocaleStore } from '../store/localeStore';
import { formatMoney } from '../utils/format';
import { useAppTheme } from '../theme';

const POSITIVE_TYPES: TransactionType[] = ['INCOME', 'LOAN_RECEIVED', 'INVESTMENT_SELL'];
const signFor = (type: TransactionType) => (POSITIVE_TYPES.includes(type) ? '+' : '-');

interface Props {
  transaction: Transaction;
  onPress?: (t: Transaction) => void;
}

export const TransactionItem: React.FC<Props> = ({ transaction, onPress }) => {
  const theme = useAppTheme();
  const { lang } = useLocaleStore();
  const category = useCategoryStore((s) => s.byId(transaction.categoryId));
  const account = useAccountStore((s) =>
    transaction.accountId ? s.items.find((a) => a.id === transaction.accountId) : undefined
  );
  const color = POSITIVE_TYPES.includes(transaction.type)
    ? theme.colors.income
    : transaction.type === 'EXPENSE' /* || transaction.type === 'CREDIT_CARD_PAYMENT' */
    ? theme.colors.expense
    : theme.colors.onSurface;

  return (
    <List.Item
      title={category?.name ?? transaction.description ?? 'Uncategorized'}
      description={account?.name ?? ''}
      left={(props) => <List.Icon {...props} icon={category?.icon ?? 'cash'} />}
      right={() => (
        <List.Subheader style={{ color, fontWeight: '600' }}>
          {`${signFor(transaction.type)}${formatMoney(Math.abs(parseFloat(transaction.amountBase)), lang, transaction.baseCurrency)}`}
        </List.Subheader>
      )}
      onPress={onPress ? () => onPress(transaction) : undefined}
    />
  );
};
