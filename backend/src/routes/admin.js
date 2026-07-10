import crypto from 'node:crypto';
import { mysqlPool } from '../config/db.js';
import { Log } from '../models/Log.js';
import { requireAdmin } from '../middlewares/auth.js';
import { sendInsolvencyAlert } from '../utils/email.js';
import { uploadFile } from '../config/supabase.js';

export const adminRoutes = async (fastify) => {
  // Aplicar middleware de administrador a todas las rutas de este archivo
  fastify.addHook('preHandler', requireAdmin);

  // 1. Obtener todas las solicitudes de inscripción
  fastify.get('/requests', async (request, reply) => {
    try {
      const [rows] = await mysqlPool.query(
        `SELECT er.*, c.name as course_name 
         FROM enrollment_requests er 
         LEFT JOIN courses c ON er.course_id = c.id 
         ORDER BY er.created_at DESC`
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al obtener solicitudes' });
    }
  });

  // 2. Aprobar solicitud y crear cuenta de estudiante
  fastify.post('/requests/:id/approve', async (request, reply) => {
    const { id } = request.params;
    const { password } = request.body || {};

    if (!password) {
      return reply.code(400).send({ error: 'Debe proporcionar una contraseña para la cuenta del estudiante' });
    }

    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();

      // a. Obtener detalles de la solicitud
      const [reqRows] = await connection.query(
        'SELECT * FROM enrollment_requests WHERE id = ? AND status = "pending"',
        [id]
      );

      if (reqRows.length === 0) {
        await connection.rollback();
        return reply.code(404).send({ error: 'Solicitud no encontrada o ya procesada' });
      }

      const enrollReq = reqRows[0];

      // Verificar si el usuario con ese correo ya existe en el sistema
      const [existingUserRows] = await connection.query(
        'SELECT id, role FROM users WHERE email = ?',
        [enrollReq.user_email]
      );

      let newStudentId;

      if (existingUserRows.length > 0) {
        const userRole = existingUserRows[0].role;
        if (userRole === 'admin' || userRole === 'instructor') {
          await connection.rollback();
          return reply.code(400).send({ error: 'No se permite matricular a administradores o profesores en cursos' });
        }
        newStudentId = existingUserRows[0].id;
      } else {
        // b. Crear el hash de la contraseña si el usuario es nuevo
        const hash = crypto.createHash('sha256').update(password).digest('hex');

        // c. Insertar en la tabla users
        const [userResult] = await connection.query(
          'INSERT INTO users (email, password_hash, role, name, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
          [enrollReq.user_email, hash, 'student', enrollReq.name, enrollReq.phone, enrollReq.address]
        );
        newStudentId = userResult.insertId;
      }

      // d. Crear la matrícula del estudiante en el curso
      await connection.query(
        'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
        [newStudentId, enrollReq.course_id]
      );

      // e. Actualizar estado de la solicitud
      await connection.query(
        'UPDATE enrollment_requests SET status = "approved" WHERE id = ?',
        [id]
      );

      await connection.commit();

      // f. Guardar Log en MongoDB
      await Log.create({
        userId: request.user.id,
        action: 'ENROLLMENT_REQUEST_APPROVED',
        details: { requestId: id, studentEmail: enrollReq.user_email, studentId: newStudentId },
        ipAddress: request.ip
      });

      return { message: 'Estudiante aprobado e inscrito correctamente' };

    } catch (err) {
      await connection.rollback();
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al procesar la aprobación' });
    } finally {
      connection.release();
    }
  });

  // 3. Rechazar solicitud
  fastify.post('/requests/:id/reject', async (request, reply) => {
    const { id } = request.params;
    try {
      const [reqRows] = await mysqlPool.query(
        'SELECT * FROM enrollment_requests WHERE id = ? AND status = "pending"',
        [id]
      );

      if (reqRows.length === 0) {
        return reply.code(404).send({ error: 'Solicitud no encontrada o ya procesada' });
      }

      await mysqlPool.query(
        'UPDATE enrollment_requests SET status = "rejected" WHERE id = ?',
        [id]
      );

      // Guardar Log en MongoDB
      await Log.create({
        userId: request.user.id,
        action: 'ENROLLMENT_REQUEST_REJECTED',
        details: { requestId: id, studentEmail: reqRows[0].user_email },
        ipAddress: request.ip
      });

      return { message: 'Solicitud rechazada correctamente' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al rechazar solicitud' });
    }
  });

  // 4. CRUD Cursos: Obtener lista con instructores
  fastify.get('/courses', async (request, reply) => {
    try {
      const [rows] = await mysqlPool.query(
        `SELECT c.*, u.name as instructor_name, u.email as instructor_email 
         FROM courses c 
         LEFT JOIN users u ON c.instructor_id = u.id`
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al obtener cursos' });
    }
  });

  // 5. CRUD Cursos: Crear curso (Soporta multipart para subir imagen y datos)
  fastify.post('/courses', async (request, reply) => {
    if (!request.isMultipart()) {
      return reply.code(400).send({ error: 'La petición debe ser multipart (form-data)' });
    }

    try {
      const parts = request.parts();
      let name = '';
      let description = '';
      let schedules = '';
      let days = '';
      let cupo_maximo = 10;
      let costo_inscripcion = 0.00;
      let costo_mensualidad = 0.00;
      let fileBuffer = null;
      let filename = '';
      let fileMime = '';

      for await (const part of parts) {
        if (part.file) {
          fileBuffer = await part.toBuffer();
          filename = part.filename;
          fileMime = part.mimetype;
        } else {
          if (part.fieldname === 'name') name = part.value;
          if (part.fieldname === 'description') description = part.value;
          if (part.fieldname === 'schedules') schedules = part.value;
          if (part.fieldname === 'days') days = part.value;
          if (part.fieldname === 'cupo_maximo') {
            const parsedVal = parseInt(part.value, 10);
            if (!isNaN(parsedVal)) cupo_maximo = parsedVal;
          }
          if (part.fieldname === 'costo_inscripcion') {
            const parsedVal = parseFloat(part.value);
            if (!isNaN(parsedVal)) costo_inscripcion = parsedVal;
          }
          if (part.fieldname === 'costo_mensualidad') {
            const parsedVal = parseFloat(part.value);
            if (!isNaN(parsedVal)) costo_mensualidad = parsedVal;
          }
        }
      }

      if (!name) {
        return reply.code(400).send({ error: 'El nombre del curso es obligatorio' });
      }

      let imageUrl = null;
      if (fileBuffer && fileBuffer.length > 0) {
        if (fileBuffer.length > 5 * 1024 * 1024) {
          return reply.code(400).send({ error: 'La imagen excede el tamaño máximo permitido de 5 MB' });
        }
        const allowedImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedImageMimes.includes(fileMime)) {
          return reply.code(400).send({ error: 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP)' });
        }
        imageUrl = await uploadFile('courses', filename, fileBuffer, fileMime);
      }

      await mysqlPool.query(
        'INSERT INTO courses (name, description, image_url, schedules, days, cupo_maximo, costo_inscripcion, costo_mensualidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, description || null, imageUrl, schedules || null, days || null, cupo_maximo, costo_inscripcion, costo_mensualidad]
      );

      await Log.create({
        userId: request.user.id,
        action: 'COURSE_CREATED',
        details: { courseName: name },
        ipAddress: request.ip
      });

      return { message: 'Curso creado con éxito' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al crear curso' });
    }
  });

  // 6. CRUD Cursos: Editar curso (Soporta multipart para actualizar imagen y datos)
  fastify.put('/courses/:id', async (request, reply) => {
    const { id } = request.params;
    if (!request.isMultipart()) {
      return reply.code(400).send({ error: 'La petición debe ser multipart (form-data)' });
    }

    try {
      const parts = request.parts();
      let name = '';
      let description = '';
      let schedules = '';
      let days = '';
      let cupo_maximo = 10;
      let costo_inscripcion = 0.00;
      let costo_mensualidad = 0.00;
      let instructor_id = null;
      let fileBuffer = null;
      let filename = '';
      let fileMime = '';
      let existingImage = null;

      for await (const part of parts) {
        if (part.file) {
          fileBuffer = await part.toBuffer();
          filename = part.filename;
          fileMime = part.mimetype;
        } else {
          if (part.fieldname === 'name') name = part.value;
          if (part.fieldname === 'description') description = part.value;
          if (part.fieldname === 'schedules') schedules = part.value;
          if (part.fieldname === 'days') days = part.value;
          if (part.fieldname === 'cupo_maximo') {
            const parsedVal = parseInt(part.value, 10);
            if (!isNaN(parsedVal)) cupo_maximo = parsedVal;
          }
          if (part.fieldname === 'costo_inscripcion') {
            const parsedVal = parseFloat(part.value);
            if (!isNaN(parsedVal)) costo_inscripcion = parsedVal;
          }
          if (part.fieldname === 'costo_mensualidad') {
            const parsedVal = parseFloat(part.value);
            if (!isNaN(parsedVal)) costo_mensualidad = parsedVal;
          }
          if (part.fieldname === 'instructor_id') {
            instructor_id = part.value ? parseInt(part.value, 10) : null;
          }
          if (part.fieldname === 'existing_image') {
            existingImage = part.value;
          }
        }
      }

      if (!name) {
        return reply.code(400).send({ error: 'El nombre del curso es obligatorio' });
      }

      if (instructor_id) {
        const [instRows] = await mysqlPool.query(
          'SELECT id FROM users WHERE id = ? AND role = "instructor"',
          [instructor_id]
        );
        if (instRows.length === 0) {
          return reply.code(400).send({ error: 'El ID proporcionado no pertenece a un instructor registrado' });
        }
      }

      let imageUrl = existingImage || null;
      if (fileBuffer && fileBuffer.length > 0) {
        if (fileBuffer.length > 5 * 1024 * 1024) {
          return reply.code(400).send({ error: 'La imagen excede el tamaño máximo permitido de 5 MB' });
        }
        const allowedImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedImageMimes.includes(fileMime)) {
          return reply.code(400).send({ error: 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP)' });
        }
        imageUrl = await uploadFile('courses', filename, fileBuffer, fileMime);
      }

      await mysqlPool.query(
        `UPDATE courses 
         SET name = ?, description = ?, image_url = ?, schedules = ?, days = ?, cupo_maximo = ?, costo_inscripcion = ?, costo_mensualidad = ?, instructor_id = ? 
         WHERE id = ?`,
        [name, description || null, imageUrl, schedules || null, days || null, cupo_maximo, costo_inscripcion, costo_mensualidad, instructor_id, id]
      );

      await Log.create({
        userId: request.user.id,
        action: 'COURSE_UPDATED',
        details: { courseId: id, name },
        ipAddress: request.ip
      });

      return { message: 'Curso actualizado correctamente' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al actualizar curso' });
    }
  });

  // 7. CRUD Cursos: Eliminar curso
  fastify.delete('/courses/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const [rows] = await mysqlPool.query('DELETE FROM courses WHERE id = ?', [id]);
      if (rows.affectedRows === 0) {
        return reply.code(404).send({ error: 'Curso no encontrado' });
      }

      await Log.create({
        userId: request.user.id,
        action: 'COURSE_DELETED',
        details: { courseId: id },
        ipAddress: request.ip
      });

      return { message: 'Curso eliminado correctamente' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al eliminar curso' });
    }
  });

  // 8. Crear Instructor y asignarlo directamente a un curso
  fastify.post('/instructors', async (request, reply) => {
    const { email, password, name, phone, address, courseId } = request.body || {};

    if (!email || !password || !name) {
      return reply.code(400).send({ error: 'Faltan campos obligatorios: email, password, name' });
    }

    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();

      // a. Hashear contraseña
      const hash = crypto.createHash('sha256').update(password).digest('hex');

      // b. Insertar instructor
      const [instResult] = await connection.query(
        'INSERT INTO users (email, password_hash, role, name, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hash, 'instructor', name, phone || null, address || null]
      );

      const instructorId = instResult.insertId;

      // c. Si se especificó curso, asignarlo
      if (courseId) {
        await connection.query(
          'UPDATE courses SET instructor_id = ? WHERE id = ?',
          [instructorId, courseId]
        );
      }

      await connection.commit();

      await Log.create({
        userId: request.user.id,
        action: 'INSTRUCTOR_CREATED',
        details: { instructorEmail: email, courseId },
        ipAddress: request.ip
      });

      return { message: 'Instructor creado y asignado con éxito' };
    } catch (err) {
      await connection.rollback();
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al crear instructor' });
    } finally {
      connection.release();
    }
  });

  // 9. Ver lista de alumnos matriculados por curso con solvencia
  fastify.get('/students', async (request, reply) => {
    try {
      const [rows] = await mysqlPool.query(
        `SELECT u.id as student_id, u.email, u.name, u.phone, c.name as course_name, c.id as course_id, e.id as enrollment_id, e.solvente 
         FROM enrollments e 
         JOIN users u ON e.student_id = u.id 
         JOIN courses c ON e.course_id = c.id
         ORDER BY c.name, u.name`
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al obtener alumnos' });
    }
  });

  // 10. Obtener lista de profesores registrados con sus datos completos y cursos asignados
  fastify.get('/instructors', async (request, reply) => {
    try {
      const [rows] = await mysqlPool.query(
        `SELECT u.id, u.name, u.email, u.phone, u.address, c.name as course_name 
         FROM users u 
         LEFT JOIN courses c ON c.instructor_id = u.id 
         WHERE u.role = "instructor" 
         ORDER BY u.name`
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al obtener instructores' });
    }
  });

  // 11. Obtener todas las boletas de pago recibidas con el id del estudiante
  fastify.get('/payments', async (request, reply) => {
    try {
      const [rows] = await mysqlPool.query(
        `SELECT p.id, p.student_id, p.amount, p.payment_date, p.receipt_url, p.type, u.name as student_name, u.email as student_email 
         FROM payments p 
         JOIN users u ON p.student_id = u.id 
         ORDER BY p.payment_date DESC`
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al obtener listado de pagos' });
    }
  });

  // 12. Eliminar instructor
  fastify.delete('/instructors/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const [rows] = await mysqlPool.query('DELETE FROM users WHERE id = ? AND role = "instructor"', [id]);
      if (rows.affectedRows === 0) {
        return reply.code(404).send({ error: 'Instructor no encontrado' });
      }

      await Log.create({
        userId: String(request.user.id),
        action: 'INSTRUCTOR_DELETED',
        details: { instructorId: id },
        ipAddress: request.ip
      });

      return { message: 'Instructor eliminado correctamente' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al eliminar instructor' });
    }
  });

  // 13. Eliminar estudiante
  fastify.delete('/students/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const [rows] = await mysqlPool.query('DELETE FROM users WHERE id = ? AND role = "student"', [id]);
      if (rows.affectedRows === 0) {
        return reply.code(404).send({ error: 'Estudiante no encontrado' });
      }

      await Log.create({
        userId: String(request.user.id),
        action: 'STUDENT_DELETED',
        details: { studentId: id },
        ipAddress: request.ip
      });

      return { message: 'Estudiante eliminado correctamente' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al eliminar estudiante' });
    }
  });

  // 14. Actualizar estado de solvencia de una matrícula
  fastify.put('/enrollments/:enrollmentId/solvency', async (request, reply) => {
    const { enrollmentId } = request.params;
    const { solvente } = request.body || {}; // 0 o 1
    
    if (solvente === undefined || (solvente !== 0 && solvente !== 1)) {
      return reply.code(400).send({ error: 'El valor de solvente debe ser 0 (no solvente) o 1 (solvente)' });
    }

    try {
      const [rows] = await mysqlPool.query(
        'UPDATE enrollments SET solvente = ? WHERE id = ?',
        [solvente, enrollmentId]
      );
      if (rows.affectedRows === 0) {
        return reply.code(404).send({ error: 'Matrícula no encontrada' });
      }

      await Log.create({
        userId: String(request.user.id),
        action: 'STUDENT_SOLVENCY_UPDATED',
        details: { enrollmentId, solvente },
        ipAddress: request.ip
      });

      return { message: `Estado de solvencia actualizado con éxito` };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al actualizar solvencia' });
    }
  });

  // 15. Marcar como solvente a un estudiante desde su registro de pago
  fastify.post('/students/:studentId/mark-solvent-from-payment', async (request, reply) => {
    const { studentId } = request.params;
    try {
      const [rows] = await mysqlPool.query(
        'UPDATE enrollments SET solvente = 1 WHERE student_id = ?',
        [studentId]
      );
      if (rows.affectedRows === 0) {
        return reply.code(404).send({ error: 'No se encontró matrícula activa para este estudiante' });
      }

      await Log.create({
        userId: String(request.user.id),
        action: 'STUDENT_SOLVENCY_MARKED_FROM_PAYMENT',
        details: { studentId },
        ipAddress: request.ip
      });

      return { message: 'Estudiante marcado como solvente con éxito' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al marcar como solvente' });
    }
  });

  // 16. Obtener mensajes de contacto recibidos
  fastify.get('/contact-messages', async (request, reply) => {
    try {
      const [rows] = await mysqlPool.query(
        'SELECT * FROM contact_messages ORDER BY created_at DESC'
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al obtener mensajes de contacto' });
    }
  });

  // 17. Actualizar configuraciones de la institución (Soporta multipart)
  fastify.put('/settings', async (request, reply) => {
    if (!request.isMultipart()) {
      return reply.code(400).send({ error: 'Formato inválido. Debe ser multipart' });
    }

    try {
      const parts = request.parts();
      const textSettings = {};

      for await (const part of parts) {
        if (part.file) {
          const buffer = await part.toBuffer();
          if (buffer && buffer.length > 0) {
            if (buffer.length > 10 * 1024 * 1024) {
              return reply.code(400).send({ error: `La foto de fondo para ${part.fieldname} excede los 10 MB` });
            }
            const allowedImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedImageMimes.includes(part.mimetype)) {
              return reply.code(400).send({ error: 'Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)' });
            }
            const fileUrl = await uploadFile('presentation', part.filename, buffer, part.mimetype);
            
            let settingKey = 'hero_background_url';
            if (part.fieldname === 'mision_bg') settingKey = 'mision_bg_url';
            if (part.fieldname === 'vision_bg') settingKey = 'vision_bg_url';

            await mysqlPool.query(
              'INSERT INTO institution_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
              [settingKey, fileUrl, fileUrl]
            );
          }
        } else {
          textSettings[part.fieldname] = part.value;
        }
      }

      // Guardar configuraciones de texto
      for (const [key, val] of Object.entries(textSettings)) {
        await mysqlPool.query(
          'INSERT INTO institution_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, val, val]
        );
      }

      await Log.create({
        userId: String(request.user.id),
        action: 'INSTITUTION_SETTINGS_UPDATED',
        details: { updatedKeys: Object.keys(textSettings) },
        ipAddress: request.ip
      });

      return { message: 'Configuraciones de la institución actualizadas correctamente' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al actualizar configuraciones' });
    }
  });

  // 18. Agregar imagen de fondo a la lista del Hero (Soporta multipart)
  fastify.post('/settings/background-images', async (request, reply) => {
    if (!request.isMultipart()) {
      return reply.code(400).send({ error: 'La petición debe ser multipart (form-data)' });
    }

    try {
      const parts = request.parts();
      let fileBuffer = null;
      let filename = '';
      let fileMime = '';

      for await (const part of parts) {
        if (part.file) {
          fileBuffer = await part.toBuffer();
          filename = part.filename;
          fileMime = part.mimetype;
        }
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return reply.code(400).send({ error: 'No se ha subido ningún archivo' });
      }

      if (fileBuffer.length > 5 * 1024 * 1024) {
        return reply.code(400).send({ error: 'La imagen excede el tamaño máximo de 5 MB' });
      }

      const allowedImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedImageMimes.includes(fileMime)) {
        return reply.code(400).send({ error: 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP)' });
      }

      const fileUrl = await uploadFile('presentation', filename, fileBuffer, fileMime);

      // Obtener el array actual de imágenes
      const [rows] = await mysqlPool.query(
        "SELECT setting_value FROM institution_settings WHERE setting_key = 'hero_backgrounds_list'"
      );

      let list = [];
      if (rows.length > 0 && rows[0].setting_value) {
        try {
          list = JSON.parse(rows[0].setting_value);
          if (!Array.isArray(list)) list = [];
        } catch (e) {
          list = [];
        }
      }

      // Si antes usaban el 'hero_background_url' anterior, lo añadimos para no perderlo
      if (list.length === 0) {
        const [oldUrlRow] = await mysqlPool.query(
          "SELECT setting_value FROM institution_settings WHERE setting_key = 'hero_background_url'"
        );
        if (oldUrlRow.length > 0 && oldUrlRow[0].setting_value) {
          list.push(oldUrlRow[0].setting_value);
        }
      }

      list.push(fileUrl);
      const jsonStr = JSON.stringify(list);

      await mysqlPool.query(
        "INSERT INTO institution_settings (setting_key, setting_value) VALUES ('hero_backgrounds_list', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [jsonStr, jsonStr]
      );

      // También actualizamos 'hero_background_url' al último cargado para compatibilidad
      await mysqlPool.query(
        "INSERT INTO institution_settings (setting_key, setting_value) VALUES ('hero_background_url', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [fileUrl, fileUrl]
      );

      await Log.create({
        userId: String(request.user.id),
        action: 'HERO_BACKGROUND_ADDED',
        details: { fileUrl },
        ipAddress: request.ip
      });

      return { message: 'Imagen de fondo agregada con éxito', fileUrl };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al agregar imagen de fondo' });
    }
  });

  // 19. Eliminar una imagen de fondo de la lista
  fastify.delete('/settings/background-images', async (request, reply) => {
    const { url } = request.body || {};
    if (!url) {
      return reply.code(400).send({ error: 'La URL de la imagen a eliminar es obligatoria' });
    }

    try {
      const [rows] = await mysqlPool.query(
        "SELECT setting_value FROM institution_settings WHERE setting_key = 'hero_backgrounds_list'"
      );

      if (rows.length === 0 || !rows[0].setting_value) {
        return reply.code(404).send({ error: 'No hay imágenes de fondo registradas' });
      }

      let list = [];
      try {
        list = JSON.parse(rows[0].setting_value);
        if (!Array.isArray(list)) list = [];
      } catch (e) {
        list = [];
      }

      const filteredList = list.filter(item => item !== url);
      const jsonStr = JSON.stringify(filteredList);

      await mysqlPool.query(
        "UPDATE institution_settings SET setting_value = ? WHERE setting_key = 'hero_backgrounds_list'",
        [jsonStr]
      );

      // Si eliminamos la actual 'hero_background_url', actualizamos con la primera de la lista
      const [currentUrlRow] = await mysqlPool.query(
        "SELECT setting_value FROM institution_settings WHERE setting_key = 'hero_background_url'"
      );
      if (currentUrlRow.length > 0 && currentUrlRow[0].setting_value === url) {
        const nextUrl = filteredList.length > 0 ? filteredList[0] : null;
        await mysqlPool.query(
          "UPDATE institution_settings SET setting_value = ? WHERE setting_key = 'hero_background_url'",
          [nextUrl]
        );
      }

      await Log.create({
        userId: String(request.user.id),
        action: 'HERO_BACKGROUND_REMOVED',
        details: { url },
        ipAddress: request.ip
      });

      return { message: 'Imagen de fondo eliminada con éxito' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al eliminar imagen de fondo' });
    }
  });

};
