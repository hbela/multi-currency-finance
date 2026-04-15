import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TransactionForm } from '@/src/components/TransactionForm';
import { useTransactionStore } from '@/src/store/transactionStore';
import { useAppTheme } from '@/src/theme';
import { persistReceiptImage } from '@/src/utils/receiptStorage';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const transaction = useTransactionStore((s) => s.items.find((t) => t.id === id));
  const update = useTransactionStore((s) => s.update);
  const remove = useTransactionStore((s) => s.remove);

  if (!transaction) {
    return (
      <View style={{ flex: 1, padding: 24, backgroundColor: theme.colors.background }}>
        <Text>Transaction not found.</Text>
      </View>
    );
  }

  return (
    <TransactionForm
      initial={transaction}
      onSubmit={async (v) => {
        const receiptImage = v.receipt_image
          ? persistReceiptImage(v.receipt_image, transaction.id)
          : null;
        await update({ ...transaction, ...v, receipt_image: receiptImage });
        router.back();
      }}
      onDelete={async () => {
        await remove(transaction.id);
        router.back();
      }}
      submitLabel="Save changes"
    />
  );
}
