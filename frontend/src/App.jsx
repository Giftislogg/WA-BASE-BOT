import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Connect from './pages/Connect.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Stickers from './pages/Stickers.jsx';
import Flagged from './pages/Flagged.jsx';
import NavBar from './components/NavBar.jsx';

function App() {
  const sessionId = localStorage.getItem('sessionId');

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connect" element={sessionId ? <Navigate to="/dashboard" replace /> : <Connect />} />
          <Route path="/dashboard" element={sessionId ? <Dashboard /> : <Navigate to="/connect" replace />} />
          <Route path="/stickers" element={sessionId ? <Stickers /> : <Navigate to="/connect" replace />} />
          <Route path="/flagged" element={sessionId ? <Flagged /> : <Navigate to="/connect" replace />} />
          <Route path="/report" element={<Navigate to="/stickers" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {sessionId && <NavBar />}
      </div>
    </BrowserRouter>
  );
}

export default App;
