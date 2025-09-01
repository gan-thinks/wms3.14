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
  BarChart3,
  UserCheck,
  ClockIcon,
  DollarSign,
  Building2,
  FileText,
  Settings,
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState('light');

  // ✅ Simplified navigation - no submenus, direct links only
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Team Overview', href: '/teamoverview', icon: Users }, // ✅ Direct link to Team Overview
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Create Project', href: '/createproject', icon: File },
    { name: 'Attendance', href: '/attendance', icon: UserCheck },
    { name: 'Leave Requests', href: '/leaves', icon: Calendar },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Payroll', href: '/payroll', icon: DollarSign },
    { name: 'Departments', href: '/departments', icon: Building2 },
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
      <div className="fixed z-30 h-full flex flex-col bg-[#FF3C00] dark:bg-gray-800 text-white group transition-all duration-300 w-16 hover:w-72">
        {/* Logo & Theme Toggle */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-red-300 dark:border-gray-700">
          <h1 className="font-bold text-lg hidden group-hover:block whitespace-nowrap">
            Workforce MS
          </h1>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-red-600 dark:hover:bg-gray-700 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        {/* ✅ Simplified Navigation - No submenus */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center p-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#FF3C00]'
                    : 'text-white hover:bg-red-600 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="hidden group-hover:inline whitespace-nowrap">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-red-300 dark:border-gray-700 p-4">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-white text-[#FF3C00] dark:text-gray-900 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="ml-3 hidden group-hover:block">
              <p className="text-sm font-medium whitespace-nowrap">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-red-200 capitalize">
                {user?.role || 'Employee'}
              </p>
            </div>
          </div>
          
          <div className="space-y-1">
            <Link
              to="/profile"
              className="flex items-center text-sm text-white hover:text-red-200 transition-colors p-1"
            >
              <Settings size={16} className="mr-2" />
              <span className="hidden group-hover:inline whitespace-nowrap">Profile Settings</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="flex items-center text-sm text-white hover:text-red-200 transition-colors p-1 w-full text-left"
            >
              <LogOut size={16} className="mr-2" />
              <span className="hidden group-hover:inline whitespace-nowrap">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-16 transition-all duration-300 group-hover:ml-72">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Welcome back, {user?.firstName}!
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            
            <Link
              to="/profile"
              className="w-8 h-8 bg-[#FF3C00] rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              title="Profile"
            >
              <User size={16} />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 overflow-auto h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
