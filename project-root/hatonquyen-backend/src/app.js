const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const usersRouter = require('./modules/users/users.routes');
const placesRouter = require('./modules/places/places.routes');
const poiPublicRoutes = require('./modules/places/poi-public.routes');
const menuRouter = require('./modules/menu/menu.routes');
const narrationsRouter = require('./modules/narrations/narrations.routes');
const reviewsRouter = require('./modules/reviews/reviews.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const mapsRoutes = require('./modules/maps/maps.routes');
const notFoundHandler = require('./middlewares/not-found.middleware');
const errorHandler = require('./middlewares/error-handler.middleware');

const app = express();

const PORT = process.env.PORT || 5000;
const configuredClientOrigins = String(process.env.CLIENT_URL || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://0.0.0.0:5173',
  ...configuredClientOrigins,
]);

const isLocalDevOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(origin);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  return res.status(200).json({
    message: 'Backend is healthy',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/users', usersRouter);
app.use('/api/places', placesRouter);
app.use('/api/pois', poiPublicRoutes);
app.use('/api/menu', menuRouter);
app.use('/api/narrations', narrationsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/maps', mapsRoutes);

app.use('/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));
app.use('/public', express.static(path.resolve(process.cwd(), 'public')));

app.use(notFoundHandler);
app.use(errorHandler);

let processHandlersAttached = false;

const attachProcessErrorHandlers = () => {
  if (processHandlersAttached) {
    return;
  }

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
  });

  processHandlersAttached = true;
};

const startServer = async () => {
  try {
    attachProcessErrorHandlers();
    await connectDB();

    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: corsOptions,
    });

    app.set('io', io);

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
};
