import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [role, setRole] = useState('student'); // 'student', 'instructor', 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [instSettings, setInstSettings] = useState({
    hero_background_url: '',
    hero_backgrounds_list: ''
  });
  const [activeBgIndex, setActiveBgIndex] = useState(0);

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url;
  };

  useEffect(() => {
    axios.get('/api/auth/settings')
      .then(res => {
        if (res.data) {
          setInstSettings(res.data);
        }
      })
      .catch(err => console.error('Error al cargar configuraciones:', err));
  }, []);

  // Lista de imágenes predefinidas premium (se buscan en public/ del frontend y Unsplash)
  const defaultBgImages = [
    '/bg1.jpg',
    '/bg2.jpg',
    '/bg3.jpg',
    '/bg4.jpg',
    'https://images.unsplash.com/photo-1517420784867-10d7a52ad561?q=80&w=1200',
    'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=1200',
    'https://images.unsplash.com/photo-1426927308491-6380b6a9936f?q=80&w=1200',
    'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?q=80&w=1200',
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=1200'
  ];

  // Obtener la lista de imágenes dinámicas cargadas por el Administrador
  // Usamos siempre las imágenes predefinidas premium del carrusel estático
  const bgImages = defaultBgImages;

  useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 3000); // Cambiar cada 3 segundos (más seguido)
    return () => clearInterval(interval);
  }, [bgImages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
        role
      });
      
      const { token, user } = response.data;
      
      // Guardar sesión
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setSuccess('¡Ingreso exitoso! Redirigiendo...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error al intentar ingresar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="animated" 
      style={{ 
        position: 'relative',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '85vh', 
        padding: '2rem 1rem',
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        margin: '1rem 0'
      }}
    >
      {/* Capas de Fondo para Transición Suave */}
      {bgImages.length > 0 ? (
        bgImages.map((img, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${getFullUrl(img)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'opacity 1.5s ease-in-out',
              opacity: idx === activeBgIndex ? 1 : 0,
              zIndex: idx === activeBgIndex ? 1 : 0
            }}
          />
        ))
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
            zIndex: 0
          }}
        />
      )}

      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 2, boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: 800 }}>Iniciar Sesión</h2>
        
        {/* Selector de Rol */}
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'var(--inner-bg)', borderRadius: '8px', marginBottom: '2rem' }}>
          <button 
            type="button" 
            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: role === 'student' ? 'var(--primary)' : 'transparent', color: role === 'student' ? 'white' : 'var(--headings-color)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setRole('student')}
          >
            Estudiante
          </button>
          <button 
            type="button" 
            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: role === 'instructor' ? 'var(--primary)' : 'transparent', color: role === 'instructor' ? 'white' : 'var(--headings-color)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setRole('instructor')}
          >
            Instructor
          </button>
          <button 
            type="button" 
            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: role === 'admin' ? 'var(--primary)' : 'transparent', color: role === 'admin' ? 'white' : 'var(--headings-color)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setRole('admin')}
          >
            Admin
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
        
      </div>
    </div>
  );
}
