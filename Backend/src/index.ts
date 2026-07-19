import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { config } from './config';
import { pool } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { setupCronJobs, shutdownJobs } from './jobs/cronJobs';

// Import routes
import { authRoutes } from './routes/authRoutes';
import { attendanceRoutes } from './routes/attendanceRoutes';
import { titheRoutes } from './routes/titheRoutes';
import { sermonRoutes } from './routes/sermonRoutes';
import { cellGroupRoutes } from './routes/cellGroupRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { eventRoutes } from './routes/eventRoutes';
import { bookRoutes } from './routes/bookRoutes';
import { projectRoutes } from './routes/projectRoutes';
import { programRoutes } from './routes/programRoutes';
import { weeklyActivityRoutes } from './routes/weeklyActivityRoutes';
import { givingRoutes } from './routes/givingRoutes';
import { satelliteChurchRoutes } from './routes/satelliteChurchRoutes';

const fastify = Fastify({
  logger: {
    level: config.server.nodeEnv === 'production' ? 'info' : 'debug',
  },
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(fastifyCors, {
    origin: config.cors.origin,
    credentials: true,
  });

  // JWT
  await fastify.register(fastifyJwt, {
    secret: config.jwt.secret,
  });

  // Multipart (file uploads)
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: config.upload.maxFileSize,
    },
  });

  // Rate limiting
  await fastify.register(fastifyRateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
  });

  // Static files
  await fastify.register(fastifyStatic, {
    root: config.upload.dir,
    prefix: '/uploads/',
  });

  // WebSocket
  await fastify.register(fastifyWebsocket);
}

// Register routes
async function registerRoutes() {
  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(attendanceRoutes, { prefix: '/api/attendance' });
  await fastify.register(titheRoutes, { prefix: '/api/tithes' });
  await fastify.register(sermonRoutes, { prefix: '/api/sermons' });
  await fastify.register(eventRoutes, { prefix: '/api/events' });
  await fastify.register(bookRoutes, { prefix: '/api/books' });
  await fastify.register(cellGroupRoutes, { prefix: '/api/cell-groups' });
  await fastify.register(projectRoutes, { prefix: '/api/projects' });
  await fastify.register(programRoutes, { prefix: '/api/programs' });
  await fastify.register(weeklyActivityRoutes, { prefix: '/api/weekly-activities' });
  await fastify.register(givingRoutes, { prefix: '/api/giving' });
  await fastify.register(satelliteChurchRoutes, { prefix: '/api/satellite-churches' });
  await fastify.register(adminRoutes, { prefix: '/api/admin' });

  // WebSocket for real-time messaging
  fastify.register(async function (fastify) {
    fastify.get('/ws/messages', { websocket: true }, (connection, _req) => {
      connection.socket.on('message', (message: Buffer) => {
        // Handle incoming messages
        connection.socket.send(JSON.stringify({ echo: message.toString() }));
      });
    });
  });
}

// Error handler
fastify.setErrorHandler(errorHandler);

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');

    // Setup cron jobs
    await setupCronJobs();

    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    console.log(`Server listening on http://${config.server.host}:${config.server.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...');

  try {
    await shutdownJobs();
    await pool.end();
    await fastify.close();
    console.log('Server shut down successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
start();
