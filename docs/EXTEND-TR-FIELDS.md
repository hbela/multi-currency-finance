### Financial Accuracy Fields

currency
date
exchangeRate
originalAmount
originalCurrency

### Expense-specific
merchant
receipt
isReimbursable
expenseStatus (e.g. pending/approved if you extend later)

### Income-specific
source (salary, freelance, gift, etc.)
payer (company/person)
isTaxable
invoiceId (if you extend later) 

### Transfer-specific
counterparty (person/account)
reference
fee

### Investment-specific
securityName
symbol
quantity
price
orderType (buy/sell)

### Debt-specific
creditor
debtType (loan/credit card/mortgage)
interestRate
remainingTerm

### Subscription-specific
provider
plan
nextBillingDate
isAutoRenew


