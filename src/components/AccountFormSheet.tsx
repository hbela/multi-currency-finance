import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  TextInput,
  SegmentedButtons,
  HelperText,
  Menu,
  Text,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAccountStore } from '../store/accountStore';
import { useCurrencyStore } from '../store/currencyStore';
import { Account, AccountType } from '../types';
import { useAppTheme } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'cash',       label: 'Cash',        icon: 'cash' },
  { value: 'bank',       label: 'Bank',        icon: 'bank' },
  { value: 'card',       label: 'Card',        icon: 'credit-card' },
  { value: 'investment', label: 'Invest',      icon: 'chart-line' },
  { value: 'crypto',     label: 'Crypto',      icon: 'bitcoin' },
  { value: 'loan',       label: 'Loan',        icon: 'handshake' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  account?: Account;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AccountFormSheet({ account, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { add, update, deactivate } = useAccountStore();
  const currencies = useCurrencyStore((s) => s.items);

  const isEdit = !!account;

  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'bank');
  const [currency, setCurrency] = useState(account?.currency ?? '');
  const [institution, setInstitution] = useState(account?.institution ?? '');
  const [notes, setNotes] = useState(account?.notes ?? '');
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const nameError = name.trim().length === 0 ? t('accounts.form.errorName') : undefined;
  const currencyError = currency.trim().length === 0 ? t('accounts.form.errorCurrency') : undefined;

  const handleSave = async () => {
    if (nameError || currencyError) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await update({
          ...account!,
          name: name.trim(),
          type,
          currency: currency.trim().toUpperCase(),
          institution: institution.trim() || null,
          notes: notes.trim() || null,
        });
      } else {
        await add({
          name: name.trim(),
          type,
          currency: currency.trim().toUpperCase(),
          institution: institution.trim() || null,
          notes: notes.trim() || null,
        });
      }
      onDismiss();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deactivate(account!.id);
      onDismiss();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>
          {isEdit ? t('accounts.form.titleEdit') : t('accounts.form.titleAdd')}
        </Dialog.Title>

        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView contentContainerStyle={styles.form}>
            {/* Name */}
            <TextInput
              mode="outlined"
              label={t('accounts.form.name')}
              value={name}
              onChangeText={setName}
              error={!!nameError && name.length > 0}
            />
            {nameError && name.length > 0 && (
              <HelperText type="error">{nameError}</HelperText>
            )}

            {/* Type */}
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              {t('accounts.form.type')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {ACCOUNT_TYPES.map((at) => (
                  <Button
                    key={at.value}
                    mode={type === at.value ? 'contained' : 'outlined'}
                    icon={at.icon}
                    onPress={() => setType(at.value)}
                    compact>
                    {at.label}
                  </Button>
                ))}
              </View>
            </ScrollView>

            {/* Currency */}
            <Menu
              visible={currencyMenuOpen}
              onDismiss={() => setCurrencyMenuOpen(false)}
              anchor={
                <TextInput
                  mode="outlined"
                  label={t('accounts.form.currency')}
                  value={currency}
                  onChangeText={(v) => setCurrency(v.toUpperCase())}
                  autoCapitalize="characters"
                  right={
                    <TextInput.Icon
                      icon="chevron-down"
                      onPress={() => setCurrencyMenuOpen(true)}
                    />
                  }
                  error={!!currencyError && currency.length > 0}
                />
              }>
              {currencies.slice(0, 20).map((c) => (
                <Menu.Item
                  key={c.code}
                  title={`${c.code} – ${c.name}`}
                  trailingIcon={currency === c.code ? 'check' : undefined}
                  onPress={() => {
                    setCurrency(c.code);
                    setCurrencyMenuOpen(false);
                  }}
                />
              ))}
            </Menu>
            {currencyError && currency.length > 0 && (
              <HelperText type="error">{currencyError}</HelperText>
            )}

            {/* Institution */}
            <TextInput
              mode="outlined"
              label={t('accounts.form.institution')}
              value={institution}
              onChangeText={setInstitution}
            />

            {/* Notes */}
            <TextInput
              mode="outlined"
              label={t('accounts.form.notes')}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions style={styles.actions}>
          {isEdit && !deleteConfirm && (
            <Button
              textColor={theme.colors.error}
              onPress={() => setDeleteConfirm(true)}
              disabled={submitting}>
              {t('common.delete')}
            </Button>
          )}
          {isEdit && deleteConfirm && (
            <Button
              textColor={theme.colors.error}
              onPress={handleDelete}
              loading={submitting}
              disabled={submitting}>
              {t('accounts.form.confirmDelete')}
            </Button>
          )}
          <Button onPress={onDismiss} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={submitting}
            disabled={submitting || !!nameError || !!currencyError}>
            {t('common.save')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: { maxHeight: '85%' },
  scrollArea: { paddingHorizontal: 0 },
  form: { gap: 12, paddingHorizontal: 24, paddingBottom: 8 },
  actions: { flexWrap: 'wrap', gap: 4 },
});
