import React, { useState } from 'react';
import { X, MessageSquare, Upload, Percent } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TaskUpdateModal = ({ task, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: task.status,
    progress: task.progress || 0,
    hoursWorked: '',
    remarks: '',
    files: []
  });
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('status', formData.status);
      formDataToSend.append('progress', formData.progress);
      formDataToSend.append('hoursWorked', formData.hoursWorked || 0);
      formDataToSend.append('remarks', formData.remarks);
      
      // Append files
      formData.files.forEach(file => {
        formDataToSend.append('files', file);
      });

      const response = await fetch(`http://localhost:5000/api/tasks/${task._id}/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        alert('Task updated successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Update Task Progress</h2>
            <p className="text-gray-600 mt-1">{task.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Status</span>
              <Badge className={`${
                task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                task.status === 'On Hold' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">{task.progress || 0}% complete</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Update */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            {/* Progress Update */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="h-4 w-4 inline mr-1" />
                Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Hours Worked */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Worked (Today)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.hoursWorked}
                onChange={(e) => setFormData(prev => ({ ...prev, hoursWorked: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Remarks / Comments
            </label>
            <textarea
              rows={4}
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add your comments about the progress..."
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="h-4 w-4 inline mr-1" />
              Upload Files (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
            />
            
            {/* File List */}
            {formData.files.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Updating...' : 'Update Progress'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskUpdateModal;
