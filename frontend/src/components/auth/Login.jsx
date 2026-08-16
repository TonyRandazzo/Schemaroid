import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ThemeToggle from '../ui/ThemeToggle';
import AuthBackground from './AuthBackground';
import Wordmark from './Wordmark';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, loginAsGuest } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Accesso non riuscito');
    } finally {
      setBusy(false);
    }
  };

  const handleGuest = async () => {
    setBusy(true);
    try {
      await loginAsGuest();
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Accesso come ospite non riuscito');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthBackground />

      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Wordmark subtitle="Accedi per continuare" />

          <div className="card border-white/10 bg-surface/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Attendere…' : 'Accedi'}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs uppercase tracking-wider text-fg-subtle">oppure</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <Button variant="secondary" className="w-full" onClick={handleGuest} disabled={busy}>
              Continua come ospite
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-white/70">
            Non hai un account?{' '}
            <Link to="/register" className="font-semibold text-white underline underline-offset-4 hover:text-accent">
              Registrati
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-white/50">
            Accedendo accetti l&apos;
            <Link to="/privacy" className="underline underline-offset-4 hover:text-white/80">
              informativa sulla privacy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
