import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(username, password);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Registrati</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full">Registrati</Button>
        </form>
        <div className="text-center">
          <Link to="/login" className="text-blue-600 hover:underline">Hai già un account? Accedi</Link>
        </div>
      </div>
    </div>
  );
}