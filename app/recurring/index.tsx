import React from 'react';
import { FlatList, View } from 'react-native';
import { FAB, List, Switch, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { useRecurringStore } from '@/src/store/recurringStore';
import { useCategoryStore } from '@/src/store/categoryStore';
import { RecurringTransaction } from '@/src/types';
import { formatCurrency } from '@/src/utils/format';
import { formatDateInput } from '@/src/utils/date';
import { useAppTheme } from '@/src/theme';

const frequencyLabel: Record<RecurringTransaction['frequency'], string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function RecurringListScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const items = useRecurringStore((s) => s.items);
  const setActive = useRecurringStore((s) => s.setActive);
  const categories = useCategoryStore((s) => s.items);

  const categoryName = (id: string | null) =>
    id ? (categories.find((c) => c.id === id)?.name ?? 'Uncategorized') : 'Uncategorized';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {items.length === 0 ? (
        <View style={{ padding: 24 }}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            No recurring rules yet. Tap + to add one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 96 }}
          renderItem={({ item }) => {
            const isActive = item.active === 1;
            const amountColor =
              item.type === 'expense' ? theme.colors.error : theme.colors.primary;
            return (
              <List.Item
                title={`${categoryName(item.category_id)} · ${frequencyLabel[item.frequency]}`}
                description={
                  isActive
                    ? `Next: ${formatDateInput(item.next_due_date)}`
                    : 'Paused'
                }
                onPress={() =>
                  router.push({ pathname: '/recurring/[id]', params: { id: item.id } })
                }
                left={(p) => (
                  <List.Icon
                    {...p}
                    icon={item.type === 'expense' ? 'arrow-down' : 'arrow-up'}
                    color={amountColor}
                  />
                )}
                right={() => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: amountColor }}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <Switch
                      value={isActive}
                      onValueChange={(v) => setActive(item.id, v)}
                    />
                  </View>
                )}
              />
            );
          }}
        />
      )}
      <FAB
        icon="plus"
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        onPress={() => router.push('/recurring/new')}
      />
    </View>
  );
}
