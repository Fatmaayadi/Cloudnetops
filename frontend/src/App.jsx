import React, { useState } from 'react'
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import EC2 from './components/EC2'
import S3 from './components/S3'
import Monitoring from './components/Monitoring'
import AI from './components/AI'
import Prometheus from './components/Prometheus'
import Grafana from './components/Grafana'
import PrivateRoute from './components/PrivateRoute'
import KubernetesInterface from './components/KubernetesInterface'

export default function App(){
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const hideSidebar = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/kubernetes'

  function logout() {
    localStorage.removeItem('cnops_token')
    navigate('/')
  }

  return (
    <div className="app-root">
      {!hideSidebar && (
        <aside className={`sidebar fade-in ${collapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-brand">
            <div className="brand-small">☁️</div>
            <div className="brand-title">CloudNetOps</div>
            <button 
              className="sidebar-toggle" 
              onClick={() => setCollapsed(!collapsed)} 
              aria-label="Toggle sidebar"
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
              <img src="/assets/icons/dashboard.svg" className="nav-icon" alt=""/>
              <span className="nav-text">Dashboard</span>
            </NavLink>
            <NavLink to="/ec2" className={({isActive}) => isActive ? 'active' : ''}>
              <img src="/assets/icons/ec2.svg" className="nav-icon" alt=""/>
              <span className="nav-text">EC2</span>
            </NavLink>
            <NavLink to="/s3" className={({isActive}) => isActive ? 'active' : ''}>
              <img src="/assets/icons/s3.svg" className="nav-icon" alt=""/>
              <span className="nav-text">S3</span>
            </NavLink>
            <NavLink to="/monitor" className={({isActive}) => isActive ? 'active' : ''}>
              <img src="/assets/icons/cloudwatch.svg" className="nav-icon" alt=""/>
              <span className="nav-text">CloudWatch</span>
            </NavLink>
            <NavLink to="/ai" className={({isActive}) => isActive ? 'active' : ''}>
              <img src="/assets/icons/ai.svg" className="nav-icon" alt=""/>
              <span className="nav-text">AI</span>
            </NavLink>
            <NavLink to="/prometheus" className={({isActive}) => isActive ? 'active' : ''}>
              <img src="/assets/icons/prometheus.svg" className="nav-icon" alt=""/>
              <span className="nav-text">Prometheus</span>
            </NavLink>
            <NavLink to="/grafana" className={({isActive}) => isActive ? 'active' : ''}>
              <img src="/assets/icons/grafana.svg" className="nav-icon" alt=""/>
              <span className="nav-text">Grafana</span>
            </NavLink>
          </nav>
          
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={logout}>
              <span className="nav-icon">🚪</span>
              <span className="nav-text">Déconnexion</span>
            </button>
          </div>
        </aside>
      )}

      <main className={`main-content ${hideSidebar ? 'no-sidebar' : ''}`}>
        <Routes>
          
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<KubernetesInterface />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>} />
          <Route path="/ec2" element={<PrivateRoute><EC2/></PrivateRoute>} />
          <Route path="/s3" element={<PrivateRoute><S3/></PrivateRoute>} />
          <Route path="/monitor" element={<PrivateRoute><Monitoring/></PrivateRoute>} />
          <Route path="/ai" element={<PrivateRoute><AI/></PrivateRoute>} />
          <Route path="/prometheus" element={<PrivateRoute><Prometheus/></PrivateRoute>} />
          <Route path="/grafana" element={<PrivateRoute><Grafana/></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}