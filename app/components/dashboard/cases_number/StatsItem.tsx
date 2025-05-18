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
  let iconPath = '';

  switch (type) {
    case 'kasus_kematian':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      label = 'Kasus Kematian';
      iconPath = '/dashboard/DeathCases.svg';
      break;
    case 'kasus_terjangkit':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      label = 'Kasus Terjangkit';
      iconPath = '/dashboard/InfectedCases.svg';
      break;
    case 'kasus_sembuh':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      label = 'Kasus Sembuh';
      iconPath = '/dashboard/CuredCases.svg';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      label = 'Unknown';
      iconPath = '';
      break;
  }

  return (
    <div
      data-testid={`stats-item-${type}`}
      className={`flex justify-between items-center ${bgColor} ${textColor} p-3 rounded-md`}
    >
      <div className="flex items-center">
        {iconPath && (
          <img src={iconPath} alt={label} className="mr-2 w-5 h-5" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold text-sm">
        {count.toLocaleString()} ({percentage}%)
      </span>
    </div>
  );
};

export default StatsItem;