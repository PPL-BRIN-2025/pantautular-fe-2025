// StatsItem.tsx
import React from 'react';

export interface StatsItemProps {
  type: 'kasus_kematian' | 'kasus_terjangkit' | 'kasus_sembuh';
  count: number;
  percentage: number;
}

const StatsItem: React.FC<StatsItemProps> = ({ type, count, percentage }) => {
  let bgColor = '';
  let textColor = '';
  let label = '';
  let icon = '';

  switch (type) {
    case 'kasus_kematian':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      label = 'Kasus Kematian';
      icon = '😵';
      break;
    case 'kasus_terjangkit':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      label = 'Kasus Terjangkit';
      icon = '😷';
      break;
    case 'kasus_sembuh':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      label = 'Kasus Sembuh';
      icon = '😊';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      label = 'Unknown';
      icon = '❓';
      break;
  }

  return (
    <div
      data-testid={`stats-item-${type}`}
      className={`flex justify-between items-center ${bgColor} ${textColor} p-3 rounded-md`}
    >
      <div className="flex items-center">
        <span className="mr-2">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold text-sm">
        {count.toLocaleString()} ({percentage}%)
      </span>
    </div>
  );
};

export default StatsItem;