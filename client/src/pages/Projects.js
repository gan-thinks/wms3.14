import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No auth token found');
        return;
      }

      const response = await axios.get('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const projectsData = Array.isArray(response.data) ? response.data : [];
      setProjects(projectsData);
      console.log('✅ Projects fetched:', projectsData.length);

    } catch (err) {
      console.error('❌ Error fetching projects:', err);
      if (err.response?.status === 401) {
        console.log('Token expired, redirecting to login');
        // Handle auth error
      }
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Get current user ID for filtering
  const userId = JSON.parse(localStorage.getItem('user') || 'null')?._id;

  // Filter projects based on selected filter
  const filtered = projects.filter(project => {
    if (filter === 'created') {
      return project.createdBy && project.createdBy._id === userId;
    }
    if (filter === 'assigned') {
      return project.members && project.members.some(member => member._id === userId);
    }
    if (filter === 'completed') {
      return project.status === 'Completed' || project.status === 'completed';
    }
    return true; // 'all' filter
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
        <Link
          to="/createproject"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
        >
          ➕ Create Project
        </Link>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Projects', icon: '📋' },
          { key: 'created', label: 'Created by Me', icon: '👤' },
          { key: 'assigned', label: 'Assigned to Me', icon: '📝' },
          { key: 'completed', label: 'Completed', icon: '✅' }
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
              filter === key
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No projects found
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "No projects have been created yet." 
              : `No projects found for the "${filter}" filter.`}
          </p>
          {filter === 'all' && (
            <Link
              to="/createproject"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200"
            >
              Create Your First Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(project => (
            <div key={project._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition duration-200 border border-gray-200">
              <div className="p-6">
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <Link 
                    to={`/projects/${project._id}`} 
                    className="text-xl font-bold text-gray-800 hover:text-blue-600 transition duration-200 line-clamp-2"
                  >
                    {project.name}
                  </Link>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {project.status || 'Active'}
                  </span>
                </div>

                {/* Creator Info */}
                <div className="flex items-center mb-3">
                  <span className="text-sm text-gray-600">👤 Created by:</span>
                  <span className="ml-2 text-sm font-medium text-gray-800">
                    {project.createdBy?.firstName} {project.createdBy?.lastName}
                  </span>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>
                )}

                {/* Tasks Summary */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>📋 Tasks</span>
                    <span>{project.tasks?.length || 0} tasks</span>
                  </div>
                  
                  {project.tasks && project.tasks.length > 0 ? (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {project.tasks.slice(0, 3).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <span className="font-medium truncate">{task.title}</span>
                          {task.assignedTo ? (
                            <span className="text-blue-600 ml-2 flex-shrink-0">
                              {task.assignedTo.firstName} {task.assignedTo.lastName}
                            </span>
                          ) : (
                            <span className="text-gray-400 ml-2 flex-shrink-0">Unassigned</span>
                          )}
                        </div>
                      ))}
                      {project.tasks.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{project.tasks.length - 3} more tasks
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No tasks added</p>
                  )}
                </div>

                {/* Members */}
                {project.members && project.members.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <span>👥 Members ({project.members.length})</span>
                    </div>
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 4).map((member, index) => (
                        <div
                          key={member._id}
                          className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
                          title={`${member.firstName} ${member.lastName}`}
                        >
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </div>
                      ))}
                      {project.members.length > 4 && (
                        <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white">
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    📅 {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/projects/${project._id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition duration-200"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {projects.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Project Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.createdBy?._id === userId).length}
              </div>
              <div className="text-sm text-gray-600">Created by You</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {projects.filter(p => p.members?.some(m => m._id === userId)).length}
              </div>
              <div className="text-sm text-gray-600">Assigned to You</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}