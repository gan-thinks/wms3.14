import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Calendar, Users, Target, Clock } from 'lucide-react';

const CreateProject = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    budget: '',
    members: [],
    tasks: []
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    estimatedHours: '',
    dueDate: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched employees:', data); // Debug log
        setEmployees(data.employees || data || []); // Handle different response formats
      } else {
        console.error('Failed to fetch employees:', response.status);
        // Mock data for testing if API fails
        setEmployees([
          { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', department: 'IT' },
          { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', department: 'Marketing' },
          { _id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', department: 'Sales' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      // Mock data for testing if API fails
      setEmployees([
        { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', department: 'IT' },
        { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', department: 'Marketing' },
        { _id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', department: 'Sales' }
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberToggle = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(employeeId)
        ? prev.members.filter(id => id !== employeeId)
        : [...prev.members, employeeId]
    }));
  };

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addTask = () => {
    if (!newTask.title.trim()) {
      alert('Task title is required');
      return;
    }

    const task = {
      ...newTask,
      id: Date.now().toString(),
      estimatedHours: parseFloat(newTask.estimatedHours) || 0
    };

    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, task]
    }));

    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'Medium',
      estimatedHours: '',
      dueDate: ''
    });
  };

  const removeTask = (taskId) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Project name is required');
      return;
    }

    if (formData.members.length === 0) {
      alert('Please select at least one team member');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget) || 0,
          tasks: formData.tasks.map(task => ({
            title: task.title,
            description: task.description,
            assignedTo: task.assignedTo || null,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
            dueDate: task.dueDate || null
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('✅ Project created successfully!');
        navigate('/projects');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }
    } catch (err) {
      console.error('Create project error:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/projects')}
          className="text-blue-600 hover:underline mb-2"
        >
          ← Back to Projects
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-600 mt-1">Set up a new project with team members and tasks</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Project Info */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target size={20} />
            Project Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the project goals and objectives"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected End Date
              </label>
              <input
                type="date"
                name="expectedEndDate"
                value={formData.expectedEndDate}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget (Optional)
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users size={20} />
            Team Members *
          </h2>
          
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Loading employees...</p>
              <p className="text-sm text-gray-500 mt-2">
                If employees don't load, please check your connection or try refreshing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map(employee => (
                <label key={employee._id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.members.includes(employee._id)}
                    onChange={() => handleMemberToggle(employee._id)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</p>
                        <p className="text-sm text-gray-600">{employee.email}</p>
                        {employee.department && (
                          <p className="text-xs text-gray-500">{employee.department}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          {employees.length > 0 && formData.members.length === 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">⚠️ Please select at least one team member</p>
            </div>
          )}
          
          {formData.members.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">✅ Selected {formData.members.length} team member(s)</p>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} />
            Project Tasks
          </h2>

          {/* Add New Task */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-3">Add Task</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="title"
                  value={newTask.title}
                  onChange={handleTaskChange}
                  placeholder="Task title"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <select
                  name="assignedTo"
                  value={newTask.assignedTo}
                  onChange={handleTaskChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Assign to...</option>
                  {employees
                    .filter(emp => formData.members.includes(emp._id))
                    .map(employee => (
                      <option key={employee._id} value={employee._id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))
                  }
                </select>
              </div>
              <div>
                <input
                  type="text"
                  name="description"
                  value={newTask.description}
                  onChange={handleTaskChange}
                  placeholder="Task description"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleTaskChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>
              <div>
                <input
                  type="number"
                  name="estimatedHours"
                  value={newTask.estimatedHours}
                  onChange={handleTaskChange}
                  placeholder="Estimated hours"
                  className="w-full p-2 border rounded"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <input
                  type="date"
                  name="dueDate"
                  value={newTask.dueDate}
                  onChange={handleTaskChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addTask}
              className="mt-3 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>

          {/* Task List */}
          {formData.tasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Added Tasks ({formData.tasks.length})</h3>
              {formData.tasks.map(task => {
                const assignedEmployee = employees.find(emp => emp._id === task.assignedTo);
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{task.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-1 space-x-4">
                        {assignedEmployee && (
                          <span>Assigned to: {assignedEmployee.firstName} {assignedEmployee.lastName}</span>
                        )}
                        {task.estimatedHours && (
                          <span>Est. {task.estimatedHours}h</span>
                        )}
                        {task.dueDate && (
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create Project
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;