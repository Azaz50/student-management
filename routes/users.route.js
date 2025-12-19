const express = require('express');
const router = express.Router();
const User = require('../models/users.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const auth = require('../middleware/auth');
dotenv.config();
const multer = require('multer');
const nodemailer = require('nodemailer')



router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });
        const savedUser = await newUser.save();
        res.json(savedUser)
        // res.status(201).json({ message: 'User registered successfully', user: savedUser });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message});
    }
}); 

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        const token = jwt.sign(
            { userId: user._id, username: user.username },
             process.env.JWT_SECRET, 
             { expiresIn: '1h' }
            );
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message});
    }
})

// profile update and get routes

router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.token.userId).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

router.put('/profile', auth, async (req, res) => {
    try {
        const { username, email } = req.body;

        // Check for uniqueness
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
            _id: { $ne: req.token.userId }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already in use' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.token.userId,
            { username, email },
            { new: true }
        ).select('-password');
        const token = jwt.sign(
            { userId: updatedUser._id, username: updatedUser.username },
             process.env.JWT_SECRET,
             { expiresIn: '1h' }
            );
        res.json({ updatedUser, token });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.token.userId);

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Invalid current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.token.userId, { password: hashedPassword });

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

router.post('/logout', async (req, res) => {
    try {
        res.clearCookie('token');
        res.json({ message: 'Logout successful' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message});
    }
});

// #################################### send email ###########################
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB (adjust if needed)
  }
});

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.PASS
  }
});

router.post('/send-email', upload.single('file'), async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    const mailOptions = {
      from: `"Azaz Mohammad" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    // attach file if uploaded
    if (req.file) {
      mailOptions.attachments = [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
        }
      ];
    }

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});


module.exports = router;