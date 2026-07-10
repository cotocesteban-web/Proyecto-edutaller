import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } else {
      const u = JSON.parse(storedUser);
      if (u.role === 'admin') {
        navigate('/admin');
      } else if (u.role === 'instructor') {
        navigate('/instructor');
      } else if (u.role === 'student') {
        navigate('/student');
      } else {
        setUser(u);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Cargando sesión...</div>;
  }

  // Traducción estética de los roles
  const roleNames = {
    admin: 'Administrador de Plataforma',
    instructor: 'Instructor Académico',
    student: 'Estudiante Matriculado'
  };

  return (
    <div className="animated" style={{ padding: '2rem', maxWidth: '800px', margin: '3rem auto', width: '100%', boxSizing: 'border-box' }}>
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 1.5rem auto',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'white'
        }}>
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.25rem', fontWeight: 800 }}>¡Bienvenido, {user.name}!</h1>
        <p style={{ 
          display: 'inline-block',
          background: 'rgba(99, 102, 241, 0.15)', 
          color: 'var(--primary)', 
          padding: '0.35rem 1rem', 
          borderRadius: '9999px', 
          fontSize: '0.85rem', 
          fontWeight: 600,
          margin: '0 0 2rem 0',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          {roleNames[user.role] || user.role}
        </p>

        <div style={{ textAlign: 'left', background: 'var(--inner-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            Detalles del Perfil
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Email:</span>
            <span>{user.email}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>ID de Usuario:</span>
            <span>{user.id}</span>
            
            {user.phone && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>Teléfono:</span>
                <span>{user.phone}</span>
              </>
            )}
            
            {user.address && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>Dirección:</span>
                <span>{user.address}</span>
              </>
            )}
          </div>
        </div>

        <button className="btn btn-secondary" onClick={handleLogout}>Cerrar Sesión</button>
        
      </div>
    </div>
  );
}
