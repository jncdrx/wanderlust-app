const { randomBytes } = require('crypto');

// In-memory store for CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map();

// Generate CSRF token
const generateCSRFToken = () => {
  return randomBytes(32).toString('hex');
};

// Store CSRF token with expiration (15 minutes)
const storeCSRFToken = (token, userId) => {
  csrfTokens.set(token, {
    userId,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  
  // Clean up expired tokens
  for (const [key, value] of csrfTokens.entries()) {
    if (Date.now() > value.expiresAt) {
      csrfTokens.delete(key);
    }
  }
};

// Verify CSRF token
const verifyCSRFToken = (token, userId) => {
  const stored = csrfTokens.get(token);
  
  if (!stored) {
    return false;
  }
  
  if (Date.now() > stored.expiresAt) {
    csrfTokens.delete(token);
    return false;
  }
  
  if (stored.userId !== userId) {
    return false;
  }
  
  // Delete token after use (one-time use)
  csrfTokens.delete(token);
  return true;
};

// Middleware to generate and send CSRF token
const generateCSRF = (req, res, next) => {
  // Only generate for authenticated users
  if (req.user && req.user.userId) {
    const token = generateCSRFToken();
    storeCSRFToken(token, req.user.userId);
    res.setHeader('X-CSRF-Token', token);
  }
  next();
};

// Middleware to verify CSRF token for state-changing operations
const verifyCSRF = (req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF check for login/register (handled by other means)
  if (req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register')) {
    return next();
  }
  
  // Require user to be authenticated
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = req.headers['x-csrf-token'] || req.body.csrfToken;
  
  if (!token) {
    return res.status(403).json({ error: 'CSRF token required' });
  }
  
  if (!verifyCSRFToken(token, req.user.userId)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
};

module.exports = {
  generateCSRF,
  verifyCSRF,
  generateCSRFToken,
  storeCSRFToken,
  verifyCSRFToken,
};

