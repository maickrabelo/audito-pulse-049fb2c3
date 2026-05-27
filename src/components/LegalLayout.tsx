import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ title, updatedAt, children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <article className="audit-container max-w-4xl bg-white rounded-lg shadow-sm p-8 md:p-12">
          <header className="mb-8 pb-6 border-b">
            <h1 className="text-3xl md:text-4xl font-bold text-audit-primary mb-2">{title}</h1>
            <p className="text-sm text-gray-500">Última atualização: {updatedAt}</p>
          </header>
          <div className="prose prose-slate max-w-none prose-headings:text-audit-primary prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2 prose-p:leading-relaxed prose-li:my-1 prose-a:text-audit-secondary">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default LegalLayout;
