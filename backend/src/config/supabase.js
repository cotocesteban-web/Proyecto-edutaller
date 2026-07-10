import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Limpiar sufijo /rest/v1/ si existe para evitar que falle el cliente SDK
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');
}

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log(' Cliente de Supabase configurado en:', supabaseUrl);
} else {
  console.warn(' Credenciales de Supabase no encontradas (.env). Se activará la simulación de almacenamiento local.');
}

/**
 * Sube un archivo a Supabase Storage o realiza un fallback a almacenamiento local en desarrollo.
 * @param {string} folder - Carpeta destino ('payments' o 'materials')
 * @param {string} filename - Nombre único para el archivo
 * @param {Buffer} fileBuffer - Contenido del archivo en Buffer
 * @param {string} mimeType - Tipo MIME del archivo (ej. application/pdf)
 * @returns {Promise<string>} URL pública para acceder al archivo
 */
export const uploadFile = async (folder, filename, fileBuffer, mimeType) => {
  const filePath = `${folder}/${Date.now()}_${filename}`;

  // Si Supabase está configurado, subir de forma real
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('edutaller-bucket')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (error) throw error;

      // Obtener la URL pública
      const { data: urlData } = supabase.storage
        .from('edutaller-bucket')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error(' Error subiendo a Supabase Storage:', err);
      console.warn(' Reintentando con almacenamiento local...');
    }
  }

  // Fallback: Guardar localmente
  try {
    // Definimos una carpeta 'uploads' dentro de backend
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', folder);
    await fs.mkdir(uploadsDir, { recursive: true });

    const uniqueFilename = `${Date.now()}_${filename}`;
    const localPath = path.join(uploadsDir, uniqueFilename);
    await fs.writeFile(localPath, fileBuffer);

    console.log(` Archivo guardado localmente en: ${localPath}`);
    
    // Devolvemos la URL relativa para evitar problemas de enrutamiento y puertos
    return `/uploads/${folder}/${uniqueFilename}`;
  } catch (err) {
    console.error(' Error en el almacenamiento local:', err);
    throw new Error('No se pudo guardar el archivo en ningún medio de almacenamiento.');
  }
};
