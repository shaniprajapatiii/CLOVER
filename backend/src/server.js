require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const { startCronJobs } = require('./services/cronService');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`CLOVER Backend running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    startCronJobs();
  });
}).catch(err => {
  logger.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});
