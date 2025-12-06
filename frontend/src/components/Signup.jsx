import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/Api';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('dev');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const data = await signup(email, password, role);
      if (data?.token) {
        localStorage.setItem('cnops_token', data.token);
        navigate('/dashboard');
      } else if (data?.message) {
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
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Créer un compte</h1>
          <p className="subtitle">Rejoignez CloudNetOps dès aujourd'hui</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="dev">Développeur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>
            {error && <p className="error-message">{error}</p>}
          </form>
          <p className="footer-text">
            Déjà un compte? <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}