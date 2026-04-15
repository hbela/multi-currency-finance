import React from 'react';
import { useRouter } from 'expo-router';

import { RecurringForm } from '@/src/components/RecurringForm';
import { useRecurringStore } from '@/src/store/recurringStore';

export default function NewRecurringScreen() {
  const router = useRouter();
  const add = useRecurringStore((s) => s.add);

  return (
    <RecurringForm
      onSubmit={async (v) => {
        await add(v);
        router.back();
      }}
      submitLabel="Add recurring"
    />
  );
}
