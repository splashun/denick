const { Client } = require('pg');
const cache = require('./cache.js');

const INITIAL_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

let client = null;
let retryMs = INITIAL_RETRY_MS;
let closing = false;

function createClient() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  return c;
}

async function connect() {
  if (closing) return;

  client = createClient();

  client.on('notification', (msg) => {
    if (msg.channel === 'nick_updates' && msg.payload) {
      cache.delete(msg.payload);
      console.log(`Cache invalidated: ${msg.payload}`);
    }
  });

  client.on('error', (err) => {
    console.error('Listener client error:', err.message);
    scheduleReconnect();
  });

  try {
    await client.connect();

    // Keep the TCP socket alive so Render doesn't drop the idle connection
    const stream = client.connection?.stream;
    if (stream && typeof stream.setKeepAlive === 'function') {
      stream.setKeepAlive(true, 60_000);
    }

    await client.query('LISTEN nick_updates');
    retryMs = INITIAL_RETRY_MS;
    console.log('Listener connected – LISTEN nick_updates');
  } catch (err) {
    console.error('Listener connection failed:', err.message);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (closing) return;

  console.log(`Reconnecting listener in ${retryMs}ms...`);
  setTimeout(() => connect(), retryMs);
  retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
}

async function init() {
  closing = false;
  await connect();
}

async function close() {
  closing = true;
  if (client) {
    try {
      await client.end();
    } catch {
      // already closed – ignore
    }
    client = null;
  }
}

module.exports = { init, close };
