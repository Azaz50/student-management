const express = require('express');
const router = express.Router();
const User = require('../models/users.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const auth = require('../middleware/auth');
dotenv.config();

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



module.exports = router;