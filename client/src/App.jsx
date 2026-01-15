import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';

function App() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Handle auth callback
    const authStatus = searchParams.get('auth');
    if (authStatus) {
      // Clear the URL params
      setSearchParams({});

      if (authStatus === 'success') {
        console.log('Authentication successful');
      } else if (authStatus === 'error') {
        const message = searchParams.get('message');
        console.error('Authentication error:', message);
      }
    }
  }, [searchParams, setSearchParams]);

  return (
    <AuthProvider>
      <TaskProvider>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;
