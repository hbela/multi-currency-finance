Let’s design something that’s **correct, scalable, and production-safe** for your stack (React Native + Expo + SQLite/Zustand).

---

# 🧠 1. Core Principle (non-negotiable)

**Separate 3 concerns:**

1. **Storage** → machine-friendly (no locale)
2. **Computation** → precise (no floats)
3. **Display/Input** → locale-aware

---

# 💾 2. Storage Model (critical)

Never store floats like `12.34`.

### ✅ Use **minor units (integers)**

```ts
amount: 1234 // means 12.34 EUR
currency: 'EUR'
```

### Why?

* No floating point errors
* Easy aggregation
* Matches how Stripe, banks, etc. work

---

# 🌍 3. Locale Map (your 4 languages)

You support:

| Locale  | Language  | Format Example |
| ------- | --------- | -------------- |
| `en-GB` | English   | 1,234.56       |
| `hu-HU` | Hungarian | 1 234,56       |
| `de-DE` | German    | 1.234,56       |
| `fr-FR` | French    | 1 234,56       |

👉 Note: French uses **non-breaking space**, not normal space.

---

# ⚙️ 4. Formatting Layer (UI only)

### Core utility

```ts
export function formatMoney(
  amountMinor: number,
  locale: string,
  currency: string
) {
  const amount = amountMinor / 100;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

### Example

```ts
formatMoney(123456, 'hu-HU', 'HUF')
// 1 234,56 Ft

formatMoney(123456, 'en-GB', 'GBP')
// £1,234.56
```

---

# ✍️ 5. Parsing User Input (the tricky part)

Users will type:

* `1.234,56` (German)
* `1 234,56` (French/Hungarian)
* `1,234.56` (English)

### Strategy:

👉 Normalize → parse → convert to minor units

---

### 🔧 Step 1: Detect separators per locale

```ts
const localeConfig = {
  'en-GB': { decimal: '.', group: ',' },
  'hu-HU': { decimal: ',', group: ' ' },
  'de-DE': { decimal: ',', group: '.' },
  'fr-FR': { decimal: ',', group: ' ' }, // also NBSP
};
```

---

### 🔧 Step 2: Normalize input

```ts
export function parseMoneyInput(
  input: string,
  locale: string
): number {
  const { decimal, group } = localeConfig[locale];

  let normalized = input
    .replace(new RegExp(`\\${group}`, 'g'), '') // remove हजार sep
    .replace('\u00A0', '') // remove NBSP (French)
    .replace(decimal, '.');

  const float = Number(normalized);

  if (isNaN(float)) throw new Error('Invalid number');

  return Math.round(float * 100);
}
```

---

### 🧪 Example

```ts
parseMoneyInput('1.234,56', 'de-DE') → 123456
parseMoneyInput('1 234,56', 'fr-FR') → 123456
parseMoneyInput('1,234.56', 'en-GB') → 123456
```

---

# 🧱 6. Input UX (very important)

Don’t rely only on parsing—guide the user.

### Best practice:

* Use **numeric keyboard**
* Show **formatted preview live**
* Store **raw string + parsed value**

---

### Example pattern

```ts
const [input, setInput] = useState('');
const [amountMinor, setAmountMinor] = useState<number | null>(null);

function onChange(text: string) {
  setInput(text);

  try {
    const parsed = parseMoneyInput(text, locale);
    setAmountMinor(parsed);
  } catch {
    setAmountMinor(null);
  }
}
```

---

# 💱 7. Currency Handling (don’t hardcode 2 decimals)

Not all currencies use 2 decimals:

* HUF → 0 decimals (in practice)
* JPY → 0
* EUR → 2

### Improve formatter:

```ts
function getFractionDigits(currency: string) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
  }).resolvedOptions().maximumFractionDigits;
}
```

---

# 🧩 8. Architecture for your app

### Suggested structure

```
/lib/money/
  format.ts
  parse.ts
  currency.ts
  locale.ts
```

---

### Zustand store example

```ts
type Money = {
  amountMinor: number;
  currency: string;
};

type Settings = {
  locale: string;
  currency: string;
};
```

---

# 🚨 9. Common mistakes (avoid these)

* ❌ Using `parseFloat("1,234.56")`
* ❌ Storing `"12.34"` as string
* ❌ Assuming `.` is decimal
* ❌ Ignoring French NBSP (`\u00A0`)
* ❌ Formatting before storing

---

# 🚀 10. Next level (if you want to go pro)

* Use **decimal libraries** (e.g. `decimal.js`) for calculations
* Add **currency conversion layer**
* Persist **locale per user**
* Add **server-side validation** (Fastify)

---


