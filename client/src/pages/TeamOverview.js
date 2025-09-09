/*
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { 
  Users, 
  Eye, 
  CheckCircle, 
  Clock, 
  X, 
  Calendar,
  User,
  FolderOpen,
  MessageSquare,
  Upload,
  Plus
} from 'lucide-react';

const CHART_COLORS = {
  completed: "#22c55e",
  inProgress: "#facc15", 
  notStarted: "#ef4444",
  onHold: "#8b5cf6",
  primary: "#3b82f6",
  secondary: "#64748b"
};

const STATUS_COLORS = {
  'Completed': 'bg-green-100 text-green-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Not Started': 'bg-gray-100 text-gray-800',
  'On Hold': 'bg-purple-100 text-purple-800'
};

const PRIORITY_COLORS = {
  'Critical': 'bg-red-100 text-red-800',
  'High': 'bg-orange-100 text-orange-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'Low': 'bg-green-100 text-green-800'
};

const TeamOverview = () => {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No auth token found');
        setLoading(false);
        return;
      }

      console.log('Fetching team data...');
      
      const [employeesRes, projectsRes] = await Promise.all([
        fetch('http://localhost:5000/api/employees', {  // ✅ Fixed port from 3000 to 5000
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/projects', {   // ✅ Fixed port from 3000 to 5000
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      console.log('Response status:', employeesRes.status, projectsRes.status);

      if (!employeesRes.ok || !projectsRes.ok) {
        throw new Error(`HTTP error! Employees: ${employeesRes.status}, Projects: ${projectsRes.status}`);
      }

      const employeesData = await employeesRes.json();
      const projectsData = await projectsRes.json();

      console.log('Employees data:', employeesData);
      console.log('Projects data:', projectsData);

      setEmployees(employeesData || []);
      setProjects(projectsData.projects || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load team data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Group employees by department
  const employeesByDepartment = useMemo(() => {
    const grouped = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(emp);
    });
    return grouped;
  }, [employees]);

  // Get employee's projects and tasks
  const getEmployeeProjects = (employeeId) => {
    return projects.filter(project => 
      project.members?.some(member => member._id === employeeId) ||
      project.createdBy?._id === employeeId ||
      project.projectManager?._id === employeeId
    );
  };

  const getEmployeeTasks = (employeeId) => {
    const employeeProjects = getEmployeeProjects(employeeId);
    const tasks = [];
    
    employeeProjects.forEach(project => {
      project.tasks?.forEach(task => {
        if (task.assignedTo?._id === employeeId || task.assignedTo === employeeId) {
          tasks.push({
            ...task,
            projectName: project.name,
            projectId: project._id
          });
        }
      });
    });
    
    return tasks;
  };

  // Generate chart data for employee
  const getEmployeeChartData = (employeeId) => {
    const tasks = getEmployeeTasks(employeeId);
    const projects = getEmployeeProjects(employeeId);
    
    // Task status distribution
    const taskStatusData = [
      { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length },
      { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
      { name: 'Not Started', value: tasks.filter(t => t.status === 'Not Started').length },
      { name: 'On Hold', value: tasks.filter(t => t.status === 'On Hold').length }
    ].filter(item => item.value > 0);

    // Task priority distribution
    const priorityData = [
      { name: 'Critical', value: tasks.filter(t => t.priority === 'Critical').length },
      { name: 'High', value: tasks.filter(t => t.priority === 'High').length },
      { name: 'Medium', value: tasks.filter(t => t.priority === 'Medium').length },
      { name: 'Low', value: tasks.filter(t => t.priority === 'Low').length }
    ].filter(item => item.value > 0);

    // Project involvement
    const projectData = projects.map(project => ({
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      progress: project.overallProgress || 0,
      tasks: project.tasks?.filter(t => t.assignedTo?._id === employeeId || t.assignedTo === employeeId).length || 0
    }));

    return { taskStatusData, priorityData, projectData, totalTasks: tasks.length, totalProjects: projects.length };
  };

  // Generate project chart data
  const getProjectChartData = (project) => {
    const tasks = project.tasks || [];
    
    const statusData = [
      { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length },
      { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
      { name: 'Not Started', value: tasks.filter(t => t.status === 'Not Started').length },
      { name: 'On Hold', value: tasks.filter(t => t.status === 'On Hold').length }
    ].filter(item => item.value > 0);

    const memberProgress = project.members?.map(member => {
      const memberTasks = tasks.filter(t => t.assignedTo?._id === member._id);
      const completedTasks = memberTasks.filter(t => t.status === 'Completed').length;
      
      return {
        name: `${member.firstName} ${member.lastName}`,
        tasks: memberTasks.length,
        completed: completedTasks,
        progress: memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0
      };
    }) || [];

    return { statusData, memberProgress, totalTasks: tasks.length };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading team data...</p>
      </div>
    );
  }

  // Employee Detail View
  if (selectedEmployee) {
    const employee = employees.find(emp => emp._id === selectedEmployee);
    if (!employee) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Employee not found</p>
          <Button variant="outline" onClick={() => setSelectedEmployee(null)} className="ml-4">
            Back to Team
          </Button>
        </div>
      );
    }

    const chartData = getEmployeeChartData(selectedEmployee);
    const employeeTasks = getEmployeeTasks(selectedEmployee);
    const employeeProjects = getEmployeeProjects(selectedEmployee);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.profilePicture} />
              <AvatarFallback className="text-lg">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h2>
              <p className="text-gray-600">{employee.role} • {employee.department}</p>
              <p className="text-sm text-gray-500">{employee.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
            Back to Team
          </Button>
        </div>

        // Stats Cards 
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{chartData.totalProjects}</p>
                  <p className="text-sm text-gray-600">Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{chartData.totalTasks}</p>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {employeeTasks.filter(t => t.status === 'Completed').length}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {employeeTasks.filter(t => t.status === 'In Progress').length}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        // Charts 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.taskStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.projectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progress" fill={CHART_COLORS.secondary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        // Projects and Tasks Lists 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Projects</CardTitle>
              <Badge>{employeeProjects.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeeProjects.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No projects assigned</p>
                ) : (
                  employeeProjects.map(project => (
                    <div key={project._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{project.name}</h4>
                          <p className="text-sm text-gray-500">
                            Progress: {project.overallProgress || 0}%
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedProject(project)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Tasks</CardTitle>
              <Badge>{employeeTasks.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeeTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tasks assigned</p>
                ) : (
                  employeeTasks.slice(0, 5).map(task => (
                    <div key={task._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-gray-500">{task.projectName}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge className={STATUS_COLORS[task.status]}>
                              {task.status}
                            </Badge>
                            <Badge className={PRIORITY_COLORS[task.priority]}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Project Detail View
  if (selectedProject) {
    const chartData = getProjectChartData(selectedProject);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
            <p className="text-gray-600">{selectedProject.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge className={STATUS_COLORS[selectedProject.status]}>
                {selectedProject.status}
              </Badge>
              <Badge className={PRIORITY_COLORS[selectedProject.priority]}>
                {selectedProject.priority}
              </Badge>
            </div>
          </div>
          <Button variant="outline" onClick={() => setSelectedProject(null)}>
            Back
          </Button>
        </div>

        // Project Stats 
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{selectedProject.members?.length || 0}</p>
                  <p className="text-sm text-gray-600">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{chartData.totalTasks}</p>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{selectedProject.overallProgress || 0}%</p>
                  <p className="text-sm text-gray-600">Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {selectedProject.expectedEndDate ? 
                      new Date(selectedProject.expectedEndDate).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Due Date</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        // Project Charts 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Member Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.memberProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progress" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        // Team Members and Tasks 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedProject.members?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No team members assigned</p>
                ) : (
                  selectedProject.members?.map(member => (
                    <div key={member._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.firstName} {member.lastName}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedEmployee(member._id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedProject.tasks?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tasks in this project</p>
                ) : (
                  selectedProject.tasks?.slice(0, 5).map(task => (
                    <div key={task._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-gray-500">
                            Assigned to: {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge className={STATUS_COLORS[task.status]}>
                              {task.status}
                            </Badge>
                            <Badge className={PRIORITY_COLORS[task.priority]}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Team Overview
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Overview</h2>
          <p className="text-gray-600">View team members by department and their projects</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="border rounded px-3 py-2"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {Object.keys(employeesByDepartment).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      // Show message if no data 
      {employees.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Team Data Available</h3>
            <p className="text-gray-500">
              Unable to load team members. Please ensure:
            </p>
            <ul className="text-sm text-gray-500 mt-2 text-left max-w-md mx-auto">
              <li>• Your backend server is running on port 5000</li>
              <li>• You're logged in with valid credentials</li>
              <li>• Employee data exists in the database</li>
            </ul>
            <Button onClick={fetchData} className="mt-4">
              Retry Loading
            </Button>
          </CardContent>
        </Card>
      ) : (
    // Department Cards 
        <div className="space-y-6">
          {Object.entries(employeesByDepartment)
            .filter(([dept]) => departmentFilter === 'all' || dept === departmentFilter)
            .map(([department, deptEmployees]) => (
              <Card key={department}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {department}
                    </CardTitle>
                    <Badge variant="outline">
                      {deptEmployees.length} Members
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {deptEmployees.map(employee => {
                      const employeeProjects = getEmployeeProjects(employee._id);
                      const employeeTasks = getEmployeeTasks(employee._id);
                      const completedTasks = employeeTasks.filter(t => t.status === 'Completed').length;
                      
                      return (
                        <Card key={employee._id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex flex-col items-center text-center gap-3">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={employee.profilePicture} />
                                <AvatarFallback className="text-lg">
                                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {employee.firstName} {employee.lastName}
                                </h3>
                                <p className="text-sm text-gray-500">{employee.role}</p>
                                <p className="text-xs text-gray-400">{employee.email}</p>
                              </div>
                              
                              // Quick Stats 
                              <div className="flex gap-4 text-xs">
                                <div className="text-center">
                                  <p className="font-bold text-blue-600">{employeeProjects.length}</p>
                                  <p className="text-gray-500">Projects</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-bold text-green-600">{completedTasks}</p>
                                  <p className="text-gray-500">Tasks Done</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-bold text-orange-600">{employeeTasks.length - completedTasks}</p>
                                  <p className="text-gray-500">Pending</p>
                                </div>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => setSelectedEmployee(employee._id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default TeamOverview;
*/

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, MessageSquare, Users, Calendar, 
  Clock, Target, CheckCircle, User, FileText, BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from "recharts";

// Import your modals
import TaskModal from '../components/TaskModal';
import TaskUpdateModal from '../components/TaskUpdateModal';

const CHART_COLORS = {
  completed: "#22c55e",
  inProgress: "#facc15", 
  notStarted: "#ef4444",
  onHold: "#8b5cf6",
  primary: "#3b82f6",
  secondary: "#64748b"
};

const STATUS_COLORS = {
  'Completed': 'bg-green-100 text-green-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Not Started': 'bg-gray-100 text-gray-800',
  'On Hold': 'bg-purple-100 text-purple-800'
};

const PRIORITY_COLORS = {
  'Critical': 'bg-red-100 text-red-800 border-red-200',
  'High': 'bg-orange-100 text-orange-800 border-orange-200',
  'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Low': 'bg-green-100 text-green-800 border-green-200'
};

const TeamOverview = () => {
  const navigate = useNavigate();
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    myTasks: [],
    projectsInvolved: []
  });

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
    fetchAllProjects();
  }, []);

  useEffect(() => {
    if (allProjects.length > 0 && user) {
      calculateUserStats();
    }
  }, [allProjects, user]);

  const fetchAllProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      console.log('✅ All projects fetched:', data.length);
      setAllProjects(data || []);
    } catch (err) {
      console.error('❌ Error fetching projects:', err);
      setAllProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = () => {
    if (!user || !allProjects.length) return;

    const userId = String(user._id || user.id);
    console.log('🔍 Calculating stats for user:', user.firstName, user.lastName, 'ID:', userId);

    // Find projects where user is involved (created by them or member)
    const projectsInvolved = allProjects.filter(project => {
      const isCreator = String(project.createdBy?._id) === userId;
      const isMember = project.members?.some(member => String(member._id) === userId);
      return isCreator || isMember;
    });

    console.log('📊 Projects involved:', projectsInvolved.length);

    // Collect all tasks assigned to this user across all projects
    let myTasks = [];
    projectsInvolved.forEach(project => {
      if (project.tasks && Array.isArray(project.tasks)) {
        const userTasks = project.tasks.filter(task => {
          if (!task.assignedTo) return false;
          return String(task.assignedTo._id) === userId;
        }).map(task => ({
          ...task,
          projectId: project._id,
          projectName: project.name
        }));
        myTasks = myTasks.concat(userTasks);
      }
    });

    console.log('📋 My tasks found:', myTasks.length);

    const completedTasks = myTasks.filter(task => task.status === 'Completed').length;
    const inProgressTasks = myTasks.filter(task => task.status === 'In Progress').length;

    const stats = {
      totalProjects: projectsInvolved.length,
      totalTasks: myTasks.length,
      completedTasks,
      inProgressTasks,
      myTasks,
      projectsInvolved
    };

    console.log('📊 Final stats:', stats);
    setUserStats(stats);
  };

  const getTaskStatusData = () => {
    if (!userStats.myTasks.length) return [];
    
    const statusCount = userStats.myTasks.reduce((acc, task) => {
      const status = task.status || 'Not Started';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count,
      color: CHART_COLORS[status.toLowerCase().replace(' ', '')] || CHART_COLORS.primary
    }));
  };

  const getTaskPriorityData = () => {
    if (!userStats.myTasks.length) return [];
    
    const priorityCount = userStats.myTasks.reduce((acc, task) => {
      const priority = task.priority || 'Medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(priorityCount).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  };

  const getProjectProgressData = () => {
    if (!userStats.projectsInvolved.length) return [];
    
    return userStats.projectsInvolved.map(project => ({
      name: project.name.substring(0, 10) + (project.name.length > 10 ? '...' : ''),
      progress: project.progress || 0
    }));
  };

  // Task management functions
  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdate = (task) => {
    setSelectedTask(task);
    setShowUpdateModal(true);
  };

  const handleTaskDelete = async (task) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${task.projectId}/tasks/${task._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAllProjects(); // Refresh data
        alert('Task deleted successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      alert(`Failed to delete task: ${err.message}`);
    }
  };

  const canEditTask = (task) => {
    if (!user) return false;
    const userId = String(user._id || user.id);
    return String(task.assignedTo?._id) === userId || user.role === 'admin' || user.role === 'Admin';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading team overview...</p>
      </div>
    );
  }

  const taskStatusData = getTaskStatusData();
  const taskPriorityData = getTaskPriorityData();
  const projectProgressData = getProjectProgressData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Overview</h1>
            <p className="text-gray-600">Your personal dashboard and task summary</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback>
                  {(user.firstName?.[0] || '').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
                <p className="text-gray-600">{user.role} • {user.employeeId || '123456'}</p>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userStats.totalProjects}</p>
                <p className="text-sm text-gray-600">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userStats.totalTasks}</p>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userStats.completedTasks}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userStats.inProgressTasks}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No task data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Task Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {taskPriorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={taskPriorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No priority data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {projectProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={projectProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progress" fill={CHART_COLORS.secondary} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No project data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>My Tasks ({userStats.myTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {userStats.myTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No tasks assigned</h3>
              <p className="text-gray-500">You don't have any tasks assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userStats.myTasks.map(task => (
                <div key={task._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <Badge className={STATUS_COLORS[task.status] || STATUS_COLORS['Not Started']}>
                          {task.status || 'Not Started'}
                        </Badge>
                        <Badge className={PRIORITY_COLORS[task.priority] || PRIORITY_COLORS['Medium']}>
                          {task.priority || 'Medium'}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Project: {task.projectName}</span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{task.estimatedHours || 0}h estimated</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{task.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {canEditTask(task) && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTaskUpdate(task)}
                            title="Update Progress"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTaskEdit(task)}
                            title="Edit Task"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {(user?.role === 'admin' || user?.role === 'Admin') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTaskDelete(task)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showTaskModal && editingTask && (
        <TaskModal
          project={userStats.projectsInvolved.find(p => p._id === editingTask.projectId)}
          task={editingTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            fetchAllProjects();
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}

      {showUpdateModal && selectedTask && (
        <TaskUpdateModal
          task={selectedTask}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedTask(null);
          }}
          onSuccess={() => {
            fetchAllProjects();
            setShowUpdateModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default TeamOverview;
