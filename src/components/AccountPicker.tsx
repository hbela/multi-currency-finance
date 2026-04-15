import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';
import { Account } from '../types';

interface Props {
  accounts: Account[];
  value: string | null;
  onChange: (id: string) => void;
}

export const AccountPicker: React.FC<Props> = ({ accounts, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = accounts.find((a) => a.id === value);
  return (
    <View>
      <Text variant="labelSmall" style={{ marginBottom: 4 }}>
        Account
      </Text>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Button mode="outlined" onPress={() => setOpen(true)} icon="wallet">
            {selected?.name ?? 'Select account'}
          </Button>
        }>
        {accounts.map((a) => (
          <Menu.Item
            key={a.id}
            title={`${a.name} · ${a.currency}`}
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
