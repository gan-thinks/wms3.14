
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Upload, Download, MessageSquare,
  Users, Calendar, Clock, Target, AlertTriangle, CheckCircle,
  User, FileText, BarChart3, Settings
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from "recharts";

// Modals
import TaskModal from '../components/TaskModal';
import FileUploadModal from '../components/FileUploadModal';
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

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('👤 User data loaded:', parsedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
    fetchProjectDetail();
  }, [id]);

  // ✅ FIXED: Enhanced fetch function with comprehensive debugging
  const fetchProjectDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 === FETCH PROJECT DEBUG ===');
      console.log('📋 Project ID from URL:', id);
      console.log('📋 ID length:', id?.length);
      console.log('📋 ID type:', typeof id);
      console.log('🔑 Token exists:', !!token);
      console.log('🌐 Full URL:', `http://localhost:5000/api/projects/${id}`);

      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!id) {
        throw new Error('Project ID is missing from URL');
      }

      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response text:', errorText);
        
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        console.error('❌ API Error Details:', errorData);
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        
        if (response.status === 404) {
          throw new Error('Project not found. It may have been deleted or you may not have permission to view it.');
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch project`);
      }

      const data = await response.json();
      console.log('✅ Raw API response received');
      console.log('✅ Response data keys:', Object.keys(data));
      console.log('✅ Response structure check:', {
        hasName: !!data.name,
        hasId: !!data._id,
        hasProject: !!data.project,
        hasAnalytics: !!data.analytics,
        isArray: Array.isArray(data)
      });

      // ✅ FIXED: Handle both response structures with better validation
      if (data.name && data._id) {
        // Backend returns project object directly
        console.log('✅ Using direct project object');
        setProject(data);
        setAnalytics(null);
      } else if (data.project && data.project.name) {
        // Backend returns nested { project: ..., analytics: ... }
        console.log('✅ Using nested project object');
        setProject(data.project);
        setAnalytics(data.analytics);
      } else {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response format from server - expected project data');
      }

      console.log('✅ Project data set successfully');

    } catch (err) {
      console.error('❌ === FETCH ERROR ===');
      console.error('❌ Error message:', err.message);
      console.error('❌ Full error:', err);
      
      // More user-friendly error handling
      if (err.message.includes('fetch')) {
        alert('Unable to connect to server. Please check if the backend is running.');
      } else {
        alert(`Failed to load project: ${err.message}`);
      }
      
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Enhanced permission functions
  const canEditProject = () => {
    if (!project || !user) {
      console.log('🔐 Permission denied: Missing project or user data');
      return false;
    }
    
    const userId = String(user._id || user.id);
    const creatorId = String(project.createdBy?._id);
    const managerId = String(project.projectManager?._id);
    
    const canEdit = userId === creatorId || 
                   userId === managerId || 
                   user.role === 'admin' ||
                   user.role === 'Admin';
    
    console.log('🔐 Permission check result:', {
      userId,
      creatorId,
      managerId,
      userRole: user.role,
      canEdit
    });
    
    return canEdit;
  };

  const canEditTask = (task) => {
    if (!user || !task || !project) return false;
    
    const userId = String(user._id || user.id);
    const assignedToId = String(task.assignedTo?._id);
    const creatorId = String(project.createdBy?._id);
    const managerId = String(project.projectManager?._id);
    
    return userId === assignedToId || 
           userId === creatorId || 
           userId === managerId || 
           user.role === 'admin' ||
           user.role === 'Admin';
  };

  const handleTaskCreate = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdate = (task) => {
    setSelectedTask(task);
    setShowUpdateModal(true);
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchProjectDetail(); // Refresh data
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

  const getTaskStatusData = () => {
    if (!project?.tasks || !Array.isArray(project.tasks)) return [];
    
    const statusCount = project.tasks.reduce((acc, task) => {
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
    if (!project?.tasks || !Array.isArray(project.tasks)) return [];
    
    const priorityCount = project.tasks.reduce((acc, task) => {
      const priority = task.priority || 'Medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(priorityCount).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  };

  const getMemberProgressData = () => {
    if (!project?.members || !Array.isArray(project.members) || !project?.tasks) return [];
    
    return project.members.map(member => {
      const memberTasks = project.tasks.filter(task => 
        task.assignedTo && String(task.assignedTo._id) === String(member._id)
      );
      const completedTasks = memberTasks.filter(task => 
        task.status === 'Completed'
      ).length;
      
      return {
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
        total: memberTasks.length,
        completed: completedTasks,
        progress: memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0
      };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading project details...</p>
      </div>
    );
  }

  // ✅ Enhanced error display
  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Project not found</h2>
        <p className="text-gray-500 mb-6">
          The project you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <div className="space-x-4">
          <Link to="/projects">
            <Button>Back to Projects</Button>
          </Link>
          <Button variant="outline" onClick={() => {
            console.log('🔄 Retrying fetch...');
            fetchProjectDetail();
          }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const taskStatusData = getTaskStatusData();
  const taskPriorityData = getTaskPriorityData();
  const memberProgressData = getMemberProgressData();

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
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
        </div>
        
        {canEditProject() && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTaskCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
            <Button variant="outline" onClick={() => setShowFileModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
            <Link to={`/projects/${id}/edit`}>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.tasks?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Tasks</p>
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
                <p className="text-2xl font-bold">
                  {project.tasks?.filter(t => t.status === 'Completed').length || 0}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
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
                <p className="text-2xl font-bold">{project.overallProgress || project.progress || 0}%</p>
                <p className="text-sm text-gray-600">Progress</p>
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
                <p className="text-2xl font-bold">{project.members?.length || 0}</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'tasks', name: 'Tasks', icon: CheckCircle },
            { id: 'team', name: 'Team', icon: Users },
            { id: 'files', name: 'Files', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - Rest of your existing JSX remains the same */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Task Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {taskStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
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
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No task data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Priority Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Task Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {taskPriorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskPriorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={CHART_COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No priority data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Member Progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Team Member Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {memberProgressData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={memberProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="progress" fill={CHART_COLORS.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No team member data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keep all your existing activeTab content for tasks, team, files */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {!project.tasks || project.tasks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No tasks yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first task</p>
                {canEditProject() && (
                  <Button onClick={handleTaskCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {project.tasks.map(task => (
                <Card key={task._id} className={`border-l-4 ${PRIORITY_COLORS[task.priority]?.replace('bg-', 'border-').split(' ')[0]}`}>
                  <CardContent className="p-6">
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
                          {task.assignedTo && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                            </div>
                          )}
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
                        {canEditProject() && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTaskDelete(task._id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Keep your existing team and files tabs */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.members && project.members.length > 0 ? (
            project.members.map(member => {
              const memberTasks = project.tasks?.filter(task => 
                task.assignedTo && String(task.assignedTo._id) === String(member._id)
              ) || [];
              const completedTasks = memberTasks.filter(task => 
                task.status === 'Completed'
              ).length;

              return (
                <Card key={member._id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.profilePicture} />
                        <AvatarFallback>
                          {(member.firstName?.[0] || '').toUpperCase()}{(member.lastName?.[0] || '').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{member.firstName} {member.lastName}</h3>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tasks Assigned</span>
                        <span className="font-medium">{memberTasks.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span className="font-medium text-green-600">{completedTasks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">
                          {memberTasks.length > 0 
                            ? Math.round((completedTasks / memberTasks.length) * 100) 
                            : 0}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${memberTasks.length > 0 
                              ? Math.round((completedTasks / memberTasks.length) * 100) 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No team members</h3>
              <p className="text-gray-500">Add team members to collaborate on this project</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'files' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Project Files</CardTitle>
              {canEditProject() && (
                <Button onClick={() => setShowFileModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No files uploaded</h3>
              <p className="text-gray-500">Upload files to share with your team</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          project={project}
          task={editingTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            fetchProjectDetail();
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
            fetchProjectDetail();
            setShowUpdateModal(false);
            setSelectedTask(null);
          }}
        />
      )}

      {showFileModal && (
        <FileUploadModal
          projectId={id}
          onClose={() => setShowFileModal(false)}
          onSuccess={() => {
            fetchProjectDetail();
            setShowFileModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
