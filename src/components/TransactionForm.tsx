import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { AmountInput } from './AmountInput';
import { CategoryPicker } from './CategoryPicker';
import { AccountPicker } from './AccountPicker';
import { DictationButton } from './DictationButton';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { Transaction, TxnType } from '../types';
import { useAppTheme } from '../theme';

// ─── Form value shape ─────────────────────────────────────────────────────────

export interface TransactionFormValues {
  amount: number;
  type: TxnType;
  date: number;
  note: string | null;
  account_id: string | null;
  category_id: string | null;
  receipt_image: string | null;
  currency: string | null;
  exchange_rate: number | null;
  original_amount: number | null;
  original_currency: string | null;
  merchant: string | null;
  is_reimbursable: 0 | 1 | null;
  source: string | null;
  payer: string | null;
  is_taxable: 0 | 1 | null;
  counterparty: string | null;
  reference: string | null;
  fee: number | null;
  security_name: string | null;
  symbol: string | null;
  quantity: number | null;
  price: number | null;
  order_type: string | null;
  creditor: string | null;
  debt_type: string | null;
  interest_rate: number | null;
  remaining_term: number | null;
  provider: string | null;
  plan: string | null;
  next_billing_date: number | null;
  is_auto_renew: 0 | 1 | null;
}

interface Props {
  initial?: Transaction;
  onSubmit: (v: TransactionFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  submitLabel?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseNum = (s: string): number | null => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const epochToDateStr = (ms: number | null): string => {
  if (!ms) return '';
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const dateStrToEpoch = (s: string): number | null => {
  if (!s.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
  const ms = new Date(s).getTime();
  return Number.isFinite(ms) ? ms : null;
};

// ─── Labelled text row with optional DictationButton ─────────────────────────

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

// ─── Type-specific sections ───────────────────────────────────────────────────

interface ExpenseSectionProps {
  merchant: string; setMerchant: (v: string) => void;
  isReimbursable: boolean; setIsReimbursable: (v: boolean) => void;
}
const ExpenseSection: React.FC<ExpenseSectionProps> = ({ merchant, setMerchant, isReimbursable, setIsReimbursable }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.details')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.merchant')} value={merchant} onChange={setMerchant} dictId="merchant" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text>{t('txn.fields.isReimbursable')}</Text>
          <Switch value={isReimbursable} onValueChange={setIsReimbursable} />
        </View>
      </Card.Content>
    </Card>
  );
};

interface IncomeSectionProps {
  source: string; setSource: (v: string) => void;
  payer: string; setPayer: (v: string) => void;
  isTaxable: boolean; setIsTaxable: (v: boolean) => void;
}
const IncomeSection: React.FC<IncomeSectionProps> = ({ source, setSource, payer, setPayer, isTaxable, setIsTaxable }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.details')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.source')} value={source} onChange={setSource} dictId="source" />
        <TextRow label={t('txn.fields.payer')} value={payer} onChange={setPayer} dictId="payer" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text>{t('txn.fields.isTaxable')}</Text>
          <Switch value={isTaxable} onValueChange={setIsTaxable} />
        </View>
      </Card.Content>
    </Card>
  );
};

interface TransferSectionProps {
  counterparty: string; setCounterparty: (v: string) => void;
  reference: string; setReference: (v: string) => void;
  fee: string; setFee: (v: string) => void;
}
const TransferSection: React.FC<TransferSectionProps> = ({ counterparty, setCounterparty, reference, setReference, fee, setFee }) => {
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

interface InvestmentSectionProps {
  securityName: string; setSecurityName: (v: string) => void;
  symbol: string; setSymbol: (v: string) => void;
  quantity: string; setQuantity: (v: string) => void;
  price: string; setPrice: (v: string) => void;
  orderType: string; setOrderType: (v: string) => void;
}
const InvestmentSection: React.FC<InvestmentSectionProps> = ({
  securityName, setSecurityName, symbol, setSymbol,
  quantity, setQuantity, price, setPrice, orderType, setOrderType,
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
        <SegmentedButtons
          value={orderType}
          onValueChange={setOrderType}
          buttons={[
            { value: 'buy', label: t('txn.orderType.buy') },
            { value: 'sell', label: t('txn.orderType.sell') },
          ]}
        />
      </Card.Content>
    </Card>
  );
};

interface DebtSectionProps {
  creditor: string; setCreditor: (v: string) => void;
  debtType: string; setDebtType: (v: string) => void;
  interestRate: string; setInterestRate: (v: string) => void;
  remainingTerm: string; setRemainingTerm: (v: string) => void;
}
const DebtSection: React.FC<DebtSectionProps> = ({ creditor, setCreditor, debtType, setDebtType, interestRate, setInterestRate, remainingTerm, setRemainingTerm }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.details')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.creditor')} value={creditor} onChange={setCreditor} dictId="creditor" />
        <SegmentedButtons
          value={debtType}
          onValueChange={setDebtType}
          buttons={[
            { value: 'loan', label: t('txn.debtType.loan') },
            { value: 'credit_card', label: t('txn.debtType.credit_card') },
            { value: 'mortgage', label: t('txn.debtType.mortgage') },
          ]}
        />
        <TextRow label={t('txn.fields.interestRate')} value={interestRate} onChange={setInterestRate} dictId="interest_rate" numeric />
        <TextRow label={t('txn.fields.remainingTerm')} value={remainingTerm} onChange={setRemainingTerm} dictId="remaining_term" numeric />
      </Card.Content>
    </Card>
  );
};

interface SubscriptionSectionProps {
  provider: string; setProvider: (v: string) => void;
  plan: string; setPlan: (v: string) => void;
  nextBillingDate: string; setNextBillingDate: (v: string) => void;
  isAutoRenew: boolean; setIsAutoRenew: (v: boolean) => void;
}
const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ provider, setProvider, plan, setPlan, nextBillingDate, setNextBillingDate, isAutoRenew, setIsAutoRenew }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.details')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.provider')} value={provider} onChange={setProvider} dictId="provider" />
        <TextRow label={t('txn.fields.plan')} value={plan} onChange={setPlan} dictId="plan" />
        <TextInput
          mode="outlined"
          label={t('txn.fields.nextBillingDate')}
          value={nextBillingDate}
          onChangeText={setNextBillingDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text>{t('txn.fields.isAutoRenew')}</Text>
          <Switch value={isAutoRenew} onValueChange={setIsAutoRenew} />
        </View>
      </Card.Content>
    </Card>
  );
};

interface FinancialAccuracySectionProps {
  currency: string; setCurrency: (v: string) => void;
  exchangeRate: string; setExchangeRate: (v: string) => void;
  originalAmount: string; setOriginalAmount: (v: string) => void;
  originalCurrency: string; setOriginalCurrency: (v: string) => void;
}
const FinancialAccuracySection: React.FC<FinancialAccuracySectionProps> = ({
  currency, setCurrency, exchangeRate, setExchangeRate,
  originalAmount, setOriginalAmount, originalCurrency, setOriginalCurrency,
}) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t('txn.sections.financialAccuracy')} />
      <Card.Content style={{ gap: 12 }}>
        <TextRow label={t('txn.fields.currency')} value={currency} onChange={setCurrency} dictId="fx-currency" />
        <TextRow label={t('txn.fields.exchangeRate')} value={exchangeRate} onChange={setExchangeRate} dictId="fx-rate" numeric />
        <TextRow label={t('txn.fields.originalAmount')} value={originalAmount} onChange={setOriginalAmount} dictId="fx-orig-amount" numeric />
        <TextRow label={t('txn.fields.originalCurrency')} value={originalCurrency} onChange={setOriginalCurrency} dictId="fx-orig-currency" />
      </Card.Content>
    </Card>
  );
};

// ─── Main form ────────────────────────────────────────────────────────────────

const ALL_TYPES: TxnType[] = ['expense', 'income', 'transfer', 'investment', 'debt', 'subscription'];

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

  const [type, setType] = useState<TxnType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date] = useState<number>(initial?.date ?? Date.now());
  const [accountId, setAccountId] = useState<string | null>(
    initial?.account_id ?? accounts[0]?.id ?? null
  );
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null);
  const [receiptImage] = useState<string | null>(initial?.receipt_image ?? null);

  const [currency, setCurrency] = useState(initial?.currency ?? '');
  const [exchangeRate, setExchangeRate] = useState(initial?.exchange_rate != null ? String(initial.exchange_rate) : '');
  const [originalAmount, setOriginalAmount] = useState(initial?.original_amount != null ? String(initial.original_amount) : '');
  const [originalCurrency, setOriginalCurrency] = useState(initial?.original_currency ?? '');

  const [merchant, setMerchant] = useState(initial?.merchant ?? '');
  const [isReimbursable, setIsReimbursable] = useState((initial?.is_reimbursable ?? 0) === 1);

  const [source, setSource] = useState(initial?.source ?? '');
  const [payer, setPayer] = useState(initial?.payer ?? '');
  const [isTaxable, setIsTaxable] = useState((initial?.is_taxable ?? 0) === 1);

  const [counterparty, setCounterparty] = useState(initial?.counterparty ?? '');
  const [reference, setReference] = useState(initial?.reference ?? '');
  const [fee, setFee] = useState(initial?.fee != null ? String(initial.fee) : '');

  const [securityName, setSecurityName] = useState(initial?.security_name ?? '');
  const [symbol, setSymbol] = useState(initial?.symbol ?? '');
  const [quantity, setQuantity] = useState(initial?.quantity != null ? String(initial.quantity) : '');
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [orderType, setOrderType] = useState(initial?.order_type ?? 'buy');

  const [creditor, setCreditor] = useState(initial?.creditor ?? '');
  const [debtType, setDebtType] = useState(initial?.debt_type ?? 'loan');
  const [interestRate, setInterestRate] = useState(initial?.interest_rate != null ? String(initial.interest_rate) : '');
  const [remainingTerm, setRemainingTerm] = useState(initial?.remaining_term != null ? String(initial.remaining_term) : '');

  const [provider, setProvider] = useState(initial?.provider ?? '');
  const [plan, setPlan] = useState(initial?.plan ?? '');
  const [nextBillingDate, setNextBillingDate] = useState(epochToDateStr(initial?.next_billing_date ?? null));
  const [isAutoRenew, setIsAutoRenew] = useState((initial?.is_auto_renew ?? 0) === 1);

  const [saving, setSaving] = useState(false);

  const accountCurrency = accounts.find((a) => a.id === accountId)?.currency ?? 'USD';

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setSaving(true);
    try {
      const rt = parseNum(remainingTerm);
      await onSubmit({
        amount: parsed,
        type,
        date,
        note: note.trim() || null,
        account_id: accountId,
        category_id: categoryId,
        receipt_image: receiptImage,
        currency: currency.trim() || null,
        exchange_rate: parseNum(exchangeRate),
        original_amount: parseNum(originalAmount),
        original_currency: originalCurrency.trim() || null,
        merchant: merchant.trim() || null,
        is_reimbursable: isReimbursable ? 1 : null,
        source: source.trim() || null,
        payer: payer.trim() || null,
        is_taxable: isTaxable ? 1 : null,
        counterparty: counterparty.trim() || null,
        reference: reference.trim() || null,
        fee: parseNum(fee),
        security_name: securityName.trim() || null,
        symbol: symbol.trim() || null,
        quantity: parseNum(quantity),
        price: parseNum(price),
        order_type: orderType || null,
        creditor: creditor.trim() || null,
        debt_type: debtType || null,
        interest_rate: parseNum(interestRate),
        remaining_term: rt != null ? Math.round(rt) : null,
        provider: provider.trim() || null,
        plan: plan.trim() || null,
        next_billing_date: dateStrToEpoch(nextBillingDate),
        is_auto_renew: isAutoRenew ? 1 : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 16 + insets.bottom, gap: 16 }}>
      {/* Type selector — horizontal scroll for 6 types */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {ALL_TYPES.map((txnType) => (
          <Button
            key={txnType}
            mode={type === txnType ? 'contained' : 'outlined'}
            onPress={() => setType(txnType)}
            compact>
            {t(`txn.types.${txnType}`)}
          </Button>
        ))}
      </ScrollView>

      <AmountInput value={amount} onChangeText={setAmount} currency={accountCurrency} autoFocus={!initial} />
      <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} type={type} />
      <AccountPicker accounts={accounts} value={accountId} onChange={setAccountId} />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          mode="outlined"
          label={t('txn.fields.note')}
          value={note}
          onChangeText={setNote}
          style={{ flex: 1 }}
        />
        <DictationButton
          id="note-field"
          onDictationComplete={(text) => setNote((prev) => prev ? prev + ' ' + text : text)}
        />
      </View>

      {type === 'expense' && (
        <ExpenseSection
          merchant={merchant} setMerchant={setMerchant}
          isReimbursable={isReimbursable} setIsReimbursable={setIsReimbursable}
        />
      )}
      {type === 'income' && (
        <IncomeSection
          source={source} setSource={setSource}
          payer={payer} setPayer={setPayer}
          isTaxable={isTaxable} setIsTaxable={setIsTaxable}
        />
      )}
      {type === 'transfer' && (
        <TransferSection
          counterparty={counterparty} setCounterparty={setCounterparty}
          reference={reference} setReference={setReference}
          fee={fee} setFee={setFee}
        />
      )}
      {type === 'investment' && (
        <InvestmentSection
          securityName={securityName} setSecurityName={setSecurityName}
          symbol={symbol} setSymbol={setSymbol}
          quantity={quantity} setQuantity={setQuantity}
          price={price} setPrice={setPrice}
          orderType={orderType} setOrderType={setOrderType}
        />
      )}
      {type === 'debt' && (
        <DebtSection
          creditor={creditor} setCreditor={setCreditor}
          debtType={debtType} setDebtType={setDebtType}
          interestRate={interestRate} setInterestRate={setInterestRate}
          remainingTerm={remainingTerm} setRemainingTerm={setRemainingTerm}
        />
      )}
      {type === 'subscription' && (
        <SubscriptionSection
          provider={provider} setProvider={setProvider}
          plan={plan} setPlan={setPlan}
          nextBillingDate={nextBillingDate} setNextBillingDate={setNextBillingDate}
          isAutoRenew={isAutoRenew} setIsAutoRenew={setIsAutoRenew}
        />
      )}

      <FinancialAccuracySection
        currency={currency} setCurrency={setCurrency}
        exchangeRate={exchangeRate} setExchangeRate={setExchangeRate}
        originalAmount={originalAmount} setOriginalAmount={setOriginalAmount}
        originalCurrency={originalCurrency} setOriginalCurrency={setOriginalCurrency}
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
