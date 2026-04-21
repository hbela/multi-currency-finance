import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  currency?: string;
  label?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AmountInput: React.FC<Props> = ({
  value,
  onChangeText,
  currency = 'USD',
  label = 'Amount',
  autoFocus,
  style,
}) => {
  const handle = (text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parts = cleaned.split('.');
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    onChangeText(normalized);
  };
  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={handle}
      keyboardType="decimal-pad"
      autoFocus={autoFocus}
      left={<TextInput.Affix text={currency} />}
      style={style}
    />
  );
};
