"use client";

import React, { useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const Layout = ({ children, userRole = 'Chef', userEmail, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const displayName = userEmail ? userEmail.split('@')[0] : 'User';
  const avatarLetter = (displayName?.trim()?.[0] || userRole?.trim()?.[0] || 'U').toUpperCase();

  const navigation = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['Manager', 'Chef'] },
    { name: 'Recipes', icon: <UtensilsCrossed size={20} />, roles: ['Manager', 'Chef', 'Cook'] },
    { name: 'Inventory', icon: <ClipboardList size={20} />, roles: ['Manager', 'Chef'] },
    { name: 'Settings', icon: <Settings size={20} />, roles: ['Manager'] },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      
      {/* --- Mobile Header --- */}
      <div className="lg:hidden fixed top-0 w-full bg-zinc-900 border-b border-zinc-800 z-50 px-4 py-3 flex justify-between items-center">
        <h1 className="font-black text-orange-500 tracking-tighter text-xl">RECIPE.PRO</h1>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* --- Sidebar Desktop & Mobile Overlay --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col justify-between p-6">
          <div>
            {/* Brand Logo */}
            <div className="hidden lg:block mb-10">
              <h1 className="font-black text-orange-500 tracking-tighter text-2xl">RECIPE.PRO</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Kitchen Management v1.0</p>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              {navigation.filter(item => item.roles.includes(userRole)).map((item) => (
                <a
                  key={item.name}
                  href="#"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all group"
                >
                  <span className="group-hover:text-orange-500">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* User Profile & Role Section */}
          <div className="border-t border-zinc-800 pt-6">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold">
                {avatarLetter}
              </div>
              <div>
                <p className="text-sm font-bold leading-none">{displayName}</p>
                <p className="text-xs text-zinc-500 mt-1">{userRole}</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                onLogout?.();
              }}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-950/30 transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 lg:h-screen lg:overflow-y-auto pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Overlay Background */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 lg:hidden z-30" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
