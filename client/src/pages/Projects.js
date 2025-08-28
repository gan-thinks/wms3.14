import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Calendar, Users, Clock, TrendingUp, 
  Filter, Search, ChevronDown, BarChart3 
} from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);

  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [projects, filter, searchTerm, sortBy]);

  const fetchProjects = async () => {
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
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      alert('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...projects];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(project => {
        switch (filter) {
          case 'created':
            return project.createdBy._id === user?._id;
          case 'assigned':
            return project.members.some(member => member._id === user?._id);
          case 'managing':
            return project.projectManager?._id === user?._id;
          case 'active':
            return ['In Progress', 'Planning'].includes(project.status);
          case 'completed':
            return project.status === 'Completed';
          case 'on-hold':
            return project.status === 'On Hold';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return (b.overallProgress || 0) - (a.overallProgress || 0);
        case 'priority':
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'recent':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredProjects(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'On Hold':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500';
      case 'High':
        return 'bg-orange-500';
      case 'Medium':
        return 'bg-yellow-500';
      case 'Low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your project portfolio
          </p>
        </div>
        <Link
          to="/createproject"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Project
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
            <BarChart3 className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600">
                {projects.filter(p => ['In Progress', 'Planning'].includes(p.status)).length}
              </p>
            </div>
            <TrendingUp className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'Completed').length}
              </p>
            </div>
            <Calendar className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Progress</p>
              <p className="text-2xl font-bold text-purple-600">
                {projects.length > 0 
                  ? Math.round(projects.reduce((sum, p) => sum + (p.overallProgress || 0), 0) / projects.length)
                  : 0
                }%
              </p>
            </div>
            <Clock className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'created', label: 'Created by Me' },
                { key: 'assigned', label: 'Assigned to Me' },
                { key: 'managing', label: 'Managing' },
                { key: 'active', label: 'Active' },
                { key: 'completed', label: 'Completed' }
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-3 py-1 rounded text-sm ${
                    filter === filterOption.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="recent">Recently Created</option>
              <option value="name">Name</option>
              <option value="progress">Progress</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 size={64} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Get started by creating your first project'
            }
          </p>
          {!searchTerm && filter === 'all' && (
            <Link
              to="/createproject"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Create Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const completedTasks = project.tasks.filter(t => t.status === 'Completed').length;
            const totalTasks = project.tasks.length;
            const tasksProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return (
              <div key={project._id} className="bg-white border rounded-lg hover:shadow-lg transition-shadow">
                {/* Project Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link 
                        to={`/projects/${project._id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {project.description || 'No description provided'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(project.priority)} ml-2 flex-shrink-0`} 
                         title={`${project.priority} Priority`}>
                    </div>
                  </div>

                  {/* Status and Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {project.overallProgress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${project.overallProgress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Project Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {completedTasks}/{totalTasks}
                      </div>
                      <div className="text-xs text-gray-600">Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {project.members.length}
                      </div>
                      <div className="text-xs text-gray-600">Members</div>
                    </div>
                  </div>

                  {/* Project Team */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Team</span>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden">
                      {project.members.slice(0, 4).map((member, index) => (
                        <div
                          key={member._id}
                          className="inline-block h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xs flex items-center justify-center font-medium border-2 border-white"
                          title={`${member.firstName} ${member.lastName}`}
                        >
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </div>
                      ))}
                      {project.members.length > 4 && (
                        <div className="inline-block h-8 w-8 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center font-medium border-2 border-white">
                          +{project.members.length - 4}
                        </div>
                      )}
                      {project.members.length === 0 && (
                        <span className="text-sm text-gray-500">No members assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Project Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    {project.lastProgressUpdate && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Updated {new Date(project.lastProgressUpdate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Created by:</span> {project.createdBy.firstName} {project.createdBy.lastName}
                    </div>
                    <Link
                      to={`/projects/${project._id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                  
                  {/* Recent Activity */}
                  {project.progressUpdates && project.progressUpdates.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Last update:</span> {
                          project.progressUpdates[project.progressUpdates.length - 1].remarks || 'Progress updated'
                        }
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions (for project creators/managers) */}
                {user && (
                  project.createdBy._id === user._id || 
                  project.projectManager?._id === user._id || 
                  project.members.some(member => member._id === user._id)
                ) && (
                  <div className="px-6 py-3 bg-blue-50 border-t">
                    <Link
                      to={`/projects/${project._id}?tab=progress`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      <TrendingUp size={14} />
                      Update Progress
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination could be added here if needed */}
      {filteredProjects.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-600">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>
      )}
    </div>
  );
};

export default Projects;