import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const Portfolio = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(['In Transit', 'Delayed', 'On Time']);
  const [riskFilter, setRiskFilter] = useState(['LOW', 'MEDIUM', 'HIGH']);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = () => {
    axios.get(`${API_BASE}/api/shipments`)
      .then(res => {
        setData(res.data);
        setLastRefresh(new Date());
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>⚡ Loading live fleet data...</div>;
  if (!data) return <div style={{ color: 'red' }}>Error loading data</div>;

  const filteredShipments = data.shipments.filter(s =>
    statusFilter.includes(s.Status) && riskFilter.includes(s.Risk)
  );

  const highRiskCount = filteredShipments.filter(s => s.Risk === 'HIGH').length;

  const weatherIcon = (w) => {
    const map = { Rain: '🌧️', Thunderstorm: '⛈️', Snow: '❄️', Haze: '🌫️', Clear: '☀️', Clouds: '☁️' };
    return map[w] || '🌡️';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h3 className="gold-text" style={{ fontSize: '0.9rem', letterSpacing: '2px', marginBottom: '0.5rem' }}>FLEET ANALYTICS DASHBOARD</h3>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Supply Chain Portfolio</h1>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#888' }}>
          <span style={{ backgroundColor: 'rgba(50,205,50,0.1)', color: '#32CD32', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #32CD32' }}>
            ● LIVE · Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="grid-3">
        <div className="metric-card">
          <div className="metric-title">Active Units</div>
          <div className="metric-value">{data.kpi.activeUnits}</div>
          <div className="metric-delta positive">Fleet-scale projection</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">High Risk Load</div>
          <div className="metric-value" style={{ color: parseFloat(data.kpi.highRiskLoad) > 30 ? 'var(--danger)' : 'var(--warning)' }}>{data.kpi.highRiskLoad}</div>
          <div className={`metric-delta ${parseFloat(data.kpi.highRiskLoad) < 20 ? 'positive' : 'negative'}`}>
            {data.kpi.highRiskCount} shipments at HIGH risk
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Efficiency Rating</div>
          <div className="metric-value">{data.kpi.efficiencyRating}</div>
          <div className={`metric-delta ${parseFloat(data.kpi.efficiencyRating) > 70 ? 'positive' : 'negative'}`}>
            ML-computed from live conditions
          </div>
        </div>
      </div>

      <hr style={{ borderColor: '#333', margin: '2rem 0' }} />

      <h3 style={{ marginBottom: '1rem' }}>Active Shipments Inventory</h3>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Filter by Status</label>
          <select multiple value={statusFilter} onChange={(e) => setStatusFilter(Array.from(e.target.selectedOptions, o => o.value))} style={{ height: '80px' }}>
            <option value="In Transit">In Transit</option>
            <option value="Delayed">Delayed</option>
            <option value="On Time">On Time</option>
          </select>
        </div>
        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Filter by Risk</label>
          <select multiple value={riskFilter} onChange={(e) => setRiskFilter(Array.from(e.target.selectedOptions, o => o.value))} style={{ height: '80px' }}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
      </div>

      {highRiskCount > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>🚨 ALERT:</strong> {highRiskCount} shipment{highRiskCount > 1 ? 's are' : ' is'} currently at <strong>HIGH RISK</strong>. Immediate rerouting recommended.
          </div>
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#888' }}>
              <th style={{ padding: '0.8rem' }}>ID</th>
              <th style={{ padding: '0.8rem' }}>Route</th>
              <th style={{ padding: '0.8rem' }}>Live Conditions</th>
              <th style={{ padding: '0.8rem' }}>ML Delay Reason</th>
              <th style={{ padding: '0.8rem' }}>Status</th>
              <th style={{ padding: '0.8rem' }}>Risk</th>
              <th style={{ padding: '0.8rem' }}>Score</th>
              <th style={{ padding: '0.8rem' }}>ETA</th>
            </tr>
          </thead>
          <tbody>
            {filteredShipments.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>No shipments match the selected filters.</td>
              </tr>
            ) : filteredShipments.map((s, i) => (
              <tr key={s.ID} style={{ borderBottom: '1px solid #1a1a1a', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '0.8rem', fontFamily: 'monospace', color: 'var(--gold-accent)' }}>{s.ID}</td>
                <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>
                  {s.Origin} <span style={{ color: '#555' }}>→</span> {s.Destination}
                </td>
                <td style={{ padding: '0.8rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span>{weatherIcon(s.Weather)} {s.Weather} · {s.Temp}°C</span>
                    <span style={{ fontSize: '0.78rem', color: s.Traffic === 'High' ? 'var(--danger)' : s.Traffic === 'Medium' ? 'var(--warning)' : 'var(--success)' }}>
                      🚗 Traffic: {s.Traffic}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '0.8rem', fontSize: '0.82rem', color: s.Risk === 'HIGH' ? '#ffaaaa' : s.Risk === 'MEDIUM' ? '#ffe680' : '#aaffaa', maxWidth: '200px' }}>
                  {s.Risk === 'HIGH' ? '⚠️' : s.Risk === 'MEDIUM' ? '🔔' : '✅'} {s.DelayReason}
                </td>
                <td style={{ padding: '0.8rem', color: s.Status === 'Delayed' ? 'var(--danger)' : s.Status === 'On Time' ? 'var(--success)' : '#fff' }}>
                  {s.Status}
                </td>
                <td style={{ padding: '0.8rem' }}>
                  <span style={{
                    padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem',
                    backgroundColor: s.Risk === 'HIGH' ? 'rgba(255,68,68,0.15)' : s.Risk === 'MEDIUM' ? 'rgba(255,215,0,0.15)' : 'rgba(80,200,120,0.15)',
                    color: s.Risk === 'HIGH' ? '#FF4444' : s.Risk === 'MEDIUM' ? '#FFD700' : '#50C878'
                  }}>
                    {s.Risk}
                  </span>
                </td>
                <td style={{ padding: '0.8rem' }}>
                  <span style={{ color: s.Score >= 70 ? 'var(--danger)' : s.Score >= 40 ? 'var(--warning)' : 'var(--success)' }}>
                    {s.Score}
                  </span>
                </td>
                <td style={{ padding: '0.8rem', color: '#888', fontSize: '0.85rem' }}>{s.ETA}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;
