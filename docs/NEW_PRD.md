Here is a **unified Product Requirements Document (PRD)** that summarizes all our conversations about building your multilingual mobile financial app.See the details in the following files:NEW_IMPLEMENTATION_DETAILS.md


**Product Name:** FlexFinance (suggested – feel free to change)  
**Version:** 1.0 (MVP)  
**Date:** April 2026  
**Target Platform:** React Native with Expo (iOS & Android)  
**Database:** SQLite (embedded, offline-first)  
**Primary Language Support:** Multilingual (full Unicode, localized categories & UI strings)  
**Base Currency:** User-configurable (default HUF, with full multi-currency support)

### 1. Product Overview & Vision

**Problem Statement**  
Freelance programmers and international users often receive income in multiple currencies (HUF, USD, EUR), spend in various currencies (e.g., Amazon in USD), hold crypto/investments, and manage loans/credit. Existing apps are either too simple (no proper multi-currency history) or overly complex and cloud-dependent. Users need accurate historical reporting, even when exchange rates change later.

**Vision**  
Build a clean, fast, privacy-focused personal finance app that handles **all money movements** in one unified model: regular income/expenses, transfers, investments (stocks/crypto), and loans/credit. Everything is stored locally in SQLite for offline use, with perfect multi-currency conversion (original amount + base currency equivalent preserved).

**Key Value Proposition**  
- Always-correct historical reports in the user’s base currency  
- Support for programmers/freelancers (invoices, clients, taxes)  
- Investment & loan tracking without needing separate apps  
- Simple, beautiful mobile experience with strong multilingual support

### 2. Target Users & Personas

**Primary Persona:**  
Alex – Freelance software developer living in Hungary. Receives payments in HUF (local clients), USD/EUR (international clients via Wise/Upwork), buys books/tech on Amazon in USD, invests in crypto (BTC, ETH) and occasional stocks, and has a small personal loan.

**Secondary Personas:**  
- Digital nomads with multiple bank/crypto accounts  
- Users who want to track both personal and light business finances  
- Anyone needing robust multi-currency + investment support

### 3. Core Features & Functional Requirements

#### 3.1 Unified Transaction Model (Single Source of Truth)

One `transactions` table supports all types:

**Transaction Types**  
- `EXPENSE` (e.g., Amazon book in USD)  
- `INCOME` (freelance payment in USD/EUR/HUF)  
- `TRANSFER` (between own accounts)  
- `INVESTMENT_BUY` / `INVESTMENT_SELL` (crypto, stocks, ETFs with quantity, unit price, fees)  
- `LOAN_RECEIVED` / `LOAN_REPAYMENT` (principal + interest tracking)  
- `DIVIDEND`, `INTEREST`, `CREDIT_CARD_PAYMENT`

**Core Fields (all transactions)**  
- `id`, `type`, `date` (ISO)  
- `amount` (original, as string for precision), `currency` (ISO or crypto symbol e.g. BTC)  
- `amountBase`, `baseCurrency` (usually HUF), `exchangeRate` (preserved for historical accuracy)  
- `accountId`, `categoryId`, `description`, `source` (merchant/client), `tags` (JSON array), `notes`  
- `details` (JSON for type-specific data: quantity, fees, loanId, etc.)  
- `relatedTransactionId` (for transfers, paired buy/sell)  
- `isRecurring`, `recurringRule` (JSON), `recurringParentId`, `status`

#### 3.2 Accounts Model

Separate `accounts` table:  
- `id`, `name`, `type` (`bank`, `crypto`, `investment`, `credit_card`, `loan`, `cash`, `other`)  
- `currency`, `balance` (string, can be negative)  
- `isActive`, `icon`, `color`, `notes`

Balance is automatically updated atomically when a transaction is created (using SQLite transaction).

#### 3.3 Categories Model

One `categories` table with `transactionType` filter:  
- Supports separate categories for Expense, Income, Investment, Loan types  
- Fields: `id`, `name`, `transactionType`, `icon`, `color`, `isDefault`, `parentId` (optional hierarchy)

#### 3.4 Multi-Currency Handling

- Every transaction stores original `amount` + `currency` **and** converted `amountBase`  
- Exchange rate is captured at creation time (user can override)  
- All reports, charts, and summaries use `amountBase` for consistency  
- User can change global base currency later (re-calculation supported via stored rates)

#### 3.5 Recurring Transactions

- Store recurring rule as JSON (`frequency`: daily/weekly/monthly/yearly, `interval`, `dayOfMonth`, `endDate`, etc.)  
- Scheduler runs on app launch (and optionally via background fetch) to generate due transactions  
- Generated transactions link back via `recurringParentId` and update account balances

#### 3.6 Additional Important Features (MVP Scope)

- **Dashboard**: Monthly summary (income vs expense), net worth (sum of account balances + investment holdings), quick add transaction  
- **Transaction List**: Filter by type, date range, account, category, tags; search by description/source  
- **Reports**: Monthly/ yearly spending & income charts, category breakdowns (all in base currency)  
- **Investment Portfolio View**: Holdings derived from `INVESTMENT_BUY`/`SELL` (quantity tracking)  
- **Loan Tracking**: Remaining balance, interest paid  
- **Offline-first**: Full functionality without internet (exchange rates can be cached or manually entered)  
- **Multilingual UI**: Full Unicode support; categories and strings localized  
- **Data Export**: CSV/JSON export of transactions

**Out of MVP Scope (Future Phases):**  
- Bank API sync, cloud backup, advanced tax reporting, shared family accounts, budget envelopes, receipt scanning

### 4. Non-Functional Requirements

- **Performance**: Smooth on mid-range phones; efficient SQLite queries with proper indexes (`date`, `type`, `accountId`)  
- **Data Precision**: Use string/REAL carefully for monetary values; JSON for flexible fields  
- **Security & Privacy**: All data stored locally; no mandatory cloud; optional PIN/biometrics for app access  
- **Offline Support**: 100% functional offline  
- **Scalability**: Designed to handle thousands of transactions smoothly  
- **Tech Stack**: React Native Expo + TypeScript + expo-sqlite (WAL mode enabled)

### 5. Technical Design Highlights (from our discussions)

**Database Schema** (main tables):  
- `transactions` (unified)  
- `accounts`  
- `categories`  

**Key Logic Implemented:**  
- Atomic transaction + balance update using `withTransactionAsync`  
- `getBalanceDelta()` function based on transaction type  
- Recurring scheduler with `date-fns` for next-due calculation  
- Parameterized queries + JSON serialization for arrays/objects  

**Recommended Helpers:**  
- `createTransactionWithBalanceUpdate()`  
- `processRecurringTransactions()`  
- Filtered getters for transactions, categories by type, monthly summaries, etc.

### 6. Success Metrics (MVP)

- User can add multi-currency expense/income and see correct base-currency totals  
- Investment buy/sell correctly updates holdings and cash balance  
- Recurring transactions generate automatically without duplication  
- App remains fast and responsive with >1,000 transactions  
- Positive user feedback on multi-currency accuracy and freelancer-friendly fields (source, invoiceNumber, tags)

### 7. Assumptions & Risks

**Assumptions:**  
- Users will manually enter or import initial data  
- Exchange rates fetched via free API or manual input (caching planned)  
- No complex regulatory requirements for MVP (personal use only)

**Risks & Mitigations:**  
- SQLite performance on very large datasets → proper indexing + pagination  
- Complex recurring logic edge cases (month-end dates, etc.) → thorough testing + manual override  
- Exchange rate accuracy → allow user override + store historical rate forever  

This PRD consolidates **all models, fields, logic, and implementation details** we discussed (Expense → Income → Unified Transaction → Accounts → Categories → Balance updates → Recurring scheduler).

You can now use this as the single reference document for development, or expand sections (e.g., add wireframes, detailed user stories, or MoSCoW prioritization).

