import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Users, 
  Calendar, 
  Target,
  Clock,
  FileText,
  User,
  X
} from 'lucide-react';

export default function CreateProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch employee list for task assignment and team members
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get('/api/employees/list/all', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const employees = Array.isArray(res.data) ? res.data : [];
        setAllEmployees(employees);
      })
      .catch((err) => console.error('Error fetching employees:', err));
  }, []);

  const addTask = () =>
    setTasks((prev) => [...prev, { title: '', description: '', assignedTo: '' }]);

  const updateTask = (idx, field, value) =>
    setTasks((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t))
    );

  const removeTask = (idx) =>
    setTasks((prev) => prev.filter((_, i) => i !== idx));

  const addMember = (employeeId) => {
    if (!selectedMembers.includes(employeeId)) {
      setSelectedMembers(prev => [...prev, employeeId]);
    }
  };

  const removeMember = (employeeId) => {
    setSelectedMembers(prev => prev.filter(id => id !== employeeId));
  };

  const validate = () => {
    const err = {};
    if (!name.trim()) err.name = 'Project name is required';
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      err.endDate = 'End date must be after start date';
    }
    tasks.forEach((t, i) => {
      if (!t.title.trim()) err[`task_${i}`] = 'Task title required';
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Clean tasks: remove empty assignedTo
    const cleanedTasks = tasks.map((task) => {
      const t = {
        title: task.title.trim(),
        description: task.description?.trim() || '',
      };
      if (task.assignedTo) t.assignedTo = task.assignedTo;
      return t;
    });

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        name: name.trim(),
        description: description.trim(),
        priority,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        members: selectedMembers,
        tasks: cleanedTasks,
      };

      await axios.post('/api/projects', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLoading(false);
      alert('✅ Project created successfully!');
      navigate('/projects');
    } catch (err) {
      setLoading(false);
      console.error('❌ Create project error:', err.response?.data || err);
      alert('❌ Failed to create project. Check console for details.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const selectedEmployees = allEmployees.filter(emp => selectedMembers.includes(emp._id));
  const availableEmployees = allEmployees.filter(emp => !selectedMembers.includes(emp._id));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Projects
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
          <p className="text-gray-600">Set up a new project with tasks, team members, and deadlines</p>
        </div>
      </div>

      {/* Project Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Project Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter project name"
                    required
                  />
                  {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Describe your project..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-2 ${getPriorityColor(priority)}`}>
                      <Target className="w-3 h-3 mr-1" />
                      {priority} Priority
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                      Not Started
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.endDate && <div className="text-red-600 text-sm mt-1">{errors.endDate}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Project Tasks
                </h2>
                <button
                  type="button"
                  onClick={addTask}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No tasks added yet</p>
                  <button
                    type="button"
                    onClick={addTask}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add First Task
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900">Task {idx + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeTask(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Task title"
                            value={task.title}
                            onChange={(e) => updateTask(idx, 'title', e.target.value)}
                            required
                          />
                          {errors[`task_${idx}`] && (
                            <div className="text-red-600 text-sm mt-1">{errors[`task_${idx}`]}</div>
                          )}
                        </div>
                        
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Task description (optional)"
                          value={task.description}
                          onChange={(e) => updateTask(idx, 'description', e.target.value)}
                          rows="2"
                        />
                        
                        <select
                          value={task.assignedTo}
                          onChange={(e) => updateTask(idx, 'assignedTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Assign to team member (optional)</option>
                          {allEmployees.length > 0 ? (
                            allEmployees.map((emp) => (
                              <option key={emp._id} value={emp._id}>
                                {emp.firstName} {emp.lastName}
                              </option>
                            ))
                          ) : (
                            <option disabled>No employees available</option>
                          )}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Team Members
              </h3>
              
              {/* Add Members */}
              {availableEmployees.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Team Member
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addMember(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select employee...</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected Members */}
              {selectedEmployees.length > 0 ? (
                <div className="space-y-2">
                  {selectedEmployees.map((member) => (
                    <div key={member._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700 mr-3">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMember(member._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No team members added</p>
                </div>
              )}
            </div>

            {/* Project Summary */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasks:</span>
                  <span className="font-medium">{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Team Members:</span>
                  <span className="font-medium">{selectedMembers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <span className="font-medium">{priority}</span>
                </div>
                {startDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{new Date(startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">{new Date(endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Project...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Create Project</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="w-full mt-3 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}