import React from 'react';
import { HealthProtocol } from './types';

interface HealthProtocolsProps {
  protocols: HealthProtocol[];
}

const HealthProtocols: React.FC<HealthProtocolsProps> = ({ protocols }) => (
  protocols.length > 0 ? (
    <div className="px-2">
      <div className="font-bold text-lg mb-2">Protokol Kesehatan</div>
      <ul className="space-y-2">
        {protocols.map((protocol) => (
          <li key={protocol.url} className="flex items-center space-x-2">
            <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full">
              <span className="text-gray-600">→</span>
            </div>
            <a href={protocol.url} target="_blank" rel="noopener noreferrer" className="text-sm italic underline text-gray-800 truncate w-full">
              {protocol.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  ) : null
);

export default HealthProtocols; 