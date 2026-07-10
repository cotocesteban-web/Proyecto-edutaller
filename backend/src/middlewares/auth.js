import { verifyToken } from '../utils/token.js';

export const verifyJWT = async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Token no proporcionado o formato inválido' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return reply.code(401).send({ error: 'Token inválido o expirado' });
  }

  request.user = decoded; // Adjuntar datos de usuario a la petición
};

export const requireAdmin = async (request, reply) => {
  await verifyJWT(request, reply);
  if (request.user.role !== 'admin') {
    return reply.code(403).send({ error: 'Acceso denegado. Se requieren permisos de Administrador.' });
  }
};

export const requireInstructor = async (request, reply) => {
  await verifyJWT(request, reply);
  if (request.user.role !== 'instructor') {
    return reply.code(403).send({ error: 'Acceso denegado. Se requieren permisos de Instructor.' });
  }
};

export const requireStudent = async (request, reply) => {
  await verifyJWT(request, reply);
  if (request.user.role !== 'student') {
    return reply.code(403).send({ error: 'Acceso denegado. Se requieren permisos de Estudiante.' });
  }
};
