import Invoice from "../models/Invoice.js";
import VendorBill from "../models/VendorBill.js";
import Budget from "../models/Budget.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const invoiceFilter = {};
    const billFilter = {};

    if (startDate || endDate) {
      invoiceFilter.invoice_date = {};
      billFilter.bill_date = {};

      if (startDate) {
        invoiceFilter.invoice_date.$gte = new Date(startDate);
        billFilter.bill_date.$gte = new Date(startDate);
      }

      if (endDate) {
        invoiceFilter.invoice_date.$lte = new Date(endDate);
        billFilter.bill_date.$lte = new Date(endDate);
      }
    }

    const invoices = await Invoice.find(invoiceFilter);
    const vendorBills = await VendorBill.find(billFilter);
    const budgets = await Budget.find({
      status: "CONFIRMED"
    });

    const totalSales = invoices.reduce(
      (sum, invoice) => sum + invoice.total_amount,
      0
    );

    const totalPurchases = vendorBills.reduce(
      (sum, bill) => sum + bill.total,
      0
    );

    const customerDues = invoices.reduce(
      (sum, invoice) => sum + invoice.amount_due,
      0
    );

    const vendorDues = vendorBills.reduce(
      (sum, bill) => sum + bill.amount_due,
      0
    );

    const totalBudget = budgets.reduce(
      (sum, budget) => sum + budget.committed_amount,
      0
    );

    const achievedBudget = budgets.reduce(
      (sum, budget) => sum + budget.achieved_amount,
      0
    );

    return res.status(200).json({
      success: true,

      summary: {
        totalSales,
        totalPurchases,
        customerDues,
        vendorDues,

        budget: {
          committed: totalBudget,
          achieved: achievedBudget,
          remaining: totalBudget - achievedBudget
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};