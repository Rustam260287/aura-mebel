
import React from 'react';
import { ProjectContext } from '../../types';

interface ProposalTemplateProps {
  project: ProjectContext;
}

export const ProposalTemplate: React.FC<ProposalTemplateProps> = ({ project }) => {
  return (
    <html lang="ru">
      <head>
        <meta charSet="UTF-8" />
        <style>{`
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { width: 800px; margin: 40px auto; padding: 40px; border: 1px solid #eee; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; }
          .title { font-size: 28px; margin: 30px 0; }
          .item { display: flex; margin-bottom: 20px; border-bottom: 1px solid #f9f9f9; padding-bottom: 20px; }
          .item img { width: 100px; height: 100px; object-fit: cover; margin-right: 20px; border-radius: 8px; }
          .item-info { flex-grow: 1; }
          .item-name { font-weight: bold; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div className="logo">Labelcom</div>
            <div>Подборка для обсуждения</div>
          </div>
          <h1 className="title">Проект: {project.name}</h1>
          
          <div>
            {project.items.map((item, index) => (
              <div key={index} className="item">
                <img src={item.imageUrls?.[0]} alt={item.name} />
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </body>
    </html>
  );
};
