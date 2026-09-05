import Budget from "../models/Budget.js";
import User from "../models/User.js";

export const createBudget = async (req, res) => {
  const {
    name,
    analyticAccountId,
    type,
    amount,
    start_date,
    end_date
  } = req.body;

  console.log(JSON.stringify({
    level: "info",
    event: "budget_create_request",
    name,
    analyticAccountId,
    type,
    amount,
    start_date,
    end_date,
    timestamp: new Date().toISOString()
  }));

  try {
    if (!name || !analyticAccountId || !type || !amount || !start_date || !end_date) {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_create_validation_failed",
        reason: "Missing required fields",
        timestamp: new Date().toISOString()
      }));

      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    if (new Date(start_date) >= new Date(end_date)) {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_invalid_date_range",
        start_date,
        end_date,
        timestamp: new Date().toISOString()
      }));

      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }

    let responsiblePerson =
      req.contact?.user ||
      req.user?.user_id ||
      req.body.responsiblePerson;

    if (!responsiblePerson) {

      console.log(JSON.stringify({
        level: "info",
        event: "budget_responsible_person_fallback",
        role: req.role || "ACCOUNTANT",
        timestamp: new Date().toISOString()
      }));

      let user = await User.findOne({
        role: req.role || "ACCOUNTANT"
      });

      if (!user) {

        user = await User.create({
          role: req.role || "ACCOUNTANT",
          isActive: true
        });

        console.log(JSON.stringify({
          level: "info",
          event: "budget_fallback_user_created",
          userId: user._id.toString(),
          role: user.role,
          timestamp: new Date().toISOString()
        }));
      }

      responsiblePerson = user._id;
    }

    const budget = await Budget.create({
      name,
      analytics_account: analyticAccountId,
      type,
      committed_amount: amount,
      start_date,
      end_date,
      responsiblePerson
    });

    console.log(JSON.stringify({
      level: "info",
      event: "budget_created",
      budgetId: budget._id.toString(),
      name: budget.name,
      analyticAccountId,
      type: budget.type,
      committedAmount: budget.committed_amount,
      responsiblePerson: budget.responsiblePerson.toString(),
      timestamp: new Date().toISOString()
    }));

    return res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget
    });

  } catch (error) {

    console.error(JSON.stringify({
      level: "error",
      event: "budget_create_failed",
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


export const getBudgets = async (req, res) => {
  const {
    analyticAccount,
    status,
    startDate,
    endDate
  } = req.query;

  console.log(JSON.stringify({
    level: "info",
    event: "budgets_fetch_request",
    analyticAccount,
    status,
    startDate,
    endDate,
    timestamp: new Date().toISOString()
  }));

  try {
    const filter = {};

    if (analyticAccount) {
      filter.analytics_account = analyticAccount;
    }

    if (status) {
      filter.status = status.toUpperCase();
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

    console.log(JSON.stringify({
      level: "info",
      event: "budgets_query",
      filter,
      timestamp: new Date().toISOString()
    }));

    const budgets = await Budget.find(filter)
      .populate("analytics_account", "name type")
      .populate("responsiblePerson", "role")
      .sort({ createdAt: -1 });

    console.log(JSON.stringify({
      level: "info",
      event: "budgets_fetched",
      count: budgets.length,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      count: budgets.length,
      budgets
    });

  } catch (error) {

    console.error(JSON.stringify({
      level: "error",
      event: "budgets_fetch_failed",
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


export const getBudgetById = async (req, res) => {
  const budgetId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "budget_fetch_request",
    budgetId,
    timestamp: new Date().toISOString()
  }));

  try {
    const budget = await Budget.findById(budgetId)
      .populate("analytics_account", "name type")
      .populate("responsiblePerson", "role");

    if (!budget) {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_not_found",
        budgetId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "budget_fetched",
      budgetId: budget._id.toString(),
      status: budget.status,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      budget
    });

  } catch (error) {

    console.error(JSON.stringify({
      level: "error",
      event: "budget_fetch_failed",
      budgetId,
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


// PATCH before confirmation
export const updateBudget = async (req, res) => {
  const budgetId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "budget_update_request",
    budgetId,
    updatedFields: Object.keys(req.body),
    timestamp: new Date().toISOString()
  }));

  try {
    const {
      name,
      analyticAccountId,
      type,
      amount,
      start_date,
      end_date
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;

    if (analyticAccountId !== undefined) {
      updateData.analytics_account = analyticAccountId;
    }

    if (type !== undefined) updateData.type = type;

    if (amount !== undefined) {
      updateData.committed_amount = amount;
    }

    if (start_date !== undefined) {
      updateData.start_date = start_date;
    }

    if (end_date !== undefined) {
      updateData.end_date = end_date;
    }

    const budget = await Budget.findByIdAndUpdate(
      budgetId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!budget) {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_update_not_found",
        budgetId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "budget_updated",
      budgetId: budget._id.toString(),
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      budget
    });

  } catch (error) {

    console.error(JSON.stringify({
      level: "error",
      event: "budget_update_failed",
      budgetId,
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


export const confirmBudget = async (req, res) => {
  const budgetId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "budget_confirm_request",
    budgetId,
    timestamp: new Date().toISOString()
  }));

  try {
    const budget = await Budget.findById(budgetId);

    if (!budget) {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_confirm_not_found",
        budgetId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    if (budget.status !== "DRAFT") {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_confirm_invalid_status",
        budgetId,
        currentStatus: budget.status,
        timestamp: new Date().toISOString()
      }));

      return res.status(400).json({
        success: false,
        message: "Only draft budgets can be confirmed"
      });
    }

    budget.status = "CONFIRMED";
    await budget.save();

    console.log(JSON.stringify({
      level: "info",
      event: "budget_confirmed",
      budgetId: budget._id.toString(),
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: "Budget confirmed successfully",
      budget
    });

  } catch (error) {

    console.error(JSON.stringify({
      level: "error",
      event: "budget_confirm_failed",
      budgetId,
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


// PATCH after confirmation
export const reviseBudget = async (req, res) => {
  const budgetId = req.params.id;
  const { amount, start_date, end_date } = req.body;

  console.log(JSON.stringify({
    level: "info",
    event: "budget_revise_request",
    budgetId,
    updatedFields: Object.keys(req.body),
    timestamp: new Date().toISOString()
  }));

  try {
    const budget = await Budget.findById(budgetId);

    if (!budget) {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_revise_not_found",
        budgetId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    if (budget.status === "CANCELLED") {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_revise_cancelled",
        budgetId,
        timestamp: new Date().toISOString()
      }));

      return res.status(400).json({
        success: false,
        message: "Cancelled budget cannot be revised"
      });
    }

    if (amount !== undefined) {
      budget.committed_amount = amount;
    }

    if (start_date !== undefined) {
      budget.start_date = start_date;
    }

    if (end_date !== undefined) {
      budget.end_date = end_date;
    }

    await budget.save();

    console.log(JSON.stringify({
      level: "info",
      event: "budget_revised",
      budgetId: budget._id.toString(),
      updatedFields: Object.keys(req.body),
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: "Budget revised successfully",
      budget
    });

  } catch (error) {

    console.error(JSON.stringify({
      level: "error",
      event: "budget_revise_failed",
      budgetId,
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


export const cancelBudget = async (req, res) => {
  const budgetId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "budget_cancel_request",
    budgetId,
    timestamp: new Date().toISOString()
  }));

  try {
    const budget = await Budget.findById(budgetId);

    if (!budget) {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_cancel_not_found",
        budgetId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    if (budget.status === "CANCELLED") {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_already_cancelled",
        budgetId,
        timestamp: new Date().toISOString()
      }));

      return res.status(400).json({
        success: false,
        message: "Budget is already cancelled"
      });
    }

    budget.status = "CANCELLED";
    await budget.save();

    console.log(JSON.stringify({
      level: "info",
      event: "budget_cancelled",
      budgetId: budget._id.toString(),
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: "Budget cancelled successfully",
      budget
    });

  } catch (error) {

    console.error(JSON.stringify({
      level: "error",
      event: "budget_cancel_failed",
      budgetId,
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
  const budgetId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "budget_report_request",
    budgetId,
    timestamp: new Date().toISOString()
  }));

  try {
    const budget = await Budget.findById(budgetId)
      .populate("analytics_account", "name type");

    if (!budget) {

      console.log(JSON.stringify({
        level: "warn",
        event: "budget_report_not_found",
        budgetId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    const percentage =
      budget.committed_amount === 0
        ? 0
        : (budget.achieved_amount / budget.committed_amount) * 100;

    const remaining =
      budget.committed_amount - budget.achieved_amount;

    console.log(JSON.stringify({
      level: "info",
      event: "budget_report_generated",
      budgetId: budget._id.toString(),
      committed: budget.committed_amount,
      achieved: budget.achieved_amount,
      percentage: Number(percentage.toFixed(2)),
      remaining,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      report: {
        budgetName: budget.name,
        analyticsAccount: budget.analytics_account,
        committed: budget.committed_amount,
        achieved: budget.achieved_amount,
        percentage: Number(percentage.toFixed(2)),
        remaining
      }
    });

  } catch (error) {

    console.error(JSON.stringify({
      level: "error",
      event: "budget_report_failed",
      budgetId,
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