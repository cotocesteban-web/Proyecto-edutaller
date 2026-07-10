import { mysqlPool } from '../config/db.js';
import { Log } from '../models/Log.js';
import { Material } from '../models/Material.js';
import { Comment } from '../models/Comment.js';
import { requireStudent } from '../middlewares/auth.js';
import { uploadFile } from '../config/supabase.js';

export const studentRoutes = async (fastify) => {
  // Asegurar permisos de Estudiante
  fastify.addHook('preHandler', requireStudent);

  // Helper para obtener el curso del alumno logueado con estado de solvencia
  const getStudentCourse = async (studentId) => {
    const [rows] = await mysqlPool.query(
      `SELECT c.id, c.name, c.description, c.instructor_id, u.name as instructor_name, u.email as instructor_email, e.solvente 
       FROM enrollments e 
       JOIN courses c ON e.course_id = c.id 
       LEFT JOIN users u ON c.instructor_id = u.id 
       WHERE e.student_id = ?`,
      [studentId]
    );
    return rows[0] || null;
  };

  // 1. Obtener detalles de su curso y profesor
  fastify.get('/course', async (request, reply) => {
    try {
      const course = await getStudentCourse(request.user.id);
      if (!course) {
        return reply.code(404).send({ error: 'No estás matriculado en ninguna especialidad actualmente.' });
      }
      return course;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al consultar matrícula' });
    }
  });

  // 1b. Obtener todos los cursos matriculados del alumno
  fastify.get('/courses', async (request, reply) => {
    try {
      const [rows] = await mysqlPool.query(
        `SELECT c.id, c.name, c.description, c.instructor_id, u.name as instructor_name, u.email as instructor_email, e.solvente 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         LEFT JOIN users u ON c.instructor_id = u.id 
         WHERE e.student_id = ?`,
        [request.user.id]
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al consultar cursos' });
    }
  });

  // 2. Obtener Materiales del curso
  fastify.get('/materials', async (request, reply) => {
    const { courseId } = request.query || {};
    try {
      if (!courseId) {
        return reply.code(400).send({ error: 'Falta courseId' });
      }
      // Verificar matrícula
      const [enroll] = await mysqlPool.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [request.user.id, courseId]
      );
      if (enroll.length === 0) {
        return reply.code(403).send({ error: 'No estás matriculado en este curso' });
      }

      const materials = await Material.find({ courseId: parseInt(courseId, 10) }).sort({ uploadedAt: -1 });
      return materials;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al consultar materiales' });
    }
  });

  // 3. Obtener Tareas asignadas y sus respectivas notas/entregas
  fastify.get('/tasks', async (request, reply) => {
    const { courseId } = request.query || {};
    try {
      if (!courseId) {
        return reply.code(400).send({ error: 'Falta courseId' });
      }
      // Verificar matrícula
      const [enroll] = await mysqlPool.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [request.user.id, courseId]
      );
      if (enroll.length === 0) {
        return reply.code(403).send({ error: 'No estás matriculado en este curso' });
      }

      const [rows] = await mysqlPool.query(
        `SELECT t.id as task_id, t.title, t.description, t.due_date, 
                 g.id as grade_id, g.score, g.submission_text, g.submission_file_url, g.submitted_at, g.graded_at
         FROM tasks t
         LEFT JOIN grades g ON t.id = g.task_id AND g.student_id = ?
         WHERE t.course_id = ?
         ORDER BY t.due_date ASC`,
        [request.user.id, courseId]
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al consultar tareas asignadas' });
    }
  });

  // 4. Entregar Tarea (Soporta archivo y/o texto)
  fastify.post('/tasks/:id/submit', async (request, reply) => {
    const { id: taskId } = request.params;
    const parsedTaskId = parseInt(taskId, 10);

    try {
      // Obtener el curso de la tarea y verificar si el estudiante está inscrito en él
      const [taskRows] = await mysqlPool.query(
        `SELECT t.id, t.course_id, e.id as enrollment_id 
         FROM tasks t
         JOIN enrollments e ON t.course_id = e.course_id
         WHERE t.id = ? AND e.student_id = ?`,
        [parsedTaskId, request.user.id]
      );

      if (taskRows.length === 0) {
        return reply.code(404).send({ error: 'La tarea no existe o no estás matriculado en el curso correspondiente.' });
      }

      const courseId = taskRows[0].course_id;

      if (!request.isMultipart()) {
        return reply.code(400).send({ error: 'La petición debe ser multipart (form-data)' });
      }

      const parts = request.parts();
      let submissionText = '';
      let fileUrl = null;
      let filename = '';
      let fileBuffer = null;
      let fileMime = '';

      for await (const part of parts) {
        if (part.file) {
          fileBuffer = await part.toBuffer();
          filename = part.filename;
          fileMime = part.mimetype;
        } else {
          if (part.fieldname === 'submission_text') {
            submissionText = part.value;
          }
        }
      }

      // Validar si al menos se envió texto o archivo
      if (!submissionText && !fileBuffer) {
        return reply.code(400).send({ error: 'Debes proporcionar una respuesta en texto o subir un archivo' });
      }

      // Si hay archivo, validarlo y subirlo
      if (fileBuffer) {
        if (fileBuffer.length > 5 * 1024 * 1024) {
          return reply.code(400).send({ error: 'El archivo excede el tamaño máximo permitido de 5 MB' });
        }
        
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!allowedMimes.includes(fileMime)) {
          return reply.code(400).send({ error: 'Formato de archivo no admitido.' });
        }

        fileUrl = await uploadFile('submissions', filename, fileBuffer, fileMime);
      }

      // Upsert en la tabla 'grades'
      await mysqlPool.query(
        `INSERT INTO grades (task_id, student_id, submission_text, submission_file_url, submitted_at, score, graded_at) 
         VALUES (?, ?, ?, ?, NOW(), NULL, NULL)
         ON DUPLICATE KEY UPDATE 
           submission_text = VALUES(submission_text), 
           submission_file_url = VALUES(submission_file_url), 
           submitted_at = NOW(),
           score = NULL,
           graded_at = NULL`,
        [parsedTaskId, request.user.id, submissionText || null, fileUrl || null]
      );

      await Log.create({
        userId: String(request.user.id),
        action: 'TASK_SUBMITTED',
        details: { taskId: parsedTaskId, fileUrl, courseId },
        ipAddress: request.ip
      });

      return { message: 'Tarea entregada con éxito' };

    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al enviar tarea' });
    }
  });

  // 5. Enviar Boleta de Pago (Inscripción / Mensualidad)
  fastify.post('/payments', async (request, reply) => {
    if (!request.isMultipart()) {
      return reply.code(400).send({ error: 'Formato inválido. Debe ser multipart' });
    }

    try {
      const parts = request.parts();
      let amount = '';
      let type = ''; // 'inscription' o 'monthly'
      let fileBuffer = null;
      let filename = '';
      let fileMime = '';

      for await (const part of parts) {
        if (part.file) {
          fileBuffer = await part.toBuffer();
          filename = part.filename;
          fileMime = part.mimetype;
        } else {
          if (part.fieldname === 'amount') amount = part.value;
          if (part.fieldname === 'type') type = part.value;
        }
      }

      if (!amount || !type || !fileBuffer) {
        return reply.code(400).send({ error: 'Todos los campos son obligatorios: monto, tipo de pago y la foto de la boleta.' });
      }

      // Validar monto
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return reply.code(400).send({ error: 'El monto del pago debe ser un número válido mayor a 0' });
      }

      // Validar tipo
      if (type !== 'inscription' && type !== 'monthly') {
        return reply.code(400).send({ error: 'Tipo de pago inválido.' });
      }

      // Validar tamaño y tipo
      if (fileBuffer.length > 5 * 1024 * 1024) {
        return reply.code(400).send({ error: 'La foto de la boleta excede los 5 MB permitidos' });
      }
      
      const allowedImageMimes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedImageMimes.includes(fileMime)) {
        return reply.code(400).send({ error: 'La boleta de pago debe ser una imagen (JPG/PNG) o un PDF' });
      }

      // Subir boleta
      const receiptUrl = await uploadFile('payments', filename, fileBuffer, fileMime);

      // Registrar pago en MySQL
      await mysqlPool.query(
        'INSERT INTO payments (student_id, amount, receipt_url, type) VALUES (?, ?, ?, ?)',
        [request.user.id, parsedAmount, receiptUrl, type]
      );

      await Log.create({
        userId: String(request.user.id),
        action: 'PAYMENT_SUBMITTED',
        details: { amount: parsedAmount, type },
        ipAddress: request.ip
      });

      return { message: 'Boleta de pago enviada con éxito. Pendiente de verificación por el administrador.' };

    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al enviar boleta de pago' });
    }
  });

  // 6. Mensajería: Obtener historial de comentarios con el profesor
  fastify.get('/comments', async (request, reply) => {
    const { courseId } = request.query || {};
    try {
      if (!courseId) {
        return reply.code(400).send({ error: 'Falta courseId' });
      }
      // Verificar matrícula
      const [enroll] = await mysqlPool.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [request.user.id, courseId]
      );
      if (enroll.length === 0) {
        return reply.code(403).send({ error: 'No estás matriculado en este curso' });
      }

      const comments = await Comment.find({
        courseId: parseInt(courseId, 10),
        studentId: request.user.id
      }).sort({ timestamp: 1 });

      return comments;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al consultar mensajes' });
    }
  });

  // 7. Mensajería: Enviar comentario al profesor
  fastify.post('/comments', async (request, reply) => {
    const { text, courseId } = request.body || {};
    if (!text || !courseId) {
      return reply.code(400).send({ error: 'El mensaje y el courseId son obligatorios.' });
    }

    try {
      // Obtener detalles del curso para este alumno
      const [rows] = await mysqlPool.query(
        `SELECT c.id, c.instructor_id, u.name as instructor_name 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         LEFT JOIN users u ON c.instructor_id = u.id 
         WHERE e.student_id = ? AND c.id = ?`,
        [request.user.id, parseInt(courseId, 10)]
      );

      if (rows.length === 0) {
        return reply.code(403).send({ error: 'No estás matriculado en este curso.' });
      }

      const course = rows[0];
      if (!course.instructor_id) {
        return reply.code(400).send({ error: 'El curso no tiene un instructor asignado para recibir tu mensaje.' });
      }

      // Obtener el nombre del alumno desde MySQL ya que no está en el token JWT
      const [userRows] = await mysqlPool.query(
        'SELECT name FROM users WHERE id = ?',
        [request.user.id]
      );
      const studentName = userRows[0]?.name || 'Estudiante';

      const newComment = await Comment.create({
        courseId: course.id,
        studentId: request.user.id,
        instructorId: course.instructor_id,
        senderId: request.user.id,
        senderName: studentName,
        text
      });

      return newComment;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al enviar mensaje' });
    }
  });

  // 8. Mensajería: Eliminar historial de conversación con el profesor
  fastify.delete('/comments', async (request, reply) => {
    const { courseId } = request.query || {};
    try {
      if (!courseId) {
        return reply.code(400).send({ error: 'Falta courseId' });
      }

      const [rows] = await mysqlPool.query(
        `SELECT c.instructor_id FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.student_id = ? AND c.id = ?`,
        [request.user.id, courseId]
      );
      if (rows.length === 0) {
        return reply.code(403).send({ error: 'No estás matriculado en este curso.' });
      }

      const course = rows[0];
      if (!course.instructor_id) {
        return reply.code(400).send({ error: 'No hay instructor asignado en este curso.' });
      }

      await Comment.deleteMany({
        courseId: parseInt(courseId, 10),
        studentId: request.user.id,
        instructorId: course.instructor_id
      });

      return { message: 'Historial de conversación eliminado correctamente' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al eliminar historial de conversación' });
    }
  });
};
