import { Clock, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">TimeKit</h1>
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : isAuthenticated ? (
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
