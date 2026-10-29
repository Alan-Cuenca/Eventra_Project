import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';
import { EvaraChatWidget } from '../components/chat/EvaraChatWidget';
import { WatermarkOverlay } from '../components/common/WatermarkOverlay';

export const DashboardLayout = () => {
  return (
    <div className="app-container relative">
      <WatermarkOverlay />
      <Sidebar />
      <div className="main-content relative z-10">
        <Navbar />
        <main className="page-body animate-fade-in">
          <Outlet />
        </main>
      </div>
      <EvaraChatWidget />
    </div>
  );
};
