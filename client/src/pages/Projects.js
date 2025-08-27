import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Target,
  User,
  Settings,
  Trash2,
  Edit
} from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/projects', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setProjects(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err.response?.data || err);
      setError('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(projects.filter(p => p._id !== projectId));
      alert('Project deleted successfully');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project');
    }
  };

  const userId = JSON.parse(localStorage.getItem('user') || 'null')?._id;

  const filtered = projects.filter(p => {
    // Filter by type
    let typeMatch = true;
    if (filter === 'created') typeMatch = p.createdBy && p.createdBy._id === userId;
    else if (filter === 'assigned') typeMatch = p.members && p.members.some(m => m._id === userId);
    else if (filter === 'completed') typeMatch = p.status === 'Completed' || p.status === 'completed';

    // Filter by search term
    const searchMatch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return typeMatch && searchMatch;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not started':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in progress':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getProjectStats = () => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'Completed' || p.status === 'completed').length;
    const inProgress = projects.filter(p => p.status === 'In Progress' || p.status === 'in progress').length;
    const notStarted = projects.filter(p => p.status === 'Not Started' || p.status === 'not started').length;

    return { total, completed, inProgress, notStarted };
  };

  const stats = getProjectStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage and track your team's projects</p>
          </div>
          <button
            onClick={() => navigate('/createproject')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <FolderOpen className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Not Started</p>
                <p className="text-2xl font-bold text-gray-900">{stats.notStarted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('created')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'created'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Created by Me
              </button>
              <button
                onClick={() => setFilter('assigned')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'assigned'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Assigned to Me
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first project'}
          </p>
          <button
            onClick={() => navigate('/createproject')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(project => (
            <div key={project._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <Link 
                    to={`/projects/${project._id}`} 
                    className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {project.name}
                  </Link>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/projects/${project._id}/edit`)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Edit Project"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProject(project._id, project.name)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mb-3 ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1">{project.status || 'Not Started'}</span>
                </div>

                {/* Project Description */}
                {project.description && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {project.description}
                  </p>
                )}

                {/* Project Creator */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <User className="w-4 h-4 mr-2" />
                  <span>
                    Created by {project.createdBy?.firstName} {project.createdBy?.lastName}
                  </span>
                </div>

                {/* Tasks Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Tasks</span>
                    <span className="text-sm text-gray-500">{project.tasks?.length || 0} total</span>
                  </div>
                  
                  {project.tasks && project.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {project.tasks.slice(0, 3).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 truncate flex-1">{task.title}</span>
                          <span className="text-gray-500 ml-2">
                            {task.assignedTo 
                              ? `${task.assignedTo.firstName || ''} ${task.assignedTo.lastName || ''}`.trim() || 'Assigned'
                              : 'Unassigned'
                            }
                          </span>
                        </div>
                      ))}
                      {project.tasks.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{project.tasks.length - 3} more tasks
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No tasks assigned</p>
                  )}
                </div>

                {/* Team Members */}
                {project.members && project.members.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        Team
                      </span>
                      <span className="text-sm text-gray-500">{project.members.length} members</span>
                    </div>
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 5).map((member, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white"
                          title={`${member.firstName} ${member.lastName}`}
                        >
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </div>
                      ))}
                      {project.members.length > 5 && (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                          +{project.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
