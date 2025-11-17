
import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Products } from './components/Products';
import { AIDemoShowcase } from './components/AIDemoShowcase';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Products />
        <AIDemoShowcase />
      </main>
      <Footer />
    </div>
  );
};

export default App;
