import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Dialog, Divider, FAB, Portal, Text } from 'react-native-paper';

import { BudgetProgressBar } from '@/src/components/BudgetProgressBar';
import { CategoryPicker } from '@/src/components/CategoryPicker';
import { AmountInput } from '@/src/components/AmountInput';
import { useBudgetStore } from '@/src/store/budgetStore';
import { useCategoryStore } from '@/src/store/categoryStore';
import { useAccountStore } from '@/src/store/accountStore';
import { useTransactionStore } from '@/src/store/transactionStore';
import { useLocaleStore } from '@/src/store/localeStore';
import { getBudgetProgressForMonth } from '@/src/db/budgets';
import { BudgetProgress } from '@/src/types';
import { monthKey } from '@/src/utils/date';
import { useAppTheme } from '@/src/theme';
import { useTranslation } from 'react-i18next';

export default function BudgetsScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const categories = useCategoryStore((s) => s.items);
  const accounts = useAccountStore((s) => s.items);
  const addBudget = useBudgetStore((s) => s.add);
  const budgets = useBudgetStore((s) => s.items);
  const transactions = useTransactionStore((s) => s.items);
  const [rows, setRows] = useState<BudgetProgress[]>([]);
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  const currency = accounts[0]?.currency ?? 'USD';
  const lang = useLocaleStore((s) => s.lang);
  const month = monthKey();

  const refresh = useCallback(async () => {
    setRows(await getBudgetProgressForMonth(month));
  }, [month]);

  useEffect(() => {
    refresh();
  }, [refresh, budgets, transactions]);

  const submit = async () => {
    if (!categoryId || !amount || amount <= 0) return;
    await addBudget({ category_id: categoryId, amount, month });
    setOpen(false);
    setCategoryId(null);
    setAmount(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {rows.length === 0 ? (
          <Text style={{ padding: 24, color: theme.colors.onSurfaceVariant }}>
            {t('budgets.noBudgets', { month })}
          </Text>
        ) : (
          rows.map((r, i) => (
            <View key={r.budget.id}>
              {i > 0 && <Divider />}
              <BudgetProgressBar progress={r} currency={currency} />
            </View>
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        onPress={() => setOpen(true)}
      />
      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)}>
          <Dialog.Title>{t('budgets.newBudget')}</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <CategoryPicker
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              type="EXPENSE"
            />
            <AmountInput value={amount} onChangeValue={setAmount} currency={currency} lang={lang} label={t('budgets.monthlyLimit')} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button onPress={submit}>{t('common.save')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
