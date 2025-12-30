
import React, { memo, useMemo } from 'react';
import type { JournalEntry, ObjectPublic, View } from '../types';
import { ArrowLeftIcon } from './Icons';
import { Button } from './Button';
import Image from 'next/image';
import { ObjectCard } from './ObjectCard';

interface JournalEntryPageProps {
  post: JournalEntry;
  relatedObjects: ObjectPublic[];
  onNavigate: (view: View) => void;
}

export const JournalEntryPage: React.FC<JournalEntryPageProps> = memo(({ post, relatedObjects, onNavigate }) => {

  const cleanContent = useMemo(() => {
      if (!post.content) return '';
      return post.content.replace(/\[(OBJECT):.*?\]/g, '');
  }, [post.content]);

  return (
    <div className="bg-[#FBF9F4] min-h-screen">
      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[400px] bg-brand-charcoal">
        <Image 
          src={post.imageUrl || '/placeholder.svg'} 
          alt={post.title}
          className="object-cover opacity-90"
          fill
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-12 container mx-auto pointer-events-none">
            {/* Top Bar - Button (pointer-events-auto to make it clickable) */}
            <div className="pt-4 pointer-events-auto self-start">
                <Button 
                    variant="ghost" 
                    onClick={() => onNavigate({ page: 'journal-list' })} 
                    className="text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Журнал
                </Button>
            </div>
            
            {/* Bottom Info */}
            <div className="max-w-4xl animate-fade-in-up pointer-events-auto">
                <div className="flex items-center gap-3 mb-4 text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase">
                    <span className="bg-brand-terracotta px-2 py-1">{(post.tags && post.tags[0]) || 'Статья'}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt || Date.now()).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-7xl font-serif text-white leading-[1.1] mb-8 drop-shadow-2xl max-w-3xl">
                    {post.title}
                </h1>
                {post.author && (
                    <div className="flex items-center gap-3 text-white/90">
                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-xs font-serif border border-white/20">L</div>
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Автор: {post.author}</span>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-16 md:py-24 max-w-3xl relative">
        <article 
          className="prose prose-lg prose-brown max-w-none 
          prose-headings:font-serif prose-headings:font-normal prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-brand-charcoal
          prose-p:text-brand-charcoal/80 prose-p:leading-loose prose-p:font-light prose-p:mb-6
          prose-a:text-brand-terracotta prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-4 prose-blockquote:border-brand-terracotta prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-xl prose-blockquote:font-serif prose-blockquote:text-brand-charcoal prose-blockquote:my-10
          prose-img:rounded-sm prose-img:shadow-xl prose-img:my-10
          first-letter:float-left first-letter:text-6xl first-letter:pr-4 first-letter:font-serif first-letter:text-brand-terracotta first-letter:leading-none first-letter:mt-2"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />

        {relatedObjects && relatedObjects.length > 0 && (
          <section className="mt-24 pt-16 border-t border-brand-brown/10">
            <div className="text-center mb-12">
                 <span className="text-brand-terracotta text-xs font-bold uppercase tracking-widest block mb-2">Подборка к статье</span>
                <h2 className="text-3xl font-serif text-brand-charcoal">Попробуйте в интерьере</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {relatedObjects.slice(0, 2).map((object) => (
                <div key={object.id} className="transform hover:-translate-y-2 transition-transform duration-300">
                    <ObjectCard 
                        object={object}
                        onObjectSelect={(id) => onNavigate({ page: 'object', objectId: id })}
                    />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
});

JournalEntryPage.displayName = 'JournalEntryPage';
