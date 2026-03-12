import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-[#EEEEF9] text-[#6B6BCC]',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    confirmed: { variant: 'info', label: 'Confirmed' },
    in_progress: { variant: 'info', label: 'In Progress' },
    'in-progress': { variant: 'info', label: 'In Progress' },
    active: { variant: 'info', label: 'Active' },
    completed: { variant: 'success', label: 'Completed' },
    cancelled: { variant: 'error', label: 'Cancelled' },
    no_show: { variant: 'default', label: 'No Show' },
    'no-show': { variant: 'default', label: 'No Show' },
    preparing: { variant: 'warning', label: 'Preparing' },
    ready: { variant: 'success', label: 'Ready' },
    delivered: { variant: 'success', label: 'Delivered' },
    paid: { variant: 'success', label: 'Paid' },
    refunded: { variant: 'error', label: 'Refunded' },
    fulfilled: { variant: 'success', label: 'Fulfilled' },
    available: { variant: 'success', label: 'Available' },
    unavailable: { variant: 'error', label: 'Unavailable' },
  };

  const { variant, label } = statusMap[status] || { variant: 'default' as const, label: status };

  return <Badge variant={variant}>{label}</Badge>;
}
