import React, { useState, useEffect } from 'react'

export default function DesignToolbar({ collapsed, setCollapsed, hideSidebar }){
  const [theme, setTheme] = useState('default')
  const [prevTheme, setPrevTheme] = useState(null)

  useEffect(() => {
    // apply current theme on mount
    applyTheme(theme)
  }, [])

  function applyTheme(t){
    const body = document.body
    // save previous theme class for revert
    const prev = body.dataset.appliedTheme || 'default'
    setPrevTheme(prev)
    body.dataset.appliedTheme = t
    if(t === 'alt'){
      body.classList.add('theme-alt')
    } else {
      body.classList.remove('theme-alt')
    }
    setTheme(t)
  }

  function toggleSidebar(){
    setCollapsed(!collapsed)
  }

  function revert(){
    // revert theme and expanded sidebar
    if(prevTheme){
      applyTheme(prevTheme)
    } else {
      applyTheme('default')
    }
    setCollapsed(false)
  }

  if(hideSidebar) return null

  return (
    <div className="design-toolbar">
      <div className="dt-row">
        <label>Thème</label>
        <select value={theme} onChange={e=>applyTheme(e.target.value)}>
          <option value="default">Par défaut</option>
          <option value="alt">Clair alternatif</option>
        </select>
      </div>
      <div className="dt-row">
        <button className="button" onClick={toggleSidebar}>{collapsed ? 'Ouvrir sidebar' : 'Réduire sidebar'}</button>
      </div>
      <div className="dt-row">
        <button className="button outline" onClick={revert}>Retour dernier</button>
      </div>
    </div>
  )
}
