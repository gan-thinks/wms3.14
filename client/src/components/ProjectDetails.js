import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(userInfo);
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(response.data);
    } catch (err) {
      console.error('Error fetching project:', err);
      if (err.response?.status === 404) {
        navigate('/projects');
      }
    }
  };

  const handleAddRemark = async () => {
    if (!remark.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/projects/${id}`, { remark: remark.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRemark('');
      fetchProject(); // Refresh data
    } catch (err) {
      console.error('Error adding remark:', err);
      alert('Failed to add remark');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/projects/${id}`, {
        tasks: [{ _id: taskId, status: newStatus }]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchProject(); // Refresh data
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task');
    }
  };

  if (!project || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  const isCreator = project.createdBy._id === user._id;
  const isMember = project.members.some(m => m._id === user._id);
  
  // Chart data
  const completed = project.tasks.filter(t => t.status === 'Completed').length;
  const inProgress = project.tasks.filter(t => t.status === 'In Progress').length;
  const notStarted = project.tasks.filter(t => t.status === 'Not Started').length;
  
  const progressData = [
    { name: 'Completed', value: completed, color: '#10B981' },
    { name: 'In Progress', value: inProgress, color: '#F59E0B' },
    { name: 'Not Started', value: notStarted, color: '#EF4444' }
  ];

  const tasksByMember = project.members.map(member => ({
    name: `${member.firstName} ${member.lastName}`,
    tasks: project.tasks.filter(t => t.assignedTo && t.assignedTo._id === member._id).length
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
                <p className="text-gray-600 mt-2">{project.description}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {project.status || 'Active'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Created by: {project.createdBy.firstName} {project.createdBy.lastName}
                  </span>
                </div>
              </div>
              
              {(isCreator || isMember) && (
                <div className="flex space-x-3">
                  <Link
                    to={`/projects/${id}/edit`}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Edit Project
                  </Link>
                  {isCreator && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this project?')) {
                          // Delete logic here
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts and Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Charts */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Project Progress</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <h4 className="text-lg font-medium mb-3 text-center">Task Status Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {progressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div>
                  <h4 className="text-lg font-medium mb-3 text-center">Tasks by Team Member</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={tasksByMember}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="tasks" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-bold text-blue-600">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Project Tasks ({project.tasks.length})</h3>
              
              <div className="space-y-3">
                {project.tasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tasks assigned yet</p>
                ) : (
                  project.tasks.map((task, index) => (
                    <div key={task._id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status}
                            </span>
                            {task.assignedTo && (
                              <span className="text-xs text-gray-500">
                                Assigned to: {task.assignedTo.firstName} {task.assignedTo.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Task Actions */}
                        {task.assignedTo && task.assignedTo._id === user._id && task.status !== 'Completed' && (
                          <div className="ml-4">
                            <select
                              value={task.status}
                              onChange={(e) => handleTaskStatusUpdate(task._id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Team and Comments */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Team Members</h3>
              <div className="space-y-3">
                {project.members.map(member => (
                  <div key={member._id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments/Remarks */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Project Discussion</h3>
              
              {/* Add new remark */}
              <div className="mb-4">
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add a comment or update..."
                />
                <button
                  onClick={handleAddRemark}
                  disabled={!remark.trim() || loading}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {loading ? 'Adding...' : 'Add Comment'}
                </button>
              </div>

              {/* Remarks list */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {project.remarks && project.remarks.length > 0 ? (
                  project.remarks.map((remark, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-800">
                          {remark.userName || `${remark.user.firstName} ${remark.user.lastName}`}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(remark.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{remark.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>
            </div>

            {/* Recent Updates */}
            {project.updates && project.updates.length > 0 && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Recent Updates</h3>
                <div className="space-y-2">
                  {project.updates.slice(-5).reverse().map((update, index) => (
                    <div key={index} className="text-sm">
                      <p className="text-gray-600">{update.description}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(update.date).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
