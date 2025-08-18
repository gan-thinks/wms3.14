import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Users,
  Calendar,
  FolderKanban,
  User,
  LogOut,
  Moon,
  Sun,
  File,
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState('light');

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Create Project', href: '/createproject', icon: File},
    { name: 'Calendar', href: '/Calendar', icon: Calendar },
  ];

  // Persist theme in local storage
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    document.documentElement.classList.toggle('dark', saved === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = () => logout();

  return (
    <div className="flex h-screen transition-colors duration-300 bg-[#fff6ed] dark:bg-gray-900 dark:text-white">
      {/* Sidebar */}
      <div className="fixed z-30 h-full flex flex-col bg-[#FF3C00] dark:bg-gray-800 text-white group transition-all duration-300 w-16 hover:w-64">
        {/* Logo & Theme Toggle */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-red-300 dark:border-gray-700">
          <h1 className="font-bold text-lg hidden group-hover:block">Workforce MS</h1>
          <button onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map(({ name, href, icon: Icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={name}
                to={href}
                className={`flex items-center p-2 rounded-md text-sm font-medium transition-all
                ${isActive ? 'bg-white text-[#FF3C00]' : 'text-white hover:bg-red-600 dark:hover:bg-gray-700'}
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="hidden group-hover:inline">{name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-red-300 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white text-[#FF3C00] dark:text-gray-900 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="ml-2 hidden group-hover:block">
              <p className="text-sm font-medium">{user?.firstName}</p>
              <p className="text-xs">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center text-sm text-white hover:text-gray-200"
          >
            <LogOut size={16} className="mr-2" />
            <span className="hidden group-hover:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-16 md:ml-16 group-hover:ml-64 transition-all duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-white">Welcome back, {user?.firstName}!</div>
          <Link
            to="/profile"
            className="w-8 h-8 bg-[#FF3C00] rounded-full flex items-center justify-center text-white"
          >
            <User size={16} />
          </Link>
        </header>

        {/* Content */}
        <main className="p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
