
import React, { useState, useEffect } from 'react';
import api from '../api/Api';

export default function EC2() {
  const [name, setName] = useState('');
  const [type, setType] = useState('t2.micro');
  const [createRes, setCreateRes] = useState(null);
  const [terminateId, setTerminateId] = useState('');
  const [terminateRes, setTerminateRes] = useState(null);
  const [instances, setInstances] = useState([]);

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
    const interval = setInterval(load, 10000); // refresh auto toutes les 10s
    return () => clearInterval(interval);
  }, []);

  async function createInst(e) {
    e.preventDefault();
    setCreateRes(null);
    try {
      const r = await api.post('/deploy/ec2/create', { name, type });
      setCreateRes(r.data);
      await load(); // refresh liste après création
    } catch (err) {
      setCreateRes({ error: err?.response?.data || 'Erreur' });
    }
  }

  async function terminate(e) {
    e.preventDefault();
    setTerminateRes(null);
    try {
      const r = await api.post('/deploy/ec2/terminate', { instance_id: terminateId });
      setTerminateRes(r.data);
      await load(); // refresh liste après suppression
    } catch (err) {
      setTerminateRes({ error: err?.response?.data || 'Erreur' });
    }
  }

  return (
    <div className="page">
      <h1>Gestion EC2</h1>
      <div className="grid fade-in">

        {/* Créer une instance */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/ec2.svg" alt="ec2"/></div>
              <div>
                <div className="card-title">Créer une instance EC2</div>
                <div className="card-sub">Nouveau compute</div>
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
            <button className="primary">Créer</button>
            {createRes && <pre className="mono">{JSON.stringify(createRes, null, 2)}</pre>}
          </form>
        </div>

        {/* Terminer une instance */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/ec2.svg" alt="ec2"/></div>
              <div>
                <div className="card-title">Terminer une instance EC2</div>
                <div className="card-sub">Retirer une instance existante</div>
              </div>
            </div>
          </div>
          <form className="form-card" onSubmit={terminate}>
            <label>Instance ID<input value={terminateId} onChange={e => setTerminateId(e.target.value)} required /></label>
            <button className="danger">Terminer</button>
            {terminateRes && <pre className="mono">{JSON.stringify(terminateRes, null, 2)}</pre>}
          </form>
        </div>

        {/* Liste des instances */}
        <div className="card interactive">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/ec2.svg" alt="ec2"/></div>
              <div>
                <div className="card-title">Instances existantes</div>
                <div className="card-sub">Liste récente</div>
              </div>
            </div>
            <button className="secondary" onClick={load}>Rafraîchir</button>
          </div>
          <div className="card-body">
            {instances.length === 0 ? (
              <div className="muted">Aucune instance trouvée — créez-en une ou rafraîchissez.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                {instances.map(i => (
                  <div key={i.instanceId} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{i.instanceId}</div>
                    <div style={{ fontSize: 13, color: '#274151' }}>{i.name ? i.name : i.state}</div>
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
