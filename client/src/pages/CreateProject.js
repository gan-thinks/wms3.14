import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CreateProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch employee list for task assignment
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/employees/list/all', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const employees = Array.isArray(response.data) ? response.data : [];
        setAllEmployees(employees);
        console.log('✅ Employees fetched:', employees.length);
      } catch (err) {
        console.error('❌ Error fetching employees:', err);
        setAllEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  const addTask = () => {
    setTasks((prev) => [...prev, { 
      title: '', 
      description: '', 
      assignedTo: '' 
    }]);
  };

  const updateTask = (idx, field, value) => {
    setTasks((prev) =>
      prev.map((task, i) => (i === idx ? { ...task, [field]: value } : task))
    );
  };

  const removeTask = (idx) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const err = {};
    
    if (!name.trim()) {
      err.name = 'Project name is required';
    }
    
    tasks.forEach((task, i) => {
      if (!task.title.trim()) {
        err[`task_${i}`] = 'Task title is required';
      }
    });
    
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      console.log('❌ Validation failed');
      return;
    }

    // Clean and prepare tasks
    const cleanedTasks = tasks.map((task) => ({
      title: task.title.trim(),
      description: task.description?.trim() || '',
      ...(task.assignedTo && { assignedTo: task.assignedTo })
    }));

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const payload = {
        name: name.trim(),
        description: description.trim(),
        tasks: cleanedTasks,
      };

      console.log('📤 Creating project:', payload);

      const response = await axios.post('/api/projects', payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('✅ Project created successfully:', response.data);
      alert('✅ Project created successfully!');
      navigate('/projects');

    } catch (err) {
      console.error('❌ Create project error:', err);
      
      // Better error handling
      if (err.response?.data?.error) {
        alert(`❌ Error: ${err.response.data.error}`);
      } else if (err.response?.status === 401) {
        alert('❌ Authentication failed. Please login again.');
        navigate('/login');
      } else {
        alert('❌ Failed to create project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Create New Project</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter project name"
            required
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter project description"
            rows="3"
          />
        </div>

        {/* Project Tasks */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Project Tasks</h3>
          
          {tasks.length === 0 && (
            <p className="text-gray-500 mb-4">No tasks added yet. Click "Add Task" to get started.</p>
          )}

          {tasks.map((task, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <div className="space-y-3">
                {/* Task Title */}
                <div>
                  <input
                    type="text"
                    placeholder="Task title *"
                    value={task.title}
                    onChange={(e) => updateTask(idx, 'title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors[`task_${idx}`] && (
                    <p className="text-red-600 text-sm mt-1">{errors[`task_${idx}`]}</p>
                  )}
                </div>

                {/* Task Description */}
                <div>
                  <textarea
                    placeholder="Task description (optional)"
                    value={task.description}
                    onChange={(e) => updateTask(idx, 'description', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                </div>

                {/* Assign Member */}
                <div>
                  <select
                    value={task.assignedTo}
                    onChange={(e) => updateTask(idx, 'assignedTo', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">👤 Assign member (optional)</option>
                    {allEmployees.length > 0 ? (
                      allEmployees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.role})
                        </option>
                      ))
                    ) : (
                      <option disabled>No employees available</option>
                    )}
                  </select>
                </div>

                {/* Remove Task Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeTask(idx)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    🗑️ Remove Task
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Task Button */}
          <button
            type="button"
            onClick={addTask}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
          >
            ➕ Add Task
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition duration-200 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? '⏳ Creating Project...' : '✅ Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}