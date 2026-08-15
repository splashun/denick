const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./index.js');

async function request(app, path, options = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, async () => {
      const { port } = server.address();
      try {
        const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
        const text = await response.text();
        const body = text ? JSON.parse(text) : null;
        resolve({ status: response.status, body });
      } catch (error) {
        reject(error);
      } finally {
        server.close();
      }
    });

    server.on('error', reject);
  });
}

test('GET /denick/:nick uses a parameterized SQL query', async () => {
  const calls = [];
  const app = createApp({
    query: async (sql, params) => {
      calls.push({ sql, params });
      return {
        rows: [{ real_name: 'Steve Rogers', real_uuid: 42 }],
      };
    },
  });

  const response = await request(app, '/denick/Steve');

  assert.equal(response.status, 200);
  assert.deepEqual(calls[0].params, ['Steve']);
  assert.match(calls[0].sql, /\$1/);
  assert.deepEqual(response.body, {
    nick: 'Steve',
    realName: 'Steve Rogers',
    realUuid: 42,
  });
});

test('GET /health reports service status', async () => {
  const app = createApp({
    query: async () => ({ rows: [{ '?column?': 1 }] }),
  });

  const response = await request(app, '/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});
