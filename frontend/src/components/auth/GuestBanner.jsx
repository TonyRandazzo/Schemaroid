import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';

export default function GuestBanner() {
  const { user } = useAuthStore();
  if (!user?.isGuest) return null;
  return (
    <div className="bg-yellow-100 border-b border-yellow-300 p-2 text-center text-sm text-yellow-800">
      Stai navigando come ospite. <Link to="/register" className="underline font-medium">Registrati</Link> per salvare i tuoi progetti.
    </div>
  );
}