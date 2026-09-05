import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/Toast';
import { Dashboard } from '../../pages/dashboard/Dashboard';
import { ContactsPage } from '../../pages/contacts/ContactsPage';
import { ProductsPage } from '../../pages/products/ProductsPage';
import { COAPage } from '../../pages/coa/COAPage';
import { JournalsPage } from '../../pages/journals/JournalsPage';
import { AnalyticPage } from '../../pages/analyticAccounts/AnalyticPage';
import { SalesOrdersPage } from '../../pages/salesOrders/SalesOrdersPage';
import { InvoicesPage } from '../../pages/invoices/InvoicesPage';
import { PurchaseOrdersPage } from '../../pages/purchaseOrders/PurchaseOrdersPage';
import { VendorBillsPage } from '../../pages/vendorBills/VendorBillsPage';
import { PaymentsPage } from '../../pages/payments/PaymentsPage';
import { JournalEntriesPage } from '../../pages/journalEntries/JournalEntriesPage';
import { LedgerPage } from '../../pages/ledger/LedgerPage';
import { BudgetsPage } from '../../pages/budgets/BudgetsPage';
import { StockPage } from '../../pages/stock/StockPage';
import { ProfitLossPage } from '../../pages/reports/ProfitLossPage';
import { BalanceSheetPage } from '../../pages/reports/BalanceSheetPage';
import { BudgetReportPage } from '../../pages/reports/BudgetReportPage';
import { CustomerPortal } from '../../pages/portal/CustomerPortal';
import { VendorPortal } from '../../pages/portal/VendorPortal';

export const AppLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'contacts':
        return <ContactsPage />;
      case 'products':
        return <ProductsPage />;
      case 'coa':
        return <COAPage />;
      case 'journals':
        return <JournalsPage />;
      case 'analytics':
        return <AnalyticPage />;
      case 'sales-orders':
        return <SalesOrdersPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'purchase-orders':
        return <PurchaseOrdersPage />;
      case 'vendor-bills':
        return <VendorBillsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'journal-entries':
        return <JournalEntriesPage />;
      case 'ledger':
        return <LedgerPage />;
      case 'budgets':
        return <BudgetsPage />;
      case 'stock':
        return <StockPage />;
      case 'profit-loss':
        return <ProfitLossPage />;
      case 'balance-sheet':
        return <BalanceSheetPage />;
      case 'budget-report':
        return <BudgetReportPage />;
      case 'customer-portal':
        return <CustomerPortal />;
      case 'vendor-portal':
        return <VendorPortal />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Humanic Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header onNavigate={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderContent()}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
