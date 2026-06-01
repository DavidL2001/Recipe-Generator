import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import styles from './AuthPage.module.scss';

const LoginPage = () => {
  const { login, error, isLoading, clearError } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (error) clearError();
  }, [form.email, form.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(form.email, form.password);
  };

  if (isAuthenticated) return null;

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>🍳</span>
          <h1 className={styles.title}>Välkommen tillbaka</h1>
          <p className={styles.subtitle}>Logga in på din receptsamling</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>E-post</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="du@exempel.se"
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Lösenord</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading || !form.email || !form.password}
          >
            {isLoading ? (
              <span className={styles.spinner} aria-label="Loggar in…" />
            ) : (
              'Logga in'
            )}
          </button>
        </form>

        <p className={styles.switchAuth}>
          Har du inget konto?{' '}
          <Link to="/register" className={styles.link}>
            Skapa ett
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
