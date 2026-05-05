const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/hatonquyen';

const MONGOOSE_READY_STATE = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
};

let listenersAttached = false;
let shutdownHandlersAttached = false;

const closeMongoConnection = async () => {
  if (mongoose.connection.readyState === MONGOOSE_READY_STATE.DISCONNECTED) {
    return;
  }

  await mongoose.connection.close();
};

const attachShutdownHandlers = () => {
  if (shutdownHandlersAttached) {
    return;
  }

  const shutdown = async (signal) => {
    try {
      await closeMongoConnection();
      console.log(`MongoDB connection closed on ${signal}`);
      process.exit(0);
    } catch (error) {
      console.error(`Failed to close MongoDB connection on ${signal}:`, error.message);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });

  shutdownHandlersAttached = true;
};

const attachConnectionListeners = () => {
  if (listenersAttached) {
    return;
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  attachShutdownHandlers();

  listenersAttached = true;
};

const connectDB = async () => {
  if (mongoose.connection.readyState === MONGOOSE_READY_STATE.CONNECTED) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === MONGOOSE_READY_STATE.CONNECTING) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  await mongoose.connect(mongoUri);
  attachConnectionListeners();

  return mongoose.connection;
};

module.exports = connectDB;
