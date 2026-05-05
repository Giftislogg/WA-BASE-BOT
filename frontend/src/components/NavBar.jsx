import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Flag, Layers } from 'lucide-react';

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/stickers', icon: Layers, label: 'Stickers' },
    { path: '/flagged', icon: Flag, label: 'Flagged' },
  ];

  return (
    <nav className="nav-bar">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
                active ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
