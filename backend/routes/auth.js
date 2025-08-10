const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { loginLimiter, registerLimiter } = require('../middleware/security');
const authService = require('../services/authService');

router.post('/auth/login', loginLimiter, asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const result = await authService.login(username, password);
  res.json(result);
}));

router.post('/auth/register', registerLimiter, asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}));

// Local auth middleware (modular)
const authenticateUser = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.substring(7);
  const decoded = await authService.verifyToken(token);
  const user = await authService.getUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token - user not found' });
  }
  req.user = user;
  next();
});

router.get('/auth/me', authenticateUser, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

router.post('/auth/logout', authenticateUser, asyncHandler(async (req, res) => {
  await authService.revokeAllTokens(req.user.id);
  res.json({ success: true, message: 'Logged out successfully' });
}));

module.exports = router;
