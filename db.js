const mongoose = require('mongoose');

const defaultUri = 'mongodb://localhost:27017/ShareSense';
const mongoUri = process.env.MONGODB_URI || defaultUri;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
