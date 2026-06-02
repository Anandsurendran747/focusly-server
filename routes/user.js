const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const COOKIE_OPTIONS = (isProduction) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
});

const createToken = (userId) =>
    jwt.sign(
        { id: userId, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

const sanitizeUser = (user) => ({
    userId: user._id,
    name: user.name,
    email: user.email,
});

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ message: 'Name, email, and password are required' });

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: 'Email already in use' });

        const user = new User({ name, email, password });
        await user.save();

        const token = createToken(user._id);
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie("token", token, COOKIE_OPTIONS(isProduction));

        return res.status(201).json({ message: 'Registration successful', user: sanitizeUser(user) });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login a user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: 'Email and password are required' });

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password)))
            return res.status(401).json({ message: 'Invalid email or password' });

        const token = createToken(user._id);
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie("token", token, COOKIE_OPTIONS(isProduction));

        return res.status(200).json({ message: 'Login successful', user: sanitizeUser(user) });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;