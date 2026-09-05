import AnalyticsAccount from "../models/AnalyticsAccount.js";


// POST /api/analytic-accounts
export const createAnalyticAccount = async (req, res) => {
  const { name, type } = req.body;

  console.log(JSON.stringify({
    level: "info",
    event: "analytic_account_create_request",
    name,
    type,
    timestamp: new Date().toISOString()
  }));

  try {
    if (!name || !type) {
      console.log(JSON.stringify({
        level: "warn",
        event: "analytic_account_create_validation_failed",
        message: "name and type are required",
        timestamp: new Date().toISOString()
      }));

      return res.status(400).json({
        success: false,
        message: "name and type are required"
      });
    }

    const existingAccount = await AnalyticsAccount.findOne({
      name: {
        $regex: `^${name}$`,
        $options: "i"
      }
    });

    if (existingAccount) {
      console.log(JSON.stringify({
        level: "warn",
        event: "analytic_account_duplicate",
        name,
        existingAccountId: existingAccount._id.toString(),
        timestamp: new Date().toISOString()
      }));

      return res.status(409).json({
        success: false,
        message: "Analytic account already exists"
      });
    }

    const analyticAccount = await AnalyticsAccount.create({
      name,
      type
    });

    console.log(JSON.stringify({
      level: "info",
      event: "analytic_account_created",
      analyticAccountId: analyticAccount._id.toString(),
      name: analyticAccount.name,
      type: analyticAccount.type,
      timestamp: new Date().toISOString()
    }));

    return res.status(201).json({
      success: true,
      message: "Analytic account created successfully",
      data: analyticAccount
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "analytic_account_create_failed",
      name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to create analytic account",
      error: error.message
    });
  }
};


// GET /api/analytic-accounts
export const getAnalyticAccounts = async (req, res) => {
  const { type, search } = req.query;

  console.log(JSON.stringify({
    level: "info",
    event: "analytic_accounts_fetch_request",
    type,
    search,
    timestamp: new Date().toISOString()
  }));

  try {
    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i"
      };
    }

    console.log(JSON.stringify({
      level: "info",
      event: "analytic_accounts_query",
      filter,
      timestamp: new Date().toISOString()
    }));

    const accounts = await AnalyticsAccount.find(filter)
      .sort({ name: 1 });

    console.log(JSON.stringify({
      level: "info",
      event: "analytic_accounts_fetched",
      count: accounts.length,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "analytic_accounts_fetch_failed",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytic accounts",
      error: error.message
    });
  }
};


// GET /api/analytic-accounts/:id
export const getAnalyticAccountById = async (req, res) => {
  const analyticAccountId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "analytic_account_fetch_request",
    analyticAccountId,
    timestamp: new Date().toISOString()
  }));

  try {
    const account = await AnalyticsAccount.findById(analyticAccountId);

    if (!account) {
      console.log(JSON.stringify({
        level: "warn",
        event: "analytic_account_not_found",
        analyticAccountId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Analytic account not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "analytic_account_fetched",
      analyticAccountId: account._id.toString(),
      name: account.name,
      type: account.type,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      data: account
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "analytic_account_fetch_failed",
      analyticAccountId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytic account",
      error: error.message
    });
  }
};


// PATCH /api/analytic-accounts/:id
export const updateAnalyticAccount = async (req, res) => {
  const analyticAccountId = req.params.id;
  const { name, type } = req.body;

  console.log(JSON.stringify({
    level: "info",
    event: "analytic_account_update_request",
    analyticAccountId,
    name,
    type,
    timestamp: new Date().toISOString()
  }));

  try {
    const updates = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (type !== undefined) {
      updates.type = type;
    }

    console.log(JSON.stringify({
      level: "info",
      event: "analytic_account_update_started",
      analyticAccountId,
      updatedFields: Object.keys(updates),
      timestamp: new Date().toISOString()
    }));

    const account = await AnalyticsAccount.findByIdAndUpdate(
      analyticAccountId,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!account) {
      console.log(JSON.stringify({
        level: "warn",
        event: "analytic_account_update_not_found",
        analyticAccountId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Analytic account not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "analytic_account_updated",
      analyticAccountId: account._id.toString(),
      updatedFields: Object.keys(updates),
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: "Analytic account updated successfully",
      data: account
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "analytic_account_update_failed",
      analyticAccountId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to update analytic account",
      error: error.message
    });
  }
};