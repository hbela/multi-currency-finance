import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, IconButton, SegmentedButtons, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryBreakdownChart } from '@/src/components/CategoryBreakdownChart';
import { MonthlyTrendsChart } from '@/src/components/MonthlyTrendsChart';
import {
  CategoryBreakdownRow,
  MonthlySeriesPoint,
  getCategoryBreakdown,
  getMonthlyTotalsSeries,
} from '@/src/db/transactions';
import { useTransactionStore } from '@/src/store/transactionStore';
import { useAppTheme } from '@/src/theme';
import { TransactionType } from '@/src/types';
import { monthKey, monthKeysEndingAt } from '@/src/utils/date';
import { useLocaleStore } from '@/src/store/localeStore';
import { useMoneyFormatter } from '@/src/hooks/useFormattedAmount';

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string, locale: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

const CURRENCY = 'HUF';

export default function ReportsScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const transactions = useTransactionStore((s) => s.items);
  const { locale } = useLocaleStore();
  const fmt = useMoneyFormatter(CURRENCY);

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [rangeMonths, setRangeMonths] = useState<6 | 12>(6);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [rows, setRows] = useState<CategoryBreakdownRow[]>([]);
  const [series, setSeries] = useState<MonthlySeriesPoint[]>([]);

  const currentMonth = monthKey();

  const refresh = useCallback(async () => {
    const keys = monthKeysEndingAt(rangeMonths);
    const [breakdown, trends] = await Promise.all([
      getCategoryBreakdown(selectedMonth, type),
      getMonthlyTotalsSeries(keys),
    ]);
    setRows(breakdown);
    setSeries(trends);
  }, [selectedMonth, type, rangeMonths]);

  useEffect(() => {
    refresh();
  }, [refresh, transactions]);

  const trendIncome = series.reduce((acc, p) => acc + p.income, 0);
  const trendExpense = series.reduce((acc, p) => acc + p.expense, 0);
  const trendNet = trendIncome - trendExpense;
  const savingsRate = trendIncome > 0 ? Math.round((trendNet / trendIncome) * 100) : 0;

  const breakdownTotal = rows.reduce((acc, r) => acc + r.total, 0);
  const canGoForward = selectedMonth < currentMonth;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 16 }}>

      {/* ── Monthly trends ─────────────────────────────────── */}
      <Card mode="elevated">
        <Card.Content style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="titleMedium">{t('reports.monthlyTrends')}</Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('reports.lastMonths', { n: rangeMonths })}
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

          <MonthlyTrendsChart data={series} currency={CURRENCY} />

          {/* Summary row — 3 columns, wraps cleanly */}
          <View style={{ flexDirection: 'row', gap: 4, paddingTop: 4 }}>
            <SummaryCell
              label={t('reports.totalIncome')}
              value={fmt(trendIncome)}
              color={theme.colors.income}
            />
            <SummaryCell
              label={t('reports.totalExpense')}
              value={fmt(trendExpense)}
              color={theme.colors.expense}
            />
            <SummaryCell
              label={t('reports.net')}
              value={fmt(trendNet)}
              color={trendNet >= 0 ? theme.colors.income : theme.colors.expense}
              sub={trendIncome > 0 ? t('reports.savingsRate', { pct: savingsRate }) : undefined}
            />
          </View>
        </Card.Content>
      </Card>

      {/* ── Category breakdown ─────────────────────────────── */}
      <Card mode="elevated">
        <Card.Content style={{ gap: 12 }}>
          {/* Header with month picker */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="titleMedium" style={{ flex: 1 }}>
              {t('reports.breakdown', { month: monthLabel(selectedMonth, locale) })}
            </Text>
            {breakdownTotal > 0 && (
              <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {fmt(breakdownTotal)}
              </Text>
            )}
          </View>

          {/* Month navigation */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <IconButton
              icon="chevron-left"
              size={20}
              onPress={() => setSelectedMonth((m) => shiftMonth(m, -1))}
            />
            <Text variant="bodyMedium" style={{ minWidth: 140, textAlign: 'center' }}>
              {monthLabel(selectedMonth, locale)}
            </Text>
            <IconButton
              icon="chevron-right"
              size={20}
              disabled={!canGoForward}
              onPress={() => canGoForward && setSelectedMonth((m) => shiftMonth(m, 1))}
            />
          </View>

          <SegmentedButtons
            value={type}
            onValueChange={(v) => setType(v as TransactionType)}
            buttons={[
              { value: 'EXPENSE', label: t('reports.expenses') },
              { value: 'INCOME', label: t('reports.income') },
            ]}
          />

          {rows.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {t('reports.noTransactions', { type: type.toLowerCase() })}
            </Text>
          ) : (
            <CategoryBreakdownChart rows={rows} currency={CURRENCY} />
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

interface SummaryCellProps {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}

const SummaryCell: React.FC<SummaryCellProps> = ({ label, value, color, sub }) => {
  const theme = useAppTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
        {label}
      </Text>
      <Text variant="labelMedium" style={{ color: color ?? theme.colors.onSurface }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub && (
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
          {sub}
        </Text>
      )}
    </View>
  );
};
