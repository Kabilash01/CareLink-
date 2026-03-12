import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-[#6B6BCC]',
  iconBg = 'bg-[#EEEEF9]',
}: StatsCardProps) {
  const changeColors = {
    positive: 'text-[#2E9E6B]',
    negative: 'text-[#D94F4F]',
    neutral: 'text-[#8A8A9A]',
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#8A8A9A] font-medium">{title}</p>
          <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1 ${changeColors[changeType]}`}>{change}</p>
          )}
        </div>
        <div className={`${iconBg} p-3 rounded-xl`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
