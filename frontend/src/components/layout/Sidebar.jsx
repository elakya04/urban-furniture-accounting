import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  BookOpen,
  FileText,
  PieChart,
  ShoppingCart,
  Receipt,
  Truck,
  CreditCard,
  Layers,
  BarChart3,
  Archive,
  History,
  Building2,
  Tag,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout } = useAuth();
  const role = currentUser?.userType;


  const isCustomer = role === 'CONTACT' && currentUser?.contact_id === 'CUSTOMER';
  const isVendor = role === 'CONTACT' && currentUser?.contact_id === 'VENDOR';

  const menuSections = [
    {
      title: 'General',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ACCOUNTANT'] }
      ]
    },
    {
      title: 'Self Service Portals',
      items: [
        { id: 'customer-portal', label: 'Customer Portal', icon: ShoppingCart, roles: ['ADMIN', 'ACCOUNTANT', 'CONTACT'] },
        { id: 'vendor-portal', label: 'Vendor Portal', icon: Truck, roles: ['ADMIN', 'ACCOUNTANT', 'CONTACT'] }
      ]
    },
    {
      title: 'Master Data',
      items: [
        { id: 'contacts', label: 'Contacts', icon: Users, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'products', label: 'Product Master', icon: Package, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'coa', label: 'Chart of Accounts', icon: BookOpen, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'journals', label: 'Journals', icon: Layers, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'analytics', label: 'Analytic Accounts', icon: Tag, roles: ['ADMIN', 'ACCOUNTANT'] }
      ]
    },
    {
      title: 'Sales & Invoicing',
      items: [
        { id: 'sales-orders', label: 'Sales Orders', icon: ShoppingCart, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'invoices', label: 'Customer Invoices', icon: Receipt, roles: ['ADMIN', 'ACCOUNTANT'] }
      ]
    },
    {
      title: 'Purchases & Bills',
      items: [
        { id: 'purchase-orders', label: 'Purchase Orders', icon: Truck, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'vendor-bills', label: 'Vendor Bills', icon: FileText, roles: ['ADMIN', 'ACCOUNTANT'] }
      ]
    },
    {
      title: 'Finance & Books',
      items: [
        { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'journal-entries', label: 'Journal Entries', icon: History, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'ledger', label: 'General Ledger', icon: BookOpen, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'budgets', label: 'Budgets & Analytics', icon: PieChart, roles: ['ADMIN', 'ACCOUNTANT'] }
      ]
    },
    {
      title: 'Inventory & Stock',
      items: [
        { id: 'stock', label: 'Stock Inventory', icon: Archive, roles: ['ADMIN', 'ACCOUNTANT'] }
      ]
    },
    {
      title: 'Financial Reports',
      items: [
        { id: 'profit-loss', label: 'Profit & Loss', icon: BarChart3, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'balance-sheet', label: 'Balance Sheet', icon: Building2, roles: ['ADMIN', 'ACCOUNTANT'] },
        { id: 'budget-report', label: 'Budget Report', icon: PieChart, roles: ['ADMIN', 'ACCOUNTANT'] }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-sm tracking-wider">
          UF
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight">Urban Furniture</h1>
          <p className="text-[11px] text-slate-400">Accounting Suite</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive
                          ? 'bg-slate-800 text-amber-400 font-semibold shadow-xs'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Role Indicator & Logout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs space-y-3">
        <div className="flex items-center justify-between text-slate-400">
          <span>Active Role:</span>
          <span className="font-semibold text-amber-400 uppercase">{role}</span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/60 text-rose-300 font-semibold text-xs transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout / Sign Out
        </button>
      </div>
    </aside>
  );
};

