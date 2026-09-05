// Utility formatters for Urban Furniture Accounting System

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0.00';
  return `Rs. ${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateInput = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

export const getStatusBadgeStyle = (status) => {
  const upper = (status || '').toUpperCase();
  switch (upper) {
    case 'CONFIRMED':
    case 'POSTED':
    case 'PAID':
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'DRAFT':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'DUE':
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'OVERDUE':
    case 'CANCELLED':
    case 'CANCEL':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'REVISED':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'INVOICE':
    case 'VENDOR_BILL':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};
