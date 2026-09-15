'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/quotations', label: 'Quotations' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/receipts', label: 'Receipts' },
  { href: '/clients', label: 'Clients' },
  { href: '/company-registration', label: 'Company' },
  { href: '/settings', label: 'Settings' },
  { href: '/my-details', label: 'My details' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);

  useEffect(() => {
    if (pathname === '/login') return;

    fetch('/api/auth/me')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setIsSystemAdmin(data?.user?.role === 'systemadmin'))
      .catch(() => setIsSystemAdmin(false));
  }, [pathname]);

  if (pathname === '/login') {
    return null;
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-paper sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-sm bg-ink flex items-center justify-center">
            <span className="text-paper font-display font-bold text-sm">Q</span>
          </span>
          <span className="font-display font-semibold text-ink text-lg tracking-tight">
            Q-Qoute
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-ink text-paper'
                    : 'text-ink-soft text-ink/70 hover:bg-teal-soft hover:text-teal'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {isSystemAdmin && (
            <Link
              href="/users"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith('/users')
                  ? 'bg-ink text-paper'
                  : 'text-ink/70 hover:bg-teal-soft hover:text-teal'
              }`}
            >
              Users
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-md text-sm font-medium text-ink/70 hover:bg-teal-soft hover:text-teal"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
