
import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="relative py-20 md:py-32 bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-grid-gray-700/[0.2] [mask-image:linear-gradient(to_bottom,white_5%,transparent_90%)]"></div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/80 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-900/20 blur-[100px]"></div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
          The Future of Sight, Amplified.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300">
          Kaku Technologies pioneers the next generation of augmented reality. Our eiSighT devices merge the digital and physical worlds, powered by state-of-the-art AI.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <a
            href="#demos"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            Explore AI Demos
          </a>
          <a
            href="#products"
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            View Products
          </a>
        </div>
      </div>
    </section>
  );
};
