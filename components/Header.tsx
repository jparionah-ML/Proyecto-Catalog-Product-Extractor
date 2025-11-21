import React from 'react';

const Logo: React.FC = () => (
    <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
    </div>
);

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <Logo />
            <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                Catalog Product Extractor
                </h1>
                <p className="text-xs text-slate-400 font-medium">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <div className="hidden md:block">
            <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </div>
    </header>
  );
};