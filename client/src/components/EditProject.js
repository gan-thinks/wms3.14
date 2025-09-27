import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [project, setProject] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [file, setFile] = useState(null);
  
  useEffect(() => {
    // Get current user info
    const userInfo = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(userInfo);
    
    fetchProject();
    fetchEmployees();
  }, [id]);
  
  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/projects/${id}/edit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const projectData = response.data;
      setProject(projectData);
      setName(projectData.name);
      setDescription(projectData.description || '');
      setProgress(projectData.progress || 0);
      setSelectedMembers(projectData.members.map(m => m._id));
    } catch (err) {
      console.error('Error fetching project:', err);
      if (err.response?.status === 404) {
        alert('Project not found');
        navigate('/projects');
      } else if (err.response?.status === 403) {
        alert('You do not have permission to edit this project');
        navigate('/projects');
      }
    }
  };
  
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/employees/list/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name: name.trim(),
        description: description.trim(),
        progress: parseInt(progress),
        members: selectedMembers
      };
      
      if (remark.trim()) {
        updateData.remark = remark.trim();
      }
      
      await axios.put(`/api/projects/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Project updated successfully!');
      navigate(`/projects/${id}`);
    } catch (err) {
      console.error('Error updating project:', err);
      if (err.response?.data?.error) {
        alert(`Error: ${err.response.data.error}`);
      } else {
        alert('Failed to update project');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/projects/${id}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('File uploaded successfully!');
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      alert('File upload failed');
    }
  };
  
  if (!project) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }
  
  const isCreator = user && project.createdBy._id === user._id;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Edit Project</h1>
            <p className="text-gray-600 mt-1">Update project details and track progress</p>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!isCreator}
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  disabled={!isCreator}
                />
              </div>
              
              {/* Progress */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress (%)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                    className="flex-1"
                    disabled={!isCreator}
                  />
                  <span className="text-lg font-semibold text-blue-600 w-16">
                    {progress}%
                  </span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Team Members */}
              {isCreator && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Members
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                    {allEmployees.map(employee => (
                      <label key={employee._id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(employee._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, employee._id]);
                            } else {
                              setSelectedMembers(selectedMembers.filter(id => id !== employee._id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {employee.firstName} {employee.lastName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Progress Update & Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress Update & Remarks
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Describe what you've accomplished, any challenges faced, or next steps..."
                />
              </div>
              
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Progress Files (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={!file}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
                  >
                    Upload
                  </button>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate(`/projects/${id}`)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {loading ? 'Updating...' : 'Update Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


