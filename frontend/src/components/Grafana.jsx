import React from 'react'

export default function Grafana(){
  return (
    <div className="page">
      <h1>Grafana — Observability</h1>
      <div className="card wide">
        <h3>Ouvrir Grafana</h3>
        <p>Vous pouvez ouvrir Grafana dans un nouvel onglet ou l'intégrer via iframe ci-dessous.</p>
        <div className="row">
          <a className="button" href="http://localhost:3000" target="_blank" rel="noreferrer">Ouvrir Grafana</a>
        </div>
        <iframe title="grafana-dashboard" src="http://localhost:3000/d/cloudnetops-dashboard" style={{width:'100%',height:600,border:0,marginTop:12}} />
      </div>
    </div>
  )
}
