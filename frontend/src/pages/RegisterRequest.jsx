import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Helper para decodificar JWT sin librerías externas
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch (e) {
    return null;
  }
};

export default function RegisterRequest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const courseIdFromParam = searchParams.get('courseId') || '';
  const courseNameFromParam = searchParams.get('courseName') || '';

  const [googleAuthenticated, setGoogleAuthenticated] = useState(false);
  const [googleUser, setGoogleUser] = useState(null); // { email, name }
  const [googleIdToken, setGoogleIdToken] = useState('');
  
  // Establecemos el Client ID por defecto para que la interfaz se inicialice instantáneamente
  const [googleClientId, setGoogleClientId] = useState('515242398595-si9t3uqmihah1415brn5nl2pk65mm05e.apps.googleusercontent.com');
  
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [courseId, setCourseId] = useState(courseIdFromParam);
  const [courses, setCourses] = useState([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const googleButtonRef = useRef(null);

  useEffect(() => {
    // Si cambia el parámetro de URL, actualiza el estado local
    if (courseIdFromParam) {
      setCourseId(courseIdFromParam);
    }
  }, [courseIdFromParam]);

  // Cargar cursos dinámicamente
  useEffect(() => {
    axios.get('/api/auth/courses')
      .then(res => {
        if (Array.isArray(res.data)) {
          setCourses(res.data);
          if (res.data.length > 0 && !courseId) {
            // Si no hay parámetro de curso, seleccionar el primero de la lista
            setCourseId(res.data[0].id.toString());
          }
        } else {
          setCourses([]);
        }
      })
      .catch(err => {
        console.error('Error al cargar cursos para el registro:', err);
      });
  }, []);

  // Intentamos obtener el Client ID del backend para mantener la sincronización en producción
  useEffect(() => {
    axios.get('/api/auth/google-client-id')
      .then(res => {
        if (res.data.googleClientId) {
          setGoogleClientId(res.data.googleClientId);
        }
      })
      .catch(err => {
        console.warn('No se pudo obtener el Client ID del backend, usando el de respaldo local.', err);
      });
  }, []);

  // Efecto principal para cargar el SDK de Google y renderizar el botón
  useEffect(() => {
    if (!googleAuthenticated && googleClientId && googleButtonRef.current) {
      const renderGoogleButton = () => {
        if (window.google && googleButtonRef.current) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
          });
          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            { theme: 'filled_blue', size: 'large', width: 280 }
          );
        }
      };

      // Si el script de Google no existe, lo creamos
      if (!window.google) {
        let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          document.body.appendChild(script);
        }
        script.addEventListener('load', renderGoogleButton);
        return () => {
          script.removeEventListener('load', renderGoogleButton);
        };
      } else {
        renderGoogleButton();
      }
    }
  }, [googleAuthenticated, googleClientId, googleButtonRef.current]);

  const handleCredentialResponse = (response) => {
    const token = response.credential;
    const payload = parseJwt(token);
    if (payload && payload.email_verified) {
      setGoogleUser({
        name: payload.name,
        email: payload.email
      });
      setGoogleIdToken(token);
      setGoogleAuthenticated(true);
    } else {
      setError('Error al autenticar con Google. Correo no verificado o inválido.');
    }
  };

  // Opción de simulación rápida en local/desarrollo
  const handleGoogleAuthSimulate = () => {
    setGoogleUser({
      name: 'Juan Pérez (Simulado)',
      email: 'juanperez@gmail.com'
    });
    setGoogleIdToken('mock-google-token');
    setGoogleAuthenticated(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!googleAuthenticated) {
      setError('Por favor, autentícate primero con Google.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register-request', {
        idToken: googleIdToken,
        phone,
        address,
        courseId: parseInt(courseId, 10)
      });

      setSuccess(response.data.message);
      
      // Limpiar formulario tras el éxito
      setPhone('');
      setAddress('');
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la solicitud de registro.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = courses.find(c => c.id.toString() === courseId.toString());

  return (
    <div className="animated" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px' }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 800 }}>
          Solicitud de Inscripción
        </h2>
        {courseNameFromParam && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Curso Inicial: <strong style={{ color: 'white' }}>{courseNameFromParam}</strong>
          </p>
        )}

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

        {/* Paso 1: Autenticación con Google */}
        {!googleAuthenticated ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Para iniciar tu solicitud de inscripción, por favor identifícate usando Google:
            </p>
            {/* Contenedor del botón oficial de Google */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div ref={googleButtonRef} style={{ minHeight: '40px' }}></div>
              
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '1rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                <span style={{ padding: '0 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>O BIEN</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              </div>

              <button 
                type="button" 
                className="btn btn-secondary-outline" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-muted)' }}
                onClick={handleGoogleAuthSimulate}
              >
                Simular Autenticación (Desarrollo)
              </button>
            </div>
          </div>
        ) : (
          /* Paso 2: Formulario de Datos Adicionales */
          <form onSubmit={handleSubmit}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Autenticado como:</p>
              <h4 style={{ margin: '0.25rem 0 0 0', fontWeight: 600 }}>{googleUser.name}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)' }}>{googleUser.email}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Número de Teléfono</label>
              <input 
                type="tel" 
                className="form-control" 
                placeholder="Ej. +502 5555 1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Dirección Residencial</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Ciudad, departamento y dirección exacta"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Especialidad Técnica / Carrera</label>
              <select 
                className="form-control form-select"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
              >
                <option value="">-- Selecciona una Carrera --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id.toString()}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse && (
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', borderRadius: '10px', padding: '1rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Información de Costos:</h4>
                <div style={{ marginBottom: '0.25rem' }}>
                   <strong>Inscripción única:</strong> Q {parseFloat(selectedCourse.costo_inscripcion || 0).toFixed(2)}
                </div>
                <div>
                   <strong>Mensualidad regular:</strong> Q {parseFloat(selectedCourse.costo_mensualidad || 0).toFixed(2)}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? 'Enviando solicitud...' : 'Enviar Solicitud de Inscripción'}
            </button>
          </form>
        )}
        
      </div>
    </div>
  );
}
