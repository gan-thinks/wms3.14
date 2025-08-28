/*import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    axios.get(`/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setProject(res.data));
  }, [id]);

  if (!project) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p>{project.description}</p>

      <h2 className="mt-4 font-semibold">Members</h2>
      <ul>
        {project.members.map(m => (
          <li key={m._id}>{m.firstName} {m.lastName}</li>
        ))}
      </ul>

      <h2 className="mt-4 font-semibold">Progress Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={project.progressUpdates}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
          <YAxis domain={[0, 100]} />
          <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
          <Line type="monotone" dataKey="progress" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProjectDetails;
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Calendar, Clock, Users, CheckCircle, AlertCircle, 
  TrendingUp, Edit2, Plus, Save, X 
} from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  
  // Progress update form state
  const [progressForm, setProgressForm] = useState({
    overallProgress: 0,
    remarks: '',
    taskUpdates: [],
    blockers: []
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [projectRes, analyticsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/projects/${id}/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!projectRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to fetch project data');
      }

      const projectData = await projectRes.json();
      const analyticsData = await analyticsRes.json();

      setProject(projectData.project);
      setAnalytics(analyticsData.analytics);
      
      // Initialize progress form with current data
      setProgressForm({
        overallProgress: projectData.project.overallProgress || 0,
        remarks: '',
        taskUpdates: projectData.project.tasks.map(task => ({
          taskId: task._id,
          progress: task.progress,
          status: task.status,
          hoursWorked: 0,
          notes: ''
        })),
        blockers: []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(progressForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      await fetchProjectData();
      alert('✅ Progress updated successfully!');
      
      // Reset form
      setProgressForm(prev => ({
        ...prev,
        remarks: '',
        taskUpdates: prev.taskUpdates.map(update => ({
          ...update,
          hoursWorked: 0,
          notes: ''
        })),
        blockers: []
      }));
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const updateTaskProgress = (taskIndex, field, value) => {
    setProgressForm(prev => ({
      ...prev,
      taskUpdates: prev.taskUpdates.map((update, idx) => 
        idx === taskIndex ? { ...update, [field]: value } : update
      )
    }));
  };

  const addBlocker = () => {
    setProgressForm(prev => ({
      ...prev,
      blockers: [...prev.blockers, { description: '', severity: 'Medium' }]
    }));
  };

  const updateBlocker = (index, field, value) => {
    setProgressForm(prev => ({
      ...prev,
      blockers: prev.blockers.map((blocker, idx) => 
        idx === index ? { ...blocker, [field]: value } : blocker
      )
    }));
  };

  const removeBlocker = (index) => {
    setProgressForm(prev => ({
      ...prev,
      blockers: prev.blockers.filter((_, idx) => idx !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project || !analytics) {
    return (
      <div className="text-center p-6">
        <p className="text-red-600">Error: {error || 'Project not found'}</p>
        <button 
          onClick={() => navigate('/projects')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  // Check if user can edit
  const canEdit = user && (
    project.createdBy._id === user._id || 
    project.projectManager?._id === user._id ||
    project.members.some(member => member._id === user._id) ||
    user.role === 'admin'
  );

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <button 
            onClick={() => navigate('/projects')}
            className="text-blue-600 hover:underline mb-2"
          >
            ← Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.description}</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Edit2 size={16} />
            {isEditing ? 'Cancel Edit' : 'Edit Project'}
          </button>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={20} />
            <span className="text-sm text-gray-600">Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{project.overallProgress}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-sm text-gray-600">Tasks</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.overview.completedTasks}/{analytics.overview.totalTasks}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Clock className="text-orange-600" size={20} />
            <span className="text-sm text-gray-600">Hours</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.timeTracking.totalActualHours}/{analytics.timeTracking.totalEstimatedHours}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Users className="text-purple-600" size={20} />
            <span className="text-sm text-gray-600">Team</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{project.members.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['overview', 'analytics', 'tasks', 'progress'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Project Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Status</label>
                      <p className="font-medium">{project.status}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Priority</label>
                      <p className="font-medium">{project.priority}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Created By</label>
                      <p className="font-medium">{project.createdBy.firstName} {project.createdBy.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Project Manager</label>
                      <p className="font-medium">
                        {project.projectManager 
                          ? `${project.projectManager.firstName} ${project.projectManager.lastName}`
                          : 'Not assigned'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Start Date</label>
                      <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Expected End Date</label>
                      <p className="font-medium">
                        {project.expectedEndDate 
                          ? new Date(project.expectedEndDate).toLocaleDateString()
                          : 'Not set'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Last Updated</label>
                      <p className="font-medium">
                        {project.lastProgressUpdate 
                          ? new Date(project.lastProgressUpdate).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Team Members</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.members.map(member => (
                    <div key={member._id} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{member.firstName} {member.lastName}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <div className="mt-2">
                        <div className="text-sm text-gray-600">Tasks assigned: 
                          {project.tasks.filter(t => t.assignedTo?._id === member._id).length}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Progress Chart */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Progress Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.progressTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Progress (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Status Pie Chart */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Tasks by Status</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.tasksByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.tasksByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Task Priority Chart */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Tasks by Priority</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.tasksByPriority}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time Tracking */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Time Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{analytics.timeTracking.totalEstimatedHours}h</p>
                    <p className="text-sm text-gray-600">Estimated</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{analytics.timeTracking.totalActualHours}h</p>
                    <p className="text-sm text-gray-600">Actual</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{analytics.timeTracking.efficiency}%</p>
                    <p className="text-sm text-gray-600">Efficiency</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Tasks</h3>
              {project.tasks.length === 0 ? (
                <p className="text-gray-500">No tasks assigned to this project yet.</p>
              ) : (
                <div className="space-y-4">
                  {project.tasks.map((task, index) => (
                    <div key={task._id} className="border rounded-lg p-4 hover:shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Assigned to:</span>
                          <p className="font-medium">
                            {task.assignedTo 
                              ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                              : 'Unassigned'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Progress:</span>
                          <p className="font-medium">{task.progress}%</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Priority:</span>
                          <p className="font-medium">{task.priority}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Hours:</span>
                          <p className="font-medium">{task.actualHours || 0}h / {task.estimatedHours || 0}h</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progress Update Tab */}
          {activeTab === 'progress' && canEdit && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Update Progress</h3>
              
              <form onSubmit={handleProgressUpdate} className="space-y-6">
                {/* Overall Progress */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overall Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progressForm.overallProgress}
                    onChange={(e) => setProgressForm(prev => ({
                      ...prev, 
                      overallProgress: parseInt(e.target.value) || 0
                    }))}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Remarks
                  </label>
                  <textarea
                    value={progressForm.remarks}
                    onChange={(e) => setProgressForm(prev => ({
                      ...prev, 
                      remarks: e.target.value
                    }))}
                    className="w-full p-2 border rounded-lg"
                    rows="3"
                    placeholder="What was accomplished today? Any challenges?"
                  />
                </div>

                {/* Task Updates */}
                <div>
                  <h4 className="text-md font-medium mb-4">Update Individual Tasks</h4>
                  <div className="space-y-4">
                    {progressForm.taskUpdates.map((taskUpdate, index) => {
                      const task = project.tasks.find(t => t._id === taskUpdate.taskId);
                      return (
                        <div key={task._id} className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">{task.title}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Progress (%)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={taskUpdate.progress}
                                onChange={(e) => updateTaskProgress(index, 'progress', parseInt(e.target.value) || 0)}
                                className="w-full p-2 border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Status</label>
                              <select
                                value={taskUpdate.status}
                                onChange={(e) => updateTaskProgress(index, 'status', e.target.value)}
                                className="w-full p-2 border rounded"
                              >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Hours Worked Today</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={taskUpdate.hoursWorked}
                                onChange={(e) => updateTaskProgress(index, 'hoursWorked', parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border rounded"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="block text-sm text-gray-600 mb-1">Notes</label>
                            <input
                              type="text"
                              value={taskUpdate.notes}
                              onChange={(e) => updateTaskProgress(index, 'notes', e.target.value)}
                              className="w-full p-2 border rounded"
                              placeholder="Any specific updates or issues..."
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Blockers */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium">Blockers & Issues</h4>
                    <button
                      type="button"
                      onClick={addBlocker}
                      className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      <Plus size={16} />
                      Add Blocker
                    </button>
                  </div>
                  
                  {progressForm.blockers.map((blocker, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={blocker.description}
                        onChange={(e) => updateBlocker(index, 'description', e.target.value)}
                        className="flex-1 p-2 border rounded"
                        placeholder="Describe the blocker..."
                      />
                      <select
                        value={blocker.severity}
                        onChange={(e) => updateBlocker(index, 'severity', e.target.value)}
                        className="p-2 border rounded"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeBlocker(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Save size={16} />
                    Update Progress
                  </button>
                </div>
              </form>

              {/* Recent Progress Updates */}
              {project.progressUpdates && project.progressUpdates.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-md font-medium mb-4">Recent Updates</h4>
                  <div className="space-y-4">
                    {project.progressUpdates
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 5)
                      .map((update, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Progress: {update.overallProgress}%</p>
                              <p className="text-sm text-gray-600">
                                by {update.updatedBy.firstName} {update.updatedBy.lastName}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(update.date).toLocaleDateString()}
                            </span>
                          </div>
                          {update.remarks && (
                            <p className="text-sm text-gray-700 mt-1">{update.remarks}</p>
                          )}
                          {update.blockers && update.blockers.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-red-600">Blockers:</p>
                              {update.blockers.map((blocker, idx) => (
                                <p key={idx} className="text-xs text-red-700">
                                  • {blocker.description} ({blocker.severity})
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {!canEdit && activeTab === 'progress' && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">You don't have permission to update this project's progress.</p>
              <p className="text-sm text-gray-500 mt-1">
                Only project creators, managers, and team members can update progress.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
