import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/rolls', label: 'Film Rolls', icon: '🎞️' },
    { path: '/chemistry', label: 'Chemistry', icon: '🧪' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-2 sm:px-4">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                📷 Emulsion
              </h1>
              <span className="hidden sm:inline ml-3 text-sm text-gray-500">
                Film Roll Tracker
              </span>
            </div>
            
            {/* Navigation */}
            <nav className="flex space-x-1 sm:space-x-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors touch-friendly
                      ${isActive
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="text-lg sm:text-base">{item.icon}</span>
                    <span className="text-sm sm:text-base">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="px-2 sm:px-4 py-3 sm:py-4 max-w-[100vw] overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
