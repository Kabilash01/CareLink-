'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  Package,
  ShoppingCart,
  LogOut,
  Stethoscope,
  Pill,
  X,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface SidebarProps {
  role: UserRole;
  userName: string;
  onSignOut: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const doctorNav = [
  { label: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
  { label: 'Patients', href: '/doctor/patients', icon: Users },
  { label: 'Prescriptions', href: '/doctor/prescriptions', icon: FileText },
  { label: 'Consultations', href: '/doctor/consultations', icon: Stethoscope },
  { label: 'Settings', href: '/doctor/settings', icon: Settings },
];

const pharmacyNav = [
  { label: 'Dashboard', href: '/pharmacy/dashboard', icon: LayoutDashboard },
  { label: 'Inventory', href: '/pharmacy/inventory', icon: Package },
  { label: 'Orders', href: '/pharmacy/orders', icon: ShoppingCart },
  { label: 'Prescriptions', href: '/pharmacy/prescriptions', icon: FileText },
  { label: 'Settings', href: '/pharmacy/settings', icon: Settings },
];

export default function Sidebar({ role, userName, onSignOut, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === 'doctor' ? doctorNav : pharmacyNav;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-[#DDDDE8] z-50
          flex flex-col transition-transform duration-200 ease-in-out
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDDDE8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F2B866] to-[#C97D3A] flex items-center justify-center">
              {role === 'doctor' ? (
                <Stethoscope className="w-5 h-5 text-white" />
              ) : (
                <Pill className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1A1A1A]">CareLink</h1>
              <p className="text-xs text-[#8A8A9A] capitalize">{role} Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-[#F7F7FC] rounded">
            <X className="w-5 h-5 text-[#8A8A9A]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-[#EEEEF9] text-[#6B6BCC]'
                    : 'text-[#4A4A4A] hover:bg-[#F7F7FC] hover:text-[#1A1A1A]'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info & sign out */}
        <div className="px-4 py-4 border-t border-[#DDDDE8]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#EEEEF9] flex items-center justify-center text-sm font-semibold text-[#6B6BCC]">
              {userName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">{userName}</p>
              <p className="text-xs text-[#8A8A9A] capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
