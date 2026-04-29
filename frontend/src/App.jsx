import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './Pages/Dashboard.jsx';
import AssetDetails from './Pages/AssetDetails.jsx';
import Discovery from './Pages/Discovery.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#05070a] text-white">
        <nav className="border-b border-white/5 py-4 px-8 flex gap-8 items-center">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-[#00aaff] to-purple-500 bg-clip-text text-transparent">My Finances</Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-[#00aaff] transition-colors">Dashboard</Link>
            <Link to="/discovery" className="hover:text-[#00aaff] transition-colors text-[#94a3b8]">Market Explorer</Link>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/asset/:type/:id" element={<AssetDetails />} />
          <Route path="/discovery" element={<Discovery />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
