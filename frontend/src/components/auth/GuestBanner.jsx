import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';

export default function GuestBanner() {
  const { user } = useAuthStore();
  if (!user?.isGuest) return null;
  return (
    <div className="bg-warning-soft border-b border-warning-line px-4 py-2 text-center text-sm text-warning-fg">
      Stai navigando come ospite.{' '}
      <Link to="/register" className="font-medium underline underline-offset-2">Registrati</Link>{' '}
      per salvare i tuoi progetti.
    </div>
  );
}
