
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Kaku Technologies. All rights reserved.</p>
          <p className="text-sm mt-1">Imagining and building the future of augmented reality.</p>
        </div>
      </div>
    </footer>
  );
};
