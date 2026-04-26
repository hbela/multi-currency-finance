import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';
import CurrencyInput from 'react-native-currency-input';
import { decimalsFor, getInputFormat } from '../utils/format';

interface Props {
  value: number | null;
  onChangeValue: (v: number | null) => void;
  currency: string;
  lang: string;
  label?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  error?: boolean;
}

export const AmountInput: React.FC<Props> = ({
  value,
  onChangeValue,
  currency,
  lang,
  label = 'Amount',
  autoFocus,
  style,
  error,
}) => {
  const { delimiter, separator } = getInputFormat(lang);
  const precision = decimalsFor(currency);

  return (
    <CurrencyInput
      value={value}
      onChangeValue={onChangeValue}
      delimiter={delimiter}
      separator={separator}
      precision={precision}
      minValue={0}
      renderTextInput={(props) => (
        <TextInput
          {...props}
          mode="outlined"
          label={label}
          autoFocus={autoFocus}
          style={style}
          error={error}
          left={<TextInput.Affix text={currency} />}
          keyboardType="numeric"
        />
      )}
    />
  );
};
