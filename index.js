const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db.js');
const cache = require('./cache.js');
const listener = require('./listener.js');

const DEFAULT_PORT = Number(process.env.PORT) || 8080;
const USAGE_MESSAGE = { message: 'Usage: /denick?nick={nick}' };

// 1 to 16 chars; letters, numbers, underscores
const mcNameRegex = /^[a-zA-Z0-9_]{1,16}$/;

function createApp(database = pool) {
    const app = express();

    app.use(helmet());
    app.use(express.json({ limit: '1mb' }));
    // Rate limit: 100 requests per 60 seconds (1 minute)
    app.use(
        rateLimit({
            windowMs: 60 * 1000,
            max: 100,
            standardHeaders: true,
            legacyHeaders: false,
        })
    );

    app.get('/', (req, res) => {
        res.status(200).json({ message: 'the db will have entries at some point lol', meantimeEntertainment: 'https://www.coolmathgames.com/0-papas-freezeria' });
    });

    app.get('/health', async (req, res) => {
        try {
            await database.query('SELECT 1');
            return res.status(200).json({ status: 'ok' });
        } catch (error) {
            console.error('Health check failed:', error);
            return res.status(503).json({ status: 'unavailable' });
        }
    });

    app.get('/denick', async (req, res) => {
        const nick = req.query.nick?.trim();

        if (!nick) {
            return res.status(200).json(USAGE_MESSAGE);
        }

        if (!mcNameRegex.test(nick)) {
            return res.status(400).json({ error: 'Invalid nickname format' });
        }

        // Serve from cache when possible
        const cached = cache.get(nick);
        if (cached) {
            return res.status(200).json({
                nick,
                realName: cached.realName,
                realUuid: cached.realUuid,
            });
        }

        try {
            console.log(`Searching for nick: ${nick}`);
            const result = await database.query(
                'SELECT real_name, real_uuid FROM nicks WHERE nickname = $1',
                [nick]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Nickname not found' });
            }

            const { real_name, real_uuid } = result.rows[0];
            cache.set(nick, { realName: real_name, realUuid: real_uuid });

            return res.status(200).json({
                nick,
                realName: real_name,
                realUuid: real_uuid,
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Database error' });
        }
    });
    
    app.use((req, res) => {
        res.status(404).json({ error: 'Resource not found' });
    });

    return app;
}

if (require.main === module) {
    const app = createApp();
    const server = app.listen(DEFAULT_PORT, async () => {
        console.log(`diddy http://localhost:${DEFAULT_PORT}`);
        await listener.init();
    });

    const shutdown = async () => {
        console.log('Shutting down gracefully...');
        server.close(async () => {
            await listener.close();
            if (pool && typeof pool.end === 'function') {
                await pool.end();
            }
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

module.exports = { createApp };