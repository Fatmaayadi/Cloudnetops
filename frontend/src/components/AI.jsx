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
    const interval = setInterval(loadInstances, 10000);
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
      setRecommend({ error: "Sélectionnez une instance et collectez des métriques avant la recommandation." });
      return;
    }
    setLoadingAI(true);
    try {
      const r = await api.post('/ai/predict', { instance_id: selected, metrics });
      setRecommend(r.data);
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
      <div className="page-header">
        <h1>Recommandation IA</h1>
        <p>Obtenir des suggestions intelligentes pour vos instances</p>
      </div>

      {/* Card de sélection */}
      <div className="card">
        <div className="card-header">
          <div className="card-head">
            <div className="card-icon">🤖</div>
            <div>
              <div className="card-title">Analyse IA</div>
              <div className="card-subtitle">Sélectionnez une instance pour l'analyse</div>
            </div>
          </div>
        </div>

        {/* Bannière d'erreur */}
        {error && (
          <div style={{ 
            background: 'linear-gradient(135deg, #fed7d7, #feb2b2)', 
            color: '#c53030', 
            padding: '16px 20px', 
            borderRadius: 12, 
            marginBottom: 20,
            border: '2px solid #fc8181',
            fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Sélection d'une instance */}
        <div className="form-group">
          <label>Choisir une instance EC2</label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            disabled={loadingInstances || instances.length === 0}
          >
            <option value="">-- Sélectionner une instance --</option>
            {instances.map(i => (
              <option key={i.instanceId} value={i.instanceId}>
                {i.instanceId} {i.name ? `— ${i.name}` : `— ${i.state}`}
              </option>
            ))}
          </select>
        </div>

        <div className="row" style={{ gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <button 
            className="button" 
            onClick={loadInstances} 
            disabled={loadingInstances}
            style={{ flex: '1 1 auto' }}
          >
            {loadingInstances ? '⏳ Chargement…' : '🔄 Rafraîchir instances'}
          </button>
          <button 
            className="btn-primary" 
            onClick={collectMetrics} 
            disabled={!selected || loadingMetrics}
            style={{ flex: '1 1 auto' }}
          >
            {loadingMetrics ? '⏳ Collecte…' : '📊 Collecter métriques'}
          </button>
          <button 
            className="btn-primary" 
            onClick={askAI} 
            disabled={!metrics || loadingAI}
            style={{ flex: '1 1 auto', background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            {loadingAI ? '🤖 Analyse…' : '🤖 Recommandation IA'}
          </button>
        </div>
      </div>

      {/* Message si aucune instance */}
      {instances.length === 0 && !loadingInstances && (
        <div className="card" style={{ marginTop: 24, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🤖</div>
          <h3 style={{ color: '#2d3748', marginBottom: 12, fontSize: 24 }}>Aucune instance disponible</h3>
          <p style={{ color: '#4a5568', fontSize: 16, marginBottom: 8 }}>
            Aucune instance EC2 n'est actuellement disponible pour l'analyse IA.
          </p>
          <p style={{ color: '#718096', fontSize: 14 }}>
            Créez une instance EC2 dans la section EC2 ou rafraîchissez la liste.
          </p>
        </div>
      )}

      {/* Affichage des métriques collectées - CORRECTION: Grid avec colonnes fixes */}
      {metrics && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon">📊</div>
              <div>
                <div className="card-title">Métriques collectées</div>
                <div className="card-subtitle">Données de l'instance {selected}</div>
              </div>
            </div>
          </div>
          
          {/* CORRECTION: Utiliser 5 colonnes fixes au lieu de auto-fit */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: 16, 
            marginTop: 16 
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))', 
              padding: 20, 
              borderRadius: 12,
              border: '2px solid rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{ fontSize: 14, color: '#718096', marginBottom: 4 }}>CPU Utilization</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#667eea' }}>
                {metrics.CPUUtilization.toFixed(2)}%
              </div>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))', 
              padding: 20, 
              borderRadius: 12,
              border: '2px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ fontSize: 14, color: '#718096', marginBottom: 4 }}>Network In</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{metrics.NetworkIn}</div>
              <div style={{ fontSize: 12, color: '#718096' }}>bytes</div>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(245, 101, 101, 0.1), rgba(197, 48, 48, 0.1))', 
              padding: 20, 
              borderRadius: 12,
              border: '2px solid rgba(245, 101, 101, 0.3)'
            }}>
              <div style={{ fontSize: 14, color: '#718096', marginBottom: 4 }}>Network Out</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f56565' }}>{metrics.NetworkOut}</div>
              <div style={{ fontSize: 12, color: '#718096' }}>bytes</div>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))', 
              padding: 20, 
              borderRadius: 12,
              border: '2px solid rgba(251, 191, 36, 0.3)'
            }}>
              <div style={{ fontSize: 14, color: '#718096', marginBottom: 4 }}>Disk Read Ops</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24' }}>{metrics.DiskReadOps}</div>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(109, 40, 217, 0.1))', 
              padding: 20, 
              borderRadius: 12,
              border: '2px solid rgba(139, 92, 246, 0.3)'
            }}>
              <div style={{ fontSize: 14, color: '#718096', marginBottom: 4 }}>Disk Write Ops</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6' }}>{metrics.DiskWriteOps}</div>
            </div>
          </div>
        </div>
      )}

      {/* Affichage de la recommandation IA */}
      {recommend && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon">🎯</div>
              <div>
                <div className="card-title">Recommandation IA</div>
                <div className="card-subtitle">Analyse et suggestions</div>
              </div>
            </div>
          </div>
          
          {recommend.error ? (
            <div style={{ 
              background: 'linear-gradient(135deg, #fed7d7, #feb2b2)', 
              color: '#c53030', 
              padding: '20px 24px', 
              borderRadius: 12,
              border: '2px solid #fc8181',
              marginTop: 16,
              fontWeight: 600,
              fontSize: 16
            }}>
              ❌ {recommend.error}
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))', 
                padding: 24, 
                borderRadius: 12,
                border: '2px solid rgba(16, 185, 129, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 32 }}>✅</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#2d3748' }}>Analyse terminée</div>
                    <div style={{ fontSize: 14, color: '#718096' }}>Recommandations générées avec succès</div>
                  </div>
                </div>
                <pre className="mono" style={{ 
                  background: 'rgba(255, 255, 255, 0.9)', 
                  padding: 20, 
                  borderRadius: 8,
                  fontSize: 14,
                  maxHeight: 400,
                  overflowY: 'auto',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  {JSON.stringify(recommend, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}