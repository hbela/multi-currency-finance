import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { Button, Card, Chip, Divider, IconButton, SegmentedButtons, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryBreakdownChart } from '@/src/components/CategoryBreakdownChart';
import { MonthlyTrendsChart } from '@/src/components/MonthlyTrendsChart';
import {
  CategoryBreakdownRow,
  MonthlySeriesPoint,
  AccountPnLRow as AccountPnLData,
  CountrySpendRow,
  getCategoryBreakdown,
  getMonthlyTotalsSeries,
  getAccountPnL,
  getCountrySpending,
} from '@/src/db/transactions';
import { useTransactionStore } from '@/src/store/transactionStore';
import { useAccountStore } from '@/src/store/accountStore';
import { useCurrencyStore } from '@/src/store/currencyStore';
import { useAppTheme } from '@/src/theme';
import { TransactionType } from '@/src/types';
import { monthKey, monthKeysEndingAt } from '@/src/utils/date';
import { useLocaleStore } from '@/src/store/localeStore';
import { useMoneyFormatter } from '@/src/hooks/useFormattedAmount';
import { exportDatabaseAsCsv } from '@/src/utils/exportCsv';

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string, locale: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export default function ReportsScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const transactions = useTransactionStore((s) => s.items);
  const accounts = useAccountStore((s) => s.items);
  const { locale } = useLocaleStore();
  const baseCurrency = useCurrencyStore((s) => s.base);

  const displayCurrency = baseCurrency?.code ?? 'HUF';
  const fmt = useMoneyFormatter(displayCurrency);

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [rangeMonths, setRangeMonths] = useState<6 | 12>(6);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');

  const [rows, setRows] = useState<CategoryBreakdownRow[]>([]);
  const [series, setSeries] = useState<MonthlySeriesPoint[]>([]);
  const [accountPnL, setAccountPnL] = useState<AccountPnLData[]>([]);
  const [countryRows, setCountryRows] = useState<CountrySpendRow[]>([]);
  const [exporting, setExporting] = useState(false);

  const currentMonth = monthKey();

  // Unique currency list from accounts for the filter chips
  const uniqueCurrencies = Array.from(new Set(accounts.map((a) => a.currency))).sort();

  const refresh = useCallback(async () => {
    const keys = monthKeysEndingAt(rangeMonths);
    const [breakdown, trends, pnl, country] = await Promise.all([
      getCategoryBreakdown(selectedMonth, type),
      getMonthlyTotalsSeries(keys),
      getAccountPnL(selectedMonth),
      getCountrySpending(selectedMonth),
    ]);
    setRows(breakdown);
    setSeries(trends);
    setAccountPnL(pnl);
    setCountryRows(country);
  }, [selectedMonth, type, rangeMonths]);

  useEffect(() => {
    refresh();
  }, [refresh, transactions]);

  // Filter series by currency when a specific currency is selected.
  // The series uses amountBase so filtering by currency means limiting to
  // accounts of that currency — approximate client-side filter on the
  // account list for the trend subtotals.
  const filteredAccountPnL: AccountPnLData[] = selectedCurrency === 'ALL'
    ? accountPnL
    : accountPnL.filter((row) => {
        const acc = accounts.find((a) => a.id === row.accountId);
        return acc?.currency === selectedCurrency;
      });

  const trendIncome = series.reduce((acc, p) => acc + p.income, 0);
  const trendExpense = series.reduce((acc, p) => acc + p.expense, 0);
  const trendNet = trendIncome - trendExpense;
  const savingsRate = trendIncome > 0 ? Math.round((trendNet / trendIncome) * 100) : 0;

  const breakdownTotal = rows.reduce((acc, r) => acc + r.total, 0);
  const canGoForward = selectedMonth < currentMonth;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDatabaseAsCsv();
      Alert.alert(t('settings.exportSuccess'));
    } catch {
      Alert.alert(t('settings.exportError'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 16 }}>

      {/* ── Currency filter ────────────────────────────────── */}
      {uniqueCurrencies.length > 1 && (
        <Card mode="elevated">
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleSmall">{t('reports.currencyFilter')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Chip
                  selected={selectedCurrency === 'ALL'}
                  onPress={() => setSelectedCurrency('ALL')}>
                  {t('reports.allCurrencies')}
                </Chip>
                {uniqueCurrencies.map((c) => (
                  <Chip
                    key={c}
                    selected={selectedCurrency === c}
                    onPress={() => setSelectedCurrency(c)}>
                    {c}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </Card.Content>
        </Card>
      )}

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

          <MonthlyTrendsChart data={series} currency={displayCurrency} />

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
            <CategoryBreakdownChart rows={rows} currency={displayCurrency} />
          )}
        </Card.Content>
      </Card>

      {/* ── Per-account P&L ────────────────────────────────── */}
      <Card mode="elevated">
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">{t('reports.accountPnL')}</Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {monthLabel(selectedMonth, locale)}
          </Text>

          {filteredAccountPnL.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('reports.noAccountPnL')}</Text>
          ) : (
            filteredAccountPnL.map((row, i) => {
              const acc = accounts.find((a) => a.id === row.accountId);
              return (
                <React.Fragment key={row.accountId}>
                  {i > 0 && <Divider style={{ marginVertical: 2 }} />}
                  <AccountPnLRow
                    name={acc?.name ?? row.accountId}
                    currency={acc?.currency ?? displayCurrency}
                    income={row.income}
                    expense={row.expense}
                    net={row.net}
                    displayCurrency={displayCurrency}
                  />
                </React.Fragment>
              );
            })
          )}
        </Card.Content>
      </Card>

      {/* ── Country / city spending breakdown ─────────────── */}
      <Card mode="elevated">
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">{t('reports.countryBreakdown')}</Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {monthLabel(selectedMonth, locale)}
          </Text>

          {countryRows.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('reports.noCountryData')}</Text>
          ) : (
            countryRows.map((row, i) => (
              <React.Fragment key={`${row.country}-${row.city ?? ''}`}>
                {i > 0 && <Divider style={{ marginVertical: 2 }} />}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text variant="bodyMedium">
                    {row.country}{row.city ? ` · ${row.city}` : ''}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.expense }}>
                    {fmt(row.total)}
                  </Text>
                </View>
              </React.Fragment>
            ))
          )}
        </Card.Content>
      </Card>

      {/* ── Export CSV ─────────────────────────────────────── */}
      <Button
        mode="outlined"
        icon="export"
        loading={exporting}
        disabled={exporting}
        onPress={handleExport}>
        {t('reports.exportCsv')}
      </Button>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

interface AccountPnLRowProps {
  name: string;
  currency: string;
  income: number;
  expense: number;
  net: number;
  displayCurrency: string;
}

const AccountPnLRow: React.FC<AccountPnLRowProps> = ({ name, currency, income, expense, net, displayCurrency }) => {
  const theme = useAppTheme();
  const fmt = useMoneyFormatter(displayCurrency);
  return (
    <View style={{ gap: 2, paddingVertical: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="bodyMedium">{name}</Text>
          <Chip compact style={{ height: 20 }}>{currency}</Chip>
        </View>
        <Text
          variant="bodyMedium"
          style={{ color: net >= 0 ? theme.colors.income : theme.colors.expense }}>
          {net >= 0 ? '+' : ''}{fmt(net)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Text variant="labelSmall" style={{ color: theme.colors.income }}>
          +{fmt(income)}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.expense }}>
          -{fmt(expense)}
        </Text>
      </View>
    </View>
  );
};
