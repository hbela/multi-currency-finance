We are now integrating `@tanstack/react-query` for data fetching and want to ensure amounts are displayed according to the selected language *without interfering* with each other (i.e., cached data remains correct, locale changes trigger re-formatting, and no race conditions). Using Zustand for state management is a good choice, especially alongside React Query, as they complement each other: Zustand holds UI state (locale, currency), while React Query manages server-state (budget entries).

Here's a complete, production-ready approach.

---

## 🧱 Architecture Overview

- **Zustand store** → stores current `locale` and `currency` (plus setter).
- **React Query** → fetches raw budget data (numbers) from your API.
- **Custom hook / utility** → formats numbers on the fly using `Intl.NumberFormat` based on the current locale from Zustand.
- **React components** → subscribe to both the store and the query; when locale changes, the formatting function re-runs automatically.

Because the raw numbers from React Query are **unchanged** when locale changes, the query cache remains valid – no refetching is needed. Only the *presentation* updates.

---

## 1. Zustand Store for Locale & Currency

```tsx
// stores/localeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SupportedLocale = 'en-US' | 'de-DE' | 'hu-HU' | 'fr-FR';
type CurrencyCode = 'USD' | 'EUR' | 'HUF';

interface LocaleState {
  locale: SupportedLocale;
  currency: CurrencyCode;
  setLocale: (locale: SupportedLocale, currency: CurrencyCode) => void;
}

// Mapping from language selection to locale + currency
export const languageMap = {
  en: { locale: 'en-US', currency: 'USD' },
  de: { locale: 'de-DE', currency: 'EUR' },
  hu: { locale: 'hu-HU', currency: 'HUF' },
  fr: { locale: 'fr-FR', currency: 'EUR' },
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en-US',
      currency: 'USD',
      setLocale: (locale, currency) => set({ locale, currency }),
    }),
    { name: 'locale-storage' } // persists across app restarts
  )
);
```

**Usage in a language switcher:**

```tsx
const LanguageSwitcher = () => {
  const setLocale = useLocaleStore((s) => s.setLocale);
  return (
    <Picker
      onValueChange={(langCode) => {
        const { locale, currency } = languageMap[langCode];
        setLocale(locale, currency);
      }}
    >
      {/* items */}
    </Picker>
  );
};
```

---

## 2. Fetch Budget Data with React Query

Assume you have an API endpoint returning raw amounts (as numbers, **not formatted**):

```tsx
// api/budget.ts
export const fetchBudgetItems = async (): Promise<BudgetItem[]> => {
  const response = await fetch('/api/budget');
  const data = await response.json();
  // data = [{ id: 1, amount: 1234.56, description: "Groceries" }, ...]
  return data;
};
```

Use `useQuery` in your component:

```tsx
import { useQuery } from '@tanstack/react-query';

const { data: items, isLoading } = useQuery({
  queryKey: ['budgetItems'],
  queryFn: fetchBudgetItems,
});
```

---

## 3. Locale-Aware Formatting Utility

Create a utility that returns a **formatter function** tied to the current locale. Because the formatter depends on Zustand state, we’ll use `useMemo` to re-create it only when locale or currency changes.

**`utils/formatMoney.ts`** (pure, reusable)

```tsx
export const formatMoney = (
  amount: number,
  locale: string,
  currency: string
): string => {
  // Handle currencies with zero decimal places (HUF, JPY, etc.)
  const fractionDigits = ['HUF', 'JPY', 'KRW'].includes(currency) ? 0 : 2;
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return formatter.format(amount);
};
```

**Custom hook for reactive formatting:**

```tsx
// hooks/useFormattedAmount.ts
import { useMemo } from 'react';
import { useLocaleStore } from '../stores/localeStore';
import { formatMoney } from '../utils/formatMoney';

export const useFormattedAmount = (amount: number) => {
  const { locale, currency } = useLocaleStore();
  return useMemo(
    () => formatMoney(amount, locale, currency),
    [amount, locale, currency]
  );
};
```

> ✅ `useMemo` ensures the formatted string is recalculated **only** when `amount`, `locale`, or `currency` changes. This avoids unnecessary re-renders for other state changes.

---

## 4. Display in Component

Now combine everything – React Query + formatted amount hook:

```tsx
// BudgetList.tsx
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFormattedAmount } from '../hooks/useFormattedAmount';

const BudgetList = () => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['budgetItems'],
    queryFn: fetchBudgetItems,
  });

  if (isLoading) return <Text>Loading…</Text>;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <BudgetRow item={item} />}
    />
  );
};

// Separate component to isolate formatting per item (better performance)
const BudgetRow = ({ item }: { item: BudgetItem }) => {
  const formattedAmount = useFormattedAmount(item.amount);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>{item.description}</Text>
      <Text>{formattedAmount}</Text>
    </View>
  );
};
```

---

## 5. Ensuring No Interference Between Components

- **React Query cache** stores only the raw numbers. When locale changes, no refetch occurs – the stored numbers stay the same.
- **Each component** that calls `useFormattedAmount` independently recomputes its string. Because `useMemo` is used, a locale change will cause **all** formatted amounts to update, but each update is cheap and isolated.
- **No global formatting state** is mutated; all formatting is derived from the central locale store.

> 💡 If you have **many** budget items (1000+), you might consider memoizing at the list level, but for typical personal finance apps (dozens to hundreds of items) this is fine.

---

## 6. Integrating with Your Existing Form

For editing, you already have a `CurrencyInput` component that reads `locale` and `currency` from the same store. Just replace the props:

```tsx
const { locale, currency } = useLocaleStore();
<CurrencyInput
  value={field.state.value}
  onChange={(val) => field.handleChange(val)}
  locale={locale}
  currency={currency}
/>
```

Now the **display** (read-only list) and **input** (edit form) will always stay in sync with the user’s selected language.

---

## 📚 Suggested Libraries for Advanced Locale-Aware Display

While `Intl.NumberFormat` is sufficient for formatting, you may want additional features:

| Library | Purpose |
| :--- | :--- |
| **`react-i18next`** | Complete i18n solution (translations, pluralization, date formatting). Integrates well with React. You could store the language code there instead of Zustand. |
| **`react-native-localize`** | Detects the device’s locale & currency automatically on app start. Great for initial default. |
| **`dinero.js`** | For complex monetary calculations (tax, rounding, allocation) with immutable currency objects. Overkill for most budget apps. |
| **`i18n-iso-countries`** | If you need country names / flags based on locale. |

For your use case, **`react-i18next` + react-native-localize** would pair nicely with Zustand – you could replace the manual locale store with i18next’s language manager. But the current Zustand approach is simpler and perfectly fine.

---

## 🧪 Testing Locale Change + Caching

To verify that React Query doesn’t refetch when locale changes:

```tsx
// Add a console log inside fetchBudgetItems
console.log('Fetching budget items…');
```

Change language – you shouldn’t see that log again. The data remains in cache, and only formatted strings update.

---

## ✅ Summary

- **Zustand** stores the current `locale` and `currency` (persisted).
- **React Query** fetches and caches raw numeric amounts.
- **`useFormattedAmount`** hook combines store + raw number to produce a localized string, using `useMemo` for efficiency.
- **Language switcher** updates the store → all consuming components re-format automatically.
- **No refetching** – cached data stays intact.

This architecture keeps concerns separated, prevents interference, and delivers a snappy locale-aware UX.