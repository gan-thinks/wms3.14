import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import {
  Users,
  ClipboardList,
  Briefcase,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const { data: dashboardData, isLoading } = useQuery('dashboard', async () => {
    const response = await axios.get('/api/dashboard');
    return response.data;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f93822]"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Employees',
      value: dashboardData?.employees || 0,
      icon: Users,
      color: 'bg-[#f93822]',
    },
    {
      name: 'Active Projects',
      value: dashboardData?.projects || 0,
      icon: Briefcase,
      color: 'bg-[#ff9f70]',
    },
    {
      name: 'Tasks Completed',
      value: dashboardData?.tasksCompleted || 0,
      icon: CheckCircle,
      color: 'bg-[#38b000]',
    },
    {
      name: 'Leave Requests',
      value: dashboardData?.leaves || 0,
      icon: ClipboardList,
      color: 'bg-[#facc15]',
    },
  ];

  const projectData = dashboardData?.projectStatus || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1f2937]">Dashboard</h1>
        <p className="text-gray-500">Overview of your company's activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-[#ffe4c1] rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-[#6b7280]">{stat.name}</p>
                  <p className="text-2xl font-bold text-[#1f2937]">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completion" fill="#f93822" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Today’s Attendance</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-[#38b000]">{dashboardData?.attendance?.present || 0}</p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#f93822]">{dashboardData?.attendance?.absent || 0}</p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#facc15]">{dashboardData?.attendance?.late || 0}</p>
              <p className="text-sm text-gray-500">Late</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Recent Activity</h3>
        <ul className="space-y-3 text-sm text-gray-600">
          <li>🟢 New branding project started for Client A (2 hours ago)</li>
          <li>🟠 Website launched for Client B (Today)</li>
          <li>🔵 Team meeting scheduled for tomorrow</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
