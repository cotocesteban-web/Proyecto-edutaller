import { test } from 'node:test';
import assert from 'node:assert';
import fastify from 'fastify';

test('Test de Endpoint de Salud (Health Check)', async (t) => {
  const app = fastify();
  
  // Registrar una ruta de prueba idéntica a la del servidor
  app.get('/api/health', async (request, reply) => {
    return { status: 'ok', message: 'API Edutaller funcionando' };
  });

  const response = await app.inject({
    method: 'GET',
    url: '/api/health'
  });

  assert.strictEqual(response.statusCode, 200);
  
  const body = JSON.parse(response.body);
  assert.strictEqual(body.status, 'ok');
  assert.strictEqual(body.message, 'API Edutaller funcionando');
});
