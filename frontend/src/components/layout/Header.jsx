import React, { useState } from 'react';
import { Search, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearchModal } from './GlobalSearchModal';

export const Header = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getRoleLabel = () => {
    if (!currentUser) return 'GUEST';
    const type = currentUser.userType || currentUser.role;
    if (type === 'CONTACT') {
      const cr = currentUser.contactRole || currentUser.contact_id;
      if (cr === 'VENDOR') return 'VENDOR PORTAL';
      if (cr === 'BOTH') return 'CUSTOMER / VENDOR';
      return 'CUSTOMER PORTAL';
    }
    return type || 'USER';
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        {/* Global Search trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 hover:border-slate-300 w-72 transition-colors"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="flex-1 text-left">Search records, invoices, SO...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Right side static user info & logout */}
        <div className="flex items-center gap-4">
          {/* Static Role Badge (Non-selectable inside app) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-900">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Role: {getRoleLabel()}</span>
          </div>

          {/* User Profile Badge & Logout Button */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
              {currentUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">{currentUser?.name}</div>
              <div className="text-[10px] text-slate-400">{currentUser?.email}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};
