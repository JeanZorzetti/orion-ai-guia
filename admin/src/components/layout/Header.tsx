'use client';

import React from 'react';
import { User } from '@/types';
import { authService } from '@/services/auth';
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  user?: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-10 transition-colors">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-primary">Orion ERP</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle theme={theme} onThemeChange={setTheme} />

          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 hover:bg-muted px-3 py-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-foreground">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border py-1 z-20">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
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
