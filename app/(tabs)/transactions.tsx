import React, { useMemo } from 'react';
import { SectionList, View } from 'react-native';
import { FAB, List, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { TransactionItem } from '@/src/components/TransactionItem';
import { useTransactionStore } from '@/src/store/transactionStore';
import { Transaction } from '@/src/types';
import { formatDateLabel } from '@/src/utils/date';
import { useAppTheme } from '@/src/theme';

interface Section {
  title: string;
  data: Transaction[];
}

export default function TransactionsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const items = useTransactionStore((s) => s.items);

  const sections = useMemo<Section[]>(() => {
    const groups = new Map<string, Transaction[]>();
    for (const t of items) {
      const key = new Date(t.date).toDateString();
      const bucket = groups.get(key);
      if (bucket) bucket.push(t);
      else groups.set(key, [t]);
    }
    return Array.from(groups.entries()).map(([key, data]) => ({
      title: formatDateLabel(new Date(key).getTime()),
      data,
    }));
  }, [items]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {sections.length === 0 ? (
        <View style={{ padding: 24 }}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            No transactions yet. Tap + to add one.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) => <List.Subheader>{title}</List.Subheader>}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() =>
                router.push({ pathname: '/transaction/[id]', params: { id: item.id } })
              }
            />
          )}
          contentContainerStyle={{ paddingBottom: 96 }}
          stickySectionHeadersEnabled={false}
        />
      )}
      <FAB
        icon="plus"
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        onPress={() => router.push('/transaction/new')}
      />
    </View>
  );
}
