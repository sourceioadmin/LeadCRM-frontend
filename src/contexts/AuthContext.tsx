import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/User';
import { isTokenExpired } from '../utils/jwtUtils';
import { getCurrentUserProfile } from '../services/userService';

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing auth token on app load
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');

      if (token && userData) {
        // Check if token is expired
        if (isTokenExpired(token)) {
          console.log('Token expired, clearing auth data');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setUser(null);
        } else {
          try {
            const parsedUser = JSON.parse(userData);

            // If user data is missing roleName, try to refresh it from the server
            if (!parsedUser.roleName && parsedUser.userId) {
              try {
                const profileResponse = await getCurrentUserProfile();
                if (profileResponse.success && profileResponse.data) {
                  const updatedUser = { ...parsedUser, ...profileResponse.data };
                  localStorage.setItem('userData', JSON.stringify(updatedUser));
                  setUser(updatedUser);
                } else {
                  // Silently use cached data if profile fetch fails
                  setUser(parsedUser);
                }
              } catch (profileError) {
                // Silently use cached data if profile fetch fails - don't show error toasts during auth initialization
                console.log('Profile fetch failed during auth init, using cached data:', profileError);
                setUser(parsedUser);
              }
            } else {
              setUser(parsedUser);
            }
          } catch (error) {
            // Invalid user data, clear storage
            console.log('Invalid user data, clearing auth data');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setUser(null);
          }
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
