import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export default function ProfileDropdown() {
  const { user, logout, updateProfile } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password && password !== confirm) return alert('Le password non coincidono');
    try {
      await updateProfile({ username: username !== user.username ? username : undefined, password: password || undefined });
      setEditMode(false);
      setPassword('');
      setConfirm('');
    } catch (err) {
      alert(err.response?.data?.error || 'Errore');
    }
  };

  if (!user) return null;

  const initial = user.username?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5
          transition-colors hover:bg-surface-hover"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-fg text-xs font-semibold">
          {initial}
        </span>
        <span className="text-sm font-medium text-fg max-w-[10rem] truncate">{user.username}</span>
        <svg className="w-3.5 h-3.5 text-fg-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="menu absolute right-0 mt-2 w-64 p-1.5">
          <div className="px-2.5 py-2">
            <div className="text-xs uppercase tracking-wider text-fg-subtle">Utente</div>
            <div className="font-medium text-fg truncate">{user.username}</div>
            {user.isGuest && (
              <span className="mt-1 inline-block rounded-full bg-warning-soft px-2 py-0.5 text-xs text-warning-fg">
                Ospite
              </span>
            )}
          </div>

          <div className="my-1.5 h-px bg-line" />

          <div className="flex flex-col gap-1.5 px-1 pb-1">
            {!user.isGuest && (
              <Button size="sm" variant="secondary" onClick={() => setEditMode(true)} className="w-full">
                Modifica profilo
              </Button>
            )}
            <Button size="sm" variant="danger" onClick={logout} className="w-full">
              Logout
            </Button>
          </div>

          <div className="my-1.5 h-px bg-line" />
          <Link
            to="/privacy"
            className="block px-2.5 py-1 text-xs text-fg-subtle transition-colors hover:text-fg"
          >
            Informativa sulla privacy
          </Link>
        </div>
      )}

      <Modal isOpen={editMode} onClose={() => setEditMode(false)}>
        <h3 className="text-lg font-semibold text-fg mb-5">Modifica profilo</h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label="Nuovo username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input label="Nuova password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Conferma password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setEditMode(false)}>Annulla</Button>
            <Button type="submit">Salva</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
