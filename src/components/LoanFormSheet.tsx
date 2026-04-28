import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  TextInput,
  HelperText,
  Menu,
  Text,
  SegmentedButtons,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useLoanStore } from '../store/loanStore';
import { useAccountStore } from '../store/accountStore';
import { Loan, LoanType } from '../types';
import { useAppTheme } from '../theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const LOAN_TYPES: LoanType[] = ['personal', 'mortgage', 'auto', 'student'];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  loan?: Loan;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoanFormSheet({ loan, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { add, update, close: closeLoan, remove } = useLoanStore();
  const accounts = useAccountStore((s) => s.items.filter((a) => a.isActive === 1));

  const isEdit = !!loan;

  const [name, setName] = useState(loan?.name ?? '');
  const [accountId, setAccountId] = useState(loan?.accountId ?? '');
  const [principal, setPrincipal] = useState(loan?.principalAmount ?? '');
  const [currency, setCurrency] = useState(loan?.currency ?? 'USD');
  const [interestRate, setInterestRate] = useState(loan?.interestRate ?? '');
  const [startDate, setStartDate] = useState(
    loan ? new Date(loan.startDate).toISOString().slice(0, 10) : ''
  );
  const [termMonths, setTermMonths] = useState(loan ? String(loan.termMonths) : '');
  const [loanType, setLoanType] = useState<LoanType>(loan?.loanType ?? 'personal');
  const [lender, setLender] = useState(loan?.lender ?? '');
  const [notes, setNotes] = useState(loan?.notes ?? '');

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('loans.form.errorName');
    if (!accountId) e.account = t('loans.form.errorAccount');
    if (!principal || isNaN(parseFloat(principal)) || parseFloat(principal) <= 0)
      e.principal = t('loans.form.errorPrincipal');
    if (!interestRate || isNaN(parseFloat(interestRate)) || parseFloat(interestRate) < 0)
      e.interestRate = t('loans.form.errorRate');
    if (!termMonths || isNaN(parseInt(termMonths, 10)) || parseInt(termMonths, 10) <= 0)
      e.termMonths = t('loans.form.errorTerm');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const parsedStartDate = (): number => {
    const d = new Date(startDate || Date.now());
    return isNaN(d.getTime()) ? Date.now() : d.getTime();
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = {
      accountId,
      name: name.trim(),
      principalAmount: principal,
      currency: currency.trim().toUpperCase() || 'USD',
      interestRate,
      startDate: parsedStartDate(),
      termMonths: parseInt(termMonths, 10),
      loanType,
      lender: lender.trim() || null,
      notes: notes.trim() || null,
    };
    if (isEdit) {
      await update(loan.id, payload);
    } else {
      await add(payload);
    }
    onDismiss();
  };

  const handleClose = async () => {
    if (!closeConfirm) { setCloseConfirm(true); return; }
    await closeLoan(loan!.id);
    onDismiss();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    await remove(loan!.id);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss} style={{ maxHeight: '90%' }}>
        <Dialog.Title>
          {isEdit ? t('loans.form.titleEdit') : t('loans.form.titleAdd')}
        </Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <ScrollView contentContainerStyle={styles.content}>

            {/* ── Loan type ────────────────────────────────────────────── */}
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('loans.fields.loanType')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <SegmentedButtons
                value={loanType}
                onValueChange={(v) => setLoanType(v as LoanType)}
                buttons={LOAN_TYPES.map((type) => ({
                  value: type,
                  label: t(`loans.types.${type}`),
                }))}
              />
            </ScrollView>

            {/* ── Name ─────────────────────────────────────────────────── */}
            <TextInput
              mode="outlined"
              label={t('loans.fields.name')}
              value={name}
              onChangeText={setName}
              error={!!errors.name}
            />
            {errors.name ? <HelperText type="error">{errors.name}</HelperText> : null}

            {/* ── Account picker ───────────────────────────────────────── */}
            <Menu
              visible={accountMenuOpen}
              onDismiss={() => setAccountMenuOpen(false)}
              anchor={
                <TextInput
                  mode="outlined"
                  label={t('loans.fields.account')}
                  value={selectedAccount ? `${selectedAccount.name} · ${selectedAccount.currency}` : ''}
                  onFocus={() => setAccountMenuOpen(true)}
                  showSoftInputOnFocus={false}
                  right={<TextInput.Icon icon="chevron-down" onPress={() => setAccountMenuOpen(true)} />}
                  error={!!errors.account}
                />
              }
            >
              {accounts.map((a) => (
                <Menu.Item
                  key={a.id}
                  title={`${a.name} · ${a.currency}`}
                  leadingIcon={accountId === a.id ? 'check' : undefined}
                  onPress={() => {
                    setAccountId(a.id);
                    if (!currency) setCurrency(a.currency);
                    setAccountMenuOpen(false);
                  }}
                />
              ))}
            </Menu>
            {errors.account ? <HelperText type="error">{errors.account}</HelperText> : null}

            {/* ── Principal + currency ─────────────────────────────────── */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                mode="outlined"
                label={t('loans.fields.principal')}
                value={principal}
                onChangeText={setPrincipal}
                keyboardType="decimal-pad"
                style={{ flex: 2 }}
                error={!!errors.principal}
              />
              <TextInput
                mode="outlined"
                label={t('loans.fields.currency')}
                value={currency}
                onChangeText={setCurrency}
                autoCapitalize="characters"
                style={{ flex: 1 }}
              />
            </View>
            {errors.principal ? <HelperText type="error">{errors.principal}</HelperText> : null}

            {/* ── Interest rate ────────────────────────────────────────── */}
            <TextInput
              mode="outlined"
              label={t('loans.fields.interestRate')}
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="decimal-pad"
              right={<TextInput.Affix text="%" />}
              error={!!errors.interestRate}
            />
            {errors.interestRate ? <HelperText type="error">{errors.interestRate}</HelperText> : null}

            {/* ── Term months ──────────────────────────────────────────── */}
            <TextInput
              mode="outlined"
              label={t('loans.fields.termMonths')}
              value={termMonths}
              onChangeText={setTermMonths}
              keyboardType="number-pad"
              error={!!errors.termMonths}
            />
            {errors.termMonths ? <HelperText type="error">{errors.termMonths}</HelperText> : null}

            {/* ── Start date ───────────────────────────────────────────── */}
            <TextInput
              mode="outlined"
              label={t('loans.fields.startDate')}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
            />

            {/* ── Lender ───────────────────────────────────────────────── */}
            <TextInput
              mode="outlined"
              label={t('loans.fields.lender')}
              value={lender}
              onChangeText={setLender}
            />

            {/* ── Notes ────────────────────────────────────────────────── */}
            <TextInput
              mode="outlined"
              label={t('loans.fields.notes')}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions style={{ flexDirection: 'column', gap: 4 }}>
          {isEdit && (
            <>
              <Button
                mode="text"
                textColor={theme.colors.secondary}
                onPress={handleClose}
                style={{ alignSelf: 'stretch' }}
              >
                {closeConfirm ? t('loans.form.confirmClose') : t('loans.closed')}
              </Button>
              <Button
                mode="text"
                textColor={theme.colors.error}
                onPress={handleDelete}
                style={{ alignSelf: 'stretch' }}
              >
                {deleteConfirm ? t('loans.form.confirmDelete') : t('common.delete')}
              </Button>
            </>
          )}
          <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleSave} style={{ flex: 1 }}>
              {t('common.save')}
            </Button>
          </View>
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
});
