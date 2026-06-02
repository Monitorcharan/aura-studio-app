import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WebGLBackground from './components/WebGLBackground';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import AIChatWidget from './components/AIChatWidget';

// Page imports
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Booking from './pages/Booking';
import Confirmation from './pages/Confirmation';
import Payment from './pages/Payment';
import Invoice from './pages/Invoice';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import PaymentHistory from './pages/PaymentHistory';
import VirtualMirror from './pages/VirtualMirror';
import Lookbook from './pages/Lookbook';

import './App.css';

function App() {
  return (
    <Router>
      <div className="relative min-h-screen overflow-hidden selection:bg-accentCyan" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
        
        {/* Custom cursor follower */}
        <CustomCursor />

        {/* Global WebGL Background Piece */}
        <WebGLBackground />

        {/* Global Navbar Header */}
        <Navbar />

        {/* SPA Content container */}
        <div className="relative z-10 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/invoice" element={<Invoice />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/virtual-mirror" element={<VirtualMirror />} />
            <Route path="/lookbook" element={<Lookbook />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>

        <div className="watermark">Powered by Open AI</div>

        {/* Global AI Chat Widget */}
        <AIChatWidget />
      </div>
    </Router>
  );
}

export default App;
