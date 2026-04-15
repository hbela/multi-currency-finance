import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';
import { Category, TxnType } from '../types';

interface Props {
  categories: Category[];
  value: string | null;
  onChange: (id: string) => void;
  type: TxnType;
}

export const CategoryPicker: React.FC<Props> = ({ categories, value, onChange, type }) => {
  const [open, setOpen] = useState(false);
  const filtered = categories.filter((c) => c.type === type);
  const selected = filtered.find((c) => c.id === value);
  return (
    <View>
      <Text variant="labelSmall" style={{ marginBottom: 4 }}>
        Category
      </Text>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Button mode="outlined" onPress={() => setOpen(true)} icon="shape">
            {selected?.name ?? 'Select category'}
          </Button>
        }>
        {filtered.map((c) => (
          <Menu.Item
            key={c.id}
            title={c.name}
            leadingIcon={c.icon ?? undefined}
            onPress={() => {
              onChange(c.id);
              setOpen(false);
            }}
          />
        ))}
      </Menu>
    </View>
  );
};
