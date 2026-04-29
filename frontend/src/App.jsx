import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './Pages/Dashboard.jsx';
import AssetDetails from './Pages/AssetDetails.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/asset/:type/:id" element={<AssetDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
