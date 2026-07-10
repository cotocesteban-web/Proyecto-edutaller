import { mysqlPool } from '../config/db.js';
import { Log } from '../models/Log.js';
import { Material } from '../models/Material.js';
import { Comment } from '../models/Comment.js';
import { requireInstructor } from '../middlewares/auth.js';
import { uploadFile } from '../config/supabase.js';

export const instructorRoutes = async (fastify) => {
  // Asegurar permisos de Instructor
  fastify.addHook('preHandler', requireInstructor);

  // Helper para obtener el curso del profesor logueado
  const getInstructorCourse = async (instructorId) => {
    const [rows] = await mysqlPool.query(
      'SELECT id, name, description FROM courses WHERE instructor_id = ?',
      [instructorId]
    );
    return rows[0] || null;
  };

  // 1. Obtener detalles y alumnos de la especialidad asignada
  fastify.get('/course', async (request, reply) => {
    try {
      const course = await getInstructorCourse(request.user.id);
      if (!course) {
        return reply.code(404).send({ error: 'No tienes ningún curso asignado actualmente.' });
      }

      // Obtener alumnos matriculados
      const [students] = await mysqlPool.query(
        `SELECT u.id, u.name, u.email, u.phone 
         FROM enrollments e 
         JOIN users u ON e.student_id = u.id 
         WHERE e.course_id = ?`,
        [course.id]
      );

      return { course, students };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al consultar curso' });
    }
  });

  // 2. Crear Tareas
  fastify.post('/tasks', async (request, reply) => {
    const { title, description, due_date } = request.body || {};

    if (!title || !due_date) {
      return reply.code(400).send({ error: 'El título y la fecha de entrega son obligatorios' });
    }

    try {
      const course = await getInstructorCourse(request.user.id);
      if (!course) {
        return reply.code(404).send({ error: 'No tienes un curso asignado para asignar tareas.' });
      }

      await mysqlPool.query(
        'INSERT INTO tasks (course_id, title, description, due_date) VALUES (?, ?, ?, ?)',
        [course.id, title, description || null, due_date]
      );

      await Log.create({
        userId: String(request.user.id),
        action: 'TASK_CREATED',
        details: { courseId: course.id, title },
        ipAddress: request.ip
      });

      return { message: 'Tarea creada con éxito' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al crear tarea' });
    }
  });

  // 3. Obtener Tareas creadas
  fastify.get('/tasks', async (request, reply) => {
    try {
      const course = await getInstructorCourse(request.user.id);
      if (!course) return [];

      const [rows] = await mysqlPool.query(
        'SELECT * FROM tasks WHERE course_id = ? ORDER BY due_date ASC',
        [course.id]
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al consultar tareas' });
    }
  });

  // 4. Subir Material Didáctico (Fastify Multipart)
  fastify.post('/materials', async (request, reply) => {
    const course = await getInstructorCourse(request.user.id);
    if (!course) {
      return reply.code(404).send({ error: 'No puedes subir material sin un curso asignado.' });
    }

    // Comprobar si la petición contiene archivos
    if (!request.isMultipart()) {
      return reply.code(400).send({ error: 'La petición debe ser de tipo multipart (form-data)' });
    }

    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'No se recibió ningún archivo' });
      }

      // a. Validación de Tamaño (máximo 5 MB)
      const fileBuffer = await data.toBuffer();
      if (fileBuffer.length > 5 * 1024 * 1024) {
        return reply.code(400).send({ error: 'El archivo excede el tamaño máximo permitido de 5 MB' });
      }

      // b. Validación estricta de MIME-type
      const allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedMimes.includes(data.mimetype)) {
        return reply.code(400).send({ error: 'Tipo de archivo no permitido. Solo se aceptan PDFs, imágenes y documentos Word/Texto.' });
      }

      // c. Subir archivo
      const fileUrl = await uploadFile('materials', data.filename, fileBuffer, data.mimetype);

      // Obtener el título del formulario (si se envió, de lo contrario usar el nombre del archivo)
      const title = data.fields.title?.value || data.filename;

      // d. Guardar en MongoDB
      const newMaterial = await Material.create({
        courseId: course.id,
        title,
        fileUrl
      });

      await Log.create({
        userId: String(request.user.id),
        action: 'MATERIAL_UPLOADED',
        details: { courseId: course.id, title, fileUrl },
        ipAddress: request.ip
      });

      return { message: 'Material didáctico subido con éxito', material: newMaterial };

    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al procesar la carga de archivo' });
    }
  });

  // 5. Obtener Materiales del curso
  fastify.get('/materials', async (request, reply) => {
    try {
      const course = await getInstructorCourse(request.user.id);
      if (!course) return [];

      const materials = await Material.find({ courseId: course.id }).sort({ uploadedAt: -1 });
      return materials;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al consultar materiales' });
    }
  });

  // 6. Consultar entregas hechas por alumnos
  fastify.get('/submissions', async (request, reply) => {
    try {
      const course = await getInstructorCourse(request.user.id);
      if (!course) return [];

      const [rows] = await mysqlPool.query(
        `SELECT g.id as grade_id, g.score, g.submission_text, g.submission_file_url, g.submitted_at, 
                t.title as task_title, u.name as student_name, u.email as student_email, t.id as task_id
         FROM grades g
         JOIN tasks t ON g.task_id = t.id
         JOIN users u ON g.student_id = u.id
         WHERE t.course_id = ? AND g.submitted_at IS NOT NULL
         ORDER BY g.submitted_at DESC`,
        [course.id]
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al consultar entregas' });
    }
  });

  // 7. Calificar entrega (1 a 10)
  fastify.post('/submissions/:id/grade', async (request, reply) => {
    const { id } = request.params; // ID de la fila en 'grades'
    const { score } = request.body || {};

    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 10) {
      return reply.code(400).send({ error: 'La calificación debe ser un número entero entre 1 y 10' });
    }

    try {
      const course = await getInstructorCourse(request.user.id);
      if (!course) {
        return reply.code(403).send({ error: 'No tienes un curso asignado.' });
      }

      // Validar que la entrega pertenezca al curso del profesor
      const [rows] = await mysqlPool.query(
        `SELECT g.id FROM grades g 
         JOIN tasks t ON g.task_id = t.id 
         WHERE g.id = ? AND t.course_id = ?`,
        [id, course.id]
      );

      if (rows.length === 0) {
        return reply.code(404).send({ error: 'Entrega no encontrada o no pertenece a tu curso' });
      }

      await mysqlPool.query(
        'UPDATE grades SET score = ?, graded_at = NOW() WHERE id = ?',
        [parsedScore, id]
      );

      await Log.create({
        userId: String(request.user.id),
        action: 'TASK_GRADED',
        details: { gradeId: id, score: parsedScore },
        ipAddress: request.ip
      });

      return { message: 'Tarea calificada con éxito' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al calificar tarea' });
    }
  });

  // 8. Mensajería: Obtener comentarios recibidos de sus estudiantes
  fastify.get('/comments', async (request, reply) => {
    try {
      const course = await getInstructorCourse(request.user.id);
      if (!course) return [];

      const comments = await Comment.find({ 
        courseId: course.id, 
        instructorId: request.user.id 
      }).sort({ timestamp: 1 });

      return comments;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al consultar mensajes' });
    }
  });

  // 9. Mensajería: Responder a estudiante
  fastify.post('/comments', async (request, reply) => {
    const { studentId, text } = request.body || {};
    if (!studentId || !text) {
      return reply.code(400).send({ error: 'Faltan campos obligatorios: studentId, text' });
    }

    try {
      const course = await getInstructorCourse(request.user.id);
      if (!course) {
        return reply.code(403).send({ error: 'No tienes un curso asignado.' });
      }

      // Obtener el nombre del instructor desde MySQL ya que no está en el token JWT
      const [userRows] = await mysqlPool.query(
        'SELECT name FROM users WHERE id = ?',
        [request.user.id]
      );
      const instructorName = userRows[0]?.name || 'Profesor';

      const newComment = await Comment.create({
        courseId: course.id,
        instructorId: request.user.id,
        studentId: parseInt(studentId, 10),
        senderId: request.user.id,
        senderName: instructorName,
        text
      });

      return newComment;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al enviar respuesta' });
    }
  });

  // 10. Eliminar Material Didáctico
  fastify.delete('/materials/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const course = await getInstructorCourse(request.user.id);
      if (!course) {
        return reply.code(403).send({ error: 'No tienes un curso asignado.' });
      }

      // Buscar el material y verificar que pertenezca al curso del profesor
      const material = await Material.findOne({ _id: id, courseId: course.id });
      if (!material) {
        return reply.code(404).send({ error: 'Material no encontrado o no pertenece a tu especialidad.' });
      }

      await Material.deleteOne({ _id: id });

      await Log.create({
        userId: String(request.user.id),
        action: 'MATERIAL_DELETED',
        details: { courseId: course.id, materialId: id, title: material.title },
        ipAddress: request.ip
      });

      return { message: 'Material didáctico eliminado con éxito' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al eliminar material didáctico' });
    }
  });

  // 11. Mensajería: Eliminar historial de conversación con un estudiante
  fastify.delete('/comments/:studentId', async (request, reply) => {
    const { studentId } = request.params;
    if (!studentId) {
      return reply.code(400).send({ error: 'Falta el ID del estudiante.' });
    }

    try {
      const course = await getInstructorCourse(request.user.id);
      if (!course) {
        return reply.code(403).send({ error: 'No tienes un curso asignado.' });
      }

      await Comment.deleteMany({
        courseId: course.id,
        instructorId: request.user.id,
        studentId: parseInt(studentId, 10)
      });

      return { message: 'Historial de conversación eliminado correctamente' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al eliminar historial de conversación' });
    }
  });
};
