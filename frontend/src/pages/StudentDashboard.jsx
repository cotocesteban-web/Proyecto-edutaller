import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StudentDashboard() {
  const getFullUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname.startsWith('192.168.');
    const backendUrl = isLocal ? `${window.location.protocol}//${window.location.hostname}:3000` : '';
    return `${backendUrl}${url}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('es-GT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const [activeTab, setActiveTab] = useState('course'); // 'course', 'tasks', 'payments', 'messages'
  const [course, setCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Estados de Formularios
  // 1. Entregar Tarea
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [subText, setSubText] = useState('');
  const [subFile, setSubFile] = useState(null);

  // 2. Reportar Pago
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('monthly'); // 'inscription', 'monthly'
  const [payFile, setPayFile] = useState(null);

  // 3. Mensajería
  const [messageText, setMessageText] = useState('');

  // Estados de Control
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'student') {
      navigate('/dashboard');
      return;
    }
    setCurrentUser(parsedUser);
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async (targetCourseId = null) => {
    setLoading(true);
    setError('');
    try {
      const coursesRes = await axios.get('/api/student/courses', axiosConfig);
      setCourses(coursesRes.data);

      if (coursesRes.data.length === 0) {
        setCourse(null);
        setMaterials([]);
        setTasks([]);
        setComments([]);
        setLoading(false);
        return;
      }

      const activeId = targetCourseId || selectedCourseId || coursesRes.data[0].id;
      setSelectedCourseId(activeId);

      const current = coursesRes.data.find(c => c.id === activeId) || coursesRes.data[0];
      setCourse(current);

      const [matRes, taskRes, msgRes] = await Promise.all([
        axios.get(`/api/student/materials?courseId=${current.id}`, axiosConfig),
        axios.get(`/api/student/tasks?courseId=${current.id}`, axiosConfig),
        axios.get(`/api/student/comments?courseId=${current.id}`, axiosConfig)
      ]);

      setMaterials(matRes.data);
      setTasks(taskRes.data);
      setComments(msgRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los datos del estudiante.');
    } finally {
      setLoading(false);
    }
  };

  // --- Enviar Tarea ---
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!subText && !subFile) {
      setError('Debes escribir una respuesta o adjuntar un archivo.');
      return;
    }

    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('submission_text', subText);
    if (subFile) formData.append('file', subFile);

    try {
      await axios.post(`/api/student/tasks/${selectedTaskId}/submit`, formData, {
        headers: axiosConfig.headers
      });
      setSuccess('¡Tarea entregada con éxito!');
      setSubText('');
      setSubFile(null);
      setSelectedTaskId(null);
      if (course) loadDashboardData(course.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al entregar la tarea.');
    }
  };

  // --- Registrar Pago ---
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payAmount || !payFile) {
      setError('Por favor, indica el monto y sube la foto de la boleta de pago.');
      return;
    }

    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('amount', payAmount);
    formData.append('type', payType);
    formData.append('file', payFile);

    try {
      await axios.post('/api/student/payments', formData, {
        headers: axiosConfig.headers
      });
      setSuccess('Boleta de pago enviada con éxito. Pendiente de revisión.');
      setPayAmount('');
      setPayFile(null);
      e.target.reset();
      if (course) loadDashboardData(course.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reportar pago.');
    }
  };

  // --- Enviar Comentario ---
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!messageText || !course) return;

    setError('');
    setSuccess('');

    try {
      await axios.post('/api/student/comments', { text: messageText, courseId: course.id }, axiosConfig);
      setMessageText('');
      loadDashboardData(course.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el mensaje.');
    }
  };

  // --- Borrar Historial ---
  const handleClearHistory = async () => {
    if (!course) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar todo el historial de conversación con el profesor de este curso?')) return;
    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/student/comments?courseId=${course.id}`, axiosConfig);
      setSuccess('Historial de conversación eliminado.');
      loadDashboardData(course.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar historial.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="animated" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 800 }}>Mi Panel de Estudiante</h1>
          {courses.length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ver Especialidad:</span>
              <select 
                className="form-control form-select" 
                style={{ width: 'auto', padding: '0.35rem 1.5rem 0.35rem 0.75rem', fontSize: '0.9rem', minWidth: '200px' }}
                value={selectedCourseId || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSelectedCourseId(val);
                  loadDashboardData(val);
                }}
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ) : course ? (
            <p style={{ color: 'var(--primary)', fontWeight: 600, margin: '0.25rem 0 0 0' }}>Especialidad: {course.name}</p>
          ) : null}
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>Cerrar Sesión</button>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${activeTab === 'course' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('course')}
        >
          Mi Curso y Materiales
        </button>
        <button 
          className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('tasks'); setSelectedTaskId(null); }}
        >
          Tareas y Calificaciones ({tasks.length})
        </button>
        <button 
          className={`btn ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('payments')}
        >
          Reportar Pago
        </button>
        <button 
          className={`btn ${activeTab === 'messages' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('messages')}
        >
          Contacto con Profesor ({comments.length})
        </button>
      </div>

      {loading && !course && <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando información académica...</div>}

      {!loading && course && (
        <div>
          {/* Tab 1: Curso y Materiales */}
          {activeTab === 'course' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              <div className="glass-card" style={{ height: 'fit-content' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Detalles de Especialidad</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2rem' }}>
                  {course.description || 'No hay descripción disponible para esta especialidad técnica.'}
                </p>
                <div style={{ background: 'var(--inner-bg)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Instructor Asignado:</span>
                  <h4 style={{ margin: '0.25rem 0 0.1rem 0' }}>{course.instructor_name || 'Profesor Pendiente'}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{course.instructor_email || ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--inner-bg)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Mi Estado de Pagos:</span>
                  {course.solvente === 1 ? (
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      Solvente
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent)', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                      No Solvente
                    </span>
                  )}
                </div>
              </div>

              <div className="glass-card">
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Material Didáctico subido por el Instructor</h2>
                {materials.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay material de apoyo cargado todavía.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {materials.map((mat) => (
                      <div 
                        key={mat._id} 
                        style={{ 
                          background: 'var(--inner-bg)', 
                          border: '1px solid var(--glass-border)', 
                          borderRadius: '10px', 
                          padding: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>{mat.title}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Cargado el: {formatDateTime(mat.uploadedAt)}
                          </span>
                        </div>
                        <a 
                          href={getFullUrl(mat.fileUrl)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                        >
                          Descargar
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
 
          {/* Tab 2: Tareas */}
          {activeTab === 'tasks' && (
            <div className="glass-card">
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Tareas de la Especialidad</h2>
              
              {/* Resumen de Tareas */}
              {(() => {
                const totalTasks = tasks.length;
                const submittedTasksCount = tasks.filter(t => t.submitted_at !== null).length;
                const gradedTasks = tasks.filter(t => t.score !== null);
                const gradedTasksCount = gradedTasks.length;
                const pendingTasksCount = tasks.filter(t => t.submitted_at === null && new Date(t.due_date) >= new Date()).length;
                const overdueTasksCount = tasks.filter(t => t.submitted_at === null && new Date(t.due_date) < new Date()).length;
                const averageGrade = gradedTasksCount > 0
                  ? (gradedTasks.reduce((sum, t) => sum + t.score, 0) / gradedTasksCount).toFixed(1)
                  : 'N/A';

                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL TAREAS</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalTasks}</div>
                      </div>
                      <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>ENTREGADAS</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{submittedTasksCount}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({gradedTasksCount} calificadas)</span>
                      </div>
                      <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>PENDIENTES</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{pendingTasksCount}</div>
                      </div>
                      <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>NO ENTREGADAS</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{overdueTasksCount}</div>
                      </div>
                    </div>

                    <div className="glass-card" style={{ marginBottom: '2rem', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                      <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 700 }}>Resumen de Calificaciones</h3>
                      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center', borderRight: '1px solid var(--glass-border)', paddingRight: '2rem' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PROMEDIO GENERAL</span>
                          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--headings-color)' }}>
                            {averageGrade}
                            <span style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-muted)' }}>/10</span>
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600 }}>Notas por Tarea Calificada:</h4>
                          {gradedTasksCount === 0 ? (
                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Aún no tienes tareas calificadas.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                              {gradedTasks.map(t => (
                                <div key={t.task_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.25rem' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{t.title}</span>
                                  <strong style={{ color: '#10b981' }}>{t.score}/10</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {selectedTaskId && (
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                  <h3 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 600 }}>Enviar Entrega</h3>
                  <form onSubmit={handleTaskSubmit}>
                    <div className="form-group">
                      <label className="form-label">Respuesta escrita o Enlace de Entrega</label>
                      <textarea 
                        className="form-control" 
                        rows="3" 
                        placeholder="Escribe tu respuesta o pega el enlace de tu entrega..."
                        value={subText}
                        onChange={(e) => setSubText(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Archivo Adjunto (Opcional - Max 5MB)</label>
                      <input 
                        type="file" 
                        className="form-control" 
                        onChange={(e) => setSubFile(e.target.files[0])}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary">Enviar Entrega</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setSelectedTaskId(null)}>Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              {tasks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay tareas asignadas en tu curso por el momento.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {tasks.map((task) => {
                    const isSubmitted = task.submitted_at !== null;
                    const isGraded = task.score !== null;

                    return (
                      <div 
                        key={task.task_id} 
                        style={{ 
                          background: 'var(--inner-bg)', 
                          border: '1px solid var(--glass-border)', 
                          borderRadius: '12px', 
                          padding: '1.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{task.title}</h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                              Fecha límite: {formatDateTime(task.due_date)}
                            </span>
                          </div>
                          <div>
                            {isGraded ? (
                              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                Calificado: {task.score}/10
                              </span>
                            ) : isSubmitted ? (
                              <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                Enviada (Pendiente de Calificación)
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                                Pendiente de entrega
                              </span>
                            )}
                          </div>
                        </div>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0.75rem 0' }}>
                          {task.description || 'Sin instrucciones adicionales.'}
                        </p>

                        {/* Mostrar información de la entrega realizada */}
                        {isSubmitted && (
                          <div style={{ background: 'var(--inner-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', margin: '1rem 0 0.5rem 0' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tu Entrega:</h4>
                            {task.submission_text && <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{task.submission_text}</p>}
                            {task.submission_file_url && (
                              <a href={getFullUrl(task.submission_file_url)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                                📎 Ver archivo entregado
                              </a>
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                              Fecha de envío: {formatDateTime(task.submitted_at)}
                            </div>
                          </div>
                        )}

                        {/* Botón para enviar entrega (si no ha sido calificado) */}
                        {!isGraded && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ marginTop: '1rem' }}
                            onClick={() => { setSelectedTaskId(task.task_id); setSubText(task.submission_text || ''); }}
                          >
                            {isSubmitted ? 'Modificar/Reenviar Entrega' : 'Realizar Entrega'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Pagos */}
          {activeTab === 'payments' && (
            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', textAlign: 'center' }}>
                Reportar Pago de Especialidad
              </h2>
              <form onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                  <label className="form-label">Monto Pagado (en Quetzales)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    placeholder="Ej. 150.00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Pago</label>
                  <select 
                    className="form-control form-select"
                    value={payType}
                    onChange={(e) => setPayType(e.target.value)}
                  >
                    <option value="inscription">Inscripción Inicial</option>
                    <option value="monthly">Mensualidad Ordinaria</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label">Foto / Captura de Boleta de Pago (Max 5MB)</label>
                  <input 
                    type="file" 
                    className="form-control" 
                    onChange={(e) => setPayFile(e.target.files[0])}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                  Enviar Boleta de Pago
                </button>
              </form>
            </div>
          )}

          {/* Tab 4: Mensajes */}
          {activeTab === 'messages' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {/* Enviar Mensaje al Profesor */}
              <div className="glass-card" style={{ height: 'fit-content' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Enviar Mensaje Privado a {course.instructor_name || 'Profesor'}</h3>
                {course.instructor_id ? (
                  <form onSubmit={handleCommentSubmit}>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                      <label className="form-label">Tu Mensaje</label>
                      <textarea 
                        className="form-control" 
                        rows="4" 
                        placeholder="Escribe tu consulta académica directamente a tu profesor..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      Enviar Mensaje Directo
                    </button>
                  </form>
                ) : (
                  <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)', textAlign: 'center', fontSize: '0.9rem' }}>
                    Esta especialidad aún no tiene un instructor asignado para responder mensajes.
                  </div>
                )}
              </div>

              {/* Conversaciones */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0 }}>Historial de Conversación</h3>
                  {comments.length > 0 && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                      onClick={handleClearHistory}
                    >
                      Borrar Historial
                    </button>
                  )}
                </div>
                {comments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No has enviado ningún mensaje todavía.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {comments.map((comment) => {
                      const isMe = comment.senderId === currentUser?.id;
                      return (
                        <div 
                          key={comment._id} 
                          style={{ 
                            background: isMe ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)', 
                            border: '1px solid',
                            borderColor: isMe ? 'rgba(99, 102, 241, 0.2)' : 'var(--glass-border)',
                            borderRadius: '10px', 
                            padding: '0.75rem 1rem',
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            width: '85%'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                            <strong style={{ color: isMe ? 'var(--primary)' : 'white' }}>{comment.senderName}</strong>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {formatDateTime(comment.timestamp)}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{comment.text}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
