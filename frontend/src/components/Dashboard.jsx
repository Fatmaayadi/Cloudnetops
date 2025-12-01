
// Dashboard.jsx
import React, { useEffect, useState } from 'react'
import api from '../api/Api'

export default function Dashboard(){
  const [stats, setStats] = useState({ec2:0,s3:0,ai:'—',status:'unknown'})
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  function formatNumber(n){ return typeof n === 'number' ? n.toLocaleString('fr-FR') : n }
  function timeAgo(ts){
    if (!ts) return '—'
    const diff = Date.now() - ts.getTime()
    const min = Math.floor(diff/60000)
    if (min < 1) return 'À l’instant'
    if (min === 1) return 'il y a 1 min'
    return `il y a ${min} min`
  }

  async function refresh(){
    setLoading(true)
    try{
      // Statut + dernière IA
      const statusRes = await api.get('/status') // <- assure cette route renvoie {status, last_ai}
      const status = statusRes?.data?.status || 'ok'
      const lastAI = statusRes?.data?.last_ai || '—'

      // EC2: liste réelle, compter running
      const ec2Res = await api.get('/monitor/ec2/list')
      const instances = ec2Res?.data?.instances || []
      const runningCount = instances.filter(i => String(i.state).toLowerCase() === 'running').length

      // S3: nombre réel de buckets
      const s3Res = await api.get('/monitor/s3/list')
      const buckets = s3Res?.data?.buckets || []
      const bucketCount = buckets.length

      setStats({
        ec2: runningCount,
        s3: bucketCount,
        ai: lastAI,
        status
      })
      setLastUpdated(new Date())
    }catch(e){
      console.error('Erreur refresh dashboard', e)
      setStats(s => ({...s, status:'offline'}))
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
        <div>
          <h1>Dashboard principal</h1>
          <div className="card-sub">Vue d'ensemble de l'infrastructure</div>
        </div>
        <div className="controls">
          <button className="button" onClick={refresh} disabled={loading}>{loading ? 'Chargement...' : 'Rafraîchir'}</button>
          {lastUpdated && <span className="card-sub" style={{marginLeft:12}}>Dernière: {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </div>

      <div className="grid fade-in">
        {/* EC2 Card */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/ec2.svg" alt="EC2 Icon" /></div>
              <div>
                <div className="card-title">Instances EC2 actives</div>
                <div className="card-sub">Nombre d'instances en cours</div>
              </div>
            </div>
            <div className="chip">EC2</div>
          </div>
          <div className="card-body">
            <div className="metric">{ loading ? <span className="skeleton" style={{width:80,height:30}}/> : formatNumber(stats.ec2) }</div>
          </div>
          <div className="card-footer">
            <div className="card-actions">
              <button className="button" onClick={refresh} disabled={loading}>{loading ? 'Chargement…' : 'Rafraîchir'}</button>
            </div>
            <div className="card-sub">Mise à jour {timeAgo(lastUpdated)}</div>
          </div>
        </div>

        {/* S3 Card */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/s3.svg" alt="S3 Icon" /></div>
              <div>
                <div className="card-title">Buckets S3</div>
                <div className="card-sub">Nombre de buckets</div>
              </div>
            </div>
            <div className="chip">S3</div>
          </div>
          <div className="card-body">
            <div className="metric">{ loading ? <span className="skeleton" style={{width:80,height:30}}/> : formatNumber(stats.s3) }</div>
          </div>
          <div className="card-footer">
            <div className="card-actions">
              <button className="button" onClick={refresh} disabled={loading}>{loading ? 'Chargement…' : 'Rafraîchir'}</button>
            </div>
            <div className="card-sub">Synchro {stats.status==='ok' ? 'OK' : 'OFFLINE'}</div>
          </div>
        </div>

        {/* AI Card */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/ai.svg" alt="AI Icon" /></div>
              <div>
                <div className="card-title">Dernière recommandation IA</div>
                <div className="card-sub">Suggestion automatisée</div>
              </div>
            </div>
            <div className="chip">AI</div>
          </div>
          <div className="card-body">
            {loading
              ? <div className="skeleton" style={{height:80}}/>
              : (stats.ai === '—' || !stats.ai)
                ? <div className="muted">Aucune recommandation enregistrée.</div>
                : <pre className="mono">{JSON.stringify(stats.ai, null, 2)}</pre>
            }
          </div>
          <div className="card-footer">
            <div className="card-actions">
              <button className="button" onClick={refresh} disabled={loading}>{loading ? 'Chargement…' : 'Rafraîchir'}</button>
            </div>
            <div className="card-sub">Basé sur les 24h</div>
          </div>
        </div>

        {/* Backend Status Card */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon"><img src="/assets/icons/cloudwatch.svg" alt="CloudWatch Icon" /></div>
              <div>
                <div className="card-title">Statut backend</div>
                <div className="card-sub">Santé du service</div>
              </div>
            </div>
            <div className={`chip ${stats.status==='ok'?'':'muted'}`}>{stats.status}</div>
          </div>
          <div className="card-body">
            <div className="metric">{ loading ? <span className="skeleton" style={{width:120,height:28}}/> : stats.status }</div>
          </div>
          <div className="card-footer">
            <div className="card-actions">
              <button className="button" onClick={refresh} disabled={loading}>{loading ? 'Ping…' : 'Check'}</button>
            </div>
            <div className="card-sub">Dernier ping: maintenant</div>
          </div>
        </div>
      </div>
    </div>
  )
}
