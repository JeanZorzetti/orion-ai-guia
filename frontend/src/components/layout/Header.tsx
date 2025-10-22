'use client';

import React from 'react';
import { User } from '@/types';
import { authService } from '@/services/auth';

interface HeaderProps {
  user?: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <header className="bg-white border-b border-[var(--border)] sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-[var(--primary)]">Orion ERP</h1>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 hover:bg-[var(--muted)] px-3 py-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-medium">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--border)] py-1 z-20">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-[var(--danger)] hover:bg-[var(--muted)] transition-colors"
                    >
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
