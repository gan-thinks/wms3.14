import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Building,
  BarChart3,
  User,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'Leaves', href: '/leaves', icon: Calendar },
    { name: 'Payroll', href: '/payroll', icon: DollarSign },
    { name: 'Departments', href: '/departments', icon: Building },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} md:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Workforce MS</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} className="mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
          >
            <LogOut size={16} className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome back, {user?.firstName}!
              </div>
              <Link
                to="/profile"
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
              >
                <User size={16} className="text-white" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 