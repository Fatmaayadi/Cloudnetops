
import React, { useState, useEffect } from 'react';
import api from '../api/Api';

export default function AI() {
  const [instances, setInstances] = useState([]);
  const [selected, setSelected] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [recommend, setRecommend] = useState(null);

  const [loadingInstances, setLoadingInstances] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState(null);

  // Charger la liste des instances EC2
  async function loadInstances() {
    setError(null);
    setLoadingInstances(true);
    try {
      const r = await api.get('/monitor/ec2/list');
      setInstances(r.data.instances || []);
    } catch (e) {
      console.error('Erreur chargement instances', e);
      setError("Impossible de charger la liste des instances EC2.");
    } finally {
      setLoadingInstances(false);
    }
  }

  useEffect(() => {
    loadInstances();
    const interval = setInterval(loadInstances, 10000); // auto-refresh toutes les 10s
    return () => clearInterval(interval);
  }, []);

  // Collecter les métriques pour l'instance sélectionnée
  async function collectMetrics() {
    setError(null);
    if (!selected) {
      setMetrics(null);
      return;
    }
    setLoadingMetrics(true);
    try {
      const r = await api.get(`/monitor/ec2/${selected}`);
      const m = r.data || {};
      // Map explicit pour éviter les KeyError côté backend IA
      setMetrics({
        CPUUtilization: m.CPUUtilization ?? 0,
        NetworkIn: m.NetworkIn ?? 0,
        NetworkOut: m.NetworkOut ?? 0,
        DiskReadOps: m.DiskReadOps ?? 0,
        DiskWriteOps: m.DiskWriteOps ?? 0,
      });
    } catch (e) {
      console.error('Erreur collecte métriques', e);
      setError("Impossible de collecter les métriques pour l'instance sélectionnée.");
    } finally {
      setLoadingMetrics(false);
    }
  }

  // Demander la recommandation IA
  async function askAI() {
    setError(null);
    if (!metrics || !selected) {
      setRecommend({ error: "Sélectionnez une instance et collectez des métrriques avant la recommandation." });
      return;
    }
    setLoadingAI(true);
    try {
      const r = await api.post('/ai/predict', { instance_id: selected, metrics });
      setRecommend(r.data);

      // ⚠️ Ne pas appeler /ai/save si le backend ne l'expose pas.
      // Si tu as bien ce endpoint et qu'il persiste la reco pour le dashboard, décommente :
      // await api.post('/ai/save', { recommendation: r.data });
    } catch (e) {
      console.error('Erreur IA', e);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        'Erreur IA';
      setRecommend({ error: msg });
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div className="page">
      <h1>Recommandation IA</h1>
      <div className="card">
        <div className="card-icon"><img src="/assets/icons/ai.svg" alt="AI"/></div>

        {/* Bannière d'erreur */}
        {error && (
          <div style={{ background:'#ffe8e8', color:'#b00020', padding:'10px 12px', borderRadius:8, marginBottom:10 }}>
            {error}
          </div>
        )}

        {/* Sélection d'une instance */}
        <label>
          Choisir une instance
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            disabled={loadingInstances || instances.length === 0}
          >
            <option value="">-- choisir --</option>
            {instances.map(i => (
              <option key={i.instanceId} value={i.instanceId}>
                {i.instanceId} {i.name ? `— ${i.name}` : `— ${i.state}`}
              </option>
            ))}
          </select>
        </label>

        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <button className="secondary" onClick={loadInstances} disabled={loadingInstances}>
            {loadingInstances ? 'Chargement…' : 'Rafraîchir instances'}
          </button>
          <button className="primary" onClick={collectMetrics} disabled={!selected || loadingMetrics}>
            {loadingMetrics ? 'Collecte…' : 'Collecter métriques'}
          </button>
          <button onClick={askAI} disabled={!metrics || loadingAI}>
            {loadingAI ? 'Analyse IA…' : 'Obtenir recommandation IA'}
          </button>
        </div>

        {instances.length === 0 && !loadingInstances && (
          <p className="muted" style={{ marginTop: 10 }}>
            Aucune instance disponible pour IA.
          </p>
        )}

        {/* Affichage des métriques */}
        {metrics && (
          <div style={{ marginTop: 20 }}>
            <h3>Métriques collectées</h3>
            <p><strong>CPU Utilization:</strong> {metrics.CPUUtilization}%</p>
            <p><strong>Network In:</strong> {metrics.NetworkIn} bytes</p>
            <p><strong>Network Out:</strong> {metrics.NetworkOut} bytes</p>
          </div>
        )}

        {/* Affichage de la recommandation IA */}
        {recommend && (
          <div style={{ marginTop: 20 }}>
            <h3>Recommandation IA</h3>
            {recommend.error ? (
              <div style={{ background:'#ffe8e8', color:'#b00020', padding:'10px 12px', borderRadius:8 }}>
                {recommend.error}
              </div>
            ) : (
              <pre className="mono">{JSON.stringify(recommend, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
