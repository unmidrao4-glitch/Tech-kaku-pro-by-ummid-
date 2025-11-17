
import React from 'react';
import type { Product } from '../types';

const productData: Product[] = [
  {
    name: 'eiSighT XR Ultra',
    description: 'The pinnacle of augmented reality. Unmatched performance, 8K resolution, and all-day comfort for professionals and creators.',
    image: 'https://picsum.photos/seed/xrultra/600/400',
    features: ['Gemini Pro On-Device', 'Holographic Waveguides', '12-Hour Battery', 'Spatial Audio'],
  },
  {
    name: 'eiSighT XR',
    description: 'The perfect balance of power and portability. Ideal for immersive gaming, collaborative work, and everyday augmented experiences.',
    image: 'https://picsum.photos/seed/xr/600/400',
    features: ['Gemini Flash Powered', '4K Micro-OLED Displays', 'Intuitive Hand Tracking', '6DoF Controllers'],
  },
  {
    name: 'eiSighT liTe',
    description: 'Sleek, lightweight smart glasses for on-the-go notifications, translation, and navigation. Your world, enhanced.',
    image: 'https://picsum.photos/seed/lite/600/400',
    features: ['Gemini Flash-Lite Assistant', 'Heads-Up Display', 'Real-time Translation', 'Featherlight Design'],
  },
];

const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-indigo-500/20 hover:border-indigo-500 hover:-translate-y-1">
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
        <div className="p-6">
            <h3 className="text-xl font-bold text-white">{product.name}</h3>
            <p className="mt-2 text-gray-400">{product.description}</p>
            <ul className="mt-4 space-y-2">
                {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span className="text-gray-300">{feature}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);


export const Products: React.FC = () => {
  return (
    <section id="products" className="py-20 md:py-28 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Our Product Lineup</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">Engineered for every reality.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {productData.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
