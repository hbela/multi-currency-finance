import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { AmountInput } from './AmountInput';
import { CategoryPicker } from './CategoryPicker';
import { AccountPicker } from './AccountPicker';
import { DictationButton } from './DictationButton';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { Transaction, TransactionType } from '../types';
import { useAppTheme } from '../theme';
import { CreateTransactionInput } from '../db/transactions';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_CURRENCY = 'HUF';

const ALL_TYPES: TransactionType[] = [
  'EXPENSE', 'INCOME', 'TRANSFER',
  'INVESTMENT_BUY', 'INVESTMENT_SELL',
  'LOAN_RECEIVED', 'LOAN_REPAYMENT',
  'DIVIDEND', 'INTEREST', 'CREDIT_CARD_PAYMENT',
];

// ─── Form value shape ─────────────────────────────────────────────────────────

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
}

const TextRow: React.FC<TextRowProps> = ({ label, value, onChange, dictId, numeric }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={onChange}
      keyboardType={numeric ? 'decimal-pad' : 'default'}
      style={{ flex: 1 }}
    />
    {!numeric && (
      <DictationButton
        id={dictId}
        onDictationComplete={(text) => onChange(value ? value + ' ' + text : text)}
      />
    )}
  </View>
);

// ─── Type-specific detail sections ───────────────────────────────────────────

interface InvestmentDetailsProps {
  securityName: string; setSecurityName: (v: string) => void;
  symbol: string; setSymbol: (v: string) => void;
  quantity: string; setQuantity: (v: string) => void;
  price: string; setPrice: (v: string) => void;
  fee: string; setFee: (v: string) => void;
}
const InvestmentDetails: React.FC<InvestmentDetailsProps> = ({
  securityName, setSecurityName, symbol, setSymbol,
  quantity, setQuantity, price, setPrice, fee, setFee,
}) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.details')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.securityName')} value={securityName} onChange={setSecurityName} dictId="security_name" />
        <TextRow label={t('txn.fields.symbol')} value={symbol} onChange={setSymbol} dictId="symbol" />
        <TextRow label={t('txn.fields.quantity')} value={quantity} onChange={setQuantity} dictId="quantity" numeric />
        <TextRow label={t('txn.fields.price')} value={price} onChange={setPrice} dictId="price" numeric />
        <TextRow label={t('txn.fields.fee')} value={fee} onChange={setFee} dictId="fee" numeric />
      </Card.Content>
    </Card>
  );
};

interface LoanDetailsProps {
  creditor: string; setCreditor: (v: string) => void;
  interestRate: string; setInterestRate: (v: string) => void;
  remainingTerm: string; setRemainingTerm: (v: string) => void;
}
const LoanDetails: React.FC<LoanDetailsProps> = ({ creditor, setCreditor, interestRate, setInterestRate, remainingTerm, setRemainingTerm }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.details')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.creditor')} value={creditor} onChange={setCreditor} dictId="creditor" />
        <TextRow label={t('txn.fields.interestRate')} value={interestRate} onChange={setInterestRate} dictId="interest_rate" numeric />
        <TextRow label={t('txn.fields.remainingTerm')} value={remainingTerm} onChange={setRemainingTerm} dictId="remaining_term" numeric />
      </Card.Content>
    </Card>
  );
};

interface TransferDetailsProps {
  counterparty: string; setCounterparty: (v: string) => void;
  reference: string; setReference: (v: string) => void;
  fee: string; setFee: (v: string) => void;
}
const TransferDetails: React.FC<TransferDetailsProps> = ({ counterparty, setCounterparty, reference, setReference, fee, setFee }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.details')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.counterparty')} value={counterparty} onChange={setCounterparty} dictId="counterparty" />
        <TextRow label={t('txn.fields.reference')} value={reference} onChange={setReference} dictId="reference" />
        <TextRow label={t('txn.fields.fee')} value={fee} onChange={setFee} dictId="fee" numeric />
      </Card.Content>
    </Card>
  );
};

// ─── Multi-currency section ───────────────────────────────────────────────────

interface CurrencyRowProps {
  currency: string; setCurrency: (v: string) => void;
  amount: string;
  exchangeRate: string; setExchangeRate: (v: string) => void;
  amountBase: string;
}
const CurrencyRow: React.FC<CurrencyRowProps> = ({ currency, setCurrency, amount, exchangeRate, setExchangeRate, amountBase }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.currency')} />
      <Card.Content style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            mode="outlined"
            label={t('txn.fields.currency')}
            value={currency}
            onChangeText={setCurrency}
            style={{ width: 90 }}
            autoCapitalize="characters"
          />
          <TextInput
            mode="outlined"
            label={t('txn.fields.exchangeRate')}
            value={exchangeRate}
            onChangeText={setExchangeRate}
            keyboardType="decimal-pad"
            style={{ flex: 1 }}
          />
        </View>
        <TextInput
          mode="outlined"
          label={`${t('txn.fields.amountBase')} (${BASE_CURRENCY})`}
          value={amountBase}
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

  const initDetails = parseDetails(initial?.details ?? null);
  const accountCurrency = accounts.find((a) => a.id === (initial?.accountId ?? accounts[0]?.id))?.currency ?? BASE_CURRENCY;

  const [type, setType] = useState<TransactionType>(initial?.type ?? 'EXPENSE');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [currency, setCurrencyState] = useState(initial?.currency ?? accountCurrency);
  const [exchangeRate, setExchangeRate] = useState(initial?.exchangeRate ?? '1');
  const [accountId, setAccountId] = useState<string | null>(initial?.accountId ?? accounts[0]?.id ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  // Investment fields
  const [securityName, setSecurityName] = useState(String(initDetails.security_name ?? ''));
  const [symbol, setSymbol] = useState(String(initDetails.symbol ?? ''));
  const [quantity, setQuantity] = useState(initDetails.quantity != null ? String(initDetails.quantity) : '');
  const [price, setPrice] = useState(initDetails.price != null ? String(initDetails.price) : '');
  const [investFee, setInvestFee] = useState(initDetails.fee != null ? String(initDetails.fee) : '');

  // Loan fields
  const [creditor, setCreditor] = useState(String(initDetails.creditor ?? ''));
  const [interestRate, setInterestRate] = useState(initDetails.interest_rate != null ? String(initDetails.interest_rate) : '');
  const [remainingTerm, setRemainingTerm] = useState(initDetails.remaining_term != null ? String(initDetails.remaining_term) : '');

  // Transfer fields
  const [counterparty, setCounterparty] = useState(String(initDetails.counterparty ?? ''));
  const [reference, setReference] = useState(String(initDetails.reference ?? ''));
  const [transferFee, setTransferFee] = useState(initDetails.fee != null ? String(initDetails.fee) : '');

  const isInvestment = type === 'INVESTMENT_BUY' || type === 'INVESTMENT_SELL';
  const isLoan = type === 'LOAN_RECEIVED' || type === 'LOAN_REPAYMENT';
  const isTransfer = type === 'TRANSFER';

  const computedAmountBase = (() => {
    const a = parseFloat(amount);
    const r = parseFloat(exchangeRate);
    if (!Number.isFinite(a) || !Number.isFinite(r) || r === 0) return '';
    if (currency === BASE_CURRENCY) return String(a);
    return String(Math.round(a * r));
  })();

  const buildDetails = (): Record<string, unknown> => {
    if (isInvestment) {
      return { security_name: securityName, symbol, quantity: parseFloat(quantity) || null, price: parseFloat(price) || null, fee: parseFloat(investFee) || null };
    }
    if (isLoan) {
      return { creditor, interest_rate: parseFloat(interestRate) || null, remaining_term: parseInt(remainingTerm, 10) || null };
    }
    if (isTransfer) {
      return { counterparty, reference, fee: parseFloat(transferFee) || null };
    }
    return {};
  };

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setSaving(true);
    try {
      const amountBase = computedAmountBase || String(parsed);
      await onSubmit({
        type,
        date: initial?.date ?? Date.now(),
        amount: String(parsed),
        currency: currency.trim() || BASE_CURRENCY,
        amountBase,
        baseCurrency: BASE_CURRENCY,
        exchangeRate: exchangeRate.trim() || '1',
        accountId,
        categoryId,
        description: description.trim() || null,
        source: source.trim() || null,
        notes: notes.trim() || null,
        details: buildDetails(),
        status: 'cleared',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 16 + insets.bottom, gap: 16 }}>
      {/* Type selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {ALL_TYPES.map((txnType) => (
          <Button
            key={txnType}
            mode={type === txnType ? 'contained' : 'outlined'}
            onPress={() => { setType(txnType); setCategoryId(null); }}
            compact>
            {t(`txn.types.${txnType}`)}
          </Button>
        ))}
      </ScrollView>

      {/* Amount + currency side by side */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <AmountInput value={amount} onChangeText={setAmount} currency={currency} autoFocus={!initial} style={{ flex: 1 }} />
        <TextInput
          mode="outlined"
          label={t('txn.fields.currency')}
          value={currency}
          onChangeText={setCurrencyState}
          style={{ width: 80 }}
          autoCapitalize="characters"
        />
      </View>

      <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} type={type} />
      <AccountPicker accounts={accounts} value={accountId} onChange={setAccountId} />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          mode="outlined"
          label={t('txn.fields.description')}
          value={description}
          onChangeText={setDescription}
          style={{ flex: 1 }}
        />
        <DictationButton
          id="description-field"
          onDictationComplete={(text) => setDescription((prev) => prev ? prev + ' ' + text : text)}
        />
      </View>

      <TextInput
        mode="outlined"
        label={t('txn.fields.source')}
        value={source}
        onChangeText={setSource}
      />

      {/* Type-specific details */}
      {isInvestment && (
        <InvestmentDetails
          securityName={securityName} setSecurityName={setSecurityName}
          symbol={symbol} setSymbol={setSymbol}
          quantity={quantity} setQuantity={setQuantity}
          price={price} setPrice={setPrice}
          fee={investFee} setFee={setInvestFee}
        />
      )}
      {isLoan && (
        <LoanDetails
          creditor={creditor} setCreditor={setCreditor}
          interestRate={interestRate} setInterestRate={setInterestRate}
          remainingTerm={remainingTerm} setRemainingTerm={setRemainingTerm}
        />
      )}
      {isTransfer && (
        <TransferDetails
          counterparty={counterparty} setCounterparty={setCounterparty}
          reference={reference} setReference={setReference}
          fee={transferFee} setFee={setTransferFee}
        />
      )}

      {/* Multi-currency */}
      {currency !== BASE_CURRENCY && (
        <CurrencyRow
          currency={currency} setCurrency={setCurrencyState}
          amount={amount}
          exchangeRate={exchangeRate} setExchangeRate={setExchangeRate}
          amountBase={computedAmountBase}
        />
      )}

      <TextInput
        mode="outlined"
        label={t('txn.fields.notes')}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={2}
      />

      <View style={{ gap: 8 }}>
        <Button mode="contained" onPress={handleSubmit} loading={saving} disabled={saving}>
          {submitLabel ?? t('form.save')}
        </Button>
        {onDelete && (
          <Button mode="outlined" textColor={theme.colors.error} onPress={onDelete} disabled={saving}>
            {t('form.delete')}
          </Button>
        )}
      </View>
    </ScrollView>
  );
};
