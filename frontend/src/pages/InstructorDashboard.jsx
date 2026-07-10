import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function InstructorDashboard() {
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

  const [activeTab, setActiveTab] = useState('course'); // 'course', 'materials', 'tasks', 'messages'
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Estados de Formularios
  // 1. Material Didáctico
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialFile, setMaterialFile] = useState(null);

  // 2. Tarea
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // 3. Calificación
  const [gradesMap, setGradesMap] = useState({}); // { gradeId: score }

  // 4. Mensajería
  const [selectedStudentId, setSelectedStudentId] = useState('');
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
    if (parsedUser.role !== 'instructor') {
      navigate('/dashboard');
      return;
    }
    setCurrentUser(parsedUser);
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Intentamos cargar la info del curso del profesor
      const courseRes = await axios.get('/api/instructor/course', axiosConfig);
      setCourse(courseRes.data.course);
      setStudents(courseRes.data.students);

      // Cargar demás info
      const [matRes, taskRes, subRes, msgRes] = await Promise.all([
        axios.get('/api/instructor/materials', axiosConfig),
        axios.get('/api/instructor/tasks', axiosConfig),
        axios.get('/api/instructor/submissions', axiosConfig),
        axios.get('/api/instructor/comments', axiosConfig)
      ]);
      
      setMaterials(matRes.data);
      setTasks(taskRes.data);
      setSubmissions(subRes.data);
      setComments(msgRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los datos del Instructor.');
    } finally {
      setLoading(false);
    }
  };

  // --- Subir Material ---
  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!materialFile) {
      setError('Por favor, selecciona un archivo.');
      return;
    }

    setError('');
    setSuccess('');
    
    const formData = new FormData();
    formData.append('title', materialTitle);
    formData.append('file', materialFile);

    try {
      await axios.post('/api/instructor/materials', formData, {
        headers: axiosConfig.headers
      });
      setSuccess('Material didáctico subido con éxito.');
      setMaterialTitle('');
      setMaterialFile(null);
      // Reset input file
      e.target.reset();
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir material.');
    }
  };

  // --- Eliminar Material ---
  const handleMaterialDelete = async (materialId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este material didáctico?')) return;
    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/instructor/materials/${materialId}`, axiosConfig);
      setSuccess('Material eliminado con éxito.');
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el material.');
    }
  };

  // --- Crear Tarea ---
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/instructor/tasks', {
        title: taskTitle,
        description: taskDesc,
        due_date: taskDueDate
      }, axiosConfig);
      setSuccess('Tarea creada con éxito.');
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la tarea.');
    }
  };

  // --- Calificar Tarea ---
  const handleGradeSubmit = async (gradeId) => {
    const score = gradesMap[gradeId];
    if (!score || score < 1 || score > 10) {
      alert('Por favor, ingresa una calificación válida entre 1 y 10.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.post(`/api/instructor/submissions/${gradeId}/grade`, { score: parseInt(score, 10) }, axiosConfig);
      setSuccess('Tarea calificada con éxito.');
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al calificar tarea.');
    }
  };

  // --- Enviar Mensaje ---
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !messageText) {
      setError('Selecciona un estudiante y escribe un mensaje.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/instructor/comments', {
        studentId: parseInt(selectedStudentId, 10),
        text: messageText
      }, axiosConfig);
      setSuccess('Mensaje enviado.');
      setMessageText('');
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar mensaje.');
    }
  };

  // --- Borrar Historial ---
  const handleClearHistory = async () => {
    if (!selectedStudentId) {
      alert('Por favor selecciona un estudiante.');
      return;
    }
    if (!window.confirm('¿Estás seguro de que deseas eliminar todo el historial de conversación con este estudiante?')) return;
    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/instructor/comments/${selectedStudentId}`, axiosConfig);
      setSuccess('Historial de conversación eliminado.');
      loadDashboardData();
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
          <h1 style={{ margin: 0, fontWeight: 800 }}>Panel del Instructor</h1>
          {course && <p style={{ color: 'var(--primary)', fontWeight: 600, margin: '0.25rem 0 0 0' }}>Curso Asignado: {course.name}</p>}
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
          Alumnos Inscritos ({students.length})
        </button>
        <button 
          className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('materials')}
        >
          Material Didáctico ({materials.length})
        </button>
        <button 
          className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tareas y Calificaciones ({tasks.length})
        </button>
        <button 
          className={`btn ${activeTab === 'messages' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('messages')}
        >
          Mensajes ({comments.length})
        </button>
        <button 
          className={`btn ${activeTab === 'grades_summary' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('grades_summary')}
        >
          Resumen de Notas
        </button>
      </div>

      {loading && !course && <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando información...</div>}

      {!loading && course && (
        <div>
          {/* Tab 1: Alumnos */}
          {activeTab === 'course' && (
            <div className="glass-card">
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem' }}>Listado de Estudiantes</h2>
              {students.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay estudiantes matriculados en tu curso por el momento.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Nombre</th>
                        <th style={{ padding: '0.75rem' }}>Email</th>
                        <th style={{ padding: '0.75rem' }}>Teléfono</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>{student.name}</td>
                          <td style={{ padding: '1rem 0.75rem' }}>{student.email}</td>
                          <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{student.phone || 'No registrado'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Material Didáctico */}
          {activeTab === 'materials' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {/* Formulario de Subida */}
              <div className="glass-card" style={{ height: 'fit-content' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Subir Material de Apoyo</h3>
                <form onSubmit={handleMaterialSubmit}>
                  <div className="form-group">
                    <label className="form-label">Título del Documento</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej. PDF Manual de Circuitos"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">Archivo (PDF, Imágenes, Word, Texto - Max 5MB)</label>
                    <input 
                      type="file" 
                      className="form-control"
                      onChange={(e) => setMaterialFile(e.target.files[0])}
                      required 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Subir a la Plataforma
                  </button>
                </form>
              </div>

              {/* Lista de Materiales */}
              <div className="glass-card">
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Materiales Disponibles</h3>
                {materials.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No has subido ningún material didáctico todavía.</p>
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
                            Subido el: {formatDateTime(mat.uploadedAt)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <a 
                            href={getFullUrl(mat.fileUrl)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                          >
                            Descargar
                          </a>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                            onClick={() => handleMaterialDelete(mat._id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Tareas y Calificaciones */}
          {activeTab === 'tasks' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
              {/* Crear Tarea y Tareas Publicadas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass-card" style={{ height: 'fit-content' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Asignar Tarea Nueva</h3>
                  <form onSubmit={handleTaskSubmit}>
                    <div className="form-group">
                      <label className="form-label">Título de la Tarea</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ej. Tarea 1: Práctica de Cableado"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Instrucciones</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        placeholder="Describe los requerimientos y entregables..."
                        value={taskDesc}
                        onChange={(e) => setTaskDesc(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                      <label className="form-label">Fecha de Entrega</label>
                      <input 
                        type="datetime-local" 
                        className="form-control"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        required 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      Publicar Tarea
                    </button>
                  </form>
                </div>

                <div className="glass-card" style={{ height: 'fit-content' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Tareas Publicadas</h3>
                  {tasks.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No has publicado ninguna tarea todavía.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                      {tasks.map((t) => (
                        <div key={t.id} style={{ background: 'var(--inner-bg)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '10px' }}>
                          <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>{t.title}</h4>
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.description || 'Sin descripción'}</p>
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                            Límite: {formatDateTime(t.due_date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Entregas y Calificaciones Agrupadas por Alumno */}
              <div className="glass-card">
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Entregas de los Alumnos</h3>
                {submissions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay entregas registradas por calificar.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.entries(
                      submissions.reduce((groups, sub) => {
                        const studentName = sub.student_name;
                        if (!groups[studentName]) groups[studentName] = [];
                        groups[studentName].push(sub);
                        return groups;
                      }, {})
                    ).map(([studentName, studentSubs]) => (
                      <div 
                        key={studentName} 
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.02)', 
                          border: '1px solid var(--glass-border)', 
                          borderRadius: '12px', 
                          padding: '1.25rem' 
                        }}
                      >
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', fontWeight: 700 }}>
                          👤 {studentName} ({studentSubs[0].student_email})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {studentSubs.map((sub) => (
                            <div 
                              key={sub.grade_id} 
                              style={{ 
                                background: 'var(--inner-bg)', 
                                border: '1px solid var(--glass-border)', 
                                borderRadius: '10px', 
                                padding: '1rem' 
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{sub.task_title}</span>
                              </div>
                              
                              {sub.submission_text && (
                                <p style={{ background: 'var(--inner-bg)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                                  {sub.submission_text}
                                </p>
                              )}
                              
                              {sub.submission_file_url && (
                                <a 
                                  href={getFullUrl(sub.submission_file_url)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-secondary"
                                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'inline-flex', marginTop: '0.5rem', marginBottom: '0.5rem' }}
                                >
                                  📎 Descargar Tarea Adjunta
                                </a>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  Entregado: {formatDateTime(sub.submitted_at)}
                                </div>
                                
                                {sub.score !== null ? (
                                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                                    Nota: {sub.score}/10
                                  </span>
                                ) : (
                                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      min="1" 
                                      max="10" 
                                      placeholder="Nota"
                                      style={{ width: '60px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                      value={gradesMap[sub.grade_id] || ''}
                                      onChange={(e) => setGradesMap({ ...gradesMap, [sub.grade_id]: e.target.value })}
                                    />
                                    <button 
                                      className="btn btn-primary" 
                                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                      onClick={() => handleGradeSubmit(sub.grade_id)}
                                    >
                                      Guardar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Mensajes */}
          {activeTab === 'messages' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {/* Enviar Mensaje */}
              <div className="glass-card" style={{ height: 'fit-content' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Enviar Comentario a Alumno</h3>
                <form onSubmit={handleMessageSubmit}>
                  <div className="form-group">
                    <label className="form-label">Seleccionar Estudiante</label>
                    <select 
                      className="form-control form-select"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                    >
                      <option value="">-- Elige un alumno --</option>
                      {students.map((std) => (
                        <option key={std.id} value={std.id}>{std.name} ({std.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">Mensaje</label>
                    <textarea 
                      className="form-control" 
                      rows="4" 
                      placeholder="Escribe tu mensaje privado..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Enviar Mensaje
                  </button>
                </form>
              </div>

              {/* Conversaciones */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0 }}>Historial de Conversación</h3>
                  {selectedStudentId && comments.some(c => c.studentId === parseInt(selectedStudentId, 10)) && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                      onClick={handleClearHistory}
                    >
                      Borrar Historial
                    </button>
                  )}
                </div>
                {!selectedStudentId ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Selecciona un estudiante de la lista para ver el historial de conversación.</p>
                ) : comments.filter(c => c.studentId === parseInt(selectedStudentId, 10)).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay mensajes intercambiados con este estudiante todavía.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {comments
                      .filter(comment => comment.studentId === parseInt(selectedStudentId, 10))
                      .map((comment) => {
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

          {/* Tab 5: Resumen de Notas */}
          {activeTab === 'grades_summary' && (
            <div className="glass-card">
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 600 }}>Resumen de Notas por Alumno</h2>
              {students.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay estudiantes matriculados en tu curso por el momento.</p>
              ) : tasks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No has creado ninguna tarea para este curso todavía.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem', minWidth: '180px' }}>Estudiante</th>
                        {tasks.map(task => (
                          <th key={task.id} style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.title}>
                              {task.title}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Max: 10</span>
                          </th>
                        ))}
                        <th style={{ padding: '0.75rem', textAlign: 'center', minWidth: '100px', color: 'var(--primary)', fontWeight: 'bold' }}>Nota Final / Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        let totalScore = 0;
                        return (
                          <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '1rem 0.75rem' }}>
                              <div style={{ fontWeight: 600 }}>{student.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.email}</div>
                            </td>
                            {tasks.map(task => {
                              const submission = submissions.find(sub => sub.student_email === student.email && sub.task_id === task.id);
                              let grade = 0;
                              let label = '0';
                              let badgeStyle = { color: 'var(--accent)' };

                              if (submission) {
                                if (submission.score !== null) {
                                  grade = submission.score;
                                  label = `${grade}/10`;
                                  badgeStyle = grade >= 6 ? { color: '#10b981', fontWeight: 600 } : { color: 'var(--accent)', fontWeight: 600 };
                                } else {
                                  // Enviada pero no calificada
                                  label = 'Pendiente (0)';
                                  badgeStyle = { color: '#3b82f6', fontStyle: 'italic' };
                                }
                              } else {
                                label = 'Sin Entrega (0)';
                                badgeStyle = { color: 'var(--text-muted)' };
                              }

                              totalScore += grade;

                              return (
                                <td key={task.id} style={{ padding: '1rem 0.75rem', textAlign: 'center', ...badgeStyle }}>
                                  {label}
                                </td>
                              );
                            })}
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                              <span style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--primary)',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(59, 130, 246, 0.2)'
                              }}>
                                {(totalScore / tasks.length).toFixed(1)} / 10
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
