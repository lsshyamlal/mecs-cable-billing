export const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  GRACE: 'bg-yellow-100 text-yellow-800',
  PAYMENT_PENDING: 'bg-orange-100 text-orange-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-700',
  ACCOUNT_CLOSED: 'bg-gray-300 text-gray-800',
  PAID: 'bg-blue-100 text-blue-800',
};

const STATUS_LABELS = {
  ACCOUNT_CLOSED: 'Account Closed',
  PAYMENT_PENDING: 'Payment Pending',
};

export function StatusBadge({ status }) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  const label = STATUS_LABELS[status] || status?.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

const IST = 'Asia/Kolkata';

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  // Append IST offset so the date is never shifted by UTC conversion
  return new Date(dateStr + 'T00:00:00+05:30').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    timeZone: IST,
  });
}

export function fmtMonth(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00+05:30').toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
    timeZone: IST,
  });
}

export function fmtDateTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: IST,
  });
}

export function fmtCurrency(val) {
  if (val == null) return '—';
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
