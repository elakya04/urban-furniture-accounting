import AnalyticsAccount from "../models/AnalyticsAccount.js";


// POST /api/analytic-accounts
export const createAnalyticAccount = async (req, res) => {
  try {
    const {
      name,
      type
    } = req.body;

    if (!name || !type) {
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
      return res.status(409).json({
        success: false,
        message: "Analytic account already exists"
      });
    }

    const analyticAccount = await AnalyticsAccount.create({
      name,
      type
    });

    return res.status(201).json({
      success: true,
      message: "Analytic account created successfully",
      data: analyticAccount
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create analytic account",
      error: error.message
    });
  }
};


// GET /api/analytic-accounts
export const getAnalyticAccounts = async (req, res) => {
  try {
    const {
      type,
      search
    } = req.query;

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

    const accounts = await AnalyticsAccount.find(filter)
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytic accounts",
      error: error.message
    });
  }
};


// GET /api/analytic-accounts/:id
export const getAnalyticAccountById = async (req, res) => {
  try {
    const account = await AnalyticsAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Analytic account not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: account
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytic account",
      error: error.message
    });
  }
};


// PATCH /api/analytic-accounts/:id
export const updateAnalyticAccount = async (req, res) => {
  try {
    const {
      name,
      type
    } = req.body;

    const updates = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (type !== undefined) {
      updates.type = type;
    }

    const account = await AnalyticsAccount.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Analytic account not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Analytic account updated successfully",
      data: account
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update analytic account",
      error: error.message
    });
  }
};