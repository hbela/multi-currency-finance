import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FAB, List, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { SummaryCard } from '@/src/components/SummaryCard';
import { TransactionItem } from '@/src/components/TransactionItem';
import { useAccountStore } from '@/src/store/accountStore';
import { useCurrencyStore } from '@/src/store/currencyStore';
import { useTransactionStore } from '@/src/store/transactionStore';
import { getMonthlySummary } from '@/src/db/transactions';
import { computeNetWorthInBase } from '@/src/services/fx.service';
import { useAppTheme } from '@/src/theme';
import { useTranslation } from 'react-i18next';

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { t } = useTranslation();
  const transactions = useTransactionStore((s) => s.items);
  const accounts = useAccountStore((s) => s.items);
  const baseCurrency = useCurrencyStore((s) => s.base);
  const [netWorth, setNetWorth] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const [summary, nw] = await Promise.all([
        getMonthlySummary(now.getFullYear(), now.getMonth() + 1),
        computeNetWorthInBase(accounts.map((a) => ({ id: a.id, currency: a.currency }))),
      ]);
      setIncome(summary.income);
      setExpense(summary.expense);
      setNetWorth(nw);
    })();
  }, [transactions, accounts]);

  const displayCurrency = baseCurrency?.code ?? 'HUF';
  const recent = useMemo(() => transactions.slice(0, 10), [transactions]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <SummaryCard balance={netWorth} income={income} expense={expense} currency={displayCurrency} />
        <List.Section>
          <List.Subheader>{t('dashboard.recentTransactions')}</List.Subheader>
          {recent.length === 0 ? (
            <Text style={{ marginHorizontal: 16, color: theme.colors.onSurfaceVariant }}>
              {t('dashboard.noTransactions')}
            </Text>
          ) : (
            recent.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: t.id } })}
              />
            ))
          )}
        </List.Section>
      </ScrollView>
      <FAB
        icon="plus"
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        onPress={() => router.push('/transaction/new')}
      />
    </View>
  );
}
