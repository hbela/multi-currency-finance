import React from 'react';
import { useRouter } from 'expo-router';

import { TransactionForm } from '@/src/components/TransactionForm';
import { useTransactionStore } from '@/src/store/transactionStore';

export default function NewTransactionScreen() {
  const router = useRouter();
  const add = useTransactionStore((s) => s.add);

  return (
    <TransactionForm
      onSubmit={async (v) => {
        await add(v);
        router.back();
      }}
      submitLabel="Add transaction"
    />
  );
}
