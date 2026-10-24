'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  href?: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  badge?: string | number;
  badgeColor?: 'emerald' | 'amber' | 'red';
  collapsed?: boolean;
  onClick?: () => void;
  isPrimaryAction?: boolean;
}

export default function SidebarNavItem({
  href,
  icon: Icon,
  label,
  active,
  badge,
  badgeColor = 'emerald',
  collapsed = false,
  onClick,
  isPrimaryAction = false,
}: SidebarNavItemProps) {
  const badgeClasses = {
    emerald: 'bg-[#eaf4ee] text-[#137b65] border border-[#cbe1d3]',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
  }[badgeColor];

  const content = (
    <>
      <Icon
        size={18}
        className={`shrink-0 transition-transform ${
          isPrimaryAction
            ? 'text-[#137b65]'
            : active
            ? 'text-[#137b65]'
            : 'text-[#637971] group-hover:text-[#172b28]'
        }`}
      />
      {!collapsed && (
        <span className="truncate flex-1 text-left font-medium">{label}</span>
      )}
      {!collapsed && badge !== undefined && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badgeClasses}`}
        >
          {badge}
        </span>
      )}
    </>
  );

  const baseClasses = `group relative flex items-center gap-3 w-full rounded-xl transition text-xs select-none ${
    collapsed ? 'justify-center p-2.5' : 'px-3.5 py-2.5'
  } ${
    isPrimaryAction
      ? 'bg-[#eef7f2] border border-[#bfe0cd] text-[#0f604f] font-bold hover:bg-[#e2f1e8] shadow-2xs'
      : active
      ? 'bg-[#137b65] text-white font-semibold shadow-xs'
      : 'text-[#485d56] hover:bg-[#f0f5f2] hover:text-[#172b28]'
  }`;

  // Tooltip in collapsed mode
  const tooltip = collapsed && (
    <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#172b28] text-white text-[11px] rounded-lg shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition z-50">
      {label}
      {badge !== undefined && ` (${badge})`}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses} title={collapsed ? label : undefined}>
        {content}
        {tooltip}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={baseClasses}
      title={collapsed ? label : undefined}
    >
      {content}
      {tooltip}
    </button>
  );
}
