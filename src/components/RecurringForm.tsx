import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Switch, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { AmountInput } from './AmountInput';
import { CategoryPicker } from './CategoryPicker';
import { AccountPicker } from './AccountPicker';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { RecurringFrequency, RecurringTransaction, TxnType } from '../types';
import { formatDateInput, parseDateInput } from '../utils/date';
import { useAppTheme } from '../theme';

export interface RecurringFormValues {
  amount: number;
  type: TxnType;
  note: string | null;
  account_id: string | null;
  category_id: string | null;
  frequency: RecurringFrequency;
  start_date: number;
  end_date: number | null;
}

interface Props {
  initial?: RecurringTransaction;
  onSubmit: (v: RecurringFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  submitLabel?: string;
}

export const RecurringForm: React.FC<Props> = ({
  initial,
  onSubmit,
  onDelete,
  submitLabel = 'Save',
}) => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const accounts = useAccountStore((s) => s.items);
  const categories = useCategoryStore((s) => s.items);

  const [type, setType] = useState<TxnType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [accountId, setAccountId] = useState<string | null>(
    initial?.account_id ?? accounts[0]?.id ?? null
  );
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null);
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency ?? 'monthly');
  const [startText, setStartText] = useState(
    formatDateInput(initial?.start_date ?? Date.now())
  );
  const [hasEnd, setHasEnd] = useState(initial?.end_date != null);
  const [endText, setEndText] = useState(
    initial?.end_date != null ? formatDateInput(initial.end_date) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = accounts.find((a) => a.id === accountId)?.currency ?? 'USD';

  const handleSubmit = async () => {
    setError(null);
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t('recurring.errorAmount'));
      return;
    }
    const start = parseDateInput(startText);
    if (start == null) {
      setError(t('recurring.errorStartDate'));
      return;
    }
    let end: number | null = null;
    if (hasEnd) {
      end = parseDateInput(endText);
      if (end == null) {
        setError(t('recurring.errorEndDate'));
        return;
      }
      if (end < start) {
        setError(t('recurring.errorEndBeforeStart'));
        return;
      }
    }
    setSaving(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        type,
        note: note.trim() || null,
        account_id: accountId,
        category_id: categoryId,
        frequency,
        start_date: start,
        end_date: end,
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
          { value: 'expense', label: t('txn.types.EXPENSE') },
          { value: 'income', label: t('txn.types.INCOME') },
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
      <View>
        <Text variant="labelSmall" style={{ marginBottom: 4 }}>
          {t('recurring.frequency')}
        </Text>
        <SegmentedButtons
          value={frequency}
          onValueChange={(v) => setFrequency(v as RecurringFrequency)}
          buttons={[
            { value: 'weekly', label: t('recurring.weekly') },
            { value: 'monthly', label: t('recurring.monthly') },
            { value: 'yearly', label: t('recurring.yearly') },
          ]}
        />
      </View>
      <TextInput
        mode="outlined"
        label={t('recurring.startDate')}
        value={startText}
        onChangeText={setStartText}
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text>{t('recurring.hasEndDate')}</Text>
        <Switch value={hasEnd} onValueChange={setHasEnd} />
      </View>
      {hasEnd && (
        <TextInput
          mode="outlined"
          label={t('recurring.endDate')}
          value={endText}
          onChangeText={setEndText}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />
      )}
      <TextInput mode="outlined" label={t('recurring.note')} value={note} onChangeText={setNote} />
      {error && <HelperText type="error">{error}</HelperText>}
      <View style={{ gap: 8 }}>
        <Button mode="contained" onPress={handleSubmit} loading={saving} disabled={saving}>
          {submitLabel}
        </Button>
        {onDelete && (
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            onPress={onDelete}
            disabled={saving}>
            {t('common.delete')}
          </Button>
        )}
      </View>
    </ScrollView>
  );
};
