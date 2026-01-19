import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('Attempting to connect to Local MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grindmap', {
      serverSelectionTimeoutMS: 2000 // Fail fast if no local DB
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log('⚠️ Local MongoDB not found (' + error.message + '), attempting to start in-memory MongoDB...');
    try {
      console.log('Importing MongoMemoryServer...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      console.log('Creating MongoMemoryServer instance...');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      console.log('InMemory URI:', uri);
      const conn = await mongoose.connect(uri);
      console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host}`);
    } catch (memError) {
      console.error('❌ Database connection failed:', memError);
      import('fs').then(fs => fs.writeFileSync('db_error.log', JSON.stringify(memError, Object.getOwnPropertyNames(memError))));
      throw memError; // Re-throw to startServer catch block
    }
  }
};

export default connectDB;