// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 1. Define the shape of your user and context data
// This is crucial for TypeScript to provide type safety
interface User {
  id: string;
  name: string;
  role: 'user' | 'admin'; // Use a union type for roles
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// 2. Create the context with a default value
// It's good practice to provide an initial value that matches the context type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the provider component
// This component will hold the state and provide it to all its children
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // A derived state to easily check if a user is logged in
  const isAuthenticated = !!user;

  // In a real application, you'd check for a token in localStorage here
  // to persist the user's login state across page reloads.
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData: User) => {
    // In a real app, you would save the user data or a token to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    // Remove the user data from localStorage and clear the state
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Create a custom hook for easy consumption
// This hook adds an error check to ensure it's used within a provider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};