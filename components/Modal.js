'use client';

export default function Modal({
  open,
  title,
  description,
  children,
  actions,
  onClose,
  size = 'md',
}) {
  if (!open) return null;

  const widthClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
      />
      <div className={`relative z-10 w-full ${widthClass} rounded-xl border border-line bg-white shadow-2xl`}>
        <div className="border-b border-line px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
        </div>
        <div className="px-6 py-5">{children}</div>
        {actions && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{actions}</div>}
      </div>
    </div>
  );
}
