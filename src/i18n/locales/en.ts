export type Translations = {
  txn: {
    types: {
      EXPENSE: string; INCOME: string; TRANSFER: string;
      INVESTMENT_BUY: string; INVESTMENT_SELL: string;
      LOAN_RECEIVED: string; LOAN_REPAYMENT: string;
      DIVIDEND: string; INTEREST: string; CREDIT_CARD_PAYMENT: string;
    };
    fields: {
      amount: string; description: string; notes: string; category: string; account: string; date: string;
      currency: string; exchangeRate: string; amountBase: string;
      source: string;
      counterparty: string; reference: string; fee: string;
      securityName: string; symbol: string; quantity: string; price: string;
      creditor: string; interestRate: string; remainingTerm: string;
    };
    sections: { details: string; currency: string };
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
      EXPENSE: 'Expense',
      INCOME: 'Income',
      TRANSFER: 'Transfer',
      INVESTMENT_BUY: 'Buy',
      INVESTMENT_SELL: 'Sell',
      LOAN_RECEIVED: 'Loan received',
      LOAN_REPAYMENT: 'Loan repayment',
      DIVIDEND: 'Dividend',
      INTEREST: 'Interest',
      CREDIT_CARD_PAYMENT: 'Card payment',
    },
    fields: {
      amount: 'Amount',
      description: 'Description',
      notes: 'Notes',
      category: 'Category',
      account: 'Account',
      date: 'Date',
      currency: 'Currency',
      exchangeRate: 'Exchange rate',
      amountBase: 'Base amount',
      source: 'Source / merchant',
      counterparty: 'Counterparty',
      reference: 'Reference',
      fee: 'Fee',
      securityName: 'Security name',
      symbol: 'Symbol / ticker',
      quantity: 'Quantity',
      price: 'Price',
      creditor: 'Creditor / lender',
      interestRate: 'Interest rate (%)',
      remainingTerm: 'Remaining term (months)',
    },
    sections: {
      details: 'Details',
      currency: 'Currency & exchange rate',
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
    recurringNone: 'No recurring rules yet',
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
    version: 'FlexFinance · v2.0 · offline',
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
