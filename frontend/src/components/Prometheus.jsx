import React, { useState } from 'react'
import api from '../api/Api'

export default function Prometheus(){
  const [txt,setTxt]=useState('')
  const [loading,setLoading]=useState(false)

  async function load(){
    setLoading(true)
    try{
      const r = await api.get('/metrics')
      setTxt(r.data)
    }catch(e){ setTxt('Erreur: impossible de récupérer /metrics') }
    setLoading(false)
  }

  return (
    <div className="page">
      <h1>Prometheus — Metrics backend</h1>
      <div className="card">
        <button className="primary" onClick={load} disabled={loading}>{loading? 'Chargement...' : 'Afficher métriques API'}</button>
        <pre className="mono metrics-box">{txt}</pre>
      </div>
    </div>
  )
}
