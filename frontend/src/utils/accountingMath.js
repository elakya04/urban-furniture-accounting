// Accounting logic and mathematical helpers based on Accounting Hackathon - 24 Hours SVG specifications

export const computeBudgetAchieved = (budget, invoices = [], vendorBills = [], purchaseOrders = []) => {
  if (!budget || !budget.analytics_account) return 0;
  
  const rawAnalyticId = typeof budget.analytics_account === 'object' 
    ? budget.analytics_account._id 
    : budget.analytics_account;
  const rawAnalyticName = typeof budget.analytics_account === 'object'
    ? budget.analytics_account.name
    : '';

  const analyticId = String(rawAnalyticId || '').toLowerCase().trim();
  const analyticName = String(rawAnalyticName || '').toLowerCase().trim();

  const startDate = budget.start_date ? new Date(budget.start_date) : null;

  let total = 0;

  if (budget.type === 'INCOME') {
    invoices.forEach(inv => {
      const invDate = new Date(inv.invoice_date || inv.createdAt);
      const isDateValid = (!startDate || isNaN(startDate) || invDate >= startDate);
      const isStatusValid = ['POSTED', 'PAID', 'CONFIRMED', 'DUE'].includes(String(inv.status || '').toUpperCase());

      if (isDateValid && isStatusValid) {
        const items = (inv.items && inv.items.length > 0) ? inv.items : (inv.sales?.items || []);
        let matchFound = false;

        items.forEach(item => {
          const itemAnalyticId = String(typeof item.budgetAnalytics === 'object' ? item.budgetAnalytics?._id : (item.budgetAnalytics || '')).toLowerCase().trim();
          const itemAnalyticName = String(typeof item.budgetAnalytics === 'object' ? item.budgetAnalytics?.name : (item.budgetAnalyticsName || item.budgetAnalytics || '')).toLowerCase().trim();

          const isMatch = (itemAnalyticId && (itemAnalyticId === analyticId || itemAnalyticId.includes(analyticId) || analyticId.includes(itemAnalyticId))) ||
                          (itemAnalyticName && (itemAnalyticName === analyticName || itemAnalyticName.includes(analyticName) || analyticName.includes(itemAnalyticName)));

          if (isMatch) {
            total += Number(item.total || (item.quantity * item.unitPrice) || 0);
            matchFound = true;
          }
        });

        if (!matchFound) {
          const invAnalyticId = String(typeof inv.analytics_account === 'object' ? inv.analytics_account?._id : (inv.analytics_account || '')).toLowerCase().trim();
          if ((invAnalyticId && (invAnalyticId === analyticId || invAnalyticId.includes(analyticId))) || items.length === 0 || items.every(i => !i.budgetAnalytics)) {
            total += Number(inv.total_amount || inv.total || 0);
          }
        }
      }
    });
  } else {
    // EXPENSE: combine vendor bills and purchase orders (deduplicating converted POs)
    const activePOs = (purchaseOrders || []).filter(po => {
      const poIdStr = String(po._id || po.id || '');
      return !vendorBills.some(vb => String(vb.purchaseOrder || vb.purchase_id || '') === poIdStr);
    });

    const allExpenseDocs = [...vendorBills, ...activePOs];

    allExpenseDocs.forEach(bill => {
      const billDate = new Date(bill.bill_date || bill.date || bill.createdAt);
      const isDateValid = (!startDate || isNaN(startDate) || billDate >= startDate);
      const isStatusValid = ['POSTED', 'PAID', 'CONFIRMED', 'DUE', 'DRAFT'].includes(String(bill.status || '').toUpperCase());

      if (isDateValid && isStatusValid) {
        const items = (bill.items && bill.items.length > 0) ? bill.items : (bill.sales?.items || []);
        let matchFound = false;
        let matchedItemTotal = 0;

        items.forEach(item => {
          const itemAnalyticId = String(typeof item.budgetAnalytics === 'object' ? item.budgetAnalytics?._id : (item.budgetAnalytics || '')).toLowerCase().trim();
          const itemAnalyticName = String(typeof item.budgetAnalytics === 'object' ? item.budgetAnalytics?.name : (item.budgetAnalyticsName || item.budgetAnalytics || '')).toLowerCase().trim();

          const isMatch = (itemAnalyticId && (itemAnalyticId === analyticId || itemAnalyticId.includes(analyticId) || analyticId.includes(itemAnalyticId))) ||
                          (itemAnalyticName && (itemAnalyticName === analyticName || itemAnalyticName.includes(analyticName) || analyticName.includes(itemAnalyticName)));

          if (isMatch) {
            matchedItemTotal += Number(item.total || (item.quantity * item.unitPrice) || 0);
            matchFound = true;
          }
        });

        if (matchFound) {
          total += matchedItemTotal;
        } else {
          const billAnalyticId = String(typeof bill.analytics_account === 'object' ? bill.analytics_account?._id : (bill.analytics_account || '')).toLowerCase().trim();
          const salesAnalyticId = String(typeof bill.sales?.analytics_account === 'object' ? bill.sales?.analytics_account?._id : (bill.sales?.analytics_account || '')).toLowerCase().trim();

          if ((billAnalyticId && billAnalyticId === analyticId) || (salesAnalyticId && salesAnalyticId === analyticId) || items.length === 0 || items.every(i => !i.budgetAnalytics)) {
            total += Number(bill.total || bill.total_amount || bill.amount_paid || 0);
          }
        }
      }
    });
  }

  return total;
};

export const computeBudgetMetrics = (budget, invoices = [], vendorBills = [], purchaseOrders = []) => {
  const achieved = computeBudgetAchieved(budget, invoices, vendorBills, purchaseOrders);
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
