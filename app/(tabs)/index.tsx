import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { Card, Chip, Divider, FAB, List, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SummaryCard } from '@/src/components/SummaryCard';
import { TransactionItem } from '@/src/components/TransactionItem';
import { NetWorthSparkline, TrendBadge } from '@/src/components/NetWorthSparkline';
import { useAccountStore } from '@/src/store/accountStore';
import { useCurrencyStore } from '@/src/store/currencyStore';
import { useCategoryStore } from '@/src/store/categoryStore';
import { useTransactionStore } from '@/src/store/transactionStore';
import {
  getMonthlySummary,
  getCategoryBreakdown,
  getNetWorthHistory,
  DailyNetWorthPoint,
} from '@/src/db/transactions';
import { getLedgerBalanceForAccount } from '@/src/db/ledger';
import { computeNetWorthInBase, convertWithMap, buildRateMap } from '@/src/services/fx.service';
import { useAppTheme } from '@/src/theme';
import { useMoneyFormatter } from '@/src/hooks/useFormattedAmount';

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { t } = useTranslation();

  const transactions = useTransactionStore((s) => s.items);
  const accounts = useAccountStore((s) => s.items);
  const categories = useCategoryStore((s) => s.items);
  const baseCurrency = useCurrencyStore((s) => s.base);

  const [netWorth, setNetWorth] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [sparkData, setSparkData] = useState<DailyNetWorthPoint[]>([]);
  const [biggestCategory, setBiggestCategory] = useState<{ name: string; amount: number } | null>(null);

  // Per-currency account balances: { currency -> total }
  const [currencyBalances, setCurrencyBalances] = useState<{ currency: string; total: number }[]>([]);

  const displayCurrency = baseCurrency?.code ?? 'HUF';
  const fmt = useMoneyFormatter(displayCurrency);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [summary, nw, sparkPoints, breakdown, rateMap] = await Promise.all([
        getMonthlySummary(now.getFullYear(), now.getMonth() + 1),
        computeNetWorthInBase(accounts.map((a) => ({ id: a.id, currency: a.currency }))),
        getNetWorthHistory(30),
        getCategoryBreakdown(monthStr, 'EXPENSE'),
        buildRateMap(),
      ]);

      setIncome(summary.income);
      setExpense(summary.expense);
      setNetWorth(nw);
      setSparkData(sparkPoints);

      // Biggest expense category
      if (breakdown.length > 0) {
        const top = breakdown[0];
        const cat = categories.find((c) => c.id === top.category_id);
        setBiggestCategory({ name: cat?.name ?? '—', amount: top.total });
      } else {
        setBiggestCategory(null);
      }

      // Group live ledger balances by currency, convert to base
      const grouped: Record<string, number> = {};
      for (const acc of accounts) {
        const balStr = await getLedgerBalanceForAccount(acc.id);
        const bal = parseFloat(balStr);
        if (isNaN(bal)) continue;
        const inBase = displayCurrency === acc.currency
          ? bal
          : convertWithMap(bal, acc.currency, displayCurrency, rateMap);
        grouped[acc.currency] = (grouped[acc.currency] ?? 0) + inBase;
      }
      const sorted = Object.entries(grouped)
        .map(([currency, total]) => ({ currency, total }))
        .sort((a, b) => b.total - a.total);
      setCurrencyBalances(sorted);
    })();
  }, [transactions, accounts, categories, displayCurrency]);

  const recent = useMemo(() => transactions.slice(0, 10), [transactions]);
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  const sparkFirst = sparkData.length > 0 ? sparkData[0].amountBase : 0;
  const sparkLast = sparkData.length > 0 ? sparkData[sparkData.length - 1].amountBase : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>

        {/* ── Net worth card ──────────────────────────────────── */}
        <SummaryCard balance={netWorth} income={income} expense={expense} currency={displayCurrency} />

        {/* ── Sparkline ───────────────────────────────────────── */}
        {sparkData.length >= 2 && (
          <Card mode="elevated" style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <Card.Content style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="titleSmall">{t('dashboard.netWorthTrend')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t('dashboard.last30Days')}
                  </Text>
                  <TrendBadge first={sparkFirst} last={sparkLast} />
                </View>
              </View>
              <NetWorthSparkline data={sparkData} height={48} />
            </Card.Content>
          </Card>
        )}

        {/* ── Quick stats ─────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 }}>
          <QuickStatCard
            label={t('dashboard.savingsRate')}
            value={`${savingsRate}%`}
            color={savingsRate >= 0 ? theme.colors.income : theme.colors.expense}
          />
          {biggestCategory && (
            <QuickStatCard
              label={t('dashboard.biggestExpense')}
              value={biggestCategory.name}
              sub={fmt(biggestCategory.amount)}
              color={theme.colors.expense}
            />
          )}
        </View>

        {/* ── Account balance summary by currency ─────────────── */}
        {currencyBalances.length > 0 && (
          <Card mode="elevated" style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <Card.Content style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text variant="titleSmall">{t('dashboard.accountSummary')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/accounts')}>
                  <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                    {t('accounts.nav')} →
                  </Text>
                </TouchableOpacity>
              </View>
              {currencyBalances.map(({ currency, total }, i) => (
                <React.Fragment key={currency}>
                  {i > 0 && <Divider style={{ marginVertical: 2 }} />}
                  <CurrencyRow currency={currency} total={total} displayCurrency={displayCurrency} />
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>
        )}
        {accounts.length === 0 && (
          <Text style={{ marginHorizontal: 16, marginBottom: 12, color: theme.colors.onSurfaceVariant }}>
            {t('dashboard.noAccountsYet')}
          </Text>
        )}

        {/* ── Recent transactions ─────────────────────────────── */}
        <List.Section>
          <List.Subheader>{t('dashboard.recentTransactions')}</List.Subheader>
          {recent.length === 0 ? (
            <Text style={{ marginHorizontal: 16, color: theme.colors.onSurfaceVariant }}>
              {t('dashboard.noTransactions')}
            </Text>
          ) : (
            recent.map((txn) => (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: txn.id } })}
              />
            ))
          )}
        </List.Section>
      </ScrollView>

      <FAB
        icon="plus"
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        onPress={() => router.push('/transaction/new')}
      />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface QuickStatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({ label, value, sub, color }) => {
  const theme = useAppTheme();
  return (
    <Card mode="elevated" style={{ flex: 1 }}>
      <Card.Content style={{ gap: 2, paddingVertical: 10 }}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
          {label}
        </Text>
        <Text variant="titleMedium" style={{ color: color ?? theme.colors.onSurface }} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {sub && (
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

interface CurrencyRowProps {
  currency: string;
  total: number;
  displayCurrency: string;
}

const CurrencyRow: React.FC<CurrencyRowProps> = ({ currency, total, displayCurrency }) => {
  const theme = useAppTheme();
  const fmt = useMoneyFormatter(displayCurrency);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Chip compact style={{ height: 24 }}>{currency}</Chip>
      </View>
      <Text
        variant="bodyMedium"
        style={{ color: total >= 0 ? theme.colors.onSurface : theme.colors.expense }}>
        {fmt(total)}
      </Text>
    </View>
  );
};
