
import React from 'react';

const Logo: React.FC = () => (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
    </svg>
);

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Logo />
            <h1 className="text-xl font-bold text-white tracking-wide">
              Catalog Product Extractor
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};
