import React, { useMemo, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { FAB, Text, Surface, Divider, IconButton, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useLoanStore } from '@/src/store/loanStore';
import { useAccountStore } from '@/src/store/accountStore';
import LoanFormSheet from '@/src/components/LoanFormSheet';
import LoanPaymentSheet from '@/src/components/LoanPaymentSheet';
import { Loan, LoanType } from '@/src/types';
import { useAppTheme } from '@/src/theme';
import { useMoneyFormatter } from '@/src/hooks/useFormattedAmount';
import { calcMonthlyPayment } from '@/src/db/loanPayments';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<LoanType, string> = {
  mortgage: 'home-city-outline',
  personal: 'account-cash-outline',
  auto:     'car-outline',
  student:  'school-outline',
};

// ─── Row ─────────────────────────────────────────────────────────────────────

interface RowProps {
  loan: Loan;
  accountName: string;
  onEdit: () => void;
  onPay: () => void;
}

const LoanRow: React.FC<RowProps> = ({ loan, accountName, onEdit, onPay }) => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const fmt = useMoneyFormatter(loan.currency);

  const monthly = calcMonthlyPayment(
    parseFloat(loan.principalAmount),
    parseFloat(loan.interestRate),
    loan.termMonths
  );

  const startMs = loan.startDate;
  const now = Date.now();
  const elapsedMonths = Math.max(0, Math.floor((now - startMs) / (30.4375 * 24 * 3600 * 1000)));
  const remainingMonths = Math.max(0, loan.termMonths - elapsedMonths);

  // Rough remaining balance (geometric amortisation)
  const principal = parseFloat(loan.principalAmount);
  const rate = parseFloat(loan.interestRate);
  const remainingBalance = (() => {
    if (rate === 0) return Math.max(0, principal - (principal / loan.termMonths) * elapsedMonths);
    const r = rate / 100 / 12;
    const pv = (monthly * (1 - Math.pow(1 + r, -remainingMonths))) / r;
    return Math.max(0, Math.round(pv * 100) / 100);
  })();

  const progressPct = Math.min(1, 1 - remainingBalance / principal);

  return (
    <Surface
      style={[styles.row, { backgroundColor: theme.colors.elevation.level1 }]}
      elevation={0}
    >
      {/* Header row */}
      <View style={styles.rowHeader}>
        <View style={[styles.typeChip, { backgroundColor: theme.colors.secondaryContainer }]}>
          <MaterialCommunityIcons
            name={TYPE_ICON[loan.loanType] as any}
            size={16}
            color={theme.colors.onSecondaryContainer}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" numberOfLines={1}>{loan.name}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {accountName} · {t(`loans.types.${loan.loanType}`)}
            {loan.lender ? ` · ${loan.lender}` : ''}
          </Text>
        </View>
        <IconButton icon="pencil-outline" size={18} onPress={onEdit} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('loans.fields.remainingBalance')}
          </Text>
          <Text variant="titleSmall" style={{ color: theme.colors.error }}>
            {fmt(remainingBalance)}
          </Text>
        </View>
        <Divider style={{ width: 1, height: '100%' }} />
        <View style={styles.statItem}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('loans.monthlyPayment')}
          </Text>
          <Text variant="titleSmall">{fmt(monthly)}</Text>
        </View>
        <Divider style={{ width: 1, height: '100%' }} />
        <View style={styles.statItem}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('loans.fields.remainingBalance').split(' ')[0]} mo.
          </Text>
          <Text variant="titleSmall">{remainingMonths}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPct * 100}%`, backgroundColor: theme.colors.primary },
          ]}
        />
      </View>

      {/* Pay button */}
      <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
        <Chip
          icon="cash-plus"
          mode="outlined"
          compact
          onPress={onPay}
          textStyle={{ fontSize: 12 }}
        >
          {t('loans.payment.title')}
        </Chip>
      </View>
    </Surface>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LoansScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const loans = useLoanStore((s) => s.items);
  const accounts = useAccountStore((s) => s.items);

  const [formVisible, setFormVisible] = useState(false);
  const [payVisible, setPayVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Loan | undefined>();
  const [payTarget, setPayTarget] = useState<Loan | undefined>();

  const openAdd = () => { setEditTarget(undefined); setFormVisible(true); };
  const openEdit = (l: Loan) => { setEditTarget(l); setFormVisible(true); };
  const openPay = (l: Loan) => { setPayTarget(l); setPayVisible(true); };

  // Summary totals — rough remaining balances
  const totals = useMemo(() => {
    return loans.reduce(
      (acc, loan) => {
        const principal = parseFloat(loan.principalAmount);
        const rate = parseFloat(loan.interestRate);
        const monthly = calcMonthlyPayment(principal, rate, loan.termMonths);
        const elapsedMonths = Math.max(
          0,
          Math.floor((Date.now() - loan.startDate) / (30.4375 * 24 * 3600 * 1000))
        );
        const remainingMonths = Math.max(0, loan.termMonths - elapsedMonths);
        const remaining = (() => {
          if (rate === 0) return Math.max(0, principal - (principal / loan.termMonths) * elapsedMonths);
          const r = rate / 100 / 12;
          if (remainingMonths === 0) return 0;
          const pv = (monthly * (1 - Math.pow(1 + r, -remainingMonths))) / r;
          return Math.max(0, pv);
        })();
        return { debt: acc.debt + remaining, monthly: acc.monthly + monthly };
      },
      { debt: 0, monthly: 0 }
    );
  }, [loans]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* ── Summary card ──────────────────────────────────────────────── */}
      {loans.length > 0 && (
        <Surface style={[styles.summary, { backgroundColor: theme.colors.elevation.level2 }]} elevation={1}>
          <View style={styles.summaryItem}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('loans.totalDebt')}
            </Text>
            <Text variant="headlineSmall" style={{ color: theme.colors.error }}>
              {totals.debt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <Divider style={{ width: 1, height: '100%' }} />
          <View style={styles.summaryItem}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('loans.monthlyPayment')}
            </Text>
            <Text variant="headlineSmall">
              {totals.monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </Surface>
      )}

      {/* ── List ──────────────────────────────────────────────────────── */}
      {loans.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="handshake" size={48} color={theme.colors.outlineVariant} />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, textAlign: 'center' }}
          >
            {t('loans.noLoans')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 96 }}
          renderItem={({ item }) => (
            <LoanRow
              loan={item}
              accountName={accounts.find((a) => a.id === item.accountId)?.name ?? '—'}
              onEdit={() => openEdit(item)}
              onPay={() => openPay(item)}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={openAdd}
      />

      {formVisible && (
        <LoanFormSheet
          loan={editTarget}
          onDismiss={() => setFormVisible(false)}
        />
      )}

      {payVisible && payTarget && (
        <LoanPaymentSheet
          loan={payTarget}
          remainingBalance={(() => {
            const principal = parseFloat(payTarget.principalAmount);
            const rate = parseFloat(payTarget.interestRate);
            const monthly = calcMonthlyPayment(principal, rate, payTarget.termMonths);
            const elapsedMonths = Math.max(
              0,
              Math.floor((Date.now() - payTarget.startDate) / (30.4375 * 24 * 3600 * 1000))
            );
            const remainingMonths = Math.max(0, payTarget.termMonths - elapsedMonths);
            if (rate === 0) return Math.max(0, principal - (principal / payTarget.termMonths) * elapsedMonths);
            const r = rate / 100 / 12;
            if (remainingMonths === 0) return 0;
            return Math.max(0, (monthly * (1 - Math.pow(1 + r, -remainingMonths))) / r);
          })()}
          onDismiss={() => setPayVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
  row: {
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
