import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, X, Users, Calendar, Clock, User, 
  Edit, Trash2, MessageSquare, Upload, File, CheckCircle,
  AlertTriangle, Download, Eye, Percent
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ProjectEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);

  // Modal states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState(null);

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
      setUser(JSON.parse(userData));
    }
    fetchProject();
    fetchEmployees();
  }, [id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        throw new Error('Failed to load project');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      alert('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data || []);
      } else {
        throw new Error('Failed to load employees');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Task form handlers
  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskFileChange = (e) => {
    const files = Array.from(e.target.files);
    setTaskFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const removeTaskFile = (index) => {
    setTaskFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const openTaskForm = (task = null) => {
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
    
    if (!taskFormData.title.trim()) {
      alert('Task title is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('title', taskFormData.title);
      formDataToSend.append('description', taskFormData.description);
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

      if (response.ok) {
        alert(editingTask ? 'Task updated successfully!' : 'Task created successfully!');
        setShowTaskForm(false);
        setEditingTask(null);
        fetchProject();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save task');
      }
    } catch (err) {
      console.error('Task save error:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Task deleted successfully!');
        fetchProject();
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (err) {
      console.error('Delete task error:', err);
      alert('Error: ' + err.message);
    }
  };

  // Task update handlers
  const openUpdateForm = (task) => {
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
  };

  const handleUpdateFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUpdateFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const removeUpdateFile = (index) => {
    setUpdateFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('status', updateFormData.status);
      formDataToSend.append('progress', updateFormData.progress);
      formDataToSend.append('remarks', updateFormData.remarks);
      formDataToSend.append('hoursWorked', updateFormData.hoursWorked || 0);

      updateFormData.files.forEach(file => {
        formDataToSend.append('files', file);
      });

      const response = await fetch(`http://localhost:5000/api/projects/${id}/tasks/${selectedTaskForUpdate._id}/update`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        alert('Task progress updated successfully!');
        setSelectedTaskForUpdate(null);
        fetchProject();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update task');
      }
    } catch (err) {
      console.error('Update task error:', err);
      alert('Error: ' + err.message);
    }
  };

  // ✅ UPDATED: Allow all users to edit tasks (no restrictions)
  const canEditTask = (task) => {
    return !!user; // Allow all logged-in users to edit any task
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading project tasks...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-600">Project not found</h2>
        <Button onClick={() => navigate('/projects')} className="mt-4">
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

                    {/* ✅ UPDATED: Action Buttons - All users can edit */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openUpdateForm(task)}
                        title="Update Progress & Add Remarks"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                      
                      {/* ✅ Edit button visible to ALL users */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openTaskForm(task)}
                        title="Edit Task Details"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      {/* ✅ Delete button visible to ALL users */}
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
              <button onClick={() => setShowTaskForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} className="p-6 space-y-6">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                />
                <p className="text-xs text-gray-500 mt-1">
                  Support: PDF, DOC, XLS, images, ZIP files
                </p>
                
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
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowTaskForm(false)} className="flex-1">
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
              <button onClick={() => setSelectedTaskForUpdate(null)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={updateFormData.status}
                    onChange={handleUpdateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
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
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                  Update Progress
                </Button>
                <Button type="button" variant="outline" onClick={() => setSelectedTaskForUpdate(null)} className="flex-1">
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
