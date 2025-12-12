import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';

export default function Layout({ children }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navItems = [
    { path: '/rolls', label: 'Film Rolls', icon: 'film' },
    { path: '/chemistry', label: 'Chemistry', icon: 'chemistry' },
    { path: '/stats', label: 'Statistics', icon: 'chart' },
  ];

  const closeMenu = () => setIsMenuOpen(false);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Icon name="camera" size={24} className="text-gray-900 dark:text-gray-100" /> Emulsion
              </h1>
              <span className="hidden sm:inline ml-3 text-sm text-gray-500 dark:text-gray-400">
                Film Roll Tracker
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                      ${isActive
                        ? 'text-blue-700 dark:text-blue-300 font-medium bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle menu"
            >
              <Icon name={isMenuOpen ? 'close' : 'menu'} size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 absolute w-full left-0 shadow-lg">
            <nav className="flex flex-col p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive
                        ? 'text-blue-700 dark:text-blue-300 font-medium bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon name={item.icon} size={20} />
                    <span className="text-base">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="px-2 sm:px-4 py-3 sm:py-4 max-w-[100vw] overflow-x-hidden">
        {children}
      </main>
      
      {/* Backdrop for mobile menu */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 top-14 bg-black/50 z-30"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
