import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let mysqlPool = null;

export const connectDBs = async () => {
  // Conexión MongoDB
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log(' Conectado a MongoDB');
    } else {
      console.warn('No se encontró MONGO_URI. Omitiendo conexión a MongoDB por ahora.');
    }
  } catch (err) {
    console.error(' Error conectando a MongoDB:', err);
  }

  // Conexión MySQL y creación de esquema
  try {
    if (process.env.DB_HOST) {
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
      });

      console.log(' Conectado a MySQL Pool');

      // Leer y ejecutar schema.sql
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = await fs.readFile(schemaPath, 'utf-8');
      
      await mysqlPool.query(schemaSql);
      console.log(' Estructura y datos semilla de MySQL listos');

      // Parche dinámico para agregar columnas de entregas a grades sin forzar drop de DB
      try {
        const addCol = async (col, type) => {
          try {
            await mysqlPool.query(`ALTER TABLE grades ADD COLUMN ${col} ${type}`);
            console.log(` Columna agregada a grades: ${col}`);
          } catch (err) {
            // Ignorar error si la columna ya existe (código de error 1060)
            if (err.errno !== 1060) console.error(`Error agregando columna ${col}:`, err);
          }
        };
        await addCol('submission_text', 'TEXT');
        await addCol('submission_file_url', 'VARCHAR(500)');
        await addCol('submitted_at', 'TIMESTAMP NULL DEFAULT NULL');
      } catch (patchErr) {
        console.error(' Error al aplicar parche de base de datos:', patchErr);
      }

      // Parche dinámico para agregar columnas a la tabla courses
      try {
        const addColToCourses = async (col, type, defVal = 'NULL') => {
          try {
            await mysqlPool.query(`ALTER TABLE courses ADD COLUMN ${col} ${type} DEFAULT ${defVal}`);
            console.log(` Columna agregada a courses: ${col}`);
          } catch (err) {
            if (err.errno !== 1060) console.error(`Error agregando columna ${col} a courses:`, err);
          }
        };
        await addColToCourses('schedules', 'VARCHAR(255)', 'NULL');
        await addColToCourses('days', 'VARCHAR(255)', 'NULL');
        await addColToCourses('cupo_maximo', 'INT', '10');
        await addColToCourses('costo_inscripcion', 'DECIMAL(10,2)', '0.00');
        await addColToCourses('costo_mensualidad', 'DECIMAL(10,2)', '0.00');
      } catch (patchErr) {
        console.error(' Error al aplicar parche de courses:', patchErr);
      }

      // Parche dinámico para agregar la columna solvente a la tabla enrollments
      try {
        await mysqlPool.query(`ALTER TABLE enrollments ADD COLUMN solvente TINYINT(1) DEFAULT 0`);
        console.log(' Columna solvente agregada a enrollments');
      } catch (err) {
        if (err.errno !== 1060) {
          console.error(' Error agregando columna solvente a enrollments:', err);
        }
      }

      // Parche para crear la tabla de configuraciones de la institución y sembrar datos por defecto
      try {
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS institution_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT NULL
          )
        `);
        console.log(' Tabla institution_settings configurada');

        const seedSetting = async (key, val) => {
          try {
            await mysqlPool.query(
              'INSERT IGNORE INTO institution_settings (setting_key, setting_value) VALUES (?, ?)',
              [key, val]
            );
          } catch (e) {
            console.error(`Error sembrando setting ${key}:`, e);
          }
        };

        await seedSetting('hero_background_url', '/uploads/presentation/default_bg.jpg');
        await seedSetting('institution_name', 'Academia Técnica Edutaller');
        await seedSetting('presentation_text', 'Aprende habilidades técnicas con profesores expertos en talleres totalmente equipados. Tu camino hacia el éxito profesional comienza aquí.');
        await seedSetting('contact_email', 'contacto@edutaller.edu.gt');
        await seedSetting('contact_phone', '+502 5555 1234');
        await seedSetting('contact_address', 'Calzada Roosevelt 12-34, Zona 11, Ciudad de Guatemala');
        await seedSetting('mision_text', 'Brindar formación académica de la más alta calidad en áreas industriales y técnicas, potenciando las capacidades prácticas y teóricas de nuestros estudiantes para que respondan eficientemente a las demandas del sector productivo.');
        await seedSetting('vision_text', 'Ser la academia de capacitación técnica de referencia nacional, reconocida por la excelencia de nuestros instructores, la modernidad de nuestros métodos y el éxito profesional de nuestros egresados.');
        await seedSetting('mision_bg_url', '');
        await seedSetting('vision_bg_url', '');
      } catch (settingsErr) {
        console.error(' Error al configurar institution_settings:', settingsErr);
      }

      // Sembrar datos iniciales (usuarios y cursos) solo si no se ha hecho antes
      try {
        const [rows] = await mysqlPool.query(
          "SELECT setting_value FROM institution_settings WHERE setting_key = 'seeds_initialized'"
        );
        if (rows.length === 0 || rows[0].setting_value !== 'true') {
          console.log(' Sembrando datos iniciales (usuarios y cursos)...');

          const seedUsers = [
            [1, 'admin1@gmail.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'admin', 'Administrador Uno'],
            [2, 'admin2@gmail.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'admin', 'Administrador Dos'],
            [3, 'profesorelectrico@gmail.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'instructor', 'Profesor Electricidad'],
            [4, 'profesorcarpintero@gmail.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'instructor', 'Profesor Carpintería'],
            [5, 'profesormecanico@gmail.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'instructor', 'Profesor Mecánica'],
            [6, 'estudiante1@gmail.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'student', 'Estudiante Uno']
          ];

          for (const user of seedUsers) {
            await mysqlPool.query(
              'INSERT IGNORE INTO users (id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?)',
              user
            );
          }

          const seedCourses = [
            [1, 'Electricidad', 'Curso básico e intermedio de electricidad residencial.', 3],
            [2, 'Carpintería', 'Aprende el manejo de madera, cortes y ensambles.', 4],
            [3, 'Mecánica Automotriz', 'Introducción al mantenimiento y reparación de motores.', 5],
            [4, 'Soldadura Eléctrica', 'Técnicas de soldadura de arco y seguridad.', null]
          ];

          for (const course of seedCourses) {
            await mysqlPool.query(
              'INSERT IGNORE INTO courses (id, name, description, instructor_id) VALUES (?, ?, ?, ?)',
              course
            );
          }

          await mysqlPool.query(
            "INSERT INTO institution_settings (setting_key, setting_value) VALUES ('seeds_initialized', 'true') ON DUPLICATE KEY UPDATE setting_value = 'true'"
          );
          console.log(' Datos semilla inicializados con éxito');
        } else {
          console.log(' Semillas de usuarios y cursos ya inicializadas anteriormente. Omitiendo.');
        }
      } catch (seedsErr) {
        console.error(' Error al sembrar datos iniciales:', seedsErr);
      }

      // Parche para crear la tabla de mensajes de contacto
      try {
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS contact_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log(' Tabla contact_messages configurada');
      } catch (msgErr) {
        console.error(' Error al configurar contact_messages:', msgErr);
      }
    } else {
      console.warn(' No se encontraron credenciales MySQL (DB_HOST). Omitiendo conexión a MySQL por ahora.');
    }
  } catch (err) {
    console.error(' Error configurando MySQL:', err);
  }
};
