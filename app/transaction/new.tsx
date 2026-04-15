import React from 'react';
import { useRouter } from 'expo-router';

import { TransactionForm } from '@/src/components/TransactionForm';
import { useTransactionStore } from '@/src/store/transactionStore';
import { persistReceiptImage } from '@/src/utils/receiptStorage';

export default function NewTransactionScreen() {
  const router = useRouter();
  const add = useTransactionStore((s) => s.add);
  const update = useTransactionStore((s) => s.update);

  return (
    <TransactionForm
      onSubmit={async (v) => {
        const created = await add(v);
        if (v.receipt_image) {
          const persisted = persistReceiptImage(v.receipt_image, created.id);
          if (persisted !== created.receipt_image) {
            await update({ ...created, receipt_image: persisted });
          }
        }
        router.back();
      }}
      submitLabel="Add transaction"
    />
  );
}
