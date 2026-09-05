import JournalEntry from "../models/JournalEntry.js";
import Budget from "../models/Budget.js";

export const getProfitLoss = async (req, res) => {
  const { startDate, endDate } = req.query;

  console.log(JSON.stringify({
    level: "info",
    event: "profit_loss_request",
    startDate,
    endDate,
    timestamp: new Date().toISOString()
  }));

  try {
    const filter = { status: "POSTED" };

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    console.log(JSON.stringify({
      level: "info",
      event: "profit_loss_query",
      filter,
      timestamp: new Date().toISOString()
    }));

    const journalEntries = await JournalEntry.find(filter)
      .populate("journalItems.account");

    console.log(JSON.stringify({
      level: "info",
      event: "profit_loss_entries_fetched",
      count: journalEntries.length,
      timestamp: new Date().toISOString()
    }));

    let totalIncome = 0;
    let totalExpense = 0;

    journalEntries.forEach((entry) => {
      entry.journalItems.forEach((item) => {
        const account = item.account;

        if (!account) {
          console.log(JSON.stringify({
            level: "warn",
            event: "journal_item_missing_account",
            journalEntryId: entry._id.toString(),
            timestamp: new Date().toISOString()
          }));
          return;
        }

        if (account.type === "INCOME") {
          totalIncome += item.credit - item.debit;
        }

        if (account.type === "EXPENSE") {
          totalExpense += item.debit - item.credit;
        }
      });
    });

    const netIncome = totalIncome - totalExpense;

    console.log(JSON.stringify({
      level: "info",
      event: "profit_loss_calculated",
      totalIncome,
      totalExpense,
      netIncome,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      period: { startDate, endDate },
      income: totalIncome,
      expenses: totalExpense,
      netIncome
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "profit_loss_failed",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getBalanceSheet = async (req, res) => {
  const { asOfDate } = req.query;

  console.log(JSON.stringify({
    level: "info",
    event: "balance_sheet_request",
    asOfDate,
    timestamp: new Date().toISOString()
  }));

  try {
    const filter = { status: "POSTED" };

    if (asOfDate) {
      filter.date = {
        $lte: new Date(asOfDate)
      };
    }

    console.log(JSON.stringify({
      level: "info",
      event: "balance_sheet_query",
      filter,
      timestamp: new Date().toISOString()
    }));

    const journalEntries = await JournalEntry.find(filter)
      .populate("journalItems.account");

    let assets = 0;
    let liabilities = 0;
    let capital = 0;

    journalEntries.forEach((entry) => {
      entry.journalItems.forEach((item) => {
        const account = item.account;

        if (!account) return;

        if (account.type === "ASSET") {
          assets += item.debit - item.credit;
        }

        if (account.type === "LIABILITY") {
          liabilities += item.credit - item.debit;
        }

        if (account.type === "CAPITAL") {
          capital += item.credit - item.debit;
        }
      });
    });

    console.log(JSON.stringify({
      level: "info",
      event: "balance_sheet_calculated",
      assets,
      liabilities,
      capital,
      totalLiabilitiesAndCapital: liabilities + capital,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      asOfDate: asOfDate || new Date(),
      assets,
      liabilities,
      capital,
      totalLiabilitiesAndCapital: liabilities + capital
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "balance_sheet_failed",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getBudgetReport = async (req, res) => {
  const { budgetId, analyticAccount, startDate, endDate } = req.query;

  console.log(JSON.stringify({
    level: "info",
    event: "budget_report_request",
    budgetId,
    analyticAccount,
    startDate,
    endDate,
    timestamp: new Date().toISOString()
  }));

  try {
    const filter = {};

    if (budgetId) filter._id = budgetId;

    if (analyticAccount) {
      filter.analytics_account = analyticAccount;
    }

    if (startDate || endDate) {
      filter.start_date = {};

      if (startDate) filter.start_date.$gte = new Date(startDate);
      if (endDate) filter.start_date.$lte = new Date(endDate);
    }

    const budgets = await Budget.find(filter)
      .populate("analytics_account", "name type");

    console.log(JSON.stringify({
      level: "info",
      event: "budget_report_fetched",
      count: budgets.length,
      timestamp: new Date().toISOString()
    }));

    const report = budgets.map((budget) => {
      const percentage =
        budget.committed_amount === 0
          ? 0
          : (budget.achieved_amount / budget.committed_amount) * 100;

      return {
        id: budget._id,
        name: budget.name,
        analyticAccount: budget.analytics_account,
        committed: budget.committed_amount,
        achieved: budget.achieved_amount,
        remaining: budget.committed_amount - budget.achieved_amount,
        percentage: Number(percentage.toFixed(2)),
        status: budget.status
      };
    });

    console.log(JSON.stringify({
      level: "info",
      event: "budget_report_generated",
      count: report.length,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      count: report.length,
      report
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "budget_report_failed",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};