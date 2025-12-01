
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
    datasets: [{ label, data, borderColor: '#007acc', tension: 0.2 }]
  });

  return (
    <div className="page">
      <h1>Monitoring AWS (CloudWatch)</h1>
      <div className="card">
        <div className="card-icon"><img src="/assets/icons/cloudwatch.svg" alt="cloudwatch"/></div>
        <label>
          Choisir une instance
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">-- choisir --</option>
            {instances.map(i => (
              <option key={i.instanceId} value={i.instanceId}>
                {i.name ? `${i.instanceId} — ${i.name}` : i.instanceId}
              </option>
            ))}
          </select>
        </label>
        <button className="secondary" onClick={loadInstances}>Rafraîchir</button>
      </div>

      {instances.length === 0 && <p className="muted">Aucune instance disponible pour le monitoring.</p>}

      {selected && (
        <div className="grid">
          <div className="card"><h4>CPUUtilization</h4><Line data={chartFor('CPU', metrics.cpu)} /></div>
          <div className="card"><h4>NetworkIn</h4><Line data={chartFor('NetworkIn', metrics.in)} /></div>
          <div className="card"><h4>NetworkOut</h4><Line data={chartFor('NetworkOut', metrics.out)} /></div>
          <div className="card"><h4>DiskReadOps</h4><Line data={chartFor('DiskReadOps', metrics.read)} /></div>
          <div className="card"><h4>DiskWriteOps</h4><Line data={chartFor('DiskWriteOps', metrics.write)} /></div>
        </div>
      )}
    </div>
  );
}
