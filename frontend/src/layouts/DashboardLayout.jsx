import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';
import { EvaraChatWidget } from '../components/chat/EvaraChatWidget';
import { WatermarkOverlay } from '../components/common/WatermarkOverlay';
import { CommandPalette } from '../components/common/CommandPalette';

export const DashboardLayout = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Atajo de teclado global: ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container relative bg-[var(--ev-bg-base)] text-[var(--ev-text-main)] min-h-screen flex transition-colors duration-300">
      <WatermarkOverlay />
      <Sidebar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
      
      <div className="main-content flex-1 flex flex-col min-w-0 relative z-10">
        <Navbar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        <main className="page-body flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      <EvaraChatWidget />
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};
