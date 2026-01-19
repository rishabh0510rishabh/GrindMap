import mongoose from 'mongoose';
import Logger from '../utils/logger.js';
import dbManager from '../utils/databaseManager.js';

const connectDB = async () => {
  try {
    await dbManager.connect();
    console.log('✅ MongoDB Connected:', mongoose.connection.host);
  } catch (error) {
    Logger.error('Database connection failed', { error: error.message });
    process.exit(1);
  }
};

export default connectDB;