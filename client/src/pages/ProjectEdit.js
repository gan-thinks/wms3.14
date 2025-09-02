import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, X, Users, Calendar, Clock, User, 
  Edit, Trash2, MessageSquare, Upload, File, CheckCircle,
  AlertTriangle, Download, Eye, Percent, AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Error Display Component
const ErrorAlert = ({ error, onClose }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-red-600 hover:text-red-800">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
);

// Loading Component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
    <p className="ml-4 text-gray-600">{message}</p>
  </div>
);

const ProjectEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [updateFormLoading, setUpdateFormLoading] = useState(false);

  // Modal states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState(null);

  // Form validation errors
  const [taskFormErrors, setTaskFormErrors] = useState({});
  const [updateFormErrors, setUpdateFormErrors] = useState({});

  // Task form data
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    estimatedHours: '',
    dueDate: '',
    files: []
  });

  // Task update form data
  const [updateFormData, setUpdateFormData] = useState({
    status: 'Not Started',
    progress: 0,
    remarks: '',
    hoursWorked: '',
    files: []
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
        setError('Invalid user session. Please login again.');
        return;
      }
    }
    
    initializeData();
  }, [id]);

  // Initialize data with error handling
  const initializeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([fetchProject(), fetchEmployees()]);
    } catch (err) {
      console.error('Failed to initialize data:', err);
      setError('Failed to load project data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced fetch project with better error handling
  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      console.log('Fetching project with ID:', id);
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to edit this project.');
        } else if (response.status === 404) {
          throw new Error('Project not found. It may have been deleted.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Project data received:', data);

      // Handle different response formats
      const projectData = data.project || data;
      if (!projectData || !projectData._id) {
        throw new Error('Invalid project data received from server.');
      }

      setProject(projectData);
      return projectData;
    } catch (err) {
      console.error('Error fetching project:', err);
      
      // Handle specific error cases
      if (err.message.includes('login') || err.message.includes('Session expired')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      if (err.message.includes('not found') || err.message.includes('deleted')) {
        setError(err.message);
        setTimeout(() => navigate('/projects'), 3000);
        return;
      }

      throw err; // Re-throw for general error handling
    }
  };

  // Enhanced fetch employees with error handling
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Skip if no token

      const response = await fetch('http://localhost:5000/api/employees', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to load employees list');
        setEmployees([]); // Set empty array instead of failing
      }
    } catch (err) {
      console.warn('Error fetching employees:', err);
      setEmployees([]); // Don't fail the whole component for this
    }
  };

  // Form validation
  const validateTaskForm = () => {
    const errors = {};
    
    if (!taskFormData.title.trim()) {
      errors.title = 'Task title is required';
    }
    
    if (taskFormData.estimatedHours && taskFormData.estimatedHours < 0) {
      errors.estimatedHours = 'Estimated hours cannot be negative';
    }
    
    if (taskFormData.dueDate) {
      const dueDate = new Date(taskFormData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        errors.dueDate = 'Due date cannot be in the past';
      }
    }
    
    // Validate file sizes (max 10MB per file)
    taskFormData.files.forEach((file, index) => {
      if (file.size > 10 * 1024 * 1024) {
        errors[`file_${index}`] = `${file.name} is too large. Maximum size is 10MB.`;
      }
    });
    
    setTaskFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateUpdateForm = () => {
    const errors = {};
    
    if (updateFormData.progress < 0 || updateFormData.progress > 100) {
      errors.progress = 'Progress must be between 0 and 100';
    }
    
    if (updateFormData.hoursWorked && updateFormData.hoursWorked < 0) {
      errors.hoursWorked = 'Hours worked cannot be negative';
    }
    
    setUpdateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Task form handlers with error handling
  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (taskFormErrors[name]) {
      setTaskFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTaskFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const validFiles = [];
    const errors = { ...taskFormErrors };
    
    files.forEach((file, index) => {
      if (file.size > maxFileSize) {
        errors[`file_${index}`] = `${file.name} is too large. Maximum size is 10MB.`;
      } else {
        validFiles.push(file);
        delete errors[`file_${index}`];
      }
    });
    
    setTaskFormData(prev => ({ ...prev, files: [...prev.files, ...validFiles] }));
    setTaskFormErrors(errors);
  };

  const removeTaskFile = (index) => {
    setTaskFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
    
    // Clear file-related errors
    const newErrors = { ...taskFormErrors };
    delete newErrors[`file_${index}`];
    setTaskFormErrors(newErrors);
  };

  const openTaskForm = (task = null) => {
    setTaskFormErrors({});
    
    if (task) {
      setTaskFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo?._id || '',
        priority: task.priority || 'Medium',
        estimatedHours: task.estimatedHours || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        files: []
      });
      setEditingTask(task);
    } else {
      setTaskFormData({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium',
        estimatedHours: '',
        dueDate: '',
        files: []
      });
      setEditingTask(null);
    }
    setShowTaskForm(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateTaskForm()) {
      return;
    }

    setTaskFormLoading(true);
    setTaskFormErrors({});

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', taskFormData.title.trim());
      formDataToSend.append('description', taskFormData.description.trim());
      formDataToSend.append('assignedTo', taskFormData.assignedTo);
      formDataToSend.append('priority', taskFormData.priority);
      formDataToSend.append('estimatedHours', taskFormData.estimatedHours || 0);
      formDataToSend.append('dueDate', taskFormData.dueDate || '');

      taskFormData.files.forEach(file => {
        formDataToSend.append('files', file);
      });

      const url = editingTask 
        ? `http://localhost:5000/api/projects/${id}/tasks/${editingTask._id}`
        : `http://localhost:5000/api/projects/${id}/tasks`;
      
      const method = editingTask ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save task');
      }

      // Success
      setShowTaskForm(false);
      setEditingTask(null);
      await fetchProject();
      
      // Show success message
      setError(null);
      alert(editingTask ? 'Task updated successfully!' : 'Task created successfully!');
      
    } catch (err) {
      console.error('Task save error:', err);
      setTaskFormErrors({ general: err.message });
    } finally {
      setTaskFormLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch(`http://localhost:5000/api/projects/${id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete task');
      }

      await fetchProject();
      alert('Task deleted successfully!');
    } catch (err) {
      console.error('Delete task error:', err);
      setError(`Failed to delete task: ${err.message}`);
    }
  };

  // Task update handlers with error handling
  const openUpdateForm = (task) => {
    setUpdateFormErrors({});
    setUpdateFormData({
      status: task.status || 'Not Started',
      progress: task.progress || 0,
      remarks: '',
      hoursWorked: '',
      files: []
    });
    setSelectedTaskForUpdate(task);
  };

  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (updateFormErrors[name]) {
      setUpdateFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleUpdateFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const validFiles = [];
    
    files.forEach(file => {
      if (file.size <= maxFileSize) {
        validFiles.push(file);
      }
    });
    
    setUpdateFormData(prev => ({ ...prev, files: [...prev.files, ...validFiles] }));
  };

  const removeUpdateFile = (index) => {
    setUpdateFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateUpdateForm()) {
      return;
    }

    setUpdateFormLoading(true);
    setUpdateFormErrors({});

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('status', updateFormData.status);
      formDataToSend.append('progress', updateFormData.progress);
      formDataToSend.append('remarks', updateFormData.remarks.trim());
      formDataToSend.append('hoursWorked', updateFormData.hoursWorked || 0);

      updateFormData.files.forEach(file => {
        formDataToSend.append('files', file);
      });

      const response = await fetch(`http://localhost:5000/api/projects/${id}/tasks/${selectedTaskForUpdate._id}/update`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update task');
      }

      setSelectedTaskForUpdate(null);
      await fetchProject();
      alert('Task progress updated successfully!');
      
    } catch (err) {
      console.error('Update task error:', err);
      setUpdateFormErrors({ general: err.message });
    } finally {
      setUpdateFormLoading(false);
    }
  };

  // Utility functions
  const canEditTask = (task) => {
    return !!user;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'On Hold': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Error boundary for the component
  if (error) {
    return (
      <div className="space-y-6">
        <ErrorAlert 
          error={error} 
          onClose={() => setError(null)}
        />
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Unable to load project</h2>
          <div className="space-x-4">
            <Button onClick={initializeData} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => navigate('/projects')}>
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading project tasks..." />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-4">Project not found</h2>
        <p className="text-gray-500 mb-6">The project you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(`/projects/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Tasks - {project.name}</h1>
            <p className="text-gray-600">Create tasks, assign team members, track progress and manage deadlines</p>
          </div>
        </div>
        <Button onClick={() => openTaskForm()} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-lg font-bold">{project.tasks?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-lg font-bold">
                  {project.tasks?.filter(t => t.status === 'Completed').length || 0}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-lg font-bold">
                  {project.tasks?.filter(t => t.status === 'In Progress').length || 0}
                </p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-lg font-bold">{project.members?.length || 0}</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Team Members ({project.members?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {project.members?.map(member => (
              <div key={member._id} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{member.firstName?.[0]}{member.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500">No team members assigned to this project</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Project Tasks ({project.tasks?.length || 0})
            </CardTitle>
            <Button onClick={() => openTaskForm()} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {project.tasks?.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No tasks created yet</h3>
              <p className="text-gray-500 mb-4">Create your first task to start managing work</p>
              <Button onClick={() => openTaskForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {project.tasks.map(task => (
                <div key={task._id} className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status || 'Not Started'}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      {/* Task Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>
                            {task.assignedTo ? 
                              `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 
                              'Unassigned'
                            }
                          </span>
                        </div>
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{task.estimatedHours || 0}h estimated</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Percent className="h-4 w-4" />
                          <span>{task.progress || 0}% complete</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Files */}
                      {task.files?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            <File className="h-4 w-4 inline mr-1" />
                            Attached Files ({task.files.length})
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {task.files.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 bg-white px-3 py-1 rounded border">
                                <File className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">{file.name || `File ${index + 1}`}</span>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Latest Remarks */}
                      {task.remarks && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                          <p className="text-sm">
                            <MessageSquare className="h-4 w-4 inline mr-2 text-blue-500" />
                            <strong>Latest Update:</strong> {task.remarks}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openUpdateForm(task)}
                        title="Update Progress & Add Remarks"
                        disabled={updateFormLoading}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openTaskForm(task)}
                        title="Edit Task Details"
                        disabled={taskFormLoading}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Task"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Creation/Edit Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button 
                onClick={() => setShowTaskForm(false)} 
                className="text-gray-500 hover:text-gray-700"
                disabled={taskFormLoading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} className="p-6 space-y-6">
              {/* Show general errors */}
              {taskFormErrors.general && (
                <ErrorAlert error={taskFormErrors.general} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={taskFormData.title}
                    onChange={handleTaskFormChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      taskFormErrors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter task title"
                    disabled={taskFormLoading}
                  />
                  {taskFormErrors.title && (
                    <p className="text-red-500 text-xs mt-1">{taskFormErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Assign To
                  </label>
                  <select
                    name="assignedTo"
                    value={taskFormData.assignedTo}
                    onChange={handleTaskFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={taskFormLoading}
                  >
                    <option value="">Select team member</option>
                    {project.members?.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.firstName} {member.lastName} ({member.role})
                      </option>
                    ))}
                  </select>
                  {project.members?.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">
                      No team members in this project. Add members to the project first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={taskFormData.priority}
                    onChange={handleTaskFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={taskFormLoading}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    min="0"
                    step="0.5"
                    value={taskFormData.estimatedHours}
                    onChange={handleTaskFormChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      taskFormErrors.estimatedHours ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    disabled={taskFormLoading}
                  />
                  {taskFormErrors.estimatedHours && (
                    <p className="text-red-500 text-xs mt-1">{taskFormErrors.estimatedHours}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Deadline
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={taskFormData.dueDate}
                    onChange={handleTaskFormChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      taskFormErrors.dueDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={taskFormLoading}
                  />
                  {taskFormErrors.dueDate && (
                    <p className="text-red-500 text-xs mt-1">{taskFormErrors.dueDate}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={taskFormData.description}
                  onChange={handleTaskFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the task requirements and objectives"
                  disabled={taskFormLoading}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="h-4 w-4 inline mr-1" />
                  Attach Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleTaskFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.txt"
                  disabled={taskFormLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Support: PDF, DOC, XLS, images, ZIP files (Max 10MB per file)
                </p>
                
                {/* File errors */}
                {Object.keys(taskFormErrors).filter(key => key.startsWith('file_')).map(key => (
                  <p key={key} className="text-red-500 text-xs mt-1">{taskFormErrors[key]}</p>
                ))}
                
                {/* Selected Files */}
                {taskFormData.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                    {taskFormData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTaskFile(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={taskFormLoading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={taskFormLoading}
                >
                  {taskFormLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingTask ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingTask ? 'Update Task' : 'Create Task'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowTaskForm(false)} 
                  className="flex-1"
                  disabled={taskFormLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {selectedTaskForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">Update Task Progress</h2>
                <p className="text-gray-600 mt-1">{selectedTaskForUpdate.title}</p>
              </div>
              <button 
                onClick={() => setSelectedTaskForUpdate(null)} 
                className="text-gray-500 hover:text-gray-700"
                disabled={updateFormLoading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-6">
              {/* Show general errors */}
              {updateFormErrors.general && (
                <ErrorAlert error={updateFormErrors.general} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={updateFormData.status}
                    onChange={handleUpdateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={updateFormLoading}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
                  <input
                    type="number"
                    name="progress"
                    min="0"
                    max="100"
                    value={updateFormData.progress}
                    onChange={handleUpdateFormChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      updateFormErrors.progress ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={updateFormLoading}
                  />
                  {updateFormErrors.progress && (
                    <p className="text-red-500 text-xs mt-1">{updateFormErrors.progress}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hours Worked Today</label>
                  <input
                    type="number"
                    name="hoursWorked"
                    min="0"
                    step="0.5"
                    value={updateFormData.hoursWorked}
                    onChange={handleUpdateFormChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      updateFormErrors.hoursWorked ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    disabled={updateFormLoading}
                  />
                  {updateFormErrors.hoursWorked && (
                    <p className="text-red-500 text-xs mt-1">{updateFormErrors.hoursWorked}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Progress Update & Remarks
                </label>
                <textarea
                  name="remarks"
                  rows={4}
                  value={updateFormData.remarks}
                  onChange={handleUpdateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what you've accomplished, any challenges faced, or next steps..."
                  disabled={updateFormLoading}
                />
              </div>

              {/* File Upload for Progress Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="h-4 w-4 inline mr-1" />
                  Upload Progress Files (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleUpdateFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                  disabled={updateFormLoading}
                />
                
                {updateFormData.files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {updateFormData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeUpdateFile(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={updateFormLoading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={updateFormLoading}
                >
                  {updateFormLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Progress'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSelectedTaskForUpdate(null)} 
                  className="flex-1"
                  disabled={updateFormLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectEdit;
