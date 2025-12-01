import React, { useState, useEffect } from 'react'
import api from '../api/Api'

export default function S3(){
  const [name,setName]=useState('')
  const [region,setRegion]=useState('us-east-1')
  const [res,setRes]=useState(null)
  const [delName,setDelName]=useState('')
  const [delRes,setDelRes]=useState(null)
  const [buckets,setBuckets] = useState([])

  useEffect(()=>{ 
    async function load(){ 
      try{ 
        const r = await api.get('/monitor/s3/list'); 
        setBuckets(r.data.buckets||[]) 
      }catch(e){} 
    } 
    load() 
  },[])

  async function create(e){
    e.preventDefault(); setRes(null)
    try{ 
      const r = await api.post('/deploy/s3/create', { bucket_name: name, region });
      setRes(r.data)
      await api.get('/deploy/summary') // refresh compteur dashboard
    }catch(err){ setRes({error:err?.response?.data||'Erreur'}) }
  }

  async function remove(e){
    e.preventDefault(); setDelRes(null)
    try{ 
      const r = await api.post('/deploy/s3/delete', { bucket_name: delName });
      setDelRes(r.data)
      await api.get('/deploy/summary') // refresh compteur dashboard
    }catch(err){ setDelRes({error:err?.response?.data||'Erreur'}) }
  }

  return (
    <div className="page">
      <h1>Gestion S3</h1>
      <div className="grid">
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/s3.svg" alt="s3"/></div>
              <div>
                <div className="card-title">Créer un bucket</div>
                <div className="card-sub">Nouveau bucket S3</div>
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
            <button className="primary">Créer</button>
            {res && <pre className="mono">{JSON.stringify(res,null,2)}</pre>}
          </form>
        </div>

        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/s3.svg" alt="s3"/></div>
              <div>
                <div className="card-title">Supprimer un bucket</div>
                <div className="card-sub">Retirer un bucket existant</div>
              </div>
            </div>
          </div>
          <form className="form-card" onSubmit={remove}>
            <label>Nom<input value={delName} onChange={e=>setDelName(e.target.value)} required/></label>
            <button className="danger">Supprimer</button>
            {delRes && <pre className="mono">{JSON.stringify(delRes,null,2)}</pre>}
          </form>
        </div>

        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/s3.svg" alt="s3"/></div>
              <div>
                <div className="card-title">Buckets existants</div>
                <div className="card-sub">Liste récente</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {buckets.length === 0 ? (
              <div className="muted">Aucun bucket trouvé — créez-en un ou rafraîchissez.</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:260,overflowY:'auto'}}>
                {buckets.map(b=> (
                  <div key={b.name} style={{padding:10,borderRadius:8,background:'rgba(255,255,255,0.6)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontWeight:700}}>{b.name}</div>
                    <div style={{fontSize:13,color:'#274151'}}>{b.region || '—'}</div>
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