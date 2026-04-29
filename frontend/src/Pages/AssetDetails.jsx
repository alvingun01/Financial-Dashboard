import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function AssetDetails() {
  const { type, id } = useParams();

  return (
    <div className="container animate-fade-in py-10">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </Link>

      <div className="glass p-10">
        <h1 className="text-white mb-2 uppercase tracking-widest">{id}</h1>
        <p className="text-[#94a3b8] capitalize">{type} Details Page</p>
        
        <div className="mt-10 p-20 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-xl font-bold mb-2">Deep Dive Analytics Coming Soon</h2>
          <p className="text-[#94a3b8] max-w-xs">
            We are currently building the specialized charts and statistics for {id}.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AssetDetails;
