import React from 'react';

interface HalalStatusBadgeProps {
  status: 'halal' | 'haram' | 'unknown';
}

export const HalalStatusBadge: React.FC<HalalStatusBadgeProps> = ({ status }) => {
  return <span>{status === 'halal' ? 'Халяль' : status === 'haram' ? 'Харам' : 'Неизвестно'}</span>;
};