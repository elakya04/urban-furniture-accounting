import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Store authenticated user state (default null so user lands on login page)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('uf_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (email, role = 'ADMIN', name = '') => {
    const userMap = {
      ADMIN: { _id: 'user_1', name: name || 'System Admin', email, role: 'ADMIN' },
      ACCOUNTANT: { _id: 'user_2', name: name || 'Chief Accountant', email, role: 'ACCOUNTANT' },
      CUSTOMER: { _id: 'user_3', name: name || 'Mr Raj (Customer)', email, role: 'CONTACT', contact_id: 'CUSTOMER' },
      VENDOR: { _id: 'user_4', name: name || 'Mr Rahul (Vendor)', email, role: 'CONTACT', contact_id: 'VENDOR' }
    };
    const user = userMap[role] || { _id: `user_${Date.now()}`, name: name || email.split('@')[0], email, role };
    setCurrentUser(user);
    localStorage.setItem('uf_user', JSON.stringify(user));
    return user;
  };

  const register = (data) => {
    const user = {
      _id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role || 'CONTACT',
      contact_id: data.contact_id || 'CUSTOMER'
    };
    setCurrentUser(user);
    localStorage.setItem('uf_user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('uf_user');
  };

  const switchRole = (newRole) => {
    if (!currentUser) return;
    login(currentUser.email, newRole, currentUser.name);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: Boolean(currentUser), login, register, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

