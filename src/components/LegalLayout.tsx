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
        <article className="audit-container max-w-4xl bg-white rounded-lg shadow-sm p-8 md:p-12 legal-content">
          <header className="mb-8 pb-6 border-b">
            <h1 className="text-3xl md:text-4xl font-bold text-audit-primary mb-2">{title}</h1>
            <p className="text-sm text-gray-500">Última atualização: {updatedAt}</p>
          </header>
          <div className="text-gray-800 leading-relaxed space-y-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-audit-primary [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-audit-primary [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_a]:text-audit-secondary [&_a]:underline [&_strong]:font-semibold [&_table]:w-full [&_table]:border [&_th]:border [&_th]:p-2 [&_th]:bg-gray-100 [&_th]:text-left [&_td]:border [&_td]:p-2 [&_td]:align-top">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default LegalLayout;
