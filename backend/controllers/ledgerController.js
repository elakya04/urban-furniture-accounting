import JournalEntry from "../models/JournalEntry.js";

export const getLedger = async (req, res) => {
  try {
    const accountId = req.params.accountId || req.params.accid;
    const { startDate, endDate } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required"
      });
    }

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
    const ledger = [];

    for (const entry of journalEntries) {
      const item = entry.journalItems.find(
        (item) => item.account && item.account.toString() === accountId.toString()
      );

      if (item) {
        balance += (item.debit || 0) - (item.credit || 0);

        ledger.push({
          date: entry.date,
          reference: entry.inv_bill,
          debit: item.debit || 0,
          credit: item.credit || 0,
          balance
        });
      }
    }

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