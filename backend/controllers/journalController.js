import Journal from "../models/Journal.js";
import COA from "../models/COA.js";


// POST /api/journals
export const createJournal = async (req, res) => {
  try {
    const {
      journalName,
      type,
      def_debitAcc,
      def_creditAcc
    } = req.body;

    if (!journalName || !type) {
      return res.status(400).json({
        success: false,
        message: "journalName and type are required"
      });
    }

    if (def_debitAcc) {
      const debitAccount = await COA.findById(def_debitAcc);

      if (!debitAccount) {
        return res.status(404).json({
          success: false,
          message: "Default debit account not found"
        });
      }
    }

    if (def_creditAcc) {
      const creditAccount = await COA.findById(def_creditAcc);

      if (!creditAccount) {
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

    return res.status(201).json({
      success: true,
      message: "Journal created successfully",
      data: journal
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create journal",
      error: error.message
    });
  }
};


// GET /api/v1/journals
export const getJournals = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = {};

    if (type) {
      filter.type = type;
    }

    const journals = await Journal.find(filter)
      .populate("def_debitAcc", "accountName type isActive")
      .populate("def_creditAcc", "accountName type isActive")
      .sort({ journalName: 1 });

    return res.status(200).json({
      success: true,
      count: journals.length,
      data: journals
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch journals",
      error: error.message
    });
  }
};


// GET /api/v1/journals/:id
export const getJournalById = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id)
      .populate("def_debitAcc", "accountName type isActive")
      .populate("def_creditAcc", "accountName type isActive");

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: "Journal not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: journal
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch journal",
      error: error.message
    });
  }
};


// PATCH /api/v1/journals/:id
export const updateJournal = async (req, res) => {
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
        return res.status(404).json({
          success: false,
          message: "Default credit account not found"
        });
      }

      updates.def_creditAcc = def_creditAcc;
    }

    const journal = await Journal.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    )
      .populate("def_debitAcc", "accountName type isActive")
      .populate("def_creditAcc", "accountName type isActive");

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: "Journal not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Journal updated successfully",
      data: journal
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update journal",
      error: error.message
    });
  }
};