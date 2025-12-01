import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/Api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const data = await login(email, password);
      if (data?.token) {
        localStorage.setItem('cnops_token', data.token);
        navigate('/dashboard');
      } else {
        // backend will normally return 401 or an error message;
        setError(data?.message || 'Identifiants invalides');
      }
    } catch (err) {
      // surface server-provided message if available so user can see why login failed
      const serverMsg = err?.response?.data?.message || err?.message || 'Erreur de connexion';
      setError(serverMsg);
    }
  }

  return (
    <div className="auth-page auth-container">
      <div className="auth-card">
        <h1>Bienvenue!</h1>
        <p className="subtitle">Connectez-vous pour continuer</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            Se connecter
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
        <p className="footer-text">
          Pas de compte? <Link to="/signup">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
