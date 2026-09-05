import Budget from "../models/Budget.js";
import User from "../models/User.js";

export const createBudget = async (req, res) => {
  try {
    const {
      name,
      analyticAccountId,
      type,
      amount,
      start_date,
      end_date
    } = req.body;

    if (!name || !analyticAccountId || !type || !amount || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }

    let responsiblePerson = req.contact?.user || req.user?.user_id || req.body.responsiblePerson;
    if (!responsiblePerson) {
      let user = await User.findOne({ role: req.role || "ACCOUNTANT" });
      if (!user) {
        user = await User.create({ role: req.role || "ACCOUNTANT", isActive: true });
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

    return res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBudgets = async (req, res) => {
  try {
    const {
      analyticAccount,
      status,
      startDate,
      endDate
    } = req.query;

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

    const budgets = await Budget.find(filter)
      .populate("analytics_account", "name type")
      .populate("responsiblePerson", "role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: budgets.length,
      budgets
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate("analytics_account", "name type")
      .populate("responsiblePerson", "role");

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    return res.status(200).json({
      success: true,
      budget
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//patch for changing budget details before confirmation
export const updateBudget = async (req, res) => {
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
    if (amount !== undefined) updateData.committed_amount = amount;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;

    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      budget
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const confirmBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    if (budget.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft budgets can be confirmed"
      });
    }

    budget.status = "CONFIRMED";
    await budget.save();

    return res.status(200).json({
      success: true,
      message: "Budget confirmed successfully",
      budget
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


//patch for updating budget details after confirmation
export const reviseBudget = async (req, res) => {
  try {
    const { amount, start_date, end_date } = req.body;

    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    if (budget.status === "CANCELLED") {
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

    return res.status(200).json({
      success: true,
      message: "Budget revised successfully",
      budget
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const cancelBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    if (budget.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Budget is already cancelled"
      });
    }

    budget.status = "CANCELLED";
    await budget.save();

    return res.status(200).json({
      success: true,
      message: "Budget cancelled successfully",
      budget
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBudgetReport = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate("analytics_account", "name type");

    if (!budget) {
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
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};