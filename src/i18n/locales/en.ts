export type Translations = {
  txn: {
    types: { expense: string; income: string; transfer: string; investment: string; debt: string; subscription: string };
    fields: {
      amount: string; note: string; category: string; account: string; date: string;
      currency: string; exchangeRate: string; originalAmount: string; originalCurrency: string;
      merchant: string; isReimbursable: string;
      source: string; payer: string; isTaxable: string;
      counterparty: string; reference: string; fee: string;
      securityName: string; symbol: string; quantity: string; price: string; orderType: string;
      creditor: string; debtType: string; interestRate: string; remainingTerm: string;
      provider: string; plan: string; nextBillingDate: string; isAutoRenew: string;
    };
    sections: { details: string; financialAccuracy: string };
    orderType: { buy: string; sell: string };
    debtType: { loan: string; credit_card: string; mortgage: string };
  };
  form: { save: string; delete: string; addTransaction: string; saveChanges: string };
  settings: {
    title: string; appearance: string; themeSystem: string; themeLight: string; themeDark: string;
    accounts: string; addAccount: string; newAccount: string; accountName: string; accountCurrency: string;
    categories: string; addCategory: string; newCategory: string; categoryName: string;
    automation: string; recurringTransactions: string; recurringNone: string; recurringActive: string;
    data: string; exportDb: string; importDb: string; comingSoon: string;
    screenshots: string; deviceLabel: string;
    screenshotCount_one: string; screenshotCount_other: string;
    uploadToDrive: string; clear: string;
    language: string; languageLabel: string; version: string;
  };
  common: { cancel: string; save: string; yes: string; no: string; delete: string };
};

const en: Translations = {
  txn: {
    types: {
      expense: 'Expense',
      income: 'Income',
      transfer: 'Transfer',
      investment: 'Investment',
      debt: 'Debt',
      subscription: 'Subscription',
    },
    fields: {
      amount: 'Amount',
      note: 'Note',
      category: 'Category',
      account: 'Account',
      date: 'Date',
      currency: 'Currency',
      exchangeRate: 'Exchange rate',
      originalAmount: 'Original amount',
      originalCurrency: 'Original currency',
      merchant: 'Merchant',
      isReimbursable: 'Reimbursable',
      source: 'Source',
      payer: 'Payer',
      isTaxable: 'Taxable',
      counterparty: 'Counterparty',
      reference: 'Reference',
      fee: 'Fee',
      securityName: 'Security name',
      symbol: 'Symbol',
      quantity: 'Quantity',
      price: 'Price',
      orderType: 'Order type',
      creditor: 'Creditor',
      debtType: 'Debt type',
      interestRate: 'Interest rate (%)',
      remainingTerm: 'Remaining term (months)',
      provider: 'Provider',
      plan: 'Plan',
      nextBillingDate: 'Next billing date (YYYY-MM-DD)',
      isAutoRenew: 'Auto-renew',
    },
    sections: {
      details: 'Details',
      financialAccuracy: 'Financial accuracy',
    },
    orderType: {
      buy: 'Buy',
      sell: 'Sell',
    },
    debtType: {
      loan: 'Loan',
      credit_card: 'Credit card',
      mortgage: 'Mortgage',
    },
  },
  form: {
    save: 'Save',
    delete: 'Delete',
    addTransaction: 'Add transaction',
    saveChanges: 'Save changes',
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    accounts: 'Accounts',
    addAccount: 'Add account',
    newAccount: 'New account',
    accountName: 'Name',
    accountCurrency: 'Currency (3-letter)',
    categories: 'Categories',
    addCategory: 'Add category',
    newCategory: 'New category',
    categoryName: 'Name',
    automation: 'Automation',
    recurringTransactions: 'Recurring transactions',
    recurringNone: 'No rules yet',
    recurringActive: '{{active}} active · {{total}} total',
    data: 'Data',
    exportDb: 'Export database',
    importDb: 'Import database',
    comingSoon: 'Coming soon',
    screenshots: 'Screenshots',
    deviceLabel: 'Device type label used in file names',
    screenshotCount_one: '{{count}} screenshot captured',
    screenshotCount_other: '{{count}} screenshots captured',
    uploadToDrive: 'Upload to Drive',
    clear: 'Clear',
    language: 'Language',
    languageLabel: 'App language',
    version: 'Budget · v1.0 · offline',
  },
  common: {
    cancel: 'Cancel',
    save: 'Save',
    yes: 'Yes',
    no: 'No',
    delete: 'Delete',
  },
};

export default en;
