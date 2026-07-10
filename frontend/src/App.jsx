import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterRequest from './pages/RegisterRequest';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import './App.css';

function Navbar() {
  const token = localStorage.getItem('token');
  const user = token ? JSON.parse(localStorage.getItem('user')) : null;
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
         Edutaller
      </Link>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Inicio</Link>
        <button 
          onClick={toggleTheme}
          className="btn-theme-toggle"
          title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
        {user ? (
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
            Mi Panel
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
            Ingresar
          </Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<RegisterRequest />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/student" element={<StudentDashboard />} />
        </Routes>
      </main>
      <footer style={{ 
        textAlign: 'center', 
        padding: '2rem', 
        borderTop: '1px solid var(--glass-border)', 
        color: 'var(--text-muted)', 
        fontSize: '0.9rem',
        background: 'var(--footer-bg)'
      }}>
        © {new Date().getFullYear()} Edutaller. Academia Técnica de Capacitación. Todos los derechos reservados.
      </footer>
    </BrowserRouter>
  );
}

export default App;
