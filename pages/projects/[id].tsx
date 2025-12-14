
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AuthGuard, useAuth } from '../../contexts/AuthContext';
import { ProjectContext } from '../../types';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ProjectChat } from '../../components/ProjectChat';

function ProjectPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user } = useAuth();
    const [project, setProject] = useState<ProjectContext | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProject = async () => {
            if (!id || !user) return;
            
            try {
                const token = await user.getIdToken();
                // We need an endpoint to get a single project
                const res = await fetch(`/api/projects`, { 
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) throw new Error('Проект не найден или у вас нет доступа');
                
                const projects: ProjectContext[] = await res.json();
                const currentProject = projects.find(p => p.id === id);

                if (!currentProject) throw new Error('Проект не найден');
                
                setProject(currentProject);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [id, user]);

    return (
        <>
            <Header />
            <main className="container mx-auto px-6 py-12">
                {isLoading && <p className="text-center text-gray-500">Загрузка проекта...</p>}
                {error && <p className="text-center text-red-500 py-10">{error}</p>}
                {project && <ProjectChat project={project} />}
            </main>
            <Footer />
        </>
    );
}

// Wrap with AuthGuard to ensure user is logged in
export default function GuardedProjectPage() {
    return (
        <AuthGuard>
            <ProjectPage />
        </AuthGuard>
    );
}
