import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { data: dashboardData, isLoading } = useQuery('dashboard', async () => {
    const response = await axios.get('/reports/dashboard');
    return response.data;
  });

  const { data: attendanceStats } = useQuery('attendanceStats', async () => {
    const response = await axios.get('/attendance/stats/overview');
    return response.data;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Employees',
      value: dashboardData?.employees?.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'Present Today',
      value: dashboardData?.attendance?.present || 0,
      icon: Clock,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'increase',
    },
    {
      name: 'Pending Leaves',
      value: dashboardData?.leaves?.pending || 0,
      icon: Calendar,
      color: 'bg-yellow-500',
      change: '-2%',
      changeType: 'decrease',
    },
    {
      name: 'Total Salary',
      value: `$${(dashboardData?.payroll?.totalSalary || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+8%',
      changeType: 'increase',
    },
  ];

  const departmentData = dashboardData?.departments?.map(dept => ({
    name: dept.name,
    employees: dept.count,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your workforce management dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="dashboard-card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.changeType === 'increase' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-gray-500">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Department Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="employees" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Overview */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Attendance Overview
          </h3>
          {attendanceStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {attendanceStats.today?.present || 0}
                  </div>
                  <div className="text-sm text-gray-500">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {attendanceStats.today?.absent || 0}
                  </div>
                  <div className="text-sm text-gray-500">Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {attendanceStats.today?.late || 0}
                  </div>
                  <div className="text-sm text-gray-500">Late</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  Attendance Rate: {dashboardData?.attendance?.rate || 0}%
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No attendance data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">New employee registered</span>
            </div>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Leave request approved</span>
            </div>
            <span className="text-xs text-gray-500">4 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Payroll generated for March</span>
            </div>
            <span className="text-xs text-gray-500">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 