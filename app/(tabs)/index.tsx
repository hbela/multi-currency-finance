import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FAB, List, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { SummaryCard } from '@/src/components/SummaryCard';
import { TransactionItem } from '@/src/components/TransactionItem';
import { useAccountStore } from '@/src/store/accountStore';
import { useTransactionStore } from '@/src/store/transactionStore';
import { getTotalBalance } from '@/src/db/accounts';
import { getMonthlyTotals } from '@/src/db/transactions';
import { monthKey } from '@/src/utils/date';
import { useAppTheme } from '@/src/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const transactions = useTransactionStore((s) => s.items);
  const accounts = useAccountStore((s) => s.items);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  const currency = accounts[0]?.currency ?? 'USD';

  useEffect(() => {
    (async () => {
      setBalance(await getTotalBalance());
      const t = await getMonthlyTotals(monthKey());
      setIncome(t.income);
      setExpense(t.expense);
    })();
  }, [transactions]);

  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <SummaryCard balance={balance} income={income} expense={expense} currency={currency} />
        <List.Section>
          <List.Subheader>Recent transactions</List.Subheader>
          {recent.length === 0 ? (
            <Text
              style={{ marginHorizontal: 16, color: theme.colors.onSurfaceVariant }}>
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
