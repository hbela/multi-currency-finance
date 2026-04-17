# Manual Test Checklist

Run against Redmi 12C over USB (preferred) or Pixel_4 AVD. Check each item; note device + theme (light/dark) where behavior may differ.

## 0. Launch & bootstrap

- [ ] Cold start — splash dismisses after migrations + seed + store hydration
- [ ] Kill app and relaunch — data persists, no re-seed, no visible migration delay
- [ ] Rotate device (or change system theme at runtime) — UI reflows, theme flips correctly

## 1. Tabs

- [ ] Home / index tab loads without error
- [ ] Transactions tab loads, list renders
- [ ] Budgets tab loads
- [ ] Reports tab loads
- [ ] Settings tab loads

## 2. New transaction — all 6 types

For each type, create one transaction end-to-end and verify it appears in the list with correct fields.

- [ ] `expense` — amount, category, account, merchant, is_reimbursable switch
- [ ] `income` — source, payer, is_taxable switch
- [ ] `transfer` — counterparty, reference, fee
- [ ] `investment` — security name, symbol, quantity, price, buy/sell segmented
- [ ] `debt` — creditor, loan/credit_card/mortgage, interest rate, remaining term
- [ ] `subscription` — provider, plan, next billing date (YYYY-MM-DD), is_auto_renew

### Form polish

- [ ] Type selector scrolls horizontally; active type highlighted
- [ ] Amount autofocus on create (not on edit)
- [ ] Save button fully visible above Android nav bar (edge-to-edge safe area)
- [ ] Validation: amount ≤ 0 or non-numeric → save does nothing (no crash)
- [ ] Financial Accuracy section (currency, FX rate, original amount/currency) saves correctly

## 3. Dictation

- [ ] First use prompts for microphone + speech recognition permissions
- [ ] Permission denial path shows graceful error, doesn't crash
- [ ] Dictation on Note field — appends to existing text
- [ ] Dictation on Merchant / Source / Payer / Counterparty / etc. — all per-field buttons work independently
- [ ] Dictation in Hungarian / German / French after language switch — picks locale from app language

## 4. Screenshot / OCR (receipt capture)

- [ ] Camera permission prompt on first use
- [ ] Gallery permission prompt on first use
- [ ] Captured image parses into transaction fields (amount, merchant, date where present)
- [ ] Unreadable / blank image — graceful failure, no crash
- [ ] `receipt_image` persisted on saved transaction

## 5. Edit / delete existing transaction

- [ ] Tap transaction in list → edit screen prefills all fields (including type-specific + FX)
- [ ] Changing type on edit preserves already-entered common fields
- [ ] Save updates list
- [ ] Delete button removes transaction; list refreshes

## 6. Recurring transactions

- [ ] Settings → Recurring opens the recurring list
- [ ] Create new recurring entry
- [ ] Active count shown in Settings matches list state
- [ ] Due recurring entries generate transactions on next app open (or per scheduler)
- [ ] Edit recurring entry saves changes
- [ ] Delete recurring entry removes it

## 7. Settings

### Appearance

- [ ] System / Light / Dark toggle flips theme instantly
- [ ] Choice persists across app restart

### Language

- [ ] EN / HU / DE / FR — UI labels switch immediately
- [ ] Choice persists across app restart
- [ ] Date / number formats respect locale (if implemented)

### Accounts

- [ ] Add account (name, currency uppercase, cash/bank/card) → appears in pickers
- [ ] Delete account — confirm no orphan transactions break the list
- [ ] Currency field clamps to 3 uppercase chars

### Categories

- [ ] Add expense category — shows in expense form's category picker
- [ ] Add income category — shows in income form's category picker
- [ ] Delete category

### Screenshots (dev tool)

- [ ] Device chip select (phone / tablet7 / tablet10)
- [ ] Capture count updates as screenshots are taken
- [ ] "Upload to Drive" — triggers Google Sign-In if not authed; uploads succeed
- [ ] "Clear" empties captured list
- [ ] Disabled state when count is 0

## 8. Google Sign-In

- [ ] First sign-in prompts Google chooser
- [ ] Cancel on chooser returns gracefully
- [ ] Signed-in state persists across restart
- [ ] Sign-out (if exposed) clears tokens

## 9. Edge-to-edge / safe area regressions

Scan every scrollable screen for content clipped under the Android nav bar:

- [ ] Transaction form (fixed)
- [ ] Transactions list
- [ ] Budgets
- [ ] Reports
- [ ] Settings
- [ ] Recurring list + edit

## 10. Theming

- [ ] No hardcoded colors visible in dark mode (white flashes, black-on-black text)
- [ ] Contained buttons (Save, Upload) readable in both themes
- [ ] Outlined destructive buttons use theme error color

## 11. Non-happy paths

- [ ] Airplane mode — app still launches (all data is local); Drive upload fails gracefully
- [ ] Fill DB with 200+ transactions — list scroll performance acceptable
- [ ] Very long note / merchant name — no layout break
- [ ] Date field with garbage input (`2026-13-40`) — rejected, doesn't save invalid epoch
