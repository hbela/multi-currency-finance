import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, IconButton, SegmentedButtons, TextInput } from 'react-native-paper';
import { Image } from 'expo-image';

import { AmountInput } from './AmountInput';
import { CategoryPicker } from './CategoryPicker';
import { AccountPicker } from './AccountPicker';
import { ReceiptScanner } from './ReceiptScanner';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { Transaction, TxnType } from '../types';
import { useAppTheme } from '../theme';

export interface TransactionFormValues {
  amount: number;
  type: TxnType;
  date: number;
  note: string | null;
  account_id: string | null;
  category_id: string | null;
  receipt_image: string | null;
}

interface Props {
  initial?: Transaction;
  onSubmit: (v: TransactionFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  submitLabel?: string;
}

export const TransactionForm: React.FC<Props> = ({
  initial,
  onSubmit,
  onDelete,
  submitLabel = 'Save',
}) => {
  const theme = useAppTheme();
  const accounts = useAccountStore((s) => s.items);
  const categories = useCategoryStore((s) => s.items);

  const [type, setType] = useState<TxnType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState<number>(initial?.date ?? Date.now());
  const [accountId, setAccountId] = useState<string | null>(
    initial?.account_id ?? accounts[0]?.id ?? null
  );
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null);
  const [receiptImage, setReceiptImage] = useState<string | null>(initial?.receipt_image ?? null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const currency = accounts.find((a) => a.id === accountId)?.currency ?? 'USD';

  const handleScanResult = ({
    parsed,
    imageUri,
  }: {
    parsed: { amount: number | null; date: number | null; vendor: string | null };
    imageUri: string;
  }) => {
    if (parsed.amount !== null) setAmount(String(parsed.amount));
    if (parsed.date !== null) setDate(parsed.date);
    if (parsed.vendor && !note.trim()) setNote(parsed.vendor);
    setReceiptImage(imageUri);
    setScannerOpen(false);
  };

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setSaving(true);
    try {
      await onSubmit({
        amount: parsed,
        type,
        date,
        note: note.trim() || null,
        account_id: accountId,
        category_id: categoryId,
        receipt_image: receiptImage,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SegmentedButtons
          value={type}
          onValueChange={(v) => setType(v as TxnType)}
          buttons={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
        />
        <Button mode="outlined" icon="camera" onPress={() => setScannerOpen(true)}>
          Scan receipt
        </Button>
        {receiptImage && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={() => setScannerOpen(true)}>
              <Image
                source={{ uri: receiptImage }}
                style={{ width: 72, height: 72, borderRadius: 8 }}
                contentFit="cover"
              />
            </Pressable>
            <IconButton
              icon="close"
              size={20}
              onPress={() => setReceiptImage(null)}
              accessibilityLabel="Remove receipt image"
            />
          </View>
        )}
        <AmountInput value={amount} onChangeText={setAmount} currency={currency} autoFocus={!initial} />
        <CategoryPicker
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          type={type}
        />
        <AccountPicker accounts={accounts} value={accountId} onChange={setAccountId} />
        <TextInput mode="outlined" label="Note" value={note} onChangeText={setNote} />
        <View style={{ gap: 8 }}>
          <Button mode="contained" onPress={handleSubmit} loading={saving} disabled={saving}>
            {submitLabel}
          </Button>
          {onDelete && (
            <Button mode="outlined" textColor={theme.colors.error} onPress={onDelete} disabled={saving}>
              Delete
            </Button>
          )}
        </View>
      </ScrollView>
      <ReceiptScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onResult={handleScanResult}
      />
    </>
  );
};
