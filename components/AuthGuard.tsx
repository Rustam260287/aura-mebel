
// components/AuthGuard.tsx
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login'); // Если загрузка завершена и пользователя нет, перенаправляем на логин
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>; // Показываем загрузку, пока идет проверка
  }

  return <>{children}</>; // Если все в порядке, показываем дочерние компоненты
};
