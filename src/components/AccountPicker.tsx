import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';
import { Account } from '../types';

interface Props {
  accounts: Account[];
  value: string | null;
  onChange: (id: string) => void;
  label?: string;
}

export const AccountPicker: React.FC<Props> = ({ accounts, value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const selected = accounts.find((a) => a.id === value);
  return (
    <View>
      <Text variant="labelSmall" style={{ marginBottom: 4 }}>
        {label ?? 'Account'}
      </Text>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Button mode="outlined" onPress={() => setOpen(true)} icon="wallet">
            {selected ? `${selected.name} · ${selected.currency}` : 'Select account'}
          </Button>
        }>
        {accounts.map((a) => (
          <Menu.Item
            key={a.id}
            title={`${a.name} · ${a.currency}`}
            trailingIcon={a.id === value ? 'check' : undefined}
            onPress={() => {
              onChange(a.id);
              setOpen(false);
            }}
          />
        ))}
      </Menu>
    </View>
  );
};
