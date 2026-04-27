import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

const API_BASE = process.env.VITE_API_BASE || 'http://localhost:8000';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        axios.get(`${API_BASE}/api/analytics`),
        axios.get(`${API_BASE}/api/history`)
      ])
        .then(([analyticsRes, historyRes]) => {
          setData(analyticsRes.data);
          setHistory(historyRes.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getTrendStatus = (trend) => {
    if (!trend || trend.length < 5) return "→ Stable";
    const latest = trend[trend.length - 1].risk;
    const past = trend[trend.length - 5].risk;
    if (latest > past) return "↑ Increasing Risk";
    if (latest < past) return "↓ Decreasing Risk";
    return "→ Stable";
  };

  if (loading) return <div style={{ color: 'white' }}>Loading...</div>;
  if (!data) return <div style={{ color: 'red' }}>Error loading data</div>;

  const safeData = data.clusters.filter(d => d.cluster === 'Safe');
  const moderateData = data.clusters.filter(d => d.cluster === 'Moderate');
  const riskyData = data.clusters.filter(d => d.cluster === 'Risky');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h3 className="gold-text" style={{ fontSize: '0.9rem', letterSpacing: '2px', marginBottom: '0.5rem' }}>DATA INTELLIGENCE</h3>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Analytics & Clustering</h1>
        </div>
        <div style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--gold-accent)', borderRadius: '4px', color: 'var(--gold-accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>
          ● Live System Intelligence (Auto-updating 10s)
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>System-Wide Risk Trend</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--gold-accent)' }}>
              Trend Status: {data && getTrendStatus(data.trend)}
            </span>
          </h3>
          <p style={{ color: '#888', marginBottom: '1.5rem', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>Live DB Risk Volatility</p>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" tickFormatter={(val) => val.split('-')[2]} />
                <YAxis stroke="#888" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#161616', borderColor: '#333' }} />
                <Line type="monotone" dataKey="risk" stroke="#D4AF37" strokeWidth={2} dot={{ r: 4, fill: '#D4AF37' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Delay Prediction ML Metrics</h3>
          <p style={{ color: '#888', marginBottom: '1rem' }}>Artificial Neural Network Performance</p>

          <div className="grid-3" style={{ marginBottom: 0 }}>
            <div className="metric-card" style={{ padding: '1rem' }}>
              <div className="metric-title">Accuracy</div>
              <div className="metric-value" style={{ fontSize: '2rem' }}>{data.metrics.accuracy}</div>
            </div>
            <div className="metric-card" style={{ padding: '1rem' }}>
              <div className="metric-title">Precision</div>
              <div className="metric-value" style={{ fontSize: '2rem' }}>{data.metrics.precision}</div>
            </div>
            <div className="metric-card" style={{ padding: '1rem' }}>
              <div className="metric-title">Recall</div>
              <div className="metric-value" style={{ fontSize: '2rem' }}>{data.metrics.recall}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>Fleet Risk Clustering</h3>
          <p style={{ color: '#888', marginBottom: '1.5rem' }}>K-Means Classification of Active Shipments</p>

          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" dataKey="distance" name="Transit Distance" unit="km" stroke="#888" />
                <YAxis type="number" dataKey="risk" name="Risk Score" stroke="#888" />
                <ZAxis type="number" range={[50, 50]} />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#161616', borderColor: '#333' }} />
                <Scatter name="Safe" data={safeData} fill="#32CD32" opacity={0.7} />
                <Scatter name="Moderate" data={moderateData} fill="#FFD700" opacity={0.7} />
                <Scatter name="Risky" data={riskyData} fill="#FF4500" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#32CD32' }}></div>
              <span style={{ color: '#888' }}>Safe</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FFD700' }}></div>
              <span style={{ color: '#888' }}>Moderate</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF4500' }}></div>
              <span style={{ color: '#888' }}>Risky</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Live Query Database</span>
          <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(50, 205, 50, 0.1)', color: '#32CD32', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #32CD32' }}>● LIVE SYNC</span>
        </h3>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>Recent routing optimization logs (Max 300 records)</p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#888' }}>
                <th style={{ padding: '0.8rem' }}>Timestamp</th>
                <th style={{ padding: '0.8rem' }}>Route</th>
                <th style={{ padding: '0.8rem' }}>Weather</th>
                <th style={{ padding: '0.8rem' }}>Traffic</th>
                <th style={{ padding: '0.8rem' }}>Selected Path</th>
                <th style={{ padding: '0.8rem' }}>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>No queries in database yet. Run an optimization to generate logs.</td>
                </tr>
              ) : history.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #222', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '0.8rem', color: '#aaa' }}>{row.timestamp}</td>
                  <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{row.source.substring(0, 3).toUpperCase()} → {row.destination.substring(0, 3).toUpperCase()}</td>
                  <td style={{ padding: '0.8rem', textTransform: 'capitalize' }}>{row.weather}</td>
                  <td style={{ padding: '0.8rem', color: row.traffic === 'high' ? 'var(--danger)' : row.traffic === 'medium' ? 'var(--warning)' : 'var(--success)' }}>{row.traffic.toUpperCase()}</td>
                  <td style={{ padding: '0.8rem', color: 'var(--gold-accent)' }}>{row.best_route}</td>
                  <td style={{ padding: '0.8rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: row.risk_score < 40 ? 'rgba(50,205,50,0.1)' : row.risk_score < 70 ? 'rgba(255,215,0,0.1)' : 'rgba(255,68,68,0.1)',
                      color: row.risk_score < 40 ? '#50C878' : row.risk_score < 70 ? '#FFD700' : '#FF4444'
                    }}>
                      {row.risk_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
