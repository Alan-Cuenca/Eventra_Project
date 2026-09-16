import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';
import { RoleSwitcher } from '../components/common/RoleSwitcher';
import { ChatbotWidget } from '../components/common/ChatbotWidget';

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
      <RoleSwitcher />
      <ChatbotWidget />
    </div>
  );
};
