'use client';

import React from 'react';
import Header from './Header';
import Sidebar from './LegacySidebar';
import { User } from '@/types';

interface MainLayoutProps {
  children: React.ReactNode;
  user?: User | null;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, user }) => {
  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <Header user={user} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
