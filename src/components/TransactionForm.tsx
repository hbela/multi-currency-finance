import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, SegmentedButtons, TextInput } from 'react-native-paper';

import { AmountInput } from './AmountInput';
import { CategoryPicker } from './CategoryPicker';
import { AccountPicker } from './AccountPicker';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { Transaction, TxnType } from '../types';
import { useAppTheme } from '../theme';

export interface TransactionFormValues {
  amount: number;
  type: TxnType;
  date: number;
  note: string | null;
  account_id: string | null;
  category_id: string | null;
}

interface Props {
  initial?: Transaction;
  onSubmit: (v: TransactionFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  submitLabel?: string;
}

export const TransactionForm: React.FC<Props> = ({
  initial,
  onSubmit,
  onDelete,
  submitLabel = 'Save',
}) => {
  const theme = useAppTheme();
  const accounts = useAccountStore((s) => s.items);
  const categories = useCategoryStore((s) => s.items);

  const [type, setType] = useState<TxnType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [accountId, setAccountId] = useState<string | null>(
    initial?.account_id ?? accounts[0]?.id ?? null
  );
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null);
  const [saving, setSaving] = useState(false);

  const currency = accounts.find((a) => a.id === accountId)?.currency ?? 'USD';

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setSaving(true);
    try {
      await onSubmit({
        amount: parsed,
        type,
        date: initial?.date ?? Date.now(),
        note: note.trim() || null,
        account_id: accountId,
        category_id: categoryId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as TxnType)}
        buttons={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
      />
      <AmountInput value={amount} onChangeText={setAmount} currency={currency} autoFocus={!initial} />
      <CategoryPicker
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
        type={type}
      />
      <AccountPicker accounts={accounts} value={accountId} onChange={setAccountId} />
      <TextInput mode="outlined" label="Note" value={note} onChangeText={setNote} />
      <View style={{ gap: 8 }}>
        <Button mode="contained" onPress={handleSubmit} loading={saving} disabled={saving}>
          {submitLabel}
        </Button>
        {onDelete && (
          <Button mode="outlined" textColor={theme.colors.error} onPress={onDelete} disabled={saving}>
            Delete
          </Button>
        )}
      </View>
    </ScrollView>
  );
};
