'use client';

import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#DDDDE8]">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-[#F7F7FC] rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-[#4A4A4A]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">{title}</h1>
            {subtitle && <p className="text-sm text-[#8A8A9A]">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-[#F0EFF8] rounded-xl px-4 py-2">
            <Search className="w-4 h-4 text-[#8A8A9A]" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm text-[#1A1A1A] outline-none w-48 placeholder:text-[#8A8A9A]"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-[#F7F7FC] rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-[#4A4A4A]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D94F4F] rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
