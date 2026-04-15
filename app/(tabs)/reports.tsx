import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, SegmentedButtons, Text } from 'react-native-paper';

import { CategoryBreakdownChart } from '@/src/components/CategoryBreakdownChart';
import { MonthlyTrendsChart } from '@/src/components/MonthlyTrendsChart';
import {
  CategoryBreakdownRow,
  MonthlySeriesPoint,
  getCategoryBreakdown,
  getMonthlyTotalsSeries,
} from '@/src/db/transactions';
import { useAccountStore } from '@/src/store/accountStore';
import { useTransactionStore } from '@/src/store/transactionStore';
import { useAppTheme } from '@/src/theme';
import { TxnType } from '@/src/types';
import { monthKey, monthKeysEndingAt } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/format';

export default function ReportsScreen() {
  const theme = useAppTheme();
  const accounts = useAccountStore((s) => s.items);
  const transactions = useTransactionStore((s) => s.items);
  const [type, setType] = useState<TxnType>('expense');
  const [rangeMonths, setRangeMonths] = useState<6 | 12>(6);
  const [rows, setRows] = useState<CategoryBreakdownRow[]>([]);
  const [series, setSeries] = useState<MonthlySeriesPoint[]>([]);
  const currency = accounts[0]?.currency ?? 'USD';
  const month = monthKey();

  const refresh = useCallback(async () => {
    const keys = monthKeysEndingAt(rangeMonths);
    const [breakdown, trends] = await Promise.all([
      getCategoryBreakdown(month, type),
      getMonthlyTotalsSeries(keys),
    ]);
    setRows(breakdown);
    setSeries(trends);
  }, [month, type, rangeMonths]);

  useEffect(() => {
    refresh();
  }, [refresh, transactions]);

  const total = rows.reduce((acc, r) => acc + r.total, 0);
  const trendIncome = series.reduce((acc, p) => acc + p.income, 0);
  const trendExpense = series.reduce((acc, p) => acc + p.expense, 0);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Card mode="elevated">
        <Card.Content style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="titleMedium">Monthly trends</Text>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant, alignSelf: 'center' }}>
              Last {rangeMonths} months
            </Text>
          </View>
          <SegmentedButtons
            value={String(rangeMonths)}
            onValueChange={(v) => setRangeMonths(v === '12' ? 12 : 6)}
            buttons={[
              { value: '6', label: '6M' },
              { value: '12', label: '12M' },
            ]}
          />
          <MonthlyTrendsChart data={series} currency={currency} />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 4,
            }}>
            <View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Total income
              </Text>
              <Text variant="titleSmall" style={{ color: theme.colors.income }}>
                {formatCurrency(trendIncome, currency)}
              </Text>
            </View>
            <View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Total expense
              </Text>
              <Text variant="titleSmall" style={{ color: theme.colors.expense }}>
                {formatCurrency(trendExpense, currency)}
              </Text>
            </View>
            <View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Net
              </Text>
              <Text variant="titleSmall">
                {formatCurrency(trendIncome - trendExpense, currency)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card mode="elevated">
        <Card.Content style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="titleMedium">{month} breakdown</Text>
            {rows.length > 0 && (
              <Text variant="titleSmall">{formatCurrency(total, currency)}</Text>
            )}
          </View>
          <SegmentedButtons
            value={type}
            onValueChange={(v) => setType(v as TxnType)}
            buttons={[
              { value: 'expense', label: 'Expenses' },
              { value: 'income', label: 'Income' },
            ]}
          />
          {rows.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No {type} transactions this month.
            </Text>
          ) : (
            <CategoryBreakdownChart rows={rows} currency={currency} />
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
