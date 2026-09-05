// Accounting logic and mathematical helpers based on Accounting Hackathon - 24 Hours SVG specifications

export const computeBudgetAchieved = (budget, invoices = [], vendorBills = []) => {
  if (!budget || !budget.analytics_account) return 0;
  
  const analyticId = typeof budget.analytics_account === 'object' 
    ? budget.analytics_account._id 
    : budget.analytics_account;
  const analyticName = typeof budget.analytics_account === 'object'
    ? budget.analytics_account.name
    : '';

  const startDate = new Date(budget.start_date);
  const endDate = new Date(budget.end_date);

  let total = 0;

  if (budget.type === 'INCOME') {
    invoices.forEach(inv => {
      const invDate = new Date(inv.invoice_date || inv.createdAt);
      if (invDate >= startDate && invDate <= endDate && (inv.status === 'POSTED' || inv.status === 'PAID' || inv.status === 'CONFIRMED')) {
        const items = inv.items || inv.sales?.items || [];
        items.forEach(item => {
          const itemAnalyticId = typeof item.budgetAnalytics === 'object' ? item.budgetAnalytics?._id : item.budgetAnalytics;
          if (itemAnalyticId === analyticId || item.budgetAnalytics === analyticName) {
            total += Number(item.total || (item.quantity * item.unitPrice) || 0);
          }
        });
      }
    });
  } else {
    // EXPENSE
    vendorBills.forEach(bill => {
      const billDate = new Date(bill.bill_date || bill.createdAt);
      if (billDate >= startDate && billDate <= endDate && (bill.status === 'POSTED' || bill.status === 'PAID' || bill.status === 'CONFIRMED')) {
        const items = bill.items || bill.sales?.items || [];
        items.forEach(item => {
          const itemAnalyticId = typeof item.budgetAnalytics === 'object' ? item.budgetAnalytics?._id : item.budgetAnalytics;
          if (itemAnalyticId === analyticId || item.budgetAnalytics === analyticName) {
            total += Number(item.total || (item.quantity * item.unitPrice) || 0);
          }
        });
      }
    });
  }

  return total;
};

export const computeBudgetMetrics = (budget, invoices = [], vendorBills = []) => {
  const achieved = computeBudgetAchieved(budget, invoices, vendorBills);
  const committed = Number(budget.committed_amount || 0);
  const achievedPercent = committed > 0 ? (achieved / committed) * 100 : 0;
  const amountToAchieve = committed - achieved;

  return {
    achievedAmount: achieved,
    achievedPercent: Math.min(100, Math.max(0, parseFloat(achievedPercent.toFixed(2)))),
    rawPercent: parseFloat(achievedPercent.toFixed(2)),
    amountToAchieve: Math.max(0, amountToAchieve)
  };
};

export const validateJournalEntryBalance = (items = []) => {
  const totalDebit = items.reduce((sum, item) => sum + Number(item.debit || 0), 0);
  const totalCredit = items.reduce((sum, item) => sum + Number(item.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  
  return {
    totalDebit,
    totalCredit,
    isBalanced,
    difference: Math.abs(totalDebit - totalCredit)
  };
};

export const computeProfitLoss = (invoices = [], vendorBills = [], accounts = []) => {
  let salesIncome = 0;
  let purchaseExpense = 0;
  let otherExpense = 0;

  invoices.forEach(inv => {
    if (inv.status === 'PAID' || inv.status === 'POSTED' || inv.status === 'CONFIRMED') {
      salesIncome += Number(inv.total_amount || inv.total || 0);
    }
  });

  vendorBills.forEach(bill => {
    if (bill.status === 'PAID' || bill.status === 'POSTED' || bill.status === 'CONFIRMED') {
      purchaseExpense += Number(bill.total || bill.total_amount || 0);
    }
  });

  const totalIncome = salesIncome;
  const totalExpenses = purchaseExpense + otherExpense;
  const netIncome = totalIncome - totalExpenses;

  return {
    salesIncome,
    purchaseExpense,
    otherExpense,
    totalIncome,
    totalExpenses,
    netIncome
  };
};

export const computeBalanceSheet = (payments = [], invoices = [], vendorBills = [], accounts = []) => {
  let cash = 10000;
  let bank = 25000;
  let debtors = 0;
  let creditors = 0;
  let capital = 35000;

  invoices.forEach(inv => {
    if (inv.status === 'DUE' || inv.status === 'OVERDUE') {
      debtors += Number(inv.amount_due || inv.total_amount || 0);
    }
  });

  vendorBills.forEach(bill => {
    if (bill.status === 'DUE' || bill.status === 'OVERDUE') {
      creditors += Number(bill.amount_due || bill.total || 0);
    }
  });

  payments.forEach(p => {
    if (p.status === 'CONFIRM' || p.status === 'PAID') {
      const amt = Number(p.amount || 0);
      if (p.type === 'RECEIVE') {
        if (p.payment_method === 'CASH') cash += amt;
        else bank += amt;
      } else if (p.type === 'SEND') {
        if (p.payment_method === 'CASH') cash -= amt;
        else bank -= amt;
      }
    }
  });

  const totalAssets = bank + cash + debtors;
  const totalLiabilities = creditors + capital;

  return {
    assets: {
      bank,
      cash,
      debtors,
      totalAssets
    },
    liabilities: {
      creditors,
      capital,
      totalLiabilities
    },
    isBalanced: Math.abs(totalAssets - totalLiabilities) < 0.01
  };
};
