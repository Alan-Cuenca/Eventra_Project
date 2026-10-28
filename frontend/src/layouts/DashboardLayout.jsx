import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';
import { EvaraChatWidget } from '../components/chat/EvaraChatWidget';

export const DashboardLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body animate-fade-in">
          <Outlet />
        </main>
      </div>
      <EvaraChatWidget />
    </div>
  );
};
