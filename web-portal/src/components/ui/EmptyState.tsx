import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && <div className="mb-4 text-[#8A8A9A]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#8A8A9A] mb-4 text-center max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
