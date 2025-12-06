import React, { useState, useEffect } from 'react';
import api from '../api/Api';

export default function EC2() {
  const [name, setName] = useState('');
  const [type, setType] = useState('t2.micro');
  const [terminateId, setTerminateId] = useState('');
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const r = await api.get('/monitor/ec2/list');
      setInstances(r.data.instances || []);
    } catch (e) {
      console.error('Erreur chargement instances', e);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  async function createInst(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/deploy/ec2/create', { name, type });
      setName(''); // Reset form
      await load(); // Refresh liste
    } catch (err) {
      console.error('Erreur création:', err);
    } finally {
      setLoading(false);
    }
  }

  async function terminate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/deploy/ec2/terminate', { instance_id: terminateId });
      setTerminateId(''); // Reset form
      await load(); // Refresh liste
    } catch (err) {
      console.error('Erreur terminaison:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Gestion EC2</h1>
        <p>Créer et gérer vos instances EC2</p>
      </div>
      <div className="grid fade-in">

        {/* Créer une instance */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/ec2.svg" alt="ec2"/></div>
              <div>
                <div className="card-title">Créer une instance EC2</div>
                <div className="card-subtitle">Nouveau compute</div>
              </div>
            </div>
          </div>
          <form className="form-card" onSubmit={createInst}>
            <label>Nom<input value={name} onChange={e => setName(e.target.value)} required /></label>
            <label>Type<select value={type} onChange={e => setType(e.target.value)}>
              <option>t2.micro</option>
              <option>t3.micro</option>
              <option>t3.small</option>
            </select></label>
            <button className="primary" disabled={loading}>
              {loading ? '⏳ Création...' : 'Créer'}
            </button>
          </form>
        </div>

        {/* Terminer une instance */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/ec2.svg" alt="ec2"/></div>
              <div>
                <div className="card-title">Terminer une instance EC2</div>
                <div className="card-subtitle">Retirer une instance existante</div>
              </div>
            </div>
          </div>
          <form className="form-card" onSubmit={terminate}>
            <label>Instance ID<input value={terminateId} onChange={e => setTerminateId(e.target.value)} required /></label>
            <button className="danger" disabled={loading}>
              {loading ? '⏳ Terminaison...' : 'Terminer'}
            </button>
          </form>
        </div>

        {/* Liste des instances */}
        <div className="card interactive">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/ec2.svg" alt="ec2"/></div>
              <div>
                <div className="card-title">Instances existantes</div>
                <div className="card-subtitle">Liste récente</div>
              </div>
            </div>
            <button className="secondary" onClick={load}>🔄 Rafraîchir</button>
          </div>
          <div className="card-body">
            {instances.length === 0 ? (
              <div style={{textAlign:'center',padding:40}}>
                <div style={{fontSize:48,marginBottom:12}}>🖥️</div>
                <div style={{color:'#2d3748',fontWeight:600,marginBottom:4}}>Aucune instance trouvée</div>
                <div style={{color:'#718096',fontSize:14}}>Créez-en une ou rafraîchissez</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                {instances.map(i => (
                  <div key={i.instanceId} style={{ padding: 10, borderRadius: 8, background: 'rgba(102,126,234,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color:'#2d3748' }}>{i.instanceId}</div>
                    <div style={{ fontSize: 13, color: '#667eea', fontWeight:600 }}>{i.name ? i.name : i.state}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}