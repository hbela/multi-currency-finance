import React, { useMemo } from 'react';
import { SectionList, View } from 'react-native';
import { FAB, List, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { TransactionItem } from '@/src/components/TransactionItem';
import { useTransactionStore } from '@/src/store/transactionStore';
import { Transaction } from '@/src/types';
import { formatDateLabel } from '@/src/utils/date';
import { useLocaleStore } from '@/src/store/localeStore';
import { useAppTheme } from '@/src/theme';
import { useTranslation } from 'react-i18next';

interface Section {
  title: string;
  data: Transaction[];
}

export default function TransactionsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { t } = useTranslation();
  const items = useTransactionStore((s) => s.items);
  const { locale } = useLocaleStore();

  const sections = useMemo<Section[]>(() => {
    const todayLabel = t('dashboard.today');
    const yesterdayLabel = t('dashboard.yesterday');
    const groups = new Map<string, Transaction[]>();
    for (const tx of items) {
      const key = new Date(tx.date).toDateString();
      const bucket = groups.get(key);
      if (bucket) bucket.push(tx);
      else groups.set(key, [tx]);
    }
    return Array.from(groups.entries()).map(([key, data]) => ({
      title: formatDateLabel(new Date(key).getTime(), locale, todayLabel, yesterdayLabel),
      data,
    }));
  }, [items, t, locale]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {sections.length === 0 ? (
        <View style={{ padding: 24 }}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            {t('transactions.noTransactions')}
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
