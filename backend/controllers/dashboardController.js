import Invoice from "../models/Invoice.js";
import VendorBill from "../models/VendorBill.js";
import Budget from "../models/Budget.js";

export const getDashboardSummary = async (req, res) => {
  const { startDate, endDate } = req.query;

  console.log(JSON.stringify({
    level: "info",
    event: "dashboard_summary_request",
    startDate,
    endDate,
    timestamp: new Date().toISOString()
  }));

  try {
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

    console.log(JSON.stringify({
      level: "info",
      event: "dashboard_filters_applied",
      invoiceFilter,
      billFilter,
      timestamp: new Date().toISOString()
    }));

    const [invoices, vendorBills, budgets] = await Promise.all([
      Invoice.find(invoiceFilter),
      VendorBill.find(billFilter),
      Budget.find({ status: "CONFIRMED" })
    ]);

    console.log(JSON.stringify({
      level: "info",
      event: "dashboard_data_fetched",
      invoiceCount: invoices.length,
      vendorBillCount: vendorBills.length,
      confirmedBudgetCount: budgets.length,
      timestamp: new Date().toISOString()
    }));

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

    const remainingBudget = totalBudget - achievedBudget;

    console.log(JSON.stringify({
      level: "info",
      event: "dashboard_summary_calculated",
      totalSales,
      totalPurchases,
      customerDues,
      vendorDues,
      totalBudget,
      achievedBudget,
      remainingBudget,
      timestamp: new Date().toISOString()
    }));

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
          remaining: remainingBudget
        }
      }
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "dashboard_summary_failed",
      message: error.message,
      stack: error.stack,
      startDate,
      endDate,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};