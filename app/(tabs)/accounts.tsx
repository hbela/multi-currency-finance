import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import {
  FAB,
  List,
  Text,
  Divider,
  ActivityIndicator,
  Badge,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAccountStore } from '@/src/store/accountStore';
import { useCurrencyStore } from '@/src/store/currencyStore';
import { getLedgerBalanceForAccount } from '@/src/db/ledger';
import { useAppTheme } from '@/src/theme';
import { Account } from '@/src/types';
import AccountFormSheet from '@/src/components/AccountFormSheet';
import { useFormattedAmount } from '@/src/hooks/useFormattedAmount';

// ─── Balance cell ─────────────────────────────────────────────────────────────

function AccountBalanceCell({ account }: { account: Account }) {
  const [balance, setBalance] = useState<string>(account.balance);
  const formatted = useFormattedAmount(parseFloat(balance), account.currency);

  useEffect(() => {
    getLedgerBalanceForAccount(account.id).then(setBalance);
  }, [account.id]);

  const n = parseFloat(balance);
  const isNeg = n < 0;
  const theme = useAppTheme();

  return (
    <Text
      variant="bodyMedium"
      style={{ color: isNeg ? theme.colors.error : theme.colors.onSurface }}>
      {formatted}
    </Text>
  );
}

// ─── Account row ─────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  cash: 'cash',
  bank: 'bank',
  card: 'credit-card',
  investment: 'chart-line',
  crypto: 'bitcoin',
  loan: 'handshake',
};

interface AccountRowProps {
  account: Account;
  onPress: () => void;
}

function AccountRow({ account, onPress }: AccountRowProps) {
  const theme = useAppTheme();
  return (
    <List.Item
      title={account.name}
      description={account.institution ?? account.type}
      left={(props) => (
        <List.Icon
          {...props}
          icon={TYPE_ICONS[account.type] ?? 'wallet'}
          color={account.color ?? theme.colors.primary}
        />
      )}
      right={() => <AccountBalanceCell account={account} />}
      onPress={onPress}
      style={styles.row}
    />
  );
}

// ─── Group header ─────────────────────────────────────────────────────────────

function CurrencyGroupHeader({ currency }: { currency: string }) {
  const theme = useAppTheme();
  const store = useCurrencyStore();
  const info = store.getByCode(currency);
  return (
    <View style={[styles.groupHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {info ? `${currency} – ${info.name}` : currency}
      </Text>
      {info?.isBase === 1 && (
        <Badge style={{ backgroundColor: theme.colors.primary, marginLeft: 8 }}>
          base
        </Badge>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type ListItem =
  | { kind: 'header'; currency: string }
  | { kind: 'account'; account: Account }
  | { kind: 'divider'; key: string };

export default function AccountsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { items: accounts, loading } = useAccountStore();
  const [selected, setSelected] = useState<Account | null | undefined>(undefined);

  const listData = useMemo<ListItem[]>(() => {
    const grouped = new Map<string, Account[]>();
    for (const a of accounts) {
      const arr = grouped.get(a.currency) ?? [];
      arr.push(a);
      grouped.set(a.currency, arr);
    }
    const sorted = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    const items: ListItem[] = [];
    sorted.forEach(([currency, accs], idx) => {
      if (idx > 0) items.push({ kind: 'divider', key: `div-${currency}` });
      items.push({ kind: 'header', currency });
      accs.forEach((a) => items.push({ kind: 'account', account: a }));
    });
    return items;
  }, [accounts]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'header') return <CurrencyGroupHeader currency={item.currency} />;
      if (item.kind === 'divider') return <Divider key={item.key} />;
      return (
        <AccountRow
          account={item.account}
          onPress={() => setSelected(item.account)}
        />
      );
    },
    []
  );

  const keyExtractor = (item: ListItem) => {
    if (item.kind === 'header') return `hdr-${item.currency}`;
    if (item.kind === 'divider') return item.key;
    return item.account.id;
  };

  if (loading && accounts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {accounts.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            {t('accounts.noAccounts')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setSelected(null)}
      />

      {selected !== undefined && (
        <AccountFormSheet
          account={selected ?? undefined}
          onDismiss={() => setSelected(undefined)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 96 },
  row: { paddingHorizontal: 8 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
