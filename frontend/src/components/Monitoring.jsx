import React, { useEffect, useState } from 'react';
import api from '../api/Api';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function Monitoring() {
  const [instances, setInstances] = useState([]);
  const [selected, setSelected] = useState('');
  const [metrics, setMetrics] = useState({ cpu: [0], in: [0], out: [0], read: [0], write: [0], labels: [] });

  async function loadInstances() {
    try {
      const r = await api.get('/monitor/ec2/list');
      setInstances(r.data.instances || []);
    } catch (e) {
      console.error('Erreur chargement instances', e);
    }
  }

  useEffect(() => {
    loadInstances();
    const interval = setInterval(loadInstances, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selected) return;
    let mounted = true;

    async function fetchLoop() {
      try {
        const r = await api.get(`/monitor/ec2/${selected}`);
        if (mounted) {
          setMetrics({
            cpu: [r.data.CPUUtilization || 0],
            in: [r.data.NetworkIn || 0],
            out: [r.data.NetworkOut || 0],
            read: [r.data.DiskReadOps || 0],
            write: [r.data.DiskWriteOps || 0],
            labels: [new Date().toLocaleTimeString()]
          });
        }
      } catch (e) {
        console.error('Erreur récupération métriques', e);
      }
    }

    fetchLoop();
    const t = setInterval(fetchLoop, 10000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [selected]);

  const chartFor = (label, data) => ({
    labels: metrics.labels,
    datasets: [{ label, data, borderColor: '#667eea', backgroundColor: 'rgba(102, 126, 234, 0.1)', tension: 0.2, fill: true }]
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Monitoring AWS (CloudWatch)</h1>
        <p>Surveiller vos instances en temps réel</p>
      </div>
      
      <div className="card">
        <div className="card-header">
          <div className="card-head">
            <div className="card-icon"><img src="/assets/icons/cloudwatch.svg" alt="cloudwatch"/></div>
            <div>
              <div className="card-title">Sélection d'instance</div>
              <div className="card-subtitle">Choisissez une instance à surveiller</div>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label>Instance EC2</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">-- Choisir une instance --</option>
            {instances.map(i => (
              <option key={i.instanceId} value={i.instanceId}>
                {i.name ? `${i.instanceId} — ${i.name}` : i.instanceId}
              </option>
            ))}
          </select>
        </div>
        
        <div className="row" style={{ marginTop: 16 }}>
          <button className="button" onClick={loadInstances}>
            🔄 Rafraîchir la liste
          </button>
        </div>
      </div>

      {instances.length === 0 && (
        <div className="card" style={{ marginTop: 24, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3 style={{ color: '#2d3748', marginBottom: 8 }}>Aucune instance disponible</h3>
          <p style={{ color: '#4a5568', fontSize: 16 }}>
            Aucune instance EC2 n'est actuellement disponible pour le monitoring.
          </p>
          <p style={{ color: '#718096', fontSize: 14, marginTop: 8 }}>
            Créez une instance EC2 dans la section EC2 ou rafraîchissez la liste.
          </p>
        </div>
      )}

      {selected && instances.length > 0 && (
        <div className="grid" style={{ marginTop: 24 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-icon">💻</div>
              <div>
                <div className="card-title">CPU Utilization</div>
                <div className="card-subtitle">Pourcentage d'utilisation</div>
              </div>
            </div>
            <Line data={chartFor('CPU (%)', metrics.cpu)} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
          
          <div className="card">
            <div className="card-header">
              <div className="card-icon">📥</div>
              <div>
                <div className="card-title">Network In</div>
                <div className="card-subtitle">Octets reçus</div>
              </div>
            </div>
            <Line data={chartFor('Network In (bytes)', metrics.in)} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
          
          <div className="card">
            <div className="card-header">
              <div className="card-icon">📤</div>
              <div>
                <div className="card-title">Network Out</div>
                <div className="card-subtitle">Octets envoyés</div>
              </div>
            </div>
            <Line data={chartFor('Network Out (bytes)', metrics.out)} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
          
          <div className="card">
            <div className="card-header">
              <div className="card-icon">💾</div>
              <div>
                <div className="card-title">Disk Read Ops</div>
                <div className="card-subtitle">Opérations de lecture</div>
              </div>
            </div>
            <Line data={chartFor('Disk Read', metrics.read)} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
          
          <div className="card">
            <div className="card-header">
              <div className="card-icon">💿</div>
              <div>
                <div className="card-title">Disk Write Ops</div>
                <div className="card-subtitle">Opérations d'écriture</div>
              </div>
            </div>
            <Line data={chartFor('Disk Write', metrics.write)} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>
      )}
    </div>
  );
}