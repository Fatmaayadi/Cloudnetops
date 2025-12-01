import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }){
  const isAuthenticated = localStorage.getItem('cnops_token')

  // Allow access without authentication for demo mode
  const demoMode = true // Set to true to bypass auth

  if (!isAuthenticated && !demoMode) {
    return <Navigate to="/login" />
  }

  return children
}
