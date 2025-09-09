
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
