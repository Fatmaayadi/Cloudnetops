import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Server, Box, Activity, Zap, Database, Cpu, HardDrive, Network, AlertTriangle, CheckCircle, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KubernetesInterface() {
  const navigate = useNavigate();
  const [view, setView] = useState('auth'); // auth, environment, kubernetes
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('dev'); // NOUVEAU
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [deploymentStatus, setDeploymentStatus] = useState('idle');
  
  // États pour les données Kubernetes réelles
  const [pods, setPods] = useState([]);
  const [services, setServices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedPod, setSelectedPod] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les données Kubernetes
  const fetchKubernetesData = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      // Récupérer les pods
      const podsResponse = await fetch('http://localhost:5000/k8s/pods');
      if (!podsResponse.ok) throw new Error('Erreur lors de la récupération des pods');
      const podsData = await podsResponse.json();
      setPods(podsData.pods || []);

      // Récupérer les services
      const servicesResponse = await fetch('http://localhost:5000/k8s/services');
      if (!servicesResponse.ok) throw new Error('Erreur lors de la récupération des services');
      const servicesData = await servicesResponse.json();
      setServices(servicesData.services || []);

      // Récupérer les métriques du cluster
      const metricsResponse = await fetch('http://localhost:5000/k8s/metrics');
      if (!metricsResponse.ok) throw new Error('Erreur lors de la récupération des métriques');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Récupérer les recommandations IA
      const aiResponse = await fetch('http://localhost:5000/k8s/recommendation');
      if (!aiResponse.ok) throw new Error('Erreur lors de la récupération des recommandations');
      const aiData = await aiResponse.json();
      setRecommendation(aiData);

    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Rafraîchir automatiquement toutes les 10 secondes
  useEffect(() => {
    if (view === 'kubernetes') {
      fetchKubernetesData();
      const interval = setInterval(fetchKubernetesData, 10000);
      return () => clearInterval(interval);
    }
  }, [view]);

  // Fonction de déploiement
  const handleDeploy = async () => {
    setDeploymentStatus('deploying');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/k8s/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deployment: 'cloudnetops-backend' })
      });
      
      if (!response.ok) throw new Error('Erreur de déploiement');
      
      setDeploymentStatus('success');
      setTimeout(() => {
        fetchKubernetesData();
        setDeploymentStatus('idle');
      }, 2000);
      
    } catch (err) {
      console.error('Erreur de déploiement:', err);
      setDeploymentStatus('error');
      setError(err.message);
      setTimeout(() => setDeploymentStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    const payload = authMode === 'login' 
      ? { email, password }
      : { email, password, role };

    fetch(`http://localhost:5000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('cnops_token', data.token);
        localStorage.setItem('cnops_user', JSON.stringify({ email, role: data.role || role }));
        setView('environment');
      } else {
        setAuthError(data.message || 'Erreur d\'authentification');
      }
    })
    .catch(err => {
      setAuthError('Erreur de connexion au serveur');
      console.error(err);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('cnops_token');
    localStorage.removeItem('cnops_user');
    setView('auth');
    setEmail('');
    setPassword('');
    setRole('dev');
  };

  const skipAuth = () => {
    setView('environment');
  };

  const selectEnvironment = (env) => {
    if (env === 'aws') {
      window.location.href = '/dashboard';
    } else {
      setView('kubernetes');
    }
  };

  const getPodStatusColor = (status) => {
    if (status === 'Running') return 'text-green-600 bg-green-100';
    if (status === 'Pending') return 'text-yellow-600 bg-yellow-100';
    if (status === 'Failed') return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    if (status === 'Running') return <CheckCircle className="w-4 h-4" />;
    if (status === 'Pending') return <Clock className="w-4 h-4" />;
    if (status === 'Failed') return <AlertTriangle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  // PAGE D'AUTHENTIFICATION
  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Server className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              CloudNetOps
            </h1>
            <p className="text-gray-600">Infrastructure unifiée AWS & Kubernetes</p>
          </div>

          <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                authMode === 'login'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                authMode === 'signup'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600'
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>
            
            {/* NOUVEAU: Sélection du rôle pour l'inscription */}
            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rôle</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-600 focus:outline-none transition-all"
                >
                  <option value="dev">Développeur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Chargement...' : authMode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
            
            {/* Message d'erreur */}
            {authError && (
              <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-xl text-sm">
                {authError}
              </div>
            )}
          </form>

         
        </div>
      </div>
    );
  }

  // PAGE DE SÉLECTION D'ENVIRONNEMENT
  if (view === 'environment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-5xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Choisissez votre environnement
            </h1>
            <p className="text-white/90 text-xl">Déployez sur AWS Cloud ou Kubernetes Local</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* AWS CARD */}
            <button
              onClick={() => selectEnvironment('aws')}
              className="group bg-white/95 backdrop-blur-lg rounded-3xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl mb-6 flex items-center justify-center mx-auto group-hover:rotate-6 transition-transform">
                <Database className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">AWS Cloud</h2>
              <p className="text-gray-600 mb-6">
                Gérez vos instances EC2, buckets S3 et surveillez avec CloudWatch
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Instances EC2</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Buckets S3</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Monitoring CloudWatch</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Recommandations IA</span>
                </div>
              </div>
              <div className="mt-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-bold">
                Accéder à AWS →
              </div>
            </button>

            {/* KUBERNETES CARD */}
            <button
              onClick={() => selectEnvironment('kubernetes')}
              className="group bg-white/95 backdrop-blur-lg rounded-3xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6 flex items-center justify-center mx-auto group-hover:rotate-6 transition-transform">
                <Box className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Kubernetes Local</h2>
              <p className="text-gray-600 mb-6">
                Déployez et gérez vos pods avec monitoring Prometheus/Grafana
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Déploiement de pods</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Métriques en temps réel</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Prometheus & Grafana</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Recommandations IA</span>
                </div>
              </div>
              <div className="mt-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold">
                Accéder à Kubernetes →
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // INTERFACE KUBERNETES
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Box className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Kubernetes Dashboard</h1>
                  <p className="text-gray-600">Cluster Minikube - Temps réel</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => setView('environment')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <button
                onClick={fetchKubernetesData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Rafraîchir
              </button>
              {/* NOUVEAU: Bouton de déconnexion */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-100 border-2 border-red-500 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-bold text-red-900">Erreur de connexion</h3>
                <p className="text-red-700">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Vérifiez que le backend est démarré sur http://localhost:5000
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bouton de déploiement */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Déploiement Backend</h2>
              <p className="text-gray-600">Déployer cloudnetops-backend depuis deployment.yaml</p>
            </div>
            <button
              onClick={handleDeploy}
              disabled={loading || deploymentStatus === 'deploying'}
              className={`px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                deploymentStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : deploymentStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
              }`}
            >
              {deploymentStatus === 'deploying' && '⏳ Déploiement...'}
              {deploymentStatus === 'success' && '✅ Déployé avec succès'}
              {deploymentStatus === 'error' && '❌ Erreur de déploiement'}
              {deploymentStatus === 'idle' && '🚀 Déployer'}
            </button>
          </div>
        </div>

        {/* Métriques du cluster */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Box className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Pods</p>
                    <h3 className="text-3xl font-bold text-gray-900">{metrics.totalPods || 0}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pods actifs</p>
                    <h3 className="text-3xl font-bold text-gray-900">{metrics.runningPods || 0}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Server className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Services</p>
                    <h3 className="text-3xl font-bold text-gray-900">{services.length}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CPU Usage</p>
                    <h3 className="text-3xl font-bold text-gray-900">{metrics.cpuUsage || '0%'}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <HardDrive className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Memory Usage</p>
                    <h3 className="text-3xl font-bold text-gray-900">{metrics.memoryUsage || '0%'}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Network className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Network I/O</p>
                    <h3 className="text-3xl font-bold text-gray-900">{metrics.networkIO || '0 MB/s'}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des Pods */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pods déployés</h2>
          {pods.length === 0 ? (
            <div className="text-center py-12">
              <Box className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Aucun pod déployé</p>
              <p className="text-gray-500 text-sm mt-2">Déployez votre application pour voir les pods</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pods.map((pod, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPod(selectedPod === pod.name ? null : pod.name)}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-2 ${getPodStatusColor(pod.status)}`}>
                        {getStatusIcon(pod.status)}
                        {pod.status}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{pod.name}</h3>
                        <p className="text-sm text-gray-600">Namespace: {pod.namespace}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Restarts: {pod.restarts || 0}</p>
                      <p className="text-xs text-gray-500">Age: {pod.age || '—'}</p>
                    </div>
                  </div>
                  
                  {selectedPod === pod.name && pod.metrics && (
                    <div className="mt-4 pt-4 border-t border-blue-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">CPU</p>
                        <p className="font-bold text-blue-600">{pod.metrics.cpu || '0m'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Memory</p>
                        <p className="font-bold text-indigo-600">{pod.metrics.memory || '0Mi'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">IP</p>
                        <p className="font-bold text-purple-600">{pod.ip || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Node</p>
                        <p className="font-bold text-pink-600">{pod.node || '—'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Services */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Services exposés</h2>
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Aucun service exposé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service, idx) => (
                <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600">Type: {service.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-purple-600">Port: {service.port}</p>
                      {service.nodePort && (
                        <p className="text-xs text-gray-600">NodePort: {service.nodePort}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommandations IA */}
        {recommendation && (
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommandations IA</h2>
                <p className="text-gray-600">Optimisations suggérées pour votre cluster</p>
              </div>
            </div>
            
            {recommendation.recommendations && recommendation.recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendation.recommendations.map((rec, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl border-2 ${
                      rec.type === 'success' ? 'bg-green-50 border-green-200' :
                      rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      rec.type === 'error' ? 'bg-red-50 border-red-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {rec.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {rec.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                        {rec.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                        {rec.type === 'info' && <Activity className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{rec.title}</h3>
                        <p className="text-gray-700 text-sm mb-2">{rec.message}</p>
                        <p className="text-xs text-gray-600 bg-white/50 px-3 py-2 rounded-lg">
                          💡 <strong>Action:</strong> {rec.action}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucune recommandation pour le moment</p>
              </div>
            )}

            {recommendation.summary && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{recommendation.summary.totalPods}</p>
                    <p className="text-xs text-gray-600">Total Pods</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{recommendation.summary.healthyPods}</p>
                    <p className="text-xs text-gray-600">Pods sains</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{recommendation.summary.issues}</p>
                    <p className="text-xs text-gray-600">Problèmes</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Liens vers Prometheus et Grafana */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Prometheus</h3>
                <p className="text-sm text-gray-600">Métriques et alertes</p>
              </div>
            </div>
            <a
              href="http://localhost:9090"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Ouvrir Prometheus →
            </a>
          </div>

          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Grafana</h3>
                <p className="text-sm text-gray-600">Dashboards visuels</p>
              </div>
            </div>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Ouvrir Grafana →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}