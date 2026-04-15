import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { useRouter } from 'expo-router';

import { useAccountStore } from '@/src/store/accountStore';
import { useCategoryStore } from '@/src/store/categoryStore';
import { useRecurringStore } from '@/src/store/recurringStore';
import { useThemeStore, ThemeMode } from '@/src/store/themeStore';
import { AccountType, TxnType } from '@/src/types';
import { useAppTheme } from '@/src/theme';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const accounts = useAccountStore((s) => s.items);
  const addAccount = useAccountStore((s) => s.add);
  const removeAccount = useAccountStore((s) => s.remove);
  const categories = useCategoryStore((s) => s.items);
  const addCategory = useCategoryStore((s) => s.add);
  const removeCategory = useCategoryStore((s) => s.remove);
  const recurringCount = useRecurringStore((s) => s.items.length);
  const activeRecurringCount = useRecurringStore(
    (s) => s.items.filter((r) => r.active === 1).length
  );
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  const [accountOpen, setAccountOpen] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [accountType, setAccountType] = useState<AccountType>('cash');

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<TxnType>('expense');

  const submitAccount = async () => {
    if (!accountName.trim()) return;
    await addAccount({ name: accountName.trim(), type: accountType, currency: accountCurrency.trim() || 'USD' });
    setAccountOpen(false);
    setAccountName('');
    setAccountCurrency('USD');
    setAccountType('cash');
  };

  const submitCategory = async () => {
    if (!categoryName.trim()) return;
    await addCategory({ name: categoryName.trim(), icon: null, type: categoryType });
    setCategoryOpen(false);
    setCategoryName('');
    setCategoryType('expense');
  };

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }}>
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <View style={{ paddingHorizontal: 16 }}>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(v) => setThemeMode(v as ThemeMode)}
            buttons={[
              { value: 'system', label: 'System', icon: 'theme-light-dark' },
              { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
              { value: 'dark', label: 'Dark', icon: 'weather-night' },
            ]}
          />
        </View>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Accounts</List.Subheader>
        {accounts.map((a) => (
          <List.Item
            key={a.id}
            title={a.name}
            description={`${a.type} · ${a.currency}`}
            left={(p) => <List.Icon {...p} icon="wallet" />}
            right={() => (
              <IconButton icon="delete" onPress={() => removeAccount(a.id)} />
            )}
          />
        ))}
        <View style={{ paddingHorizontal: 16 }}>
          <Button icon="plus" onPress={() => setAccountOpen(true)}>
            Add account
          </Button>
        </View>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Categories</List.Subheader>
        {categories.map((c) => (
          <List.Item
            key={c.id}
            title={c.name}
            description={c.type}
            left={(p) => <List.Icon {...p} icon={c.icon ?? 'shape'} />}
            right={() => <IconButton icon="delete" onPress={() => removeCategory(c.id)} />}
          />
        ))}
        <View style={{ paddingHorizontal: 16 }}>
          <Button icon="plus" onPress={() => setCategoryOpen(true)}>
            Add category
          </Button>
        </View>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Automation</List.Subheader>
        <List.Item
          title="Recurring transactions"
          description={
            recurringCount === 0
              ? 'No rules yet'
              : `${activeRecurringCount} active · ${recurringCount} total`
          }
          left={(p) => <List.Icon {...p} icon="repeat" />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => router.push('/recurring' as never)}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Data</List.Subheader>
        <List.Item title="Export database" description="Coming soon" disabled />
        <List.Item title="Import database" description="Coming soon" disabled />
        <List.Item title="Cloud backup" description="Coming soon" disabled />
      </List.Section>

      <View style={{ padding: 16 }}>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          Budget · v1.0 · offline
        </Text>
      </View>

      <Portal>
        <Dialog visible={accountOpen} onDismiss={() => setAccountOpen(false)}>
          <Dialog.Title>New account</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <TextInput mode="outlined" label="Name" value={accountName} onChangeText={setAccountName} />
            <TextInput
              mode="outlined"
              label="Currency (3-letter)"
              value={accountCurrency}
              onChangeText={(v) => setAccountCurrency(v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={3}
            />
            <SegmentedButtons
              value={accountType}
              onValueChange={(v) => setAccountType(v as AccountType)}
              buttons={[
                { value: 'cash', label: 'Cash' },
                { value: 'bank', label: 'Bank' },
                { value: 'card', label: 'Card' },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAccountOpen(false)}>Cancel</Button>
            <Button onPress={submitAccount}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={categoryOpen} onDismiss={() => setCategoryOpen(false)}>
          <Dialog.Title>New category</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <TextInput mode="outlined" label="Name" value={categoryName} onChangeText={setCategoryName} />
            <SegmentedButtons
              value={categoryType}
              onValueChange={(v) => setCategoryType(v as TxnType)}
              buttons={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCategoryOpen(false)}>Cancel</Button>
            <Button onPress={submitCategory}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}
