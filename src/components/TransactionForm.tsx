import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, HelperText, Menu, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';

import { AmountInput } from './AmountInput';
import { CategoryPicker } from './CategoryPicker';
import { AccountPicker } from './AccountPicker';
import { DictationButton } from './DictationButton';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { useAssetStore } from '../store/assetStore';
import { useHoldingStore } from '../store/holdingStore';
import { Transaction, TransactionType } from '../types';
import { useAppTheme } from '../theme';
import { CreateTransactionInput } from '../db/transactions';
import { applyHoldingTransaction } from '../db/holdings';
import { useLocaleStore } from '../store/localeStore';
import { useMoneyFormatter } from '../hooks/useFormattedAmount';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_CURRENCY = 'HUF';

const CURRENCIES = [
  { code: 'HUF', label: 'HUF – Forint' },
  { code: 'EUR', label: 'EUR – Euro' },
  { code: 'USD', label: 'USD – Dollar' },
  { code: 'GBP', label: 'GBP – Pound' },
];

const ALL_TYPES: TransactionType[] = [
  'EXPENSE', 'INCOME', 'TRANSFER',
  'INVESTMENT_BUY', 'INVESTMENT_SELL',
  'LOAN_RECEIVED', 'LOAN_REPAYMENT',
];

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER', 'INVESTMENT_BUY', 'INVESTMENT_SELL', 'LOAN_RECEIVED', 'LOAN_REPAYMENT']),
  amount: z.number({ message: 'Amount must be a positive number' })
    .positive({ message: 'Amount must be a positive number' })
    .nullable(),
  currency: z.string().min(1, 'Currency is required').max(8),
  exchangeRate: z.string().refine(
    (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0; },
    { message: 'Exchange rate must be positive' }
  ),
  accountId: z.string().nullable(),
  // Transfer-specific
  fromAccountId: z.string().nullable(),
  toAccountId: z.string().nullable(),
  receivedAmount: z.string(),
  toCurrency: z.string().max(8),
  categoryId: z.string().nullable(),
  description: z.string(),
  source: z.string(),
  notes: z.string(),
  // Investment fields
  securityName: z.string(),
  symbol: z.string(),
  quantity: z.string(),
  price: z.string(),
  investFee: z.string(),
  // Loan fields
  creditor: z.string(),
  interestRate: z.string(),
  remainingTerm: z.string(),
  // Transfer detail fields
  counterparty: z.string(),
  reference: z.string(),
  transferFee: z.string(),
});

type FormValues = z.infer<typeof schema>;

// ─── Public API ───────────────────────────────────────────────────────────────

export type TransactionFormValues = CreateTransactionInput;

interface Props {
  initial?: Transaction;
  onSubmit: (v: TransactionFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  submitLabel?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseDetails = (raw: string | null): Record<string, unknown> => {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
};

// ─── Shared TextRow ───────────────────────────────────────────────────────────

interface TextRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dictId: string;
  numeric?: boolean;
  error?: string;
}

const TextRow: React.FC<TextRowProps> = ({ label, value, onChange, dictId, numeric, error }) => (
  <View>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        style={{ flex: 1 }}
        error={!!error}
      />
      {!numeric && (
        <DictationButton
          id={dictId}
          onDictationComplete={(text) => onChange(value ? value + ' ' + text : text)}
        />
      )}
    </View>
    {error ? <HelperText type="error">{error}</HelperText> : null}
  </View>
);

// ─── Type-specific detail sections ───────────────────────────────────────────

interface InvestmentDetailFields {
  securityName: string; onSecurityName: (v: string) => void;
  symbol: string; onSymbol: (v: string) => void;
  quantity: string; onQuantity: (v: string) => void;
  price: string; onPrice: (v: string) => void;
  fee: string; onFee: (v: string) => void;
}
const InvestmentDetails: React.FC<InvestmentDetailFields> = (p) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.details')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.securityName')} value={p.securityName} onChange={p.onSecurityName} dictId="security_name" />
        <TextRow label={t('txn.fields.symbol')} value={p.symbol} onChange={p.onSymbol} dictId="symbol" />
        <TextRow label={t('txn.fields.quantity')} value={p.quantity} onChange={p.onQuantity} dictId="quantity" numeric />
        <TextRow label={t('txn.fields.price')} value={p.price} onChange={p.onPrice} dictId="price" numeric />
        <TextRow label={t('txn.fields.fee')} value={p.fee} onChange={p.onFee} dictId="fee" numeric />
      </Card.Content>
    </Card>
  );
};

interface LoanDetailFields {
  creditor: string; onCreditor: (v: string) => void;
  interestRate: string; onInterestRate: (v: string) => void;
  remainingTerm: string; onRemainingTerm: (v: string) => void;
}
const LoanDetails: React.FC<LoanDetailFields> = (p) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.details')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.creditor')} value={p.creditor} onChange={p.onCreditor} dictId="creditor" />
        <TextRow label={t('txn.fields.interestRate')} value={p.interestRate} onChange={p.onInterestRate} dictId="interest_rate" numeric />
        <TextRow label={t('txn.fields.remainingTerm')} value={p.remainingTerm} onChange={p.onRemainingTerm} dictId="remaining_term" numeric />
      </Card.Content>
    </Card>
  );
};

interface TransferDetailFields {
  counterparty: string; onCounterparty: (v: string) => void;
  reference: string; onReference: (v: string) => void;
  fee: string; onFee: (v: string) => void;
}
const TransferDetails: React.FC<TransferDetailFields> = (p) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.details')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.counterparty')} value={p.counterparty} onChange={p.onCounterparty} dictId="counterparty" />
        <TextRow label={t('txn.fields.reference')} value={p.reference} onChange={p.onReference} dictId="reference" />
        <TextRow label={t('txn.fields.fee')} value={p.fee} onChange={p.onFee} dictId="fee" numeric />
      </Card.Content>
    </Card>
  );
};

// ─── Multi-currency section ───────────────────────────────────────────────────

interface CurrencyRowProps {
  currency: string; onCurrency: (v: string) => void;
  exchangeRate: string; onExchangeRate: (v: string) => void;
  amountBase: number | null;
  exchangeRateError?: string;
}
const CurrencyRow: React.FC<CurrencyRowProps> = (p) => {
  const { t } = useTranslation();
  const fmt = useMoneyFormatter(BASE_CURRENCY);
  return (
    <Card>
      <Card.Title title={t('txn.sections.currency')} />
      <Card.Content style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            mode="outlined"
            label={t('txn.fields.currency')}
            value={p.currency}
            onChangeText={p.onCurrency}
            style={{ width: 90 }}
            autoCapitalize="characters"
          />
          <View style={{ flex: 1 }}>
            <TextInput
              mode="outlined"
              label={t('txn.fields.exchangeRate')}
              value={p.exchangeRate}
              onChangeText={p.onExchangeRate}
              keyboardType="decimal-pad"
              error={!!p.exchangeRateError}
            />
            {p.exchangeRateError ? <HelperText type="error">{p.exchangeRateError}</HelperText> : null}
          </View>
        </View>
        <TextInput
          mode="outlined"
          label={`${t('txn.fields.amountBase')} (${BASE_CURRENCY})`}
          value={p.amountBase != null ? fmt(p.amountBase) : ''}
          editable={false}
          style={{ backgroundColor: 'transparent' }}
        />
      </Card.Content>
    </Card>
  );
};

// ─── Main form ────────────────────────────────────────────────────────────────

export const TransactionForm: React.FC<Props> = ({
  initial,
  onSubmit,
  onDelete,
  submitLabel,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const accounts = useAccountStore((s) => s.items);
  const categories = useCategoryStore((s) => s.items);
  const { add: addAsset, items: assetItems } = useAssetStore();
  const { load: reloadHoldings } = useHoldingStore();
  const lang = useLocaleStore((s) => s.lang);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);

  const initDetails = parseDetails(initial?.details ?? null);
  const accountCurrency =
    accounts.find((a) => a.id === (initial?.accountId ?? accounts[0]?.id))?.currency ??
    BASE_CURRENCY;

  const form = useForm({
    defaultValues: {
      type: (initial?.type ?? 'EXPENSE') as TransactionType,
      amount: initial?.amount != null ? parseFloat(initial.amount) : null,
      currency: initial?.currency ?? accountCurrency,
      exchangeRate: initial?.exchangeRate ?? '1',
      accountId: initial?.accountId ?? accounts[0]?.id ?? null,
      // Transfer-specific
      fromAccountId: initial?.fromAccountId ?? accounts[0]?.id ?? null,
      toAccountId: initial?.toAccountId ?? null,
      receivedAmount: initial?.receivedAmount ?? '',
      toCurrency: (() => {
        const toAcc = accounts.find((a) => a.id === initial?.toAccountId);
        return toAcc?.currency ?? '';
      })(),
      categoryId: initial?.categoryId ?? null,
      description: initial?.description ?? '',
      source: initial?.source ?? '',
      notes: initial?.notes ?? '',
      // Investment
      securityName: String(initDetails.security_name ?? ''),
      symbol: String(initDetails.symbol ?? ''),
      quantity: initDetails.quantity != null ? String(initDetails.quantity) : '',
      price: initDetails.price != null ? String(initDetails.price) : '',
      investFee: initDetails.fee != null ? String(initDetails.fee) : '',
      // Loan
      creditor: String(initDetails.creditor ?? ''),
      interestRate: initDetails.interest_rate != null ? String(initDetails.interest_rate) : '',
      remainingTerm: initDetails.remaining_term != null ? String(initDetails.remaining_term) : '',
      // Transfer detail fields
      counterparty: String(initDetails.counterparty ?? ''),
      reference: String(initDetails.reference ?? ''),
      transferFee: initDetails.fee != null ? String(initDetails.fee) : '',
    } satisfies FormValues,
    validators: {
      onSubmit: ({ value }) => {
        const result = schema.safeParse(value);
        if (result.success) return undefined;
        return result.error.issues[0]?.message ?? 'Validation error';
      },
    },
    onSubmit: async ({ value }) => {
      const parsed = value.amount!;
      const rate = parseFloat(value.exchangeRate);
      const isTransfer = value.type === 'TRANSFER';
      const amountBase =
        value.currency === BASE_CURRENCY
          ? String(parsed)
          : String(Math.round(parsed * rate));

      const buildDetails = (): Record<string, unknown> => {
        const type = value.type as TransactionType;
        if (type === 'INVESTMENT_BUY' || type === 'INVESTMENT_SELL') {
          return {
            security_name: value.securityName,
            symbol: value.symbol,
            quantity: parseFloat(value.quantity) || null,
            price: parseFloat(value.price) || null,
            fee: parseFloat(value.investFee) || null,
          };
        }
        if (type === 'LOAN_RECEIVED' || type === 'LOAN_REPAYMENT') {
          return {
            creditor: value.creditor,
            interest_rate: parseFloat(value.interestRate) || null,
            remaining_term: parseInt(value.remainingTerm, 10) || null,
          };
        }
        if (type === 'TRANSFER') {
          return {
            counterparty: value.counterparty,
            reference: value.reference,
            fee: parseFloat(value.transferFee) || null,
          };
        }
        return {};
      };

      const receivedAmt = value.receivedAmount.trim();
      const txnType = value.type as TransactionType;
      await onSubmit({
        type: txnType,
        date: initial?.date ?? Date.now(),
        amount: String(parsed),
        currency: value.currency.trim() || BASE_CURRENCY,
        amountBase,
        baseCurrency: BASE_CURRENCY,
        exchangeRate: value.exchangeRate.trim() || '1',
        // For transfers, accountId = fromAccount (for back-compat); proper fields below.
        accountId: isTransfer ? (value.fromAccountId ?? null) : value.accountId,
        fromAccountId: isTransfer ? value.fromAccountId : null,
        toAccountId: isTransfer ? value.toAccountId : null,
        receivedAmount: isTransfer && receivedAmt ? receivedAmt : null,
        categoryId: value.categoryId,
        description: value.description.trim() || null,
        source: value.source.trim() || null,
        notes: value.notes.trim() || null,
        details: buildDetails(),
        status: 'cleared',
      });

      // Update holding position for investment transactions
      if (
        (txnType === 'INVESTMENT_BUY' || txnType === 'INVESTMENT_SELL') &&
        value.symbol.trim() &&
        value.quantity &&
        value.price &&
        value.accountId
      ) {
        const sym = value.symbol.trim().toUpperCase();
        const cur = value.currency.trim() || BASE_CURRENCY;
        let asset = assetItems.find(
          (a) => a.symbol === sym && a.currency === cur
        );
        if (!asset) {
          asset = await addAsset({
            symbol: sym,
            name: value.securityName.trim() || sym,
            assetClass: 'stock',
            currency: cur,
            exchange: null,
          });
        }
        const qty = parseFloat(value.quantity);
        const price = parseFloat(value.price);
        if (qty > 0 && price >= 0) {
          await applyHoldingTransaction(
            asset.id,
            value.accountId,
            qty,
            price,
            txnType === 'INVESTMENT_BUY'
          );
          await reloadHoldings();
        }
      }
    },
  });

  return (
    <form.Subscribe selector={(s) => s.values}>
      {(values) => {
        const type = values.type as TransactionType;
        const isInvestment = type === 'INVESTMENT_BUY' || type === 'INVESTMENT_SELL';
        const isLoan = type === 'LOAN_RECEIVED' || type === 'LOAN_REPAYMENT';
        const isTransfer = type === 'TRANSFER';
        const isForeignCurrency = values.currency !== BASE_CURRENCY;

        const computedAmountBase = (() => {
          const a = values.amount;
          const r = parseFloat(values.exchangeRate);
          if (a == null || !Number.isFinite(a) || !Number.isFinite(r) || r === 0) return null;
          if (values.currency === BASE_CURRENCY) return a;
          return Math.round(a * r);
        })();

        return (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 16 + insets.bottom, gap: 16 }}>
            {/* Type selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {ALL_TYPES.map((txnType) => (
                <Button
                  key={txnType}
                  mode={type === txnType ? 'contained' : 'outlined'}
                  onPress={() => {
                    form.setFieldValue('type', txnType);
                    form.setFieldValue('categoryId', null);
                  }}
                  compact>
                  {t(`txn.types.${txnType}`)}
                </Button>
              ))}
            </ScrollView>

            {/* Amount + currency */}
            <form.Field name="amount" validators={{ onChange: ({ value }) =>
              (value != null && value > 0) ? undefined : 'Amount must be a positive number',
            }}>
              {(field) => (
                <View>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <AmountInput
                      value={field.state.value}
                      onChangeValue={field.handleChange}
                      currency={values.currency}
                      lang={lang}
                      autoFocus={!initial}
                      style={{ flex: 1 }}
                      error={field.state.meta.errors.length > 0}
                    />
                    <form.Field name="currency">
                      {(cField) => (
                        <Menu
                          visible={currencyMenuOpen}
                          onDismiss={() => setCurrencyMenuOpen(false)}
                          anchor={
                            <Button
                              mode="outlined"
                              onPress={() => setCurrencyMenuOpen(true)}
                              style={{ minWidth: 90 }}>
                              {cField.state.value || 'Currency'}
                            </Button>
                          }>
                          {CURRENCIES.map((c) => (
                            <Menu.Item
                              key={c.code}
                              title={c.label}
                              trailingIcon={cField.state.value === c.code ? 'check' : undefined}
                              onPress={() => {
                                cField.handleChange(c.code);
                                setCurrencyMenuOpen(false);
                              }}
                            />
                          ))}
                        </Menu>
                      )}
                    </form.Field>
                  </View>
                  {field.state.meta.errors.length > 0 && (
                    <HelperText type="error">{field.state.meta.errors[0]}</HelperText>
                  )}
                </View>
              )}
            </form.Field>

            <form.Field name="categoryId">
              {(field) => (
                <CategoryPicker
                  categories={categories}
                  value={field.state.value}
                  onChange={field.handleChange}
                  type={type}
                />
              )}
            </form.Field>

            {/* Account picker(s) */}
            {isTransfer ? (
              <Card>
                <Card.Title title={t('txn.sections.transfer')} />
                <Card.Content style={{ gap: 12 }}>
                  <form.Field name="fromAccountId">
                    {(field) => (
                      <AccountPicker
                        accounts={accounts}
                        value={field.state.value}
                        onChange={(id) => {
                          field.handleChange(id);
                          const acc = accounts.find((a) => a.id === id);
                          if (acc) form.setFieldValue('currency', acc.currency);
                        }}
                        label={t('txn.fields.fromAccount')}
                      />
                    )}
                  </form.Field>
                  <form.Field name="toAccountId">
                    {(field) => (
                      <AccountPicker
                        accounts={accounts}
                        value={field.state.value}
                        onChange={(id) => {
                          field.handleChange(id);
                          const acc = accounts.find((a) => a.id === id);
                          if (acc) form.setFieldValue('toCurrency', acc.currency);
                        }}
                        label={t('txn.fields.toAccount')}
                      />
                    )}
                  </form.Field>
                  <form.Field name="receivedAmount">
                    {(field) => (
                      <form.Subscribe selector={(s) => s.values.toCurrency}>
                        {(toCur) => (
                          <TextInput
                            mode="outlined"
                            label={`${t('txn.fields.receivedAmount')} (${toCur || '?'})`}
                            value={field.state.value}
                            onChangeText={field.handleChange}
                            keyboardType="decimal-pad"
                          />
                        )}
                      </form.Subscribe>
                    )}
                  </form.Field>
                </Card.Content>
              </Card>
            ) : (
              <form.Field name="accountId">
                {(field) => (
                  <AccountPicker
                    accounts={accounts}
                    value={field.state.value}
                    onChange={field.handleChange}
                  />
                )}
              </form.Field>
            )}

            {/* Description */}
            <form.Field name="description">
              {(field) => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    mode="outlined"
                    label={t('txn.fields.description')}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    style={{ flex: 1 }}
                  />
                  <DictationButton
                    id="description-field"
                    onDictationComplete={(text) =>
                      field.handleChange(field.state.value ? field.state.value + ' ' + text : text)
                    }
                  />
                </View>
              )}
            </form.Field>

            {/* Source */}
            <form.Field name="source">
              {(field) => (
                <TextInput
                  mode="outlined"
                  label={t('txn.fields.source')}
                  value={field.state.value}
                  onChangeText={field.handleChange}
                />
              )}
            </form.Field>

            {/* Type-specific detail sections */}
            {isInvestment && (
              <InvestmentDetails
                securityName={values.securityName}
                onSecurityName={(v) => form.setFieldValue('securityName', v)}
                symbol={values.symbol}
                onSymbol={(v) => form.setFieldValue('symbol', v)}
                quantity={values.quantity}
                onQuantity={(v) => form.setFieldValue('quantity', v)}
                price={values.price}
                onPrice={(v) => form.setFieldValue('price', v)}
                fee={values.investFee}
                onFee={(v) => form.setFieldValue('investFee', v)}
              />
            )}
            {isLoan && (
              <LoanDetails
                creditor={values.creditor}
                onCreditor={(v) => form.setFieldValue('creditor', v)}
                interestRate={values.interestRate}
                onInterestRate={(v) => form.setFieldValue('interestRate', v)}
                remainingTerm={values.remainingTerm}
                onRemainingTerm={(v) => form.setFieldValue('remainingTerm', v)}
              />
            )}
            {isTransfer && (
              <TransferDetails
                counterparty={values.counterparty}
                onCounterparty={(v) => form.setFieldValue('counterparty', v)}
                reference={values.reference}
                onReference={(v) => form.setFieldValue('reference', v)}
                fee={values.transferFee}
                onFee={(v) => form.setFieldValue('transferFee', v)}
              />
            )}

            {/* Multi-currency */}
            {isForeignCurrency && (
              <form.Field name="exchangeRate" validators={{ onChange: ({ value }) => {
                const n = parseFloat(value);
                return (Number.isFinite(n) && n > 0) ? undefined : 'Exchange rate must be positive';
              }}}>
                {(field) => (
                  <CurrencyRow
                    currency={values.currency}
                    onCurrency={(v) => form.setFieldValue('currency', v)}
                    exchangeRate={field.state.value}
                    onExchangeRate={field.handleChange}
                    amountBase={computedAmountBase}
                    exchangeRateError={field.state.meta.errors[0]?.toString()}
                  />
                )}
              </form.Field>
            )}

            {/* Notes */}
            <form.Field name="notes">
              {(field) => (
                <TextInput
                  mode="outlined"
                  label={t('txn.fields.notes')}
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  multiline
                  numberOfLines={2}
                />
              )}
            </form.Field>

            <form.Subscribe selector={(s) => ({ isSubmitting: s.isSubmitting, canSubmit: s.canSubmit })}>
              {({ isSubmitting, canSubmit }) => (
                <View style={{ gap: 8 }}>
                  <Button
                    mode="contained"
                    onPress={() => form.handleSubmit()}
                    loading={isSubmitting}
                    disabled={!canSubmit || isSubmitting}>
                    {submitLabel ?? t('form.save')}
                  </Button>
                  {onDelete && (
                    <Button
                      mode="outlined"
                      textColor={theme.colors.error}
                      onPress={onDelete}
                      disabled={isSubmitting}>
                      {t('form.delete')}
                    </Button>
                  )}
                </View>
              )}
            </form.Subscribe>
          </ScrollView>
        );
      }}
    </form.Subscribe>
  );
};
