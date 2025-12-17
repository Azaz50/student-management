const express = require('express');
const app = express();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const auth = require('./middleware/auth');
const userRoutes = require('./routes/users.route');
const studentRoutes = require('./routes/students.route');
const connectDB = require('./config/db');

require('dotenv').config();

/* ------------------- CORS (FIRST) ------------------- */
app.use(cors({
  origin: 'https://peaceful-boba-169bf7.netlify.app',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors());

/* ------------------- SECURITY ------------------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

/* ------------------- RATE LIMIT ------------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

/* ------------------- BODY PARSER ------------------- */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/* ------------------- STATIC ------------------- */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ------------------- DB MIDDLEWARE ------------------- */
const ensureDbConnected = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({ message: 'DB Connection Failed' });
  }
};

/* ------------------- ROUTES ------------------- */
app.get('/', (req, res) => {
  res.send('Welcome to the Student Management API!');
});

app.use('/api/users', ensureDbConnected, userRoutes);
app.use('/api/students', ensureDbConnected, auth, studentRoutes);

/* ------------------- MULTER ERROR HANDLER ------------------- */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(500).json({ message: err.message });
  }
  next();
});

module.exports = app;
