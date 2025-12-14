
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AuthGuard } from '../../components/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectContext } from '../../types';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/Button';
import { PlusIcon } from '../../components/Icons';

function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  const createNewProject = async () => {
    if (!user) return;
    try {
        const token = await user.getIdToken();
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Новый проект' })
        });
        const newProject = await res.json();
        router.push(`/projects/${newProject.id}`); // Redirect to new project page
    } catch (error) {
        alert("Не удалось создать проект");
    }
  };

  return (
    <>
        <Header />
        <main className="container mx-auto px-6 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif text-brand-brown">Мои проекты</h1>
                <Button onClick={createNewProject} disabled={isLoading}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Создать новый проект
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center text-gray-500">Загрузка проектов...</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-xl text-brand-charcoal">У вас пока нет проектов</p>
                    <p className="text-gray-500 mt-2 mb-4">Начните новый, чтобы сохранить историю общения с AI-ассистентом.</p>
                    <Button onClick={createNewProject}>Начать работу</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <Link key={project.id} href={`/projects/${project.id}`} className="block p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-brand-brown/50 transition-all">
                            <h3 className="font-bold text-brand-brown">{project.name}</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                {project.items?.length || 0} товаров
                            </p>
                            <p className="text-xs text-gray-400 mt-4">
                                Обновлен: {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </main>
        <Footer />
    </>
  );
}

// Защищаем страницу: только для авторизованных
export default function GuardedProjectsPage() {
    return (
        <AuthGuard>
            <ProjectsPage />
        </AuthGuard>
    );
}
