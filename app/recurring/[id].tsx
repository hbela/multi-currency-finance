import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { RecurringForm } from '@/src/components/RecurringForm';
import { useRecurringStore } from '@/src/store/recurringStore';
import { useAppTheme } from '@/src/theme';

export default function EditRecurringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const rule = useRecurringStore((s) => s.items.find((r) => r.id === id));
  const update = useRecurringStore((s) => s.update);
  const remove = useRecurringStore((s) => s.remove);

  if (!rule) {
    return (
      <View style={{ flex: 1, padding: 24, backgroundColor: theme.colors.background }}>
        <Text>Recurring rule not found.</Text>
      </View>
    );
  }

  return (
    <RecurringForm
      initial={rule}
      onSubmit={async (v) => {
        // If start_date changed, reset next_due_date so the new schedule takes effect.
        const nextDue = v.start_date !== rule.start_date ? v.start_date : rule.next_due_date;
        await update({
          ...rule,
          ...v,
          next_due_date: nextDue,
        });
        router.back();
      }}
      onDelete={async () => {
        await remove(rule.id);
        router.back();
      }}
      submitLabel="Save changes"
    />
  );
}
