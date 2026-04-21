import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FAB, List, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { SummaryCard } from '@/src/components/SummaryCard';
import { TransactionItem } from '@/src/components/TransactionItem';
import { useAccountStore } from '@/src/store/accountStore';
import { useTransactionStore } from '@/src/store/transactionStore';
import { getMonthlySummary } from '@/src/db/transactions';
import { useAppTheme } from '@/src/theme';

const BASE_CURRENCY = 'HUF';

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const transactions = useTransactionStore((s) => s.items);
  const getNetWorth = useAccountStore((s) => s.getNetWorth);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const summary = await getMonthlySummary(now.getFullYear(), now.getMonth() + 1);
      setIncome(summary.income);
      setExpense(summary.expense);
    })();
  }, [transactions]);

  const netWorth = getNetWorth();
  const recent = useMemo(() => transactions.slice(0, 10), [transactions]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <SummaryCard balance={netWorth} income={income} expense={expense} currency={BASE_CURRENCY} />
        <List.Section>
          <List.Subheader>Recent transactions</List.Subheader>
          {recent.length === 0 ? (
            <Text style={{ marginHorizontal: 16, color: theme.colors.onSurfaceVariant }}>
              No transactions yet. Tap + to add your first one.
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
