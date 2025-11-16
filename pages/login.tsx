
// pages/login.tsx
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Button } from '../components/Button';
import { Icons } from '../components/Icons';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/admin'); // Если пользователь уже вошел, перенаправляем в админку
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <div>Loading...</div>; // Показываем загрузку, пока идет проверка
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <p className="mb-6 text-gray-600">Please sign in to access the admin dashboard.</p>
        <Button onClick={login} variant="primary" className="w-full flex items-center justify-center">
          <Icons.google className="w-5 h-5 mr-2" />
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
