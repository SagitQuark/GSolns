import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const API_BASE = 'http://localhost:8000';

// Inner component that controls the heat layer
function HeatLayer({ points }) {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Remove previous layer
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
    }

    const heatData = points.map(p => [p.lat, p.lon, p.weight]);

    heatRef.current = L.heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 8,
      max: 1.0,
      gradient: { 0.2: '#00ff00', 0.5: '#ffff00', 0.8: '#ff8800', 1.0: '#ff0000' }
    }).addTo(map);

    return () => {
      if (heatRef.current) map.removeLayer(heatRef.current);
    };
  }, [points, map]);

  return null;
}

const Simulation = () => {
  const [weather, setWeather] = useState('clear');
  const [traffic, setTraffic] = useState('medium');
  const [temp, setTemp] = useState(22);
  const [hour, setHour] = useState(14);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = () => {
    setLoading(true);
    axios.post(`${API_BASE}/api/simulate`, { weather, traffic, temp, hour })
      .then(res => {
        setResult(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather, traffic, temp, hour]);

  const riskColor = result
    ? result.risk_score < 30 ? 'var(--success)' : result.risk_score < 70 ? 'var(--warning)' : 'var(--danger)'
    : '#888';

  return (
    <div>
      <h3 className="gold-text" style={{ fontSize: '0.9rem', letterSpacing: '2px', marginBottom: '0.5rem' }}>PREDICTIVE INTELLIGENCE</h3>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>Risk Intelligence Simulation</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>System-wide environmental predictive scoring across Indian logistics hubs.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Panel */}
        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>Scenario Parameters</h3>
          <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Adjust parameters to forecast network risk.</p>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="input-group">
              <label>Environmental Conditions</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {['clear', 'rain', 'snow', 'thunderstorm'].map(w => (
                  <label key={w} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                    <input type="radio" name="weather" checked={weather === w} onChange={() => setWeather(w)} />
                    {w.charAt(0).toUpperCase() + w.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Traffic Intensity ({traffic})</label>
              <input type="range" min="0" max="2" value={['low', 'medium', 'high'].indexOf(traffic)} onChange={(e) => setTraffic(['low', 'medium', 'high'][e.target.value])} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.8rem' }}>
                <span>Low</span><span>Medium</span><span>High</span>
              </div>
            </div>

            <div className="input-group">
              <label>Ambient Temperature (°C): {temp}</label>
              <input type="range" min="-10" max="45" value={temp} onChange={(e) => setTemp(parseInt(e.target.value))} />
            </div>

            <div className="input-group">
              <label>Time Window (Hour): {hour}:00</label>
              <input type="range" min="0" max="23" value={hour} onChange={(e) => setHour(parseInt(e.target.value))} />
            </div>
          </div>

          {loading ? (
            <p style={{ color: '#D4AF37' }}>⚡ Simulating Network Impact...</p>
          ) : result && (
            <>
              <h3 style={{ marginBottom: '1rem' }}>Projected Network Impact</h3>
              <div className="metric-card" style={{ marginBottom: '1.5rem' }}>
                <div className="metric-title">System Risk Allocation</div>
                <div className="metric-value" style={{ color: riskColor }}>{result.risk_score}%</div>
                <div className={`metric-delta ${result.risk_score < 50 ? 'positive' : 'negative'}`}>
                  {result.risk_score < 50 ? '-0.4% from baseline' : '+2.1% from baseline'}
                </div>
              </div>

              {result.risk_score < 30 ? (
                <div className="alert alert-success">🟢 LOW EXPOSURE — Normal Logistics Protocol</div>
              ) : result.risk_score < 70 ? (
                <div className="alert alert-warning">🟡 MEDIUM EXPOSURE — Standard Asset Protection</div>
              ) : (
                <div className="alert alert-danger">🔴 HIGH EXPOSURE — Trigger FINRA Continuity Plan</div>
              )}

              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid #333', fontSize: '0.85rem' }}>
                <div style={{ color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Heatmap Legend</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#00ff00' }}></div><span style={{ color: '#aaa' }}>Low Risk Zone</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffff00' }}></div><span style={{ color: '#aaa' }}>Moderate Risk Zone</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff8800' }}></div><span style={{ color: '#aaa' }}>High Risk Zone</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff0000' }}></div><span style={{ color: '#aaa' }}>Critical Risk Zone</span></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Panel — Real Leaflet Heatmap */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>National Risk Density Heatmap</h3>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>India Logistics Network · 12 Major Hubs</span>
          </div>
          <div style={{ height: '600px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              />
              {result && <HeatLayer points={result.heatmap} />}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
