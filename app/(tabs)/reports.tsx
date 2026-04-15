import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { DataTable, SegmentedButtons, Text } from 'react-native-paper';

import { getCategoryBreakdown, CategoryBreakdownRow } from '@/src/db/transactions';
import { useCategoryStore } from '@/src/store/categoryStore';
import { useAccountStore } from '@/src/store/accountStore';
import { useTransactionStore } from '@/src/store/transactionStore';
import { TxnType } from '@/src/types';
import { monthKey } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/format';
import { useAppTheme } from '@/src/theme';

export default function ReportsScreen() {
  const theme = useAppTheme();
  const byId = useCategoryStore((s) => s.byId);
  const accounts = useAccountStore((s) => s.items);
  const transactions = useTransactionStore((s) => s.items);
  const [type, setType] = useState<TxnType>('expense');
  const [rows, setRows] = useState<CategoryBreakdownRow[]>([]);
  const currency = accounts[0]?.currency ?? 'USD';
  const month = monthKey();

  const refresh = useCallback(async () => {
    setRows(await getCategoryBreakdown(month, type));
  }, [month, type]);

  useEffect(() => {
    refresh();
  }, [refresh, transactions]);

  const total = rows.reduce((acc, r) => acc + r.total, 0);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text variant="titleMedium">{month} breakdown</Text>
      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as TxnType)}
        buttons={[
          { value: 'expense', label: 'Expenses' },
          { value: 'income', label: 'Income' },
        ]}
      />
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Category</DataTable.Title>
          <DataTable.Title numeric>Amount</DataTable.Title>
          <DataTable.Title numeric>Share</DataTable.Title>
        </DataTable.Header>
        {rows.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No {type} transactions this month.
            </Text>
          </View>
        ) : (
          rows.map((r) => {
            const cat = byId(r.category_id);
            const share = total > 0 ? Math.round((r.total / total) * 100) : 0;
            return (
              <DataTable.Row key={r.category_id ?? 'uncategorized'}>
                <DataTable.Cell>{cat?.name ?? 'Uncategorized'}</DataTable.Cell>
                <DataTable.Cell numeric>{formatCurrency(r.total, currency)}</DataTable.Cell>
                <DataTable.Cell numeric>{share}%</DataTable.Cell>
              </DataTable.Row>
            );
          })
        )}
      </DataTable>
      {rows.length > 0 && (
        <Text variant="titleMedium" style={{ textAlign: 'right' }}>
          Total: {formatCurrency(total, currency)}
        </Text>
      )}
    </ScrollView>
  );
}
