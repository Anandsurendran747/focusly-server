const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db/connect');
const userRoutes = require('./routes/user');
const todoRoutes = require('./routes/todo');
const bookRoutes = require('./routes/book');
const lessonRoutes = require('./routes/lession');
const scheduleRoutes = require('./routes/schedule');
const fcmTokenRoutes = require('./routes/token');
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const { default: checkSchedules } = require('./services/scheduleChecker');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cookieParser());
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
  credentials: true,
  origin: allowedOrigins
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  })
);

// Connect to MongoDB
connectDB();

// Schedule Checker Service
checkSchedules(); // Start the schedule checker service

// Routes
app.use('/users', userRoutes);
app.use('/todos', todoRoutes);
app.use('/books', bookRoutes);
app.use('/lessons', lessonRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/tokens', fcmTokenRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});