'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  customTitle?: string;
}

export default function Breadcrumbs({ customTitle }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const formatSegment = (seg: string) => {
    return seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-[#627770]">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-[#137b65] transition"
        title="Home"
      >
        <Home size={14} />
      </Link>

      {segments.map((seg, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const displayName = isLast && customTitle ? customTitle : formatSegment(seg);

        return (
          <React.Fragment key={href}>
            <ChevronRight size={13} className="mx-1.5 text-[#a3b6ae] shrink-0" />
            {isLast ? (
              <span className="font-semibold text-[#172b28] truncate max-w-[180px] sm:max-w-xs">
                {displayName}
              </span>
            ) : (
              <Link href={href} className="hover:text-[#137b65] transition truncate max-w-[120px]">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
