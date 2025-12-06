import React, { useState, useEffect } from 'react'
import api from '../api/Api'

export default function S3(){
  const [name,setName]=useState('')
  const [region,setRegion]=useState('us-east-1')
  const [delName,setDelName]=useState('')
  const [buckets,setBuckets] = useState([])
  const [loading,setLoading] = useState(false)

  async function load(){ 
    try{ 
      const r = await api.get('/monitor/s3/list'); 
      setBuckets(r.data.buckets||[]) 
    }catch(e){
      console.error('Erreur chargement buckets:', e)
    } 
  }

  useEffect(()=>{ 
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  },[])

  async function create(e){
    e.preventDefault();
    setLoading(true);
    try{ 
      await api.post('/deploy/s3/create', { bucket_name: name, region });
      setName(''); // Reset form
      await load(); // Refresh liste
    }catch(err){ 
      console.error('Erreur création bucket:', err)
    } finally {
      setLoading(false);
    }
  }

  async function remove(e){
    e.preventDefault();
    setLoading(true);
    try{ 
      await api.post('/deploy/s3/delete', { bucket_name: delName });
      setDelName(''); // Reset form
      await load(); // Refresh liste
    }catch(err){ 
      console.error('Erreur suppression bucket:', err)
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Gestion S3</h1>
        <p>Créer et gérer vos buckets S3</p>
      </div>
      <div className="grid">
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/s3.svg" alt="s3"/></div>
              <div>
                <div className="card-title">Créer un bucket</div>
                <div className="card-subtitle">Nouveau bucket S3</div>
              </div>
            </div>
          </div>
          <form className="form-card" onSubmit={create}>
            <label>Nom<input value={name} onChange={e=>setName(e.target.value)} required/></label>
            <label>Region<select value={region} onChange={e=>setRegion(e.target.value)}>
              <option>us-east-1</option>
              <option>eu-west-1</option>
              <option>ap-southeast-1</option>
            </select></label>
            <button className="primary" disabled={loading}>
              {loading ? '⏳ Création...' : 'Créer'}
            </button>
          </form>
        </div>

        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/s3.svg" alt="s3"/></div>
              <div>
                <div className="card-title">Supprimer un bucket</div>
                <div className="card-subtitle">Retirer un bucket existant</div>
              </div>
            </div>
          </div>
          <form className="form-card" onSubmit={remove}>
            <label>Nom<input value={delName} onChange={e=>setDelName(e.target.value)} required/></label>
            <button className="danger" disabled={loading}>
              {loading ? '⏳ Suppression...' : 'Supprimer'}
            </button>
          </form>
        </div>

        <div className="card interactive">
          <div className="card-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/s3.svg" alt="s3"/></div>
              <div>
                <div className="card-title">Buckets existants</div>
                <div className="card-subtitle">Liste récente</div>
              </div>
            </div>
            <button className="secondary" onClick={load}>🔄 Rafraîchir</button>
          </div>
          <div className="card-body">
            {buckets.length === 0 ? (
              <div style={{textAlign:'center',padding:40}}>
                <div style={{fontSize:48,marginBottom:12}}>💾</div>
                <div style={{color:'#2d3748',fontWeight:600,marginBottom:4}}>Aucun bucket trouvé</div>
                <div style={{color:'#718096',fontSize:14}}>Créez-en un ou rafraîchissez</div>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:260,overflowY:'auto'}}>
                {buckets.map(b=> (
                  <div key={b.name} style={{padding:10,borderRadius:8,background:'rgba(16,185,129,0.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontWeight:700,color:'#2d3748'}}>{b.name}</div>
                    <div style={{fontSize:13,color:'#10b981',fontWeight:600}}>{b.region || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}