import React, { useState } from 'react';
import { X, Upload, File, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const FileUploadModal = ({ projectId, onClose, onSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const token = localStorage.getItem('token');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);

        const response = await fetch('http://localhost:5000/api/files/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          setUploadProgress(prev => ({ ...prev, [i]: 100 }));
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      alert('All files uploaded successfully!');
      onSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading files: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Upload Files</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.txt"
            />
            <p className="text-sm text-gray-500 mt-1">
              Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP, TXT
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Selected Files</h3>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {uploadProgress[index] === 100 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                    ) : (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={uploadFiles} 
              disabled={files.length === 0 || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
