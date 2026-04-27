import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Map as MapIcon, BarChart3, FlaskConical } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div>
        <h2 className="gold-text">LOGIRISK AI</h2>
        <hr style={{ borderColor: '#333', margin: '1rem 0' }} />
      </div>

      <div className="sidebar-nav">
        <h4 style={{ color: '#888', marginBottom: '0.5rem' }}>Navigation</h4>

        <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Building2 size={20} />
          <span>Portfolio Dashboard</span>
        </NavLink>

        <NavLink to="/route-optimization" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <MapIcon size={20} />
          <span>Route Optimization</span>
        </NavLink>

        <NavLink to="/analytics" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <BarChart3 size={20} />
          <span>Analytics & Clustering</span>
        </NavLink>

        <NavLink to="/simulation" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FlaskConical size={20} />
          <span>Risk Simulation</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
