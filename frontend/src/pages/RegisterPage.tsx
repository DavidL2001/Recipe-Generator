import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './AuthPage.module.scss';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

const RegisterPage = () => {
  const { register, error, isLoading, clearError } = useAuth();
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (error || localError) {
      clearError();
      setLocalError(null);
    }
  }, [form.name, form.email, form.password, form.confirm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = (): string | null => {
    if (form.name.trim().length < 2)
      return 'Namnet måste vara minst 2 tecken.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Ange en giltig e-postadress.';
    if (form.password.length < 8)
      return 'Lösenordet måste vara minst 8 tecken.';
    if (!/[A-Z]/.test(form.password))
      return 'Lösenordet måste innehålla minst en stor bokstav.';
    if (!/[0-9]/.test(form.password))
      return 'Lösenordet måste innehålla minst en siffra.';
    if (form.password !== form.confirm)
      return 'Lösenorden matchar inte.';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setLocalError(msg);
      return;
    }
    register(form.email, form.password, form.name.trim());
  };

  const displayError = localError || error;

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>🍳</span>
          <h1 className={styles.title}>Skapa konto</h1>
          <p className={styles.subtitle}>Starta din AI-drivna receptresa</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {displayError && (
            <div className={styles.errorBanner} role="alert">
              {displayError}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>Fullständigt namn</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Anna Svensson"
              disabled={isLoading}
            />
          </div>

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
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm" className={styles.label}>Bekräfta lösenord</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={handleChange}
              className={styles.input}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading || !form.name || !form.email || !form.password || !form.confirm}
          >
            {isLoading ? (
              <span className={styles.spinner} aria-label="Skapar konto…" />
            ) : (
              'Skapa konto'
            )}
          </button>
        </form>

        <p className={styles.switchAuth}>
          Har du redan ett konto?{' '}
          <Link to="/login" className={styles.link}>
            Logga in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
