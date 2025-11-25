'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';

interface HeaderProps {
  location?: string;
  weather?: {
    temp: string;
    condition: string;
    icon: string;
  };
  notifications?: number;
  manager?: {
    name: string;
    initial: string;
  };
  time?: string;
}

const Header = ({
  location = '안양시',
  weather = { temp: '77°/65°', condition: 'Partly Cloudy', icon: 'weather-partly-cloudy' },
  notifications = 29,
  manager = { name: 'Site Manager', initial: 'S' },
  time = '15:20',
}: HeaderProps) => {
  return (
    <header className="flex h-16 items-center justify-between bg-[#161719] border-b border-[#31353a] px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-24 h-5 flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="CUVIA Logo" 
              className="h-5 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Link
          href="/agent-hub"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors font-medium"
          aria-label="Agent Hub"
        >
          <Icon icon="mdi:robot" className="w-5 h-5" />
          <span>Agent Hub</span>
        </Link>

        <div className="flex items-center gap-2 text-white">
          <span className="font-medium">{location}</span>
          <div className="flex items-center gap-1.5">
            <Icon icon={weather.icon} className="w-5 h-5 text-white" />
            <span className="text-sm">{weather.temp}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="relative p-2 text-white hover:bg-[#36383B] rounded-full transition-colors"
            aria-label="알림"
          >
            <Icon icon="mdi:bell-outline" className="w-6 h-6" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full" style={{ borderWidth: '1px' }}>
                {notifications}+
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {manager.initial}
            </div>
            <span className="text-white text-sm">{time}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

