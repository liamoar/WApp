const mongoose = require('mongoose');
const app = require('./app');
const { PORT, MONGODB_URI } = require('./config');
const logger = require('./config/logger');

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('✅ MongoDB connected successfully');
  
  // Start server only after DB connected
  app.listen(PORT, () => {
    logger.info(`🚀 Server started on port ${PORT}`);
  });
})
.catch((err) => {
  logger.error('❌ MongoDB connection error:', err);
  process.exit(1); // Exit on DB connection failure
});
