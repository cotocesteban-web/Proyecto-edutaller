import crypto from 'node:crypto';

// Clave secreta para firmar tokens. En producción vendría de .env.
const SECRET = process.env.JWT_SECRET || 'secret-edutaller-key-123456';

export const signToken = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  // Agregar expiración (por ejemplo, en 24 horas)
  const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
  const fullPayload = { ...payload, exp };
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${payloadB64}`)
    .digest('base64url');
    
  return `${header}.${payloadB64}.${signature}`;
};

export const verifyToken = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [header, payload, signature] = parts;
  
  // Verificar firma
  const expectedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
    
  if (signature !== expectedSignature) {
    return null; // Firma inválida
  }
  
  try {
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    
    // Verificar expiración
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expirado
    }
    
    return decodedPayload;
  } catch (err) {
    return null;
  }
};
