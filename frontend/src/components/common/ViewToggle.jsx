import React from 'react';
import { List, LayoutGrid } from 'lucide-react';

export const ViewToggle = ({ currentView, onViewChange }) => {
  return (
    <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          currentView === 'list'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <List className="w-3.5 h-3.5" />
        List View
      </button>
      <button
        onClick={() => onViewChange('kanban')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          currentView === 'kanban'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Kanban View
      </button>
    </div>
  );
};
