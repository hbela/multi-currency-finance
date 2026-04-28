import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  TextInput,
  HelperText,
  Text,
  Divider,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useLoanStore } from '../store/loanStore';
import { Loan, LoanPayment } from '../types';
import { calcMonthlyPayment, splitPayment } from '../db/loanPayments';
import { useAppTheme } from '../theme';
import { useMoneyFormatter } from '../hooks/useFormattedAmount';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  loan: Loan;
  remainingBalance: number;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoanPaymentSheet({ loan, remainingBalance, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { addPayment, loadPayments, payments } = useLoanStore();
  const fmt = useMoneyFormatter(loan.currency);

  const loanPayments: LoanPayment[] = payments[loan.id] ?? [];

  useEffect(() => {
    loadPayments(loan.id);
  }, [loan.id]);

  const monthlyPmt = calcMonthlyPayment(
    parseFloat(loan.principalAmount),
    parseFloat(loan.interestRate),
    loan.termMonths
  );

  const [totalPaid, setTotalPaid] = useState(String(monthlyPmt));
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parsedTotal = parseFloat(totalPaid);
  const split = !isNaN(parsedTotal) && parsedTotal > 0
    ? splitPayment(parsedTotal, remainingBalance, parseFloat(loan.interestRate))
    : null;
  const newBalance = split
    ? Math.max(0, remainingBalance - split.principalPaid)
    : remainingBalance;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!totalPaid || isNaN(parsedTotal) || parsedTotal <= 0)
      e.totalPaid = t('loans.payment.errorAmount');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !split) return;
    const dateMs = (() => {
      const d = new Date(paymentDate);
      return isNaN(d.getTime()) ? Date.now() : d.getTime();
    })();
    await addPayment({
      loanId: loan.id,
      paymentDate: dateMs,
      principalPaid: String(Math.round(split.principalPaid * 100) / 100),
      interestPaid: String(Math.round(split.interestPaid * 100) / 100),
      totalPaid: String(Math.round(parsedTotal * 100) / 100),
      remainingBalance: String(Math.round(newBalance * 100) / 100),
    });
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss} style={{ maxHeight: '90%' }}>
        <Dialog.Title>{t('loans.payment.title')}</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <ScrollView contentContainerStyle={styles.content}>

            {/* ── Payment amount ────────────────────────────────────────── */}
            <TextInput
              mode="outlined"
              label={t('loans.payment.totalPaid')}
              value={totalPaid}
              onChangeText={setTotalPaid}
              keyboardType="decimal-pad"
              right={<TextInput.Affix text={loan.currency} />}
              error={!!errors.totalPaid}
            />
            {errors.totalPaid
              ? <HelperText type="error">{errors.totalPaid}</HelperText>
              : <HelperText type="info">{t('loans.monthlyPayment')}: {fmt(monthlyPmt)}</HelperText>
            }

            {/* ── Date ──────────────────────────────────────────────────── */}
            <TextInput
              mode="outlined"
              label={t('loans.payment.date')}
              value={paymentDate}
              onChangeText={setPaymentDate}
              placeholder="YYYY-MM-DD"
            />

            {/* ── Auto-split preview ────────────────────────────────────── */}
            {split && (
              <View style={[styles.splitBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View style={styles.splitRow}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t('loans.payment.principalPaid')}
                  </Text>
                  <Text variant="bodyMedium">{fmt(split.principalPaid)}</Text>
                </View>
                <View style={styles.splitRow}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t('loans.payment.interestPaid')}
                  </Text>
                  <Text variant="bodyMedium">{fmt(split.interestPaid)}</Text>
                </View>
                <Divider style={{ marginVertical: 4 }} />
                <View style={styles.splitRow}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t('loans.payment.remaining')}
                  </Text>
                  <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
                    {fmt(newBalance)}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Payment history ───────────────────────────────────────── */}
            <Text variant="labelLarge" style={{ marginTop: 8 }}>
              {t('loans.payment.history')}
            </Text>
            {loanPayments.length === 0 ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('loans.payment.noPayments')}
              </Text>
            ) : (
              loanPayments.map((p) => (
                <View
                  key={p.id}
                  style={[styles.historyRow, { borderColor: theme.colors.outlineVariant }]}
                >
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySmall">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('loans.payment.principalPaid')}: {fmt(parseFloat(p.principalPaid))} ·{' '}
                      {t('loans.payment.interestPaid')}: {fmt(parseFloat(p.interestPaid))}
                    </Text>
                  </View>
                  <Text variant="labelMedium">{fmt(parseFloat(p.totalPaid))}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }}>
            {t('common.cancel')}
          </Button>
          <Button mode="contained" onPress={handleSave} style={{ flex: 1 }}>
            {t('common.save')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  splitBox: {
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
