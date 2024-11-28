import { useState } from 'react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123456') {
      localStorage.setItem('pos-auth', 'true');
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-pos-primary flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">POS System Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Passwort eingeben"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 
                       ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">Falsches Passwort</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}; 