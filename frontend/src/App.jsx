import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import Sidebar from './components/Sidebar';
import Portfolio from './pages/Portfolio';
import RouteOptimization from './pages/RouteOptimization';
import Analytics from './pages/Analytics';
import Simulation from './pages/Simulation';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Portfolio />} />
            <Route path="/route-optimization" element={<RouteOptimization />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/simulation" element={<Simulation />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
