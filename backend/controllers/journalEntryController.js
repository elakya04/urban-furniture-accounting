import JournalEntry from "../models/JournalEntry.js";
import Journal from "../models/Journal.js";
import COA from "../models/COA.js";


// Create Journal Entry
export const createJournalEntry = async (req, res) => {
  try {
    const {
      journal,
      date,
      inv_bill,
      journalItems,
      sourceType,
      sourceId,
      invoice_order_ref
    } = req.body;

    if (!journal) {
      return res.status(400).json({
        success: false,
        message: "Journal is required"
      });
    }

    if (!journalItems || journalItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one journal item is required"
      });
    }

    // Check journal
    const journalExists = await Journal.findById(journal);

    if (!journalExists) {
      return res.status(404).json({
        success: false,
        message: "Journal not found"
      });
    }

    let totalDebit = 0;
    let totalCredit = 0;

    // Validate every journal item
    for (const item of journalItems) {
      if (!item.account) {
        return res.status(400).json({
          success: false,
          message: "Every journal item must have an account"
        });
      }

      const account = await COA.findById(item.account);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: `COA account ${item.account} not found`
        });
      }

      const debit = Number(item.debit || 0);
      const credit = Number(item.credit || 0);

      if (debit < 0 || credit < 0) {
        return res.status(400).json({
          success: false,
          message: "Debit and credit cannot be negative"
        });
      }

      if (debit > 0 && credit > 0) {
        return res.status(400).json({
          success: false,
          message: "A journal item cannot have both debit and credit"
        });
      }

      if (debit === 0 && credit === 0) {
        return res.status(400).json({
          success: false,
          message: "A journal item must contain a debit or credit amount"
        });
      }

      totalDebit += debit;
      totalCredit += credit;
    }

    // Double-entry accounting validation
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return res.status(400).json({
        success: false,
        message: "Journal entry is not balanced",
        totalDebit,
        totalCredit
      });
    }

    const journalEntry = await JournalEntry.create({
      journal,
      date: date || new Date(),
      inv_bill,
      journalItems,
      sourceType,
      sourceId,
      invoice_order_ref,
      status: "DRAFT"
    });

    return res.status(201).json({
      success: true,
      message: "Journal entry created successfully",
      data: journalEntry
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create journal entry",
      error: error.message
    });
  }
};


// Get all Journal Entries
export const getJournalEntries = async (req, res) => {
  try {
    const journalEntries = await JournalEntry.find()
      .populate("journal")
      .populate("journalItems.account")
      .populate("sourceId")
      .populate("invoice_order_ref")
      .sort({
        date: -1,
        createdAt: -1
      });

    return res.status(200).json({
      success: true,
      data: journalEntries
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch journal entries",
      error: error.message
    });
  }
};


// Get Journal Entry by ID
export const getJournalEntryById = async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findById(req.params.id)
      .populate("journal")
      .populate("journalItems.account")
      .populate("sourceId")
      .populate("invoice_order_ref");

    if (!journalEntry) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: journalEntry
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch journal entry",
      error: error.message
    });
  }
};


// Post Journal Entry
export const postJournalEntry = async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findById(req.params.id);

    if (!journalEntry) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found"
      });
    }

    // Already posted = immutable
    if (journalEntry.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft journal entries can be posted"
      });
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const item of journalEntry.journalItems) {
      totalDebit += Number(item.debit || 0);
      totalCredit += Number(item.credit || 0);
    }

    // Re-check balance before posting
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return res.status(400).json({
        success: false,
        message: "Journal entry is not balanced",
        totalDebit,
        totalCredit
      });
    }

    journalEntry.status = "POSTED";

    await journalEntry.save();

    return res.status(200).json({
      success: true,
      message: "Journal entry posted successfully",
      data: journalEntry
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to post journal entry",
      error: error.message
    });
  }
};