const express = require('express');
const app = express();
const mongoose = require('mongoose');
const { MulterError } = require('multer');
const auth = require('./middleware/auth.js'); // for jwt authentication
const userRoutes = require('./routes/users.route.js'); // for jwt authentication
const cors = require('cors')
const path = require('path')


const studentRoutes = require('./routes/students.route.js');

const connectDB = require('./config/db.js');
require('dotenv').config();

// Database Connection
// connectDB(); // Removed from here

const ensureDbConnected = async (req, res, next) => {
  try {
    await connectDB();
    return next();
  } catch (error) {
    console.error('Failed to connect to database on request:', error);
    return res.status(500).json({ message: 'Internal Server Error: Could not connect to database.' });
  }
};

app.use(cors({
  origin: "*"
}));


app.use('/uploads', express.static(path.join(__dirname,'uploads'), {
    setHeaders: (res, path, stat) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}))
// Middleware to parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: false }));
// Middleware to parse JSON bodies (as sent by API clients)
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Student Management API!');
});

// API routes for students
// All routes defined in studentRoutes will be prefixed with /api/students
// API routes for users
// All routes defined in userRoutes will be prefixed with /api/users
app.use('/api/users', ensureDbConnected, userRoutes)
app.use('/api/students', ensureDbConnected, auth, studentRoutes);

// this middleware auto run on every api route of related to Multer error so image upload take multer help thats why image error give here (error handling)
app.use((error, req, res, next) => {
   if (error instanceof MulterError) {
    return res.status(400).send(`Image Error: ${error.message} : ${error.code}`);
   }else if (error) {
    return res.status(500).send(`Something went wrong: ${error.message}`)
   }
   next(); // if no error go to next route
})

// app.listen(3000, () => {
//     console.log("Server running on port 3000");
// });

module.exports = app;