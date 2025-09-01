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

        {/* Stats Cards */}
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

        {/* Charts */}
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

        {/* Projects and Tasks Lists */}
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

        {/* Project Stats */}
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

        {/* Project Charts */}
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

        {/* Team Members and Tasks */}
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

      {/* Show message if no data */}
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
        /* Department Cards */
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
                              
                              {/* Quick Stats */}
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
