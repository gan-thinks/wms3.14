/*
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    phone: '',
    gender: '',
    department: '',
    position: '',
    employmentType: 'Full-time'
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...submitData } = formData;
      
      console.log('Submitting registration:', { ...submitData, password: '[HIDDEN]' });
      
      const result = await register(submitData);
      
      if (result && result.success) {
        setSuccess('Registration successful! Redirecting to login...');
        console.log('Registration successful for:', submitData.email);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errorMessage = result?.error || result?.message || 'Registration failed. Please try again.';
        setError(errorMessage);
        console.error('Registration failed:', errorMessage);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '10px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px'
  };

  const containerStyle = {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        Employee Registration
      </h2>
      
      {error && (
        <div style={{
          color: '#d32f2f',
          backgroundColor: '#ffebee',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #ffcdd2'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{
          color: '#2e7d32',
          backgroundColor: '#e8f5e8',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #c8e6c9'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
              style={inputStyle}
              placeholder="Enter first name"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
              style={inputStyle}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            style={inputStyle}
            placeholder="Enter email address"
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
              placeholder="Enter phone number"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              style={inputStyle}
              placeholder="Enter password (min 6 chars)"
              minLength="6"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              style={inputStyle}
              placeholder="Confirm password"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
              placeholder="Enter department"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Position</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
              placeholder="Enter position"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Employment Type</label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '15px'
          }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#666' }}>
            Already have an account?{' '}
            <Link 
              to="/login" 
              style={{ color: '#2196F3', textDecoration: 'none' }}
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
*/
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    phone: '',
    gender: '',
    department: '',
    position: '',
    employmentType: 'Full-time',
    manager: ''
  });
  
  const [managers, setManagers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // Department options
  const departments = [
    "Development", 
    "Finance", 
    "Design", 
    "Social Media", 
    "Human Resources", 
    "Marketing", 
    "Sales", 
    "Operations", 
    "Customer Support",
    "Quality Assurance",
    "Business Development",
    "Administration"
  ];

  // Position suggestions based on department
  const positionsByDepartment = {
    "Development": ["Software Developer", "Senior Developer", "Tech Lead", "DevOps Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer"],
    "Finance": ["Financial Analyst", "Accountant", "Finance Manager", "Budget Analyst", "Tax Specialist"],
    "Design": ["UI/UX Designer", "Graphic Designer", "Product Designer", "Creative Director", "Visual Designer"],
    "Social Media": ["Social Media Manager", "Content Creator", "Community Manager", "Digital Marketing Specialist"],
    "Human Resources": ["HR Manager", "Recruiter", "HR Business Partner", "Training Specialist", "Compensation Analyst"],
    "Marketing": ["Marketing Manager", "Marketing Specialist", "Brand Manager", "Digital Marketer", "Content Marketer"],
    "Sales": ["Sales Representative", "Sales Manager", "Account Executive", "Business Development Representative"],
    "Operations": ["Operations Manager", "Process Analyst", "Operations Specialist", "Supply Chain Manager"],
    "Customer Support": ["Support Representative", "Customer Success Manager", "Support Team Lead", "Technical Support"],
    "Quality Assurance": ["QA Engineer", "QA Manager", "Test Automation Engineer", "Quality Analyst"],
    "Business Development": ["Business Development Manager", "Partnership Manager", "Strategy Analyst"],
    "Administration": ["Administrative Assistant", "Office Manager", "Executive Assistant", "Facilities Manager"]
  };

  // Fetch managers when department changes
  useEffect(() => {
    const fetchManagers = async () => {
      if (formData.department && formData.role === 'employee') {
        try {
          const response = await fetch(`http://localhost:5000/api/employees/managers/${formData.department}`);
          
          if (response.ok) {
            const managersData = await response.json();
            setManagers(managersData);
          } else {
            console.log('Could not fetch managers - response not ok');
            setManagers([]);
          }
        } catch (err) {
          console.log('Could not fetch managers - network error:', err);
          setManagers([]);
        }
      } else {
        setManagers([]);
        setFormData(prev => ({ ...prev, manager: '' }));
      }
    };

    fetchManagers();
  }, [formData.department, formData.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear manager when role changes to manager or admin
    if (name === 'role' && (value === 'manager' || value === 'admin')) {
      setFormData(prev => ({ ...prev, manager: '' }));
    }
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.department) {
      setError('Department is required');
      return false;
    }
    if (!formData.position.trim()) {
      setError('Position is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...submitData } = formData;
      
      console.log('Submitting registration:', { ...submitData, password: '[HIDDEN]' });
      
      const result = await register(submitData);
      
      if (result && result.success) {
        setSuccess('Registration successful! Redirecting to login...');
        console.log('Registration successful for:', submitData.email);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errorMessage = result?.error || result?.message || 'Registration failed. Please try again.';
        setError(errorMessage);
        console.error('Registration failed:', errorMessage);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease',
    fontFamily: 'inherit'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151'
  };

  const containerStyle = {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid #f1f5f9'
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px' }}>
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            marginBottom: '8px' 
          }}>
            Join Our Team
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Create your employee account to get started
          </p>
        </div>
        
        {error && (
          <div style={{
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #fecaca',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}
        
        {success && (
          <div style={{
            color: '#16a34a',
            backgroundColor: '#f0fdf4',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #bbf7d0',
            fontSize: '14px'
          }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
              Personal Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  style={inputStyle}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={labelStyle}>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={loading}
                style={inputStyle}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Work Information */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
              Work Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Position *</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                  placeholder="Enter position"
                  list="positions"
                />
                {formData.department && (
                  <datalist id="positions">
                    {positionsByDepartment[formData.department]?.map(pos => (
                      <option key={pos} value={pos} />
                    ))}
                  </datalist>
                )}
              </div>
              <div>
                <label style={labelStyle}>Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  disabled={loading}
                  style={inputStyle}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>

            {/* Manager Selection - Only for Employees */}
            {formData.role === 'employee' && formData.department && (
              <div>
                <label style={labelStyle}>
                  Reporting Manager {managers.length > 0 ? '*' : '(No managers found)'}
                </label>
                <select
                  name="manager"
                  value={formData.manager}
                  onChange={handleChange}
                  disabled={loading || managers.length === 0}
                  style={inputStyle}
                >
                  <option value="">Select Manager</option>
                  {managers.map(manager => (
                    <option key={manager._id} value={manager._id}>
                      {manager.firstName} {manager.lastName} - {manager.position}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Security */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
              Security
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                  placeholder="Enter password (min 6 chars)"
                  minLength="6"
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: loading ? '#9ca3af' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            {loading ? (
              <span>
                <span style={{ marginRight: '8px' }}>⏳</span>
                Creating Account...
              </span>
            ) : (
              <span>
                <span style={{ marginRight: '8px' }}>🚀</span>
                Create Account
              </span>
            )}
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#4f46e5', 
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;