import { useState, FormEvent } from 'react';
import { Heart, User, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Email ou senha inválidos. Tente novamente.');
      }
    } catch (error) {
      setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary-600 text-white rounded-full flex items-center justify-center">
            <Heart className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sistema de Controle de Medicamentos
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 animate-bounce-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="seu@email.com"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {error && <p className="text-danger-600 text-sm">{error}</p>}

            <div>
              <button
                type="submit"
                className="w-full btn-primary py-3 flex justify-center"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Credenciais de Acesso</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div className="rounded-md bg-gray-50 p-3">
                <h5 className="text-sm font-medium text-gray-700">Administrador</h5>
                <p className="text-xs text-gray-500">Email: admin@example.com</p>
                <p className="text-xs text-gray-500">Senha: admin123</p>
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <h5 className="text-sm font-medium text-gray-700">Farmacêutico UBS</h5>
                <p className="text-xs text-gray-500">Email: farmacia@example.com</p>
                <p className="text-xs text-gray-500">Senha: pharma123</p>
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <h5 className="text-sm font-medium text-gray-700">Almoxarifado</h5>
                <p className="text-xs text-gray-500">Email: almoxarifado@example.com</p>
                <p className="text-xs text-gray-500">Senha: warehouse123</p>
                <p className="text-xs text-gray-400">Role: warehouse</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;