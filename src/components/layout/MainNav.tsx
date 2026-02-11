'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/room', label: '특별실 시간표' },
  { href: '/class', label: '학급별 시간표' },
  { href: '/teacher', label: '교담 시간표' },
  { href: '/admin', label: '관리/예약 현황' },
];

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-center gap-3 p-3 bg-white sticky top-[80px] sm:top-[80px] z-30 shadow-sm overflow-x-auto border-b no-print">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/room' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'nav-btn px-6 py-2 rounded-xl font-bold text-lg transition-all',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
