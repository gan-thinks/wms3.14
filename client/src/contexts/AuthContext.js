import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true to check existing session

  // Check for existing session on app startup
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('🔍 AuthContext: Checking existing session...');
        
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        console.log('🔍 Stored data:', {
          hasToken: !!savedToken,
          hasUser: !!savedUser,
          tokenPreview: savedToken ? savedToken.substring(0, 20) + '...' : 'No token'
        });

        if (savedToken && savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            
            // ✅ Verify token is still valid by making a test API call
            const response = await fetch('http://localhost:5000/api/employees', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${savedToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              console.log('✅ AuthContext: Token is valid, restoring session');
              setUser(userData);
            } else {
              console.log('❌ AuthContext: Token expired, clearing session');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
            }
          } catch (parseError) {
            console.error('❌ AuthContext: Error parsing stored user data:', parseError);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          console.log('📝 AuthContext: No existing session found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ AuthContext: Error checking session:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        console.log('🏁 AuthContext: Session check completed');
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const register = async (userData) => {
    setLoading(true);
    try {
      console.log('📝 AuthContext: Registering user:', userData.email);
      
      const response = await fetch('http://localhost:5000/api/employees/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ AuthContext: Registration successful');
        return { success: true, data };
      } else {
        console.error('❌ AuthContext: Registration failed:', data);
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      console.log('🔑 AuthContext: Attempting login for:', credentials.email);
      
      const response = await fetch('http://localhost:5000/api/employees/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log('🔑 AuthContext: Login response:', {
        success: data.success,
        hasToken: !!data.token,
        hasEmployee: !!data.employee
      });

      if (response.ok && data.success && data.token && data.employee) {
        // Store user data and token
        setUser(data.employee);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.employee));
        
        console.log('✅ AuthContext: Login successful for:', data.employee.email);
        return { success: true, user: data.employee };
      } else {
        console.error('❌ AuthContext: Login failed:', data.error);
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('❌ AuthContext: Login network error:', error);
      return { success: false, error: 'Network error. Please check if the server is running.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 AuthContext: Logging out user');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  // ✅ Debug log for current state
  console.log('🔄 AuthContext: Current state:', {
    hasUser: !!user,
    loading,
    userEmail: user?.email,
    isAuthenticated: !!user
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;