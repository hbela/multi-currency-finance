export type Translations = {
  reports: {
    title: string;
    monthlyTrends: string;
    lastMonths: string;
    totalIncome: string;
    totalExpense: string;
    net: string;
    savingsRate: string;
    breakdown: string;
    expenses: string;
    income: string;
    noTransactions: string;
    noCategories: string;
    // Week 5
    currencyFilter: string;
    allCurrencies: string;
    accountPnL: string;
    noAccountPnL: string;
    countryBreakdown: string;
    noCountryData: string;
    exportCsv: string;
  };
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
      fromAccount: string; toAccount: string; receivedAmount: string;
    };
    sections: { details: string; currency: string; transfer: string };
    notFound: string;
  };
  form: { save: string; delete: string; addTransaction: string; saveChanges: string };
  nav: {
    dashboard: string; transactions: string; accounts: string; investments: string; budgets: string; reports: string; settings: string;
    newTransaction: string; editTransaction: string; support: string;
  };
  dashboard: {
    recentTransactions: string;
    noTransactions: string;
    totalBalance: string;
    incomeThisMonth: string;
    expenseThisMonth: string;
    today: string;
    yesterday: string;
    // Week 5
    netWorthTrend: string;
    last30Days: string;
    accountSummary: string;
    biggestExpense: string;
    savingsRate: string;
    noAccountsYet: string;
    // Week 6
    ratesLastUpdated: string;
  };
  transactions: { noTransactions: string };
  budgets: { noBudgets: string; newBudget: string; monthlyLimit: string; left: string; overBy: string };
  settings: {
    title: string; appearance: string; themeSystem: string; themeLight: string; themeDark: string;
    accounts: string; addAccount: string; newAccount: string; accountName: string; accountCurrency: string;
    accountTypeCash: string; accountTypeBank: string; accountTypeCard: string;
    categories: string; addCategory: string; newCategory: string; categoryName: string;
    automation: string; recurringTransactions: string; recurringNone: string; recurringActive: string;
    data: string; exportDb: string; exportDbDesc: string;
    exportSuccess: string; exportError: string;
    screenshots: string; deviceLabel: string;
    screenshotCount_one: string; screenshotCount_other: string;
    uploadToDrive: string; clear: string;
    language: string; languageLabel: string; version: string;
    welcomeScreen: string; welcomeScreenDesc: string;
    baseCurrency: string; fxRates: string;
  };
  baseCurrency: {
    title: string;
    current: string;
    changeTo: string;
    confirm: string;
    warning: string;
    changed: string;
  };
  welcome: {
    title: string; subtitle: string;
    feature1Title: string; feature1Desc: string;
    feature2Title: string; feature2Desc: string;
    feature3Title: string; feature3Desc: string;
    feature4Title: string; feature4Desc: string;
    feature5Title: string; feature5Desc: string;
    feature6Title: string; feature6Desc: string;
    disableHint: string; getStarted: string;
  };
  recurring: {
    frequency: string; weekly: string; monthly: string; yearly: string;
    startDate: string; endDate: string; hasEndDate: string; note: string;
    errorAmount: string; errorStartDate: string; errorEndDate: string; errorEndBeforeStart: string;
  };
  accounts: {
    noAccounts: string;
    form: {
      titleAdd: string; titleEdit: string;
      name: string; type: string; currency: string; institution: string; notes: string;
      errorName: string; errorCurrency: string; confirmDelete: string;
    };
    nav: string;
  };
  exchangeRates: {
    title: string; noRates: string; addRate: string;
    from: string; to: string; rate: string; date: string; source: string;
    form: { titleAdd: string; titleEdit: string; errorRate: string; confirmDelete: string };
    history: string; pairHistory: string; lastUpdated: string; neverUpdated: string;
    noHistory: string;
  };
  investments: {
    title: string;
    noHoldings: string;
    totalValue: string;
    unrealizedPnL: string;
    classes: { stock: string; etf: string; crypto: string; bond: string; other: string };
    fields: {
      asset: string; symbol: string; name: string; assetClass: string;
      account: string; quantity: string; avgCost: string; currentPrice: string;
      exchange: string; currency: string;
    };
    form: {
      titleAdd: string; titleEdit: string;
      titleAddAsset: string;
      errorSymbol: string; errorName: string; errorQuantity: string; errorAvgCost: string;
      errorAccount: string; errorAsset: string;
      confirmDelete: string;
    };
    nav: string;
    currentPriceHint: string;
  };
  loans: {
    title: string;
    noLoans: string;
    totalDebt: string;
    monthlyPayment: string;
    types: { mortgage: string; personal: string; auto: string; student: string };
    fields: {
      name: string; account: string; principal: string; currency: string;
      interestRate: string; startDate: string; termMonths: string;
      loanType: string; lender: string; notes: string;
      remainingBalance: string; nextPayment: string;
    };
    form: {
      titleAdd: string; titleEdit: string;
      errorName: string; errorAccount: string; errorPrincipal: string;
      errorRate: string; errorTerm: string;
      confirmClose: string; confirmDelete: string;
    };
    payment: {
      title: string; totalPaid: string; principalPaid: string; interestPaid: string;
      remaining: string; date: string;
      errorAmount: string;
      history: string; noPayments: string;
    };
    nav: string;
    closed: string;
  };
  common: { cancel: string; save: string; yes: string; no: string; delete: string; ok: string };
  support: {
    title: string;
    alreadySupported: string;
    transparencyIntro: string;
    noAds: string;
    noTracking: string;
    noSubscriptions: string;
    noHiddenFees: string;
    supportMessage: string;
    coffeeSmall: string;
    coffeeMedium: string;
    coffeeLarge: string;
    notAvailable: string;
    thankYouSnackbar: string;
    restoreSuccess: string;
    restoreNone: string;
    restorePurchases: string;
    thankYouFooter: string;
  };
};

const en: Translations = {
  reports: {
    title: 'Reports',
    monthlyTrends: 'Monthly trends',
    lastMonths: 'Last {{n}} months',
    totalIncome: 'Income',
    totalExpense: 'Expenses',
    net: 'Net',
    savingsRate: 'Savings {{pct}}%',
    breakdown: '{{month}} breakdown',
    expenses: 'Expenses',
    income: 'Income',
    noTransactions: 'No {{type}} transactions this month.',
    noCategories: 'No categories to display.',
    currencyFilter: 'Currency',
    allCurrencies: 'All currencies',
    accountPnL: 'Per-account P&L',
    noAccountPnL: 'No account data for this month.',
    countryBreakdown: 'Spending by country',
    noCountryData: 'No location data for this month.',
    exportCsv: 'Export CSV',
  },
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
      fromAccount: 'From account',
      toAccount: 'To account',
      receivedAmount: 'Received amount',
    },
    sections: {
      details: 'Details',
      currency: 'Currency & exchange rate',
      transfer: 'Transfer details',
    },
    notFound: 'Transaction not found.',
  },
  form: {
    save: 'Save',
    delete: 'Delete',
    addTransaction: 'Add transaction',
    saveChanges: 'Save changes',
  },
  nav: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    accounts: 'Accounts',
    investments: 'Investments',
    budgets: 'Budgets',
    reports: 'Reports',
    settings: 'Settings',
    newTransaction: 'New transaction',
    editTransaction: 'Edit transaction',
    support: 'Support',
  },
  dashboard: {
    recentTransactions: 'Recent transactions',
    noTransactions: 'No transactions yet. Tap + to add your first one.',
    totalBalance: 'Total balance',
    incomeThisMonth: 'Income (this month)',
    expenseThisMonth: 'Expense (this month)',
    today: 'Today',
    yesterday: 'Yesterday',
    netWorthTrend: 'Net worth trend',
    last30Days: 'Last 30 days',
    accountSummary: 'Accounts by currency',
    biggestExpense: 'Top expense category',
    savingsRate: 'Savings rate',
    noAccountsYet: 'No accounts yet.',
    ratesLastUpdated: 'Rates updated {{date}}',
  },
  transactions: {
    noTransactions: 'No transactions yet. Tap + to add one.',
  },
  budgets: {
    noBudgets: 'No budgets for {{month}}. Tap + to add one.',
    newBudget: 'New budget',
    monthlyLimit: 'Monthly limit',
    left: '{{amount}} left',
    overBy: 'Over by {{amount}}',
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
    accountTypeCash: 'Cash',
    accountTypeBank: 'Bank',
    accountTypeCard: 'Card',
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
    exportDbDesc: 'Save transactions, accounts & categories as CSV',
    exportSuccess: 'Export complete',
    exportError: 'Export failed',
    screenshots: 'Screenshots',
    deviceLabel: 'Device type label used in file names',
    screenshotCount_one: '{{count}} screenshot captured',
    screenshotCount_other: '{{count}} screenshots captured',
    uploadToDrive: 'Upload to Drive',
    clear: 'Clear',
    language: 'Language',
    languageLabel: 'App language',
    version: 'Standalone Budget Manager · v2.0 · offline',
    welcomeScreen: 'Welcome screen',
    welcomeScreenDesc: 'Show welcome screen on next launch',
    baseCurrency: 'Base currency',
    fxRates: 'Exchange rates',
  },
  baseCurrency: {
    title: 'Base currency',
    current: 'Current base: {{code}}',
    changeTo: 'Switch to {{code}}',
    confirm: 'Set {{code}} as base currency?',
    warning: 'Historical net worth values will not be recalculated retroactively.',
    changed: 'Base currency changed to {{code}}',
  },
  welcome: {
    title: 'Welcome to your Budget Manager',
    subtitle: 'Your personal finance companion — track, plan, and grow your money.',
    feature1Title: 'Track Transactions',
    feature1Desc: 'Log expenses, income, transfers, investments, and loans in one place.',
    feature2Title: 'Multiple Accounts',
    feature2Desc: 'Manage cash, bank, and card accounts with multi-currency support.',
    feature3Title: 'Budget Planning',
    feature3Desc: 'Set monthly budgets per category and monitor spending in real time.',
    feature4Title: 'Reports & Insights',
    feature4Desc: 'Visual charts show monthly trends, savings rate, and category breakdowns.',
    feature5Title: 'Recurring Transactions',
    feature5Desc: 'Automate regular payments — weekly, monthly, or yearly.',
    feature6Title: 'Works Offline',
    feature6Desc: 'All data lives on your device. No account, no cloud required.',
    disableHint: 'You can disable this screen any time in Settings.',
    getStarted: 'Get started',
  },
  recurring: {
    frequency: 'Frequency',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    startDate: 'Start date (YYYY-MM-DD)',
    endDate: 'End date (YYYY-MM-DD)',
    hasEndDate: 'End date',
    note: 'Note',
    errorAmount: 'Enter a valid amount.',
    errorStartDate: 'Start date must be YYYY-MM-DD.',
    errorEndDate: 'End date must be YYYY-MM-DD.',
    errorEndBeforeStart: 'End date must be after start date.',
  },
  accounts: {
    noAccounts: 'No accounts yet. Tap + to add one.',
    form: {
      titleAdd: 'Add account',
      titleEdit: 'Edit account',
      name: 'Account name',
      type: 'Account type',
      currency: 'Currency',
      institution: 'Institution (optional)',
      notes: 'Notes (optional)',
      errorName: 'Name is required',
      errorCurrency: 'Currency is required',
      confirmDelete: 'Tap again to confirm',
    },
    nav: 'Accounts',
  },
  exchangeRates: {
    title: 'Exchange rates',
    noRates: 'No exchange rates saved.',
    addRate: 'Add rate',
    from: 'From currency',
    to: 'To currency',
    rate: 'Rate',
    date: 'Date',
    source: 'Source',
    form: {
      titleAdd: 'Add exchange rate',
      titleEdit: 'Edit exchange rate',
      errorRate: 'Rate must be positive',
      confirmDelete: 'Tap again to confirm',
    },
    history: 'Rate history',
    pairHistory: '{{from}} → {{to}} history',
    lastUpdated: 'Updated {{date}}',
    neverUpdated: 'Never updated',
    noHistory: 'No history for this pair.',
  },
  investments: {
    title: 'Investments',
    noHoldings: 'No holdings yet. Tap + to add one.',
    totalValue: 'Total value',
    unrealizedPnL: 'Unrealised P&L',
    classes: { stock: 'Stocks', etf: 'ETFs', crypto: 'Crypto', bond: 'Bonds', other: 'Other' },
    fields: {
      asset: 'Asset',
      symbol: 'Symbol / ticker',
      name: 'Asset name',
      assetClass: 'Asset class',
      account: 'Account',
      quantity: 'Quantity',
      avgCost: 'Avg cost basis',
      currentPrice: 'Current price',
      exchange: 'Exchange (optional)',
      currency: 'Currency',
    },
    form: {
      titleAdd: 'Add holding',
      titleEdit: 'Edit holding',
      titleAddAsset: 'New asset',
      errorSymbol: 'Symbol is required',
      errorName: 'Name is required',
      errorQuantity: 'Enter a valid quantity',
      errorAvgCost: 'Enter a valid cost basis',
      errorAccount: 'Account is required',
      errorAsset: 'Asset is required',
      confirmDelete: 'Tap again to confirm',
    },
    nav: 'Investments',
    currentPriceHint: 'Leave blank to use avg cost',
  },
  loans: {
    title: 'Loans',
    noLoans: 'No active loans. Tap + to add one.',
    totalDebt: 'Total debt',
    monthlyPayment: 'Monthly payment',
    types: { mortgage: 'Mortgage', personal: 'Personal', auto: 'Auto', student: 'Student' },
    fields: {
      name: 'Loan name',
      account: 'Linked account',
      principal: 'Principal amount',
      currency: 'Currency',
      interestRate: 'Interest rate (% p.a.)',
      startDate: 'Start date (YYYY-MM-DD)',
      termMonths: 'Term (months)',
      loanType: 'Loan type',
      lender: 'Lender (optional)',
      notes: 'Notes (optional)',
      remainingBalance: 'Remaining balance',
      nextPayment: 'Next payment',
    },
    form: {
      titleAdd: 'Add loan',
      titleEdit: 'Edit loan',
      errorName: 'Name is required',
      errorAccount: 'Account is required',
      errorPrincipal: 'Enter a valid principal amount',
      errorRate: 'Enter a valid interest rate',
      errorTerm: 'Enter a valid term in months',
      confirmClose: 'Mark as closed?',
      confirmDelete: 'Tap again to confirm',
    },
    payment: {
      title: 'Record payment',
      totalPaid: 'Total paid',
      principalPaid: 'Principal',
      interestPaid: 'Interest',
      remaining: 'Remaining balance',
      date: 'Payment date (YYYY-MM-DD)',
      errorAmount: 'Enter a valid payment amount',
      history: 'Payment history',
      noPayments: 'No payments recorded yet.',
    },
    nav: 'Loans',
    closed: 'Close loan',
  },
  common: {
    cancel: 'Cancel',
    save: 'Save',
    yes: 'Yes',
    no: 'No',
    delete: 'Delete',
    ok: 'OK',
  },
  support: {
    title: 'Support the App',
    alreadySupported: '☕ Thank you for your support!',
    transparencyIntro: 'This app is built by a solo developer and will always be free.',
    noAds: 'No ads',
    noTracking: 'No tracking',
    noSubscriptions: 'No subscriptions',
    noHiddenFees: 'No hidden fees',
    supportMessage: 'If you find it useful, buying me a coffee helps keep it maintained and growing.',
    coffeeSmall: 'Small coffee',
    coffeeMedium: 'Medium coffee',
    coffeeLarge: 'Large coffee',
    notAvailable: 'In-app purchases are not available on this device.',
    thankYouSnackbar: 'Thank you so much! ☕',
    restoreSuccess: 'Purchase restored — thank you!',
    restoreNone: 'No previous purchases found.',
    restorePurchases: 'Restore purchases',
    thankYouFooter: 'Thank you for using the app ♥',
  },
};

export default en;
