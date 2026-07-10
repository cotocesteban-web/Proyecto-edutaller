import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'courses', 'instructors', 'students', 'payments', 'presentation'
  const [requests, setRequests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructorsList, setInstructorsList] = useState([]);
  const [payments, setPayments] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  // Configuración de la Institución
  const [instSettings, setInstSettings] = useState({
    institution_name: '',
    presentation_text: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    hero_background_url: ''
  });
  
  // Estados para Formularios
  // 1. Curso (Crear/Editar)
  const [courseName, setCourseName] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseSchedules, setCourseSchedules] = useState('');
  const [courseDays, setCourseDays] = useState('');
  const [courseCupo, setCourseCupo] = useState('10');
  const [courseCostoInscripcion, setCourseCostoInscripcion] = useState('0.00');
  const [courseCostoMensualidad, setCourseCostoMensualidad] = useState('0.00');
  const [courseImageFile, setCourseImageFile] = useState(null);
  const [courseExistingImage, setCourseExistingImage] = useState('');
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseInstructor, setCourseInstructor] = useState('');

  // 2. Instructor (Crear)
  const [instName, setInstName] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instPass, setInstPass] = useState('');
  const [instPhone, setInstPhone] = useState('');
  const [instCourseId, setInstCourseId] = useState('');

  // 3. Aprobación de alumno (modal / input password)
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [studentPass, setStudentPass] = useState('');

  // 4. Fondos del Portal
  const [newBgFiles, setNewBgFiles] = useState([]);
  const [bgUploadError, setBgUploadError] = useState('');
  const [bgUploadSuccess, setBgUploadSuccess] = useState('');
  const [misionBgFile, setMisionBgFile] = useState(null);
  const [visionBgFile, setVisionBgFile] = useState(null);

  // Estados generales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Configuración de cabeceras Axios
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // Helper para generar URL absoluta del backend y evitar SPA fallback en descargas
  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'admin') {
      navigate('/dashboard'); // Redirige a su respectivo dashboard
      return;
    }

    // Cargar datos
    loadAllData();
  }, [token]);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, courseRes, studentRes, instRes, paymentsRes, settingsRes, messagesRes] = await Promise.all([
        axios.get('/api/admin/requests', axiosConfig),
        axios.get('/api/admin/courses', axiosConfig),
        axios.get('/api/admin/students', axiosConfig),
        axios.get('/api/admin/instructors', axiosConfig),
        axios.get('/api/admin/payments', axiosConfig),
        axios.get('/api/auth/settings'),
        axios.get('/api/admin/contact-messages', axiosConfig)
      ]);
      setRequests(reqRes.data);
      setCourses(courseRes.data);
      setStudents(studentRes.data);
      setInstructorsList(instRes.data);
      setPayments(paymentsRes.data);
      setInstSettings(settingsRes.data);
      setContactMessages(messagesRes.data);
    } catch (err) {
      setError('Error al cargar datos del panel de administración. Inicia sesión de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Cursos ---
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('name', courseName);
    formData.append('description', courseDesc);
    formData.append('schedules', courseSchedules);
    formData.append('days', courseDays);
    formData.append('cupo_maximo', courseCupo);
    formData.append('costo_inscripcion', courseCostoInscripcion);
    formData.append('costo_mensualidad', courseCostoMensualidad);
    if (courseImageFile) {
      formData.append('file', courseImageFile);
    }
    if (editingCourseId) {
      formData.append('instructor_id', courseInstructor || '');
      if (courseExistingImage) {
        formData.append('existing_image', courseExistingImage);
      }
    }

    try {
      if (editingCourseId) {
        // Editar
        await axios.put(`/api/admin/courses/${editingCourseId}`, formData, {
          headers: axiosConfig.headers
        });
        setSuccess('Curso actualizado con éxito.');
      } else {
        // Crear
        await axios.post('/api/admin/courses', formData, {
          headers: axiosConfig.headers
        });
        setSuccess('Curso creado con éxito.');
      }
      
      // Limpiar campos
      setCourseName('');
      setCourseDesc('');
      setCourseSchedules('');
      setCourseDays('');
      setCourseCupo('10');
      setCourseCostoInscripcion('0.00');
      setCourseCostoMensualidad('0.00');
      setCourseImageFile(null);
      setCourseExistingImage('');
      setEditingCourseId(null);
      setCourseInstructor('');
      
      // Resetear input de archivo
      const fileInput = document.getElementById('course-image-input');
      if (fileInput) fileInput.value = '';

      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el curso.');
    }
  };

  const handleEditCourseClick = (course) => {
    setEditingCourseId(course.id);
    setCourseName(course.name);
    setCourseDesc(course.description || '');
    setCourseInstructor(course.instructor_id || '');
    setCourseSchedules(course.schedules || '');
    setCourseDays(course.days || '');
    setCourseCupo(course.cupo_maximo || '10');
    setCourseCostoInscripcion(course.costo_inscripcion || '0.00');
    setCourseCostoMensualidad(course.costo_mensualidad || '0.00');
    setCourseExistingImage(course.image_url || '');
    setCourseImageFile(null);
    setActiveTab('courses'); // asegura estar en la pestaña
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este curso? Se borrarán las solicitudes y matrículas relacionadas.')) return;
    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/admin/courses/${id}`, axiosConfig);
      setSuccess('Curso eliminado.');
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar curso.');
    }
  };

  // --- Aprobación / Rechazo de Estudiantes ---
  const handleApproveStudent = async (e) => {
    e.preventDefault();
    if (!studentPass) {
      setError('Escribe una contraseña para la cuenta del estudiante.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.post(`/api/admin/requests/${selectedReqId}/approve`, {
        password: studentPass
      }, axiosConfig);
      
      setSuccess('Estudiante aprobado y cuenta creada con éxito.');
      setStudentPass('');
      setSelectedReqId(null);
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al aprobar estudiante.');
    }
  };

  const handleRejectRequest = async (id) => {
    if (!window.confirm('¿Estás seguro de rechazar esta solicitud de inscripción?')) return;
    setError('');
    setSuccess('');
    try {
      await axios.post(`/api/admin/requests/${id}/reject`, {}, axiosConfig);
      setSuccess('Solicitud rechazada.');
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al rechazar solicitud.');
    }
  };

  // --- Registro e Habilitación de Instructores ---
  const handleInstructorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/admin/instructors', {
        name: instName,
        email: instEmail,
        password: instPass,
        phone: instPhone,
        courseId: instCourseId ? parseInt(instCourseId, 10) : null
      }, axiosConfig);

      setSuccess('Instructor registrado con éxito.');
      setInstName('');
      setInstEmail('');
      setInstPass('');
      setInstPhone('');
      setInstCourseId('');
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar instructor.');
    }
  };

  const handleDeleteInstructor = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este profesor? Se le quitará de sus cursos asignados.')) return;
    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/admin/instructors/${id}`, axiosConfig);
      setSuccess('Profesor eliminado correctamente.');
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el profesor.');
    }
  };

  // --- Gestión de Alumnos y Solvencia ---
  const handleDeleteStudent = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este estudiante? Se borrará su matrícula, calificaciones y pagos relacionados.')) return;
    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/admin/students/${id}`, axiosConfig);
      setSuccess('Estudiante eliminado correctamente.');
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el estudiante.');
    }
  };

  const handleToggleSolvency = async (enrollmentId, currentStatus) => {
    setError('');
    setSuccess('');
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await axios.put(`/api/admin/enrollments/${enrollmentId}/solvency`, { solvente: newStatus }, axiosConfig);
      setSuccess('Estado de solvencia actualizado.');
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar estado de solvencia.');
    }
  };

  const handleMarkSolventFromPayment = async (studentId) => {
    setError('');
    setSuccess('');
    try {
      await axios.post(`/api/admin/students/${studentId}/mark-solvent-from-payment`, {}, axiosConfig);
      setSuccess('Estudiante marcado como solvente con éxito.');
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al marcar como solvente.');
    }
  };

  // --- Fondos de Pantalla ---
  const handleAddBackground = async (e) => {
    e.preventDefault();
    if (!newBgFiles || newBgFiles.length === 0) return;
    setBgUploadError('');
    setBgUploadSuccess('');
    
    // Validar límite de tamaño individual (5MB) antes de iniciar carga
    const invalidFile = newBgFiles.find(file => file.size > 5 * 1024 * 1024);
    if (invalidFile) {
      setBgUploadError(`El archivo "${invalidFile.name}" excede el límite máximo permitido de 5 MB.`);
      return;
    }

    const uploadPromises = newBgFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return axios.post('/api/admin/settings/background-images', formData, {
        headers: axiosConfig.headers
      });
    });

    try {
      await Promise.all(uploadPromises);
      setBgUploadSuccess(`¡${newBgFiles.length} imagen(es) de fondo agregada(s) con éxito!`);
      setNewBgFiles([]);
      const fileInput = document.getElementById('new-bg-input');
      if (fileInput) fileInput.value = '';
      loadAllData();
    } catch (err) {
      setBgUploadError(err.response?.data?.error || 'Error al agregar imagen(es) de fondo.');
    }
  };

  const handleRemoveBackground = async (url) => {
    if (!window.confirm('¿Estás seguro de eliminar esta imagen de fondo del carrusel?')) return;
    setBgUploadError('');
    setBgUploadSuccess('');
    try {
      await axios.delete('/api/admin/settings/background-images', {
        headers: axiosConfig.headers,
        data: { url }
      });
      setBgUploadSuccess('Imagen de fondo eliminada con éxito.');
      loadAllData();
    } catch (err) {
      setBgUploadError(err.response?.data?.error || 'Error al eliminar imagen de fondo.');
    }
  };

  // --- Configuraciones de la Institución ---
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('institution_name', instSettings.institution_name || '');
    formData.append('presentation_text', instSettings.presentation_text || '');
    formData.append('contact_email', instSettings.contact_email || '');
    formData.append('contact_phone', instSettings.contact_phone || '');
    formData.append('contact_address', instSettings.contact_address || '');
    formData.append('mision_text', instSettings.mision_text || '');
    formData.append('vision_text', instSettings.vision_text || '');

    if (misionBgFile) {
      formData.append('mision_bg', misionBgFile);
    }
    if (visionBgFile) {
      formData.append('vision_bg', visionBgFile);
    }

    try {
      await axios.put('/api/admin/settings', formData, {
        headers: axiosConfig.headers
      });
      setSuccess('Presentación de la institución actualizada con éxito.');
      setMisionBgFile(null);
      setVisionBgFile(null);
      
      const misionInput = document.getElementById('mision-bg-input');
      const visionInput = document.getElementById('vision-bg-input');
      if (misionInput) misionInput.value = '';
      if (visionInput) visionInput.value = '';

      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar configuraciones.');
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
          <h1 style={{ margin: 0, fontWeight: 800 }}>Panel de Administración</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Control centralizado de Edutaller</p>
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

      {/* Menú de Navegación Lateral o Tabs Superiores */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('requests'); setSelectedReqId(null); }}
        >
          Solicitudes ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('courses'); setEditingCourseId(null); setCourseName(''); setCourseDesc(''); setCourseSchedules(''); setCourseDays(''); setCourseCupo('10'); setCourseCostoInscripcion('0.00'); setCourseCostoMensualidad('0.00'); setCourseImageFile(null); setCourseExistingImage(''); }}
        >
          Cursos ({courses.length})
        </button>
        <button 
          className={`btn ${activeTab === 'instructors' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('instructors')}
        >
          Profesores ({instructorsList.length})
        </button>
        <button 
          className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('students')}
        >
          Alumnos Matriculados ({students.length})
        </button>
        <button 
          className={`btn ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('payments')}
        >
          Pagos Recibidos ({payments.length})
        </button>
        <button 
          className={`btn ${activeTab === 'presentation' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('presentation')}
        >
          Editar Presentación
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando datos del panel...</div>}

      {!loading && (
        <div>
          {/* 1. SECCIÓN: SOLICITUDES */}
          {activeTab === 'requests' && (
            <div className="glass-card">
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
                Solicitudes de Inscripción Pendientes
              </h2>
              
              {selectedReqId && (
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                  <h3 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 600 }}>Aprobar Solicitud e Inscribir Estudiante</h3>
                  <form onSubmit={handleApproveStudent} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                      <label className="form-label">Asignar Contraseña Temporal</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        placeholder="Mínimo 3 caracteres"
                        value={studentPass} 
                        onChange={(e) => setStudentPass(e.target.value)} 
                        required 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary">Confirmar Registro</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setSelectedReqId(null)}>Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              {requests.filter(r => r.status === 'pending').length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay solicitudes de inscripción pendientes.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <th style={{ padding: '0.75rem' }}>Estudiante</th>
                        <th style={{ padding: '0.75rem' }}>Email / Teléfono</th>
                        <th style={{ padding: '0.75rem' }}>Curso</th>
                        <th style={{ padding: '0.75rem' }}>Dirección</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.filter(r => r.status === 'pending').map((req) => (
                        <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>{req.name}</td>
                          <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem' }}>
                            <div>{req.user_email}</div>
                            <div style={{ color: 'var(--text-muted)' }}>{req.phone}</div>
                          </td>
                          <td style={{ padding: '1rem 0.75rem' }}><span style={{ color: 'var(--primary)', fontWeight: 600 }}>{req.course_name}</span></td>
                          <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{req.address}</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                                onClick={() => { setSelectedReqId(req.id); setStudentPass(''); }}
                              >
                                Aprobar
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', color: 'var(--accent)' }}
                                onClick={() => handleRejectRequest(req.id)}
                              >
                                Rechazar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. SECCIÓN: CURSOS (CRUD) */}
          {activeTab === 'courses' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
              {/* Formulario */}
              <div className="glass-card" style={{ height: 'fit-content' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 600 }}>
                  {editingCourseId ? 'Editar Curso' : 'Crear Nuevo Curso'}
                </h2>
                <form onSubmit={handleCourseSubmit}>
                  <div className="form-group">
                    <label className="form-label">Nombre de Especialidad / Carrera</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej. Mecánica Automotriz"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      placeholder="Indica qué aprenderá el alumno en el taller..."
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Días de Impartición</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej. Lunes a Viernes, o Sábados"
                      value={courseDays}
                      onChange={(e) => setCourseDays(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horario</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej. 08:00 - 12:00, o 14:00 - 18:00"
                      value={courseSchedules}
                      onChange={(e) => setCourseSchedules(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cupo Límite de Alumnos</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="1"
                      placeholder="Ej. 10"
                      value={courseCupo}
                      onChange={(e) => setCourseCupo(e.target.value)}
                      required
                    />
                  </div>

                  {/* Nuevas Cajitas para Costos */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Costo Inscripción (Q)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        className="form-control" 
                        placeholder="Ej. 150.00"
                        value={courseCostoInscripcion}
                        onChange={(e) => setCourseCostoInscripcion(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mensualidad (Q)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        className="form-control" 
                        placeholder="Ej. 250.00"
                        value={courseCostoMensualidad}
                        onChange={(e) => setCourseCostoMensualidad(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Foto / Imagen de Portada</label>
                    <input 
                      id="course-image-input"
                      type="file" 
                      className="form-control" 
                      accept="image/*"
                      onChange={(e) => setCourseImageFile(e.target.files[0])}
                    />
                    {courseExistingImage && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Imagen actual: <a href={getFullUrl(courseExistingImage)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Ver archivo</a>
                      </div>
                    )}
                  </div>

                  {editingCourseId && (
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                      <label className="form-label">Asignar Instructor</label>
                      <select 
                        className="form-control form-select"
                        value={courseInstructor}
                        onChange={(e) => setCourseInstructor(e.target.value)}
                      >
                        <option value="">-- Sin Instructor --</option>
                        {instructorsList.map((ins) => (
                          <option key={ins.id} value={ins.id}>{ins.name} ({ins.email})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {editingCourseId ? 'Guardar Cambios' : 'Crear Curso'}
                    </button>
                    {editingCourseId && (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => {
                          setEditingCourseId(null);
                          setCourseName('');
                          setCourseDesc('');
                          setCourseSchedules('');
                          setCourseDays('');
                          setCourseCupo('10');
                          setCourseCostoInscripcion('0.00');
                          setCourseCostoMensualidad('0.00');
                          setCourseImageFile(null);
                          setCourseExistingImage('');
                          setCourseInstructor('');
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Lista */}
              <div className="glass-card">
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 600 }}>
                  Lista de Cursos
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {courses.map((course) => (
                    <div 
                      key={course.id} 
                      style={{ 
                        background: 'var(--inner-bg)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: '10px', 
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                          {course.image_url && (
                            <img src={getFullUrl(course.image_url)} alt={course.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          )}
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{course.name}</h3>
                        </div>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {course.description || 'Sin descripción disponible.'}
                        </p>
                        
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                           {course.days || 'Días no asignados'} |  {course.schedules || 'Horario no asignado'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                           Inscripción: <strong>Q {parseFloat(course.costo_inscripcion || 0).toFixed(2)}</strong> | Mensualidad: <strong>Q {parseFloat(course.costo_mensualidad || 0).toFixed(2)}</strong>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                           Cupo límite: {course.cupo_maximo || 10} alumnos
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                          Instructor: {course.instructor_name || 'No asignado'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleEditCourseClick(course)}
                        >
                          Editar
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--accent)' }}
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. SECCIÓN: PROFESORES */}
          {activeTab === 'instructors' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
              {/* Formulario de registro */}
              <div className="glass-card" style={{ height: 'fit-content' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 600 }}>
                  Registrar Nuevo Profesor / Instructor
                </h2>
                <form onSubmit={handleInstructorSubmit}>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej. Ing. Carlos Sosa"
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Correo Institucional (Gmail recomendado)</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="carlos.sosa@edutaller.edu"
                      value={instEmail}
                      onChange={(e) => setInstEmail(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contraseña de Acceso</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Establece una contraseña temporal"
                      value={instPass}
                      onChange={(e) => setInstPass(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Teléfono de Contacto</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      placeholder="Ej. +502 4444 8888"
                      value={instPhone}
                      onChange={(e) => setInstPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">Asignar directamente a un Curso (Opcional)</label>
                    <select 
                      className="form-control form-select"
                      value={instCourseId}
                      onChange={(e) => setInstCourseId(e.target.value)}
                    >
                      <option value="">-- No asignar por ahora --</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                    Registrar e Inscribir Profesor
                  </button>
                </form>
              </div>

              {/* Lista de Profesores */}
              <div className="glass-card">
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 600 }}>
                  Lista de Profesores / Instructores
                </h2>
                {instructorsList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay profesores registrados en la plataforma.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {instructorsList.map((ins) => (
                      <div 
                        key={ins.id} 
                        style={{ 
                          background: 'var(--inner-bg)', 
                          border: '1px solid var(--glass-border)', 
                          borderRadius: '10px', 
                          padding: '1rem'
                        }}
                      >
                        <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '1.05rem' }}>{ins.name}</h4>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                           {ins.email}
                        </div>
                        {ins.phone && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                             {ins.phone}
                          </div>
                        )}
                        {ins.address && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                             {ins.address}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                             Curso: <strong>{ins.course_name || 'Ninguno asignado'}</strong>
                          </div>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--accent)' }}
                            onClick={() => handleDeleteInstructor(ins.id)}
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

          {/* 4. SECCIÓN: ESTUDIANTES MATRICULADOS (AGRUPADOS POR CURSO) */}
          {activeTab === 'students' && (
            <div className="glass-card">
              <h2 style={{ marginTop: 0, marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 600 }}>
                Estudiantes por Especialidad / Curso
              </h2>

              {courses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay carreras técnicas o cursos creados.</p>
              ) : (
                <div>
                  {courses.map((course) => {
                    const courseStudents = students.filter(s => s.course_id === course.id);

                    return (
                      <div key={course.id} style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2rem' }}>
                        <h3 style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '0.75rem', color: 'white', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.25rem' }}>
                          Curso / Especialidad: {course.name}
                        </h3>

                        {courseStudents.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', paddingLeft: '1rem' }}>
                            No hay estudiantes inscritos en esta especialidad actualmente.
                          </p>
                        ) : (
                          <div style={{ overflowX: 'auto', paddingLeft: '0.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                  <th style={{ padding: '0.5rem' }}>Nombre del Alumno</th>
                                  <th style={{ padding: '0.5rem' }}>Correo Electrónico</th>
                                  <th style={{ padding: '0.5rem' }}>Teléfono</th>
                                  <th style={{ padding: '0.5rem' }}>Estado de Solvencia</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {courseStudents.map((student) => (
                                  <tr key={student.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>{student.name}</td>
                                    <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.9rem' }}>{student.email}</td>
                                    <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{student.phone || 'No registrado'}</td>
                                    <td style={{ padding: '0.85rem 0.5rem' }}>
                                      {student.solvente === 1 ? (
                                        <span style={{ 
                                          background: 'rgba(16, 185, 129, 0.15)', 
                                          color: '#10b981', 
                                          padding: '0.25rem 0.5rem', 
                                          borderRadius: '4px', 
                                          fontSize: '0.8rem', 
                                          fontWeight: 600,
                                          border: '1px solid rgba(16, 185, 129, 0.3)'
                                        }}>
                                          Solvente
                                        </span>
                                      ) : (
                                        <span style={{ 
                                          background: 'rgba(244, 63, 94, 0.15)', 
                                          color: 'var(--accent)', 
                                          padding: '0.25rem 0.5rem', 
                                          borderRadius: '4px', 
                                          fontSize: '0.8rem', 
                                          fontWeight: 600,
                                          border: '1px solid rgba(244, 63, 94, 0.3)'
                                        }}>
                                          No Solvente
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                        <button 
                                          className="btn btn-secondary" 
                                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: student.solvente === 1 ? 'var(--accent)' : '#10b981' }}
                                          onClick={() => handleToggleSolvency(student.enrollment_id, student.solvente)}
                                        >
                                          {student.solvente === 1 ? 'Marcar Insolvente' : 'Marcar Solvente'}
                                        </button>
                                        <button 
                                          className="btn btn-secondary" 
                                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--accent)' }}
                                          onClick={() => handleDeleteStudent(student.student_id)}
                                        >
                                          Eliminar
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. SECCIÓN: PAGOS RECIBIDOS */}
          {activeTab === 'payments' && (
            <div className="glass-card">
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
                Boletas de Pago Recibidas
              </h2>
              {payments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay registros de pagos recibidos.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <th style={{ padding: '0.75rem' }}>Estudiante</th>
                        <th style={{ padding: '0.75rem' }}>Monto</th>
                        <th style={{ padding: '0.75rem' }}>Tipo</th>
                        <th style={{ padding: '0.75rem' }}>Fecha</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((pay) => (
                        <tr key={pay.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <div style={{ fontWeight: 600 }}>{pay.student_name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pay.student_email}</div>
                          </td>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold', color: '#10b981' }}>
                            Q {parseFloat(pay.amount).toFixed(2)}
                          </td>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <span style={{ 
                              background: pay.type === 'inscription' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: pay.type === 'inscription' ? 'var(--primary)' : '#10b981',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}>
                              {pay.type === 'inscription' ? 'Inscripción' : 'Mensualidad'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {new Date(pay.payment_date).toLocaleString()}
                          </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <a 
                                href={getFullUrl(pay.receipt_url)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                              >
                                Ver Boleta
                              </a>
                              <button 
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                                onClick={() => handleMarkSolventFromPayment(pay.student_id)}
                              >
                                Marcar como Solvente
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 6. SECCIÓN: EDITAR PRESENTACIÓN & MENSAJES DE CONTACTO */}
          {activeTab === 'presentation' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
              {/* Formulario de Configuración */}
              <div className="glass-card" style={{ height: 'fit-content' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 600 }}>
                  Editar Presentación e Imagen de Fondo
                </h2>
                <form onSubmit={handleSettingsSubmit}>
                  <div className="form-group">
                    <label className="form-label">Nombre de la Institución</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={instSettings.institution_name || ''} 
                      onChange={(e) => setInstSettings({ ...instSettings, institution_name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Texto de Presentación en Inicio</label>
                    <textarea 
                      className="form-control" 
                      rows="4" 
                      value={instSettings.presentation_text || ''} 
                      onChange={(e) => setInstSettings({ ...instSettings, presentation_text: e.target.value })} 
                      required 
                    />
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', fontWeight: 600 }}>Datos de Contacto Públicos</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Correo de Contacto</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={instSettings.contact_email || ''} 
                        onChange={(e) => setInstSettings({ ...instSettings, contact_email: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono Público</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={instSettings.contact_phone || ''} 
                        onChange={(e) => setInstSettings({ ...instSettings, contact_phone: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Dirección Física</label>
                      <textarea 
                        className="form-control" 
                        rows="2" 
                        value={instSettings.contact_address || ''} 
                        onChange={(e) => setInstSettings({ ...instSettings, contact_address: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', fontWeight: 600 }}>Misión de la Academia</h3>
                    <div className="form-group">
                      <label className="form-label">Texto de la Misión</label>
                      <textarea 
                        className="form-control" 
                        rows="3" 
                        value={instSettings.mision_text || ''} 
                        onChange={(e) => setInstSettings({ ...instSettings, mision_text: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', fontWeight: 600 }}>Visión de la Academia</h3>
                    <div className="form-group">
                      <label className="form-label">Texto de la Visión</label>
                      <textarea 
                        className="form-control" 
                        rows="3" 
                        value={instSettings.vision_text || ''} 
                        onChange={(e) => setInstSettings({ ...instSettings, vision_text: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>


                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Guardar Cambios de Presentación
                  </button>
                </form>
              </div>

              {/* Mensajes de Contacto recibidos */}
              <div className="glass-card">
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 600 }}>
                  Mensajes de Contacto Recibidos
                </h2>
                {contactMessages.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay mensajes recibidos por el momento.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
                    {contactMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        style={{ 
                          background: 'var(--inner-bg)', 
                          border: '1px solid var(--glass-border)', 
                          borderRadius: '10px', 
                          padding: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{msg.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                           <strong>Email:</strong> {msg.email}
                        </div>
                        {msg.phone && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            <strong>Teléfono:</strong> {msg.phone}
                          </div>
                        )}
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', lineHeight: '1.5', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                          {msg.message}
                        </p>
                      </div>
                    ))}
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
