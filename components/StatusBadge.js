'use client';

const STYLES = {
  draft: 'border-ink-soft/40 text-ink-soft',
  sent: 'border-teal text-teal',
  accepted: 'border-teal text-teal',
  paid: 'border-teal text-teal',
  rejected: 'border-rust text-rust',
  overdue: 'border-rust text-rust',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.draft;
  return (
    <span
      className={`stamp inline-block text-[10px] font-semibold px-2 py-1 border rounded ${style}`}
    >
      {status}
    </span>
  );
}
