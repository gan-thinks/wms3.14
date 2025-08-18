/*import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CreateProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get('/api/employees/list/all', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAllEmployees(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('Error fetching employees', err));
  }, []);

  const addTask = () =>
    setTasks((prev) => [...prev, { title: '', description: '', assignedTo: '' }]);

  const updateTask = (idx, field, value) =>
    setTasks((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t))
    );

  const removeTask = (idx) =>
    setTasks((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    const err = {};
    if (!name.trim()) err.name = 'Project name is required';
    tasks.forEach((t, i) => {
      if (!t.title.trim()) err[`task_${i}`] = 'Task title required';
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        name,
        description,
        tasks,
      };
      await axios.post('/api/projects', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoading(false);
      alert('Project created!');
      navigate('/projects');
    } catch (err) {
      setLoading(false);
      console.error('Create project error', err.response?.data || err);
      alert('Failed to create project. See console.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create Project</h2>
      <form onSubmit={handleSubmit}>
        <label className="block">Project Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full mb-3"
          required
        />
        {errors.name && <div className="text-red-600">{errors.name}</div>}

        <label className="block">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full mb-3"
        />

        <h3 className="text-lg font-semibold mb-2">Project Tasks</h3>
        {tasks.map((task, idx) => (
          <div key={idx} className="border p-3 rounded mb-3">
            <input
              className="border p-2 w-full mb-2"
              placeholder="Task title"
              value={task.title}
              onChange={(e) => updateTask(idx, 'title', e.target.value)}
              required
            />
            {errors[`task_${idx}`] && (
              <div className="text-red-600">{errors[`task_${idx}`]}</div>
            )}
            <textarea
              className="border p-2 w-full mb-2"
              placeholder="Task description"
              value={task.description}
              onChange={(e) => updateTask(idx, 'description', e.target.value)}
            />
            <select
              value={task.assignedTo}
              onChange={(e) => updateTask(idx, 'assignedTo', e.target.value)}
              className="border p-2 w-full mb-2"
            >
              <option value="">Assign Member (optional)</option>
              {allEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeTask(idx)}
                className="text-red-600"
              >
                Remove task
              </button>
            </div>
          </div>
        ))}

        <div className="mb-4">
          <button
            type="button"
            onClick={addTask}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            + Add Task
          </button>
        </div>
        <div>
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded w-full"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
*/
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CreateProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch employee list for task assignment
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

  const validate = () => {
    const err = {};
    if (!name.trim()) err.name = 'Project name is required';
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create Project</h2>
      <form onSubmit={handleSubmit}>
        <label className="block">Project Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full mb-3"
          required
        />
        {errors.name && <div className="text-red-600">{errors.name}</div>}

        <label className="block">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full mb-3"
        />

        <h3 className="text-lg font-semibold mb-2">Project Tasks</h3>
        {tasks.map((task, idx) => (
          <div key={idx} className="border p-3 rounded mb-3">
            <input
              className="border p-2 w-full mb-2"
              placeholder="Task title"
              value={task.title}
              onChange={(e) => updateTask(idx, 'title', e.target.value)}
              required
            />
            {errors[`task_${idx}`] && (
              <div className="text-red-600">{errors[`task_${idx}`]}</div>
            )}
            <textarea
              className="border p-2 w-full mb-2"
              placeholder="Task description"
              value={task.description}
              onChange={(e) => updateTask(idx, 'description', e.target.value)}
            />
            <select
              value={task.assignedTo}
              onChange={(e) => updateTask(idx, 'assignedTo', e.target.value)}
              className="border p-2 w-full mb-2"
            >
              <option value="">Assign Member (optional)</option>
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
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeTask(idx)}
                className="text-red-600"
              >
                Remove task
              </button>
            </div>
          </div>
        ))}

        <div className="mb-4">
          <button
            type="button"
            onClick={addTask}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            + Add Task
          </button>
        </div>
        <div>
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded w-full"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
