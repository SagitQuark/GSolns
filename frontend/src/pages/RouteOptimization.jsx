import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';

const API_BASE = 'http://localhost:8000';

const RouteOptimization = () => {
  const [source, setSource] = useState('Delhi');
  const [destination, setDestination] = useState('Mumbai');
  const [lambdaValue, setLambdaValue] = useState(1.0);

  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const estimateTraffic = (hour) => {
    if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)) return "high";
    if (hour > 11 && hour < 17) return "medium";
    return "low";
  };

  const currentTraffic = estimateTraffic(currentTime.getHours());

  const [result, setResult] = useState(null);
  const [originalResult, setOriginalResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [exploreMode, setExploreMode] = useState(false);
  const [rerouteSuccess, setRerouteSuccess] = useState(false);

  const [viewState, setViewState] = useState({
    longitude: 77.2090, // default close to India
    latitude: 28.6139,
    zoom: 4,
    pitch: 45,
    bearing: 0
  });

  const runOptimization = () => {
    setLoading(true);
    setError('');

    axios.post(`${API_BASE}/api/optimize`, {
      source,
      destination,
      traffic: currentTraffic,
      lambda_value: parseFloat(lambdaValue)
    })
      .then(res => {
        setOriginalResult(res.data);

        // Auto adjust map view based on source and destination coords
        const src = res.data.source_coords;
        const dest = res.data.dest_coords;

        if (src && dest) {
          setViewState({
            ...viewState,
            longitude: (src[0] + dest[0]) / 2,
            latitude: (src[1] + dest[1]) / 2,
            zoom: 5
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.detail || 'An error occurred during optimization.');
        setLoading(false);
      });
  };

  React.useEffect(() => {
    if (originalResult) {
      const updatedRoutes = originalResult.all_routes.map(r => {
        const score = r.duration + (parseFloat(lambdaValue) * r.risk_score);
        return { ...r, total_score: score };
      });
      const best = updatedRoutes.reduce((prev, current) => (prev.total_score < current.total_score) ? prev : current);

      setResult({
        ...originalResult,
        all_routes: updatedRoutes,
        best_route: best
      });

      const bestIdx = updatedRoutes.findIndex(r => r.name === best.name);
      setSelectedRouteIdx(bestIdx !== -1 ? bestIdx : 0);
    }
  }, [lambdaValue, originalResult]);

  const executeReroute = () => {
    setRerouteSuccess(true);
    setTimeout(() => setRerouteSuccess(false), 5000);
  };



  return (
    <div>
      <h3 className="gold-text" style={{ fontSize: '0.9rem', letterSpacing: '2px', marginBottom: '0.5rem' }}>STRATEGIC PLANNING</h3>
      <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>Route Optimization Map</h1>

      <div className="grid-3">
        <div className="input-group">
          <label>Source Location</label>
          <input type="text" value={source} onChange={e => setSource(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Destination Location</label>
          <input type="text" value={destination} onChange={e => setDestination(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Live Telemetry</label>
          <div style={{ padding: '0.8rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#888' }}>Time (System):</span>
              <span className="gold-text">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#888' }}>Traffic (Est):</span>
              <span style={{ color: currentTraffic === 'high' ? 'var(--danger)' : currentTraffic === 'medium' ? 'var(--warning)' : 'var(--success)', fontWeight: 'bold' }}>
                {currentTraffic.toUpperCase()} {currentTraffic === 'high' ? '🚗🚗' : currentTraffic === 'medium' ? '🚗' : '🟢'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
              <span style={{ color: '#888' }}>Weather (API):</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>
                {result ? `${result.best_route.weather.toUpperCase()} ${Math.round(result.best_route.temp)}°C ☁️` : 'AWAITING SYNC...'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '0.3rem', borderTop: '1px dashed #333' }}>
              <span style={{ color: '#888' }}>Model Updated:</span>
              <span className="gold-text">
                {result && result.ml_state ? result.ml_state.last_updated : 'SYNCING...'}
              </span>
            </div>
            {result && result.ml_state && result.ml_state.consecutive_high_traffic > 1 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.4rem', textAlign: 'right' }}>
                ⚠️ Learning from recent high traffic patterns...
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Risk Appetite (λ): {lambdaValue}</label>
          <input type="range" min="0" max="5" step="0.1" value={lambdaValue} onChange={e => setLambdaValue(e.target.value)} />
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Higher value prioritizes safer routes.</span>
        </div>

        <button className="btn" onClick={runOptimization} disabled={loading} style={{ flex: 1 }}>
          {loading ? 'CALCULATING MATRIX...' : 'RUN OPTIMIZATION PROTOCOL'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {result && (
        <>
          <hr style={{ borderColor: '#333', margin: '2rem 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Geospatial Risk Analysis</h3>
              <div style={{ height: '500px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                <MapContainer
                  center={[viewState.latitude, viewState.longitude]}
                  zoom={viewState.zoom}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                  />
                  {result.all_routes.map((r, idx) => {
                    const leafletCoords = r.geometry.map(([lon, lat]) => [lat, lon]);
                    const isSelected = idx === selectedRouteIdx;
                    const routeColor = r.risk_score < 40 ? "#50C878" : r.risk_score < 70 ? "#FFD700" : "#FF4444";
                    const routeOpacity = exploreMode ? (isSelected ? 1 : 0.3) : (isSelected ? 1 : 0);

                    return (
                      <Polyline
                        key={`poly-${idx}-${exploreMode}-${isSelected}`}
                        positions={leafletCoords}
                        color={routeColor}
                        weight={isSelected ? 6 : 3}
                        opacity={routeOpacity}
                      />
                    );
                  })}
                  <Marker position={[result.source_coords[1], result.source_coords[0]]} />
                  <Marker position={[result.dest_coords[1], result.dest_coords[0]]} />
                </MapContainer>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem' }}>Strategic Recommendation</h3>

              <div className="alert alert-success" style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>
                Optimization Cycle Delta-4 Active
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <p className="gold-text" style={{ fontWeight: 'bold', margin: 0 }}>
                  {result.best_route.name} indicates superior logistics profile.
                </p>
                <button
                  onClick={() => setExploreMode(!exploreMode)}
                  style={{
                    backgroundColor: exploreMode ? 'var(--gold-accent)' : 'transparent',
                    color: exploreMode ? '#000' : 'var(--gold-accent)',
                    border: '1px solid var(--gold-accent)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                >
                  {exploreMode ? 'EXIT EXPLORE MODE' : 'EXPLORE ALL ROUTES'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {result.all_routes.map((r, idx) => {
                  const isSelected = idx === selectedRouteIdx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedRouteIdx(idx)}
                      style={{
                        padding: '1rem',
                        border: isSelected ? '1px solid var(--gold-accent)' : '1px solid #333',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>{r.name}</span>
                        {r.name === result.best_route.name && <span className="gold-text" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>← BEST</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.9rem', color: '#888' }}>
                        <span>Risk Score: <strong style={{ color: r.risk_score > 70 ? 'var(--danger)' : r.risk_score > 40 ? 'var(--warning)' : 'var(--success)' }}>{r.risk_score}</strong></span>
                        <span>{Math.round(r.duration)} min | {Math.round(r.distance)} km</span>
                      </div>

                      {isSelected && r.factors && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888' }}>Intelligence Factors:</span>
                          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', fontSize: '0.85rem', color: '#ccc' }}>
                            {r.factors.map((f, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{f.includes("Clear") || f.includes("Light") || f.includes("Off-peak") ? '✅' : '⚠️'} {f}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                className="btn"
                onClick={executeReroute}
                style={{
                  width: '100%',
                  backgroundColor: rerouteSuccess ? 'var(--success)' : 'transparent',
                  border: `1px solid ${rerouteSuccess ? 'var(--success)' : 'var(--gold-accent)'}`,
                  color: rerouteSuccess ? '#000' : 'var(--gold-accent)',
                  transition: 'all 0.3s ease'
                }}
              >
                {rerouteSuccess ? '✓ REROUTE COMMAND DISPATCHED' : 'EXECUTE REROUTE'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RouteOptimization;
