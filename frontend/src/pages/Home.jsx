import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Paleta de gradientes predefinida para cursos que no tengan una imagen propia
const fallbackGradients = [
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
];

export default function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Configuraciones de Presentación
  const [instSettings, setInstSettings] = useState({
    institution_name: 'Academia Técnica Edutaller',
    presentation_text: 'Aprende habilidades técnicas con profesores expertos en talleres totalmente equipados. Tu camino hacia el éxito profesional comienza aquí.',
    contact_email: 'contacto@edutaller.edu.gt',
    contact_phone: '+502 5555 1234',
    contact_address: 'Calzada Roosevelt 12-34, Zona 11, Ciudad de Guatemala',
    hero_background_url: '',
    hero_backgrounds_list: '',
    mision_text: '',
    vision_text: '',
    mision_bg_url: '',
    vision_bg_url: ''
  });

  const [activeBgIndex, setActiveBgIndex] = useState(0);

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

  // Usamos siempre las imágenes predefinidas premium del carrusel estático
  const bgImages = defaultBgImages;

  useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 3000); // Cambiar cada 3 segundos (más seguido)
    return () => clearInterval(interval);
  }, [bgImages.length]);

  // Estados para Formulario de Contacto
  const [currentUser, setCurrentUser] = useState(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error al parsear usuario local:', e);
      }
    }
  }, []);

  // Helper para generar URL absoluta del backend y evitar SPA fallback en descargas
  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url;
  };

  useEffect(() => {
    // Cargar cursos y configuraciones de presentación
    Promise.all([
      axios.get('/api/auth/courses'),
      axios.get('/api/auth/settings')
    ])
      .then(([coursesRes, settingsRes]) => {
        if (Array.isArray(coursesRes.data)) {
          setCourses(coursesRes.data);
        } else {
          setCourses([]);
        }
        if (settingsRes.data && typeof settingsRes.data === 'object' && !Array.isArray(settingsRes.data)) {
          setInstSettings(prev => ({ ...prev, ...settingsRes.data }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar datos de inicio:', err);
        setError('No se pudo cargar la información de inicio. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      });
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSuccess('');
    setContactError('');

    if (currentUser?.role === 'admin' || currentUser?.role === 'instructor') {
      setContactError('Los administradores o profesores no pueden enviar mensajes desde este formulario.');
      return;
    }

    try {
      await axios.post('/api/auth/contact', {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        message: contactMessage
      });
      setContactSuccess('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    } catch (err) {
      setContactError(err.response?.data?.error || 'Error al enviar el mensaje. Intenta de nuevo.');
    }
  };

  return (
    <div className="animated" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Hero Section con Imagen de Fondo Personalizable (Carrusel) */}
      <section style={{ 
        position: 'relative',
        textAlign: 'center', 
        margin: '2rem 0 5rem 0',
        padding: '5rem 2rem',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '350px'
      }}>
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

        {/* Contenido del Hero */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-0.025em', color: 'white', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            {instSettings.institution_name}
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#cbd5e1', maxWidth: '700px', margin: '0 auto 2.5rem auto', lineHeight: '1.6', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {instSettings.presentation_text}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Ingresar a mi Cuenta</button>
            <a href="#catalogo" className="btn btn-secondary">Ver Cursos</a>
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      {/* Misión y Visión */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '6rem' }}>
        <div className="glass-card static-card">
          <h2 style={{ color: 'var(--primary)', marginTop: 0 }}>Nuestra Misión</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            {instSettings.mision_text || "Brindar formación académica de la más alta calidad en áreas industriales y técnicas, potenciando las capacidades prácticas y teóricas de nuestros estudiantes para que respondan eficientemente a las demandas del sector productivo."}
          </p>
        </div>
        <div className="glass-card static-card">
          <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>Nuestra Visión</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            {instSettings.vision_text || "Ser la academia de capacitación técnica de referencia nacional, reconocida por la excelencia de nuestros instructores, la modernidad de nuestros métodos y el éxito profesional de nuestros egresados."}
          </p>
        </div>
      </section>

      {/* Catálogo de Cursos */}
      <section id="catalogo" style={{ marginBottom: '5rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2.5rem', textAlign: 'center', color: 'var(--headings-color)', letterSpacing: '-0.03em' }}>
          Catálogo de Especialidades
        </h2>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando catálogo disponible...</div>
        ) : courses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay cursos publicados por el momento.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {courses.map((course, idx) => {
              const isSoldOut = course.cupo_disponible <= 0;
              const hasImage = !!course.image_url;
              const fallbackGradient = fallbackGradients[idx % fallbackGradients.length];

              return (
                <div key={course.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', opacity: isSoldOut ? 0.75 : 1 }}>
                  {/* Imagen del curso */}
                  <div style={{ height: '160px', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {hasImage ? (
                      <img src={getFullUrl(course.image_url)} alt={course.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ background: fallbackGradient, width: '100%', height: '100%' }} />
                    )}
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(15, 23, 42, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1rem'
                    }}>
                      <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, textShadow: '0 4px 8px rgba(0,0,0,0.5)', margin: 0, textAlign: 'center' }}>
                        {course.name}
                      </h3>
                    </div>
                    {isSoldOut && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(244, 63, 94, 0.85)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                        Agotado
                      </div>
                    )}
                  </div>

                  {/* Detalles del curso */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.25rem', flex: 1 }}>
                      {course.description || 'Sin descripción disponible.'}
                    </p>
                    
                    {/* Horarios e Información Extra */}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginBottom: '1.25rem' }}>
                      {course.days && (
                        <div style={{ marginBottom: '0.25rem' }}>
                           <strong>Días:</strong> {course.days}
                        </div>
                      )}
                      {course.schedules && (
                        <div style={{ marginBottom: '0.25rem' }}>
                           <strong>Horario:</strong> {course.schedules}
                        </div>
                      )}
                      <div style={{ marginBottom: '0.25rem' }}>
                         <strong>Inscripción:</strong> Q {parseFloat(course.costo_inscripcion || 0).toFixed(2)} | <strong>Mensualidad:</strong> Q {parseFloat(course.costo_mensualidad || 0).toFixed(2)}
                      </div>
                      <div>
                        <strong>Cupo disponible:</strong> {isSoldOut ? <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>0 (Agotado)</span> : `${course.cupo_disponible} vacantes`}
                      </div>
                    </div>

                    <button 
                      className={`btn ${isSoldOut ? 'btn-secondary' : (currentUser?.role === 'admin' || currentUser?.role === 'instructor') ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ width: '100%' }}
                      disabled={isSoldOut || currentUser?.role === 'admin' || currentUser?.role === 'instructor'}
                      onClick={() => navigate(`/registro?courseId=${course.id}&courseName=${encodeURIComponent(course.name)}`)}
                    >
                      {isSoldOut 
                        ? 'Cupo Agotado' 
                        : (currentUser?.role === 'admin' || currentUser?.role === 'instructor') 
                          ? 'No disponible para tu rol' 
                          : 'Asignarme al curso'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sección de Contacto */}
      <section id="contacto" style={{ margin: '5rem 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
        {/* Información de la Institución */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: 0, marginBottom: '1.5rem' }}>Contáctanos</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '2rem' }}>
            ¿Tienes dudas sobre los cursos, horarios o costos? Escríbenos o contáctanos por medio de nuestros canales oficiales.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
              <span style={{ fontSize: '1.2rem' }}></span>
              <span>{instSettings.contact_address}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
              <span style={{ fontSize: '1.2rem' }}></span>
              <span>{instSettings.contact_phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
              <span style={{ fontSize: '1.2rem' }}></span>
              <span>{instSettings.contact_email}</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="glass-card">
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontWeight: 600 }}>Envíanos un Mensaje</h3>
          
          {currentUser?.role === 'admin' ? (
            <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '2rem 1.5rem', borderRadius: '14px', textAlign: 'center', color: '#93c5fd' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}></span>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, lineHeight: '1.6', color: 'white', marginBottom: '0.5rem' }}>
                Rol de Administrador Activo
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Las cuentas administrativas no pueden enviar consultas por este formulario. Utiliza tu panel de control para gestionar la plataforma.
              </p>
            </div>
          ) : currentUser?.role === 'instructor' ? (
            <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '2rem 1.5rem', borderRadius: '14px', textAlign: 'center', color: '#93c5fd' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}></span>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, lineHeight: '1.6', color: 'black', marginBottom: '0.5rem' }}>
                Rol de Profesor Activo
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Las cuentas de docentes tienen el formulario de consultas de contacto deshabilitado. Usa tu aula virtual para comunicarte.
              </p>
            </div>
          ) : (
            <>
              {contactSuccess && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  {contactSuccess}
                </div>
              )}
              {contactError && (
                <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  {contactError}
                </div>
              )}

              <form onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Tu nombre completo"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="tuemail@gmail.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono (Opcional)</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    placeholder="Ej. +502 5555 6666"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mensaje / Consulta</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    placeholder="Escribe tu consulta detallada..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Enviar Mensaje</button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
