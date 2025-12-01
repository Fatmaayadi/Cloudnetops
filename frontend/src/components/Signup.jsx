import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/Api';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('dev');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await signup(email, password, role);
      // If backend returns token on successful register, persist and redirect
      if (data?.token) {
        localStorage.setItem('cnops_token', data.token);
        navigate('/dashboard');
      } else if (data?.message) {
        // some backends return a message and expect user to log in
        navigate('/login');
      } else {
        navigate('/login');
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message || "Erreur lors de l'inscription";
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page auth-container">
      <div className="auth-card">
        <h1>Créer un compte</h1>
        <p className="subtitle">Rejoignez-nous et commencez votre aventure</p>
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
          <div className="form-group">
            <label>Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="dev">Dev</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
        <p className="footer-text">
          Déjà un compte? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
