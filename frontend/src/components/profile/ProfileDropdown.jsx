import { useState } from 'react';
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

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 bg-gray-200 rounded-full px-3 py-1">
        <span className="font-medium">{user.username}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded shadow-lg border p-4 z-10">
          <div className="mb-2">
            <span className="text-sm text-gray-500">Utente</span>
            <div className="font-medium">{user.username}</div>
            {user.isGuest && <span className="text-xs text-yellow-600">Ospite</span>}
          </div>
          {!user.isGuest && (
            <Button size="sm" variant="secondary" onClick={() => setEditMode(true)} className="w-full text-sm">Modifica profilo</Button>
          )}
          <hr className="my-2" />
          <Button size="sm" variant="danger" onClick={logout} className="w-full text-sm">Logout</Button>
        </div>
      )}
      <Modal isOpen={editMode} onClose={() => setEditMode(false)}>
        <h3 className="text-lg font-bold mb-4">Modifica profilo</h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label="Nuovo username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input label="Nuova password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Conferma password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setEditMode(false)}>Annulla</Button>
            <Button type="submit">Salva</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}