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
    if (min < 1) return "À l'instant"
    if (min === 1) return 'il y a 1 min'
    return `il y a ${min} min`
  }

  async function refresh() {
    setLoading(true);
    let status = 'ok';
    let lastAI = '—';
    let runningCount = 0;
    let bucketCount = 0;

    try {
      const statusRes = await api.get('/status');
      status = statusRes?.data?.status || 'ok';
      lastAI = statusRes?.data?.last_ai || '—';
    } catch (e) {
      console.error('Erreur /status', e);
      status = 'offline';
    }

    try {
      const ec2Res = await api.get('/monitor/ec2/list');
      const instances = ec2Res?.data?.instances || [];
      runningCount = instances.filter(i => String(i.state).toLowerCase() === 'running').length;

      const s3Res = await api.get('/monitor/s3/list');
      const buckets = s3Res?.data?.buckets || [];
      bucketCount = buckets.length;
    } catch (e) {
      console.error('Erreur EC2/S3', e);
    }

    setStats({
      ec2: runningCount,
      s3: bucketCount,
      ai: lastAI,
      status
    });
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div>
          <h1>Dashboard principal</h1>
          <p style={{color:'rgba(255,255,255,0.95)',fontSize:18,fontWeight:500,marginTop:4}}>
            Vue d'ensemble de l'infrastructure
          </p>
        </div>
        <div className="controls" style={{display:'flex',gap:12,alignItems:'center'}}>
          <button 
            className="button" 
            onClick={refresh} 
            disabled={loading}
            style={{
              background:'rgba(255,255,255,0.95)',
              color:'#667eea',
              border:'2px solid rgba(255,255,255,0.3)',
              fontWeight:700,
              padding:'12px 20px'
            }}
          >
            {loading ? '⏳ Chargement...' : '🔄 Rafraîchir'}
          </button>
          {lastUpdated && (
            <span style={{
              color:'rgba(255,255,255,0.95)',
              fontSize:15,
              fontWeight:600,
              background:'rgba(255,255,255,0.15)',
              padding:'8px 16px',
              borderRadius:10,
              backdropFilter:'blur(10px)'
            }}>
              🕐 Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      <div className="grid fade-in">
        {/* EC2 Card */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon">
                <img src="/assets/icons/ec2.svg" alt="EC2 Icon" />
              </div>
              <div>
                <div className="card-title">Instances EC2 actives</div>
                <div className="card-subtitle">Nombre d'instances en cours</div>
              </div>
            </div>
            <div className="chip" style={{background:'rgba(102,126,234,0.15)',color:'#667eea'}}>EC2</div>
          </div>
          <div className="card-body">
            <div className="metric" style={{fontSize:56}}>
              {loading ? <span className="skeleton" style={{width:80,height:48,display:'inline-block'}}/> : formatNumber(stats.ec2)}
            </div>
          </div>
          <div className="card-footer">
            <div className="card-actions">
              <button className="button" onClick={refresh} disabled={loading}>
                {loading ? '⏳ Chargement…' : '🔄 Rafraîchir'}
              </button>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:'#4a5568'}}>
              Mise à jour {timeAgo(lastUpdated)}
            </div>
          </div>
        </div>

        {/* S3 Card */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon">
                <img src="/assets/icons/s3.svg" alt="S3 Icon" />
              </div>
              <div>
                <div className="card-title">Buckets S3</div>
                <div className="card-subtitle">Nombre de buckets</div>
              </div>
            </div>
            <div className="chip" style={{background:'rgba(16,185,129,0.15)',color:'#10b981'}}>S3</div>
          </div>
          <div className="card-body">
            <div className="metric" style={{fontSize:56}}>
              {loading ? <span className="skeleton" style={{width:80,height:48,display:'inline-block'}}/> : formatNumber(stats.s3)}
            </div>
          </div>
          <div className="card-footer">
            <div className="card-actions">
              <button className="button" onClick={refresh} disabled={loading}>
                {loading ? '⏳ Chargement…' : '🔄 Rafraîchir'}
              </button>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:'#4a5568'}}>
              Synchro {stats.status==='ok' ? '✅ OK' : '❌ OFFLINE'}
            </div>
          </div>
        </div>

        {/* AI Card - CORRECTION: Plus grande avec scrollbar horizontale */}
        <div className="card interactive" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon" style={{background:'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'}}>
                <img src="/assets/icons/ai.svg" alt="AI Icon" />
              </div>
              <div>
                <div className="card-title">Dernière recommandation IA</div>
                <div className="card-subtitle">Suggestion automatisée</div>
              </div>
            </div>
            <div className="chip" style={{background:'rgba(139,92,246,0.15)',color:'#8b5cf6'}}>AI</div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="skeleton" style={{height:80,borderRadius:8}}/>
            ) : (stats.ai === '—' || !stats.ai) ? (
              <div style={{
                background:'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(109,40,217,0.1))',
                padding:24,
                borderRadius:12,
                border:'2px solid rgba(139,92,246,0.2)',
                textAlign:'center'
              }}>
                <div style={{fontSize:40,marginBottom:8}}>🤖</div>
                <div style={{fontSize:16,fontWeight:600,color:'#2d3748'}}>
                  Aucune recommandation enregistrée
                </div>
                <div style={{fontSize:14,color:'#4a5568',marginTop:4}}>
                  Lancez une analyse dans la section IA
                </div>
              </div>
            ) : (
              <pre className="mono" style={{
                maxHeight:200,
                overflowY:'auto',
                overflowX:'auto',
                fontSize:14,
                whiteSpace:'pre-wrap',
                wordBreak:'break-word'
              }}>
                {JSON.stringify(stats.ai, null, 2)}
              </pre>
            )}
          </div>
          <div className="card-footer">
            <div className="card-actions">
              <button className="button" onClick={refresh} disabled={loading}>
                {loading ? '⏳ Chargement…' : '🔄 Rafraîchir'}
              </button>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:'#4a5568'}}>
              Basé sur les 24h
            </div>
          </div>
        </div>

        {/* Backend Status Card */}
        <div className="card interactive">
          <div className="card-header">
            <div className="card-head">
              <div className="card-icon" style={{background:'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
                <img src="/assets/icons/cloudwatch.svg" alt="CloudWatch Icon" />
              </div>
              <div>
                <div className="card-title">Statut backend</div>
                <div className="card-subtitle">Santé du service</div>
              </div>
            </div>
            <div className={`chip ${stats.status==='ok'?'':'muted'}`} 
                 style={{
                   background: stats.status==='ok' 
                     ? 'rgba(16,185,129,0.15)' 
                     : 'rgba(245,101,101,0.15)',
                   color: stats.status==='ok' ? '#10b981' : '#f56565'
                 }}>
              {stats.status}
            </div>
          </div>
          <div className="card-body">
            <div style={{
              fontSize:48,
              fontWeight:800,
              background: stats.status==='ok' 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #f56565, #c53030)',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
              marginTop:12
            }}>
              {loading ? (
                <span className="skeleton" style={{width:120,height:40,display:'inline-block'}}/>
              ) : (
                stats.status === 'ok' ? '✅ ONLINE' : '❌ OFFLINE'
              )}
            </div>
          </div>
          <div className="card-footer">
            <div className="card-actions">
              <button className="button" onClick={refresh} disabled={loading}>
                {loading ? '⏳ Ping…' : '📡 Check'}
              </button>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:'#4a5568'}}>
              Dernier ping: {lastUpdated ? lastUpdated.toLocaleTimeString('fr-FR') : 'maintenant'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}