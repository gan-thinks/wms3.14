/* import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

const TaskUpdateModal = ({ task, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: task?.status || 'Not Started',
    hoursWorked: '',
    remarks: '',
    files: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (task) {
      setFormData({
        status: task.status || 'Not Started',
        hoursWorked: '',
        remarks: task.remarks || '',
        files: []
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setFormData(prev => ({
      ...prev,
      files: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('status', formData.status);
      formDataToSend.append('remarks', formData.remarks);
      formDataToSend.append('hoursWorked', formData.hoursWorked);
      
      // Append files if any
      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      console.log('🚀 Updating task:', task._id, 'Project:', task.projectId);

      const response = await fetch(`http://localhost:5000/api/projects/${task.projectId}/tasks/${task._id}/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      console.log('📡 Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update task`);
      }

      const data = await response.json();
      console.log('✅ Task updated successfully:', data);
      
      alert('Task updated successfully!');
      onSuccess(data.task);
      onClose();
    } catch (err) {
      console.error('❌ Update task error:', err);
      alert(`Failed to update task: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
       
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Update Task Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900">{task.title}</h3>
          {task.projectName && (
            <p className="text-sm text-gray-600">Project: {task.projectName}</p>
          )}
        </div>
      //forms 
        <form onSubmit={handleSubmit} className="space-y-4">
          // Status 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          // Hours Worked
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hours Worked (Today)
            </label>
            <input
              type="number"
              name="hoursWorked"
              value={formData.hoursWorked}
              onChange={handleChange}
              min="0"
              step="0.5"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          // Remarks
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks / Comments
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              placeholder="Add your comments about the progress..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          // File Upload 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Files (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Selected files:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="text-xs text-gray-500">
                    • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                ))}
              </div>
            )}
          </div>

          // Buttons
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskUpdateModal;

*/

import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

const TaskUpdateModal = ({ task, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: task?.status || 'Not Started',
    progress: task?.progress || 0,
    hoursWorked: '',
    remarks: '',
    files: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (task) {
      setFormData({
        status: task.status || 'Not Started',
        progress: task.progress || 0,
        hoursWorked: '',
        remarks: task.remarks || '',
        files: []
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-update progress based on status
    if (name === 'status') {
      let autoProgress = formData.progress;
      switch (value) {
        case 'Not Started':
          autoProgress = 0;
          break;
        case 'In Progress':
          autoProgress = formData.progress > 0 ? formData.progress : 25;
          break;
        case 'Completed':
          autoProgress = 100;
          break;
        case 'On Hold':
          // Keep current progress
          break;
      }
      setFormData(prev => ({
        ...prev,
        [name]: value,
        progress: autoProgress
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setFormData(prev => ({
      ...prev,
      files: files
    }));
  };

  const getProjectIdFromUrl = () => {
    // Extract project ID from current URL path
    const pathParts = window.location.pathname.split('/');
    const projectIndex = pathParts.indexOf('projects');
    if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
      return pathParts[projectIndex + 1];
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get project ID from URL or task object
      const projectId = task.projectId || getProjectIdFromUrl();
      
      if (!projectId) {
        throw new Error('Project ID not found. Please refresh the page and try again.');
      }

      console.log('🚀 Updating task progress:', {
        projectId,
        taskId: task._id,
        formData: formData
      });

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('status', formData.status);
      formDataToSend.append('progress', formData.progress.toString());
      formDataToSend.append('remarks', formData.remarks);
      formDataToSend.append('hoursWorked', formData.hoursWorked || '0');
      
      // Append files if any
      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      const apiUrl = `http://localhost:5000/api/projects/${projectId}/tasks/${task._id}/update`;
      console.log('📡 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST', // Your backend uses POST for this endpoint
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type header when using FormData
        },
        body: formDataToSend
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Failed to update task`);
      }

      const data = await response.json();
      console.log('✅ Task updated successfully:', data);
      
      alert('Task updated successfully!');
      if (onSuccess) {
        onSuccess(data.task || data);
      }
      onClose();
    } catch (err) {
      console.error('❌ Update task error:', err);
      alert(`Failed to update task: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Update Task Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Task Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900">{task.title}</h3>
          {task.projectName && (
            <p className="text-sm text-gray-600">Project: {task.projectName}</p>
          )}
          <p className="text-xs text-gray-500">Task ID: {task._id}</p>
          <p className="text-xs text-gray-500">Current Status: {task.status}</p>
          <p className="text-xs text-gray-500">Current Progress: {task.progress || 0}%</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              required
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Progress (%)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                name="progress"
                value={formData.progress}
                onChange={handleChange}
                min="0"
                max="100"
                className="flex-1"
                disabled={loading}
              />
              <span className="text-sm text-gray-600 min-w-[40px]">
                {formData.progress}%
              </span>
            </div>
            <input
              type="number"
              name="progress"
              value={formData.progress}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Hours Worked */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hours Worked (Today)
            </label>
            <input
              type="number"
              name="hoursWorked"
              value={formData.hoursWorked}
              onChange={handleChange}
              min="0"
              step="0.5"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks / Comments
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              placeholder="Add your comments about the progress..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Files (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Selected files:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="text-xs text-gray-500 flex items-center justify-between">
                    <span>• {file.name}</span>
                    <span>({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Bar Visual */}
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${formData.progress}%` }}
            />
          </div>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-2 bg-yellow-50 rounded text-xs">
              <strong>Debug Info:</strong><br/>
              Task ID: {task._id}<br/>
              Project ID: {task.projectId || getProjectIdFromUrl() || 'Not found'}<br/>
              Current Status: {task.status}<br/>
              URL Path: {window.location.pathname}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </span>
              ) : (
                'Update Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskUpdateModal;