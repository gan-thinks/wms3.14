import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Edit } from 'lucide-react';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [employeeProjects, setEmployeeProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [employeeRes, analyticsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/employees/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/projects/analytics/employee/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (employeeRes.ok) {
        const empData = await employeeRes.json();
        setEmployee(empData);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setEmployeeProjects(analyticsData.projects || []);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/team-overview')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Employee Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-blue-500 h-32"></div>
          <div className="relative px-6 pb-6">
            <div className="flex items-end -mt-16">
              <div className="h-32 w-32 bg-white rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-blue-500">
                  {employee?.firstName?.[0]}{employee?.lastName?.[0]}
                </span>
              </div>
              <div className="ml-6 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {employee?.firstName} {employee?.lastName}
                </h2>
                <p className="text-gray-600">{employee?.role} • {employee?.department}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span>{employee?.email}</span>
                  </div>
                  {employee?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span>Joined {new Date(employee?.hireDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Work Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Position</span>
                    <p className="font-medium">{employee?.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Employment Type</span>
                    <p className="font-medium">{employee?.employmentType}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      employee?.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employee?.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Projects</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employeeProjects.map(project => (
                <div key={project._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <h4 className="font-medium">{project.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{project.overallProgress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{width: `${project.overallProgress || 0}%`}}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                    <button 
                      onClick={() => navigate(`/projects/${project._id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
