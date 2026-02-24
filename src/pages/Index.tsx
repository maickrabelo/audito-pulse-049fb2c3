import React from 'react';
import HeroSection from '@/components/landing/HeroSection';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <HeroSection />
      </main>
    </div>
  );
};

export default Index;
