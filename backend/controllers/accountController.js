import COA from "../models/COA.js";
import JournalEntry from "../models/JournalEntry.js";


// POST /api/accounts
export const createAccount = async (req, res) => {
  try {
    const {
      accountName,
      type
    } = req.body;

    if (!accountName || !type) {
      return res.status(400).json({
        success: false,
        message: "accountName and type are required"
      });
    }

    const existingAccount = await COA.findOne({
      accountName: {
        $regex: `^${accountName}$`,
        $options: "i"
      }
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: "Account already exists"
      });
    }

    const account = await COA.create({
      accountName,
      type
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create account",
      error: error.message
    });
  }
};


// GET /api/accounts
export const getAccounts = async (req, res) => {
  try {
    const {
      type,
      search,
      isActive
    } = req.query;

    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.accountName = {
        $regex: search,
        $options: "i"
      };
    }

    const accounts = await COA.find(filter)
      .sort({ accountName: 1 });

    return res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
      error: error.message
    });
  }
};


// GET /api/accounts/:id
export const getAccountById = async (req, res) => {
  try {
    const account = await COA.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: account
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch account",
      error: error.message
    });
  }
};


// PATCH /api/accounts/:id
export const updateAccount = async (req, res) => {
  try {
    const {
      accountName,
      type
    } = req.body;

    const updates = {};

    if (accountName !== undefined) {
      updates.accountName = accountName;
    }

    if (type !== undefined) {
      updates.type = type;
    }

    const account = await COA.findByIdAndUpdate(
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
        message: "Account not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: account
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update account",
      error: error.message
    });
  }
};


// PATCH /api/accounts/:id/status
export const updateAccountStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean"
      });
    }

    const account = await COA.findByIdAndUpdate(
      req.params.id,
      { isActive },
      {
        new: true,
        runValidators: true
      }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account status updated successfully",
      data: account
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update account status",
      error: error.message
    });
  }
};


// GET /api/accounts/:id/ledger
export const getAccountLedger = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const account = await COA.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    const match = {
      "journalItems.account": account._id,
      status: "POSTED"
    };

    if (startDate || endDate) {
      match.date = {};

      if (startDate) {
        match.date.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.date.$lte = end;
      }
    }

    const ledger = await JournalEntry.aggregate([
      {
        $match: match
      },

      {
        $unwind: "$journalItems"
      },

      {
        $match: {
          "journalItems.account": account._id
        }
      },

      {
        $lookup: {
          from: "journals",
          localField: "journal",
          foreignField: "_id",
          as: "journal"
        }
      },

      {
        $unwind: {
          path: "$journal",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $project: {
          _id: 1,
          date: 1,
          inv_bill: 1,
          sourceType: 1,
          sourceId: 1,
          status: 1,

          journal: "$journal.journalName",

          debit: "$journalItems.debit",
          credit: "$journalItems.credit"
        }
      },

      {
        $sort: {
          date: 1
        }
      }
    ]);

    let balance = 0;

    const result = ledger.map((entry) => {
      balance += entry.debit - entry.credit;

      return {
        ...entry,
        balance
      };
    });

    return res.status(200).json({
      success: true,
      account: {
        id: account._id,
        accountName: account.accountName,
        type: account.type
      },
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch account ledger",
      error: error.message
    });
  }
};