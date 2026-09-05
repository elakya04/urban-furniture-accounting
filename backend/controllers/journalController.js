import Journal from "../models/Journal.js";
import COA from "../models/COA.js";


// POST /api/journals
export const createJournal = async (req, res) => {
  const { journalName, type, def_debitAcc, def_creditAcc } = req.body;

  console.log(JSON.stringify({
    level: "info",
    event: "journal_create_request",
    journalName,
    type,
    def_debitAcc,
    def_creditAcc,
    timestamp: new Date().toISOString()
  }));

  try {
    if (!journalName || !type) {
      console.log(JSON.stringify({
        level: "warn",
        event: "journal_create_validation_failed",
        reason: "journalName and type are required",
        timestamp: new Date().toISOString()
      }));

      return res.status(400).json({
        success: false,
        message: "journalName and type are required"
      });
    }

    if (def_debitAcc) {
      const debitAccount = await COA.findById(def_debitAcc);

      if (!debitAccount) {
        console.log(JSON.stringify({
          level: "warn",
          event: "journal_create_debit_account_not_found",
          def_debitAcc,
          timestamp: new Date().toISOString()
        }));

        return res.status(404).json({
          success: false,
          message: "Default debit account not found"
        });
      }
    }

    if (def_creditAcc) {
      const creditAccount = await COA.findById(def_creditAcc);

      if (!creditAccount) {
        console.log(JSON.stringify({
          level: "warn",
          event: "journal_create_credit_account_not_found",
          def_creditAcc,
          timestamp: new Date().toISOString()
        }));

        return res.status(404).json({
          success: false,
          message: "Default credit account not found"
        });
      }
    }

    const existingJournal = await Journal.findOne({
      $or: [
        {
          journalName: {
            $regex: `^${journalName}$`,
            $options: "i"
          }
        },
        { type }
      ]
    });

    if (existingJournal) {
      console.log(JSON.stringify({
        level: "warn",
        event: "journal_create_conflict",
        journalName,
        type,
        existingJournalId: existingJournal._id.toString(),
        timestamp: new Date().toISOString()
      }));

      return res.status(409).json({
        success: false,
        message: "Journal with this name or type already exists"
      });
    }

    const journal = await Journal.create({
      journalName,
      type,
      def_debitAcc,
      def_creditAcc
    });

    console.log(JSON.stringify({
      level: "info",
      event: "journal_created",
      journalId: journal._id.toString(),
      journalName: journal.journalName,
      type: journal.type,
      timestamp: new Date().toISOString()
    }));

    return res.status(201).json({
      success: true,
      message: "Journal created successfully",
      data: journal
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "journal_create_failed",
      journalName,
      type,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to create journal",
      error: error.message
    });
  }
};


// GET /api/v1/journals
export const getJournals = async (req, res) => {
  const { type } = req.query;

  console.log(JSON.stringify({
    level: "info",
    event: "journals_fetch_request",
    type: type || null,
    timestamp: new Date().toISOString()
  }));

  try {
    const filter = {};

    if (type) {
      filter.type = type;
    }

    const journals = await Journal.find(filter)
      .populate("def_debitAcc", "accountName type isActive")
      .populate("def_creditAcc", "accountName type isActive")
      .sort({ journalName: 1 });

    console.log(JSON.stringify({
      level: "info",
      event: "journals_fetched",
      count: journals.length,
      type: type || null,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      count: journals.length,
      data: journals
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "journals_fetch_failed",
      type: type || null,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to fetch journals",
      error: error.message
    });
  }
};


// GET /api/v1/journals/:id
export const getJournalById = async (req, res) => {
  const journalId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "journal_fetch_request",
    journalId,
    timestamp: new Date().toISOString()
  }));

  try {
    const journal = await Journal.findById(journalId)
      .populate("def_debitAcc", "accountName type isActive")
      .populate("def_creditAcc", "accountName type isActive");

    if (!journal) {
      console.log(JSON.stringify({
        level: "warn",
        event: "journal_not_found",
        journalId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Journal not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "journal_fetched",
      journalId: journal._id.toString(),
      journalName: journal.journalName,
      type: journal.type,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      data: journal
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "journal_fetch_failed",
      journalId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to fetch journal",
      error: error.message
    });
  }
};


// PATCH /api/v1/journals/:id
export const updateJournal = async (req, res) => {
  const journalId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "journal_update_request",
    journalId,
    updatedFields: Object.keys(req.body),
    timestamp: new Date().toISOString()
  }));

  try {
    const {
      journalName,
      type,
      def_debitAcc,
      def_creditAcc
    } = req.body;

    const updates = {};

    if (journalName !== undefined) {
      updates.journalName = journalName;
    }

    if (type !== undefined) {
      updates.type = type;
    }

    if (def_debitAcc !== undefined) {
      const account = await COA.findById(def_debitAcc);

      if (!account) {
        console.log(JSON.stringify({
          level: "warn",
          event: "journal_update_debit_account_not_found",
          journalId,
          def_debitAcc,
          timestamp: new Date().toISOString()
        }));

        return res.status(404).json({
          success: false,
          message: "Default debit account not found"
        });
      }

      updates.def_debitAcc = def_debitAcc;
    }

    if (def_creditAcc !== undefined) {
      const account = await COA.findById(def_creditAcc);

      if (!account) {
        console.log(JSON.stringify({
          level: "warn",
          event: "journal_update_credit_account_not_found",
          journalId,
          def_creditAcc,
          timestamp: new Date().toISOString()
        }));

        return res.status(404).json({
          success: false,
          message: "Default credit account not found"
        });
      }

      updates.def_creditAcc = def_creditAcc;
    }

    const journal = await Journal.findByIdAndUpdate(
      journalId,
      updates,
      {
        new: true,
        runValidators: true
      }
    )
      .populate("def_debitAcc", "accountName type isActive")
      .populate("def_creditAcc", "accountName type isActive");

    if (!journal) {
      console.log(JSON.stringify({
        level: "warn",
        event: "journal_update_not_found",
        journalId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Journal not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "journal_updated",
      journalId: journal._id.toString(),
      journalName: journal.journalName,
      updatedFields: Object.keys(updates),
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: "Journal updated successfully",
      data: journal
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "journal_update_failed",
      journalId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: "Failed to update journal",
      error: error.message
    });
  }
};