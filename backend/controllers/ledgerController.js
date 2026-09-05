import JournalEntry from "../models/JournalEntry.js";

export const getLedger = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = {
      status: "POSTED",
      "journalItems.account": accountId
    };

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const journalEntries = await JournalEntry.find(filter)
      .sort({ date: 1 });

    let balance = 0;

    const ledger = journalEntries.map((entry) => {
      const item = entry.journalItems.find(
        (item) => item.account.toString() === accountId
      );

      balance += item.debit - item.credit;

      return {
        date: entry.date,
        reference: entry.inv_bill,
        debit: item.debit,
        credit: item.credit,
        balance
      };
    });

    return res.status(200).json({
      success: true,
      ledger
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};