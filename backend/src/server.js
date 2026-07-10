import fastify from 'fastify';
import dotenv from 'dotenv';
import { connectDBs } from './config/db.js';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { instructorRoutes } from './routes/instructor.js';
import { studentRoutes } from './routes/student.js';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = fastify({ logger: true });

// Registrar plugins de soporte
app.register(fastifyCors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});
app.register(fastifyMultipart, {
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max file size limit
  }
});

// Registro de rutas
app.register(authRoutes, { prefix: '/api/auth' });
app.register(adminRoutes, { prefix: '/api/admin' });
app.register(instructorRoutes, { prefix: '/api/instructor' });
app.register(studentRoutes, { prefix: '/api/student' });

// Ruta para servir archivos subidos localmente (fallback de Supabase)
app.get('/uploads/:folder/:filename', async (request, reply) => {
  const { folder, filename } = request.params;
  const filePath = path.join(__dirname, '..', 'uploads', folder, filename);
  try {
    const buffer = await fs.readFile(filePath);
    
    // Detectar Mime-type básico
    let mime = 'application/octet-stream';
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.endsWith('.pdf')) mime = 'application/pdf';
    else if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg') || lowerFilename.endsWith('.jfif')) mime = 'image/jpeg';
    else if (lowerFilename.endsWith('.png')) mime = 'image/png';
    else if (lowerFilename.endsWith('.gif')) mime = 'image/gif';
    else if (lowerFilename.endsWith('.webp')) mime = 'image/webp';
    else if (lowerFilename.endsWith('.svg')) mime = 'image/svg+xml';
    else if (lowerFilename.endsWith('.bmp')) mime = 'image/bmp';
    else if (lowerFilename.endsWith('.ico')) mime = 'image/x-icon';
    
    return reply.type(mime).send(buffer);
  } catch (err) {
    return reply.code(404).send({ error: 'Archivo no encontrado en almacenamiento local' });
  }
});

// Ruta de prueba
app.get('/api/health', async (request, reply) => {
  return { status: 'ok', message: 'API Edutaller funcionando' };
});

const start = async () => {
  try {
    // Intentamos conectar a las bases de datos
    await connectDBs();
    
    await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    app.log.info(`Servidor escuchando en el puerto ${app.server.address().port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
