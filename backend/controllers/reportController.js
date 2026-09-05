import JournalEntry from "../models/JournalEntry.js";
import COA from "../models/COA.js";
import Budget from "../models/Budget.js";

export const getProfitLoss = async (req, res) => {
  console.log("[REPORT] Profit & Loss request received", {
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });

  try {
    const { startDate, endDate } = req.query;

    const filter = {
      status: "POSTED"
    };

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    console.log("[REPORT] Profit & Loss filter:", filter);

    const journalEntries = await JournalEntry.find(filter)
      .populate("journalItems.account");

    console.log(`[REPORT] Found ${journalEntries.length} posted journal entries`);

    let totalIncome = 0;
    let totalExpense = 0;

    journalEntries.forEach((entry) => {
      entry.journalItems.forEach((item) => {
        const account = item.account;

        if (!account) {
          console.warn("[REPORT] Journal item has no valid account", {
            journalEntryId: entry._id
          });
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

    console.log("[REPORT] Profit & Loss calculated", {
      totalIncome,
      totalExpense,
      netIncome
    });

    return res.status(200).json({
      success: true,
      period: { startDate, endDate },
      income: totalIncome,
      expenses: totalExpense,
      netIncome
    });

  } catch (error) {
    console.error("[ERROR] Failed to generate Profit & Loss report", {
      message: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getBalanceSheet = async (req, res) => {
  console.log("[REPORT] Balance Sheet request received", {
    asOfDate: req.query.asOfDate
  });

  try {
    const { asOfDate } = req.query;

    const filter = {
      status: "POSTED"
    };

    if (asOfDate) {
      filter.date = {
        $lte: new Date(asOfDate)
      };
    }

    console.log("[REPORT] Balance Sheet filter:", filter);

    const journalEntries = await JournalEntry.find(filter)
      .populate("journalItems.account");

    console.log(
      `[REPORT] Found ${journalEntries.length} posted journal entries for Balance Sheet`
    );

    let assets = 0;
    let liabilities = 0;
    let capital = 0;

    journalEntries.forEach((entry) => {
      entry.journalItems.forEach((item) => {
        const account = item.account;

        if (!account) {
          console.warn("[REPORT] Journal item has no valid account", {
            journalEntryId: entry._id
          });
          return;
        }

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

    console.log("[REPORT] Balance Sheet calculated", {
      assets,
      liabilities,
      capital,
      totalLiabilitiesAndCapital: liabilities + capital
    });

    return res.status(200).json({
      success: true,
      asOfDate: asOfDate || new Date(),
      assets,
      liabilities,
      capital,
      totalLiabilitiesAndCapital: liabilities + capital
    });

  } catch (error) {
    console.error("[ERROR] Failed to generate Balance Sheet", {
      message: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getBudgetReport = async (req, res) => {
  console.log("[REPORT] Budget report request received", {
    budgetId: req.query.budgetId,
    analyticAccount: req.query.analyticAccount,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });

  try {
    const {
      budgetId,
      analyticAccount,
      startDate,
      endDate
    } = req.query;

    const filter = {};

    if (budgetId) filter._id = budgetId;

    if (analyticAccount) {
      filter.analytics_account = analyticAccount;
    }

    if (startDate || endDate) {
      filter.start_date = {};

      if (startDate) {
        filter.start_date.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.start_date.$lte = new Date(endDate);
      }
    }

    console.log("[REPORT] Budget filter:", filter);

    const budgets = await Budget.find(filter)
      .populate("analytics_account", "name type");

    console.log(`[REPORT] Found ${budgets.length} budgets`);

    const report = budgets.map((budget) => {
      const percentage =
        budget.committed_amount === 0
          ? 0
          : (budget.achieved_amount / budget.committed_amount) * 100;

      const remaining =
        budget.committed_amount - budget.achieved_amount;

      console.log("[REPORT] Budget calculated", {
        budgetId: budget._id,
        name: budget.name,
        committed: budget.committed_amount,
        achieved: budget.achieved_amount,
        remaining,
        percentage: Number(percentage.toFixed(2))
      });

      return {
        id: budget._id,
        name: budget.name,
        analyticAccount: budget.analytics_account,
        committed: budget.committed_amount,
        achieved: budget.achieved_amount,
        remaining,
        percentage: Number(percentage.toFixed(2)),
        status: budget.status
      };
    });

    console.log("[REPORT] Budget report generated successfully", {
      count: report.length
    });

    return res.status(200).json({
      success: true,
      count: report.length,
      report
    });

  } catch (error) {
    console.error("[ERROR] Failed to generate Budget Report", {
      message: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};