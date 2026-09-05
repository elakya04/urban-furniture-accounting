import COA from "../models/COA.js";
import JournalEntry from "../models/JournalEntry.js";


// POST /api/accounts
export const createAccount = async (req, res) => {
  const { accountName, type } = req.body;

  console.log(JSON.stringify({
    level: "info",
    event: "account_create_request",
    accountName,
    type,
    timestamp: new Date().toISOString()
  }));

  try {
    if (!accountName || !type) {
      console.log(JSON.stringify({
        level: "warn",
        event: "account_create_validation_failed",
        message: "accountName and type are required",
        timestamp: new Date().toISOString()
      }));

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
      console.log(JSON.stringify({
        level: "warn",
        event: "account_create_duplicate",
        accountName,
        existingAccountId: existingAccount._id.toString(),
        timestamp: new Date().toISOString()
      }));

      return res.status(409).json({
        success: false,
        message: "Account already exists"
      });
    }

    const account = await COA.create({
      accountName,
      type
    });

    console.log(JSON.stringify({
      level: "info",
      event: "account_created",
      accountId: account._id.toString(),
      accountName: account.accountName,
      type: account.type,
      timestamp: new Date().toISOString()
    }));

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "account_create_failed",
      accountName,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to create account",
      error: error.message
    });
  }
};


// GET /api/accounts
export const getAccounts = async (req, res) => {
  const { type, search, isActive } = req.query;

  console.log(JSON.stringify({
    level: "info",
    event: "accounts_fetch_request",
    type,
    search,
    isActive,
    timestamp: new Date().toISOString()
  }));

  try {
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

    console.log(JSON.stringify({
      level: "info",
      event: "accounts_query",
      filter,
      timestamp: new Date().toISOString()
    }));

    const accounts = await COA.find(filter)
      .sort({ accountName: 1 });

    console.log(JSON.stringify({
      level: "info",
      event: "accounts_fetched",
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
      event: "accounts_fetch_failed",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
      error: error.message
    });
  }
};


// GET /api/accounts/:id
export const getAccountById = async (req, res) => {
  const accountId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "account_fetch_request",
    accountId,
    timestamp: new Date().toISOString()
  }));

  try {
    const account = await COA.findById(accountId);

    if (!account) {
      console.log(JSON.stringify({
        level: "warn",
        event: "account_not_found",
        accountId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "account_fetched",
      accountId: account._id.toString(),
      accountName: account.accountName,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      data: account
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "account_fetch_failed",
      accountId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to fetch account",
      error: error.message
    });
  }
};


// PATCH /api/accounts/:id
export const updateAccount = async (req, res) => {
  const accountId = req.params.id;
  const { accountName, type } = req.body;

  console.log(JSON.stringify({
    level: "info",
    event: "account_update_request",
    accountId,
    accountName,
    type,
    timestamp: new Date().toISOString()
  }));

  try {
    const updates = {};

    if (accountName !== undefined) {
      updates.accountName = accountName;
    }

    if (type !== undefined) {
      updates.type = type;
    }

    const account = await COA.findByIdAndUpdate(
      accountId,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!account) {
      console.log(JSON.stringify({
        level: "warn",
        event: "account_update_not_found",
        accountId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "account_updated",
      accountId: account._id.toString(),
      updatedFields: Object.keys(updates),
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: account
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "account_update_failed",
      accountId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to update account",
      error: error.message
    });
  }
};


// PATCH /api/accounts/:id/status
export const updateAccountStatus = async (req, res) => {
  const accountId = req.params.id;
  const { isActive } = req.body;

  console.log(JSON.stringify({
    level: "info",
    event: "account_status_update_request",
    accountId,
    isActive,
    timestamp: new Date().toISOString()
  }));

  try {
    if (typeof isActive !== "boolean") {
      console.log(JSON.stringify({
        level: "warn",
        event: "account_status_validation_failed",
        accountId,
        receivedValue: isActive,
        timestamp: new Date().toISOString()
      }));

      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean"
      });
    }

    const account = await COA.findByIdAndUpdate(
      accountId,
      { isActive },
      {
        new: true,
        runValidators: true
      }
    );

    if (!account) {
      console.log(JSON.stringify({
        level: "warn",
        event: "account_status_not_found",
        accountId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "account_status_updated",
      accountId: account._id.toString(),
      isActive: account.isActive,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: "Account status updated successfully",
      data: account
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "account_status_update_failed",
      accountId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to update account status",
      error: error.message
    });
  }
};


// GET /api/accounts/:id/ledger
export const getAccountLedger = async (req, res) => {
  const accountId = req.params.id;
  const { startDate, endDate } = req.query;

  console.log(JSON.stringify({
    level: "info",
    event: "account_ledger_request",
    accountId,
    startDate,
    endDate,
    timestamp: new Date().toISOString()
  }));

  try {
    const account = await COA.findById(accountId);

    if (!account) {
      console.log(JSON.stringify({
        level: "warn",
        event: "ledger_account_not_found",
        accountId,
        timestamp: new Date().toISOString()
      }));

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

    console.log(JSON.stringify({
      level: "info",
      event: "ledger_query_started",
      accountId,
      accountName: account.accountName,
      dateFilter: match.date || null,
      timestamp: new Date().toISOString()
    }));

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

    console.log(JSON.stringify({
      level: "info",
      event: "ledger_entries_fetched",
      accountId,
      accountName: account.accountName,
      entryCount: ledger.length,
      timestamp: new Date().toISOString()
    }));

    let balance = 0;

    const result = ledger.map((entry) => {
      balance += entry.debit - entry.credit;

      return {
        ...entry,
        balance
      };
    });

    console.log(JSON.stringify({
      level: "info",
      event: "ledger_calculated",
      accountId,
      accountName: account.accountName,
      entryCount: result.length,
      finalBalance: balance,
      timestamp: new Date().toISOString()
    }));

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
    console.error(JSON.stringify({
      level: "error",
      event: "ledger_fetch_failed",
      accountId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to fetch account ledger",
      error: error.message
    });
  }
};