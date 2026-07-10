import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { mysqlPool } from '../config/db.js';
import { Log } from '../models/Log.js';
import { signToken } from '../utils/token.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Función helper para verificar tokens de Google
const verifyGoogleToken = async (idToken) => {
  // Para pruebas rápidas en local
  if (idToken === 'mock-google-token') {
    return {
      email: 'mockuser@gmail.com',
      name: 'Usuario Prueba Google',
      email_verified: true
    };
  }
  
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (err) {
    console.error('Error verificando token de Google:', err);
    return null;
  }
};

export const authRoutes = async (fastify) => {
  
  // 1. Endpoint: Login clásico con credenciales
  fastify.post('/login', async (request, reply) => {
    const { email, password, role } = request.body || {};
    
    if (!email || !password || !role) {
      return reply.code(400).send({ error: 'Faltan campos obligatorios: email, password, role' });
    }
    
    try {
      // 1. Hashear contraseña enviada (SHA-256)
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      
      // 2. Buscar en MySQL
      const [rows] = await mysqlPool.query(
        'SELECT id, email, role, name, phone, address FROM users WHERE email = ? AND password_hash = ? AND role = ?',
        [email, hash, role]
      );
      
      if (rows.length === 0) {
        // Registrar intento fallido
        await Log.create({
          userId: email,
          action: 'LOGIN_FAILED',
          details: { role },
          ipAddress: request.ip
        });
        return reply.code(401).send({ error: 'Credenciales inválidas o rol incorrecto' });
      }
      
      const user = rows[0];
      
      // 3. Generar JWT
      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // 4. Guardar Log en MongoDB
      await Log.create({
        userId: String(user.id),
        action: 'LOGIN_SUCCESS',
        details: { role: user.role },
        ipAddress: request.ip
      });
      
      return {
        message: 'Login exitoso',
        token,
        user
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error interno del servidor' });
    }
  });

  // 2. Endpoint: Solicitud de Inscripción (Google OAuth + Formulario)
  fastify.post('/register-request', async (request, reply) => {
    const { idToken, phone, address, courseId } = request.body || {};
    
    if (!idToken || !phone || !address || !courseId) {
      return reply.code(400).send({ error: 'Faltan campos obligatorios: idToken, phone, address, courseId' });
    }
    
    try {
      // 1. Validar Token de Google
      const payload = await verifyGoogleToken(idToken);
      if (!payload || !payload.email_verified) {
        return reply.code(400).send({ error: 'Token de Google inválido o correo no verificado' });
      }
      
      const userEmail = payload.email;
      const userName = payload.name;
      
      // 1.5. Verificar que el rol no sea administrativo o docente
      const [roleRows] = await mysqlPool.query(
        'SELECT role FROM users WHERE email = ?',
        [userEmail]
      );
      if (roleRows.length > 0 && (roleRows[0].role === 'admin' || roleRows[0].role === 'instructor')) {
        return reply.code(400).send({ error: 'No se permiten solicitudes de inscripción para cuentas de administradores o profesores' });
      }
      
      // 2. Verificar si ya existe el curso
      const [courseRows] = await mysqlPool.query('SELECT id FROM courses WHERE id = ?', [courseId]);
      if (courseRows.length === 0) {
        return reply.code(404).send({ error: 'El curso seleccionado no existe' });
      }
      
      // 3. Verificar si ya tiene una solicitud pendiente o aprobada para el mismo curso
      const [existingRequest] = await mysqlPool.query(
        "SELECT id, status FROM enrollment_requests WHERE user_email = ? AND course_id = ? AND status IN ('pending', 'approved')",
        [userEmail, courseId]
      );
      
      if (existingRequest.length > 0) {
        return reply.code(400).send({ 
          error: `Ya tienes una solicitud de inscripción para este curso con estado: ${existingRequest[0].status}` 
        });
      }

      // Eliminar solicitudes anteriormente rechazadas para este mismo curso y usuario para evitar duplicar en la lista
      await mysqlPool.query(
        "DELETE FROM enrollment_requests WHERE user_email = ? AND course_id = ? AND status = 'rejected'",
        [userEmail, courseId]
      );
      
      // 4. Crear la solicitud en MySQL
      await mysqlPool.query(
        'INSERT INTO enrollment_requests (user_email, name, phone, address, course_id, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userEmail, userName, phone, address, courseId, 'pending']
      );
      
      // 5. Registrar log de actividad en MongoDB
      await Log.create({
        userId: userEmail,
        action: 'ENROLLMENT_REQUEST_CREATED',
        details: { courseId, email: userEmail },
        ipAddress: request.ip
      });
      
      return {
        message: 'Solicitud de inscripción creada con éxito. Pendiente de aprobación por el administrador.'
      };
      
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error interno del servidor al procesar la solicitud' });
    }
  });

  // 3. Endpoint: Obtener el Google Client ID para el frontend
  fastify.get('/google-client-id', async (request, reply) => {
    return { googleClientId: process.env.GOOGLE_CLIENT_ID };
  });

  // 4. Endpoint: Obtener listado de cursos para el catálogo público con disponibilidad calculada y costos
  fastify.get('/courses', async (request, reply) => {
    try {
      const [rows] = await mysqlPool.query(
        `SELECT c.id, c.name, c.description, c.image_url, c.schedules, c.days, c.cupo_maximo,
                c.costo_inscripcion, c.costo_mensualidad,
                (c.cupo_maximo - COALESCE(e.enrolled_count, 0)) as cupo_disponible
         FROM courses c
         LEFT JOIN (
           SELECT course_id, COUNT(*) as enrolled_count 
           FROM enrollments 
           GROUP BY course_id
         ) e ON c.id = e.course_id`
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al obtener listado de cursos público' });
    }
  });

  // 5. Endpoint: Obtener configuraciones públicas de la institución
  fastify.get('/settings', async (request, reply) => {
    try {
      const [rows] = await mysqlPool.query(
        'SELECT setting_key, setting_value FROM institution_settings'
      );
      const settings = {};
      rows.forEach(r => {
        settings[r.setting_key] = r.setting_value;
      });
      return settings;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al obtener configuraciones' });
    }
  });

  // 6. Endpoint: Recibir mensaje de contacto de la web pública
  fastify.post('/contact', async (request, reply) => {
    const { name, email, phone, message } = request.body || {};
    if (!name || !email || !message) {
      return reply.code(400).send({ error: 'Nombre, correo y mensaje son obligatorios' });
    }

    try {
      await mysqlPool.query(
        'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
        [name, email, phone || null, message]
      );
      return { message: 'Mensaje enviado correctamente. Nos pondremos en contacto pronto.' };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error al procesar mensaje de contacto' });
    }
  });

};
