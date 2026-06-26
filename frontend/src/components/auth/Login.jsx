import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, guestLogin } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  const handleGuest = async () => {
    const guestId = localStorage.getItem('guestId') || crypto.randomUUID();
    localStorage.setItem('guestId', guestId);
    await guestLogin(guestId);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Accedi</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full">Accedi</Button>
        </form>
        <div className="text-center">
          <Link to="/register" className="text-blue-600 hover:underline">Registrati</Link>
          <span className="mx-2">|</span>
          <button onClick={handleGuest} className="text-gray-600 hover:underline">Continua come ospite</button>
        </div>
      </div>
    </div>
  );
}